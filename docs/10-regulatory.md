# 10 — Law and Regulation

**This is not legal advice.** It is a map, built from the primary texts where we could read them, so that a lawyer's time is spent on judgment rather than research. Each section separates **what the text says** (quoted or closely paraphrased, with a source ID) from **how it might apply** (our reading, which a lawyer must confirm).

**Biggest change from v1.** v1 implied that avoiding disease words was enough to be safe. It is not. Intended use, product behaviour and state law all matter, and the AI arm carries more legal risk than the scripted arm.

---

## 1. Choose the pilot country first

The pilot runs in **one** country. Crisis numbers, privacy law, eligibility wording and the lawyer all depend on it. The analysis below is US-heavy because US primary texts were the ones available. If you pilot elsewhere, have the lawyer cover that country's equivalents: medical-device rules for software, health-data privacy, and any AI-chatbot laws. Do not rely on v1's world summaries, which were secondary and unverified.

## 2. US federal: medical device or general wellness?

**What the text says (E-REG-01).** FDA's General Wellness guidance (6 January 2026) treats as general wellness an intended use "that relates to maintaining or encouraging a general state of health". It lists "relaxation or stress management" and gives the example "claims to promote relaxation or manage stress". A second category allows some disease references, for example a product that tracks routines and "may help living well with anxiety". Yet the same document lists "references to specific diseases, clinical conditions, or diagnostic thresholds" among the features that make a product **not** a general wellness product.

**How it might apply.** Positioning Aeris as **stress management for work moments** fits the guidance's own first-category examples. The guidance appears inconsistent on disease references. The safe reading is to make no reference to anxiety disorders or any condition anywhere: copy, store listing, interface, ads. Even the word "anxiety" belongs in the lawyer's questions.

**Hard rule for the pilot.** No claims to diagnose, treat, cure, mitigate or prevent anything; no clinical screening tools; no "clinically proven"; no effectiveness claims from the pilot, which is product research and not a trial.

## 3. US states

### Illinois (E-REG-02)

**What the text says.**
- "Therapy or psychotherapy services" means "services provided to diagnose, treat, or improve an individual's mental health or behavioral health".
- No one may "provide, advertise, or otherwise offer" them "including through the use of Internet-based artificial intelligence" unless a licensed professional conducts them.
- The Act does not apply to "self-help materials and educational resources that are available to the public and do not purport to offer therapy or psychotherapy services".
- Licensed professionals may not let AI "detect emotions or mental states".
- Penalty: up to $10,000 per violation.

**How it might apply.** "Improve ... mental health" is broad. A **scripted** self-help flow that does not purport to be therapy sits more clearly within the self-help exclusion. An **AI** that reads what a person wrote and responds is harder to place. **Pilot mitigation:** participants in Illinois get the scripted arm only. For a commercial launch with AI, the lawyer must give a view on Illinois specifically.

### California (E-REG-03)

**What the text says.**
- A "companion chatbot" is an AI with a natural-language interface giving "adaptive, human-like responses ... capable of meeting a user's social needs, including by exhibiting anthropomorphic features and being able to sustain a relationship across multiple interactions". Customer-service, video-game and voice-assistant bots are excluded.
- Operators must keep a protocol to prevent producing suicide or self-harm content, including referral to crisis services, and must **publish** it.
- For users the operator **knows are minors**: AI disclosure and a reminder at least every three hours.
- Annual reporting begins 1 July 2027.

**How it might apply.** The pilot has no persona, no memory of conversations and no ongoing dialogue, so it is designed **not** to sustain a relationship. Whether that keeps it outside the definition is a legal question. Publishing the safety protocol ([07](07-safety-spec.md)) costs nothing and is planned anyway. Aeris excludes minors.

### New York (E-REG-04)

**What the text says.**
- An "AI companion" simulates a sustained relationship by:
  - retaining prior interactions and preferences to personalise and encourage ongoing engagement, **and**
  - asking unprompted emotion-based questions beyond a direct response, **and**
  - sustaining ongoing dialogue on personal matters.
- Covered operators must detect suicidal ideation or self-harm and refer to crisis services.
- They must state the user is not talking to a human at the start (at most once a day) and every three hours.

**How it might apply.** The pilot avoids all three features. Whether all three must be present is for the lawyer. Aeris meets the protocol and disclosure duties anyway.

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

**Required lines.**
- "Aeris is a stress-management tool. It is not therapy, medical care, or an emergency service."
- In the AI arm: "Some words here are written by AI."
- On every screen: "In danger? Get help now", linking to the crisis screen.

## 6. Provider terms

Google's Gemini API terms bar use "in clinical practice, to provide medical advice" or anything needing medical-device clearance (E-REG-07). DeepSeek's policy says its services are not designed for health data and data is stored in China (E-REG-08). Neither is used in the pilot ([09](09-ai-and-models.md) §3). Check Anthropic's and OpenAI's current usage policies for consumer health-adjacent uses before the pilot. Both require AI disclosure in this kind of context.

## 7. Questions for the lawyer (bring this list)

1. Does the pilot's copy, interface and behaviour fit FDA general wellness, given the guidance's apparent inconsistency on disease references? May we use the word "anxiety" anywhere?
2. **Illinois:** is the scripted arm within the self-help exclusion? Is the AI arm "therapy" under "improve mental health"? Is excluding Illinois users from the AI arm sufficient for the pilot?
3. **California and New York:** with no persona, no conversation memory and no ongoing dialogue, is either arm a companion chatbot or AI companion?
4. Which privacy and breach rules apply to a 55-person pilot in [chosen country], and what must the consent form and notice say?
5. Is the pilot "human subjects research" requiring ethics review in our circumstances? If it is optional, would you recommend it?
6. What duty of care do we have if the screen routes a participant to a crisis screen? Is the reviewer's follow-up protocol appropriate?
7. Is a refundable real-money early-access offer (E7) allowed without further terms?
8. Do the AI provider's terms permit this use, and what must we disclose about provider retention?
