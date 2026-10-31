"""Exact binomial (Clopper-Pearson) bounds with the standard library only."""
import math


def _binom_cdf(k: int, n: int, p: float) -> float:
    if p <= 0:
        return 1.0
    if p >= 1:
        return 1.0 if k >= n else 0.0
    total = 0.0
    for i in range(0, k + 1):
        total += math.exp(math.lgamma(n + 1) - math.lgamma(i + 1) - math.lgamma(n - i + 1)
                          + i * math.log(p) + (n - i) * math.log(1 - p))
    return min(1.0, total)


def upper_bound(failures: int, n: int, alpha: float = 0.05) -> float:
    """One-sided (1-alpha) upper bound on a failure rate after `failures` of `n`."""
    if n == 0:
        return 1.0
    if failures >= n:
        return 1.0
    lo, hi = failures / n, 1.0
    for _ in range(80):
        mid = (lo + hi) / 2
        if _binom_cdf(failures, n, mid) > alpha:
            lo = mid
        else:
            hi = mid
    return hi


def two_sided(successes: int, n: int, alpha: float = 0.05) -> tuple[float, float]:
    """Two-sided exact interval for a proportion."""
    if n == 0:
        return (0.0, 1.0)
    lower = 0.0 if successes == 0 else 1 - upper_bound(n - successes, n, alpha / 2)
    upper = 1.0 if successes == n else upper_bound(successes, n, alpha / 2)
    return (lower, upper)


def n_for_zero_failure_bound(target: float, alpha: float = 0.05) -> int:
    """Independent, representative cases needed, all passing, to claim rate < target."""
    return math.ceil(math.log(alpha) / math.log(1 - target))


def preference_threshold(n: int, alpha: float = 0.05) -> int:
    """Smallest k such that k or more of n preferring one arm rejects 'no preference' (exact, two-sided)."""
    for k in range(n // 2 + 1, n + 1):
        if 2 * (1 - _binom_cdf(k - 1, n, 0.5)) <= alpha:
            return k
    return n + 1


def power(n: int, true_p: float, alpha: float = 0.05) -> float:
    """Chance of reaching the threshold when the true preference is true_p."""
    return 1 - _binom_cdf(preference_threshold(n, alpha) - 1, n, true_p)


if __name__ == "__main__":
    print(f"0 misses in 15  -> 95% upper bound on miss rate: {upper_bound(0, 15):.1%}")
    for t in (0.10, 0.05, 0.02, 0.01):
        print(f"to claim miss rate < {t:.0%} with 0 misses you need n >= {n_for_zero_failure_bound(t)}")
    print()
    for n in (40, 35, 30):
        print(f"crossover preference, {n} completers: need >= {preference_threshold(n)} preferring one arm (exact two-sided, alpha 0.05)")
    for p in (0.60, 0.70, 0.75):
        print(f"power with 40 completers if the true preference is {p:.0%}: {power(40, p):.0%}")
