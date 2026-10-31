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
import functools
import json
import math
import pathlib

A = json.loads((pathlib.Path(__file__).parent / "assumptions.json").read_text())


def net_of_fees(price):
    pct = A["card_fee_pct"] + A["stripe_billing_pct"] + A["international_share"] * A["international_surcharge_pct"]
    return price * (1 - pct) - A["card_fee_fixed_usd"]


@functools.lru_cache(maxsize=None)
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


def simulate(sc, months=None, cac=0.0):
    months = months or A["months"]
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
    free_cum = 0.0
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
        free_cum += sc["signups_per_month"] * sc["activation"] * free_active_share(m)
        free_active = free_cum
        paying = monthly_now + annual_active
        ai_cost = A["ai_cost_per_session_usd"] * (
            free_active * min(A["free_sessions_cap_per_month"], A["free_sessions_mean_when_active"])
            + paying * A["paid_active_share"] * paid_mean)
        acquisition = sc["signups_per_month"] * cac
        operating = revenue - refunds - ai_cost - fixed - acquisition
        cash += operating
        rows.append(dict(month=m + 1, paying=paying, free_active=free_active, revenue=revenue - refunds,
                         ai=ai_cost, fixed=fixed, acquisition=acquisition, operating=operating, after_founder=operating - founder, cash=cash))
        prev_monthly = monthly_now
    return rows


def lifetime_months():
    return ((1 - A["plan_mix_annual"]) / A["monthly_plan_churn"]
            + A["plan_mix_annual"] * 12 / (1 - A["annual_renewal_rate"]))


def steady_state_contribution():
    """Contribution per paying subscriber per month using the STEADY-STATE plan mix
    (annual subscribers stay longer, so they are a larger share of the base than of new sales)."""
    monthly_life = (1 - A["plan_mix_annual"]) / A["monthly_plan_churn"]
    annual_life = A["plan_mix_annual"] * 12 / (1 - A["annual_renewal_rate"])
    annual_share = annual_life / (monthly_life + annual_life)
    rev = annual_share * net_of_fees(A["price_annual_usd"]) / 12 + (1 - annual_share) * net_of_fees(A["price_monthly_usd"])
    return rev - A["paid_active_share"] * paid_sessions_mean() * A["ai_cost_per_session_usd"], annual_share


def steady_operating(signups, sc, cac=0.0, founder=False, months=240):
    s = dict(sc, signups_per_month=signups)
    op = simulate(s, months=months, cac=cac)[-1]["operating"]
    return op - (A["founder_hours_per_month"] * A["founder_hourly_value_usd"] if founder else 0)


def break_even_signups(sc, cac=0.0, founder=False):
    """Smallest signups/month whose steady-state monthly operating result is >= 0 (from the simulation itself)."""
    lo, hi = 0.0, 1.0
    while steady_operating(hi, sc, cac, founder) < 0:
        hi *= 2
        if hi > 1e7:
            return None  # never breaks even: each signup loses money
    for _ in range(50):
        mid = (lo + hi) / 2
        if steady_operating(mid, sc, cac, founder) >= 0:
            hi = mid
        else:
            lo = mid
    return math.ceil(hi)


def lifetime_value_per_signup(sc):
    contrib, _ = steady_state_contribution()
    refund_loss = A["refund_rate_first_payment"] * (A["plan_mix_annual"] * A["price_annual_usd"] + (1 - A["plan_mix_annual"]) * A["price_monthly_usd"])
    per_paying = contrib * lifetime_months() - refund_loss
    return per_paying, per_paying * sc["activation"] * sc["paid_conversion_of_activated"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--markdown", action="store_true")
    ap.parse_args()
    contrib, annual_share = steady_state_contribution()
    fixed = sum(A["fixed_costs_monthly_usd"].values())
    founder = A["founder_hours_per_month"] * A["founder_hourly_value_usd"]
    annual_monthly_net = net_of_fees(A["price_annual_usd"]) / 12
    print("## Unit economics per paying subscriber per month\n")
    print("| Item | Value |\n|---|---:|")
    print(f"| Monthly plan, net of fees | ${net_of_fees(A['price_monthly_usd']):.2f} |")
    print(f"| Annual plan, net of fees, per month | ${annual_monthly_net:.2f} |")
    print(f"| Annual share of NEW subscribers / of the steady-state BASE | {A['plan_mix_annual']:.0%} / {annual_share:.0%} |")
    print(f"| Mean AI sessions per paying user per month (capped lognormal) | {paid_sessions_mean():.1f} |")
    print(f"| Contribution per subscriber at steady state, after fees and AI | ${contrib:.2f} |")
    print(f"| Average paid lifetime, months | {lifetime_months():.1f} |")
    print(f"| Fixed costs per month | ${fixed:.0f} |")
    print(f"| Founder time, if paid ({A['founder_hours_per_month']} h at ${A['founder_hourly_value_usd']}/h) | ${founder:.0f} |")

    print("\n## Lifetime value and the most you can pay for a signup\n")
    print("| Scenario | Lifetime contribution per paying subscriber | Per signup (x activation x conversion) |\n|---|---:|---:|")
    for name, sc in A["scenarios"].items():
        per_paying, per_signup = lifetime_value_per_signup(sc)
        print(f"| {name} | ${per_paying:.2f} | **${per_signup:.2f}** |")
    print("\nPaying more than the per-signup figure to acquire a user loses money on every signup, before fixed costs.")

    print("\n## Signups needed per month to break even (from the simulation, steady state)\n")
    print("Solved by running the cohort simulation for 240 months and finding the smallest signup rate with a non-negative "
          "monthly result. Includes refunds, free-user AI cost and acquisition spend. Reaching steady state takes years.\n")
    head = " | ".join(f"CAC ${c:g}" for c in A["cac_per_signup_usd_options"])
    print(f"| Scenario | Covers | {head} |\n|---|---|" + "---:|" * len(A["cac_per_signup_usd_options"]))
    for name, sc in A["scenarios"].items():
        for label, f in (("fixed costs", False), ("+ founder time", True)):
            cells = []
            for c in A["cac_per_signup_usd_options"]:
                v = break_even_signups(sc, cac=c, founder=f)
                cells.append("never" if v is None else f"{v:,}")
            print(f"| {name} | {label} | " + " | ".join(cells) + " |")

    print("\n## Heavy-user tail (does the top user lose money?)\n")
    print("| User percentile | Sessions/month | AI cost/month | Annual-plan net/month | Margin |\n|---|---:|---:|---:|---:|")
    for q in (0.5, 0.9, 0.99, 0.999):
        s = quantile_sessions(q)
        c = s * A["ai_cost_per_session_usd"]
        print(f"| p{q * 100:g} | {s:.0f} | ${c:.2f} | ${annual_monthly_net:.2f} | ${annual_monthly_net - c:.2f} |")
    cap_cost = A["paid_fair_use_cap_per_month"] * A["ai_cost_per_session_usd"]
    print(f"\nAt the fair-use cap of {A['paid_fair_use_cap_per_month']} sessions a user costs ${cap_cost:.2f}/month in AI "
          f"against ${annual_monthly_net:.2f} net on the annual plan. The v1 per-user cap of $0.60/day allowed $18/month.")

    print("\n## Scenarios at zero acquisition cost (commercial phase, months after paid launch)\n")
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
