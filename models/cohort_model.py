#!/usr/bin/env python3
"""
Aeris cohort economics model (commercial phase, AFTER the pilot passes its gates).

Tracks each month's signups as a separate cohort through activation, free usage,
paid conversion, monthly churn, annual renewal, refunds, payment fees and AI
cost with a heavy-user tail. Standard library only.

  python3 models/cohort_model.py              # prints the tables used in docs/11
  python3 models/cohort_model.py --markdown   # same, as markdown
"""
import argparse
import json
import math
import pathlib

A = json.loads((pathlib.Path(__file__).parent / "assumptions.json").read_text())


def net_of_fees(price):
    pct = A["card_fee_pct"] + A["stripe_billing_pct"] + A["international_share"] * A["international_surcharge_pct"]
    return price * (1 - pct) - A["card_fee_fixed_usd"]


def paid_sessions_mean():
    """Mean of a lognormal (median, p90) capped at the fair-use limit, by numerical integration."""
    med, p90, cap = A["paid_sessions_median"], A["paid_sessions_p90"], A["paid_fair_use_cap_per_month"]
    mu, sigma = math.log(med), math.log(p90 / med) / 1.2815515655446004
    steps, total = 20000, 0.0
    for i in range(1, steps):
        q = i / steps
        # inverse normal CDF via Acklam-style rational approximation is overkill; use bisection on erf
        lo, hi = -10.0, 10.0
        for _ in range(60):
            mid = (lo + hi) / 2
            if 0.5 * (1 + math.erf(mid / math.sqrt(2))) < q:
                lo = mid
            else:
                hi = mid
        total += min(cap, math.exp(mu + sigma * lo))
    return total / (steps - 1)


def quantile_sessions(q):
    med, p90 = A["paid_sessions_median"], A["paid_sessions_p90"]
    mu, sigma = math.log(med), math.log(p90 / med) / 1.2815515655446004
    lo, hi = -10.0, 10.0
    for _ in range(60):
        mid = (lo + hi) / 2
        if 0.5 * (1 + math.erf(mid / math.sqrt(2))) < q:
            lo = mid
        else:
            hi = mid
    return min(A["paid_fair_use_cap_per_month"], math.exp(mu + sigma * lo))


def free_active_share(age):
    s = A["free_active_share_by_month_since_signup"]
    if age < len(s):
        return s[age]
    return s[-1] * A["free_active_monthly_decay_after"] ** (age - len(s) + 1)


def simulate(sc):
    months = A["months"]
    fixed = sum(A["fixed_costs_monthly_usd"].values())
    founder = A["founder_hours_per_month"] * A["founder_hourly_value_usd"]
    paid_mean = paid_sessions_mean()
    monthly_subs = [0.0] * months     # active monthly-plan subscribers at end of month
    annual_cohorts = {}               # start month -> active annual subscribers
    rows, cash = [], 0.0
    new_paid_by_month = [0.0] * (months + 3)
    for m in range(months):
        activated = sc["signups_per_month"] * sc["activation"]
        for lag, share in enumerate(A["conversion_timing_by_month_since_signup"]):
            new_paid_by_month[m + lag] += activated * sc["paid_conversion_of_activated"] * share

    prev_monthly = 0.0
    for m in range(months):
        new_paid = new_paid_by_month[m]
        new_monthly = new_paid * (1 - A["plan_mix_annual"])
        new_annual = new_paid * A["plan_mix_annual"]
        retained_monthly = prev_monthly * (1 - A["monthly_plan_churn"])
        monthly_now = retained_monthly + new_monthly
        annual_cohorts[m] = new_annual
        renewing = 0.0
        for start in list(annual_cohorts):
            if start < m and (m - start) % 12 == 0:
                annual_cohorts[start] *= A["annual_renewal_rate"]
                renewing += annual_cohorts[start]
        annual_active = sum(annual_cohorts.values())

        revenue = (monthly_now * net_of_fees(A["price_monthly_usd"])
                   + (new_annual + renewing) * net_of_fees(A["price_annual_usd"]))
        refunds = A["refund_rate_first_payment"] * (new_monthly * A["price_monthly_usd"] + new_annual * A["price_annual_usd"])
        free_active = sum(sc["signups_per_month"] * sc["activation"] * free_active_share(m - s) for s in range(m + 1))
        paying = monthly_now + annual_active
        ai_cost = A["ai_cost_per_session_usd"] * (
            free_active * min(A["free_sessions_cap_per_month"], A["free_sessions_mean_when_active"])
            + paying * A["paid_active_share"] * paid_mean)
        operating = revenue - refunds - ai_cost - fixed
        cash += operating
        rows.append(dict(month=m + 1, paying=paying, free_active=free_active, revenue=revenue - refunds,
                         ai=ai_cost, fixed=fixed, operating=operating, after_founder=operating - founder, cash=cash))
        prev_monthly = monthly_now
    return rows


def break_even():
    fixed = sum(A["fixed_costs_monthly_usd"].values())
    founder = A["founder_hours_per_month"] * A["founder_hourly_value_usd"]
    per_sub = (A["plan_mix_annual"] * net_of_fees(A["price_annual_usd"]) / 12
               + (1 - A["plan_mix_annual"]) * net_of_fees(A["price_monthly_usd"])
               - A["paid_active_share"] * paid_sessions_mean() * A["ai_cost_per_session_usd"])
    return per_sub, math.ceil(fixed / per_sub), math.ceil((fixed + founder) / per_sub)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--markdown", action="store_true")
    ap.parse_args()
    per_sub, be_ops, be_founder = break_even()
    annual_monthly_net = net_of_fees(A["price_annual_usd"]) / 12
    print("## Unit economics per paying subscriber per month\n")
    print("| Item | Value |\n|---|---:|")
    print(f"| Monthly plan, net of fees | ${net_of_fees(A['price_monthly_usd']):.2f} |")
    print(f"| Annual plan, net of fees, per month | ${annual_monthly_net:.2f} |")
    print(f"| Mean AI sessions per paying user per month (capped lognormal) | {paid_sessions_mean():.1f} |")
    print(f"| Blended contribution after AI cost | ${per_sub:.2f} |")
    print(f"| Fixed costs per month | ${sum(A['fixed_costs_monthly_usd'].values()):.0f} |")
    print(f"| Subscribers to cover fixed costs | **{be_ops}** |")
    print(f"| Subscribers to also pay founder time ({A['founder_hours_per_month']} h at ${A['founder_hourly_value_usd']}/h) | **{be_founder}** |")

    life = ((1 - A["plan_mix_annual"]) / A["monthly_plan_churn"]
            + A["plan_mix_annual"] * 12 / (1 - A["annual_renewal_rate"]))
    print(f"| Average paid lifetime, months (blended monthly churn and annual renewal) | {life:.1f} |")
    print("\n## Signups needed per month to break even at steady state\n")
    print("Steady-state paying subscribers = new paying per month x average paid lifetime. "
          "Reaching steady state takes roughly one lifetime.\n")
    print("| Activation x conversion | Signups/month to cover fixed costs | ...and founder time |\n|---|---:|---:|")
    for name, sc in A["scenarios"].items():
        rate = sc["activation"] * sc["paid_conversion_of_activated"]
        print(f"| {name}: {sc['activation']:.0%} x {sc['paid_conversion_of_activated']:.1%} = {rate:.2%} | "
              f"{math.ceil(be_ops / life / rate):,} | {math.ceil(be_founder / life / rate):,} |")
    print("\n## Heavy-user tail (does the top user lose money?)\n")
    print("| User percentile | Sessions/month | AI cost/month | Annual-plan net/month | Margin |\n|---|---:|---:|---:|---:|")
    for q in (0.5, 0.9, 0.99, 0.999):
        s = quantile_sessions(q)
        c = s * A["ai_cost_per_session_usd"]
        print(f"| p{q * 100:g} | {s:.0f} | ${c:.2f} | ${annual_monthly_net:.2f} | ${annual_monthly_net - c:.2f} |")
    cap_cost = A["paid_fair_use_cap_per_month"] * 0.042
    print(f"\nAt the fair-use cap of {A['paid_fair_use_cap_per_month']} sessions with cold caches (${0.042}/session) "
          f"a user costs ${cap_cost:.2f}/month against ${annual_monthly_net:.2f} net. "
          f"The v1 per-user cap of $0.60/day allowed $18/month.")

    print("\n## Scenarios (commercial phase, months after paid launch)\n")
    print("| Scenario | Signups/mo | Activation | Paid conv. | Paying at m12 | Paying at m24 | Op. profit m24/mo | Cumulative cash m24 | After founder time m24/mo |")
    print("|---|---:|---:|---:|---:|---:|---:|---:|---:|")
    for name, sc in A["scenarios"].items():
        rows = simulate(sc)
        r12, r24 = rows[11], rows[23]
        print(f"| {name} | {sc['signups_per_month']} | {sc['activation']:.0%} | {sc['paid_conversion_of_activated']:.1%} | "
              f"{r12['paying']:.0f} | {r24['paying']:.0f} | ${r24['operating']:,.0f} | ${r24['cash']:,.0f} | ${r24['after_founder']:,.0f} |")

    print("\n## Base scenario, month by month (first 12)\n")
    print("| Month | Paying | Free active | Net revenue | AI cost | Fixed | Operating | Cumulative |")
    print("|---:|---:|---:|---:|---:|---:|---:|---:|")
    for r in simulate(A["scenarios"]["base"])[:12]:
        print(f"| {r['month']} | {r['paying']:.0f} | {r['free_active']:.0f} | ${r['revenue']:,.0f} | ${r['ai']:,.0f} | "
              f"${r['fixed']:,.0f} | ${r['operating']:,.0f} | ${r['cash']:,.0f} |")


if __name__ == "__main__":
    main()
