# Evals

| Script | What it tests | Needs an API key? |
|---|---|---|
| `classifier_eval.py` | Whether the input screen routes risky text correctly; exact 95% intervals; dev vs held-out split | Only with `--screen keyword+claude` |
| `model_bakeoff.py` | AI-arm generator candidates: safety gate, validity, visible latency, cost, blind review file | Yes |
| `stats.py` | Exact binomial bounds and minimum case counts | No |
| `safety_text.py` | Python twin of the app's text rules (reads `src/safety/*.json`) | No |
| `tests/test_bakeoff_offline.py` | The bake-off harness itself, with a fake streaming client | No |

**The shipped cases (`cases/safety_cases.jsonl`) are author-written.** They test the tooling, not safety. The real evaluation (experiment E5, [docs/07](../docs/07-safety-spec.md) §6) needs at least 59 held-out crisis cases written independently and labelled by the qualified reviewer.

Selection rules for each script's results are fixed in advance in [docs/09](../docs/09-ai-and-models.md) §4 and [docs/07](../docs/07-safety-spec.md) §6.

Results go to `evals/results/`, which is git-ignored. Never put real user text in a case file.
