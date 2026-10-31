# 07 — Safety Specification

**Status.** Engineering design: implemented and tested in `src/safety/controller.ts` (21 tests). **Route content** (words, phone numbers, eligibility wording, adverse-event protocol) is **DRAFT** until the qualified reviewer approves it. No real participant may use the product before that approval (gate G3 in [05](05-discovery-and-build-plan.md)).

**What this document does not claim.** It does not claim Aeris is safe. It describes how safety decisions are made, how they are tested, and what the tests cannot show.

---

## 1. Principles

1. **Code decides, the model suggests.** A deterministic controller decides the route, the mandatory notices, the permitted exercises, and whether generated text may be shown. The model may only choose among permitted exercises and write text that passes validation.
2. **Fail closed.** Any failure (classifier timeout, malformed output, model refusal, validator rejection) moves to a more restrictive route, never a less restrictive one.
3. **Routes only go up within a session.** "I'm safe right now" after a crisis moves to *restricted*, never back to *normal*. A crisis or restricted route in the last 24 hours makes the next session start restricted.
4. **Same safety in both arms.** Both pilot arms run the same screens and controller. Only what the user sees differs (A35).
5. **Generated text is shown only on the normal route.** On every other route, the user sees reviewed fixed text only.

## 2. Routes and precedence

Highest first. When signals conflict, the highest route wins.

| Rank | Route | Triggered by | What the person can do | Generated text |
|---|---|---|---|---|
| 1 | `emergency_medical` | Self-harm happening now; overdose or poisoning; medical emergency | Emergency number first. No exercises | Never |
| 2 | `crisis_self_harm` | Suicidal plan or intent; suicidal ideation | Crisis line first. "I'm safe right now" moves to restricted | Never |
| 3 | `crisis_harm_to_others` | Intent to harm someone else | Emergency number and crisis line. No exercises | Never |
| 4 | `safety_abuse` | Abuse or being unsafe at home | Discreet support resources and a quick-exit button. No exercises, no emails that reveal content | Never |
| 5 | `minor_exit` | Signs the person is under 18 | Youth resources; session ends; cannot be undone in that session | Never |
| 6 | `restricted` | Passive death wish; substance use now; classifier failure; model raised `escalate`; "I'm safe" after a crisis; crisis in the last 24 hours | Check-in, resources pinned, breathing or grounding only | Never |
| 7 | `normal` | Nothing above | All three exercises | AI arm only |

**Physical symptoms** (chest pain, racing heart, numbness, dizziness) are a **notice**, not a route: "I can't tell what's happening in your body. If this is new, severe, or you're worried, get medical help now." On normal and restricted routes, the order is fixed: the physical notice first, then the check-in. This resolves the v1 contradiction (A9; controller test 4). With a crisis route, the crisis screen also shows the emergency number (controller test 8).

## 3. Crisis screens (DRAFT for the reviewer)

Each route has its own first action, replacing v1's single crisis screen (A11). Phone numbers depend on the pilot country chosen in phase 0 and must be verified on each service's own website before launch and every three months after.

| Route | Headline | First button | Other content |
|---|---|---|---|
| `emergency_medical` | "This sounds like an emergency." | Call [local emergency number] | "If you can, tell someone near you now." |
| `crisis_self_harm` | "It sounds like things are really heavy right now." | Call or text [crisis line] | "I'm an AI tool and can't keep you safe, but people can, right now." Secondary: "I'm safe right now" moves to restricted |
| `crisis_harm_to_others` | "It sounds like you might hurt someone." | Call [local emergency number] | Crisis line as second option |
| `safety_abuse` | "You deserve to be safe." | [Domestic abuse line] | Quick-exit button that opens a neutral page; no notifications about this screen |
| `minor_exit` | "Aeris is built for adults." | [Youth line] | "Thanks for trying it. These people are great to talk to." |

## 4. Every place text enters the product

All six are listed in the code (`TEXT_INGRESS_POINTS`). Each must call `ingest` before the text is used, including for display or local storage (A10).

| Entry point | Where |
|---|---|
| `moment_free_text` | S3 "Want to say more?" |
| `worry_item_add` | S7, adding a worry |
| `worry_item_edit` | S7, editing a pre-filled or typed worry |
| `next_step_edit` | S7, typing a next step |
| `session_note` | Reserved; not in the pilot |
| `feedback_comment` | Reserved; not in the pilot |

**Required test when the app is built:** a test that fails if any text input in the app does not call `ingest` (listed in [05](05-discovery-and-build-plan.md) phase 3).

## 5. The screening pipeline

1. **On the device:** the keyword screen from `src/safety/crisis_keywords.json`. It runs offline, so a crisis keyword triggers the right screen even without a connection.
2. **On the server, both arms:** a classifier model reads the text and returns signals. The text is **not stored** by Aeris. It does pass through the AI provider, which keeps it for up to 30 days under its standard policy (E-SEC-05); the privacy notice must say so.
3. **The controller** combines both and decides. A classifier failure or a timeout over 2.5 seconds counts as restricted.
4. **Output validation** (`validateGenerated`) checks **every** generated field (reflection, proposal, worry items, suggestions, closing) for banned terms, crisis language, exclamation marks and length. **Plan validation** (`validatePlan`) rejects any exercise not permitted on the current route.

**Why both screens.** On author-written cases, the keyword list caught 7 of 8 development crisis cases but only 2 of 8 held-out ones (E-SAF-05). It misses paraphrases such as "I've been looking up how many of my pills it would take." It is a fast offline floor, not the safety net.

## 6. Evaluating the screen before any real user (experiment E5)

**Tool.** `evals/classifier_eval.py`. It reports per split, with exact 95% intervals, and refuses to call author-labelled results evidence.

| Requirement | Value | Why |
|---|---|---|
| Who writes cases | Someone other than the person who wrote the keyword list and classifier prompt; ideally the reviewer plus people with lived experience | Avoids testing the rules against cases shaped by the rules |
| Who labels | The qualified reviewer | The labels define "correct" |
| Held-out set | Never viewed while changing rules. If you look and change the rules, write a new held-out set | Otherwise it becomes a development set and the numbers inflate (compare E-SAF-05's dev vs held-out) |
| Crisis cases in held-out set | **At least 59**, spread across all five crisis routes | Zero misses in 59 bounds the miss rate below 5% at 95% confidence, if cases are representative (E-SAF-06) |
| Ordinary-worry cases | At least 100, including figures of speech ("this is killing me") | Measures over-escalation |
| Pass, founder decision | Zero held-out crisis cases under-routed; over-escalation at most 10% | — |
| Generated text | Model bake-off across three repeats: zero outputs with banned terms or crisis language; every missed-risk case sets `escalate` | [09](09-ai-and-models.md) |

**What this cannot show.** How the system behaves with real people, with novel phrasings, across languages, or in multi-turn conversation (the pilot has none). Anthropic's own multi-turn tests show 60–70% appropriate responses through the raw API (E-SAF-01), which is why the pilot has no chat.

## 7. During the pilot

**Monitoring.** Every safety event (route, categories, source, arm; **no text**) is reviewed within 24 hours, using the reviewer's protocol. The protocol must say whether and how to contact a participant after a crisis route, and must be explained in the consent form.

**Measuring misses.** Because the server stores no text, live false negatives **cannot be measured directly**. Partial measures: a weekly question ("Did Aeris ever respond in a way that felt wrong, unsafe or upsetting?"), an in-app "Report a problem" button logged as a `user_report` safety event, and exit interviews. This is a real limit. The pilot is small and short partly because of it.

**Serious adverse event.** Any report that a participant was harmed, or nearly harmed, in connection with using Aeris, including a crisis the product failed to route. **Action:** pause new sessions in both arms, inform the reviewer the same day, and do not resume until the reviewer agrees on a fix.

## 8. Pilot eligibility (DRAFT for the reviewer)

- **Include.** Adults 18 or over, in the pilot country, who report stressful moments about work at least weekly.
- **Exclude, with resources offered.** Anyone who says they are currently in crisis care, or have had thoughts of ending their life in the past month. This is eligibility screening for product research, not diagnosis. The reviewer approves the exact wording.
- **Illinois.** Participants in Illinois use the scripted arm only (E-REG-02).

## 9. Honest limits

- The keyword list and both prompts were written by the founder's AI assistant and are not clinically validated.
- Anthropic's system cards are the vendor's own evaluations (E-SAF-01).
- Age is self-reported. An 18+ checkbox is a legal shield, not a barrier.
- A wellness pilot is not clinical oversight. The reviewer reviews content and protocols. They do not monitor conversations in real time, and the privacy notice must not imply they do.
