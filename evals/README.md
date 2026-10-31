# Evals

| Script | What it tests | Needs an API key? |
|---|---|---|
| `classifier_eval.py` | Whether the input screen routes risky text correctly; exact 95% intervals; dev vs held-out split | Only with `--screen keyword+claude` |
| `model_bakeoff.py` | AI-arm generator candidates: safety gate, validity, visible latency, cost, blind review file | Yes |
| `stats.py` | Exact binomial bounds and minimum case counts | No |
| `safety_text.py` | Python twin of the app's text rules (reads `src/safety/*.json`) | No |
| `tests/test_bakeoff_offline.py` | The bake-off harness itself, with a fake streaming client | No |

**The shipped cases (`cases/safety_cases.jsonl`, 39 cases) are author-written and contaminated.** They test the tooling, not safety. Keyword phrases were added after the "held-out" cases had been seen, and the bake-off's missed-risk cases are rewordings of them. Nothing here is truly held out (E-SAF-05).

The real evaluation is experiment E5 ([docs/07](../docs/07-safety-spec.md) §6). It needs at least 20 crisis cases **per crisis route** (100 total) plus 100 ordinary-worry cases. They must be written independently, labelled by the qualified reviewer, and never seen by whoever edits the rules.

**Scoring is exact.** A crisis case passes only with the expected route **and** every resource it requires. `--parity` checks that Python and TypeScript agree on keywords, output validation and routing (101 checks).

Selection rules for each script's results are fixed in advance in [docs/09](../docs/09-ai-and-models.md) §4 and [docs/07](../docs/07-safety-spec.md) §6.

Results go to `evals/results/`, which is git-ignored. Never put real user text in a case file.
