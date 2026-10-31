# 14 — Which LLM Provider and Which Models Fit Aeris

**Written:** 31 October 2026. Prices and model names were checked against the providers' own pricing and terms pages on this date, except where marked "third-party figure." These change often; re-check before you sign up.

**A conflict of interest you should know about.** This analysis was written by Claude, a model made by Anthropic. Anthropic sells one of the five options below. I have tried to be fair by grounding every judgement in evidence you can check yourself, by listing where Claude is *not* the best choice, and by recommending that you run your own test (Doc 12, Day 18) before trusting anyone's opinion, including mine.

---

## 1. The short answer

| Question | Answer |
|---|---|
| **Which provider for the MVP?** | **Anthropic (Claude)** as the primary, with **OpenAI** wired in as a switchable alternative. Both pass the legal and data tests. Claude has the strongest *published* evidence on the two behaviours that matter most for Aeris: not flattering a distressed user (sycophancy) and handling self-harm conversations carefully. OpenAI's newest small model is the cheapest high-quality option for the "read" step and is the right fallback. |
| **Reasoning model or standard model?** | **Neither, as a category. In 2026 this is a dial, not a model choice.** Every current model from the three Western providers "thinks" before answering; you control how much with a setting. Aeris should set that dial to **low** for the moment-read and **off or minimal** for the safety classifier, because the user is waiting and the tasks are short. Full details in Section 3. |
| **Which exact models?** | **Updated after the deep dive in Doc 15.** Safety classifier: **Claude Haiku 5.5**, thinking off. Moment-read, suggestions, closing line: **Claude Sonnet 5.5** at low effort or thinking off. Weekly reflection: Sonnet 5.5 via the Batch API at half price. Opus 5.5 is the upgrade path if the Day 18 blind test shows a clear tone win. Fallback set: **GPT-6 Luna** (classifier) and **GPT-6.1 Terra** (read). |
| **Gemini?** | Technically good and cheap today, but **Google's own API terms contain a medical-use restriction and a mental-health disclaimer that a lawyer must read before you build on it**, independent research found it the most likely to refuse engagement in distress conversations, and Google has announced that prices double on 1 December 2026 (Argon) and 1 January 2027 (Flash). Viable as a batch or classifier option later; not the right primary for the MVP. |
| **DeepSeek?** | **No** for a health-adjacent consumer app serving US, UK, or EU users. Its own privacy policy says data is processed and stored in the People's Republic of China and that its services are not designed for sensitive data such as health. The US Department of Homeland Security banned it from federal systems in October 2026. The only legitimate route is the open-weights model hosted by a US or EU company, which trades away most of the price advantage and leaves you with a model that has no published mental-health safety work. |
| **Qwen?** | **Not for the MVP.** Alibaba's international Model Studio offers Singapore and US (Virginia) regions, which solves the data-location problem on paper, but the Chinese-parent-company perception and regulatory risk is real for a mental-health product, the English-language warmth is untested in this domain, and Alibaba renames and reprices models quarterly. The open-weights Qwen models are a legitimate **cost-at-scale** option in a year, self-hosted or via a US host. |

---

## 2. How I judged (so you can disagree with the weights)

A wellness app for anxious moments is not a coding tool. The things that matter are different. Here are the criteria and how much each counts, in order.

| # | Criterion | Weight | Why it matters for Aeris |
|---|---|---|---|
| 1 | **Behaviour in sensitive conversations** (does it avoid flattering, avoid dismissing, handle self-harm mentions carefully, avoid over-refusing someone who just needs to be heard) | 30% | This is the product and the liability. A model that is 2% better at code is irrelevant. A model that is 2% more likely to say "it's just anxiety" or to shut the door on a distressed user is a lawsuit or a lost user. |
| 2 | **Data handling and legal fit** (no training on your data, short retention, deletion, data location, a Data Processing Addendum you can sign, and *terms that permit a wellness app*) | 25% | Doc 03 and Doc 09. Health-adjacent data is the most regulated data there is. |
| 3 | **Speed** (time to first word for the "read" step) | 15% | Doc 08 targets under 1.5 seconds for the first line. A slow model makes a panicking user wait. |
| 4 | **Writing quality for this voice** (short, warm, plain, no exclamation marks, follows a strict format) | 10% | Aeris says about 50 words per session. Each must be right. |
| 5 | **Cost** per session | 10% | Doc 11 shows AI cost is small relative to the $7.99 subscription on *any* of these providers. Cost matters at scale, not at launch. |
| 6 | **Developer features** (reliable structured JSON output, prompt caching, batch pricing, server-side safety fallbacks, streaming) | 10% | These decide how much safety code you have to write yourself. |

Notice cost is only 10%. A founder's instinct is to pick the cheapest model. For Aeris the difference between the cheapest and the best is about **1 cent per session**. Your Stripe fee per subscriber is 53 cents. Do not optimize the wrong number.

---

## 3. "Reasoning" vs "standard" models, explained

**What a reasoning model is.** When you ask a question, a reasoning model first writes private notes to itself ("the user mentioned tomorrow, mentioned their manager, tension is 8, the fit is worry-sort…") and only then writes the answer you see. Those private notes are called *thinking tokens*. You pay for them as output, and they take time.

**What changed in 2025–2026.** Two years ago you chose between a "thinking" model and a "fast" model. Today, every current model from Anthropic, OpenAI, and Google thinks by default, and you turn the amount up or down with a setting:

| Provider | The dial | Lowest setting available | Notes |
|---|---|---|---|
| Anthropic | `output_config.effort`: low, medium, high, xhigh, max | **low** (thinking cannot be fully disabled on Opus 5.5 or Sonnet 5.5; Haiku 5.5 allows off at high or below) | Thinking content is hidden by default; you can request a summary |
| OpenAI (GPT-6 family) | `reasoning.effort`: low, medium, high, xhigh, max | **low** (reports indicate "minimal" and "none" are not supported on GPT-6 Astra or GPT-6.1 Sol; verify for Terra and Luna in the docs) | Reasoning tokens billed as output |
| Google Gemini | thinking level / budget | **low or minimal** depending on model | Thinking tokens billed at the output rate; the pricing page says so explicitly |
| DeepSeek | thinking mode on/off | **off** | Thinking is the default; you can switch it off per request |
| Qwen | thinking mode on/off | **off** | Similar to DeepSeek |

**What this means for Aeris, step by step** (the pipeline from Doc 08):

| Step | Task | Reasoning setting | Why |
|---|---|---|---|
| 1. Safety classifier | "Is there a crisis signal? Level 0–3." | **Off or lowest** | It is a narrow classification. Speed matters (under 1 second). A small model with no thinking does this well. Over-thinking here mostly adds latency and risks the model "talking itself out of" a flag. |
| 2. Read the moment | Reflect, name the pattern, pick 1–3 interventions, fill JSON | **Low** | A little thinking helps it choose the right intervention and avoid clichés. More than "low" adds seconds and cost with no visible gain on a 60-word answer. This is the setting to tune on Day 18. |
| 4. Worry-sort suggestions | Three tiny next steps | **Low or off** | Trivial task |
| 6. Closing line | One sentence | **Low or off** | Trivial task |
| 7. Weekly reflection (batch) | Four sentences from a week of structured records | **Medium** | Nobody is waiting, the Batch API is half price, and a bit more thought produces a better reflection |
| Safety test runs (your evals) | Grading 60 test cases | **High** | Offline, accuracy matters more than speed |

**The honest bottom line:** You do not need a "reasoning model." You need a good model with the thinking dial set low for the live steps. The one place more reasoning genuinely pays off is the offline weekly reflection, and the Batch API makes that nearly free.

---

## 4. Provider by provider

### 4.1 Anthropic (Claude)

**Current lineup and prices (per 1M tokens, first-party API, confirmed October 2026):**

| Model | Input | Output | Cache read | Role in Aeris |
|---|---|---|---|---|
| Claude Opus 5.5 | $4.00 | $20.00 | $0.20 | Upgrade path for the read step (Doc 15 §7) |
| Claude Sonnet 5.5 | $2.00 | $10.00 | $0.10 | **Default** for read / suggest / close / weekly (Doc 15) |
| Claude Haiku 5.5 | $0.10 | $0.50 | $0.01 | Safety classifier, nightly tag extraction |
| Claude Fable 5.1 | $10.00 | $50.00 | $0.25 | Not needed. Also requires 30-day retention and is not available under zero data retention |

**Data handling (from Anthropic's privacy centre, updated 1 July 2026):** API inputs and outputs are deleted within 30 days; not used for training; zero-data-retention agreements are available (negotiated, typically for larger customers); a Data Processing Addendum is published. Flagged policy violations may be kept longer. Standard and acceptable for Aeris.

**Usage-policy point you must honour:** Anthropic's usage policy treats healthcare-adjacent consumer uses as sensitive and requires that end users be told they are interacting with an AI and that there is a clear "not a professional" disclosure. Aeris already does both (Doc 03). Confirm the current wording of the policy before launch.

**Safety evidence relevant to Aeris:**
- Anthropic's December 2025 user-wellbeing update reported that the Claude 4.5 family scored 70–85% lower than the previous generation on sycophancy and on encouraging user delusions, and about 98.6–99.3% appropriate on single-turn clear-risk requests. It also described a partnership with ThroughLine, a crisis-support organisation, on how Claude handles mental-health conversations. These are the company's own numbers; treat them as a strong signal, not an audit.
- The independent RAND study (Psychiatric Services, 2025) found Claude 3.5 Sonnet and ChatGPT handled very-low and very-high risk suicide questions appropriately but both sometimes answered lethality questions they should not have. Gemini refused most things. **That model is two generations old; run your own test.**
- A separate 2025 study in JMIR Mental Health compared models to expert suicidologists: 11% of Claude responses were outliers versus 19% for ChatGPT and 36% for Gemini.
- Community sycophancy benchmarks in 2026 (HalBench, 3,200 prompts) placed Claude Sonnet 4.6 ahead of GPT-5.4 and Gemini 3.1 Pro on pushing back against false premises. One community benchmark, not an audit.

**Developer features that reduce your safety code:** structured outputs with a JSON schema; prompt caching (the 3,000-token system prompt costs 5% on repeat); the Batch API at 50% off; **server-side refusal fallbacks** (if Anthropic's own safety classifier declines a request, it can route to a fallback model automatically rather than erroring); mid-conversation operator instructions that are injection-safe; a `refusal` stop reason you can detect and handle gracefully.

**Where Claude is not the best choice:**
- **Price.** Opus 5.5 is 4× the input price of GPT-6.1 Terra and 2.7× Gemini 3.8 Flash's introductory price. Sonnet 5.5 narrows but does not close the gap.
- **Over-refusal risk (checked in Doc 15, and smaller than this document first suggested).** Anthropic's blocking classifiers on all three current models target biology, cyber, AI development, weapons, and model copying, not mental-health text, and benign over-refusal on the self-harm tests was 0–0.04%. Still handle the `refusal` stop reason with a warm retry (Doc 08 §11).
- **Raw-API safety on long conversations is weak for every model.** Anthropic's system cards report 60–70% appropriate responses on multi-turn self-harm tests without a system prompt, rising to 90–100% with one. Aeris's system prompt carries the weight (Doc 15 §6).
- **Thinking cannot be disabled on Opus 5.5**, so it has a latency floor and an official speed label of "Moderate". Sonnet 5.5 ("Fast") can turn thinking off with `between_tools`, and Haiku 5.5 ("Fastest") with `disabled`.

**Fit score: 4.6 / 5.**

### 4.2 OpenAI (GPT)

**Current lineup and prices (openai.com pricing page, confirmed 31 October 2026):**

| Model | Input | Cached input | Output | OpenAI's own description | Role in Aeris |
|---|---|---|---|---|---|
| GPT-6 Astra | $10.00 | $1.00 | $50.00 | "Our most capable model, built for the hardest end-to-end work" | Not needed |
| GPT-6.1 Sol | $2.00 | $0.10 | $10.00 | "Complex coding and agentic workflows at scale" | Possible read model; same price as Sonnet 5.5 |
| **GPT-6.1 Terra** | **$1.00** | **$0.05** | **$5.00** | "A fast, efficient model for visual reasoning, precise computer use, and **clear, natural writing**" | **Best-value read model across all five providers** |
| **GPT-6 Luna** | **$0.10** | **$0.01** | **$0.50** | "Our most efficient model for focused, high-volume tasks" | Safety classifier; same price as Haiku 5.5 |

Batch API is 50% off. Data residency (EU/US processing) adds 10%.

**Data handling (OpenAI "Your data" page, confirmed):** API data is not used for training since March 2023; abuse-monitoring logs retained up to 30 days; Zero Data Retention and "Modified Abuse Monitoring" are available **by approval only** (you apply through sales); a Business Associate Addendum exists for healthcare customers (you will not need it; Aeris is not HIPAA-covered). Data residency controls exist for an extra 10%. Standard and acceptable.

**Safety evidence relevant to Aeris:**
- OpenAI's October 2025 update on sensitive conversations said it worked with 170+ clinicians, reduced non-compliant responses in mental-health conversations by 65% in production traffic, and scored 92% compliant on its own 1,000-conversation benchmark (up from 27%). Company numbers.
- Independent and press scrutiny has been heavier on OpenAI than on anyone else: the Raine family lawsuit (2025), the April 2025 sycophancy rollback of GPT-4o, a late-2025 clinician role-play study concluding GPT-5 was "still far from safe" in crisis moments, and the ELEPHANT social-sycophancy benchmark finding GPT-5 "substantially sycophantic" in open-ended advice contexts.
- Secondary reports say OpenAI **cancelled the planned October 2026 release of GPT-6.1 Astra over safety concerns.** I could not verify this against a primary source; it is listed here because if true it is relevant to vendor stability, and if false you should know the rumour exists.
- OpenAI's consumer product has by far the most users turning to it for emotional support, so its failures are the most visible. That is not the same as being the least safe, but it is a reputational factor: "powered by the same model as the chatbot in the lawsuits" is a headline you do not want.

**Developer features:** structured outputs (OpenAI pioneered strict JSON schemas and they are excellent); prompt caching with very cheap cache reads; Batch API; a well-documented Responses API. No server-side refusal fallback equivalent; you handle refusals yourself.

**Reasoning dial caveat:** reports indicate the GPT-6 family does not support `minimal` or `none` reasoning effort; `low` is the floor. That is fine for the read step and probably fine for the classifier on Luna, but measure the classifier's latency; if it is over one second, Haiku 5.5 with thinking off is the better classifier.

**Where OpenAI is the best choice:** price-to-quality for the read step (Terra), structured-output maturity, and as a **resilience fallback** when the Anthropic API has an outage.

**Fit score: 4.1 / 5.** It loses to Claude on criterion 1 (the evidence and the public record) and on vendor stability; it wins on price.

### 4.3 Google (Gemini)

**Current lineup and prices (ai.google.dev pricing page, confirmed 31 October 2026; thinking tokens are billed as output):**

| Model | Input now | Output now | Scheduled change | Role in Aeris |
|---|---|---|---|---|
| Gemini 4 Argon | $2.00 | $10.00 | **$4.00 / $20.00 from 1 December 2026** | Possible read model, but price doubles in a month |
| Gemini 3.8 Flash | $0.75 | $3.75 | **$1.50 / $7.50 from 1 January 2027** | Cheapest capable read candidate until January |
| Gemini 3.6 Flash | $0.75 | $3.75 | Same increase | — |
| Gemini 3.5 Flash-Lite | $0.30 | $2.50 | None announced | Safety classifier candidate |
| Gemini 3.1 Pro Preview | $2.00 | $12.00 | — | Not needed |

Batch is 50% off. Context caching is "implicit only" on Argon (you cannot pin your system prompt explicitly; the system decides).

**Data handling (Gemini API terms, effective 23 March 2026):** On the **paid** tier Google does not use prompts or responses to improve products and processes them under its processor Data Processing Addendum; it logs them "for a limited period" for abuse detection. On the **free** tier Google *does* use your data and may have humans review it, and the terms say "do not submit sensitive, confidential, or personal information." **You must use the paid tier**, and the terms *require* paid tier for any app serving EEA, Swiss, or UK users.

**Two clauses in Google's terms that matter specifically for Aeris:**
1. *"You may not use the Services in clinical practice, to provide medical advice, or in any manner that is overseen by or requires clearance or approval from a medical device regulatory agency."* Aeris is designed to be none of those (Doc 03). But "mental-health adjacent AI guide" is exactly the kind of product where a platform could later argue the line was crossed. Your lawyer must read this clause against your product before you build on Gemini.
2. *"Don't rely on the Services for medical, mental health, legal, financial, or other professional advice."* This is a disclaimer, not a prohibition, but it signals Google's posture.
Also: *"Applications with less restrictive safety settings may be subject to Google's review and approval."* Gemini's default safety filters are aggressive in self-harm categories. To make Gemini engage warmly with someone describing distress, you would likely need to loosen those filters, which invites review.

**Safety evidence relevant to Aeris:**
- RAND (2025): Gemini was "the least direct," less likely to answer *any* suicide-related question regardless of risk. For a crisis hotline that is good. For Aeris, where most users are at Level 0–1 and simply need to be met, **over-refusal is a product failure**: "I can't help with that" to someone who said "I'm so anxious I want to disappear for a while" is the rejection experience users complain about (Doc 02).
- JMIR Mental Health (2025): 36% of Gemini responses were outliers versus expert suicidologists, the highest of the three.
- ELEPHANT ranks Gemini **least** sycophantic. That is a genuine strength.
- These tested Gemini 1.5 Pro. Gemini 3.x and 4 are much improved generally; the specific mental-health behaviour is untested in public research.

**Developer features:** structured output via response schemas (good), batch, very large context, implicit caching. Fewer safety-specific features than Anthropic.

**Where Gemini is the best choice:** very cheap, very fast classification and tagging (Flash-Lite), and large-scale batch work. If you later run millions of nightly tag extractions, Flash-Lite via batch is hard to beat.

**Fit score: 3.3 / 5.** Good technology; the terms gray zone, the over-refusal evidence, and the announced price doubling make it the wrong primary for a mental-health-adjacent MVP.

### 4.4 DeepSeek

**Current lineup and prices (api-docs.deepseek.com, confirmed 31 October 2026):**

| Model | Input (cache miss), peak / off-peak | Output, peak / off-peak | Notes |
|---|---|---|---|
| deepseek-flash (V4.1-Flash) | $0.30 / $0.15 | $1.20 / $0.60 | 1M context, thinking on by default, Anthropic-compatible API |
| deepseek-v4-pro | $1.32 / $0.66 | $3.96 / $1.98 | — |

Off-peak is defined in Beijing time; most US and European daytime hours are "off-peak." Astonishingly cheap: a full Aeris session would cost well under half a cent.

**Why the price does not matter here (from DeepSeek's own privacy policy, updated 10 February 2026):**
- *"To provide you with our services, we directly collect, process and store your Personal Data in People's Republic of China."*
- *"The Services are not designed or intended to process sensitive Personal Data (e.g., personal data revealing … health …). We do not ask for, and you should not provide sensitive Personal Data to the Services."* Aeris exists to process exactly that data.
- DeepSeek uses inputs to "train and improve our technology" under its consumer policy; the API/platform terms differ and make the developer the controller, but the data still transits and is stored in China.
- Italy's data-protection authority blocked DeepSeek in 2025. The US Department of Homeland Security ordered civilian federal agencies to stop using it in October 2026, with coverage indicating the order extends to products built on DeepSeek's models.

For a product whose entire trust proposition is "your anxiety journal is private," sending that journal to servers in a jurisdiction with compelled-access laws, through a provider that tells you not to send health data, is disqualifying. It would also be very hard to explain in a privacy policy that a lawyer would sign off on for US, UK, or EU users.

**The legitimate alternative:** DeepSeek's weights are open. US and EU inference companies (Together, Fireworks, Groq, and others) host them under their own data terms, so the data never goes to China. That is a defensible architecture. But (1) hosted open-weights prices are several times DeepSeek's own, erasing much of the advantage, (2) there is no published mental-health safety work on these models, so you would carry the full burden of alignment testing, and (3) the "built on DeepSeek" headline risk remains. Reasonable to revisit in a year if cost at scale becomes the binding constraint; wrong for the MVP.

**Fit score: 1.8 / 5** via the official API; **2.8 / 5** via a Western host.

### 4.5 Qwen (Alibaba)

**Current lineup (Alibaba Cloud Model Studio international, confirmed 31 October 2026; prices are third-party figures I could not confirm on Alibaba's page, so verify in the console):**

| Model | Third-party price (input / output per 1M) | Alibaba's description |
|---|---|---|
| qwen3.8-max | ~$0.60–1.20 / ~$3.60–6.00 | "Complex reasoning and coding" |
| qwen3.7-plus | ~$0.40 / ~$2.40 | "Balanced performance, speed, and cost" |
| qwen3.8-flash | ~$0.10 / ~$0.40 | "Fast and cost-effective" |

Open-weights Qwen 3.5 models (0.8B to 397B parameters) are released under Apache 2.0, so you can self-host or use any inference provider at no licence cost.

**Data handling:** Alibaba's international Model Studio runs in Singapore and a US (Virginia) region; its documentation says that in US deployment mode both endpoints and data storage are in Virginia. On paper this solves data location. In practice:
- Alibaba is a Chinese company subject to PRC law. Several US states restrict procurement of Chinese-owned AI, and EU scrutiny of Chinese AI providers increased in 2025–2026. For a consumer mental-health product, "stored in Virginia by a Chinese company" is a harder sentence to put in a privacy policy than "stored in Virginia by a US company," regardless of the legal merits.
- Third-party guides note Alibaba "reprices and renames models quarterly." That is operational churn you do not want in a safety-critical pipeline.

**Safety evidence:** none specific to mental health in the public literature I could find. Qwen's English-language warmth and restraint are untested in this domain. The models are strong on benchmarks, especially coding and multilingual tasks.

**Where Qwen is the best choice:** if Aeris someday has a large non-English user base (Qwen is excellent in Chinese and strong in many Asian languages) or needs a self-hosted model for cost at very large scale.

**Fit score: 2.4 / 5** for the MVP. Higher later for scale or multilingual.

---

## 5. Scorecard

Scores 1 (poor) to 5 (excellent). Weights from Section 2.

| Criterion (weight) | Claude | OpenAI | Gemini | DeepSeek (official API) | Qwen (Alibaba intl.) |
|---|---|---|---|---|---|
| Behaviour in sensitive conversations (30%) | 5 | 4 | 3 | 2 | 2 |
| Data handling & legal fit (25%) | 5 | 5 | 3 | 1 | 2 |
| Speed for the read step (15%) | 4 | 4 | 5 | 3 | 3 |
| Writing quality for the Aeris voice (10%) | 5 | 4 | 3 | 3 | 3 |
| Cost (10%) | 3 | 4 | 4 | 5 | 5 |
| Developer / safety features (10%) | 5 | 5 | 4 | 3 | 3 |
| **Weighted total** | **4.6** | **4.3** | **3.5** | **2.3** | **2.6** |

(The "Fit scores" in Section 4 also fold in vendor stability and pricing predictability, which is why OpenAI and Gemini land slightly lower there.)

---

## 6. Cost per session, all realistic configurations

Using the token profile from Doc 11 (read 700 fresh + 3,000 cached input, 450 output; suggestions 400 + 3,000 cached, 120 out; closing 300 + 3,000 cached, 80 out; classifier 900 in / 60 out, 1.5 calls; tags 600 / 60, 0.4 calls). Then multiplied by 2.5 for the real-world margin explained in Doc 11.

| Configuration (read model + classifier) | Raw per session | Planning figure (×2.5) | Per user / month at 12 sessions | 1,000 active users / month |
|---|---|---|---|---|
| Claude Opus 5.5 + Haiku 5.5 | $0.019 | **$0.05** | $0.56 | $560 (up to $1,000 with cold caches; Doc 15 §5) |
| Claude Sonnet 5.5 + Haiku 5.5 (recommended) | $0.0095 | **$0.024** | $0.28 | $280 (up to $500 with cold caches) |
| GPT-6.1 Sol + GPT-6 Luna | $0.010 | **$0.025** | $0.30 | $300 |
| GPT-6.1 Terra + GPT-6 Luna | $0.005 | **$0.013** | $0.16 | $160 |
| Gemini 4 Argon + Flash-Lite (until 30 Nov) | $0.010 | $0.025 | $0.30 | $300 → **$600 from 1 Dec** |
| Gemini 3.8 Flash + Flash-Lite (until 31 Dec) | $0.005 | $0.013 | $0.16 | $160 → **$320 from 1 Jan** |
| DeepSeek Flash (off-peak) | $0.001 | $0.003 | $0.04 | $40 |
| Qwen 3.7 Plus (third-party price) | $0.003 | $0.008 | $0.10 | $100 |

**Read this table correctly:** the gap between the most expensive defensible option (Opus) and the cheapest defensible option (Terra) is **$440 per month at 1,000 active users**, which is roughly 55 Plus subscribers' worth of revenue. At launch, with 100 users, the gap is $44. This is why the recommendation is to start with the model with the best safety evidence and switch only after your own Day-18 blind test shows the cheaper one is as good *for your prompts*.

---

## 7. The recommendation, in full

### Primary stack (build this)

| Step | Model | Settings |
|---|---|---|
| Keyword pre-check | none (code) | — |
| Safety classifier | **Claude Haiku 5.5** | thinking disabled, effort low, structured output, 512 max tokens, 2.5 s timeout → fail to Level 2 |
| Read the moment | **Claude Sonnet 5.5** | effort **low** (test thinking off on Day 18), structured output, streaming, prompt caching, server-side fallbacks on, 1,000 max tokens |
| Worry-sort suggestions, closing line | **Claude Sonnet 5.5** | thinking off (`between_tools`), 400 max tokens |
| Nightly tag extraction | **Claude Haiku 5.5** | batch API |
| Weekly reflection | **Claude Sonnet 5.5** | effort medium, Batch API (50% off); Opus 5.5 via batch if reflections read flat |

This stack was revised from Opus to Sonnet after the deep dive in Doc 15. If the Day 18 blind test shows Opus 5.5 clearly writes better for your prompts (Doc 15 §7, rule 3), switch the read step to Opus. One environment variable.

### Secondary stack (wire it in from Day 15, keep it dormant)

| Step | Model |
|---|---|
| Safety classifier | **GPT-6 Luna** (reasoning effort low) |
| Read / suggest / close | **GPT-6.1 Terra** (reasoning effort low) |
| Weekly reflection | **GPT-6.1 Sol**, Batch API |

**Why wire a second provider at all?**
1. **Outage resilience.** Every provider has had multi-hour outages in 2026. Quick Calm works offline, but the read step needs a model. A dormant fallback that activates on a 5xx or timeout means Aeris degrades gracefully instead of failing.
2. **Negotiating position and price protection.** You are not locked in.
3. **Honest testing.** Your Day-18 blind test is only meaningful if you compare two real providers, not two models from the same company.

**The cost of a second provider:** one more processor in your privacy policy (your lawyer adds a line), one more API key in Supabase secrets, and about half a day of Claude Code's time building a thin "provider adapter" so that both are called through the same interface. Doc 08 §9 already has a single `anthropic.ts` file; this becomes `llm.ts` with two implementations behind one function.

### What not to do
- Do not use any free tier for anything touching user text (Google's free tier explicitly uses your data and may have humans read it).
- Do not route by cheapest-available ("use whichever is cheaper right now"). Model behaviour differs; your safety tests were run on specific models. Switch deliberately, re-run the 60-example test, and record the decision.
- Do not use DeepSeek's or Alibaba's own APIs for the MVP.
- Do not raise the thinking dial above "low" on live steps to "make it smarter." Measure first. The user is waiting.

---

## 8. Things to verify yourself before Day 15 (30 minutes)

1. **Anthropic Usage Policy**, healthcare and consumer-disclosure sections: confirm Aeris's disclosures satisfy it. anthropic.com/legal/aup
2. **OpenAI Usage Policies**, the same. openai.com/policies/usage-policies
3. **If you still want Gemini as an option**, have your lawyer read the "clinical practice / medical advice" clause and the safety-settings review clause in the Gemini API Additional Terms against your product. ai.google.dev/gemini-api/terms
4. **Current prices** on each official pricing page the week you launch. Google has announced increases; OpenAI reshuffled its lineup twice in September 2026.
5. **Zero Data Retention eligibility.** Both Anthropic and OpenAI offer it by agreement. Ask both sales teams once you have paying users; a small company may or may not qualify. Do not promise it in your privacy policy until you have it in writing.

---

## 9. Sources

Official pages read on 31 October 2026:
- OpenAI API pricing: https://openai.com/api/pricing/ (served as /business/pricing/#api)
- OpenAI "Your data" (retention, training, ZDR): https://platform.openai.com/docs/guides/your-data
- Google Gemini API pricing: https://ai.google.dev/gemini-api/docs/pricing
- Google Gemini API Additional Terms (effective 23 March 2026): https://ai.google.dev/gemini-api/terms
- DeepSeek models & pricing: https://api-docs.deepseek.com/quick_start/pricing
- DeepSeek privacy policy (10 Feb 2026): https://cdn.deepseek.com/policies/en-US/deepseek-privacy-policy.html
- Anthropic data retention (1 July 2026): https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data
- Alibaba Cloud Model Studio model list: https://www.alibabacloud.com/help/en/model-studio/models (prices not shown on this page; third-party figures used and flagged)

Research and reporting:
- RAND Corporation press release and Psychiatric Services paper on chatbot responses to suicide questions (2025): https://www.rand.org/news/press/2025/08/ai-chatbots-inconsistent-in-answering-questions-about.html and https://psychiatryonline.org/doi/10.1176/appi.ps.20250086
- JMIR Mental Health, "Competency of LLMs in Evaluating Appropriate Responses to Suicidal Ideation" (2025): https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11928068/
- OpenAI, "Strengthening ChatGPT responses in sensitive conversations" (October 2025): https://openai.com/index/strengthening-chatgpt-responses-in-sensitive-conversations/
- Anthropic, "Protecting the well-being of users" (December 2025): https://anthropic.com/news/protecting-well-being-of-users
- Anthropic, "How people use Claude for support, advice, and companionship" (June 2025), via Axios: https://www.axios.com/2025/06/26/anthropic-claude-companion-therapist-coach
- VERA-MH open-source mental-health safety benchmark (Spring Health; validation study in JMIR AI 2026): https://arxiv.org/abs/2510.15297 and https://arxiv.org/pdf/2602.05088
- HalBench community sycophancy benchmark coverage (May 2026): https://aiweekly.co/alerts/sonnet-46-tops-3200-prompt-sycophancy-benchmark
- Sycophancy benchmark review noting ELEPHANT results: https://arxiv.org/html/2605.21778
- DHS DeepSeek ban coverage (October 2026): https://cyberscoop.com/dhs-bans-deepseek-federal-agencies/
- STAT News on Woebot's shutdown (July 2025): https://www.statnews.com/2025/07/02/woebot-mental-health-chatbot-shuts-down-founder-says-ai-moving-faster-than-regulators/
- GPT-6 lineup and effort levels (secondary; verify in OpenAI docs): https://www.datalearner.com/en/ai-models/pretrained-models/gpt-6-astra and https://aiwiki.ai/wiki/gpt_6_1_sol/raw
- Qwen pricing (third-party, unverified): https://benchlm.ai/alibaba/api-pricing and https://inferencehub.org/blog/alibaba-cloud-qwen-api-pricing-2026/
