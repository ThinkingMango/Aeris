"""
Python twin of the text rules in src/safety/controller.ts, reading the same
JSON files, so the evaluation scripts and the app apply identical rules.
`python3 evals/classifier_eval.py --parity` checks the two implementations agree.
"""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
KEYWORDS = json.loads((ROOT / "src/safety/crisis_keywords.json").read_text())
BANNED = json.loads((ROOT / "src/safety/banned_output_terms.json").read_text())


def normalize(text: str) -> str:
    t = text.lower()
    t = re.sub(r"[‘’ʼ']", "", t)
    t = re.sub(r"[^a-z0-9/ ]+", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def contains_phrase(normalized: str, phrase: str) -> bool:
    p = normalize(phrase)
    return bool(p) and f" {p} " in f" {normalized} "


def keyword_signals(text: str) -> list[str]:
    n = normalize(text)
    return [sig for sig, phrases in KEYWORDS.items()
            if not sig.startswith("_") and any(contains_phrase(n, ph) for ph in phrases)]


def banned_terms():
    return [t for k, v in BANNED.items() if not k.startswith("_") for t in v]


def validate_generated(fields: dict, max_words: int = 60) -> list[str]:
    problems, items = [], []
    for k in ("reflection", "proposal", "closing"):
        if fields.get(k):
            items.append((k, fields[k]))
    for i, w in enumerate(fields.get("worry_items") or []):
        items.append((f"worry_items[{i}]", w))
    for i, s in enumerate(fields.get("suggestions") or []):
        items.append((f"suggestions[{i}]", s))
    terms = banned_terms()
    for name, text in items:
        n = normalize(text)
        problems += [f'banned term "{t}" in {name}' for t in terms if contains_phrase(n, t)]
        if "!" in text:
            problems.append(f"exclamation mark in {name}")
        if any(s != "physical_symptoms" for s in keyword_signals(text)):
            problems.append(f"crisis language in generated {name}")
    words = len(f"{fields.get('reflection', '')} {fields.get('proposal', '')}".split())
    if words > max_words:
        problems.append(f"{words} words in reflection+proposal (limit {max_words})")
    if any(len(w) > 140 for w in fields.get("worry_items") or []):
        problems.append("worry item over 140 characters")
    return problems


# Route logic mirrored from src/safety/controller.ts (checked by --parity).
PRECEDENCE = ["emergency_medical", "crisis_self_harm", "crisis_harm_to_others", "safety_abuse",
              "minor_exit", "restricted", "normal"]
SIGNAL_ROUTE = {
    "self_harm_in_progress": "emergency_medical", "overdose_or_poisoning": "emergency_medical",
    "medical_emergency": "emergency_medical", "self_harm_plan_or_intent": "crisis_self_harm",
    "self_harm_ideation": "crisis_self_harm", "harm_to_others": "crisis_harm_to_others",
    "abuse_or_unsafe_home": "safety_abuse", "minor": "minor_exit", "passive_death_wish": "restricted",
    "substance_use_now": "restricted", "physical_symptoms": "normal", "distress": "normal",
}


def route_for(signals: list[str], classifier_failed: bool = False) -> str:
    routes = [SIGNAL_ROUTE.get(s, "restricted") for s in signals]
    if classifier_failed:
        routes.append("restricted")
    return min(routes + ["normal"], key=PRECEDENCE.index)
