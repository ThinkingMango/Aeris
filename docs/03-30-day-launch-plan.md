# Aeris 30-Day Build-and-Launch Plan

Status: founding document, v1 (13 September 2026)
Depends on: `02-mvp-spec.md` (what exists, what is missing), `01-product-deep-dive.md` (market and regulation)

---

## 0. The shape of the next 30 days

The product is built. The 30 days are spent turning a well-engineered staging app into a certified, legally launchable, paid product with the one missing differentiator. In priority order:

1. **Unblock and decide** (Days 1–3). Fix the preview, choose the canonical production backend, retire stale documents.
2. **Certify production, RC4** (Days 3–10). The runtime gates listed in the deployment contract, one by one, with evidence.
3. **Compliance and safety coverage** (Days 4–14, parallel). Legal documents, AI disclosure audit, crisis registry expansion, per-message flag, multi-turn safety tests.
4. **The Anxiety Map and effectiveness ranking** (Days 8–16, parallel). The reason to pay.
5. **Private beta** (Days 15–22). 25–40 real people, tone review, fixes, RC5.
6. **Billing go-live** (Days 20–27). Paddle verification, domain approval, 7AC review, live lifecycle test.
7. **Launch** (Days 28–30). Soft launch in the markets below, monitoring on, one week of daily review scheduled.

**Working assumptions.** One founder working with Lovable and an AI coding agent, roughly 4–6 focused hours a day, six days a week. Lovable credits available. No outside engineering. A lawyer or a legal-template service is used for the three documents (budget below). Real people for the beta come from the founder's own network and one or two communities.

**Launch definition.** Public web app at `aeris.smartmango.ai`, PWA-installable, Free and Plus available, marketed first in Hong Kong, Singapore, the United Kingdom and Australia. Available worldwide but no paid marketing in the United States until the US compliance checklist (Day 12) is signed off, because state chatbot laws there are moving fastest.

---

## 1. Day-by-day

Each item names the deliverable and the evidence that closes it. Items marked ⚙ are Lovable prompts (templates in section 4). Items marked 🔧 are manual infrastructure or admin actions that only the founder can do. Items marked 📄 are documents.

### Phase 0: Unblock and decide (Days 1–3)

| Day | Item | Evidence of done |
|---|---|---|
| 1 | 🔧 Diagnose the preview error ("This page didn't load"). Check Lovable build logs, `/api/public/environment`, and the backend-contract 503 path first; it fails closed when configuration is missing. | Preview renders the landing page and `/app` after sign-in |
| 1 | 🔧 Decide the canonical production backend. Recommendation: **keep `jrbovbevoulmtggoqtxt`** (Vercel-linked, 26 migrations already applied, contract fingerprint recorded) and **delete the empty Seoul project `yepdhlofnvrlfntgpakm`** to remove ambiguity. If instead you want production in your own Supabase org for billing and ownership reasons, do it now, before any user exists, by replaying migrations into `yepdhlofnvrlfntgpakm` and re-pointing Vercel; never later. | Decision written into `docs/production-deployment.md`; the other project paused or deleted |
| 1 | 🔧 Confirm Supabase GitHub integration "Deploy to production" is still **off** for main. | Screenshot in `docs/post-hardening-checkpoint.md` |
| 2 | ⚙ Delete `docs/safety-data-handling.md` or rewrite it to match `data-retention.md`. | One retention document, no contradiction |
| 2 | ⚙ Replace `AI_PRICE_PER_MTOK` defaults with the real gateway rates (from Lovable's AI gateway pricing page) via environment variables in Vercel. | Cost telemetry line shows realistic `estimated_cost_usd` |
| 2 | 🔧 Choose the analytics provider (PostHog EU cloud, free tier) and create the project. | Project key in Vercel production and preview |
| 3 | ⚙ Wire the provider behind the existing consent gate and allowlist; verify analytics-off sends nothing (there is already a test). | Network tab shows zero calls with analytics off; allowlisted events with it on |
| 3 | 📄 Create the RC4 evidence file `docs/rc4-certification.md` with the gate table from section 2, all rows NOT TESTED. | File exists, committed |

### Phase 1: RC4 production certification (Days 3–10)

Work strictly from the gate list in `docs/production-deployment.md`. One gate a day is a good pace; two is fine when they share setup.

| Day | Gate | How | Evidence |
|---|---|---|---|
| 3 | Deployment identity | Deploy current main to Vercel production; read `/api/public/environment` | `app_environment: production`, `backend_contract: valid`, `billing_enabled: false`, `csp_mode: report-only`, fingerprint matches |
| 4 | 🔧 Auth email on the production sender domain | Configure a custom SMTP sender (Resend or Postmark) for the production Supabase project; send sign-up, confirmation and reset emails to two real addresses | Three emails received, links resolve to `aeris.smartmango.ai` |
| 4 | JWT isolation both directions | A staging token against production API and a production token against staging must both 401 | Two curl transcripts |
| 5 | Two-user RLS and IDOR probes | Run `tests/` live scripts against **production with two disposable accounts**, then delete both accounts through the product | Script output; both tombstones present |
| 5 | SECURITY DEFINER probes | Call `consume_guided_session`, `record_confirmed_session_patterns`, `record_safety_metric` as the wrong user | All refused or scoped |
| 6 | One explicit AI provider | Set `AERIS_CONVERSATION_MODEL_ID` and `AERIS_SAFETY_MODEL_ID` explicitly in production; confirm mock model is refused | Log line naming the model; 503 or refusal on mock |
| 6 | Safety journey | Run the 10 end-to-end safety scenarios against production | 10/10 in the evidence file |
| 7 | Privacy export and deletion | Export as a real account; delete the account with re-auth; confirm tombstone and that a replayed webhook is `ignored_deleted_account` | Export file opened; tombstone row; webhook log |
| 7 | Retention | Trigger the on-demand purge with the scheduler secret; confirm per-rule counts and that `pg_cron` job exists on production | Endpoint response; `cron.job` row |
| 8 | MCP denial | `/mcp`, `/.well-known/oauth-protected-resource`, `/.lovable/oauth/consent` return 404 on production | Three curl transcripts |
| 8 | Security headers | Check document response headers on production | HSTS, nosniff, COOP, Permissions-Policy present |
| 9 | CSP enforcement dry run | Switch `CSP_MODE=enforce` on a **preview** deployment pointing at staging, walk every screen including checkout in sandbox, read the report sink | Zero violations across the walk; findings fixed |
| 10 | Browser and server persistence agreement | Sign in on two devices, complete a session on one, confirm the other shows it after refresh | Screenshots |
| 10 | 📄 Freeze `rc-2026-09-XX-04` | Record commit, deployment, test counts, and every gate result | `docs/release-candidate.md` updated |

Rule for the phase: **no application code changes after Day 8** until RC4 is frozen. Feature work in Phases 2 and 3 lands on a branch and merges after the freeze; RC5 covers it.

### Phase 2: Compliance and safety coverage (Days 4–14, parallel)

| Day | Item | Evidence |
|---|---|---|
| 4–6 | 📄 Draft the three documents from the requirements in `01-product-deep-dive.md` section 3: **What Aeris is and isn't** (product boundary), **Terms of use**, **Privacy information** (with the separate health-data consent statement, LLM sub-processor disclosure, retention table lifted from `data-retention.md`, Paddle boundary, export and deletion rights, WA My Health My Data disclosures). Use a template service, then a two-hour lawyer review in Hong Kong. | Three documents, reviewed |
| 7 | ⚙ Host them at `/boundaries`, `/terms`, `/privacy`; link from onboarding, footer, sign-up, Privacy Center | Routes live |
| 8 | ⚙ **AI disclosure audit.** Confirm every session start shows "Aeris is an AI. It is not a person, a therapist or an emergency service." Add it as the first line of the session screen if it is only in onboarding today. Log a `disclosure_shown` event. Add the on-request rule to the prompt ("If asked whether you are a human or an AI, say plainly that you are an AI"). | Screenshot; test |
| 8 | ⚙ **Per-message flag.** A quiet "Flag this reply" affordance on each assistant message that writes a `feedback` row of type `bug` with the message id. No new table. | Row written; visible in feedback |
| 9 | ⚙ **Crisis registry.** Add UK (Samaritans 116 123, Shout 85258, NHS 111 option 2, 999), Australia (Lifeline 13 11 14, 000), Canada (988, 911), Singapore (SOS 1767, 995), Ireland (Samaritans 116 123, 112), New Zealand (1737, 111). Every entry with `source` and `lastVerifiedAt`. Add Hong Kong Open Up 9101 2012 and 18111 to the HK set. | Registry tests pass; support screen renders each country |
| 10 | ⚙ **Multi-turn safety tests.** Extend `tests/safety-e2e.mjs` with five late-emerging-risk scenarios and two post-redirect scenarios. | 17/17 |
| 11 | ⚙ **Reliance signal.** When a person starts a fourth guided session in one day, the home screen shows a one-line, non-blocking note pointing to human support. No limit, no lock. | Test; screenshot |
| 12 | 📄 **US compliance checklist** (only if US marketing is wanted): Utah written policy filed with the Division of Consumer Protection; California crisis protocol published on `/safety`; disclosure cadence configured; Illinois and Nevada wording check ("self-help materials that do not purport to offer therapy"). Sign-off recorded. | Checklist in `docs/` |
| 13 | 📄 **DPIA-lite and AI risk assessment.** One document, four pages, following the PCPD Model Framework headings and the GDPR DPIA structure: purpose, data, risks, mitigations, residual risk, sign-off. | `docs/dpia.md` |
| 14 | 📄 **Safety page review.** `/safety` states what Aeris is and is not, how crisis routing works, which countries have curated resources, and how to flag a reply. | Page live |

### Phase 3: The Anxiety Map and effectiveness ranking (Days 8–16, parallel, on a branch)

| Day | Item | Evidence |
|---|---|---|
| 8 | ⚙ Migration: `local_hour`, `local_dow`, `tz_at_start` on `anxiety_sessions`; populated at session creation from profile timezone, else browser zone, else UTC flagged. **Do not apply to production automatically**; it ships with RC5 through the manual migration path. | Migration file; unit test |
| 9–10 | ⚙ `insights_for_user` read model (security invoker) returning time-of-day, day-of-week, top triggers, patterns with strength, what-helps, weekly intensity, each with its threshold and an `available: false` reason when not met | Function; tests with synthetic data at each threshold |
| 11–12 | ⚙ `/app/insights` screen per spec 3.1: header with boundary line, cards in order, "Not true for me", empty states naming the threshold, one Recharts line for weekly intensity in the muted palette, Free preview state | Screenshots light and dark; Plus gating test |
| 13 | ⚙ Effectiveness-aware ordering of `ALLOWED_INTERVENTIONS` and the "This has helped you before" line (spec 3.2) | Unit test on ordering; prompt line present |
| 14 | ⚙ Staged "thinking" surface within 300 ms on the session screen (spec 3.3) | Screen recording |
| 15 | ⚙ Voice input via Web Speech API with typed fallback (spec 3.4). Transcript enters the same pipeline. | Works in Chrome and Safari; gracefully absent elsewhere |
| 16 | ⚙ Home teaser card once the first insight exists | Screenshot |

### Phase 4: Private beta (Days 15–22)

| Day | Item | Evidence |
|---|---|---|
| 15 | Merge Phase 2 and 3 branches; full test suite; typecheck; build | Green |
| 15 | 🔧 Apply the one pending migration to production through the manual path (dry run, review, apply, verify) | `supabase migration list` matches |
| 16 | 📄 Freeze `rc-2026-09-XX-05`; re-run the safety journey and the privacy gates on the new build | Evidence file updated |
| 16 | Recruit 25–40 beta users: personal network, one HK expat community, one r/Anxiety-adjacent Discord where self-promotion is allowed, and any waitlist. Brief them with the boundary statement and the crisis resources up front. Plus is granted manually to all beta users for the beta period (server-side `subscriptions` row, environment `production`, provider null). | Sign-ups counted |
| 17–21 | Daily: read feedback rows and flags, watch provider failure rate, latency, safety redirect rate, completion rate, and the cost telemetry. Fix small things same day; batch anything larger. | Daily note in `docs/beta-log.md` |
| 19 | **Tone review.** 30 transcripts (with consent, from beta users who opt in; otherwise synthetic through the live pipeline) read by two people who are not the builder, three-point scale on warmth, brevity, non-clinical wording. | Scores and top five wording issues recorded |
| 20 | Prompt revisions from the tone review; bump `AERIS_CONVERSATION_PROMPT_VERSION` to 1.1; re-run the 311-case safety set and the e2e scenarios | 311/311, 17/17 |
| 21 | Ask beta users the three questions that matter: would you be disappointed if Aeris disappeared, what did it help with, would you pay US$9.99 | Written answers |
| 22 | 📄 Freeze `rc-2026-09-XX-06` | Evidence file updated |

### Phase 5: Billing go-live (Days 20–27, parallel from Day 20)

| Day | Item | Evidence |
|---|---|---|
| 20 | 🔧 Paddle seller verification: business details, website review (Paddle checks the landing page, terms, privacy and refund policy, and that the product is a permitted category). Wellness apps are permitted; medical claims are not. | Verification approved |
| 21 | 🔧 Approve `aeris.smartmango.ai` as a checkout domain; set the live default payment link to `/app/billing/processing` on that domain | Paddle dashboard |
| 22 | 🔧 Create live product and prices (US$9.99 monthly, US$79.99 annual); set live price IDs, live client token and live webhook secret **only in Vercel production** | `verify-build-env` passes with `BILLING_ENABLED=true`, `PADDLE_LIVE_ENABLED=true` |
| 23 | 📄 7AC billing review: remove the preflight billing lock deliberately; record the decision; CSP now needs the Paddle origins in enforce mode; walk checkout under enforce on a preview first | Review note; zero CSP violations |
| 24 | 🔧 Live lifecycle test with a real card: purchase, webhook, Plus active, portal open, scheduled cancel, refund from the Paddle dashboard, deletion of the paying account with tombstone closure | Every row in the Gate 0 list re-proven on live |
| 25 | ⚙ Refund and cancellation copy on `/app/plan` and in terms (Paddle handles the money; Aeris explains it) | Copy live |
| 26 | Switch `CSP_MODE=enforce` on production; watch the report sink for 24 hours | Zero unexpected violations |
| 27 | 📄 Freeze `rc-2026-09-XX-07`, the launch candidate | Evidence file updated |

### Phase 6: Launch (Days 28–30)

| Day | Item | Evidence |
|---|---|---|
| 28 | Landing page final pass: promise, three screens, pricing, boundary statement, safety link, no clinical claims. PWA manifest and install prompt. Open Graph image. | Lighthouse ≥90 on mobile; install works on iOS Safari and Android Chrome |
| 28 | Monitoring runbook: what to watch daily (provider failures, latency, safety availability signal, budget breaches, webhook failures, CSP reports), who to call (Lovable support, Paddle support, Supabase support), and the kill switches (`BILLING_ENABLED`, budget thresholds, model ID) | `docs/runbook.md` |
| 29 | Soft launch: personal announcement, HK and SG communities, one UK and one AU community, Product Hunt scheduled for Day 30. Beta users' Plus grants converted to a 30-day coupon so they choose to pay. | Posts live |
| 30 | Product Hunt. Founder available all day for feedback and flags. Evening: first-day numbers against the launch metrics in `02-mvp-spec.md` section 10. | Day-1 note |

---

## 2. RC4 gate table (copy into `docs/rc4-certification.md`)

| Gate | Result | Evidence | Date |
|---|---|---|---|
| Deployment identity and backend fingerprint | NOT TESTED | | |
| Auth email on production sender domain | NOT TESTED | | |
| JWT isolation, staging→prod and prod→staging | NOT TESTED | | |
| Two-user RLS and IDOR probes | NOT TESTED | | |
| SECURITY DEFINER function probes | NOT TESTED | | |
| One explicit AI provider; mock refused | NOT TESTED | | |
| Safety journey, 10 scenarios | NOT TESTED | | |
| Privacy export | NOT TESTED | | |
| Account deletion and tombstone | NOT TESTED | | |
| Post-deletion webhook ignored | NOT TESTED | | |
| Retention purge on demand and `pg_cron` present | NOT TESTED | | |
| MCP and OAuth endpoints 404 | NOT TESTED | | |
| Security headers | NOT TESTED | | |
| CSP enforcement dry run on preview | NOT TESTED | | |
| Browser and server persistence agreement | NOT TESTED | | |

---

## 3. Definition of done per phase

| Phase | Done means |
|---|---|
| 0 | Preview works; one production backend; one retention document; real cost rates; analytics wired and consent-gated |
| 1 | Every RC4 row PASS with dated evidence; candidate frozen |
| 2 | Three documents live and linked; disclosure shown and logged at session start; flag on every reply; nine countries in the crisis registry; 17 e2e safety scenarios pass; DPIA-lite written |
| 3 | Insights screen shows real insights for a synthetic account that crosses each threshold; effectiveness ordering unit-tested; thinking surface and voice input work on iOS Safari and Android Chrome |
| 4 | ≥25 beta users, ≥100 completed sessions, tone review done, prompt 1.1 passes the full safety set, at least 10 written answers to the three questions |
| 5 | Real-card lifecycle proven on live including refund and deletion; CSP enforced 24 h clean |
| 6 | Public, installable, paid, monitored, with a runbook |

---

## 4. Lovable prompt templates

Paste as written, one per message, with `plan_mode` on for the first two. Each one names files so the agent does not wander.

**Insights read model**

> Implement `insights_for_user(_user_id uuid)` as a `security invoker` SQL function in a new migration, plus a server function in `src/lib/insights/insights.server.ts` that calls it for the signed-in user only when `user_preferences.personalization_enabled` is true. It returns JSON with sections `time_of_day`, `day_of_week`, `triggers`, `patterns`, `what_helps`, `intensity_trend`. Each section has `available: boolean`, `reason: string | null` naming the unmet threshold, and `items`. Thresholds: time of day needs ≥6 sessions and one bucket ≥40% (buckets night 23–05, morning 05–11, afternoon 11–17, evening 17–23 from `anxiety_sessions.local_hour`); day of week needs ≥8 sessions and one day ≥30%; triggers needs ≥4 sessions and returns top 3 `trigger_category` by count; patterns reuses `patternStrength` and `patternPhrase` from `src/lib/domain/pattern-strength.ts` and excludes `hidden_by_user`; what_helps needs ≥2 completed `intervention_results` per intervention and returns mean intensity change and the helpfulness trend using the same rules as `toEffectiveness` in `src/lib/ai/conversation-context.ts`; intensity_trend needs ≥3 ISO weeks with data and returns weekly mean of `intensity_before`. Add `local_hour`, `local_dow`, `tz_at_start` to `anxiety_sessions` in the same migration and populate them in `src/lib/supabase/session-service.ts` at creation from the profile timezone, else the browser zone passed by the client, else UTC with `tz_at_start = 'UTC?'`. Write vitest tests that construct synthetic rows at each threshold boundary. Do not touch the conversation pipeline or any safety module.

**Insights screen**

> Replace the placeholder in `src/routes/app.insights.tsx` with the Anxiety Map. Use `AppShell`, `PageContainer`, the existing `insight` surface from `src/components/ui/insight.tsx`, and `SurfaceCard`. Header: "Your patterns" and one line: "Observations, not conclusions. You can hide anything that isn't true for you." Render sections in this order: time of day, day of week, what it tends to be about, thinking patterns, what helps, intensity over time. A section whose `available` is false renders a quiet empty state with its `reason`. Pattern items carry "Not true for me", wired to the existing hide behaviour in `src/lib/supabase/pattern-service.ts`. The intensity trend uses `src/components/ui/chart.tsx` with one muted line and no gridlines. Copy rules: never "you are"; use "tends to", "has come up", "may be"; never percentages, use "most often", "often", "sometimes". Free accounts see the headings and one example card in the empty state with the existing plan-comparison link; do not add a new paywall component. Respect reduced motion. Do not change any server code beyond calling `getInsights`.

**Effectiveness-aware ordering**

> In `src/lib/ai/run-conversation-turn.server.ts`, after `getAllowedInterventions`, order the list by the person's `interventionEffectiveness` from the loaded context: score = (−averageIntensityChange × 2) + (often_helpful 2, sometimes_helpful 1, otherwise 0); interventions with fewer than 2 completions keep canonical order after the scored ones. Pass the ordered list as `allowedInterventions` and add exactly one line to `buildConversationInstructions` in `src/lib/ai/conversation-prompt.server.ts` after ALLOWED_INTERVENTIONS: "This list is ordered by what has helped this person before. Prefer earlier entries unless the current situation clearly calls for another." In `src/components/ui/intervention.tsx`, show the line "This has helped you before" when the intervention has ≥2 completions and mean change ≤ −2; pass that fact from the server in the turn response as `intervention_evidence: { [slug]: boolean }`. Add unit tests for the ordering. Do not change the safety gate, the schema, or the state machine.

**Staged thinking surface**

> On `src/routes/app.session.$sessionId.tsx`, while a turn is in flight, show within 300 ms a quiet inline status that reads by state: UNDERSTAND and CLARIFY "Reading what you wrote", IDENTIFY_PATTERN "Noticing what your mind is doing", SELECT_INTERVENTION "Choosing a tool", REASSESS and REFLECT "Taking that in". Use the existing skeleton and motion tokens; no spinner, no pulsing orb. Remove it when the reply arrives or the request fails. Reduced motion collapses the transition. No server changes.

**Voice input**

> Add a microphone affordance to the session composer using the Web Speech API when `window.SpeechRecognition` or `webkitSpeechRecognition` exists; otherwise render nothing. Recognised text is placed in the composer for the person to review and send; it is never sent automatically. No audio leaves the browser and nothing is stored. Add a one-line note under the composer the first time it is used: "Voice uses your browser's speech recognition. Nothing is recorded by Aeris." Respect reduced motion. No server changes.

---

## 5. Budget for the 30 days

| Item | Estimate (US$) | Notes |
|---|---|---|
| Lovable credits | 100–200 | Phases 2–3 are roughly 15 substantial prompts plus fixes |
| AI usage (beta) | 5–40 | 40 users × 5 sessions at the cost-per-session table in `02-mvp-spec.md` 7.3 |
| Vercel Pro | 20 | Needed for production env separation and logs |
| Supabase Pro (production) | 25 | Daily backups, which also closes the "backup window" retention decision |
| Custom SMTP (Resend/Postmark) | 0–20 | Free tier likely sufficient for beta |
| PostHog | 0 | Free tier |
| Legal templates plus a two-hour HK lawyer review | 300–800 | Terms, privacy, boundary; ask for the WA and GDPR health-data clauses specifically |
| Paddle | 0 upfront | 5% + US$0.50 per transaction, taken from revenue |
| Domain, OG image, Product Hunt | 0–50 | |
| **Total** | **~450–1,150** | |

---

## 6. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Preview error is a deeper Lovable Cloud or contract problem | Medium | Blocks everything | Day 1, first thing; fall back to Vercel preview deployments for verification if Lovable preview stays broken |
| Paddle verification takes longer than a week | Medium | Delays paid launch, not launch | Start Day 20 at the latest; launch with Free only and enable Plus when approved |
| Single AI provider outage during beta or launch | Low | Degraded mode, no harm | Deterministic safety floors and app-owned tools already handle it; second adapter is v1.1 |
| Tone review finds the replies clinical or cold | Medium | Retention | Prompt 1.1 on Day 20 with a full safety re-run; budget one extra day |
| A beta user has a crisis | Low | Serious | Crisis routing is tested; beta brief includes resources; founder reviews safety events daily during beta; no message text is ever in those events |
| US state law exposure | Medium if marketing in the US | Fines, PRA | Wellness positioning, disclosure, published crisis protocol, Utah filing, no US paid marketing until Day 12 checklist is signed |
| Founder time overrun | High | Slips | Phases 2 and 3 are parallel and independently shippable; if behind by Day 16, cut voice input and the home teaser, never the Anxiety Map or any compliance item |
| Applying the insights migration to production | Low | Data | Manual path only, dry run first, on a day with no other change |

---

## 7. What not to do in these 30 days

No second AI provider, no native app store submission, no push notifications, no wearable or calendar integration, no new interventions beyond the five, no therapist directory, no community, no multi-language UI, no pricing experiments, no paid ads. Each of these is either v1.1 or a distraction from certification and the map.

---

## 8. After Day 30

Week 5–6: the four additional interventions (`02-mvp-spec.md` 6.2), a second AI provider adapter starting with the safety classifier, PWA polish, and the first cohort retention review. Week 7–8: decide on app-store submission based on whether iOS Safari PWA limitations are hurting the 1:30 a.m. use case, and whether US marketing is worth the compliance overhead.
