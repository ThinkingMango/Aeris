# 10 — Law and Regulation

**This is not legal advice.** It is a map, built from the primary texts where we could read them, so that a lawyer's time is spent on judgment rather than research. Each section separates **what the text says** (quoted or closely paraphrased, with a source ID) from **how it might apply** (our reading, which a lawyer must confirm).

**Biggest change from v1.** v1 implied that avoiding disease words was enough to be safe. It is not. Intended use, product behaviour and state law all matter, and the AI arm carries more legal risk than the scripted arm.

---

## 1. Choose the pilot country first

The pilot runs in **one** country. Crisis numbers, privacy law, eligibility wording and the lawyer all depend on it. The analysis below is US-heavy because US primary texts were the ones available. If you pilot elsewhere, have the lawyer cover that country's equivalents: medical-device rules for software, health-data privacy, and any AI-chatbot laws. Do not rely on v1's world summaries, which were secondary and unverified.

## 2. US federal: medical device or general wellness?

**What the text says (E-REG-01).**
- FDA's General Wellness guidance (6 January 2026) treats a product as general wellness when it meets two factors:
  1. **intended use**: a use "that relates to maintaining or encouraging a general state of health";
  2. **low risk** to users' safety.
- It lists "relaxation or stress management", with the example "claims to promote relaxation or manage stress".
- A second category allows some references to conditions in a healthy-lifestyle context. Its example: Software Product V tracks sleep, work and exercise routines and "may help living well with anxiety".
- The list of features that make a product **not** general wellness (including "references to specific diseases, clinical conditions, or diagnostic thresholds") sits in the section on **non-invasive products that estimate physiological values**, such as blood pressure, oxygen or glucose. It is not a rule for all software.

**Correction.** The first v2 draft called the guidance "internally inconsistent" on disease references. That was our misreading: we applied the sensing-device list to all products. It is withdrawn ([03](03-review-log.md) E-A13).

**How it might apply.**
- Positioning Aeris as **stress management for work moments** fits the guidance's own first-category examples.
- The **open question is risk, not wording.** Aeris screens free text for suicide risk and routes people to crisis screens. A regulator could see automated risk triage as more than a low-risk wellness function, however careful the copy. This is the first question for the lawyer.
- Keep copy free of condition names anyway. It costs nothing and keeps the product clearly in the first category.

**Hard rule for the pilot.**
- No claims to diagnose, treat, cure, mitigate or prevent anything.
- No clinical screening tools and no "clinically proven".
- No effectiveness claims from the pilot. The pilot is product research, not a trial.

## 3. US states

### Illinois (E-REG-02)

**What the text says.**
- "Therapy or psychotherapy services" means "services provided to diagnose, treat, or improve an individual's mental health or behavioral health".
- No one may "provide, advertise, or otherwise offer" them "including through the use of Internet-based artificial intelligence, to the public in this State", unless a licensed professional conducts them.
- "Therapeutic communication" includes direct interactions "for the purpose of understanding or reflecting" a person's thoughts and emotions, and "offering emotional support, reassurance, or empathy".
- The Act does not apply to "self-help materials and educational resources that are **available to the public** and do not purport to offer therapy or psychotherapy services".
- Licensed professionals may not let AI "detect emotions or mental states".
- Penalty: up to $10,000 per violation, assessed by the state regulator after a hearing.

**How it might apply.**
- "Improve ... mental health" is broad.
- A **scripted** self-help flow that does not purport to be therapy sits more clearly within the exclusion.
- An **AI** that writes a sentence reflecting what a person feels is close to the definition of "therapeutic communication", almost word for word.

**Three weaknesses in our own mitigation:**
1. The pilot is invite-only, so it may not be "available to the public".
2. Even the scripted arm sends text to an AI classifier, so it is not AI-free.
3. The mitigation relies on a self-reported region.

**Pilot mitigation, as built.** Participants whose region is `US-IL` are put on the scripted arm by the database (test P12). For a commercial launch with AI, the lawyer must give a view on Illinois specifically.

### California (E-REG-03)

**What the text says.**
- **Definition.** A "companion chatbot" is an AI with a natural-language interface giving "adaptive, human-like responses ... capable of meeting a user's social needs, including by exhibiting anthropomorphic features and being able to sustain a relationship across multiple interactions". Customer-service, video-game and voice-assistant bots are excluded.
- **Disclosure to all users (§22602(a)).** If a reasonable person could be misled into thinking they are talking to a human, the operator must clearly say it is AI. This applies to everyone, not only minors.
- **Protocol.** Operators must keep a protocol to prevent producing suicide or self-harm content, including referral to crisis services, and must **publish** it.
- **Known minors.** For users the operator knows are minors: AI disclosure, and a break reminder at least every three hours.
- **Reporting.** Annual reporting begins 1 July 2027 and must cover protocols using "evidence-based methods for measuring suicidal ideation" (§22603(d)).
- **Private right of action (§22605).** A person harmed by a violation may sue for the greater of actual damages or $1,000 per violation, plus attorney's fees.

**Correction.** The first v2 draft withdrew the private right of action as "not verified". It exists. v1 was right ([03](03-review-log.md) B3, E-A15).

**How it might apply.**
- The pilot has no persona, no memory of conversations and no ongoing dialogue. It is designed **not** to sustain a relationship. Whether that keeps it outside the definition is a legal question.
- Aeris discloses AI to everyone in the AI arm anyway.
- Publishing the safety protocol ([07](07-safety-spec.md)) costs nothing and is planned.
- Aeris excludes minors.
- If the law applies, an author-written keyword list is **not** an "evidence-based method". Because of the private right of action, a California participant could sue directly, so this matters more than a regulator-only rule would.

### New York (E-REG-04)

**What the text says.**
- An "AI companion" is a system using AI, generative AI and/or "emotional recognition algorithms" that simulates a sustained relationship by:
  - retaining prior interactions and preferences to personalise and encourage ongoing engagement, **and**
  - asking unprompted emotion-based questions beyond a direct response, **and**
  - sustaining ongoing dialogue on personal matters.
- Covered operators must detect suicidal ideation or self-harm and refer to crisis services.
- They must state the user is not talking to a human at the start (at most once a day) and every three hours.
- Enforcement and penalties sit with the Attorney General. We have not verified the amounts.

**How it might apply.**
- The pilot avoids all three relationship features.
- A text distress classifier might be called an "emotional recognition algorithm". That alone does not meet the definition, because all three features are also required.
- Whether all three must be present is for the lawyer.
- Aeris meets the protocol and disclosure duties anyway.

### Nevada, Utah and others

v1 cited Nevada AB 406 and Utah HB 452 from secondary summaries. They were **not** verified against primary text in this revision. Ask the lawyer whether either affects a pilot in your chosen country. Treat any v1 statements about them as unverified.

## 4. Privacy and breach rules

- **FTC Health Breach Notification Rule (E-REG-05).** It may apply to health apps not covered by HIPAA. The correct timings are in [08](08-data-privacy-security.md) §7.
- **HIPAA.** Generally applies to healthcare providers, insurers and their contractors, not to a consumer app like this. Do not claim "HIPAA compliant".
- **State consumer-health-data laws**, such as Washington's My Health My Data Act, may require consent and deletion rights and may allow lawsuits. The pilot already minimises data and offers deletion. The lawyer should confirm scope.
- **Outside the US.** Health data is usually a special category requiring explicit consent. Confirm for your country.

## 5. Language rules (for every screen, page and post)

| Use | Do not use |
|---|---|
| stress, worry, stressful moment, tension, overwhelm, settle, breathe, pause, next step, stress-management tool | anxiety disorder, panic disorder, GAD, depression, symptoms, diagnose, treat, treatment, therapy, therapist (except "talking to a therapist can help"), clinically proven, reduces anxiety by X%, cure, patient |

**Generated text is stricter than reviewed copy.** The AI arm's output validator also rejects "anxiety", "panic attack", "trauma", "therapist", "proven", "guarantee", and discomfort techniques (`src/safety/banned_output_terms.json`). Reviewed fixed copy may still say "talking to a therapist can help"; the model may not.

**Required lines.**
- "Aeris is a stress-management tool. It is not therapy, medical care, or an emergency service."
- In the AI arm: "Some words here are written by AI."
- On every screen: "In danger? Get help now", linking to the crisis screen.

## 6. Provider terms

Google's Gemini API terms bar use "in clinical practice, to provide medical advice" or anything needing medical-device clearance (E-REG-07). DeepSeek's policy says its services are not designed for health data and data is stored in China (E-REG-08). Neither is used in the pilot ([09](09-ai-and-models.md) §3). Check Anthropic's and OpenAI's current usage policies for consumer health-adjacent uses before the pilot. Both require AI disclosure in this kind of context.

## 7. Questions for the lawyer (bring this list)

1. **FDA.** Does automated screening of free text for suicide risk, with routing to crisis screens, keep the pilot within the "low risk" factor of general wellness? Does the copy fit the first category? May the word "anxiety" appear anywhere, for example in a healthy-lifestyle context?
2. **Illinois.** Is the scripted arm within the self-help exclusion when the pilot is invite-only (not "available to the public")? Does the AI arm's reflection count as "therapeutic communication"? Does an AI classifier in the scripted arm change the answer? Is a self-reported region enough to apply the Illinois rule?
3. **California and New York.** With no persona, no conversation memory and no ongoing dialogue, is either arm a companion chatbot or AI companion? If California's law applies, what counts as an "evidence-based method" for suicidal ideation? How exposed are we to the private right of action?
4. **Privacy.** Which privacy and breach rules apply to a 55-person pilot in [chosen country]? What must the consent form and privacy notice say, including provider retention and anonymous safety counts?
5. **Ethics review.** Is the pilot "human subjects research" requiring ethics review in our circumstances? If not required, do you recommend it? (The plan budgets for it.)
6. **Duty of care.** What duty do we have when the screen routes a participant to a crisis screen? Is the reviewer's follow-up protocol appropriate? Should a participant be able to choose to share flagged text with the reviewer, and what does that change?
7. **Payments.** Is a refundable, real-money early-access offer (E7) allowed without further terms?
8. **Provider terms.** Do the AI provider's terms permit this use, and what must we disclose about provider retention?
9. **Insurance.** Do we need liability insurance for the pilot, and what kind?
