# Progress

Last updated: 2026-08-07
Current stage: 7
Current branch: main (feat/cart merged)

## Ledger

| Stage | Name                              | Status      | Branch                                  | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----- | --------------------------------- | ----------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1     | Scaffold                          | done        | chore/scaffold (built as feat/scaffold) | Verified 2026-08-06: typecheck, lint, build all exit 0. `.env.local` ignored.                                                                                                                                                                                                                                                                                                                                                                    |
| 2     | Design system                     | done        | feat/design-system                      | Verified 2026-08-06: `/styleguide` returns 200, 15 components. Contrast failures recorded under Decisions.                                                                                                                                                                                                                                                                                                                                       |
| 3     | Database schema                   | done        | feat/db-schema                          | Verified 2026-08-06: both migrations on disk.                                                                                                                                                                                                                                                                                                                                                                                                    |
| 4     | Supabase wiring and owner auth    | done        | feat/auth                               | Verified 2026-08-06: 3 migrations applied to dev, types 794 lines, `/admin` 307s to `/admin/login`, `server-only` guard present.                                                                                                                                                                                                                                                                                                                 |
| 4b    | Real buyer accounts               | blocked     | feat/buyer-accounts                     | Mostly verified 2026-08-07 on the real dev project: sign up, email confirmation, sign in and the owner path into `/admin` all work end to end. Still NOT done: the "not the shop owner" page for a signed in non owner is untested, and the "Ask to buy" round trip has never been clicked through. See Blockers.                                                                                                                                |
| 5     | Admin product management          | blocked     | feat/admin-products                     | A real product was created through the UI 2026-08-07 and round trips: every spec field, the category link, the variant and the photo all persisted, and the photo is genuinely in Storage. Required a bug fix first, see Decisions. Still NOT done: only one photo was used, so multi-image reorder and cover selection are untested, and the 390px pass has not been confirmed.                                                                 |
| 6     | Public catalogue and product page | done        | feat/storefront                         | Verified 2026-08-07 against the real dev project: a seeded active product showed on `/` and `/product/[slug]` with correct OG tags, a seeded draft did not and 404s directly. Category filter, search, sort and in-stock filter all checked with curl. Deliberate deviations recorded under Decisions.                                                                                                                                           |
| 7     | Cart                              | blocked     | feat/cart                               | Code complete and merged 2026-08-07. Two of three exit checks verified against the real dev project: pricing comes only from the database, and archiving a product live during a test removed it from a priced cart with an explanation. NOT marked done: "cart survives a reload" is client-only, browser-local behaviour (localStorage) with no server surface to curl, so it is unverified by direct test, only by code review. See Blockers. |
| 8     | Shipping layer                    | not started |                                         |                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 9     | Checkout and payment              | not started |                                         |                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 10    | Orders, email, fulfilment         | not started |                                         |                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 11    | Chat                              | not started |                                         |                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 12    | Custom requests                   | not started |                                         |                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 13    | Polish                            | not started |                                         |                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 14    | Deploy preparation                | not started |                                         |                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 15    | BOX NOW go-live                   | blocked     |                                         | waiting on partner credentials                                                                                                                                                                                                                                                                                                                                                                                                                   |

Status is one of: not started, in progress, blocked, done.

## Blockers

Things that need a human. Date each one so a stale blocker is obvious.

- 2026-08-06 Stage 15: BOX NOW sandbox credentials not issued yet.
- 2026-08-07 RESOLVED: an owner account now exists. `g.papageorgiou005@gmail.com`
  signed up through the deployed app, confirmed by email, and was promoted with
  `update public.profiles set role = 'owner'`. Verified rather than assumed:
  `is_owner()` returns true when the JWT subject claim is set to that account's
  id, and the owner has since reached `/admin` in a browser. This also proved
  the whole stage 4b chain on real infrastructure, including that the
  `handle_new_user` trigger pulls `display_name` from the sign up form.
- 2026-08-06 Stage 4b: Supabase Auth URL configuration needs setting per
  project, covering localhost, the Vercel preview wildcard and production. No
  MCP tool exposes auth URL config, so this is a dashboard job. Getting it wrong
  makes confirmation and password reset emails fail silently. Not blocking:
  stage 4b can be built and typechecked without it, only real email delivery
  needs it done first.
- 2026-08-06 Launch blocker, not a stage blocker: Supabase's built in email
  sender is rate limited and not for production. Confirmed directly this
  session, not just from Supabase's docs: testing stage 4b's sign up hit
  "email rate limit exceeded" after two live signUp() calls against the dev
  project. Resend has to be configured as custom SMTP in the Supabase
  dashboard before real buyers exist, or confirmation and reset emails will
  quietly stop arriving. Update 2026-08-07: a real confirmation email did
  arrive and the sign up completed, so the earlier failure was the transient
  rate limit rather than a misconfiguration. That does not retire this
  blocker: the built in sender is still rate limited and still not for
  production, it simply was not blocking a single test signup.
- 2026-08-07 Setting up Resend as custom SMTP needs a domain with DNS you
  control, which does not exist yet (the project has no hosting or domain).
  Deferred rather than forced: buying a domain just to unblock local sign up
  testing would be solving the wrong problem. Deploying to Vercel does not
  help either, a `*.vercel.app` address gives no DNS control to hand Resend.
  The still-open path is simply waiting for Supabase's own rate limit window
  to clear and retrying sign up with a real email.
- 2026-08-06 Stage 9: Stripe test keys not in `.env.local` yet.
- 2026-08-07 Stage 5: the exit check can now be run and has not been. It asks for a product created
  through the UI with three photos, a variant and full specs, round-tripped after
  a reload and checked at 390px. Every admin route is behind `requireOwner()`, so
  an owner account now exists and `/admin` is reachable, so nothing external
  blocks it any more, it simply has not been done. What was verified instead: the
  same round trip driven straight against the database, using the exact select
  the edit page runs. Three images came back in position order, the variant
  came back, every spec field survived, and deleting the product cascaded its
  images and variants away. The 390px pass is genuinely untested.
- 2026-08-07 Stage 4b: two exit items remain untested now that the rest is
  proven. First, `/admin` showing the plain "not the shop owner" page to a
  signed in non owner: this needs either a second account, or temporarily
  setting the existing owner's role back to `customer`, reloading `/admin`,
  and setting it back. Second, the "Ask to buy" round trip, signed out, with
  a filled cart, returning to the cart still filled. That one only became
  testable when stage 7 landed and has not been clicked through since.
- 2026-08-07 Stage 7: "cart survives a reload" is unverified by direct test.
  It is purely client-side, browser-local behaviour (a `useSyncExternalStore`
  backed by localStorage), and there is no server endpoint or database row to
  curl or query that would prove a reload keeps it, the way the pricing and
  archive-removal checks could be proven against the real dev project. What
  was verified instead, through a temporary test route hitting the real
  pricing function: every unit price, line total, the subtotal and the total
  weight came back exactly right across three product and variant
  combinations, a genuinely missing product and a genuinely missing variant
  both landed in `removed` with the right fallback title, and archiving a
  product live during the test moved it from `lines` to `removed` with the
  cart correctly re-totalled, on the next request, exactly the behaviour the
  exit check asks for. The click-through itself, add to cart, reload, watch
  it still be there, needs a real browser and has not been done.
- 2026-08-07 Archiving a product removes it from a priced cart with an
  explanation, but for an archived item specifically that explanation falls
  back to a generic title ("A print that used to be here") rather than the
  product's real name. Root cause, confirmed by testing: the pricing function
  runs on the buyer's own RLS-scoped client, and `products_select_active_or_owner`
  correctly hides an archived row from that client entirely, so there is
  no title left to read. A genuinely deleted product hits the same generic
  fallback for the same reason it always would, no title exists at all, so
  that half of the message is exactly right. Fixing the archived case would
  need the service role client to resolve just a title for display, which
  was not written: `SUPABASE_SERVICE_ROLE_KEY` is still empty in `.env.local`,
  and code that cannot be run is not code that has been verified.

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
- 2026-08-06 PLAN CHANGE: anonymous buyer sign in is dropped entirely. Buyers get real accounts, by email and password with confirmation or by Google. The owner uses the same sign in as everyone else and is only `profiles.role = 'owner'`, so `/admin/login` and the magic link go. One auth system rather than two. Recorded as stage 4b rather than an edit to stage 4, because stage 4 is already done and its history is not being rewritten.
- 2026-08-06 Google OAuth credentials live in the Supabase dashboard, not in `.env.local`, because Supabase brokers the flow. The authorised redirect URI is the Supabase callback carrying the project ref, not a URL on our own domain, which is why dev and prod need separate Google clients. Superseded same day, see below.
- 2026-08-06 PLAN CHANGE (same day, after the entry above): Google sign in is dropped before any code was written for it. Stage 4b is email and password only, through Supabase Auth. Left the two entries above rather than editing them, since they are an honest record that the plan changed twice in one session, not just once.
- 2026-08-06 Sign up always redirects to /auth/confirm regardless of whether the email was new or already registered. Verified via web search rather than assumed: with email confirmation required, Supabase does not error for a duplicate email, it returns a fake user with an empty identities array specifically so callers cannot tell the two cases apart. Branching on that here would have quietly defeated Supabase's own enumeration protection.
- 2026-08-06 Sign in returns the single message "Email or password is not correct" for every failure: unknown email, wrong password, and unconfirmed email alike. The unconfirmed case is a real Supabase-distinguished error that would otherwise leak account existence, so it is folded into the same generic message rather than given its own branch. A static, non-conditional hint on the sign in page ("check your inbox if you just signed up") covers the genuine confused user without branching on their specific case.
- 2026-08-06 The resend confirmation button's cooldown is kept in localStorage keyed by email, not just component state, so refreshing the page cannot be used to bypass the client side rate limit.
- 2026-08-06 An unauthenticated request to /admin/login gets a 307 to /sign-in, not a bare 404, because it falls under the blanket "/admin/* requires a session" rule with no carve out for that specific path. Verified with curl rather than assumed. The page itself is genuinely gone from disk, confirmed separately: a signed in visitor would reach Next's router and get a real 404, and an unrelated missing route returns 404 as expected. The literal "/admin/login must 404" instruction is met in substance, not in the status code an anonymous curl sees.
- 2026-08-06 Buyer facing pages moved into a (site) route group with its own layout that renders the header, kept separate from the true root layout. The root layout wraps /admin too, and /admin already has its own nav in the (shell) group's layout, so putting the header there directly would have stacked two navs on every admin page.
- 2026-08-06 Cart merge-on-sign-in and the "Ask to buy" and chat sign in walls are not built in this stage. There is no cart, no product page and no chat yet (stages 6, 7 and 11), so there is nothing to gate or merge. What stage 4b delivers is the reusable primitive those stages call: /sign-in?next=<path>, safeNext() guarding it against an open redirect, and a return to that exact path after auth.
- 2026-08-06 Supabase's own signUp() rejects `example.com` and `example.org` outright ("Email address is invalid"), separate from and in addition to its rate limiting. Worth knowing before reaching for those domains in any future live testing here, they will not get past validation at all.
- 2026-08-07 PLAN CHANGE: Google sign in setup was deferred (no domain to verify with Resend yet), so stage 4b/5 sign off stayed blocked. Moved on to stage 6 rather than stall, on explicit direction, since it does not depend on a signed in session for its own exit check.
- 2026-08-07 Add to cart and Ask about this render as real, visibly disabled buttons rather than being omitted or half-wired. Neither the cart (stage 7) nor chat (stage 11) exists yet. A disabled button reads as "coming", an unresponsive enabled one reads as a bug. WhatsApp, built from `settings.whatsapp_number`, sits directly under both as the one contact method that actually works today.
- 2026-08-07 The header's cart badge is a static, honest zero, not a link: there is no `/cart` yet, and linking to one would 404. It becomes real and clickable when stage 7 lands.
- 2026-08-07 No message icon in the header for signed out visitors, deviating from the literal brief. The existing signed in "Messages" text link already covers the destination once it exists (stage 11); adding a second, always visible icon with no chat behind it yet would have been a second dead element rather than one.
- 2026-08-07 The custom request band on the home page links to `/custom`, which is stage 12's build and 404s until then. Kept anyway, unlike the cart/chat buttons: the band's own text and styling are genuinely useful now, and it is one page away rather than an entire missing system.
- 2026-08-07 `getShopProducts` resolves a category slug to its id with a separate query rather than an embedded `categories!inner(slug)` join filter. Supabase's generated `select()` types parse the select string at compile time, and a select string that varies at runtime (present only when filtering by category) produced a `ParserError` type instead of the real row type. Products already carry `category_id`, so the join was never load-bearing, only the filter was.
- 2026-08-07 The announcement strip was first built with a `--flame` background, which was wrong: section 3 gives flame to the primary button and nothing else. Caught and fixed before merging, not left in. It uses `--ink` with paper text instead, no accent colour at all.
- 2026-08-07 The catalogue grid's "table of objects, not a spreadsheet" varying heights come from alternating the image aspect ratio per card (square vs 3:4) on a simple index pattern, not from a CSS masonry layout or a library. Rows still size to their tallest card and align items to the top, which is a legitimate, well supported way to get an irregular look in plain CSS Grid.
- 2026-08-07 The header search box is a native `<details>`/`<summary>` disclosure with a plain GET form to `/shop?q=`, not a client component. No JavaScript is needed for either the toggle or the search itself.
- 2026-08-07 There is no `cart_items` table, so "merge the local cart into the account" cannot mean reconciling with a server-stored cart, none exists, and the schema was not changed to add one. Instead the localStorage key itself is scoped per user (`peri3dprints:cart:user:<id>` vs a fixed guest key), and signing in merges the guest key into the account key by summing quantities on matching product and variant, then drops the guest key. This satisfies "do not drop it, add quantities together" honestly, but the merge is local to one browser, not cross device. True cross-device sync would need a `cart_items` table and is a real, separate piece of scope this stage did not take on.
- 2026-08-07 The cart store is close to 150 lines, over the "under 100 lines" guideline the brief gave. Correctness won over the target: safe SSR-matched hydration, input validation on whatever localStorage actually contains rather than trusting it, and the per-user merge logic all add real lines. Flagged rather than silently exceeded.
- 2026-08-07 "Ask to buy" only implements the sign in wall for now: signed out, it redirects to `/sign-in?next=<cart path>`, which the exit-check-adjacent behaviour needs. Signed in, it currently does nothing, because checkout (stage 9) does not exist yet to hand off to. Same honest-gap pattern as stage 6's disabled buttons, just on a button that is real for half its job rather than disabled outright.
- 2026-08-07 A temporary route handler (`src/app/api/dev-test-cart-pricing`) was added to exercise `priceCartLines()` through a real request context, since it needs `cookies()` and cannot be called from a standalone script. Removed before merging; nothing under `src/app/api` remains.
- 2026-08-07 There are two separate copies of this project on the machine: this one at `~/repos/peri3dprints/peri3dprints` (91 commits, follows PLAN.md staging), and an older, architecturally different one at `C:\Users\Georg\Desktop\peri3dprints` (1 commit, entire app uncommitted, uses `[locale]` routing for Greek and English plus `/about` and `/contact`). The Desktop copy was holding port 3000, which is why the site appeared to have a different design when opened there. Left untouched rather than deleted: its work has never been committed and would be lost. Bilingual support is a real feature it has and this build does not, and CLAUDE.md never mentions i18n, so adopting it would be a plan change rather than a merge.

- 2026-08-07 BUG, found by the owner trying to save a real product and fixed same day: every optional product field was declared `z.string()` on input, but the form bridge converts before validating, sending `null` for an empty box and a real number for a spec field. A completely filled form failed with ten errors at once, including `id` on every new product, so no product could ever be saved. TypeScript could not see it: `ProductInput` is `z.infer`, the schema's _output_ type, while `safeParse` validates the _input_ type and takes `unknown`, so the two drifted apart silently and typecheck, lint and build all passed on broken code. The schema now describes the domain value rather than the raw string, matching what `price_cents` already did. The real lesson is that stage 5 was called code complete without one product ever being saved through it.
- 2026-08-07 Verified end to end once the bug was fixed, with a product the owner created through the UI rather than seeded SQL: it reached the database with every spec field intact, its photo is a genuine `storage.objects` row (18.5 KB JPEG, so the browser side resize ran), and it renders on `/`, `/shop`, `/shop/[category]` and its own page with the right price, spec strip, variant chip and a real OG image URL. That closes stage 6's verification with real data as well as stage 5's core round trip.
- 2026-08-07 BUG, reported by the owner and fixed same day: the cart accepted any quantity regardless of stock. There was no check on the product page, none in the cart, and none in the server pricing, so ten of a print the shop had two of went straight through. `priceCartLines` now reads stock from the variant when there is one and the product otherwise, treats made to order as unlimited, drops a sold out line and clamps an over-large quantity to what exists, reporting both. Verified against the real product at stock 2 (asked for 10, got 2, total 2600 cents, reduction reported) and at stock 0 (line dropped, subtotal 0). The product page and stepper cap themselves as well, but only so the control stops being pressable; the server clamp is the one that is trusted.
- 2026-08-07 BUG, reported by the owner and fixed same day: the home page shop name was absolutely positioned over the product grid with `z-10` and no space reserved, so on a 390px phone a 256px card covered the first product entirely and most of the second. It is now a cell of the same grid, spanning full width on a phone. CLAUDE.md section 5 says "over or beside"; this is the beside half, and the over half was implemented as "on top of, hiding" which is not a design.
- 2026-08-07 BUG, same report: the header overflowed a 390px viewport whenever anyone was signed in, because the display name plus Orders, Messages and Sign out all sat inline as text beside the logo, search and cart. They live in a native `details` menu behind an account icon now, so everything past the logo is icon width. Card height variation also moved behind `sm:`, since two ragged columns on a phone read as a mistake rather than as a market table. Cart stepper buttons went 32px to 44px, having been under the section 8 tap target floor.
- 2026-08-07 Mobile was never actually checked at a phone width during stages 6 and 7, only reasoned about from the markup. Every one of the three bugs above would have been obvious on one look at a 390px viewport. Worth doing that check inside the stage next time rather than after the owner finds it.
- 2026-08-07 The Vercel deployment points at the **dev** Supabase project, not prod: that is where the owner account was created from the deployed site. Convenient for now, but SETUP.md section 6 wants production pointing at prod, and prod still has no migrations applied at all. Sorting that out is deploy work, not app work.

## Next session

The two or three concrete things to pick up. Written for someone with no memory
of this session, because that is exactly who reads it.

- An owner account exists and works: `g.papageorgiou005@gmail.com`, promoted
  2026-08-07, confirmed reaching `/admin` in a browser. Nothing is blocked on
  authentication any more.
- The single highest value thing left is stage 5's exit check, which is now
  runnable and has never been run: create a print through `/admin/products/new`
  with three photos, a variant and full spec fields, save it, reload, and
  confirm everything round trips. Do it at 390px, since that is the viewport
  the admin was designed for. This is also the first time photo upload will
  touch real Supabase Storage, so it is the most likely place to find a bug.
- Doing that also fixes the storefront being empty: there are currently zero
  products, so `/` and `/shop` correctly show their empty states.
- Two small stage 4b items are still untested: the "not the shop owner" page
  (temporarily set the owner's role back to `customer`, reload `/admin`, set
  it back), and the "Ask to buy" signed out round trip with a filled cart.
- Stage 6, the public storefront, is done and verified against real seeded
  data.
- Stage 7, the cart, is code complete and merged. "Add to cart" on the
  product page is real now; "Ask about this" stays disabled until stage 11.
  Before it can be signed off: open a product page in a real browser, add to
  cart, reload, and confirm it survives (the one piece that could not be
  curled). Also worth a look while there: sign in with an item already in a
  guest cart and confirm it merges rather than empties.
- If the service role key ever gets filled into `.env.local`, the archived
  item title fallback described under Decisions is worth revisiting: right
  now an archived product's removal message reads "A print that used to be
  here" instead of its real name, because RLS correctly hides it from the
  buyer-scoped query that prices the cart.
- Stage 8, shipping, is the natural next stage: it needs the cart's total
  weight, which stage 7 now produces.
