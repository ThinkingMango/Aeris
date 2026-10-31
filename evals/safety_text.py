"""
Python twin of the text and routing rules in src/safety/controller.ts, reading the
same JSON files. `python3 evals/classifier_eval.py --parity` checks the two agree on
keyword screening, output validation and routing, including adversarial inputs.
"""
import json
import pathlib
import re
import unicodedata

ROOT = pathlib.Path(__file__).resolve().parent.parent
KEYWORDS = json.loads((ROOT / "src/safety/crisis_keywords.json").read_text())
BANNED = json.loads((ROOT / "src/safety/banned_output_terms.json").read_text())

ZERO_WIDTH = re.compile("[­͏؜ᅟᅠ឴឵᠎​-‏‪-‮⁠-⁯﻿]")
CONFUSABLES = {"а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "у": "y", "х": "x", "і": "i", "ј": "j", "ѕ": "s", "к": "k",
               "м": "m", "т": "t", "н": "h", "в": "b", "α": "a", "ε": "e", "ο": "o", "ρ": "p", "ι": "i", "κ": "k", "ν": "v",
               "τ": "t", "υ": "u", "χ": "x"}
LEET = {"1": "i", "3": "e", "0": "o", "4": "a", "5": "s", "@": "a", "$": "s", "!": "i"}
APOS = re.compile("['‘’ʼʹ`´]")
WS = re.compile("[\t\n\v\f\r \u001C-\u001F\u0085   -     　﻿]+")


def _base(text: str, leet: bool) -> str:
    t = unicodedata.normalize("NFKD", text)
    t = "".join(ch for ch in t if not unicodedata.category(ch).startswith("M"))
    t = ZERO_WIDTH.sub("", t).lower()
    t = "".join(CONFUSABLES.get(ch, LEET.get(ch, ch) if leet else ch) for ch in t)
    t = APOS.sub("", t)
    t = re.sub(r"[^a-z0-9]+", " ", t)
    return re.sub(r" +", " ", t).strip()


def normalize(text: str) -> str:
    return _base(text, False)


def normalize_leet(text: str) -> str:
    return _base(text, True)


def contains_phrase(normalized: str, phrase: str) -> bool:
    p = normalize(phrase)
    return bool(p) and f" {p} " in f" {normalized} "


def keyword_signals(text: str) -> list[str]:
    forms = [normalize(text), normalize_leet(text)]
    out = []
    for sig, phrases in KEYWORDS.items():
        if sig.startswith("_"):
            continue
        cands = forms[:1] if sig == "minor" else forms
        if any(contains_phrase(f, ph) for ph in phrases for f in cands):
            out.append(sig)
    return out


def banned_terms():
    return [t for k, v in BANNED.items() if not k.startswith("_") for t in v]


LIMITS = {"words": 60, "worry": 140, "suggestion": 80, "closing": 200, "max_worry": 4, "max_suggestions": 3}


def word_count(s: str) -> int:
    return len([w for w in WS.split(s) if w])


def validate_generated(fields: dict) -> list[str]:
    problems, items = [], []
    for k in ("reflection", "proposal", "closing"):
        v = fields.get(k)
        if isinstance(v, str) and v:
            items.append((k, v))
    for i, w in enumerate(fields.get("worry_items") or []):
        items.append((f"worry_items[{i}]", w))
    for i, s in enumerate(fields.get("suggestions") or []):
        items.append((f"suggestions[{i}]", s))
    terms = banned_terms()
    for name, text in items:
        forms = [normalize(text), normalize_leet(text)]
        problems += [f'banned term "{t}" in {name}' for t in terms if any(contains_phrase(n, t) for n in forms)]
        if "!" in unicodedata.normalize("NFKC", text):
            problems.append(f"exclamation mark in {name}")
        if any(s != "physical_symptoms" for s in keyword_signals(text)):
            problems.append(f"crisis language in generated {name}")
    r = fields.get("reflection") if isinstance(fields.get("reflection"), str) else ""
    p = fields.get("proposal") if isinstance(fields.get("proposal"), str) else ""
    words = word_count(f"{r} {p}")
    if words > LIMITS["words"]:
        problems.append(f"{words} words in reflection+proposal (limit {LIMITS['words']})")
    wi = fields.get("worry_items") or []
    if len(wi) > LIMITS["max_worry"]:
        problems.append(f"{len(wi)} worry items (limit {LIMITS['max_worry']})")
    if any(len(w) > LIMITS["worry"] for w in wi):
        problems.append(f"worry item over {LIMITS['worry']} characters")
    sg = fields.get("suggestions") or []
    if len(sg) > LIMITS["max_suggestions"]:
        problems.append(f"{len(sg)} suggestions (limit {LIMITS['max_suggestions']})")
    if any(len(s) > LIMITS["suggestion"] for s in sg):
        problems.append(f"suggestion over {LIMITS['suggestion']} characters")
    c = fields.get("closing")
    if isinstance(c, str) and len(c) > LIMITS["closing"]:
        problems.append(f"closing over {LIMITS['closing']} characters")
    return problems


# ---- routing, mirrored from controller.ts for a single ingest from a fresh session
PRECEDENCE = ["emergency_medical", "crisis_self_harm", "crisis_harm_to_others", "safety_abuse",
              "minor_exit", "restricted", "normal"]
CRISIS = set(PRECEDENCE[:5])
SIGNAL_ROUTE = {
    "self_harm_in_progress": "emergency_medical", "overdose_or_poisoning": "emergency_medical",
    "medical_emergency": "emergency_medical", "self_harm_plan_or_intent": "crisis_self_harm",
    "self_harm_ideation": "crisis_self_harm", "harm_to_others": "crisis_harm_to_others",
    "abuse_or_unsafe_home": "safety_abuse", "minor": "minor_exit", "passive_death_wish": "restricted",
    "substance_use_now": "restricted", "physical_symptoms": "normal", "distress": "normal",
}
SIGNAL_FLAG = {
    "self_harm_in_progress": "emergency", "overdose_or_poisoning": "emergency", "medical_emergency": "emergency",
    "self_harm_plan_or_intent": "self_harm", "self_harm_ideation": "self_harm", "harm_to_others": "harm_to_others",
    "abuse_or_unsafe_home": "abuse", "minor": "minor", "physical_symptoms": "physical",
}


def route_for(signals: list[str], classifier_failed: bool = False, classifier_present: bool = True) -> str:
    routes = [SIGNAL_ROUTE.get(s, "restricted") for s in signals]
    if classifier_failed or not classifier_present:
        routes.append("restricted")
    return min(routes + ["normal"], key=PRECEDENCE.index)


def decision_for(signals: list[str], classifier_failed: bool = False) -> dict:
    """Route, flags, terminal and required resources, as decide(ingest(startSession(), ...)) gives."""
    route = route_for(signals, classifier_failed)
    flags = []
    for s in signals:
        f = SIGNAL_FLAG.get(s)
        if f and f not in flags:
            flags.append(f)
    crisis = route in CRISIS
    res = []
    if route in ("emergency_medical", "crisis_harm_to_others") or "emergency" in flags or "harm_to_others" in flags \
            or (crisis and "physical" in flags):
        res.append("emergency_number")
    if crisis or route == "restricted" or "self_harm" in flags:
        res.append("crisis_line")
    if "abuse" in flags:
        res += ["abuse_line", "quick_exit"]
    if "minor" in flags:
        res.append("youth_line")
    return {"route": route, "flags": flags, "terminal": "minor" in flags, "resources": res}
