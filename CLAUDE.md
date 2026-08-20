# CLAUDE.md

Project instructions for Claude Code. Read this fully before any task in this repo.

---

## 1. What this is

A custom online shop for a single hobbyist seller of 3D printed toys and objects. He sells
at festivals and markets in Cyprus and wants the same stall online. He is not a company.

Two audiences:

- **Buyers** (mostly teens and twenties, mobile first, Cyprus and international). They browse,
  buy, and message the seller about custom prints.
- **The owner** (one person, non technical). He uploads prints from his phone, answers messages,
  and marks orders shipped. Every admin screen must survive being used one-handed on a phone
  in a noisy market.

Success looks like: the owner can list a new print in under two minutes without asking for help.

## 2. Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | Next.js 15, App Router, React 19, TypeScript strict | Server Components by default |
| Styling | Tailwind CSS v4 with custom tokens in CSS | No component library themes |
| Primitives | Radix UI primitives, styled by hand | Dialog, Popover, Select, Toast only |
| Database | Supabase Postgres with RLS on every table | Migrations in `supabase/migrations` |
| Auth | Supabase Auth: email and password with confirmation | One system for everyone, owner is a role |
| Files | Supabase Storage | `product-images` public, `chat-uploads` private |
| Realtime | Supabase Realtime | Chat only |
| Payments | Stripe Checkout, plus cash on delivery and bank transfer | Adapter pattern, see section 7 |
| Shipping | Adapter pattern: BOX NOW API, ACS manual, Cyprus Post manual | See section 7 |
| Email | Resend | Order confirmations, message alerts |
| Forms | react-hook-form + zod, shared schemas | One schema per form, reused server side |
| Hosting | Vercel | Preview on PRs, production on `main` |
| Analytics | Vercel Analytics | Cookieless, avoids a consent banner |

Do not add: shadcn/ui, Material UI, Chakra, Framer Motion (use CSS), Prisma, Redux, tRPC,
a headless CMS, or any state library beyond React state and one small cart store.

## 3. Design direction

The look is grounded in the subject: filament spools, build plates, layer lines, spec sheets.
It is workshop-playful, not corporate-friendly. Do not invent a different direction.

### Palette

```css
--paper:    #E7EAEE;  /* cool workshop grey, page background */
--surface:  #FFFFFF;  /* cards, panels */
--ink:      #12151A;  /* text, borders */
--ink-soft: #5B6472;  /* secondary text, use sparingly */
--flame:    #FF5C1A;  /* primary action, filament orange */
--cyan:     #00B8D9;  /* links, info, secondary accent */
--lime:     #B8E62E;  /* success, in-stock, highlights */
--magenta:  #FF3D8B;  /* sale tags, custom-request accent */
```

Rules: one loud accent per section, and never two competing inside one card. `--flame` owns the
primary button and the block that opens a section, nothing else. Never build a gradient between
two accents. Never use `--ink-soft` for anything a buyer must read.

Accents are backgrounds carrying `--ink` text, never text colours on a light background. Measured:
ink reads 5.92 on flame, 7.72 on cyan, 12.54 on lime and 5.48 on magenta, all passing AA. White
fails on all four. A card body stays `--surface` so the spec strip is the loudest thing on it:
colour arrives around cards, as bands, chips and one small badge, never as the card itself.

`--magenta` means sale and price drops. It is not the error colour: errors are an `--ink` border on
a faint tint, so a discount badge and a declined card never look the same.

### Type

- **Display**: Bricolage Grotesque, weight 700 to 800, tracking `-0.03em`. Headings and the logo.
- **Body**: Hanken Grotesk, 400 and 600. Everything a person reads in sentences.
- **Utility**: DM Mono, 400, uppercase, tracking `0.08em`. Specs, order numbers, prices in tables,
  tracking codes, filenames.

Load with `next/font/google`. Type scale: 12 / 14 / 16 / 20 / 26 / 34 / 48 / 64 px.
Body copy is 16px minimum, never smaller on mobile.

### Shape and texture

- Borders are `2px solid var(--ink)`. Not hairlines, not grey.
- Radius: `14px` on cards and buttons, `999px` on chips and tags. Consistent, no mixing.
- Shadows are hard offsets, not blurs: `4px 4px 0 var(--ink)`. Buttons shift to `2px 2px 0` and
  translate `2px` on `:active`, so pressing feels physical.
- The page background carries a faint hex infill pattern (SVG, `opacity: 0.05`, `--ink`),
  because that is what the inside of a print looks like. Build it once as a CSS background,
  do not repeat it inside cards.

### Signature element

Every product card and product page carries a **spec strip**: a mono, uppercase row of real
printing facts pulled from the database.

```
PLA · 82 × 40 × 95 MM · 46 G · 4 H 20 M · ARTICULATED
```

This is the thing the site is remembered by. It is honest information, not decoration, and it is
what makes the shop feel like it was built by someone who actually prints. Keep everything around
it quiet so it stands out. Do not add a second competing flourish.

### Motion

Four places only: card lift on hover (transform, 120ms), button press, a staggered fade-up on the
catalogue grid at 40ms intervals on first paint, and the category carousel on the home page.
Respect `prefers-reduced-motion: reduce` by disabling all of it. No parallax, no scroll-jacking,
no animated blobs, no marquee.

The carousel is the one thing that moves on its own, so it carries conditions. It must stop while
someone is hovering it or tabbing through it, it must not start at all under
`prefers-reduced-motion`, arrows and swipe must always work so nobody waits on the timer, and it
must never depend on a transform for position, since the reduced-motion block sets
`transform: none` and a scaled or translated card would collapse into the corner. Animate `left`,
`width`, `height` and `opacity` instead: those still resolve correctly once the transition is
switched off, so the layout is right either way and only the movement is lost. Nothing else on the
site animates by itself: this is a carousel, not a licence for a marquee.

## 4. Copy rules

The client explicitly asked for copy that does not read as machine written. This is a hard
requirement, not a preference.

**Never use an em dash or an en dash in user-facing copy.** Use a comma, a colon, brackets, or a
full stop. This applies to product descriptions, buttons, emails, error messages, and legal pages.

Banned words and phrases: elevate, unleash, seamless, effortless, curated, bespoke, journey,
dive in, discover, unlock, game changer, transform your, take it to the next level, "we're
passionate about", "crafted with care", "in today's world".

Write like the owner would talk at his stall:

- Good: "Made to order, ready in about 3 days."
- Bad: "Each piece is meticulously crafted to order with a typical lead time of three days."
- Good: "Message me if you want it in a different colour."
- Bad: "Reach out to discuss bespoke colourway options."

Sentence case for every heading and button. No emoji inside headings. No exclamation marks in
error states. Buttons name the action and keep that name through the whole flow: a button that
says "Place order" leads to a page that says "Order placed".

Errors say what happened and what to do: "Card was declined. Try another card or pick cash on
delivery." Never "Oops, something went wrong."

Empty states invite an action: "Nothing here yet. Message me and I'll print what you want."

## 5. Layout patterns to avoid

These read as templated on sight. Do not build them.

- A three column feature grid of Lucide icons in coloured circles.
- A hero with a centred headline, a subheading, and two buttons side by side.
- A "Trusted by" logo wall, fake testimonials, or invented star counts.
- A big number stat row (500+ prints, 99% happy).
- A full-width purple or blue gradient anything.
- Generic 3D render blobs or stock photos of hands holding phones.
- A newsletter capture bar pinned to the bottom.

The hero should be the actual stock: a dense, slightly irregular grid of real product photos
that starts immediately, with the shop name set large over or beside it. The most characteristic
thing about a market stall is the table covered in things. Lead with that.

## 6. Code conventions

- Server Components by default. Add `"use client"` only for interactivity, and push it as far down
  the tree as possible.
- Mutations go through Server Actions in `src/app/**/actions.ts`, never through route handlers,
  except Stripe and BOX NOW webhooks which must be route handlers.
- Every Server Action validates its input with the same zod schema the client form uses.
- Money is `integer` cents everywhere, named `*_cents`. Never a float. Format only at the render
  edge with `Intl.NumberFormat('en-CY', { style: 'currency', currency: 'EUR' })`.
- Database types are generated, never hand written: `npm run db:types`. Import from
  `src/lib/database.types.ts`.
- Three Supabase clients in `src/lib/supabase/`: `browser.ts`, `server.ts` (cookie based, respects
  RLS), `admin.ts` (service role, server only, must never be imported into a Client Component).
- Never disable RLS to fix a bug. Fix the policy.
- Never trust a price sent from the browser. Recompute every total server side from the database
  before creating a payment or an order.
- One auth system, not two. Buyers and the owner sign in the same way: email and password with
  confirmation. The owner is not a separate flow, he is `profiles.role = 'owner'`. There is no
  anonymous sign in and no magic link route.
- Browsing, product pages and the cart stay open to signed out visitors. The sign in wall appears
  at exactly two points: tapping "Ask to buy", and opening chat. Nowhere else.
- Both of those points preserve intent. Send the visitor to `/sign-in?next=<encoded path>` and land
  them back where they were with the action completed, never on the home page with an empty cart.
- The cart lives client side while signed out and merges into the account on first sign in.
  Never silently drop it.
- Passwords: minimum 8 characters, validated with the same zod schema on client and server. Do not
  invent an uppercase or symbol rule, length is the thing that matters.
- Sign in failures never reveal whether an email exists. "Email or password is not correct" covers
  both cases, and the wrong-email and wrong-password paths must take the same route out.
- No order and no conversation can exist without a signed in buyer. If a code path allows one,
  that is a bug.
- File naming: kebab-case files, PascalCase components, `use-*` for hooks.
- No `any`. No `@ts-ignore`. If types fight you, say so rather than casting.

## 7. Adapter boundaries

Two things will change after launch, so isolate them now.

**Shipping** (`src/lib/shipping/`): define `ShippingProvider` with `quote()`, `createShipment()`,
`getLabel()`, `track()`. Implement `boxnow.ts` (real API), `manual.ts` (ACS and Cyprus Post: the
owner books the parcel himself and pastes the tracking number into the admin). Checkout talks only
to the interface. Adding a carrier must not touch checkout code.

**Payments** (`src/lib/payments/`): `stripe.ts`, `cod.ts`, `bank-transfer.ts` behind one
`PaymentMethod` interface. Cash on delivery and bank transfer are first class, not fallbacks.
Many Cypriot buyers prefer them and the owner may not have Stripe approved on day one.

## 8. Accessibility and performance floor

Not optional, do not announce it in the UI.

- Visible focus ring on every interactive element: `2px solid var(--cyan)`, `outline-offset: 2px`.
- Tap targets 44px minimum.
- Every product image has real alt text from the database, never "product image".
- Keyboard reachable dialogs with focus trapping (Radix handles this, do not roll your own).
- Contrast: `--flame` on white fails at small sizes. Use `--flame` as a background with `--ink`
  text on top, or `--ink` text on a `--flame` border.
- Images through `next/image` with explicit `sizes`. Product images stored at 1600px max and
  served through Supabase image transforms.
- Target: Lighthouse mobile performance 90+, no layout shift on the catalogue grid.

### 9. Git and commits

You have terminal access and you commit your own work. Do not ask permission for
ordinary git operations. Do ask before anything that rewrites or discards history.

### Identity

Commit as the repo owner using whatever `git config` already provides. Never set
`user.name` or `user.email`. Never add a `Co-Authored-By` trailer, a "Generated with"
footer, an emoji, or any other tool signature to a commit message. The message
describes the change, nothing else.

### When to commit

Commit at each logical unit of work, not at the end of a whole prompt. A prompt from
BUILD_PLAN.md typically produces four to ten commits. If you have written 600 lines
without committing, you have already gone too far.

A good unit is one you could describe in a short sentence without using "and":

- `add product image upload to admin`
- `add slug uniqueness check on product save`
- `fix cart total ignoring variant price delta`

If the subject line needs an "and", split the commit.

Before every commit run `npm run typecheck` and `npm run lint`. Do not commit code
that fails either. If you need to commit something broken to checkpoint work, say so
in the body and mark it `wip:` in the subject so it can be squashed later.

### Message format

```
lowercase imperative subject, under 55 chars, no full stop

Optional body, wrapped at 72 characters, only when the reason for the
change is not obvious from the diff. Explain why, not what. The diff
already says what changed.
```

Rules:

- Imperative mood: `add`, `fix`, `move`, `remove`, `rename`. Not `added`, not `adds`.
- Lowercase subject. No trailing period.
- No conventional-commit prefixes (`feat:`, `chore:`, `refactor:`). This repo does not
  use them and half-applied conventions read worse than none.
- No bullet lists in the body. If you are tempted to list four files, the commit is
  too big.
- No file paths in the subject line.
- Never write marketing language. `add checkout flow` is correct. `implement
  comprehensive checkout experience with robust error handling` is not.

Write the body only when it earns its place. Good reasons: a non-obvious tradeoff, a
workaround for an upstream bug, a decision someone will question in six months.

```
recompute shipping quote on country change

The quote was cached from first render, so switching from Cyprus to a
world zone charged the Cyprus rate. Re-quoting on change costs one round
trip and is cheaper than reconciling it after payment.
```

Bad, do not produce this:

```
feat(checkout): implement shipping recalculation logic ✨

- Added useEffect hook to watch country field
- Updated quote function signature
- Modified CheckoutForm component
- Added tests
```

### Branches

One branch per BUILD_PLAN prompt, named for the work: `feat/admin-products`,
`feat/checkout-shipping`, `fix/cart-variant-pricing`. Never commit directly to `main`.
Open the branch yourself at the start of a prompt.

When a prompt is done, merge the branch into `main` yourself: fast forward if git can,
a merge commit if it can't. Report the branch name, the commit list, and the merge,
then stop. Do not open pull requests. Do not push `main`, or any branch, to the
remote without asking first.

### Staging

Stage deliberately. `git add <specific paths>`, never `git add -A` or `git add .`.
Before each commit run `git status` and `git diff --staged` and confirm nothing
unintended is included.

Never commit: `.env.local`, `.env.production`, any file containing a key beginning
`sk_`, `whsec_`, `eyJ`, or `service_role`, `node_modules`, `.next`, build output,
editor config, or `*.log`. If `git status` shows any of these, fix `.gitignore` in its
own commit before continuing.

### Things to ask before doing

- `git push --force` or `--force-with-lease` in any form
- `git rebase`, `git reset --hard`, `git filter-branch`
- amending a commit that has already been pushed
- deleting a branch
- pushing anything to the remote (`git push`)

### On history looking human

Real repositories are not tidy. A history where every commit is a perfect 50-character
subject and every feature lands in exactly one commit reads as machine generated. Do
not manufacture mess, but do not sand it off either. If you fix a typo, commit
`fix typo in shipping method label`. If you get an approach wrong and change it,
commit the change honestly rather than folding it back into the original commit to
make the history look clean in hindsight.

## 10. Working style

- Before writing code for a numbered prompt in `BUILD_PLAN.md`, restate the plan in three or four
  bullets and wait for a go-ahead if anything is ambiguous.
- Stop at the end of each prompt. Report what was built, what was skipped, and what needs a
  credential or a decision from a human. Do not roll on into the next prompt.
- If a requirement in a prompt contradicts this file, this file wins. Say so out loud.
- If something cannot be done without an account that does not exist yet (BOX NOW partner ID,
  Stripe live keys), build against the interface, stub the provider, and say clearly what is stubbed.
