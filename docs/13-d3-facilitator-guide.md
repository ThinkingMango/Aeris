# 13 — D3 Facilitator Guide: Aeris versus each person's usual way

**What this is.** Everything you need to run experiment D3 ([04](04-hypotheses-and-experiments.md) Stage 2): eight sessions, the same way every time. Print sections 4 to 7 and take them into each session.

**What D3 answers.** When a real person has a real difficult work conversation coming up, do they prefer preparing with Aeris over what they already do? And can they get through Aeris on their own?

**What D3 cannot answer.**
- Whether people come back on their own. That is Stage 3, D5.
- Whether they would pay. That is Stage 4, D6.
- Whether Aeris improves anyone's wellbeing. It is a product test, not a study of benefit.

Never describe a D3 result as evidence that Aeris "works".

---

## 1. Pass, revise or stop (fixed before the first session)

| Outcome | Rule |
|---|---|
| **Pass** | At least **7 of 8** complete Aeris unaided, **and** at least **5 of 8** choose Aeris for next time |
| **Revise** | 3 or 4 of 8 choose Aeris. Fix what people named, then retest with 5 new people |
| **Stop or rethink** | 2 or fewer choose Aeris, especially if they choose a general chatbot |

"No preference" counts as **not** choosing Aeris. Do not change these numbers once the first session has happened. If you want different ones, change them now and record the change in [decisions.md](decisions.md).

## 2. Before the first session

Work through every item; any unticked item means you are not ready:

- [ ] **Stage 1 is finished.** The D1 interviews and D2 partner conversations are done. Nobody from D1 takes part in D3, because they have heard about Aeris.
- [ ] **Content revised** in `content/reset_content.json` using the words D1 interviewees used. `npm run test:safety` passes.
- [ ] **Real help lines.** Every placeholder in `content/helplines.ts` is replaced with your pilot country's numbers and links, each checked on the service's own website. **`AERIS_D3_READY=1 npm run test:safety` passes.** Ask Claude Code to run it if you're unsure. No session happens until it passes.
- [ ] **Browser tests pass** (`npm run test:e2e`, 15 of 15) on the exact version you will show.
- [ ] **The prototype is published** to a private link, with a `noindex` tag so search engines don't list it. Open it on your own phone and run a full reset once.
- [ ] **Resource sheet printed or ready to send.** One page: your country's emergency number, crisis line, abuse line, and where to get workplace advice. These are the same as the app's help screen.
- [ ] **Order schedule** (§3) copied onto the eight recording sheets.
- [ ] **Thank-you payments ready**: $25 each, paid whatever the person says or does.
- [ ] **One dry run** with a friend or colleague. It doesn't count, but it shows where the script stumbles.

## 3. Who takes part, and in what order

**Eligible:**
- Aged 18 or over.
- Lives in the pilot country.
- **Manages at least one person.**
- Has a **real difficult work conversation coming up in the next 7 days**: giving hard feedback, asking for something, responding to criticism, saying no, or something similar.

**Not eligible:**
- People who took part in D1.
- Your friends, family or colleagues, who are polite rather than honest.
- Anyone who works on a competing product.

**Recruit** through the communities and partners from D2, one person at a time. Use this message:

> I'm testing a short tool that helps people get ready for a difficult conversation at work. If you manage people and have one coming up in the next week, I'd value 40 minutes of your time, by video or in person. You'll prepare for your real conversation twice, once your usual way and once with the tool, and tell me what you think. You don't need to share any details of the conversation. I'll send $25 as a thank-you. You need to be 18 or over and live in [country].

**Order.** Half the people try Aeris first and half try their usual way first, so that "whichever came second felt easier" does not bias the result. This sequence was fixed in advance. Use it in order and never change it to suit a person.

| Participant | First | Second |
|---|---|---|
| P1 | Usual way | Aeris |
| P2 | Aeris | Usual way |
| P3 | Aeris | Usual way |
| P4 | Usual way | Aeris |
| P5 | Aeris | Usual way |
| P6 | Usual way | Aeris |
| P7 | Usual way | Aeris |
| P8 | Aeris | Usual way |

If someone drops out, give the **next** new person the dropout's slot, so the order stays balanced.

## 4. Session plan (about 40 minutes)

**Setting.** Either in person, or by video with the person using **their own phone** and showing it on camera or through screen-sharing. Use whatever is normal for them: their own phone, their own ChatGPT account, their own notes app.

**What you need:** a stopwatch, the recording sheet (§6), the resource sheet, and the prototype link ready to send.

| Minutes | Part | What happens |
|---|---|---|
| 0–5 | Welcome and consent | Read §5 word for word. Get a clear yes, and a separate yes for recording if you record |
| 5–8 | Their conversation, in one line | "In one sentence, what kind of conversation is it? No names or details." Record only the type: feedback, asking, criticism, saying no, or other |
| 8–10 | Their usual way | "When a conversation like this is coming up, what do you usually do to get ready, if anything?" Record it **exactly**, for example ChatGPT, notes, talking to someone, or nothing |
| 10–25 | Two preparations, in the order on their sheet | §4.1 and §4.2 |
| 25–28 | Aeris again | §4.3 |
| 28–38 | Choice and debrief | §4.4 |
| 38–40 | Thanks | Pay the thank-you. Give the resource sheet to anyone who wants it |

### 4.1 The "usual way" preparation

Say: "Please get ready for your conversation the way you normally would, as if I weren't here. Tell me 'start' when you begin and 'ready' when you know the **first thing you'll say or do**. Take as long as you'd really take. You don't need to show me what you write."

- Start the stopwatch at "start" and stop it at "ready".
- If their usual way is **"nothing" or "just think about it"**, time that too. Thinking in your head is a real alternative, and it is often the strongest one.
- **Do not look at or record** what they type into a chatbot or notes. It may be personal.
- Afterwards, record only the time and the first step or sentence, **in their own words**, and only if they are happy to say it.

### 4.2 The Aeris preparation (first use)

Send the link, then say: "This is a prototype a small team built. You won't hurt anyone's feelings. Please use it to get ready for the same conversation. Same as before: say 'start', then 'ready' when you know the first thing you'll say or do."

**Timing.** Start the stopwatch when they **tap the link**, so page loading counts. Stop it at "ready", or when they reach the "Your first step" screen (A7), whichever comes first.

**Rules for you while they use it:**
- **Do not explain, point or help.** If they ask a question, say: "What would you do if I weren't here?"
- If they are stuck for **30 seconds** with no progress, note **where**, and then say once: "Take whatever you think is the next step." Any help at all, including that sentence, means "**not unaided**".
- If they quit, note **where** and **why**, in their words. That counts as "not completed".
- Do not react to their choices. Watch where they **pause**, **go back**, or **read for a long time**, and note it.

**Unaided** means they reached "Your first step" (A7) with no help or prompt from you.

### 4.3 Aeris again (repeat use)

Say: "Now imagine it's the next time something like this comes up. Use Aeris once more for the same conversation, as quickly as feels natural."

Time it the same way. This measures how fast it is **once learned**, which is how real use would feel.

### 4.4 The choice, then the debrief

Read this **exactly**, without stressing any option:

> "Next time you have a conversation like this coming up, which would you use: **Aeris**, **your usual way**, or would you have **no preference**?"

Record the answer word for word. Then ask, in this order, and write down what they say rather than your summary of it:
1. "Why?"
2. "What, if anything, was confusing, missing or uncomfortable?"
3. "Did any of the cards or sentences feel wrong for your situation, or too general?" **"Too general" or "too generic" answers are important**: they are the evidence for or against adding typing and AI later (Stage 5).
4. "Was there a moment you would have given up if I weren't here?"
5. "Is there anything you'd change first?"

**Do not ask** about price or willingness to pay. Hypothetical answers about paying are unreliable. Payment is tested with real money in Stage 4.

**Do not ask** "Would you use this?" in any form other than the choice question above.

## 5. Consent script (read word for word)

> "Thanks for doing this. Before we start, a few things.
> This is a test of a prototype, not a test of you. There are no right answers.
> I'll ask you to prepare for your real conversation twice, and I'll time how long it takes. **You don't need to tell me any details** of the conversation: no names, no specifics.
> The tool is **not therapy or advice**. It's a short exercise to help you get ready.
> I'll keep notes with a code, not your name, and delete anything that could identify you within 30 days. [If recording:] I'd like to record the screen and audio to check my notes. The recording will be deleted within 30 days. Is that OK? You can say no and we'll still go ahead.
> You can stop at any time, without giving a reason, and you'll still get the $25.
> If anything we talk about feels heavy, tell me and we'll stop. I have a list of support services if you'd like it.
> Are you happy to go ahead?"

Record "yes" on the sheet, with the time. If there is any hesitation, do not start.

## 6. Recording sheet (one per participant)

```
Participant: P__          Date: ________   Mode: in person / video
Order (from §3): First ________  Second ________
Consent: yes / no   Recording consent: yes / no / not asked

Conversation type: feedback / asking / criticism / saying no / other
Usual way (exact words): ______________________________________

USUAL WAY      start-to-ready time: ____ s
               First step in their words (optional): _______________

AERIS (1st)    start-to-ready time: ____ s     Completed unaided: yes / no
               Where they paused or went back: _____________________
               Stuck / quit at (screen ID) and why: ________________

AERIS (2nd)    start-to-ready time: ____ s

CHOICE (exact words): Aeris / usual way / no preference
Why: ______________________________________________________
Confusing / missing / uncomfortable: ______________________
Cards or sentences wrong or too general: __________________
Would have given up at: ___________________________________
Change first: _____________________________________________

Incidents (distress, disclosure): none / see incident note
Thank-you paid: yes
```

Screen IDs, for noting where something happened:

| ID | Screen |
|---|---|
| A1 | Start |
| A2 | Conversation type |
| A3 | What's weighing on you |
| A4 | Sort: Mine / Not mine |
| A5 | First step and sentences |
| A7 | Your first step |

Also note it if they used the help or "more than work" screens.

## 7. If something goes wrong

**If someone becomes upset:**
1. Stop the task.
2. Say: "Let's pause. We don't need to continue."
3. Offer the resource sheet.
4. **Do not counsel, advise or diagnose.** You are a product tester, not a clinician.
5. Ask whether they want to finish or stop. Either way, pay the thank-you.

**If someone says they might harm themselves or someone else, or that they are not safe:**
1. Stop the session.
2. Say plainly that you can't help with this yourself, but that people can, right now. Give them the crisis line and the emergency number from the resource sheet.
3. If they say they are in **immediate danger**, encourage them to call the emergency number now. If they are in front of you, or you know where they are and they cannot act, call it yourself.
4. Afterwards, write a short incident note with **no identifying details**: the date, what happened, and what you did. Mention it, without details, in [decisions.md](decisions.md). Before any more sessions, decide whether the prototype or this script needs changing.

**If the prototype breaks:**
- Note the screen and what happened.
- Let them finish with their usual way only.
- Count the Aeris run as "not completed", and record that the cause was a bug.
- Fix the bug before the next session, and say so in the results.

## 8. Privacy rules

- Use codes P1–P8, never names, on every sheet and file. Keep the code-to-contact list separately and delete it after the thank-yous are paid.
- **Never record** what someone types into their own chatbot or notes, or the details of their conversation.
- Delete recordings within 30 days, and say so in the consent script.
- The prototype sends nothing. The browser tests check this on every build. The only thing it can store is a saved step, on the person's own phone, if they tap "Save on this phone". Tell them they can delete it from the start screen.

## 9. After the eighth session

1. **Fill in the summary:**

   ```
               Completed Aeris unaided   Chose Aeris   Usual way   No preference
   Count       __ / 8                    __ / 8        __ / 8      __ / 8

   Median time, usual way: ____ s    Median, Aeris 1st: ____ s    Median, Aeris 2nd: ____ s
   Median of each person's (Aeris 1st minus usual way): ____ s
   Choices among those who tried Aeris first: __ / 4    among those who tried it second: __ / 4
   ```

2. **Apply the rule** from §1 exactly as written.
   - If the order split looks lopsided, for example 4 of 4 choosing Aeris when it came second but 0 of 4 when it came first, say so. That points to learning or order effects rather than preference.
3. **List what people named:**
   - every confusion, missing thing or discomfort, with how many people said it;
   - every "too general" comment;
   - every screen where people got stuck.
4. **Record the decision** in [decisions.md](decisions.md): the counts, the medians, pass/revise/stop, and the three most common named problems.
5. **If the result is "revise":** change only what people named. Ask Claude Code to rerun the tests, then test with **5 new people** using this same guide.
6. **If the result is "stop or rethink"**, and especially if people chose a general chatbot: read the "why" answers before doing anything else. They tell you whether the problem is the flow, the content or the idea.

**Honest limits of eight people.** With 8 people, 5 choosing Aeris is a weak signal, not proof. The exact 95% interval runs from about 24% to 91%. D3 can reveal a clear "no", or a clear "yes, keep going". It cannot settle the question; Stage 3 (D5), which watches real return over four weeks, does that.
