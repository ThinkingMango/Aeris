> **SUPERSEDED (31 October 2026).** This is version 1 of the plan, kept for the record. It contains known errors and overclaims, listed with their corrections in [docs/03-review-log.md](../../03-review-log.md). Do not build from this file. The current plan starts at [docs/00-START-HERE.md](../../00-START-HERE.md).

# 03 — Regulatory Risks

**Plain-English summary first:** You are allowed to build a wellness app that helps people feel calmer. You are not allowed to build, or *sound like you are building*, a therapist, a doctor, or a treatment. The line between those two is mostly about (1) the words you use, (2) how you handle crisis, (3) how you handle data, and (4) in some places, specific disclosures. This document tells you where the line is in 2026 and how to stay on the safe side.

**I am not a lawyer. This is not legal advice.** It is a map so that your one hour with a real lawyer is efficient and cheap. Several of these laws are brand new and some details (exact penalties, exact definitions) differ between sources. The 30-day plan budgets for a lawyer review on Day 22.

---

## 1. The big picture in 2026

Three forces have shaped the rules:

1. **Medical device regulators (FDA in the US, MHRA in the UK, etc.)** draw a line between "general wellness" (not regulated) and "medical device" (heavily regulated). The US FDA issued an updated *General Wellness: Policy for Low Risk Devices* guidance on **6 January 2026** that keeps the basic rule: if your product is intended only for general wellness and is low-risk, FDA does not regulate it as a device. The moment you claim to diagnose, treat, cure, or mitigate a *disease or condition* (like "anxiety disorder" or "GAD"), you cross the line.
2. **State and national AI chatbot laws** arrived in a wave in 2025–2026, specifically targeting "companion" and "mental health" chatbots. These add disclosure, crisis-protocol, data, and advertising rules on top of everything else.
3. **Privacy and consumer-protection regulators (FTC in the US, ICO in the UK, data protection authorities in the EU)** treat mental-health data as the most sensitive category there is, and have fined companies for mishandling it.

Woebot, the most credible company in this exact space, left the consumer market in June 2025 because of force number 1. You avoid Woebot's fate by never making the claims that put them in FDA's territory in the first place.

---

## 2. Risk register

Each risk gets: what it is, how likely it is to bite, how bad it is, and what we do about it.

| # | Risk | Likelihood | Severity | Mitigation (built into the plan) |
|---|---|---|---|---|
| R1 | Being classified as a **medical device** because of your claims | Medium if careless, Low if disciplined | Fatal (Woebot) | Strict marketing language rules (Section 4). No disease names. No "treat." No clinical screening questionnaires (no GAD-7, PHQ-9). |
| R2 | Falling under a **state "AI therapy" ban** (Illinois, Nevada) | Low if positioned as wellness | High (fines, forced withdrawal from a state) | Never call it therapy, counselling, or treatment. Never claim to be a licensed anything. Clear "not a therapist" disclosure. |
| R3 | **AI companion/chatbot disclosure laws** (New York, California SB 243, Utah, others) | High: you will almost certainly be in scope of at least one | Medium (fines per violation; California allows users to sue) | AI disclosure at start of every session; crisis protocol; New York-style 3-hour reminder in long sessions; publish your crisis protocol; age gate 18+. |
| R4 | **Privacy breach** of anxiety data | Medium (most common real-world failure for small apps) | High (regulatory fines, loss of all trust, lawsuits under WA MHMDA / CA) | Row Level Security, encryption, data minimization, deletion, no third-party trackers, security review before launch (Doc 09, Doc 10). |
| R5 | **FTC Health Breach Notification Rule** (US) | Low–Medium | Medium | Applies to health apps that are not covered by HIPAA. If you have a breach, you must notify users and the FTC. Have the plan written before you need it. |
| R6 | **Sharing data with advertisers or analytics** (the BetterHelp mistake, US$7.8M fine) | Low if you simply do not do it | High | No Meta pixel, no Google Analytics with user IDs, no ad SDKs. Use privacy-respecting analytics (Vercel Analytics or Plausible) with no personal data. |
| R7 | **GDPR / UK GDPR special category data** (if you have EU/UK users) | High if you launch there | High (fines up to 4% of revenue, but realistically: regulator orders and user complaints) | Explicit consent for health data; lawful basis documented; data in EU region if EU-first; a Data Protection Impact Assessment (DPIA) written before launch; honour deletion within 30 days. |
| R8 | **EU AI Act** transparency rules (apply from 2 August 2026 to chatbots) | Medium if EU users | Low–Medium | Tell users they are talking to AI. Already required by the chatbot laws above, so this is free. Aeris is not "high-risk" under the Act unless you make medical claims. |
| R9 | **Crisis mishandling** leading to harm and litigation | Low per-conversation, but non-zero over thousands | Catastrophic | Doc 10 in full. This is why the safety layer exists. |
| R10 | **Minors using the app** | Medium (people lie about age) | High (California SB 243 and others have strict minor rules) | 18+ gate at signup; terms say 18+; no marketing to teens; if you detect a minor, end the session gently and show age-appropriate resources. |
| R11 | **Payments & consumer law** (auto-renewal, cancellation) | Medium | Low–Medium | Stripe handles most of it. Clear pricing, easy cancel, email reminders before annual renewal (California and others require this). |
| R12 | **Trademark** ("Aeris" is used by others) | Medium | Low–Medium (forced rename) | 30-minute search in your country's trademark database before launch. |
| R13 | **Accessibility** laws (ADA in US, Equality Act in UK, European Accessibility Act from June 2025) | Low for a small app | Low | Follow basic accessibility (contrast, screen reader labels, reduced motion). Doc 07 includes this. |

---

## 3. The laws, one by one (what each one actually asks of you)

### United States — federal

**FDA, General Wellness guidance (updated January 2026).**
- *The rule in plain words:* If your product is meant to help with general wellness (stress, relaxation, "feeling calmer") and is low risk, FDA leaves you alone. If it is meant to diagnose, treat, or mitigate a disease (anxiety disorder, panic disorder, depression), it is a medical device and you need clearance.
- *What you do:* Say "stress," "anxious moments," "feeling calmer," "worry." Never say "anxiety disorder," "GAD," "panic disorder," "treat," "clinically proven," "therapy," or "reduce symptoms of."
- *Source:* https://www.fda.gov/media/90652/download and summaries at https://www.troutman.com/insights/fdas-2026-guidance-on-general-wellness-devices-policy-for-low-risk-devices/

**FTC Act Section 5 (unfair or deceptive practices) and the Health Breach Notification Rule.**
- *The rule:* Do not lie, exaggerate, or hide what you do with data. If you have a breach of health data, notify people.
- *What you do:* Honest claims only (no "proven to reduce anxiety by 40%" unless you ran a real study). A privacy policy that matches what the code actually does. A written breach plan.

**HIPAA** (the US medical privacy law) **mostly does not apply** to a direct-to-consumer app that has no relationship with doctors or insurers. Do not claim to be "HIPAA compliant" (it would be meaningless and FTC could call it deceptive). Do say "we protect your data with encryption and never sell it."

### United States — states (the ones that matter most)

| State | Law | What it requires of a wellness/companion chatbot | Takes effect |
|---|---|---|---|
| **Illinois** | Wellness and Oversight for Psychological Resources Act | AI cannot provide "therapy" or "psychotherapy." Wellness tools are fine if they do not claim to be therapy. | August 2025 |
| **Nevada** | AB 406 | AI may not represent itself as able to provide mental or behavioural health care. | July 2025 |
| **Utah** | HB 452 | Mental-health chatbots must disclose they are AI, must not sell or share health data, must limit advertising based on conversations. | May 2025 |
| **New York** | AI Companion Models law | Must detect expressions of suicidal ideation or self-harm and refer to crisis services; must remind users every 3 hours (and at start) that they are not talking to a human. | 5 November 2025 |
| **California** | SB 243 (Companion Chatbots) | Disclose AI status; maintain a crisis protocol and publish it; special protections for minors; annual reporting to the Office of Suicide Prevention (from 2027); users can sue. | 1 January 2026 |
| **Washington** | My Health My Data Act; Chatbot Disclosure Act | Consent before collecting health data; no geofencing; right to delete; users can sue. Chatbot disclosure from 1 January 2027. | 2024 / 2027 |
| **Oregon, Tennessee, others** | Various (2026) | Mostly: cannot present as a licensed professional; disclosure. | 2026 |

*Sources:* https://www.orrick.com/en/Insights/2026/04/2026-State-Chatbot-Laws-Key-Provisions-and-Regulatory-Trends, https://www.manatt.com/insights/newsletters/ai-use-in-mental-health-what-tech-companies-need-to-know-about-how-states-are-legislating, https://www.multistate.ai/updates/vol-85-state-ai-chatbot-regulation-laws

**The practical approach:** Do not try to geofence by state. Build to the strictest common denominator (New York + California + Washington) and you satisfy nearly all of them:
1. Say "I'm an AI, not a person" at the start of every session.
2. Repeat it every 3 hours of continuous use (in practice: Aeris sessions are 5 minutes, so you show it at session start and the problem mostly disappears).
3. Have a crisis protocol, run it, and publish it on your website.
4. Get consent for health data before collecting it. Offer deletion. Honour it.
5. Never use conversation content for advertising.
6. 18+ only.

### United Kingdom
- **MHRA** has a similar wellness/medical-device line. Same language rules apply.
- **UK GDPR** treats health data as "special category." You need explicit consent, a lawful basis, and should write a short DPIA.
- **ICO** (the regulator) has published guidance on AI and on children; 18+ gating helps.
- **Online Safety Act** mostly targets platforms with user-to-user content. Aeris has none, so it is largely out of scope, but confirm with your lawyer.

### European Union
- **GDPR Article 9:** health data = explicit consent, documented. Host data in an EU region (Supabase lets you choose) if the EU is your first market.
- **EU AI Act:** chatbot transparency duty applies from August 2026. Aeris is not "high-risk" as a wellness tool. Avoid "emotion recognition" claims (a specific category under the Act): Aeris asks the user how they feel; it does not claim to detect emotion from their face or voice.

### Australia, Canada, Singapore, Hong Kong
- All have privacy laws that treat health data as sensitive (Australia Privacy Act, Canada PIPEDA, Singapore PDPA, HK PDPO). Same approach: explicit consent, minimal data, deletion.
- Australia's TGA has a wellness/device line similar to FDA.

---

## 4. The language rules (print this and tape it to your wall)

### Words you may use
- anxious moments, stress, worry, tension, overwhelm, racing thoughts, feeling calmer, settle, ground, reset, reflect, patterns, triggers (in the everyday sense), guided exercise, breathing, self-guided, wellness, emotional wellbeing, "a calmer next step"

### Words you may not use (anywhere: app, website, ads, app store, social media)
- anxiety disorder, GAD, panic disorder, PTSD, OCD, depression, diagnose, diagnosis, treat, treatment, therapy, therapist, counselling, counsellor, clinical, clinically proven, cure, symptoms, patient, medication, prescribe, "reduces anxiety by X%", "replaces therapy", "as effective as"

### Phrases that must appear
- "Aeris is not a therapist, doctor, or emergency service." (onboarding + settings + website footer)
- "You're talking with an AI, not a person." (start of every AI session)
- "If you're in danger or thinking about harming yourself, contact [local crisis line] now." (onboarding, crisis screen, settings)
- "Aeris does not provide medical advice. If you have physical symptoms that are new or severe, seek medical care." (any session where physical symptoms come up)

### Phrases to avoid in the AI's own voice
- "You have…" (any condition)
- "This is a symptom of…"
- "You should stop/start taking…"
- "It's just anxiety" (dismisses possible medical issues)
- "I'm here for you 24/7" (encourages dependency and overstates reliability)

---

## 5. Documents you need before public launch

| Document | Who writes it | Cost | When |
|---|---|---|---|
| Privacy Policy (health-data aware) | Draft with a generator or Claude, then lawyer review | $0 draft, $500–1,500 review | Day 20–22 |
| Terms of Service (18+, not medical, limitation of liability, arbitration if US) | Same | Included above | Day 20–22 |
| Published Crisis Protocol page (California SB 243 asks for this) | Claude drafts from Doc 10, you publish | $0 | Day 21 |
| Data Protection Impact Assessment (if UK/EU) | Claude drafts, you fill in, lawyer glances | $0–500 | Day 22 |
| Breach Response Plan (one page) | Claude drafts | $0 | Day 22 |
| Company formation (LLC / Ltd) | You, online | $50–500 | Day 1–5 |
| Trademark search | You, 30 minutes | $0 (search) | Day 2 |

**Total legal budget: US$1,500–5,000**, mostly the lawyer. If that is not available, launch as a **closed, free beta with a "testers only" agreement** and do not take payments until you have it.

---

## 6. Honest assessment of regulatory risk overall

- **Can a solo founder legally run Aeris?** Yes, as a wellness tool with disciplined language, a real crisis protocol, and clean data practices.
- **What is the single most likely way you get in trouble?** Not a regulator. A data leak caused by a misconfigured database rule, found by a user or a security researcher, posted online. That is why the security steps are mandatory, not optional.
- **What is the single most likely way the business gets killed by law?** Making a marketing claim that sounds medical because it converts better. Resist it. Every competitor who crossed that line regretted it.
- **Should you get insurance?** Once you have paying users: yes, look at "tech errors & omissions" plus "cyber liability." Expect US$1,000–3,000/year for a tiny company. Not needed for a closed beta.
