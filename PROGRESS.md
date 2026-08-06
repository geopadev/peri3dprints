# Progress

Last updated: 2026-08-06
Current stage: 5
Current branch: feat/admin-products

## Ledger

| Stage | Name | Status | Branch | Notes |
| --- | --- | --- | --- | --- |
| 1 | Scaffold | done | chore/scaffold (built as feat/scaffold) | Verified 2026-08-06: typecheck, lint, build all exit 0. `.env.local` ignored. |
| 2 | Design system | done | feat/design-system | Verified 2026-08-06: `/styleguide` returns 200, 15 components. Contrast failures recorded under Decisions. |
| 3 | Database schema | done | feat/db-schema | Verified 2026-08-06: both migrations on disk. |
| 4 | Supabase wiring and owner auth | done | feat/auth | Verified 2026-08-06: 3 migrations applied to dev, types 794 lines, `/admin` 307s to `/admin/login`, `server-only` guard present. |
| 5 | Admin product management | in progress | feat/admin-products | |
| 6 | Public catalogue and product page | not started | | |
| 7 | Cart | not started | | |
| 8 | Shipping layer | not started | | |
| 9 | Checkout and payment | not started | | |
| 10 | Orders, email, fulfilment | not started | | |
| 11 | Chat | not started | | |
| 12 | Custom requests | not started | | |
| 13 | Polish | not started | | |
| 14 | Deploy preparation | not started | | |
| 15 | BOX NOW go-live | blocked | | waiting on partner credentials |

Status is one of: not started, in progress, blocked, done.

## Blockers

Things that need a human. Date each one so a stale blocker is obvious.

- 2026-08-06 Stage 15: BOX NOW sandbox credentials not issued yet.
- 2026-08-06 Stage 4 leftover: no owner account exists. `profiles` has 0 rows, so
  nobody can reach `/admin`. Needs a real magic link login at `/admin/login`,
  then `update public.profiles set role = 'owner' where email = '<you>'`.
  Until then the admin screens can only be verified by build and by temporarily
  querying as the service role, not by clicking through them signed in.
- 2026-08-06 Stage 4 leftover: Supabase Auth redirect allow-list still needs
  `http://localhost:3000/auth/callback` adding in the dashboard. No MCP tool
  exposes auth URL config.
- 2026-08-06 Stage 9: Stripe test keys not in `.env.local` yet.

## Decisions

Anything you decided that was not written in the plan, and why. One line each.
This is the record of why the code looks the way it does.

- 2026-08-06 Order numbers use a monthly counter, not the daily one the brief asked for: a daily reset under a `YYMM` prefix collides on the unique index.
- 2026-08-06 Danger buttons use `--magenta`; the palette has no destructive red and CLAUDE.md forbids inventing one. Magenta now doubles as sale tag and danger.
- 2026-08-06 Error text is `--ink`, not magenta: magenta on white is 3.34:1 and fails WCAG AA at 16px.
- 2026-08-06 Cyan fails AA as link text (2.37:1 on white, 1.96:1 on paper) and misses the 3:1 non-text floor as a focus ring. Implemented as CLAUDE.md section 8 specifies anyway; needs a palette decision.
- 2026-08-06 Dialog is centred with inset plus auto margins, never a translate, because the reduced-motion block sets `transform: none !important` globally.
- 2026-08-06 `cn()` is a plain join with no tailwind-merge, so a caller's `className` appends rather than replacing.
- 2026-08-06 Login uses `useActionState` rather than react-hook-form: one email field did not justify the dependency. The zod schema is still shared with the Server Action.
- 2026-08-06 `revoke execute` on `generate_order_number()` and `handle_new_user()`; they only ever run from triggers and were reachable via PostgREST RPC.
- 2026-08-06 Storage buckets are created by migration rather than by hand in the dashboard as SETUP.md section 2 says, so dev and prod cannot drift.

## Next session

The two or three concrete things to pick up. Written for someone with no memory
of this session, because that is exactly who reads it.

- Stage 5 is in progress on `feat/admin-products`. See the ledger note for where it got to.
- Before anything can be clicked through as the owner, do a real magic link login
  at `/admin/login`, then promote that profile row to `role = 'owner'`.
- Stage 6 is the public storefront and is not blocked on anything.
