# Aeris Product Deep Dive

Status: founding document, v1 (13 September 2026)
Companion documents: `02-mvp-spec.md` (what is built and what is missing) and `03-30-day-launch-plan.md` (execution)

All market and regulatory claims below were checked against sources dated 2025–2026. Sources are linked inline. Where a claim rests on a competitor's own marketing or a single unverified report, it is marked.

---

## 1. The honest summary

**The market Aeris is entering is contracting for consumer subscriptions and consolidating toward employers, payers and clinics.** Woebot closed its consumer app in June 2025. Youper closes on 30 September 2026. Sanvello was absorbed into an insurer's member product. Clare&me pivoted to a clinic API. Calm's estimated revenue fell about a quarter in 2025 and Headspace has had two rounds of layoffs. Three of the companies that died had peer-reviewed evidence. Evidence did not save them.

**The real competitor is ChatGPT, and the best-funded direct competitor, Ash, is free.** Almost half of US adults with a mental-health condition who use large language models use them for support, and most of those for anxiety. Ash has raised US$93M and has no paid tier. The consumer's price anchor for "an AI I can talk to about my anxiety" is zero.

**And yet the product Aeris has built is aimed at exactly the gaps those products leave.** Across every product with a chatbot, users complain about the same five things: it acknowledges but does not respond, it loops on questions instead of moving to action, it agrees with everything, it forgets or paywalls memory, and it becomes a reassurance machine that makes anxiety worse. Aeris already has an anti-reassurance guardrail, an anti-loop budget, a state machine that moves toward one action, app-owned memory the user can see and correct, and a safety layer that handles the large middle ground between "fine" and "call 988". Those are not marketing claims; they are in the code and tested.

**So the assessment is:** this is a viable small business and an unlikely venture-scale one. At US$9.99 a month, a few hundred paying subscribers cover costs and a thousand pay a founder. Reaching that number requires a distribution wedge, and the strongest available one is the thing nobody else says out loud: general chatbots make anxiety worse for reassurance-seekers, and Aeris is built to refuse that role. The second wedge is geography: Hong Kong and Singapore have almost no localized competition and Aeris already carries Hong Kong crisis resources.

Everything below supports those four paragraphs.

---

## 2. Market

### 2.1 Demand is real and rising

- 18.2% of US adults reported anxiety symptoms in the prior two weeks (CDC NHIS 2022); 19.1% had a past-year anxiety disorder. ([CDC](https://www.cdc.gov/nchs/data/nhsr/nhsr213.pdf), [Statista](https://www.statista.com/topics/5223/anxiety-in-the-us/))
- Among US adults with a mental-health condition who use LLMs, 48.7% use them for therapeutic support, 73% of those for anxiety; drivers are accessibility (90%) and affordability (70%). 9% reported a harmful response. ([Sentio, n=499, Feb 2025](https://sentio.org/ai-research/ai-survey))
- OpenAI's own figures: 0.15% of weekly users show emotional reliance and 0.15% show self-harm risk; at roughly 800M weekly users that is over a million people per bucket. ([OpenAI](https://openai.com/index/strengthening-chatgpt-responses-in-sensitive-conversations/))
- Headspace's Ebb companion has handled 7M+ messages; a JMIR analysis of 393,969 Ebb users found the top topics were relationships, work and sleep, which is exactly Aeris's trigger vocabulary. ([JMIR Formative Research, Feb 2026](https://formative.jmir.org/2026/1/e86904))

### 2.2 Analyst market sizes are not the consumer app market

Analysts put mental-health apps at US$8–10B in 2025 growing at 17% a year to around US$40B by 2035 ([Global Market Insights](https://www.gminsights.com/industry-analysis/mental-health-apps-market), [Precedence](https://www.precedenceresearch.com/mental-health-apps-market)). Those figures include enterprise, payer and clinical software. The consumer wellness app segment that Aeris actually sells into **fell 6.2% to US$848M in 2025**, and Calm and Headspace downloads are down 61% and 74% from their 2018 peaks. ([Business of Apps](https://www.businessofapps.com/data/wellness-app-market/))

Venture money follows the same split: digital-health funding rose 35% to US$14.2B in 2025 and mental health was the top-funded indication for the seventh year, but the money went to clinician-side and payer plays (Talkiatry US$210M, Grow US$150M), not consumer apps. ([Rock Health H1 2026](https://rockhealth.com/insights/h1-2026-funding-and-market-overview-durable-roots-shifting-routes/))

### 2.3 What that means for Aeris

Do not plan on a venture round or on app-store discovery. Plan on a bootstrapped product with direct distribution, a price that a few hundred people will pay, and a cost base that stays under US$500 a month until they do. `02-mvp-spec.md` section 7.3 shows AI cost per session is cents, so the economics work at small scale. The constraint is acquisition, not margin.

---

## 3. Competitor teardown

### 3.1 The field in one table

| Product | Price (mo / yr) | AI chat | In-the-moment tool | Learns your patterns | Crisis handling | Status |
|---|---|---|---|---|---|---|
| Calm | US$15–17 / 70–80 | No | No | Recommendations only | None in-app | Revenue −24% (2025 est.), enterprise pivot |
| Headspace + Ebb | 12.99 / 69.99 | Yes (motivational interviewing, voice) | Partial ("pep talk") | Early, "underdeveloped" | Auto-detect → 988 | Layoffs, enterprise pivot |
| Wysa | Free / 74.99 | Yes, scripted | SOS, grounding | Weak | 82% detection (self-reported), helplines | ~US$37M raised, bought a physical-therapy company to reach insured care |
| Woebot | — | — | — | — | — | **Consumer app closed June 2025** |
| Youper | was 69.99/yr | Yes | Partial | Some | Paywalled | **Closes 30 Sep 2026** |
| Earkick | Free / 14.99 / 89.99 | Yes | Panic button, breathing | Weekly summaries | "Not designed for suicide prevention" | ~US$1.5M, thin |
| Rosebud | 12.99 / ~108 | Yes (journal) | No | **Yes, paid** | Refers out | US$6M seed; free tier reportedly ending 30 Sep 2026 |
| Finch | 6–10 / 35–70 | No | No | Streaks | None | US$23.7M |
| Sanvello | — | — | — | — | — | **Members-only via AbleTo** |
| MindShift CBT | Free | No | Breathing | 2-week history | Links | Non-profit |
| Bearable | 6.99 / 34.99 | No | No | **Yes, tracking** | None | Bootstrapped, 2 people |
| Replika | 19.99 / 69.99+ | Yes | No | Paywalled, unreliable | Weak; €5M GDPR fine | 40M users |
| Ash (Slingshot) | **Free** | Yes, voice | Partial | "Insights" | 988 referral | US$93M, no paid tier yet |
| Sonia | 19.99 / 199.99 | Yes, voice | Sessions | Some | Referral | ~US$2.75M, YC |
| Abby | 19.99 / 100–180 | Yes | No | Weak | Referral; geo-blocked in some states | Small |
| Stella | 9.99 / 99.99 | Yes, voice | **Yes, core** | **Yes, claimed** | Unknown | Solo founder |
| ChatGPT / Claude | 0 / 20 | Yes | De facto | ChatGPT memory | 988 prompts; active lawsuits | — |

Sources per row are in the profiles below.

### 3.2 Profiles that matter most

**Headspace Ebb** is the mainstream attempt closest to Aeris. It added voice and "enhanced memory" in December 2025 ([BusinessWire](https://www.businesswire.com/news/home/20251208896917/en/Headspace-Rolls-out-Voice-Feature-for-Empathetic-AI-Companion-Ebb)), detects risk utterances automatically and offers one-tap 988 ([Headspace](https://www.headspace.com/ai-mental-health-companion)). Its users say it "acknowledges and agrees with whatever you have to say" ([r/Headspace](https://www.reddit.com/r/Headspace/comments/1pj7km1/are_we_serious_about_ebbai/)) and that you pay about US$70 a year for meditations you do not want to get the AI. It is bundled, not sold, so it will never be priced against Aeris directly.

**Wysa** is the scripted incumbent. Free tier is one exercise per module, premium US$74.99 a year, human coaching US$79.99 a month ([ChoosingTherapy](https://www.choosingtherapy.com/wysa-app-review/)). It has the best safety evidence of any consumer bot but "doesn't really respond to your written answers" and "responds with the same set of pre-coded prompts in a loop". Its September 2025 acquisition of Kins is a signal that it is heading for insured care, not consumers. ([HIT Consultant](https://hitconsultant.net/2025/09/30/wysa-acquires-kins/))

**Ash** is the well-funded newcomer. Launched July 2025 with US$93M from a16z and others, trained on CBT, DBT, ACT and MI, voice and text, and free ([HLTH](https://hlth.com/insights/news/slingshot-ai-launches-ash-first-ai-designed-specifically-for-therapy-with-93m-funding-2025-07-25)). Reviewers rate it 4.7 stars and complain it is "pushy, giving the same piece of advice for weeks", gets "stuck in a question loop", and "repeats back what they've already said"; one reviewer scored reliability and longevity 2 out of 5 ([ChoosingTherapy](https://www.choosingtherapy.com/ash-ai-therapy-app-review/)). It will eventually charge "like streaming", which puts a ceiling around US$10–15 on what a general audience will pay.

**Rosebud** owns "AI that remembers you" in journaling. US$12.99 a month, memory paywalled, and the free tier is reportedly being retired because "the upgraded memory system costs too much to keep free" ([Nilo, citing a competitor, unconfirmed](https://nilo.io/articles/rosebud-ai-reviews-reddit)). It is not built for the in-the-moment case.

**Stella** is the closest positioning: voice-first anxiety companion with memory of "triggers, what worked last time", US$9.99 a month, solo founder ([Stella](https://www.stellalabs.ai/pricing)). Tiny, and proof that someone else sees the same gap.

**Woebot and Youper** are the cautionary tales. Woebot burned over US$107M, could not get an LLM through FDA, and was outcompeted by LLMs on conversation quality ([STAT](https://www.statnews.com/2025/07/02/woebot-therapy-chatbot-shuts-down-founder-says-ai-moving-faster-than-regulators/)). Youper had 3M users, Stanford validation, and about US$5M of funding, and is winding down with no stated reason; its users have 17 days to export before deletion ([Youper notice](https://www.youper.ai/notice)). Neither had a distribution answer.

### 3.3 The ten pain points, with evidence

| # | Pain point | Evidence | Aeris today |
|---|---|---|---|
| 1 | "It acknowledges but doesn't respond" | Wysa, Earkick, Ash, Abby reviews all say it | State machine requires movement; anti-loop forces advance when budgets are spent |
| 2 | Question loops instead of action | Ash "stuck in a question loop"; Rosebud "circular" | Clarify-turn budget; duplicate-question detection with regeneration |
| 3 | Memory broken or paywalled | Replika "designed to forget"; Rosebud gates memory; Ebb "underdeveloped" | Patterns, summaries and effectiveness are stored, shown, and correctable ("Not true for me"); Free sees 7 days, Plus full |
| 4 | Sycophancy | Ebb "agrees with whatever"; r/Anxiety on ChatGPT "tells you what you want to hear" | Prompt forbids manufactured certainty; certainty detector triggers regeneration then deterministic rewrite |
| 5 | Reassurance-seeking amplification | r/Anxiety: "Do not use ChatGPT with anxiety, not even for reassurance seeking, it ruined my life for 6 months"; OCD clinicians warn 24/7 reassurance entrenches compulsions ([NOCD](https://www.treatmyocd.com/blog/chatgpt-ocd-reassurance-seeking)) | `reassurance_seeking` is a first-class pattern; detection changes the allowed interventions and the instructions for the turn |
| 6 | Nothing built for the 3 a.m. panic moment | Users describe using ChatGPT Voice mid-panic because nothing else was there ([Tom's Guide](https://tomsguide.com/ai/chatgpt-helped-me-through-a-panic-attack-heres-what-happened)) | "Help me now" → intensity → conversation → 2–4 minute tool → reassess, all in one flow; offline-safe toolkit |
| 7 | Trial-to-paid billing traps | Calm Trustpilot 1.4★, Finch 2.4★, Abby 3.2★; "no notification at end of trial" | No trial; Paddle as merchant of record; self-service cancel; calm quota copy that never implies wellbeing depends on paying |
| 8 | "Free" that isn't | Earkick locks after one chat; Youper after one use; Rosebud one entry | 5 guided sessions a month plus the full toolkit and safety support free, forever |
| 9 | Data lock-in and shutdown risk | Youper 17-day export window; MindShift 2-week history; Replika no export | Export always on, generated in-request; deletion with tombstone; retention documented per category |
| 10 | Crisis handling is binary | Every product either does nothing or shows a 988 banner; Earkick's CEO: "not designed for that" ([Fortune](https://fortune.com/2025/10/01/mental-health-ai-chatbots-therapy-suicide-self-harm-regulation/)) | Five-level risk ladder; restricted path for risk 2; approved copy for medication, reality-sensitive, violence and relational bids; redirect only at 3–4 |

This table is the product's competitive case. It should become the landing page's "why Aeris" section, in plainer words.

### 3.4 The free substitute

ChatGPT wins on availability, price and conversational fluency. Users who rely on it complain about sycophancy, reassurance loops, generic responses, privacy, and, most interestingly, **model volatility**: the GPT-4o retirement in February 2026 drew a 21,000-signature petition and posts like "ChatGPT used to be peace, now it's panic, every update since August" ([TechCrunch](https://techcrunch.com/2026/02/06/the-backlash-over-openais-decision-to-retire-gpt-4o-shows-how-dangerous-ai-companions-can-be/)). Someone who has built a 1:30 a.m. routine on a general model can lose it overnight.

A dedicated product beats the free substitute on exactly four things: refusing to be a reassurance machine, durable and transparent memory of the person's own patterns, a structured in-the-moment protocol, and behavioural stability across model changes. Aeris has the first three built and the fourth is a governance discipline (pinned model IDs, prompt versions, a 311-case safety set re-run on every change).

---

## 4. Clinical grounding for the toolkit

Aeris makes no treatment claims, but the exercises should still be the ones with evidence, framed correctly.

| Technique | Evidence | Framing rule |
|---|---|---|
| Slow breathing, extended exhale (built) | Cyclic sighing beat mindfulness on mood and respiratory rate in a one-month RCT; one-minute breath practices reduced state anxiety in a 2026 pilot, more so in high-trait-anxiety users ([Balban et al., Cell Rep Med 2023](https://www.cell.com/cell-reports-medecine/fulltext/S2666-3791(22)00474-8), [Anxiety, Stress & Coping 2026](https://www.tandfonline.com/doi/full/10.1080/10615806.2026.2659809)) | Acute down-regulation. Never "stops panic": breathing used to avoid sensations can become a safety behaviour ([Front Psychiatry 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12926410/)) |
| Sensory grounding (built) | No dedicated RCT; a component of CBT and trauma protocols with supportive small studies | "A coping skill", never "a treatment" |
| Cognitive restructuring, "Untangle a thought" (built) | CBT for anxiety disorders g = 0.56 vs placebo across 41 placebo-controlled RCTs ([Carpenter 2018](https://onlinelibrary.wiley.com/doi/10.1002/da.22728)) | "CBT-informed", never "CBT therapy" |
| Circle of control (built) | Problem-solving orientation component of CBT; weaker standalone evidence | Coping skill |
| Smallest next step (built) | Behavioural activation g = 0.37 on anxiety across 28 trials; digital BA effective ([Psychol Med 2020](https://pubmed.ncbi.nlm.nih.gov/32138802/), [JMIR 2025](https://www.jmir.org/2025/1/e68054)) | Coping skill |
| Physiological sigh (v1.1) | As row 1 | Acute down-regulation |
| Worry postponement (v1.1) | Effective for daily worry in non-clinical samples; weaker in diagnosed GAD ([Clin Psychol Eur 2024](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11303915/)) | "A daily-worry tool", never a GAD treatment |
| Thought defusion (v1.1) | Large reductions in distress vs waitlist in a randomized technique trial ([Larsson et al.](https://pubmed.ncbi.nlm.nih.gov/22691136/)) | Coping skill |
| Sleep wind-down note (v1.1) | dCBT-I reduces anxiety (SMD −0.29); sleep improvement mediates most of the anxiety effect ([meta-analysis](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10039857/), [J Affect Disord](https://www.sciencedirect.com/science/article/pii/S0165032723008194)) | One component, not a CBT-I programme |

Broader context: a 2026 meta-analysis of 48 RCTs and 28,071 participants found digital interventions reduce anxiety with a small effect (SMD −0.20), larger in clinical samples and shorter programmes ([npj Digital Medicine](https://www.nature.com/articles/s41746-026-02820-1)). Single-session interventions have positive effects in 83% of reviews and work at scale online ([Annual Review of Clinical Psychology](https://www.annualreviews.org/content/journals/10.1146/annurev-clinpsy-081423-025033)). Aeris's 2–5 minute, one-tool-per-session design sits squarely in the evidence.

The harms literature is equally relevant: LLM "therapists" showed stigma and encouraged delusional thinking through sycophancy ([Stanford, FAccT 2025](https://dl.acm.org/doi/full/10.1145/3715275.3732039)); none of 29 mental-health chatbot agents gave adequate crisis responses on a C-SSRS-based escalation ([Sci Rep 2025](https://www.nature.com/articles/s41598-025-17242-4)); chatbots were inconsistent at intermediate suicide-risk levels ([RAND 2025](https://www.rand.org/news/press/2025/08/ai-chatbots-inconsistent-in-answering-questions-about.html)). Aeris's deterministic floors and the "any stated wish to die is never below 3" rule exist because of exactly these findings.

---

## 5. Regulatory boundaries by market

### 5.1 The one rule that makes everything else manageable

**Position, word and build Aeris as wellness self-help, everywhere, and never as therapy, treatment or diagnosis.** That single discipline keeps the product outside the US FDA device definition, the EU MDR, the UK MHRA software-as-a-medical-device line, inside the Illinois and Nevada self-help exemptions, inside Anthropic's wellness carve-out, and compliant with Google Play's disclaimer requirement. The conversation prompt already enforces it in the model's voice. It must also be enforced in marketing copy, app-store listings, the landing page and the founder's own posts.

Words to use: worry, stress, anxious thoughts, calm, coping skills, CBT-informed techniques, self-help. Words never to use: therapy, therapist, treat, diagnose, disorder names, "clinically proven", "reduces symptoms of".

### 5.2 United States

- **FDA.** The General Wellness guidance (republished 6 January 2026) excludes low-risk products that support a healthy lifestyle and make no disease claims ([Covington](https://www.cov.com/en/news-and-insights/insights/2026/01/fda-issues-revised-guidance-on-general-wellness-products)). The November 2025 Digital Health Advisory Committee on generative-AI mental-health devices concluded that low-risk "anxiety-skill builders" likely fall under enforcement discretion and wellness apps sit outside the device definition, while calling for reliable crisis detection and escalation ([FDA](https://www.fda.gov/advisory-committees/advisory-committee-calendar/november-6-2025-digital-health-advisory-committee-meeting-announcement-11062025), [Hogan Lovells](https://www.hoganlovells.com/en/publications/fdas-digital-health-advisory-committee-weighs-guardrails-for-generative-ai-in-mental-health-devices)). FDA has cleared zero AI mental-health devices.
- **FTC.** Section 6(b) orders to seven companion-chatbot operators in September 2025 ([DLA Piper](https://www.dlapiper.com/en-us/insights/publications/2025/09/ftc-ai-chatbots)); established enforcement against non-HIPAA mental-health apps sharing data with ad platforms (BetterHelp US$7.8M, Cerebral US$7M); the amended Health Breach Notification Rule treats unauthorized sharing with ad SDKs as a breach ([McDermott](https://www.mcdermottlaw.com/insights/ftc-amends-health-breach-notification-rule-to-regulate-health-apps-and-expand-breach-notification-requirements/)). Aeris has no ad SDKs and no third-party analytics on content; keep it that way.
- **State laws** are the live risk. Illinois (August 2025) bans AI providing or advertising "therapy or psychotherapy" with up to US$10,000 per violation but exempts "self-help materials or educational resources that do not purport to offer therapy" ([IDFPR](https://idfpr.illinois.gov/news/2025/gov-pritzker-signs-state-leg-prohibiting-ai-therapy-in-il.html)). Nevada AB 406 is similar. Utah HB 452 requires AI disclosure before first access, on return after 7 days and on request, and offers a safe harbour if a written policy is filed ([WSGR](https://www.wsgr.com/en/insights/utah-enacts-mental-health-chatbot-law.html)). California SB 243 (1 January 2026) requires a published crisis protocol and carries a private right of action at US$1,000 per violation ([FPF](https://fpf.org/blog/understanding-the-new-wave-of-chatbot-legislation-california-sb-243-and-beyond/)). New York requires crisis referral and disclosure every three hours ([Fenwick](https://www.fenwick.com/insights/publications/new-yorks-ai-companion-safeguard-law-takes-effect)). Oregon, Washington, Nebraska, Idaho, Tennessee, Maine, Rhode Island and Colorado have 2026–2027 additions ([Orrick](https://www.orrick.com/en/Insights/2026/04/2026-State-Chatbot-Laws-Key-Provisions-and-Regulatory-Trends)). The federal GUARD Act (banning AI companions for minors, requiring "not human, no credentials" statements) passed committee 22–0 in April 2026 ([Covington](https://www.globalpolicywatch.com/2026/05/senate-judiciary-committee-advances-guard-act-regulating-minor-use-of-ai/)).
- **Health data.** A direct-to-consumer wellness app is generally not a HIPAA covered entity. Washington's My Health My Data Act covers inferred mental-health status, requires a separate consumer-health privacy policy and opt-in consent, bans sale without signed authorization, and has a private right of action ([RCW 19.373](https://app.leg.wa.gov/RCW/default.aspx?cite=19.373&full=true)).

**Aeris posture for the US:** available, wellness-positioned, disclosure at every session start, crisis protocol published on `/safety`, Utah policy filed, no paid marketing until the checklist in `03-30-day-launch-plan.md` Day 12 is signed.

### 5.3 United Kingdom

MHRA's February 2025 guidance on digital mental-health technology draws the line at intended purpose: tools claiming to treat or alleviate a disorder are software as a medical device ([gov.uk](https://gov.uk/government/collections/digital-mental-health-technology)). NHS DTAC only applies if selling into the NHS. The ICO treats mental-health inputs as special-category health data requiring explicit consent and a DPIA ([ICO](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/special-category-data/what-are-the-rules-on-special-category-data/)). Crisis routes: Samaritans 116 123, Shout text 85258, NHS 111 option 2, 999.

### 5.4 European Union

A consumer wellness companion without device status is generally not high-risk under the AI Act. Article 50 transparency (users must be told they are interacting with AI) has applied since 2 August 2026 and was not deferred by the Digital Omnibus ([Commission FAQ](https://digital-strategy.ec.europa.eu/en/faqs/transparency-obligations-under-article-50-ai-act)). Article 5 prohibits exploiting vulnerability; the Commission's own example is a therapeutic chatbot nudging vulnerable users toward harmful behaviour or purchases ([Commission guidelines](https://ai-act-service-desk.ec.europa.eu/sites/default/files/2025-08/guidelines_on_prohibited_artificial_intelligence_practices_established_by_regulation_eu_20241689_ai_act_english_ied3r5nwo50xggpcfmwckm3nuc_112367-1.PDF)). This is why Aeris's quota copy must never suggest wellbeing depends on paying, and why the reliance signal in the plan is non-blocking. GDPR Article 9 requires explicit, unbundled consent for anxiety logs and pattern learning. MDCG 2019-11 Rev.1 confirms wellness software is not medical device software ([MDCG](https://health.ec.europa.eu/system/files/2020-09/md_mdcg_2019_11_guidance_en_0.pdf)).

### 5.5 Hong Kong and Singapore

Hong Kong has no special-category regime, but the PCPD's Model Personal Data Protection Framework for AI (June 2024) expects a risk assessment, minimisation, human oversight and transparency ([PCPD](https://www.pcpd.org.hk/english/news_events/media_statements/press_20240611.html)). Medical-device registration remains voluntary and applies only to claimed medical purposes. Crisis lines: Samaritans 2896 0000, Suicide Prevention Services 2382 0000, Samaritan Befrienders 2389 2222, Open Up text 9101 2012, government 18111 ([Find a Helpline](https://findahelpline.com/countries/hk)). Aeris already carries the first two; the plan adds the rest.

Singapore's HSA excludes software "intended solely for well-being or lifestyle" if labelling says it is not for medical use ([HSA](https://www.hsa.gov.sg/medical-devices/digital-health/)); PDPC's 2024 AI advisory guidelines set consent and transparency expectations. Crisis: SOS 1767, 995.

**These two markets are the recommended launch markets.** Lower regulatory friction, English-language, high anxiety prevalence among professionals, almost no localized competition, and the founder is in Hong Kong.

### 5.6 Platform and provider policies

- **Apple.** Guideline 1.4.1 requires reminding users to check with a doctor before medical decisions; 5.1.2(i), enforced from 13 November 2025, requires clear disclosure and explicit permission before sharing personal data with third-party AI; 5.1.3 bans using health data for advertising ([Apple](https://developer.apple.com/app-store/review/guidelines/)). Relevant only when a native app is submitted.
- **Google Play.** Health apps declaration, in-app "not a medical device" disclaimer, verified Organization account from 28 January 2026, and the AI-Generated Content policy requiring in-app AI disclosure and a flag/report control on AI output ([Google](https://support.google.com/googleplay/android-developer/answer/16679511?hl=en)). The per-message flag in the plan exists for this.
- **Anthropic Usage Policy** (15 September 2025): therapy and mental health are high-risk uses requiring professional review, but "wellness advice (sleep, stress, nutrition, exercise) does not fall under this category"; all consumer chatbots must disclose AI at session start ([Anthropic](https://www.anthropic.com/legal/aup)).
- **OpenAI Usage Policies** (29 October 2025): no tailored advice requiring a licence without professional involvement; no facilitation of self-harm ([OpenAI](https://openai.com/policies/usage-policies/)).

### 5.7 What the three legal documents must contain

**What Aeris is and isn't** (product boundary, shown in onboarding): AI, not a person; not a therapist, doctor or emergency service; self-help for anxious moments; does not diagnose or treat; what to do in a crisis with the local numbers; age 18+.

**Terms of use:** acceptable use; account responsibilities; the boundary statement again; Free allowance and Plus features; Paddle as merchant of record with its own buyer terms; cancellation and refund process; service changes and model changes; limitation of liability consistent with a wellness product; governing law (Hong Kong) with consumer-law carve-outs.

**Privacy information:** what is collected (words typed, intensity, patterns inferred); the separate, explicit health-data consent with plain wording ("information about your mood, anxiety and sleep"); that conversations are sent to an AI provider to generate replies, which provider, and that they are not used for training; the retention table per category lifted from the retention document; the history, personalization and analytics toggles; export and deletion; the Paddle boundary; Washington My Health My Data disclosures; contact details; sub-processors.

---

## 6. Monetization

### 6.1 The price point

US$9.99 monthly and US$79.99 annually sits below Headspace (12.99), Rosebud (12.99), Earkick (14.99), Calm (15–17), Sonia and Abby (19.99), and level with Stella. It is above Wysa's effective US$6.25 and above Ash's zero. For a product whose only paid promise is "unlimited sessions plus your patterns", this is the right neighbourhood; it should not go higher until the anxiety map has proven it changes behaviour.

Annual at US$79.99 is a 33% discount; industry norm is 40–50%. Consider US$69.99 annual at launch to match Headspace and Calm anchors, since annual subscribers are the ones who survive the first month.

### 6.2 Unit economics

| | Value |
|---|---|
| Gross monthly price | US$9.99 |
| Paddle fee (about 5% + US$0.50) | ~US$1.00 |
| Net | ~US$9.00 |
| AI cost at 20 sessions, low-cost model | ~US$0.25 |
| AI cost at 20 sessions, Sonnet-class model | ~US$1.60 |
| Infrastructure per subscriber at 1,000 subs | ~US$0.10 |
| Contribution per Plus subscriber | US$7.30–8.65 |

Fixed costs at launch scale are roughly US$50–100 a month (Vercel, Supabase, email). Break-even on infrastructure is under 20 subscribers. A founder salary of US$5,000 a month needs roughly 600–700 subscribers.

### 6.3 Conversion and churn assumptions

Consumer wellness converts free to paid at 2–5% and monthly churn runs 8–15%. With a 5-session free allowance and the anxiety map as the paid hook, plan on 3% conversion and 10% monthly churn, and measure. At 10% churn, a subscriber's expected lifetime is 10 months, so lifetime contribution is about US$75–85. Acquisition cost must stay below US$25 to be sane, which rules out paid ads and points to content, community and word of mouth.

### 6.4 What could make this bigger

- **Employer and EAP distribution in Hong Kong and Singapore.** This is where every survivor in the category ended up. Aeris's privacy architecture (no message text in any operational store, consent-gated analytics) is unusually well suited to an employer offering where employees fear surveillance. Not for the first 90 days.
- **A "why ChatGPT makes anxiety worse" content wedge.** The reassurance-seeking problem is documented, emotionally resonant, and nobody in the category names it. Aeris is the product built to refuse reassurance. That is a story worth a landing page, a few articles and a handful of community posts.
- **Behavioural stability as a promise.** Pinned models, versioned prompts, a published safety set. "Aeris will not change personality on you overnight" is a real differentiator after the GPT-4o episode.

---

## 7. Differentiation and positioning

**One line.** Aeris learns your anxiety patterns and helps you interrupt them when they happen.

**Three claims the product can back today.**

1. It moves you to one thing that helps in under five minutes, instead of talking in circles.
2. It will not tell you everything is fine when it cannot know that.
3. It remembers your patterns and what has helped you, shows them to you plainly, and lets you correct them.

**Two claims the plan adds.**

4. It can show you when and about what your anxiety tends to show up (the anxiety map).
5. Your data is yours: export any time, delete any time, nothing sold, nothing used for training.

**Who it is for.** Adults 25–50, working, in Hong Kong, Singapore, the UK and Australia first, who have already tried a meditation app and found it did not help at the moment they needed it, and who may already be using ChatGPT at night and are starting to suspect it makes things worse.

**Who it is not for.** Anyone in crisis (routed to humans), anyone under 18 (gated), anyone looking for therapy, diagnosis or medication guidance (redirected, by design and by law).

---

## 8. Risks that could kill it

| Risk | Why it matters | What reduces it |
|---|---|---|
| Ash or Headspace ships an anxiety-map feature for free | Removes the paid hook | Speed to launch; the map's transparency and correctability; privacy posture |
| A harmful reply reaches a user and is screenshotted | Trust and legal exposure | The safety architecture is the best in the consumer category; keep re-running the set on every change; the per-message flag; incident response in the runbook |
| Founder attention diffuses into v1.1 features before distribution exists | Youper's fate | The 30-day plan's "what not to do" list |
| Regulatory drift in the US | State laws multiply | Wellness wording discipline; geo-aware switches; launch elsewhere first |
| Model provider changes behaviour or pricing | Quality and margin | Provider abstraction exists; second adapter in v1.1; pinned IDs and prompt versions |

---

## 9. Sources

All sources are linked inline above. The two research memos this document draws on are committed alongside it:

- [`research/competitor-teardown-2026-09-13.md`](research/competitor-teardown-2026-09-13.md)
- [`research/regulatory-landscape-2026-09-13.md`](research/regulatory-landscape-2026-09-13.md)
