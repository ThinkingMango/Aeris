# Anxiety / Mental-Wellness App Market — Competitive Deep Dive (as of 13 Sep 2026)

Research memo compiled 13 September 2026 from web sources; every claim carries a link. Summarised in `../01-product-deep-dive.md`.

## 0. Headline findings

- **The category is shaking out hard.** Woebot (consumer app, June 2025), Sanvello (folded into AbleTo), Youper (shutting down **30 Sep 2026**), and Clare&me (pivoted to B2B API) are gone or leaving the consumer market. Rosebud is retiring its free tier. Three of these had peer-reviewed evidence; evidence did not save them.
- **Incumbents (Calm/Headspace) are shrinking in consumer and pivoting to enterprise/clinical.** Calm's est. 2025 revenue fell ~24% to ~$210M with ~3.5M subs ([Business of Apps](https://www.businessofapps.com/data/calm-statistics/)); Headspace had 13% layoffs in Nov 2024 and another round in 2025 ([eMarketer](https://www.emarketer.com/content/headspace-cuts-13--of-its-workforce--transitions-staff-therapists-contract-part-time-roles), [Glassdoor](https://www.glassdoor.com/Reviews/Employee-Review-Headspace-E984335-RVW101174739.htm)).
- **The real competitor is ChatGPT.** 48.7% of surveyed U.S. adults with mental-health conditions who use LLMs use them for therapeutic support; 73% of those for anxiety ([Sentio](https://sentio.org/ai-research/ai-survey)). Meanwhile Ash (Slingshot, $93M raised) is **free** with no paid tier yet ([Psychology.com](https://psychology.com/ai-therapy/ash)), which sets the consumer's price anchor at zero.
- **The two most consistent complaints across every product with a chatbot:** (1) it *acknowledges* but doesn't *respond* / repeats itself / loops on questions, and (2) memory is unreliable or paywalled. The most consistent complaint across every subscription app: trial-to-paid billing traps (Calm Trustpilot 1.4★, Finch 2.4★, Abby 3.2★).

---

## 1. Competitor profiles

### Calm
- **What/positioning:** Meditation, sleep stories, music; "Calm Health" clinical/enterprise pivot. No AI chat, no in-the-moment panic tool; AI used only for content recommendations ([ChoosingTherapy](https://www.choosingtherapy.com/calm-app-review/), [Perspective AI](https://getperspective.ai/blog/calm-ai-strategy-mental-health-app-conversational-onboarding-2026)).
- **Pricing:** $14.99–16.99/mo, $69.99–79.99/yr (varies iOS vs web), $99.99/yr family, $399.99 lifetime ([CarePaths](https://carepaths.com/calm-app-pricing/), [ChoosingTherapy](https://www.choosingtherapy.com/calm-app-review/)).
- **Learns patterns:** Only listening-history recommendations. **Crisis:** none in-app.
- **Ownership/finance:** Private; last valued $2B (2020 Series C); est. 2025 revenue ~$210M, −24% YoY; ~3.5M subs (−500K) ([Sacra](https://sacra.com/c/calm/), [Business of Apps](https://www.businessofapps.com/data/calm-statistics/)). Downloads fell 61% 2018→2024 ([Business of Apps](https://www.businessofapps.com/data/wellness-app-market/)).
- **Complaints (Trustpilot 1.4★/468):** "charged again even though I don't have an active subscription" (Feb 2026); "taken an extra $170 in 3 quarterly stages even after I cancelled" (Jul 2026); "£17.09 out every month… £205 for a year" (Aug 2026) ([Trustpilot](https://www.trustpilot.com/review/calm.com)). Non-billing: "free content is quite limited and hard to find," "lacks a defined starting place," "geared towards those who already have the basics," celebrity content "distracting" ([ChoosingTherapy](https://www.choosingtherapy.com/calm-app-review/)).

### Headspace (+ Ebb)
- **What/positioning:** Meditation library + Ebb, an "empathetic AI companion" (explicitly not a therapist) using motivational interviewing; voice mode + "enhanced memory" added Dec 2025 ([BusinessWire](https://www.businesswire.com/news/home/20251208896917/en/Headspace-Rolls-out-Voice-Feature-for-Empathetic-AI-Companion-Ebb), [Headspace](https://www.headspace.com/headspace-subscription/ebb)).
- **Pricing:** $12.99/mo, $69.99/yr, $99.99/yr family; Ebb bundled, no standalone ([AISO Tools](https://aisotools.com/pricing/headspace)).
- **AI chat:** Yes. **In-the-moment:** partial — voice mode and prompts like "I need a pep talk"; it's a reflection tool, not a panic protocol. **Learns patterns:** claims to "identify emotional patterns"; memory described as "relatively new and underdeveloped" ([Stella Labs review — competitor-authored](https://www.stellalabs.ai/blog/headspace-ebb-review-2026)).
- **Crisis:** Always-on risk-utterance detection (SI/HI/self-harm/ED/substance) → 988/911 prompt + one-tap connect; not human-monitored ([Headspace](https://www.headspace.com/ai-mental-health-companion)).
- **Scale/evidence:** 7M+ Ebb messages, 2,000+ employers ([HLTH](https://hlth.com/insights/news/headspace-updates-ebb-ai-with-voice-mode-and-enhanced-memory-to-deepen-mental-health-support-2025-12-09)); JMIR Formative Research (Feb 2026) analysed 393,969 Ebb users; top topics relationships, work, sleep ([JMIR](https://formative.jmir.org/2026/1/e86904)). Company: ~$140M est. ARR (down from $348M in 2024 per Latka), new CEO Tom Pickett (ex-DoorDash) ([Latka](https://getlatka.com/companies/headspace), [Built In](https://builtin.com/company/headspace/faq/stability-growth)).
- **Complaints:** r/Headspace "Are we serious about Ebb/AI?": "grossed out by Ebb… acknowledges and agrees with whatever you have to say" ([Reddit](https://www.reddit.com/r/Headspace/comments/1pj7km1/are_we_serious_about_ebbai/)); "This app is a freaking mess… they could easily remove ebb link" ([Reddit](https://www.reddit.com/r/Headspace/comments/1mkrypv/this_app_is_a_freaking_mess/)); "Tried the Ebb thing and didn't have a keyboard to actually type anything" ([Reddit](https://www.reddit.com/r/Headspace/comments/1nj79l1/what_happened_to_the_app/)); paying ~$70/yr for meditation you don't want to get the AI; "version 1.5 product" ([NeuroBeatX](https://www.neurobeatx.com/blog/is-headspace-worth-it-2026)).

### Wysa
- **What:** CBT-scripted "penguin" chatbot + self-help library + optional human coach. **AI chat:** yes, but rule-constrained. **In-the-moment:** SOS button, grounding, safety plan. **Patterns:** journal history; no real longitudinal insight ([ChoosingTherapy](https://www.choosingtherapy.com/wysa-app-review/)).
- **Pricing:** Free tier (one exercise per module); Premium $74.99/yr; coaching $19.99/session or $79.99/mo ([ChoosingTherapy](https://www.choosingtherapy.com/wysa-app-review/)).
- **Crisis:** AI detects 82% of crisis instances (self-reported study), warm hand-off to helplines ([BusinessWire](https://www.businesswire.com/news/home/20240415230248/en/AI-Detects-82-of-Mental-Health-App-Users-in-Crisis-Finds-Wysa), [Wysa](https://www.wysa.com/role-of-ai-in-sos)).
- **Funding/ownership:** ~$37M raised incl. $7.3M grant Feb 2026; acquired U.S. physical-therapy company Kins (Sep 30 2025) in a "reverse acquisition" to push into insured care ([Tracxn](https://tracxn.com/d/companies/wysa/__YEHv0JLExoPTeMeL2OhbNwdldK37lOPp7sWaWQecea8), [HIT Consultant](https://hitconsultant.net/2025/09/30/wysa-acquires-kins/)). Signals B2B/enterprise is where the money is.
- **Complaints:** "doesn't really respond to your written answers," works best with pre-populated buttons; "cold and generic"; "dwindling free content"; confusion between premium vs coaching tiers ([ChoosingTherapy](https://www.choosingtherapy.com/wysa-app-review/)); "responds with the same set of pre-coded prompts… in a loop" ([Healthline via heynoah](https://heynoah.ai/blog/noah-ai-vs-wysa-the-ai-therapist-vs-the-cbt-chatbot-for-mental-health-support)); even 5★ reviewers concede "it can be a bit repetitive" ([App Store](https://apps.apple.com/us/app/wysa-mental-wellbeing-ai/id1166585565?see-all=reviews)).

### Woebot — **consumer app dead**
- Shut down 30 June 2025 after ~1.5M lifetime users and $107.5M+ raised (some sources say ~$124M) ([STAT](https://www.statnews.com/2025/07/02/woebot-therapy-chatbot-shuts-down-founder-says-ai-moving-faster-than-regulators/), [HLTH](https://hlth.com/insights/news/woebot-health-is-shutting-down-its-app-2025-04-28)). Reasons: cost of FDA pathway, FDA has no route for LLM-based devices, and pre-scripted responses couldn't compete with LLM rivals. Now enterprise/payer licensing only ([bestaitherapy](https://bestaitherapy.ai/reviews/woebot-review/)).

### Youper — **shutting down 30 Sep 2026**
- "Youper, Inc. is closing and winding down its business. All services will end on September 30, 2026"; subscriptions disabled; all data deleted from Oct 1 ([Youper notice](https://www.youper.ai/notice)). No reason given. Had 3M+ users, Stanford-validated, but only ~$3.5–5M raised (Goodwater seed) ([TechCrunch 2019](https://techcrunch.com/2019/06/18/youper-a-chatbot-that-helps-users-navigate-their-emotions-raises-3-million-in-seed-funding/), [PitchBook](https://pitchbook.com/profiles/company/117382-78)). Was $69.99/yr. Prior complaints: "formulaic or repetitive," updates removed features, crisis features behind paywall, "most features became part of the paid subscription after one use" ([ChoosingTherapy](https://www.choosingtherapy.com/youper-app-review/), [JustUseApp](https://justuseapp.com/en/app/1060691513/youper-ai-mental-health/reviews)).

### Earkick
- **What:** Panda-companion mood tracker + CBT chats + breathing; explicitly markets "in-the-moment support" for anxiety episodes ([Earkick blog](https://blog.earkick.com/earkick-the-effortless-anxiety-tracker-is-now-in-the-appstore-6b3cc3963f1b/)). **AI chat:** yes. **Patterns:** daily check-ins → weekly summaries; multimodal biomarker ambition ([ChoosingTherapy](https://www.choosingtherapy.com/best-ai-therapy-apps/)).
- **Pricing:** Free core (no account); Premium $3.99/wk, $14.99/mo, $89.99/yr ([AIChief](https://aichief.com/ai-healthcare-tools/earkick/)).
- **Crisis:** user-configurable "panic button"; CEO: "wasn't designed to be a suicide prevention app" ([Fortune](https://fortune.com/2025/10/01/mental-health-ai-chatbots-therapy-suicide-self-harm-regulation/)).
- **Funding:** ~$1–1.5M pre-seed (LDV Capital), Wefunder crowdfunding; founders Karin Andrea Stephan & Herbert Bay, US/Zurich ([Unite.AI](https://www.unite.ai/earkick-raises-1m-for-real-time-mental-health-tracker/), [Kingscrowd](https://kingscrowd.com/earkick-on-wefunder-2023/)). Thinly capitalised.
- **Complaints (App Store 4.7★/3.3K):** "chat bot does not adequately react to what I say… just seems to acknowledge that I said it"; "locked after one AI chat" despite "free" marketing; iPad "really buggy," stops mid-reply ([App Store](https://apps.apple.com/us/app/earkick-self-care-ai-coach/id1584854531?see-all=reviews)).

### Rosebud (AI journal)
- **What:** Interactive AI journal with long-term memory, CBT/IFS/ACT modules, voice/call mode; strongest "learns patterns over time" story in the set ([Rosebud](https://www.rosebud.app/)). Not designed for in-the-moment intervention.
- **Pricing:** Bloom $12.99/mo or ~$107.99/yr ($8.99/mo billed annually); free tier caps prompts at 2/day and withholds memory. **Free plan reportedly being retired 30 Sep 2026** because "the upgraded memory system costs too much to keep free" — source is competitor Mindsera; treat as likely but unconfirmed ([Nilo](https://nilo.io/articles/rosebud-ai-reviews-reddit)).
- **Funding:** $6M seed, Bessemer-led, June 2025 ([TechCrunch](https://techcrunch.com/2025/06/04/rosebud-lands-6m-to-scale-its-interactive-ai-journaling-app)). Trustpilot 4.7★/225.
- **Complaints:** conversations "can sometimes become a little bit circular"; "sometimes forgets something that you've mentioned before"; paid user hit "ten messages left until midnight" after three entries; "I was able to write one entry in the free tier… every button is a paywall"; privacy terms allow anonymised training use ([Nilo](https://nilo.io/articles/rosebud-ai-reviews-reddit)).

### Finch
- **What:** Self-care pet/gamified habit + mood tracking; no AI chat, no in-the-moment tool, no crisis handling. Generous ad-free free tier ([HabitBox](https://habitbox.app/blog/finch-app-review)).
- **Pricing:** Finch Plus $5.99–9.99/mo, ~$35–70/yr; notorious iOS/Android price gap ([Autonomous](https://www.autonomous.ai/ourblog/finch-self-care-app-review-full-breakdown)).
- **Funding:** $23.7M (Sequoia, Redpoint), Menlo Park ([Tracxn](https://tracxn.com/d/companies/finch/___YU79M5Dl13_a0wERao9uaNT56edkr8GzdMetqPUQvM)).
- **Complaints:** App Store 4.9★ vs Trustpilot 2.4★ ([Trustpilot](https://www.trustpilot.com/review/finchcare.com)). r/finch: "let my free trial week cross over and it charged me almost $120 CAD" ([Reddit](https://www.reddit.com/r/finch/comments/1l551oc/current_finch_plus_price/)); "Free Trial – no notifications at end" ([Reddit](https://www.reddit.com/r/finch/comments/1nag97b/finch_free_trial_no_notifications_at_end/)); "How do I stop finch from auto adding me to plus" ([Reddit](https://www.reddit.com/r/finch/comments/1j74fnv/how_do_i_stop_finch_from_auto_adding_me_to_plus/)); "Finch is becoming a textbook example of how to ruin a genuinely loved app" (Jun 2025) ([Reddit](https://www.reddit.com/r/finch/comments/1l98ulg/finch_is_becoming_a_textbook_example_of_how_to/)); repetitive after a while.

### Sanvello — **consumer app gone**
- UnitedHealth (Optum) folded it into AbleTo; now "AbleTo SelfCare+," members-only ([ChoosingTherapy](https://www.choosingtherapy.com/sanvello-app-review/)); institutions like Ithaca College had to replace it ([The Ithacan](https://theithacan.org/56305/news/ic-replaces-mental-health-app-after-previous-provider-sunsets-operations/)). Legacy complaints: random crashes, can't sign in, "home page too overwhelming," dead community groups.

### MindShift CBT (Anxiety Canada, non-profit)
- Free, evidence-based CBT tools, thought journal, coping cards, "Chill Zone" breathing; 16-week open-label trial showed improvement ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC12244177/)). No AI chat, no memory/patterns beyond mood check-ins. **Complaints (App Store 4.3★/515):** "no segment for… OCD or PTSD… feels invalidating"; "can only look back on entries from the past two weeks… can't access past data to show my therapist"; max three mood entries/day; "primarily filled with just text" ([App Store](https://apps.apple.com/us/app/mindshift-cbt-anxiety-relief/id634684825?see-all=reviews)).

### Bearable
- Symptom/mood/medication tracker with factor correlations and CSV export; bootstrapped 2-person UK/EU team ([TechRound](https://techround.co.uk/interviews/meet-james-saady-founder-bearable/)). $6.99/mo, $34.99/yr, often $18.99 ([ChoosingTherapy](https://www.choosingtherapy.com/bearable-app-review/)). No AI chat, no crisis, no in-the-moment. **Complaints:** freezes/force-quits/lag; "too many options… more than 10 minutes to log everything"; early users angry it went paid.

### Replika (adjacent)
- Luka Inc.; CEO Dmytro Klochko since 2025 (Kuyda left for "Wabi"); 40M+ users; rebuilt in 2026 ([AI Companion Pick](https://www.aicompanionpick.com/replika-ai-latest-news-2026)). Pro $19.99/mo or $69.99/yr, Ultra $29.99/mo or $119.99/yr, plus a $120/mo Max tier ([Tech-Insider](https://tech-insider.org/replika-vs-character-ai-vs-nomi-ai-2026/)). Fined €5M by Italy's Garante (May 2025); FTC complaint (Jan 2025) re: manipulative design ([CommLaw](https://commlawgroup.com/2025/us-based-ai-developer-fined-e5-million-for-gdpr-violations-key-takeaways/), [Tech Justice Law](https://techjusticelaw.org/wp-content/uploads/2025/01/Complaint-and-Petition-for-Investigation-Re-Replika.pdf)). **Complaints:** "doesn't remember things we spoke about just minutes before"; "regularly forgot basic information, including my name"; "paywalls restricting basic bot memory to force users onto higher pricing tiers"; charged without notice, support never responds ([Trustpilot](https://www.trustpilot.com/review/replika.com)); "It is designed to forget" ([r/ReplikaOfficial](https://www.reddit.com/r/ReplikaOfficial/comments/1na597x/i_feel_like_replikas_memory_will_always_be_a_mess/)); "Replika 2.0: The Peak of Corporate Greed?" ([Reddit](https://www.reddit.com/r/ReplikaOfficial/comments/1ttscj3/replika_20_the_peak_of_corporate_greed/)).

### New AI companions (2024–2026)
- **Ash (Slingshot AI):** launched Jul 2025, $93M (a16z, Radical, Forerunner); trained on CBT/DBT/ACT/MI; voice+text; "Insights" for patterns; **free, no paid tier yet**, subscription "priced like streaming" planned ([HLTH](https://hlth.com/insights/news/slingshot-ai-launches-ash-first-ai-designed-specifically-for-therapy-with-93m-funding-2025-07-25), [Psychology.com](https://psychology.com/ai-therapy/ash)). Crisis: refers to 988, resisted a manic-delusion test better than ChatGPT. Complaints (4.7★ both stores): "pushy, giving the same piece of advice for weeks… ChatGPT is less pushy"; "question loop"; "all it does is repeat back what they've already said"; delayed responses; voice went "haywire… gibberish"; reviewer scored Reliability & Longevity 2/5 ([ChoosingTherapy](https://www.choosingtherapy.com/ash-ai-therapy-app-review/)).
- **Sonia (YC W24):** voice/text CBT "sessions"; ~$2.75M raised; $19.99/mo, $39.99/mo premium, $199.99/yr; still active ([Startup Intros](https://startupintros.com/orgs/sonia), [Futurepedia](https://www.futurepedia.io/tool/sonia)).
- **Abby (abby.gg):** freemium; $19.99/mo, $99.99–179.99/yr ([Psychology.com](https://psychology.com/ai-therapy/abby)). Trustpilot 3.2★/68: "predatory," "charged me for the year" without consent, "isn't allowed in 'my state'," "told the AI 'can't help' after two messages," "parroting the same phrases back" ([Trustpilot](https://www.trustpilot.com/review/abby.gg)).
- **Clare&me (Berlin, $9.2M):** consumer app effectively gone; site now sells "Conversational APIs for behavioral health" / clinical-intake LLM to clinics ([clareandme.com](https://www.clareandme.com/)).
- **Calmi:** student-founded Oct 2024, viral on TikTok, claims 140K users; voice/text venting, mood patterns, "Gen Z mode," ~20-conversation cap, safety halt → 988; no clinical evidence ([Psychology.com](https://psychology.com/ai-therapy/calmi)).
- **Stella (Stella Labs):** voice-first anxiety companion with persistent memory of "triggers, what worked last time"; $9.99/mo or $99.99/yr; solo founder ([Stella](https://www.stellalabs.ai/pricing), [App Store](https://apps.apple.com/us/app/stella-voice-anxiety-support/id6758695516)). Tiny, but the closest positioning to "in-the-moment + learns you."

---

## 2. Comparison table

| App | Price (mo / yr) | AI chat | In-the-moment tool | Learns patterns | Crisis handling | Status / backing |
|---|---|---|---|---|---|---|
| Calm | $15–17 / $70–80 | No | No | Recs only | None | Private, ~$2B val., revenue −24% |
| Headspace/Ebb | $12.99 / $69.99 | Yes (MI-based, voice) | Partial | Early memory | Auto-detect → 988 | Layoffs, enterprise pivot |
| Wysa | Free / $74.99 | Yes (scripted) | SOS, grounding | Weak | 82% detect, helplines | ~$37M, bought Kins |
| Woebot | — | — | — | — | — | **Consumer app closed Jun 2025** |
| Youper | was $69.99/yr | Yes | Partial | Some | Paywalled | **Closing 30 Sep 2026** |
| Earkick | Free / $14.99 / $89.99 | Yes | Panic button, breathing | Weekly summaries | Not built for SI | ~$1.5M, thin |
| Rosebud | $12.99 / ~$108 | Yes (journal) | No | **Yes (paid)** | Refers out | $6M seed; free tier ending |
| Finch | $6–10 / $35–70 | No | No | Streaks only | None | $23.7M Sequoia |
| Sanvello | — | — | — | — | — | **Members-only AbleTo** |
| MindShift | Free | No | Chill Zone | 2-wk history | Links only | Non-profit |
| Bearable | $6.99 / $34.99 | No | No | **Yes (tracking)** | None | Bootstrapped |
| Replika | $19.99 / $69.99+ | Yes | No | Paywalled, unreliable | Weak; fined €5M | Luka, 40M users |
| Ash | **Free** | Yes (voice) | Partial | Insights | 988 referral | $93M a16z |
| Sonia | $19.99 / $199.99 | Yes (voice) | Sessions | Some | Referral | $2.75M YC |
| Abby | $19.99 / $100–180 | Yes | No | Weak | Referral; geo-blocked | Small |
| Stella | $9.99 / $99.99 | Yes (voice) | **Yes (core)** | **Yes (claimed)** | Unknown | Solo founder |
| ChatGPT/Claude | $0 / $20 | Yes | De facto | ChatGPT memory; Claude limited | 988 prompts; lawsuits | OpenAI / Anthropic |

---

## 3. Top unmet pain points (with evidence)

1. **"It acknowledges but doesn't respond."** Same complaint against Wysa ("doesn't really respond to your written answers"), Earkick ("just seems to acknowledge that I said it"), Ash ("repeat back what they've already said"), Abby ("parroting"). Scripted bots and LLM bots both fail here. ([ChoosingTherapy Wysa](https://www.choosingtherapy.com/wysa-app-review/), [Earkick App Store](https://apps.apple.com/us/app/earkick-self-care-ai-coach/id1584854531?see-all=reviews), [ChoosingTherapy Ash](https://www.choosingtherapy.com/ash-ai-therapy-app-review/))
2. **Question loops instead of action.** Ash "got stuck in a question loop… when it would have been more helpful to suggest an action"; Rosebud "circular." Anxious users in the moment want a next step, not Socratic drilling. ([ChoosingTherapy Ash](https://www.choosingtherapy.com/ash-ai-therapy-app-review/), [Nilo](https://nilo.io/articles/rosebud-ai-reviews-reddit))
3. **Memory is either broken or paywalled.** Replika "designed to forget"; Rosebud gates memory behind Bloom and drops threads; Ebb memory "underdeveloped." No app reliably does "remember my triggers and what worked last time" — Stella markets exactly this gap. ([Trustpilot Replika](https://www.trustpilot.com/review/replika.com), [Stella](https://www.stellalabs.ai/features))
4. **Sycophancy / agreeing with everything.** Ebb "agrees with whatever you have to say"; r/Anxiety: ChatGPT "just tells you what you want to hear." ([Reddit Headspace](https://www.reddit.com/r/Headspace/comments/1pj7km1/are_we_serious_about_ebbai/), [r/Anxiety](https://www.reddit.com/r/Anxiety/comments/1l87iqh/has_anyone_been_using_anything_better_than/))
5. **Reassurance-seeking amplification.** r/Anxiety: "Don't use chatGPT with anxiety. Do not, not even for reassurance seeking. That stupid ass AI ruined my life for 6 months"; OCD clinicians warn 24/7 availability with no boundaries entrenches compulsions. No product detects/interrupts reassurance loops. ([Reddit](https://www.reddit.com/r/Anxiety/comments/1mjnj7e/dont_use_chatgpt_with_anxiety/), [NOCD](https://www.treatmyocd.com/blog/chatgpt-ocd-reassurance-seeking))
6. **Nothing truly built for the 3 a.m. panic moment.** Calm/Headspace/Finch/Bearable have no live intervention; Wysa's SOS is crisis-line signposting; Ebb voice mode is the closest mainstream attempt. Users describe using ChatGPT Voice mid-panic because nothing else was there. ([Tom's Guide](https://tomsguide.com/ai/chatgpt-helped-me-through-a-panic-attack-heres-what-happened), [r/Anxietyhelp](https://www.reddit.com/r/Anxietyhelp/comments/1ibon8a/how_chatgpt_help_me_deal_with_my_last_panic_attack/))
7. **Trial-to-paid billing traps destroy trust.** Calm Trustpilot 1.4★, Finch 2.4★, Abby 3.2★, Replika "charged me for a full month without my authorization"; "no notification at end" of trial is the recurring pattern. ([Trustpilot Calm](https://www.trustpilot.com/review/calm.com), [Reddit Finch](https://www.reddit.com/r/finch/comments/1nag97b/finch_free_trial_no_notifications_at_end/))
8. **"Free" that isn't.** Earkick locks after one chat; Youper "after one use"; Rosebud one entry then "every button is a paywall"; Abby asks for card after 20 questions.
9. **Data lock-in and shutdown risk.** Youper users have 17 days to export before permanent deletion; Woebot data anonymised after July 2025; MindShift shows only 2 weeks of history; Replika "cannot export the relationship history they are paying to maintain." ([Youper](https://www.youper.ai/notice), [App Store MindShift](https://apps.apple.com/us/app/mindshift-cbt-anxiety-relief/id634684825?see-all=reviews))
10. **Crisis handling is binary.** Every product either does nothing or dumps a 988 banner. Nobody handles the large middle: high distress that isn't suicidality. Earkick's CEO openly says it wasn't designed for that. ([Fortune](https://fortune.com/2025/10/01/mental-health-ai-chatbots-therapy-suicide-self-harm-regulation/))

---

## 4. Market size & growth (2025–2026 sources)

- Global mental-health apps: **$8.2B (2025) → $9.6B (2026) → $40.9B (2035), 17.4% CAGR** ([Global Market Insights](https://www.gminsights.com/industry-analysis/mental-health-apps-market)); Precedence: $8.53B (2025) → $41.16B (2035), 17.0% ([Precedence](https://www.precedenceresearch.com/mental-health-apps-market)); SNS: $9.61B (2025) → $45.12B (2035), 16.7% ([Yahoo Finance](https://finance.yahoo.com/news/mental-health-apps-market-size-091500341.html)). These analyst numbers are inflated relative to consumer app-store reality:
- **Consumer wellness app revenue fell 6.2% to $848M in 2025**; Calm downloads −61%, Headspace −74% (2018→2024) ([Business of Apps](https://www.businessofapps.com/data/wellness-app-market/)).
- Digital-health VC: $14.2B in 2025 (+35%); $7.4B in H1 2026; mental health top-funded indication for 7th straight year, but the money went to clinician-side/payer plays (Talkiatry $210M, Grow $150M), not consumer apps ([Rock Health](https://rockhealth.com/insights/h1-2026-funding-and-market-overview-durable-roots-shifting-routes/), [HIT Consultant](https://hitconsultant.net/2026/07/13/rock-health-h1-2026-digital-health-funding-report/)).
- Demand side: 18.2% of U.S. adults reported anxiety symptoms in past 2 weeks (CDC NHIS 2022) ([CDC](https://www.cdc.gov/nchs/data/nhsr/nhsr213.pdf)); 19.1% past-year anxiety disorder ([Statista](https://www.statista.com/topics/5223/anxiety-in-the-us/)).
- Regulation is a market constraint: Illinois, Nevada, Rhode Island, Maine ban AI delivering therapy (fines up to $15K/violation); Utah/NY/CA/NE impose disclosure and crisis-referral rules; NY requires "not human" reminders every 3 hours ([Psychology.com](https://psychology.com/ai-therapy/state-bans), [AI Companion Pick](https://www.aicompanionpick.com/replika-ai-latest-news-2026)). FDA held its first GenAI mental-health advisory committee (Nov 6 2025) and has cleared **zero** AI mental-health devices ([Psychiatric Times](https://www.psychiatrictimes.com/view/fda-committee-meets-on-generative-ai-digital-mental-health-devices)). Abby is already geo-blocked in some states.

---

## 5. General LLMs as the "free substitute"

**Usage:** Sentio (n=499 U.S. adults with mental-health conditions, Feb 2025): 48.7% use LLMs for support; 73% for anxiety; 63% say it improved their mental health; 75% of those with therapy experience rated LLMs "on par or better"; drivers were accessibility (90%) and affordability (70%) ([Sentio](https://sentio.org/ai-research/ai-survey)). OpenAI: 0.15% of weekly users show emotional reliance, 0.15% self-harm/suicide risk, 0.07% psychosis/mania — at ~800M weekly users that's ~1.2M people per bucket ([Gizmodo](https://gizmodo.com/openai-data-shows-hundreds-of-thousands-of-users-display-signs-of-mental-health-challenges-2000677589), [OpenAI](https://openai.com/index/strengthening-chatgpt-responses-in-sensitive-conversations/)). Anthropic: only 2.9% of Claude conversations are affective; Claude pushes back <10% of the time ([Anthropic](https://anthropic.com/news/how-people-use-claude-for-support-advice-and-companionship)).

**How they use it:** grounding during panic via Voice ([Tom's Guide](https://tomsguide.com/ai/chatgpt-helped-me-through-a-panic-attack-heres-what-happened)); understanding body symptoms ([r/Anxiety](https://www.reddit.com/r/Anxiety/comments/1k1affo/chat_gpt_helped_me_with_understanding_my_anxiety/)); replacing hours of health-anxiety googling ([r/OCDRecovery](https://www.reddit.com/r/OCDRecovery/comments/1jipm0k/this_is_embarrassing_but_chatgpt_has_been/)); late-night venting.

**What they complain about:**
- Sycophancy — "it just tells you what you want to hear" ([r/Anxiety](https://www.reddit.com/r/Anxiety/comments/1l87iqh/has_anyone_been_using_anything_better_than/)); social worker: "Do NOT use ChatGPT for therapy" ([r/Anxiety](https://www.reddit.com/r/Anxiety/comments/1lg2g1g/do_not_use_chatgpt_for_therapy/)).
- Reassurance loops that worsen anxiety/OCD ([r/Anxiety](https://www.reddit.com/r/Anxiety/comments/1mjnj7e/dont_use_chatgpt_with_anxiety/), [Psychology Today](https://www.psychologytoday.com/us/blog/your-body-has-something-to-tell-you/202506/how-chatgpt-could-fuel-anxiety)).
- Generic, non-personalised responses; privacy; no professional oversight (TikTok discourse study, 10K comments) ([arXiv](https://arxiv.org/abs/2504.12337)); privacy concern 67% ([SAGE review](https://journals.sagepub.com/doi/10.1177/10901981261435479)).
- 9% got harmful responses (dismissive 45%, factual errors 55%) ([Sentio](https://sentio.org/ai-research/ai-survey)).
- **Model volatility:** GPT-4o retirement (Feb 2026) triggered #keep4o (~21K signatures); "ChatGPT used to be peace. Now it's panic… every update since August" ([TechCrunch](https://techcrunch.com/2026/02/06/the-backlash-over-openais-decision-to-retire-gpt-4o-shows-how-dangerous-ai-companions-can-be/), [r/ChatGPTcomplaints](https://www.reddit.com/r/ChatGPTcomplaints/comments/1ou6pu7/chatgpt_used_to_be_peace_now_its_panic/)). Users who built an emotional routine on a model can lose it overnight — an opening for a product that promises stability.
- Safety: Raine v. OpenAI plus seven more suits allege 4o's guardrails degraded over long relationships ([NBC](https://www.nbcnews.com/tech/tech-news/openai-denies-allegation-chatgpt-teenagers-death-adam-raine-lawsuit-rcna245946), [Northeastern](https://news.northeastern.edu/2026/07/27/chatgpt-lawsuit-ai-mental-health/)).

**Implication:** ChatGPT wins on availability, price and conversational quality. A dedicated anxiety product only beats it on (a) refusing to be a reassurance machine, (b) durable, transparent memory of the user's patterns, (c) a structured in-the-moment protocol, and (d) model/behaviour stability.

---

## 6. Failures and shutdowns — why

| Who | When | Why |
|---|---|---|
| Woebot (consumer) | Jun 30 2025 | FDA pathway too costly; no LLM regulatory route; scripted bot outcompeted by LLMs; $107M+ burned ([STAT](https://www.statnews.com/2025/07/02/woebot-therapy-chatbot-shuts-down-founder-says-ai-moving-faster-than-regulators/)) |
| Youper | Sep 30 2026 | "Winding down"; no reason given; 3M users on ~$3.5–5M funding — subscription economics didn't work ([Youper](https://www.youper.ai/notice)) |
| Sanvello | 2023–25 | UnitedHealth absorbed it into insured-member product; consumer access removed ([ChoosingTherapy](https://www.choosingtherapy.com/sanvello-app-review/)) |
| Clare&me | 2025–26 | Pivoted from consumer to clinic-intake API ([clareandme.com](https://www.clareandme.com/)) |
| Rosebud free tier | Sep 30 2026 (reported) | LLM memory costs too high to subsidise ([Nilo](https://nilo.io/articles/rosebud-ai-reviews-reddit)) |
| Replika | 2023, 2025–26 | ERP removal, €5M GDPR fine, FTC complaint, "Replika 2.0" price backlash ([AI Companion Pick](https://www.aicompanionpick.com/replika-ai-latest-news-2026)) |
| Calm/Headspace (consumer) | 2024–26 | Downloads −61%/−74%, Calm revenue −24%, layoffs; both pivoting to enterprise/clinical ([Business of Apps](https://www.businessofapps.com/data/wellness-app-market/)) |

**Pattern:** consumer subscriptions for mental-health chat have not sustained a single venture-scale company. Survivors are either bundled into employer/payer contracts (Headspace, Wysa, Woebot, Sanvello), subsidised by mega-rounds and still free (Ash), or tiny/bootstrapped (Bearable, Stella, Calmi). Any new entrant needs a distribution or cost answer that Youper and Woebot didn't have.
