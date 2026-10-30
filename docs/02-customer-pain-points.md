# 02 — Customer Pain Points Review

**Goal of this document:** Understand who Aeris is for, what hurts, what they have already tried, and why those things failed. Everything downstream (features, screens, AI design) is built from this.

**A note on evidence.** I have not interviewed your users, because there are none yet. What follows is built from published research on anxiety-app usage, public forums where anxious people describe their experience (r/Anxiety, r/panicattacks, app-store reviews of Calm, Headspace, Wysa, Woebot, Youper), and the behavioural science of anxiety. Treat it as a strong starting hypothesis. **Day 3 of the 30-day plan has you talk to 5 real people to check it.** That one step will teach you more than this document.

---

## 1. Who is the user? (Pick one to start)

"Adults 18+ with anxiety" is a market of hundreds of millions. That is too wide to design for. Here are the five most common anxiety *situations* (not diagnoses) that show up in forums and reviews. I recommend you design the MVP for **the first two** and let the others arrive naturally.

### Segment A — "The 3 a.m. spiral" (primary)
- **Who:** Working adults, 25–45, who wake up or cannot fall asleep because their mind is looping on something: money, a conversation, a health worry, tomorrow.
- **The moment:** In bed, phone in hand, partner asleep, dark room. Typing feels loud. Cannot call anyone. Already tried "just stop thinking about it."
- **What they want:** To make it stop for long enough to sleep. Not a 20-minute meditation. Something that takes 2–4 minutes and does not require them to think hard.
- **Why this segment first:** Highest intensity, most frequent, clearest "moment," and the phone is already in their hand. Also the moment where generic content fails most completely ("I do not want to pick from 400 sleep stories").

### Segment B — "The anticipatory dread" (primary)
- **Who:** Adults facing a specific upcoming event: a meeting, a medical result, a flight, a difficult conversation, an exam, a date.
- **The moment:** Hours or days before. Stomach knot, racing thoughts, playing out worst cases. Often at work or in public, so they cannot do a loud breathing exercise.
- **What they want:** To stop rehearsing disaster and feel like they have a handle on it. Crucially, they want to **separate what they can do something about from what they cannot**. This is where your "identify what they can actually control" feature is gold.
- **Why this segment first:** The need is *structured thinking*, which an AI can do better than a static app, and the outcome is measurable ("do I feel more prepared?").

### Segment C — "The body panic" (secondary)
- **Who:** People experiencing or fearing a panic attack: heart racing, chest tight, dizziness, "am I dying?"
- **What they want:** Immediate grounding. Reassurance that the sensations are anxiety. Big buttons. No reading.
- **Caution:** This segment is closest to the medical line. Chest pain *can* be a heart problem. The app must never say "it's just anxiety." The safety architecture (Doc 10) handles this with a "physical symptoms" branch that always includes "if this is new or severe, seek medical help."

### Segment D — "The relationship replay" (secondary)
- **Who:** People who replay a conversation, text, or social interaction, worrying they said the wrong thing or that someone is angry with them.
- **What they want:** A reality check and permission to stop replaying. Often want to vent first.

### Segment E — "The health worrier" (handle carefully)
- **Who:** People who check symptoms obsessively and spiral on "what if it's serious."
- **Caution:** Aeris must **never** interpret symptoms. The AI's job is to notice the *pattern* ("you are in a checking loop") and offer a loop-breaker, then recommend a real doctor for the medical question. This segment is a safety and legal trap if handled wrong, and a huge relief for users if handled right.

---

## 2. The pain, in their words

These are composite statements that represent recurring themes in forums and reviews. They are not quotes from specific individuals.

| What they say | What it actually means for Aeris |
|---|---|
| "I have Calm and Headspace and I never open them when I'm actually anxious." | The library model fails in the moment. Choice is a burden when you are panicking. **One tap, one path.** |
| "By the time I pick a meditation I'm already too far gone." | Time-to-intervention must be under 10 seconds from opening the app. |
| "I just want someone to tell me what to do right now." | The user wants to be *led*, not offered options. Tone matters: calm, confident, short sentences. |
| "The chatbot kept asking me how I felt. I KNOW how I feel, that's the problem." | Chatbots over-ask. Aeris should ask at most one or two questions, then act. |
| "I don't want to type a whole paragraph while I'm shaking." | Tap-first input. Chips, sliders, big buttons. Typing optional. Voice optional later. |
| "It felt like homework. Streaks, badges, journaling prompts... I just left." | No streaks. No guilt. No badges. Low-pressure design. (Counter-intuitive but important; see Doc 05.) |
| "I did the breathing thing and it did nothing." | Breathing alone is weak for cognitive anxiety. The intervention must match the *type* of anxiety (body vs. thought vs. situation). This is the core of the product. |
| "I don't know if it's working." | Measure before and after. Show the user the number. Even a 1-point drop is proof. |
| "Then what? The app just ended." | Close the loop: one concrete next step, and a gentle bridge to the next session. |
| "I'm scared this is all going to end up somewhere." | Privacy is a *feature*, not a legal footnote. Show deletion. Show what is stored. Never ask for more than needed. |
| "I told it something dark and it gave me a hotline number and shut down. I felt rejected." | Crisis handling must be warm, not robotic. Stay with them. Provide help without slamming a door. (Doc 10 details this.) |
| "It kept saying it's not a therapist. I know." | Required disclosures must be present but not nagging. Put them where the law requires and nowhere else. |
| "I can't afford $15/month for an app." | Price sensitivity is real. Free tier must be genuinely useful, not a demo. |

---

## 3. Why existing solutions fail (the gap analysis)

| Solution they try | Why they try it | Where it fails them | What Aeris takes from this |
|---|---|---|---|
| **Meditation apps (Calm, Headspace)** | Brand trust, beautiful, proven for daily practice | Library model; long sessions; not built for the acute moment; feel generic | Build for the moment, not the routine (but keep a tiny routine hook) |
| **General AI chatbots (ChatGPT, Claude, Gemini)** | Free, already installed, feel understanding | Require typing; no structure; forget patterns across chats (mostly); wall of text when you need three words; no safety design for crisis; no "before/after" | Tap-based structure; pattern memory; measured outcome; purpose-built safety |
| **AI mental-health chatbots (Wysa, Youper, Earkick)** | Purpose-built, some clinical validation | Often feel scripted and chatty; many pivoted to enterprise; some sunset; clinical framing can feel heavy | Lighter, faster, more "quiet guide" than "therapy bot" |
| **Journaling apps (Day One, Rosebud)** | Processing thoughts, patterns over time | Reflective, not acute; require effort to write; patterns are rarely surfaced automatically | Automatic pattern extraction from *structured* sessions, no essay required |
| **Googling symptoms / Reddit** | Immediate, free, feels like action | Makes it worse; reinforces checking loops; no closure | Interrupt the loop; name it; offer a replacement action |
| **Texting a friend** | Human warmth | Not available at 3 a.m.; guilt about burdening them; friend gives advice, not structure | Be the 3 a.m. option that does not judge or tire |
| **Therapy** | Real help | Expensive, waitlists, weekly cadence does not cover Tuesday 2 a.m. | Explicitly position as the *between sessions* tool; never as a replacement |
| **Doing nothing** | Most common | The anxiety passes on its own eventually, which teaches nothing | Make the "with Aeris" path shorter and leave a learning behind |

**The gap, in one sentence:** Nobody is doing *fast, structured, remembered* help for the anxious moment. Everyone is doing either slow-and-beautiful (meditation), fast-and-unstructured (chatbots), or structured-and-effortful (journals).

---

## 4. Jobs to be done

"Jobs to be done" is a way of describing what a customer is *trying to accomplish* when they reach for a product. It keeps us focused on their goal, not our features.

**Primary job:** *"When I notice I'm spiralling, help me get my feet back under me in under five minutes, without making me think hard or feel judged."*

**Secondary jobs:**
1. "Help me figure out what I can actually do about this, so I stop rehearsing disasters."
2. "Tell me if this is the same thing that keeps happening to me, so I can see it coming next time."
3. "Prove to me that what I just did helped, so I believe it enough to do it again."
4. "Let me get this out of my head without anyone ever seeing it."
5. "Be here at 3 a.m. and not make me feel like a burden."

**Jobs Aeris must explicitly NOT take on** (these are legal and ethical lines):
- "Tell me what's wrong with me." (diagnosis)
- "Fix my anxiety disorder." (treatment)
- "Be my therapist." (clinical relationship)
- "Tell me whether I should take my medication." (medical advice)
- "Be the only one I talk to." (dependency; the app should gently push toward real-world support)

---

## 5. What "success" feels like to the user

Design the product so this is a realistic experience on the very first use:

> I wake up at 2:40 a.m. with my chest tight, thinking about the email I have to send tomorrow. I open Aeris. It asks one thing: "What's going on?" I tap "Something tomorrow." It asks me to rate how tense I feel: I slide to 8. It says, "Sounds like a 'waiting for tomorrow' moment. Let's take two minutes to settle your body, then look at what's actually in your hands." A slow orb breathes with me for 90 seconds. Then it shows me three things I wrote and asks which I can control. I tap two. It says, "Those two are yours to handle, and you can handle them tomorrow. The third isn't yours tonight." I rate my tension: 5. It says, "Down 3. That's real. You can come back any time." I put the phone down. I am not cured. But I can sleep.

Every feature in Doc 06 should be justifiable against this story. If it does not serve this story, it waits.

---

## 6. Validation plan (do this before building screens)

On Day 3 of the plan, talk to **five people** who experience anxiety. Friends, family, coworkers, or people from online communities who agree to a 15-minute call. Ask these questions and write down the answers:

1. "Tell me about the last time you felt really anxious. Where were you? What did you do?"
2. "Did you use any app or tool? What happened?"
3. "If a tool could have done one thing for you in that moment, what would it be?"
4. "Would you type, tap, or talk, if you were feeling that way?"
5. "Would you pay for something like that? How much feels fair?"
6. "What would make you not trust it?"

If three or more of five say some version of "I just want it to tell me what to do," you are on track. If three or more say "I'd just use ChatGPT," you have learned the most important thing early and need Doc 05 even more.
