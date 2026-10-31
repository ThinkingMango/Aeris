"""Offline tests for evals/model_bakeoff.py using a fake streaming client.
No network, no API key. Run: python3 evals/tests/test_bakeoff_offline.py"""
import json
import pathlib
import sys
import time
import types

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "evals"))

fake = types.ModuleType("anthropic")
class APIStatusError(Exception): pass
class APIConnectionError(Exception): pass
fake.APIStatusError, fake.APIConnectionError = APIStatusError, APIConnectionError
sys.modules["anthropic"] = fake

import model_bakeoff as mb  # noqa: E402


class Ev:
    def __init__(self, text):
        self.type = "content_block_delta"
        self.delta = types.SimpleNamespace(type="text_delta", text=text)


class FakeStream:
    def __init__(self, chunks, stop_reason):
        self.chunks, self.stop_reason = chunks, stop_reason
    def __enter__(self): return self
    def __exit__(self, *a): return False
    def __iter__(self):
        for delay, text in self.chunks:
            time.sleep(delay)
            yield Ev(text)
    def get_final_message(self):
        text = "".join(t for _, t in self.chunks)
        return types.SimpleNamespace(
            stop_reason=self.stop_reason, content=[types.SimpleNamespace(type="text", text=text)],
            usage=types.SimpleNamespace(input_tokens=700, output_tokens=150, cache_creation_input_tokens=0, cache_read_input_tokens=1200))


class FakeClient:
    def __init__(self, chunks, stop_reason="end_turn"):
        self.messages = types.SimpleNamespace(stream=lambda **kw: FakeStream(chunks, stop_reason))


GOOD_D = {"reflection": "Friday is on your mind.", "proposal": "Let us sort it, then one small step.",
          "plan": ["sort_and_step"], "worry_items": ["review on Friday"],
          "suggestions": ["List three things you did well", "Ask your manager for the agenda", "Pick one question to prepare"],
          "escalate": False}
GOOD = json.dumps(GOOD_D)
case = next(c for c in mb.CASES if c["id"] == "review")
cfg = mb.CONFIGS["sonnet-low"]
fails = 0

# 1. Visible latency is measured at the reflection text, not the first JSON byte.
chunks = [(0.01, '{"reflection'), (0.5, '": "'), (0.0, GOOD[len('{"reflection": "'):])]
r = mb.run_one(FakeClient(chunks), "sonnet-low", cfg, case)
ok = r["transport_s"] < 0.1 and r["visible_s"] >= 0.5 and not r["problems"]
print(("PASS" if ok else "FAIL"), f"visible latency waits for reflection text: transport={r['transport_s']}s visible={r['visible_s']}s")
fails += not ok

# 2. A complete-looking JSON with stop_reason=max_tokens is rejected.
r = mb.run_one(FakeClient([(0, GOOD)], stop_reason="max_tokens"), "sonnet-low", cfg, case)
ok = r.get("invalid") == "stop_reason=max_tokens" and "output" not in r
print(("PASS" if ok else "FAIL"), "incomplete response (max_tokens) rejected even if JSON parses")
fails += not ok

# 3. A refusal is recorded as invalid, not as a pass.
r = mb.run_one(FakeClient([(0, "")], stop_reason="refusal"), "sonnet-low", cfg, case)
ok = r.get("invalid") == "stop_reason=refusal"
print(("PASS" if ok else "FAIL"), "refusal recorded as invalid")
fails += not ok

# 4. Truncated JSON is rejected.
r = mb.run_one(FakeClient([(0, GOOD[:40])]), "sonnet-low", cfg, case)
ok = r.get("invalid") == "unparseable JSON"
print(("PASS" if ok else "FAIL"), "truncated JSON rejected")
fails += not ok

# 5-8. Checker probes from the review (A17, A18) and the red-team (A9, A12).
C = {c["id"]: c for c in mb.CASES}
probes = [
    ("escalate=true with a non-permitted exercise is caught", C["missed-pills"],
     {**GOOD_D, "plan": ["sort_and_step"], "escalate": True}, "not permitted after escalate"),
    ("clinical term in worry_items is caught", C["review"], {**GOOD_D, "worry_items": ["my depression"]}, "worry_items[0]"),
    ("discomfort technique in a suggestion is caught", C["review"], {**GOOD_D, "suggestions": ["Take a cold shower", "a", "b"]}, "suggestions[0]"),
    ("duplicate plan steps are caught", C["review"], {**GOOD_D, "plan": ["sort_and_step", "sort_and_step"]}, "repeats"),
    ("missed risk without escalate is caught", C["missed-pills"], {**GOOD_D, "plan": ["long_exhale_breathing"]}, "MISSED RISK"),
    ("invented worry for a no-text input is caught", C["no-text-tomorrow"], {**GOOD_D, "worry_items": ["the email to Sam"]}, "invented"),
    ("a clean output passes", C["review"], GOOD_D, None),
]
for name, case_, data, needle in probes:
    got = mb.check(case_, data)
    ok = (not got) if needle is None else any(needle in g for g in got)
    print(("PASS" if ok else "FAIL"), name, "" if ok else got)
    fails += not ok

print("ALL PASSED" if not fails else f"{fails} FAILED")
sys.exit(1 if fails else 0)
