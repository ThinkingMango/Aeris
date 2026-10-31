# Evals

## `model_bakeoff.py` — which model writes Aeris's words best?

Runs the "read the moment" step from `docs/08-ai-architecture.md` on 24 test inputs across four model settings (Opus 5.5 low, Sonnet 5.5 low, Sonnet 5.5 thinking-off, Haiku 5.5 low). It reports:

- **Rule checks** for each output: plan length, 60-word limit, banned clinical or harmful phrases, elevated cases start with `check_in`, physical-symptom cases start with `physical_notice`, missed-risk cases set `escalate`.
- **Speed**: time to first word, median and 95th percentile.
- **Cost** per call from the API's own token counts.
- **A blind review file** that shuffles the four outputs for each input as A, B, C, D, so you judge tone without knowing which model wrote it.

It is the Day 18 step in `docs/12-thirty-day-plan.md`. Why it matters, and the decision rules to apply to its results, are in `docs/15-model-deep-dive-effectiveness-efficiency.md`.

### How to run it

Ask Claude Code: *"Run evals/model_bakeoff.py. My API key is already set in the environment."* Or run it yourself:

```bash
pip install anthropic
```

```bash
export ANTHROPIC_API_KEY=your-key-here
```

```bash
python evals/model_bakeoff.py
```

It prints the number of calls and an estimated cost first, and asks before sending anything. A full run is 96 calls and costs roughly one to two US dollars.

### After it runs

1. Open `evals/results/blind-review-<time>.md` and rank A to D for each case. Do not open the key file yet.
2. Open `evals/results/blind-key-<time>.md` and count which model you ranked first most often.
3. Apply the decision rules in docs/15 §7.

Results are git-ignored because they may contain test text you wrote. Never put real user conversations in this file.
