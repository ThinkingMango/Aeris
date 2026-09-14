# Deploying Aeris: Vercel, Supabase, Paddle

Everything here is a step you perform once. Where a value has to be copied
between services, it is named exactly as each service labels it, because those
names change and the labels are what you will actually see on screen.

Read [§0](#0-before-you-start) first. Two decisions in it are expensive to
reverse.

---

## 0. Before you start

### 0.1 Pick one region and use it everywhere

The application, the database and your users should be in the same part of the
world. A function in Washington talking to a database in Singapore adds a
round trip to every query, and a conversation turn makes several.

`docs/04-viable-options.md` puts the first revenue in Hong Kong, so the repo
ships configured for Singapore, which is the closest either provider offers:

| | Setting | Where |
|---|---|---|
| Vercel | `sin1` | `vercel.json` → `regions` |
| Supabase | Southeast Asia (Singapore) `ap-southeast-1` | chosen at project creation |

**A Supabase project's region cannot be changed after creation.** If your first
users will be in Europe or North America instead, change both now: edit
`vercel.json` to `fra1` or `iad1` and pick the matching Supabase region.

### 0.2 Two Paddle accounts, not one

Paddle's sandbox and production are separate accounts with separate logins,
separate API keys, separate webhook secrets and separate price ids. Nothing
transfers. Build against sandbox, and treat going live as a configuration
change plus a re-test, not a switch.

### 0.3 What Paddle does and does not do for you

Paddle is your **merchant of record**. It sells to your customer, so VAT, GST
and sales tax registration, collection and remittance are Paddle's liability,
not yours. That is the reason it is here rather than a payment processor: an
EU consumer buying a digital subscription from a Hong Kong seller triggers VAT
from the first euro, with no threshold, and handling that yourself means
registering for OSS and filing returns.

What it does not do: Paddle is not a substitute for your own terms of service,
privacy policy, or the product boundary statement. Those are still yours to
write, and [§7](#7-before-real-users) lists them.

---

## 1. Supabase

### 1.1 Create the project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Name it `aeris-production`.
3. **Region: Southeast Asia (Singapore)** — see §0.1. This cannot be changed later.
4. Generate a database password and **put it in your password manager now**. It
   is shown once and is part of every connection string below.
5. Create, and wait for provisioning (about two minutes).

### 1.2 Copy four values

**Project Settings → API keys**

| Label on screen | Goes to |
|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `publishable` key (older projects: `anon` `public`) | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| `service_role` `secret` | `SUPABASE_SERVICE_ROLE_KEY` |

The service role key bypasses row-level security entirely. It belongs in
Vercel's environment variables and in `.env.local`, and nowhere else — not in
the repository, not in a screenshot, not in a support ticket.

**Project Settings → Database → Connection string**

| Tab | Port | Goes to | Why |
|---|---|---|---|
| **Transaction pooler** | 6543 | `DATABASE_URL` | What the running application uses |
| **Direct connection** | 5432 | `MIGRATE_DATABASE_URL` | What migrations use |

Replace `[YOUR-PASSWORD]` in each with the password from §1.1.

**These are not interchangeable, and using the wrong one fails in a way that
only appears in production.** A serverless function opens its own database
connection, so a busy deployment holds hundreds; the direct port has a hard
limit and starts refusing them. The pooler multiplexes. Conversely, schema
changes cannot run through the transaction pooler at all, which is why
migrations get the direct string. The application refuses to start in
production on an unpooled URL, and `npm run db:policies` refuses to run on a
pooled one — each says which one it wanted.

### 1.3 Enable anonymous sign-ins

**Authentication → Sign In / Providers → Anonymous sign-ins → enable.**

This is load-bearing. Pressing "Help me now" creates a real Supabase user with
nothing typed, which is what makes `auth.uid()` — and therefore every
row-level security policy — work for someone who has not signed up. Without
it, the first request to `/api/session` fails and the error names this setting.

While you are here: **Authentication → Attack Protection → enable CAPTCHA**
and add the key to your Supabase project. Anonymous sign-in is an unauthenticated
write endpoint, and without a challenge it can be scripted.

### 1.4 Set the URLs the auth emails point at

**Authentication → URL Configuration**

- **Site URL**: `https://your-domain.com`
- **Redirect URLs**: add `https://your-domain.com/**` and `http://localhost:3000/**`

### 1.5 Fix the email templates — do not skip this

Supabase's default templates use `{{ .ConfirmationURL }}`, which is built for
a client-side flow. This application verifies server-side at `/auth/confirm`,
so the default link lands somewhere that cannot complete the sign-in and the
person sees a failure with no explanation.

**Authentication → Emails → Templates.** In both **Confirm signup** and
**Magic Link**, replace the link's `href` with:

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

For **Magic Link**, use `type=magiclink` instead of `type=email`.

### 1.6 Configure real email sending

**Project Settings → Authentication → SMTP Settings.**

Supabase's built-in sender is rate limited to a handful of messages per hour
and is explicitly not for production. Connect Resend, Postmark or SES. Until
you do, sign-in links will silently stop arriving once a few people try at
once — and they will conclude the product is broken rather than rate limited.

### 1.7 Create the schema

From your machine, with `MIGRATE_DATABASE_URL` set to the **direct** string:

```sh
npm run db:deploy
```

That runs the Drizzle migration and then applies `src/db/policies.sql`. Re-run
it after any schema change; the policy file is idempotent by design, so
applying it repeatedly is safe and is the intended habit.

### 1.8 Verify the security actually took

**Advisors → Security Advisor.** Expect zero "RLS disabled in public" findings.
If any table is listed, `npm run db:policies` did not complete — re-run it and
read the error rather than dismissing the finding.

Then check by hand, in **SQL Editor**:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

Every row must show `rowsecurity = true`. A `false` on `messages` means the
only table holding what people typed is readable by anyone with the
browser key.

---

## 2. Paddle (sandbox first)

### 2.1 Create the sandbox account

Sign up at [sandbox-vendors.paddle.com](https://sandbox-vendors.paddle.com).
It is a separate account from production, with its own login.

### 2.2 Create the product and its prices

**Catalog → Products → New product**

- Name: `Aeris Plus`
- Tax category: **Standard digital goods**

Then **New price** on that product:

- Billing period: **Monthly**, recurring
- Amount: your headline price (`docs/01` argues for US$12)

Repeat for an annual price if you are offering one. Copy each price id — they
look like `pri_01h...` — into `PADDLE_PRICE_PLUS_MONTHLY` and
`PADDLE_PRICE_PLUS_ANNUAL`.

Only price ids named in your environment can be bought. An unrecognised one is
refused before any call to Paddle, and if it somehow arrived on a subscription
it would grant the free tier rather than a guess at what was meant.

### 2.3 Create the two tokens

**Developer Tools → Authentication**

| Create | Goes to | Notes |
|---|---|---|
| **API key** | `PADDLE_API_KEY` | Server-side. Reads and writes every customer in the account. |
| **Client-side token** | `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | Public by design. It can open a checkout and nothing else. |

### 2.4 Create the webhook destination

**Developer Tools → Notifications → New destination**

- URL: `https://your-domain.com/api/billing/webhook`
- Subscribe to: `subscription.created`, `subscription.activated`,
  `subscription.updated`, `subscription.canceled`, `subscription.past_due`,
  `subscription.paused`, `subscription.resumed`, `subscription.trialing`

Copy the **secret key** into `PADDLE_WEBHOOK_SECRET`. The webhook rejects any
request whose signature does not verify against it, before reading anything
else in the body.

### 2.5 Approve your domain

**Checkout → Website approval** → add your domain.

Paddle.js refuses to open a checkout on a domain that has not been approved.
In sandbox this is instant. **In production it is a manual review that can take
a few business days**, so submit it as soon as you have the domain rather than
on the day you want to launch.

---

## 3. Vercel

### 3.1 Import

1. [vercel.com/new](https://vercel.com/new) → import `ThinkingMango/Aeris`.
2. Framework preset: **Next.js**, detected automatically. Leave the build and
   output settings alone; `vercel.json` carries what needs changing.
3. **Do not deploy yet** — add the environment variables first, or the first
   build will deploy a version that refuses every request.

### 3.2 Environment variables

**Project → Settings → Environment Variables.** Set these for **Production**:

| Name | Value |
|---|---|
| `APP_ENV` | `production` |
| `DATABASE_URL` | Transaction pooler string, port **6543** |
| `NEXT_PUBLIC_SUPABASE_URL` | from §1.2 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | from §1.2 |
| `SUPABASE_SERVICE_ROLE_KEY` | from §1.2 |
| `ANTHROPIC_API_KEY` | from `console.anthropic.com` → API Keys |
| `BILLING_ENABLED` | `true` when you are ready to sell, `false` until then |
| `PADDLE_ENVIRONMENT` | `production` (or `sandbox` while testing) |
| `PADDLE_API_KEY` | from §2.3 |
| `PADDLE_WEBHOOK_SECRET` | from §2.4 |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | from §2.3 |
| `PADDLE_PRICE_PLUS_MONTHLY` | from §2.2 |
| `NEXT_PUBLIC_PLUS_PRICE_LABEL` | e.g. `US$12/month` |

`MIGRATE_DATABASE_URL` is deliberately **not** set on Vercel. Nothing in the
running application should be holding a connection that can rewrite the schema.

For a **Preview** environment, set `APP_ENV=staging`, point it at a separate
Supabase project, and keep `PADDLE_ENVIRONMENT=sandbox`. A preview deployment
sharing the production database will write real rows from unreviewed code.

### 3.3 Deploy, then check the deployment can see everything

```sh
curl https://your-domain.com/api/health
```

```json
{
  "ok": true,
  "environment": "production",
  "storage": "postgres",
  "auth": true,
  "billing": { "enabled": true, "ready": true, "missing": [] }
}
```

Read all four. `storage: "memory"` means `DATABASE_URL` is missing and every
conversation is being lost when the instance recycles — a deployment that
looks perfectly healthy from the outside. `auth: false` means Supabase is not
configured and there is no row-level security. `missing` names environment
variables, never their values.

---

## 4. Test a real purchase, in sandbox

1. Set `BILLING_ENABLED=true` and `PADDLE_ENVIRONMENT=sandbox`.
2. Open `/help`, have a short conversation, then open `/account`.
3. Press **Upgrade**. The Paddle overlay should open.
4. Pay with Paddle's test card: `4242 4242 4242 4242`, any future expiry, any CVC.
5. Reload `/account`. The plan should read **Aeris Plus**.

If it still says Free, the checkout succeeded and the webhook did not. In
order of likelihood:

| Symptom | Cause |
|---|---|
| Paddle → Notifications shows 400 `invalid_signature` | `PADDLE_WEBHOOK_SECRET` is from the other environment |
| Paddle shows delivery failures or timeouts | Wrong URL, or the deployment is not public |
| Delivered 200 with `ignored: "no_matching_user"` | The purchase did not go through `/api/billing/checkout` |
| Delivered 200, plan unchanged, price id in Paddle differs from env | `PADDLE_PRICE_PLUS_MONTHLY` does not match the price that was bought |

Paddle's **Notifications → destination → logs** shows every attempt with the
status we returned, and `billing_events` in Supabase shows what we did with
each one and why.

---

## 5. Going live with Paddle

1. Complete Paddle's business verification. Expect this to take days, not hours.
2. Recreate the product and prices in the **production** account. New ids.
3. Create production API key, client-side token and webhook destination.
4. Submit the domain for approval (§2.5) and wait for it.
5. Update every `PADDLE_*` variable on Vercel and set `PADDLE_ENVIRONMENT=production`.
6. Redeploy, and make one real purchase with a real card. Refund it from the
   Paddle dashboard afterwards.

Sandbox rows cannot grant production access even if the two ever share a
database: the environment is stored on the subscription row and checked on
every read.

---

## 6. Running it

| Task | Command |
|---|---|
| Schema change | edit `src/db/schema.ts` → `npm run db:generate` → review the SQL → `npm run db:deploy` |
| Re-apply policies alone | `npm run db:policies` |
| Check a deployment | `curl .../api/health` |
| What a webhook did | `select * from billing_events order by received_at desc limit 20;` |

### Things worth watching

**Anonymous users accumulate.** Every visitor who presses "Help me now"
becomes a row in `auth.users`, and Supabase does not remove them. They cost
nothing individually but the table grows without limit. Add a scheduled job
that deletes anonymous users with no sessions older than 30 days, and keep
anyone who actually used the product.

**Database connections.** Supabase → Reports → Database. If pooler client
connections sit near the ceiling, lower `DATABASE_POOL_MAX` before raising the
plan: more connections per instance does not make any single request faster.

**Webhook failures.** A row in `billing_events` with `status = 'failed'` is
someone who paid and did not get access. It is re-claimable — Paddle's retry
will be processed rather than dismissed as a replay — but a row that stays
failed after the retries are exhausted needs a person.

---

## 7. Before real users

None of this is deployment, and all of it blocks launch. `docs/03` has the
detail; this is the checklist.

- [ ] Terms of service, privacy policy, and the product boundary statement as a
      page a person can read before they type anything
- [ ] The crisis resource registry re-verified — every number in
      `src/core/copy/index.ts` carries a `lastVerified` date, and a wrong number
      on that screen is the worst failure this product has
- [ ] A named person who reads `safety_events` weekly
- [ ] Data export and account deletion working end to end, since both are
      promised on every plan
- [ ] Paddle domain approval granted (§2.5)
- [ ] Production SMTP connected (§1.6)
- [ ] The safety evaluation re-run against the deployed `promptVersion` and
      `safetyRulesVersion` reported by `/api/health`
