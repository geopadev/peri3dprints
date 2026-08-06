# PLAN.md

Build plan for peri3dprints. This file is the spec. It does not change as work
progresses. Progress lives in `PROGRESS.md`, which you create and maintain.

Read `CLAUDE.md` before doing anything. If this file and `CLAUDE.md` disagree,
`CLAUDE.md` wins and you say so out loud.

Full task detail for each stage is in `BUILD_PLAN.md` under the matching stage
number. This file tells you what order to work in, when a stage is finished, and
how to pick up after a break. `BUILD_PLAN.md` tells you what to actually build.

---

## Resume protocol

Run this at the start of every session, before touching any code.

1. Read `CLAUDE.md`, then this file.
2. Read `PROGRESS.md`. If it does not exist, create it from the template at the
   bottom of this file and treat every stage as not started.
3. **Verify the ledger against the repo. Do not trust it.** A stage is only done
   if its exit checks actually pass right now. Run them. If `PROGRESS.md` claims
   stage 5 is done but `/admin/products` does not exist, the ledger is wrong:
   correct it and say what you corrected.
4. Run `git status` and `git branch --show-current`. If the working tree is dirty
   or you are on a feature branch, the last session was interrupted. Report what
   you found and ask how to proceed. Do not silently discard or commit someone
   else's uncommitted work.
5. Announce: the current stage, the three or four things you plan to do, and
   anything blocked. Then start.

## Working rules

- One stage at a time. Finish it, run the exit checks, commit, update
  `PROGRESS.md`, then **stop and report**. Wait for a go-ahead before the next
  stage. Do not chain stages.
- Branch per stage, named in the stage heading. Never commit to `main`.
- Commit as you go, per `CLAUDE.md` section 9. A stage is several commits, not one.
- Exit checks are not optional and not self-assessed by vibes. Run the commands.
  Paste the real output in your report.
- If a stage is blocked on something only a human can supply (an API credential,
  a business decision, an account approval), do not stall and do not invent a
  workaround. Build against the interface, stub the missing provider so the app
  still boots and builds, record the blocker in `PROGRESS.md` under Blockers, and
  move to the next unblocked stage.
- If you discover the plan is wrong, say so and propose a change. Do not quietly
  build something different from what is written here.
- Never mark a stage done to make the ledger look tidy.

## Global exit checks

Every stage must end with all of these passing:

```bash
npm run typecheck
npm run lint
npm run build
```

Plus `npx vitest run` once tests exist (stage 8 onward).

---

## Stages

### Stage 1 (`chore/scaffold`) Scaffold

Next.js 15 App Router, TypeScript strict, Tailwind v4, directory skeleton,
`.env.example`, package scripts, README.

**Exit:** `npm run dev` serves a page, `npm run build` and `npm run typecheck`
pass, `.env.local` is gitignored, `git status` is clean.

### Stage 2 (`feat/design-system`) Design system

Tokens, fonts, base components, `/styleguide`. Follow `CLAUDE.md` section 3
exactly rather than improvising a direction.

**Exit:** `/styleguide` renders every component in every state including focus
and disabled. Report any token pair that fails WCAG AA at 16px.

### Stage 3 (`feat/schema`) Database schema

Migrations `0001_init.sql` and `0002_seed.sql` written to the schema in
`BUILD_PLAN.md` stage 3. RLS on every table.

**Exit:** both files exist under `supabase/migrations`. Do not apply them yet.
Show me the SQL and stop.

Blocker if the Supabase project is not linked: check `npx supabase projects list`
and report rather than guessing a project ref.

### Stage 4 (`feat/supabase-auth`) Supabase wiring and owner auth

Three clients, middleware, anonymous buyer sign in, magic link owner login,
generated types.

**Exit:** migrations applied to the dev project, `src/lib/database.types.ts`
generated and non-empty, `/admin` redirects an anonymous visitor to
`/admin/login`, `src/lib/supabase/admin.ts` carries the `server-only` guard.

> Stage 4 shipped anonymous buyer sign in and a separate magic link route for
> the owner. That was replaced by stage 4b. The text above is left as it was
> written, as a record of what was actually built, not as current instructions.

### Stage 4b (`feat/buyer-accounts`) Real buyer accounts

Replaces anonymous sign in and the separate owner magic link with one auth
system: email and password with confirmation, through Supabase Auth. The owner
signs in the same way as everyone else and is distinguished only by
`profiles.role = 'owner'`. Delete `/admin/login`.

Full detail in `BUILD_PLAN.md` prompt 4b.

**Exit:** a new account can be created with email and password, confirms by
email, and signs in. Signed out visitors can still browse, open a product and
fill a cart. Tapping "Ask to buy" while signed out lands on
`/sign-in?next=...` and, after signing in, returns to the same page with the
cart intact rather than emptied. `/admin` with a signed in non owner shows the
plain "not the shop owner" page and does not loop. `/account`, `/orders` and
`/messages` redirect to `/sign-in?next=...` when signed out. `/admin/login`
returns 404. Report whether any existing RLS policy relied on an anonymous
session.

Not blocked on anything external: no Google credentials, no partner account.
Custom SMTP is a launch blocker rather than a stage blocker: the built in
sender is rate limited and will drop confirmation emails once there are real
users, but stage 4b can be built and verified against Supabase's built in
sender first.

### Stage 5 (`feat/admin-products`) Admin product management

Admin shell, product CRUD, image upload, categories, settings.

**Exit:** a product can be created with three images, a variant and full spec
fields, and it round-trips after a page reload. Test this on a 390px viewport,
not just desktop.

### Stage 6 (`feat/storefront`) Public catalogue and product page

Home, shop, category, product detail. Hero is the stock itself, per `CLAUDE.md`
section 5.

**Exit:** an active product created in stage 5 is visible on `/` and at its slug.
A draft product is not. `generateMetadata` produces real OG tags.

### Stage 7 (`feat/cart`) Cart

Client store, server-side revalidation and pricing, slide-over and `/cart`.

**Exit:** cart survives a reload, prices come only from the database, archiving a
product in the admin removes it from an open cart with an explanation.

### Stage 8 (`feat/shipping`) Shipping layer

`ShippingProvider` interface, rate engine, manual provider, BOX NOW provider,
locker picker.

**Exit:** `npx vitest run` passes covering free-shipping threshold, weight tiers,
method exclusion and zone resolution. With BOX NOW env vars empty, the app still
builds and the provider returns a clean "not configured" result.

### Stage 9 (`feat/checkout`) Checkout and payment

Three-section checkout, payment adapters, Stripe Checkout, webhook handler.

**Exit:** a Stripe test-card order completes end to end and the webhook flips
`payment_status` to paid. A cash on delivery order and a bank transfer order both
reach the confirmation page. Report the test cards you used. Confirm no price is
read from the request body.

Blocked on Stripe test keys only, which are free and immediate. Live keys are not
needed until deploy.

### Stage 10 (`feat/orders`) Orders, email, fulfilment

Buyer order page with access token, admin order management, Resend templates,
`order_events` audit trail.

**Exit:** the tokenised order link opens in a private window with no session and
is refused when the token is wrong. All four emails render and read plainly, with
no em dashes.

### Stage 11 (`feat/chat`) Chat

Buyer widget, owner inbox, Realtime, attachments, WhatsApp link.

**Exit:** two browser windows, buyer and owner, exchange messages with no
refresh. Reading another conversation's attachment while signed in as a
different buyer is denied. Show me the denial. Opening chat while signed out
sends the visitor to `/sign-in?next=...` and returns them to the open chat
afterwards.

### Stage 12 (`feat/custom-requests`) Custom requests

`/custom` form, structured details panel, send-a-quote action.

**Exit:** a request with three reference images creates a conversation of kind
`custom_request`, and the quote action produces a working checkout link.

### Stage 13 (`chore/polish`) Polish

Legal pages, SEO, error states, keyboard pass, Lighthouse, copy audit.

**Exit:** Lighthouse mobile 90+ on performance and accessibility for `/`,
`/shop` and a product page, with the real numbers reported. A full list of every
em dash and banned word you found and changed.

### Stage 14 (`chore/deploy-prep`) Deploy preparation

`src/lib/env.ts` with zod validation at boot, CI workflow, secret leak check,
`DEPLOY.md` runbook.

**Exit:** grepping the built client chunks finds no service role key and no
import of `admin.ts`. Show the grep command and its output.

### Stage 15 (`feat/boxnow-live`) BOX NOW go-live

**Do not start this until sandbox credentials exist.** Mark it blocked and skip.

**Exit:** a sandbox order creates a delivery request, fetches a label PDF and
cancels the parcel. Report where the real API responses differed from the
documented shapes.

---

## PROGRESS.md template

Create this file at the repo root on first run. Update it at the end of every
stage and commit it with the stage's final commit.

```markdown
# Progress

Last updated: <date>
Current stage: <n>
Current branch: <branch or main>

## Ledger

| Stage | Name                              | Status      | Branch | Notes                          |
| ----- | --------------------------------- | ----------- | ------ | ------------------------------ |
| 1     | Scaffold                          | not started |        |                                |
| 2     | Design system                     | not started |        |                                |
| 3     | Database schema                   | not started |        |                                |
| 4     | Supabase wiring and owner auth    | not started |        |                                |
| 4b    | Real buyer accounts               | not started |        |                                |
| 5     | Admin product management          | not started |        |                                |
| 6     | Public catalogue and product page | not started |        |                                |
| 7     | Cart                              | not started |        |                                |
| 8     | Shipping layer                    | not started |        |                                |
| 9     | Checkout and payment              | not started |        |                                |
| 10    | Orders, email, fulfilment         | not started |        |                                |
| 11    | Chat                              | not started |        |                                |
| 12    | Custom requests                   | not started |        |                                |
| 13    | Polish                            | not started |        |                                |
| 14    | Deploy preparation                | not started |        |                                |
| 15    | BOX NOW go-live                   | blocked     |        | waiting on partner credentials |

Status is one of: not started, in progress, blocked, done.

## Blockers

Things that need a human. Date each one so a stale blocker is obvious.

- <date> Stage 15: BOX NOW sandbox credentials not issued yet.

## Decisions

Anything you decided that was not written in the plan, and why. One line each.
This is the record of why the code looks the way it does.

## Next session

The two or three concrete things to pick up. Written for someone with no memory
of this session, because that is exactly who reads it.
```
