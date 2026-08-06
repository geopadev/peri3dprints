# Progress

Last updated: 2026-08-06
Current stage: 5
Current branch: feat/admin-products

## Ledger

| Stage | Name                              | Status      | Branch                                  | Notes                                                                                                                            |
| ----- | --------------------------------- | ----------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Scaffold                          | done        | chore/scaffold (built as feat/scaffold) | Verified 2026-08-06: typecheck, lint, build all exit 0. `.env.local` ignored.                                                    |
| 2     | Design system                     | done        | feat/design-system                      | Verified 2026-08-06: `/styleguide` returns 200, 15 components. Contrast failures recorded under Decisions.                       |
| 3     | Database schema                   | done        | feat/db-schema                          | Verified 2026-08-06: both migrations on disk.                                                                                    |
| 4     | Supabase wiring and owner auth    | done        | feat/auth                               | Verified 2026-08-06: 3 migrations applied to dev, types 794 lines, `/admin` 307s to `/admin/login`, `server-only` guard present. |
| 5     | Admin product management          | blocked     | feat/admin-products                     | Code complete and merged. NOT marked done: the exit check needs a signed-in owner, and no owner account exists yet. See Blockers. |
| 6     | Public catalogue and product page | not started |                                         |                                                                                                                                  |
| 7     | Cart                              | not started |                                         |                                                                                                                                  |
| 8     | Shipping layer                    | not started |                                         |                                                                                                                                  |
| 9     | Checkout and payment              | not started |                                         |                                                                                                                                  |
| 10    | Orders, email, fulfilment         | not started |                                         |                                                                                                                                  |
| 11    | Chat                              | not started |                                         |                                                                                                                                  |
| 12    | Custom requests                   | not started |                                         |                                                                                                                                  |
| 13    | Polish                            | not started |                                         |                                                                                                                                  |
| 14    | Deploy preparation                | not started |                                         |                                                                                                                                  |
| 15    | BOX NOW go-live                   | blocked     |                                         | waiting on partner credentials                                                                                                   |

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
- 2026-08-06 Stage 5: the exit check cannot be run. It asks for a product created
  through the UI with three photos, a variant and full specs, round-tripped after
  a reload and checked at 390px. Every admin route is behind `requireOwner()`, so
  none of it can be reached until somebody does a real magic link login and that
  profile is promoted to `role = 'owner'`. What was verified instead: the same
  round trip driven straight against the database, using the exact select the
  edit page runs. Three images came back in position order, the variant came
  back, every spec field survived, and deleting the product cascaded its images
  and variants away. The 390px pass is genuinely untested.

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
- 2026-08-06 `slugify` transliterates Greek, because the shop is in Cyprus and a Greek title otherwise slugified to an empty string and could not be saved.
- 2026-08-06 Guarded admin pages live in an `(shell)` route group so `/admin/login` and `/admin/not-owner` stay outside the guard and cannot redirect to themselves.
- 2026-08-06 `requireOwner()` runs in the admin layout as well as the middleware, because middleware is a convenience redirect rather than the security boundary.
- 2026-08-06 Images and variants are replaced wholesale on save rather than reconciled row by row: the form always submits the full ordered list, so diffing would be more code and more ways to leave a gap in the positions.
- 2026-08-06 Photos are resized to 1600px in the browser before upload, since a phone camera file is 4 to 8 MB and the bucket caps at 10 MB.
- 2026-08-06 Category and settings forms are plain server-action forms with no client JS, so failures travel back as a query parameter rather than a return value.
- 2026-08-06 Admin nav sits at the bottom on a phone and the top on desktop, because that is where a thumb is when he is holding the phone one handed.

## Next session

The two or three concrete things to pick up. Written for someone with no memory
of this session, because that is exactly who reads it.

- Stage 5 code is written and merged to `main`. Before it can be signed off, add
  `http://localhost:3000/auth/callback` to the Supabase Auth redirect list, do a
  magic link login at `/admin/login`, then run
  `update public.profiles set role = 'owner' where email = '<you>'`.
- Then actually run the stage 5 exit check: add a print with three photos, a
  variant and full specs, reload it, and do it on a 390px viewport. Photo upload
  in particular has never been run against real Storage, only against the schema.
- Stage 6 is the public storefront. It is not blocked on anything and can start
  without the owner account existing.
