# What a Viable Anxiety App Looks Like: Options and Recommendation

Status: founding document, v1 (13 September 2026)
Builds on: `01-product-deep-dive.md` (market and regulation), `02-mvp-spec.md` (what is built), `03-30-day-launch-plan.md` (execution)
Sources: `research/niche-wedges-2026-09-13.md` and `research/b2b-channels-hk-sg-2026-09-13.md`, with a link for every claim

---

## 1. The question and the short answer

The question was: is there a version of an anxiety management app that clears US$10k MRR and beyond, rather than settling as a small side business?

**Short answer.** Yes, but not the version most people build. A broad "AI anxiety companion" sold to consumers at US$9.99 plateaus somewhere between US$3k and US$10k MRR because the price anchor is zero, churn is brutal, and acquisition is the whole problem. The version that works is narrower at the front and wider at the back:

- **Front (the wedge):** a product for people stuck in reassurance-seeking and intolerance of uncertainty, across health, relationships and work. It is the one anxiety pattern where a general chatbot's core behaviour, sycophantic 24/7 reassurance, is the pathology itself. A March 2026 paper in *npj Digital Medicine* describes the product spec almost line for line, and Aeris has already built it. ([Golden and Aboujaoude, 2026](https://pmc.ncbi.nlm.nih.gov/articles/PMC13128876/))
- **Back (the revenue layer):** the same product sold as a self-serve team plan to Hong Kong small and mid-sized employers, who mostly have no mental-health benefit and buy on a card, and as a between-session companion to private practitioners who charge HK$1,600 to 2,600 a session and are capacity-constrained.

This is not a pivot. The core engine, safety layer, pattern memory and privacy architecture stay exactly as built. What changes is the promise on the landing page, three or four features, and who the second and third customers are.

---

## 2. What Aeris actually has that competitors do not

Before choosing a direction, it is worth being precise about the assets, because the recommendation is built on them.

| Asset | Where it is | Why it matters commercially |
|---|---|---|
| Anti-reassurance guardrail | `reassurance_seeking` is a first-class pattern; detection changes allowed interventions and the turn's instructions; unsupported certainty triggers regeneration then a deterministic rewrite | The single most documented failure of ChatGPT for anxiety, and no funded product addresses it |
| Anti-loop, action-forcing state machine | Clarify budget, duplicate-question detection, forced advance to an intervention | The most common complaint against Wysa, Earkick, Ash and Abby is "it acknowledges but doesn't respond" |
| Transparent, correctable memory | `user_patterns` with evidence thresholds, "Not true for me", effectiveness per intervention | Replika, Rosebud and Ebb are all criticised for broken or paywalled memory |
| Five-level safety ladder with a middle path | Deterministic floors, classifier, restricted route at risk 2, approved copy for medication, reality-sensitive, violence, relational bids | Every competitor is binary: nothing or a hotline banner. Employers and practitioners will ask about this first |
| Privacy architecture | No message text in any operational store, consent-gated analytics, export in-request, tombstones | Employees fear surveillance; this is the objection an SME buyer raises |
| Hong Kong base and crisis coverage | HK curated resources; founder in HK | Almost no localized competition; incumbents chase the largest employers and insurers ([Insignia](https://review.insignia.vc/2024/02/14/mental-health-care-singapore-intellect/)) |

---

## 3. The option set

Nine options were evaluated. Each is scored on evidence of willingness to pay, how badly a general chatbot serves the need, fit with what is already built, time to first revenue, whether a solo founder can execute it in 6 to 12 months, regulatory sensitivity, and a realistic revenue ceiling.

### Option A. Broad consumer anxiety companion (the current plan)

The product as specified, marketed to adults 25 to 50 with anxious thoughts, at US$9.99 a month.

- **Willingness to pay:** real but thin. Consumer wellness app revenue fell 6% in 2025; Youper closes this month; Ash is free. ([Business of Apps](https://www.businessofapps.com/data/wellness-app-market/), [Youper](https://www.youper.ai/notice))
- **Chatbot gap:** moderate and hard to name in one sentence.
- **Ceiling:** US$3k to 10k MRR on organic distribution. The arithmetic in the deep dive stands: about 1,100 payers, about 37,000 sign-ups, at 3% conversion and 10% churn.
- **Verdict:** keep as the container, not the pitch. Nobody types "AI anxiety companion" into a search bar at 1:30 a.m.

### Option B. The reassurance-seeking wedge: "the AI that won't reassure you"

Position Aeris for people who keep checking, asking, googling and re-reading: health anxiety ("is this headache a tumour"), relationship anxiety ("did I upset them, read this message again"), work anxiety ("my boss hasn't replied, I've messed everything up"). Note that the founding example in this project's original brief is a reassurance-seeking episode.

- **Willingness to pay:** the clinical market is proven. NOCD's parent delivers over a million OCD therapy sessions a year, hit positive EBITDA in March 2025 and made an acquisition in January 2026 ([BHB](https://bhbusiness.com/2026/01/27/nocd-buys-rebound-health-creates-parent-company-noto-to-expand-specialty-behavioral-health-services/)). The self-help subscription market is unproven and tiny: Condri, the only health-anxiety-specific app, charges US$9.99 a month and has 51 App Store ratings ([App Store](https://apps.apple.com/us/app/condri-health-anxiety/id6755934204)).
- **Chatbot gap:** the largest of any niche, and documented. NOCD's own blog warns that ChatGPT worsens reassurance loops ([NOCD](https://www.treatmyocd.com/blog/chatgpt-ocd-reassurance-seeking)); the *Irish Journal of Psychological Medicine* flagged "novel patterns of compulsive reassurance-seeking" ([Cambridge](https://www.cambridge.org/core/journals/irish-journal-of-psychological-medicine/article/generative-ai-and-reassuranceseeking-in-ocd/6D74A57F5066C6C46AB1332AFC2202DD)); the *npj Digital Medicine* paper recommends guardrails that detect repetitive reassurance-seeking and let users pre-instruct the bot to refuse reassurance ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13128876/)).
- **Communities:** r/OCD 273k, r/HealthAnxiety 135k, r/Anxiety with recurring "do not use ChatGPT for reassurance" threads. ([arXiv community dataset](https://arxiv.org/html/2601.20747v1), [r/Anxiety](https://www.reddit.com/r/Anxiety/comments/1mjnj7e/dont_use_chatgpt_with_anxiety/))
- **Fit with the build:** the best of all options. The guardrail exists. The moment of urge is discrete, the intervention is 2 to 5 minutes, and "urge frequency and delay achieved" over weeks is the outcome metric the map should show.
- **Regulatory:** medium-high. OCD and illness anxiety are diagnosable conditions. The product must say it is not for diagnosed OCD without a clinician and must never triage physical symptoms. Both are already prompt and gate rules.
- **Risk:** retention economics of refusal. Users arrive wanting the thing the product will not give. The refusal must feel like care, or they churn to ChatGPT.
- **Ceiling:** the same arithmetic as A but with a message that converts and a community that shares. Realistically US$5k to 15k MRR consumer.

### Option C. The night-time worry tool

A voice-first, dark, eyes-closed mode for 3 a.m. rumination: worry postponement, cognitive shuffle, brief defusion, then a hand-off away from the screen.

- **Willingness to pay:** the best-proven of any niche. Calm launched a standalone sleep app at US$69.99 a year in September 2025 ([TechCrunch](https://techcrunch.com/2025/09/16/calm-launches-standalone-ios-app-for-sleep-support)); ShutEye makes roughly US$600k a month at US$59.99 a year ([Sensor Tower](https://app.sensortower.com/overview/1490078804?country=us)); Sleep Reset charges US$297 a month ([Rest comparison](https://getrest.app/blog/rest-vs-sleep-reset)); Big Health raised US$23.7M in February 2026 ([BHB](https://bhbusiness.com/2026/02/12/big-health-raises-23-7m-from-406-ventures-alleycorp-cvs-ventures-blue-venture-fund/)).
- **Chatbot gap:** real. Typing paragraphs into a bright screen at 3 a.m. is arousing, and ChatGPT will problem-solve the worry, which is the wrong move.
- **Competition:** brutal. Everyone owns the phone at bedtime.
- **Fit:** strong as a feature, weak as a product. CBT-I says leave the screen; the mode must be voice-first and under three minutes or it is part of the problem.
- **Verdict:** ship as "Night mode" inside option B, not as a separate app.

### Option D. ADHD and neurodivergent adults with anxiety

- **Willingness to pay:** strong and consumer. Inflow charges US$199.99 a year with coaching ([ChoosingTherapy](https://www.choosingtherapy.com/inflow-adhd-app-review/)); Tiimo had 50,000 paying subscribers on US$4.8M raised ([Tiimo](https://www.tiimoapp.com/resource-hub/tiimo-raises-4-8m-neurodivergent-planner)).
- **Community:** r/ADHD 2.1M members; anxiety is among the most common adult-ADHD comorbidities ([PMC 2025](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12652008/)).
- **Gap:** no funded product is an anxiety companion for this group; Inflow and Tiimo are productivity tools.
- **Fit:** excellent. Two to five minutes is the attention budget. Rejection-sensitivity spirals and task-paralysis are nameable moments.
- **Risk:** scope creep into productivity, and bursty use that breaks streak-based retention.
- **Verdict:** the strongest second consumer segment after B. Same mechanics, bigger community. Sequence it after B has evidence.

### Option E. Hong Kong SME team plan, self-serve

Aeris for Teams: HK$50 to 80 per employee per month, minimum 10 seats, paid by card, no contract, no broker. Employees get the full product; the employer gets an aggregate, anonymous usage view with a k-anonymity floor and no individual data.

- **Demand:** 60% of HK workers report work stress and 29% already use mind-health apps ([AXA 2025](https://www.prnewswire.com/apac/news-releases/axa-study-over-60-of-hong-kong-workers-encounter-elevated-stress-levels-exceeding-global-average-302462998.html)); roughly 45% of HK employers offer no EAP or mental-health support ([MixCare 2026](https://m.mixcarehealth.com/articles/2026-hk-benefits-trends.html)).
- **Price anchor:** HK EAP runs about HK$1,500 to 2,500 per employee per year ([MantraCare, vendor figure](https://mantracare.org/employee-wellness/eap-guide/eap-hong-kong/)); global digital wellness apps sell at US$2 to 12 per employee per month ([Taction](https://www.tactionsoft.com/blog/corporate-wellness-app-cost/)). A HK$60 per month plan sits inside both.
- **Competition:** Intellect (US$22M raised, AI companion since May 2025, covers all Singapore public servants) and ThoughtFull chase large employers and insurers, not 30-person companies ([Intellect](https://intellect.co/read/intellect-atlas-ai-mental-health/), [Insignia](https://review.insignia.vc/2025/03/21/intellect-case-study/)).
- **Reality check:** EAP utilisation is typically 3 to 5% ([Personnel Today](https://www.personneltoday.com/hr/take-up-of-eaps-low-research-2024/)); digital-first vendors claim 20 to 35% sign-up in year one and that is the bar an HR buyer will hold you to ([Spring Health](https://www.springhealth.com/blog/how-innovative-eaps-drive-utilization)). A 30-seat team at HK$60 is about US$230 a month; twenty such teams is US$4.6k MRR.
- **Fit:** the privacy architecture is the selling point. What is missing is organisation billing, seat management and the aggregate view, all straightforward.
- **Verdict:** the most realistic B2B channel for a solo founder, and the one that lifts the ceiling. Start in month 3, after consumer beta evidence exists.

### Option F. Practitioner companion

Aeris for Practitioners: HK$300 to 500 a month for 10 client seats. Clients use Aeris between sessions; with the client's explicit consent, the practitioner sees confirmed session summaries and pattern trends, and is notified of a safety redirect.

- **Category validation:** Wysa Copilot reports clients are three times likelier to complete therapy with between-session AI support and was selected by NHS Talking Therapies ([BusinessWire](https://www.businesswire.com/news/home/20241105716965/en/Wysa-Unveils-Wysa-Copilot-to-Elevate-Mental-Health-Therapy-With-AI)).
- **Market:** Hong Kong has 8.2 clinical psychologists per 100,000 versus 28 in the UK ([Healthy Matters](https://www.healthymatters.com.hk/mental-health-in-hong-kong-seeing-a-psychologist/)); sessions cost HK$1,600 to 2,600 ([TherapyRoute 2025](https://www.therapyroute.com/article/how-much-does-therapy-cost-in-hongkong-complete-2025-guide)); the private-practice list is public ([HKPS-DCP](https://hkps-dcp.org.hk/images/downloads/EPP%20List%20-%202025.pdf)).
- **Reality check:** a few hundred practitioners, sold one at a time. Practitioners will ask for risk flags and exportable summaries before trusting it. Ten practitioners is about US$500 a month.
- **Verdict:** small revenue, large credibility. Every practitioner who recommends Aeris to clients is a distribution channel into option B, and their pre-and-post GAD-7 data is what every other channel asks for.

### Option G. NGO co-branding leading to funded partnerships

Mind HK listing, a co-branded exercise set with KELY or Coolminds, then a joint bid to the Mental Health Initiatives Funding Scheme, which only NGOs and post-secondary institutions can apply to.

- **Evidence:** HK$475M across 172 projects has been reported under the scheme ([EASAP 2025](https://www.easap.asia/index.php/find-issues/current-issue/item/1005-2025-v35n2-p109)); HKJC's Open Up shows philanthropy pays for digital support at scale with a social return of 4.74 ([HKJC](https://corporate.hkjc.com/en-US/news-and-publications/corporate-news/2026-03/news_2026031401400)); Manulife and Bupa route their mental-health CSR through Mind HK and KELY ([Manulife](https://www.manulife.com.hk/en/individual/about/newsroom/manulife-partners-with-mind-hk-to-establish-new-wellbeing-consultation-hub-in-mong-kok.html)).
- **Verdict:** not revenue in year one. It is the only realistic door to insurers, and it costs nothing but a conversation. Start it early because it takes a year to pay.

### Option H. Licensing the safety layer as an API

- **Evidence:** Clare&me pivoted to exactly this in August 2024 and was bankrupt by June 2025 ([EU-Startups](https://www.eu-startups.com/2024/08/berlin-based-clareme-raises-e3-7-million-to-train-an-empathic-clinical-llm/), [PitchBook](https://pitchbook.com/profiles/company/491513-95)). Limbic keeps its safety layer inside its own regulated products ([Limbic](https://www.limbic.ai/layer)). Buyers want a validated crisis-detection benchmark, not a prompt wrapper.
- **Verdict:** no. At most, consulting-plus-code for one or two friendly HK wellness startups as side income.

### Option I. Students, perinatal, Cantonese-first

- **Students:** the biggest need in Hong Kong (HKFYG 2025 puts secondary-student anxiety at a five-year high) and the worst risk profile: minors, self-harm exposure during exam week, school procurement, Character.AI litigation precedent ([HKFYG](https://hkfyg.org.hk/en/2025/10/14/%E9%9D%92%E5%8D%94%E5%85%AC%E5%B8%83%E3%80%8C%E4%B8%AD%E5%AD%B8%E7%94%9F%E9%96%8B%E5%AD%B8%E9%81%A9%E6%87%89%E8%AA%BF%E6%9F%A5%E3%80%8D%E7%B5%90%E6%9E%9C-2/)). Universities build in-house with Jockey Club money or buy Intellect. Not solo.
- **Perinatal:** intrusive-thought misclassification is a real harm in both directions. Expectful and Woebot's postpartum product both shut in 2025. Not without perinatal clinical co-founders.
- **Cantonese-first:** a genuine gap and a home-turf advantage, but the best models score under 75% on Cantonese benchmarks and Chinese suicide-risk datasets show frequent misclassification of ambiguous expressions ([arXiv HKMMLU](https://arxiv.org/abs/2505.02177), [SuiChat-CN](https://arxiv.org/pdf/2605.27911)). A bespoke Cantonese safety evaluation set must exist before launch. English first; Traditional Chinese in year two.

---

## 4. Comparison

| Option | WTP evidence | Chatbot gap | Fit with build | Time to revenue | Solo-feasible | Regulatory | Realistic ceiling |
|---|---|---|---|---|---|---|---|
| A. Broad consumer | Thin | Moderate | Full | 1 month | Yes | Low | US$3–10k MRR |
| **B. Reassurance wedge** | Clinical proven, self-help unproven | **Largest** | **Full, guardrail exists** | 1 month | Yes | Medium-high | US$5–15k MRR |
| C. Night mode | **Strongest** | Real | Needs voice-first mode | 2 months | Yes | Low | Feature, not product |
| D. ADHD-anxiety | **Strong** | Emotional-regulation gap | Full | 3 months | Yes | Low-medium | US$5–15k MRR as second segment |
| **E. HK SME teams** | Indicative | n/a | Needs org billing and aggregate view | 3–4 months | **Yes** | Low | US$5–20k MRR |
| F. Practitioners | Category proven | n/a | Needs consented sharing and flags | 2–3 months | Yes, slow | Medium | US$0.5–2k MRR plus distribution |
| G. NGO partnerships | Grant-funded | n/a | Credibility | 12+ months | Yes | Low | Door to insurers |
| H. Safety API | Failed precedent | n/a | Partial | Unclear | Barely | Medium | Side income |
| I. Students, perinatal, Cantonese | Mixed | Mixed | Full | n/a | **No** | **High** | Not now |

---

## 5. Recommendation

**Build a barbell: one narrow consumer wedge for proof and word of mouth, two small B2B channels for revenue, one credibility track for the long game.**

### 5.1 The consumer wedge (months 1–3): "Aeris will not reassure you. It will help you stop needing it."

Keep the product, change the promise. The landing page, the onboarding and the first three content pieces speak to one person: someone who knows they keep checking, asking and re-reading, has probably already tried ChatGPT for it, and suspects it is making things worse. The three named situations are health worry, relationship worry and work worry, which are already trigger categories in the engine.

Product deltas beyond `02-mvp-spec.md`, in priority order:

1. **Urge capture.** A one-tap "I want to check / ask / google" entry on Home that starts a session in reassurance mode with intensity and the target of the urge. Stored as a session with `primary_pattern = reassurance_seeking` and a new `urge_target` enum (search, message, ask a person, re-read, body check).
2. **Delay-the-check timer.** A 10-, 20- or 30-minute countdown as an intervention, with a short uncertainty-tolerance script and a check-in at the end recording whether the check happened. This is response prevention in wellness clothing and is the single most valuable outcome metric.
3. **Uncertainty-tolerance exercise.** A sixth app-owned intervention routed from `reassurance_seeking` and `intolerance_of_uncertainty`: name the feared outcome, name what is actually known, name what checking would and would not change, choose to sit with it for a set time.
4. **Anxiety Map additions.** Urges per week, checks resisted, average delay achieved, and the top three urge targets. These are the numbers a reassurance-seeker will pay to see go the right way.
5. **Night mode** (option C): voice-first, dark, three-minute cap, worry postponement and cognitive shuffle, ending with an off-screen instruction. Ships in weeks 5 to 8.

Wording discipline remains absolute: never "OCD treatment", never "exposure therapy", always "a self-help tool for the urge to check", always "if you have been diagnosed with OCD, use Aeris alongside your clinician, not instead".

### 5.2 The revenue layer (months 3–6)

**Aeris for Teams** (option E). HK$60 per employee per month, 10-seat minimum, card payment through Paddle, self-serve. Employer sees only seat count, activation rate and aggregate intensity trend once ten or more employees are active. First fifty targets: Cyberport and HKSTP cohort companies, HK startups with 20 to 200 staff, expat-heavy professional-services SMEs. The pitch is one line: "Half your staff are anxious, none of them will use your EAP, and this is HK$60 a month with nothing for you to see."

**Aeris for Practitioners** (option F). HK$400 a month for 10 client seats. Client invites practitioner; sharing is per-summary and revocable; safety redirects notify the practitioner only if the client consented at invite time. First twenty targets from the DCP private-practice list and expat counselling practices in Central. Ask each for one thing in return: pre-and-post GAD-7 on consenting clients.

### 5.3 The credibility track (months 1–12)

Mind HK listing in month 1. A co-branded exercise set with KELY or Coolminds by month 4. A student-society pilot at one HK university by month 6 to generate GAD-7 evidence. A joint MHIFS bid with an NGO partner in year two. AIA Vitality HK's mental-wellbeing partner slot is currently empty ([AIA](https://www.aia.com.hk/en/health-and-wellness/aia-vitality/our-partners)); that is the year-two target, and it is reachable only through the NGO badge and the evidence.

### 5.4 The revenue path

| Month | Consumer Plus | Teams | Practitioners | MRR (US$) |
|---|---|---|---|---|
| 3 | 80 payers | 0 | 2 | ~800 |
| 6 | 250 | 8 teams, ~240 seats | 6 | ~4,400 |
| 9 | 400 | 15 teams, ~450 seats | 10 | ~7,600 |
| 12 | 550 | 22 teams, ~660 seats | 12 | ~10,600 |
| 18 | 800 | 35 teams, ~1,050 seats | 15 | ~16,000 |

Assumptions: US$9 net per consumer, US$7.70 net per seat, US$50 net per practitioner, 10% consumer churn, 5% team churn. These are targets to test, not forecasts. The consumer column alone never crosses US$10k in 18 months on organic distribution. The teams column is what does it.

### 5.5 Why this and not the alternatives

- It uses everything that is built and changes nothing structural.
- The wedge is the one place the strongest asset, the anti-reassurance guardrail, is the entire pitch.
- Teams and practitioners are the two channels the research found solo-feasible in Hong Kong, and both sell on the privacy and safety architecture that already exists.
- The credibility track is free and is the only route the evidence shows into insurers.
- Every other option is either a feature of this one (night mode, ADHD as a second segment), a failed precedent (safety API), or needs a sales team, clinicians or a Cantonese safety set that does not exist yet.

---

## 6. Ninety-day validation with kill criteria

| Test | By | Continue if | Stop or change if |
|---|---|---|---|
| Wedge message | Day 30 | Landing page converts visitors to sign-ups at ≥8%; the reassurance content piece gets shared in at least two communities without the founder posting it | Under 4% and no organic sharing: the message is not landing, try the ADHD segment |
| Refusal retention | Day 60 | ≥35% of reassurance-mode users return within 7 days; delay-the-check completion ≥50% | Under 20% return: the refusal does not feel like care; rework the exercise before scaling |
| Consumer conversion | Day 75 | ≥2.5% free to paid with the map live | Under 1.5%: the paid promise is not compelling at this price; test annual-only and a lower monthly |
| Teams | Day 90 | 3 paying teams from 30 conversations; ≥25% employee activation in the first month | Zero teams from 30: the SME pitch is wrong or the buyer is not the owner; move to practitioners as primary B2B |
| Practitioners | Day 90 | 3 practitioners recommending Aeris; at least one agreeing to collect GAD-7 | Zero: park it and revisit with teams evidence |

---

## 7. What this changes in the 30-day plan

Not the sequence. RC4 certification, compliance and the Anxiety Map stay as written. Three additions:

- Day 8: the landing-page copy, onboarding personalization chips and the first content piece are written for the reassurance wedge, not the broad audience.
- Days 11–13: the Anxiety Map includes urges per week, checks resisted and average delay as sections, alongside the six already specified.
- Weeks 5–8 (after Day 30): urge capture, delay-the-check, the uncertainty-tolerance exercise and night mode, in that order, then the Teams billing and aggregate view.

---

## 8. What not to do

- Do not build an ADHD product, a sleep app and a reassurance tool at once. One wedge, then a second segment when the first has retention data.
- Do not sell to large employers, insurers or universities in year one. The research is unambiguous that a solo founder loses those procurements to Intellect and to in-house builds.
- Do not license the safety layer. Clare&me tried it.
- Do not ship Cantonese before a labelled Cantonese risk evaluation set exists.
- Do not touch minors or perinatal.
- Do not raise money to do any of this. The plan is designed to pay for itself by month 6 and to reach a founder salary by month 12 to 18. If it does, the option to raise, or to sell to Intellect or a Hong Kong insurer, opens on much better terms.
