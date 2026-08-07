# Build plan

Copy each prompt into Claude Code in order. Finish one, review the diff, commit, then move on.
Do not paste two prompts at once. Every prompt assumes `CLAUDE.md` is committed at the repo root.

Before prompt 1, follow `SETUP.md` sections 1 and 2 so the Supabase projects and env file exist.

Rough effort: prompts 1 to 6 are one long day, 7 to 11 are the meat, 12 to 15 are a second day.

---

## Prompt 1: scaffold

```
Read CLAUDE.md first.

Scaffold the project in this existing repo. It is currently empty apart from git metadata
and CLAUDE.md.

- Next.js 15 App Router, TypeScript strict, ESLint, Tailwind CSS v4, src directory, @/* alias.
- Prettier with prettier-plugin-tailwindcss.
- Directory skeleton with .gitkeep where empty:
  src/app, src/components/ui, src/components/shop, src/components/admin,
  src/lib/supabase, src/lib/shipping, src/lib/payments, src/lib/validation,
  supabase/migrations
- .env.example listing every variable name from SETUP.md section 3, with empty values and a
  one-line comment each. .env.local stays gitignored.
- package.json scripts: dev, build, lint, typecheck, format, db:push, db:types.
- A README with local dev steps only. No marketing copy.

Do not build any UI yet. Confirm `npm run dev`, `npm run build` and `npm run typecheck` all pass,
then stop and report.
```

---

## Prompt 2: design system

```
Read CLAUDE.md section 3 and implement the design system. This sets the visual identity for
everything after it, so follow the tokens exactly rather than improvising.

1. src/app/globals.css:
   - @theme block mapping the palette hex values to Tailwind v4 tokens (paper, surface, ink,
     ink-soft, flame, cyan, lime, magenta).
   - Radius, hard-offset shadow, and type scale tokens.
   - The hex infill background: an inline SVG data URI at opacity 0.05 in --ink, applied to body
     over --paper. Tile it, keep it cheap, no JS.
   - A `prefers-reduced-motion: reduce` block that kills transitions and transforms globally.

2. src/app/layout.tsx: load Bricolage Grotesque, Hanken Grotesk and DM Mono via next/font/google
   as CSS variables. Set sensible metadata defaults.

3. Base components in src/components/ui, each with a real TypeScript prop type:
   Button (variants: primary, secondary, ghost, danger; sizes sm/md/lg; the press animation from
   CLAUDE.md), Input, Textarea, Select, Field (label + hint + error, wired for aria-describedby),
   Card, Tag, SpecStrip, Money, Dialog and Toast (Radix based), EmptyState, Skeleton.

   SpecStrip takes { material, dimensionsMm, weightGrams, printMinutes, note } with every field
   optional, renders only the fields present, joins with a middot, mono uppercase. This is the
   signature element, get it right.

4. A route at /styleguide rendering every component in every state, including focus and disabled.
   Exclude it from the sitemap later.

Contrast check the flame and cyan tokens against white and against ink, and tell me any pair that
fails WCAG AA at 16px. Then stop and report.
```

---

## Prompt 3: database schema

```
Write the initial Supabase migration at supabase/migrations/0001_init.sql. Use exactly the schema
below. Add RLS as specified. Do not invent extra tables.

Enums:
  product_status: draft, active, archived
  order_status: pending, paid, awaiting_payment, printing, ready, shipped, delivered, cancelled, refunded
  payment_method: card, cod, bank_transfer
  payment_status: unpaid, paid, refunded, failed
  carrier: boxnow, acs, cypost, pickup
  ship_zone: cy, eu, world
  convo_kind: general, custom_request
  convo_status: open, awaiting_owner, awaiting_buyer, closed
  sender_role: buyer, owner

Tables:

profiles
  id uuid pk references auth.users on delete cascade
  role text not null default 'customer' check (role in ('customer','owner'))
  display_name text, email text, phone text
  created_at timestamptz default now()

settings  -- single row, id fixed at 1
  id int pk default 1 check (id = 1)
  whatsapp_number text, announcement text
  shop_open boolean default true
  boxnow_origin_location_id text
  updated_at timestamptz default now()

categories
  id uuid pk, slug text unique not null, name text not null, position int default 0

products
  id uuid pk, slug text unique not null, title text not null
  short_description text, description text
  price_cents int not null check (price_cents >= 0)
  compare_at_cents int
  status product_status not null default 'draft'
  made_to_order boolean default true
  lead_time_days int default 3
  stock_qty int
  material text default 'PLA'
  weight_grams int, length_mm int, width_mm int, height_mm int
  print_minutes int
  spec_note text            -- e.g. 'articulated', 'prints in place'
  category_id uuid references categories on delete set null
  tags text[] default '{}'
  featured boolean default false
  created_at timestamptz default now(), updated_at timestamptz default now()

product_images
  id uuid pk, product_id uuid not null references products on delete cascade
  storage_path text not null, alt_text text not null, position int default 0

product_variants
  id uuid pk, product_id uuid not null references products on delete cascade
  option_label text not null default 'Colour'   -- what the buyer is choosing
  name text not null                            -- e.g. 'Glow green'
  swatch_hex text
  price_delta_cents int default 0
  stock_qty int, sku text, position int default 0

shipping_methods
  id uuid pk, code text unique not null
  carrier carrier not null, zone ship_zone not null
  label text not null, description text
  base_cents int not null, per_extra_100g_cents int default 0
  free_over_cents int, max_weight_grams int
  requires_locker boolean default false
  supports_cod boolean default false
  active boolean default true, position int default 0

orders
  id uuid pk
  order_number text unique not null            -- human readable, e.g. CY-2609-0042
  access_token uuid not null default gen_random_uuid()
  buyer_id uuid references auth.users on delete set null
  email text not null, phone text not null, full_name text not null
  status order_status not null default 'pending'
  payment_method payment_method not null
  payment_status payment_status not null default 'unpaid'
  shipping_method_id uuid references shipping_methods
  shipping_address jsonb                        -- null when requires_locker
  pickup_point jsonb                            -- { carrier, locker_id, name, address, postal_code }
  subtotal_cents int not null, shipping_cents int not null, total_cents int not null
  currency text not null default 'EUR'
  stripe_session_id text, stripe_payment_intent text
  carrier_reference text, tracking_number text, tracking_url text
  buyer_note text, owner_note text
  created_at timestamptz default now(), updated_at timestamptz default now()

order_items
  id uuid pk, order_id uuid not null references orders on delete cascade
  product_id uuid references products on delete set null
  variant_id uuid references product_variants on delete set null
  title_snapshot text not null, variant_snapshot text
  image_path_snapshot text
  unit_price_cents int not null, quantity int not null check (quantity > 0)

order_events
  id uuid pk, order_id uuid not null references orders on delete cascade
  type text not null, payload jsonb, created_at timestamptz default now()

conversations
  id uuid pk, buyer_id uuid references auth.users on delete set null
  email text, display_name text, subject text
  kind convo_kind not null default 'general'
  status convo_status not null default 'open'
  product_id uuid references products on delete set null
  last_message_at timestamptz default now()
  unread_for_owner boolean default true, unread_for_buyer boolean default false
  created_at timestamptz default now()

messages
  id uuid pk, conversation_id uuid not null references conversations on delete cascade
  sender_id uuid references auth.users on delete set null
  sender_role sender_role not null
  body text, attachments jsonb default '[]'
  created_at timestamptz default now(), read_at timestamptz

custom_request_details
  conversation_id uuid pk references conversations on delete cascade
  budget_cents int, deadline date, colour_pref text, size_note text
  reference_paths text[] default '{}'

Also:
- A `public.is_owner()` security definer function that checks profiles.role = 'owner' for
  auth.uid(). Set search_path explicitly. Use it in policies so they never recurse.
- A trigger creating a profiles row on auth.users insert.
- updated_at triggers on products and orders.
- An order_number generator: 'CY-' || yymm || '-' || zero-padded daily sequence.
- Indexes: products(status, created_at desc), products(category_id), product_images(product_id,
  position), orders(buyer_id), orders(created_at desc), messages(conversation_id, created_at),
  conversations(last_message_at desc).

RLS, enabled on every table:
- categories, products, product_images, product_variants, shipping_methods:
  public select where the row is publicly visible (products.status = 'active', children joined to
  an active product, shipping_methods.active). All writes: is_owner() only.
- settings: public select. Writes: is_owner().
- orders and order_items and order_events: select where buyer_id = auth.uid() or is_owner().
  Insert only through server code using the service role. Update: is_owner() only.
- conversations and messages and custom_request_details: select and insert where
  buyer_id = auth.uid() (or the parent conversation's buyer_id) or is_owner(). Update: sender or
  is_owner().
- profiles: select and update own row, or is_owner().

Write a second migration 0002_seed.sql seeding the settings row, four categories, and the
shipping_methods rows listed in SETUP.md section 5.

Do not apply anything yet. Show me both files and stop.
```

---

## Prompt 4: supabase wiring and owner auth

```
Wire Supabase and the owner login.

1. Install @supabase/supabase-js and @supabase/ssr.
2. src/lib/supabase/browser.ts, server.ts (cookie based, async, for Server Components and Actions),
   admin.ts (service role, with a `import 'server-only'` guard at the top).
3. middleware.ts refreshing the auth session, and protecting /admin/*: not signed in or not
   is_owner redirects to /admin/login.
4. Anonymous sign in for buyers: a small client provider that calls signInAnonymously() once, on
   first interaction that needs identity (adding to cart, opening chat), not on page load. Store
   nothing extra in localStorage, the Supabase cookie is the identity.
5. /admin/login: email magic link only, no password. After callback, check profiles.role and show a
   plain "This account is not the shop owner" page if it is not.
6. npm run db:types generating src/lib/database.types.ts from the linked project.

Apply the migrations to the dev project with `npm run db:push`, generate types, confirm typecheck
passes, then stop and report.
```

Prompt 4 shipped anonymous buyer sign in and a separate magic link route for the owner. Prompt 4b
replaces both. The text above is kept as a record of what was built, not as current instructions.

---

## Prompt 4b: real buyer accounts

```
Replace anonymous sign in and the owner magic link with one auth system: email and password through
Supabase Auth. Buyers get real accounts. The owner signs in exactly the same way and is
distinguished only by profiles.role = 'owner'. No social sign in.

Remove first:
  - The anonymous identity provider and every call to signInAnonymously().
  - The /admin/login route and its magic link action. /admin/login must 404 afterwards.
  - Any code path that lets an order or a conversation be created without a signed in buyer.

Routes:
  /sign-in           email and password
  /sign-up           email, password, display name
  /forgot-password   sends a reset email
  /reset-password    consumes the recovery token
  /auth/callback     handles the email confirmation redirect
  /auth/confirm      "check your inbox", with a resend action rate limited client side so it
                     cannot be spammed
  /account           display name, email, and a change password form

Behaviour:
  - Browsing, product pages and the cart stay fully open to signed out visitors. Do not gate them.
  - The sign in wall appears at exactly two points: tapping "Ask to buy", and opening chat.
  - Both preserve intent. Send the visitor to /sign-in?next=<encoded path>. After auth, land them
    back where they were with the action completed, not on the home page with an empty cart.
  - The cart is client side while signed out and merges into the account on first sign in. Never
    silently drop it.
  - Passwords are minimum 8 characters, validated with one zod schema used by both the client form
    and the Server Action. No uppercase or symbol rule. Length is what matters.
  - Sign in failures never reveal whether an email exists. Both the unknown email and the wrong
    password return "Email or password is not correct", by the same route out.
  - Header shows the display name when signed in, with links to their orders, their messages, and
    sign out.

Schema and RLS:
  - buyer_id keeps referencing auth.users, so existing policies should need no change. Verify that
    against the actual policies rather than assuming it, and report any policy that relied on an
    anonymous session.
  - The profiles insert trigger populates display_name from the sign up form.

Middleware:
  - /admin/* requires a session AND profiles.role = 'owner'. A signed in non owner gets the plain
    "this account is not the shop owner" page, never a redirect loop.
  - /account, /orders and /messages require a session and redirect to /sign-in?next=... otherwise.

Design: the auth pages follow CLAUDE.md section 3 like every other page. No centred card floating
on a gradient, no social proof, and no "welcome back" for someone who has never been here. Plain,
wide, and the same visual language as the shop.

Stop and report.
```

---

## Prompt 5: admin product management

```
Build the admin shell and product management. Mobile first: the owner does this on a phone with
one hand while sitting behind a market table. Desktop is the secondary case.

Routes:
  /admin              dashboard: unread messages count, orders needing action, low stock
  /admin/products     list with search, status filter, drag to reorder is not needed
  /admin/products/new
  /admin/products/[id]
  /admin/categories
  /admin/settings     whatsapp number, announcement, shop open toggle, BOX NOW origin id

Product form, in this order because it matches how he thinks:
  1. Photos first. Multi-file picker that accepts a camera capture on mobile, uploads to the
     product-images bucket, shows upload progress, reorderable, first image is the cover.
     Client-side resize to 1600px longest edge before upload. Alt text field per image, required,
     with a short hint explaining why.
  2. Title, price (a plain euro amount in the input, stored as cents).
  3. Spec fields feeding SpecStrip: material, dimensions, weight, print time, spec note.
  4. Description, category, tags.
  5. Variants: repeatable rows of name + colour swatch + price delta + stock.
  6. Stock: a made-to-order toggle. When on, hide stock_qty and show lead_time_days instead.
  7. Status: draft or active, with a "Save draft" and a "Put on the shelf" button.

Requirements:
  - Server Actions for every mutation, zod validated, schemas in src/lib/validation/product.ts and
    imported by the client form.
  - Slug auto-generated from the title, editable, uniqueness checked before save.
  - Deleting a product also deletes its storage objects.
  - Autosave drafts every 20 seconds so a phone call does not lose his work, with a quiet
    "Saved 12:04" line rather than a toast.
  - Optimistic UI on image reorder and delete.

Stop and report.
```

---

## Prompt 5b: people and roles

```
Build the admin section for managing who can get into the admin, and close the hole that makes
it necessary.

Fix this first, it is a live privilege escalation:
  profiles has `grant update on public.profiles to authenticated` and an RLS policy of
  `id = auth.uid() or is_owner()`. RLS is row level and cannot restrict columns, so any signed in
  buyer can update their own row and set role = 'owner'. Anyone with an account can make
  themselves the shop owner today.

  In a migration:
    - revoke update on public.profiles from authenticated
    - grant update (display_name, phone) on public.profiles to authenticated, so someone can still
      edit their own name without being able to touch role or email
    - add public.set_user_role(p_user_id uuid, p_role text), SECURITY DEFINER, pinned search_path,
      which refuses unless is_owner(), refuses a role outside ('customer','owner'), and refuses to
      demote the last remaining owner so the shop cannot be locked out of itself
    - write every change to a role_changes audit table: who changed whom, from what to what, when.
      An order has order_events for the same reason, and this matters more.
    - revoke execute from public and anon, grant to authenticated only

Routes:
  /admin/people          list of everyone with an account: display name, email, role, joined date,
                         search by name or email, with the owners first
  Promote and demote are Server Actions calling set_user_role, never a direct table update.

Requirements:
  - The owner cannot demote themselves while they are the only owner. Say why, do not just fail.
  - Confirm before promoting: a dialog naming the person, because this hands over the whole shop.
  - Show the audit trail on the page, most recent first. Plain sentences, not a table of ids.
  - Everything goes through requireOwner(), the page and every action.
  - The word in the UI is owner, matching profiles.role, not admin. One word for one thing.

Verify by trying the attack, not by reading the policy: as a non owner, attempt to set your own
role to owner and confirm the database refuses it. Report exactly what you ran and what came back.

Stop and report.
```

---

## Prompt 6: public catalogue and product page

```
Build the public storefront pages. Follow CLAUDE.md section 3 and section 5 closely. The hero is
the stock itself, not a headline over a gradient.

/ (home)
  - Sticky top bar: shop name in Bricolage, cart count, a search icon, a message icon.
  - Announcement strip from settings, only when non-empty.
  - Hero: a dense responsive grid of active product photos starting near the top of the page, with
    the shop name set large and overlapping the top-left of the grid. Two columns on mobile,
    four on desktop, cards at slightly varying heights so it reads like a table of objects rather
    than a spreadsheet.
  - Category chips as a horizontally scrollable row under the header.
  - A single quiet band near the bottom for custom requests, linking to /custom.

/shop and /shop/[category]
  - Same grid, plus sort (newest, price) and an in-stock filter. Server-side pagination, 24 per page.

/product/[slug]
  - Image gallery: swipeable on mobile with dots, thumbnails on desktop.
  - Title, price, SpecStrip, description.
  - Variant picker as colour chips using swatch_hex, with the variant name shown as text too so it
    works without colour vision.
  - Stock or lead time line: "In stock, ships in 1 to 2 days" or "Made to order, ready in about 3 days".
  - Add to cart, plus a secondary "Ask about this" that opens chat prefilled with the product, and
    a WhatsApp link built from settings.whatsapp_number with the product title and URL prefilled.
  - Four related products from the same category.
  - generateMetadata with real OG tags and an OG image from the cover photo.

Every card: cover image, title, price, one-line SpecStrip. Nothing else.

Stop and report.
```

---

## Prompt 7: cart

```
Build the cart.

- A small client store (useSyncExternalStore or zustand, your call, keep it under 100 lines) holding
  { productId, variantId, quantity } only. Never store prices in the browser.
- Persist to localStorage under one key, hydrate safely without a flash of empty state.
- A server function that takes the cart line items and returns fully priced, validated lines from
  the database, dropping anything archived or deleted and telling the buyer what was removed.
- A slide-over cart panel (Radix Dialog) opened from the header, plus a full /cart page for mobile.
- Line quantity stepper, remove, subtotal, and total weight (needed for shipping quotes later).
- Empty state per CLAUDE.md section 4.
- A "Not sure? Message me" link in the cart footer.
- The whole cart works signed out. Filling it must never ask for an account.
- On first sign in, merge the local cart into the account rather than replacing or dropping it.
  Same product and variant means add the quantities together, not overwrite.
- "Ask to buy" is where the sign in wall sits. Signed out, it goes to /sign-in?next=<cart path>
  and comes back to the cart with everything still in it.

Stop and report.
```

---

## Prompt 8: shipping layer

```
Build the shipping abstraction. Read CLAUDE.md section 7 first.

src/lib/shipping/types.ts
  ShippingProvider interface: quote(cart, destination), createShipment(order), getLabel(ref),
  track(ref). Every method returns a discriminated result type, never throws for expected failures.

src/lib/shipping/rates.ts
  Zone resolution from country code: CY -> 'cy', EU member states -> 'eu', everything else ->
  'world'. Quote = base_cents + ceil(max(0, weight - 500) / 100) * per_extra_100g_cents, zeroed when
  subtotal >= free_over_cents. Exclude methods whose max_weight_grams is exceeded, and say why in
  the response so checkout can explain it.

src/lib/shipping/manual.ts
  Provider for ACS and Cyprus Post. createShipment returns a pending shipment with no label. The
  owner books the parcel in the carrier's own portal and pastes the tracking number into the admin.
  track() builds a tracking URL from a template per carrier.

src/lib/shipping/boxnow.ts
  Provider for BOX NOW Cyprus. Real API, documented at boxnow.cy/en/diy/eshops/tailor-made:
    POST {BOXNOW_API_URL}/api/v1/auth-sessions  OAuth2 client_credentials, token lives 3600s,
      cache it in module scope with a 60s safety margin
    GET  /api/v1/origins            locationType=warehouse
    GET  /api/v1/destinations       latlng, radius, requiredSize filters
    POST /api/v1/delivery-requests  orderNumber, invoiceValue, paymentMode ('prepaid' or COD),
                                    amountToBeCollected, origin.locationId, destination.locationId,
                                    contact name/phone/email on both ends, items[]
    GET  /api/v1/parcels/{id}/label.pdf
    POST /api/v1/parcels/{id}:cancel
  Phone numbers must be full international format (+357...). Country codes ISO 3166-1 alpha-2.
  Map their P4xx error codes to readable messages, especially P405 phone format and P411 not
  eligible for cash on delivery.
  When BOXNOW_CLIENT_ID is absent, the provider must still load and return a clear
  "not configured" result rather than crashing. The site has to run before the account exists.

src/components/shop/LockerPicker.tsx
  Client component wrapping the BOX NOW map widget. Load
  https://widget-cdn.boxnow.cy/map-widget/client/v1.js once, configure _bn_map_widget_config with
  parentElement, partnerId from NEXT_PUBLIC_BOXNOW_PARTNER_ID, type 'popup', and an afterSelect
  handler capturing boxnowLockerId, boxnowLockerAddressLine1 and boxnowLockerPostalCode into form
  state. Show the chosen locker as a card with a "Change locker" button. Handle the script failing
  to load: fall back to a plain text field for the locker ID with a link to the BOX NOW locker
  finder, and never block checkout.

Unit test rates.ts with vitest: free shipping threshold, weight tiers, method exclusion, zone
resolution. Stop and report.
```

---

## Prompt 9: ask to buy, and the order conversation

PLAN CHANGE 2026-08-07. The card checkout this prompt used to describe is gone. Payment happens
in the conversation: the seller sends a link, most likely Revolut, and marks the order paid when
the money lands. Stripe, cash on delivery and bank transfer are in "After launch" below. The
`PaymentMethod` interface stays, so adding them later is an implementation not a rewrite.

```
Build "Ask to buy". No checkout page, no payment gateway.

Pressing it on a filled cart:
  - Signed out, goes to /sign-in?next=<cart path> and comes back with the cart intact. That wall
    already exists, do not rebuild it.
  - Signed in, collects the little that is needed up front in one small form: name, email, phone
    with a +357 default, and an optional note. Prefill from the profile.
  - Calls the create_order RPC, which already exists and recomputes every price, the shipping cost
    and the zone server side. Do not add a second path that writes orders.
  - Opens a conversation of kind 'general' linked to the order, seeded with a first message from
    the buyer naming what they want.
  - Empties the cart and lands on the order page.

Delivery is not chosen here. Whether it is posted or collected is worked out in the conversation,
because half of these are people who will collect at a market and do not need an address at all.
Pass the collect-in-person method as the order's shipping method to begin with, and let the
delivery details form in prompt 11 change it.

payment_method: add a 'link' value to the payment_method enum in a migration and use it. A Revolut
link is not a card, not cash on delivery and not a bank transfer, and pretending otherwise makes
the orders list lie about how people actually paid.

Stop and report.
```

---

## Prompt 9b: payment links and marking paid

```
The owner's side of the same flow.

  /admin/orders/[id]
    - A box to paste a payment link, which posts it into that order's conversation as a message
      the buyer sees, with the amount owed alongside it. Validate that it is an https URL, and
      nothing else: do not try to guess whether it is really Revolut.
    - A "Mark as paid" action. Flips payment_status to paid and status to 'paid', writes an
      order_events row recording who marked it and when, and is refused for anyone who is not the
      owner. It is a Server Action through requireOwner(), never a table update from the client.
    - A "Mark as refunded" action doing the same in reverse.

Money is never inferred from the link or from anything the buyer says. The owner presses the
button because he saw the money arrive. That is the whole trust model here, and it is the right
one for a one person shop taking Revolut links.

Stop and report.
```

---

## Prompt 10: orders, email, fulfilment

```
Close the loop on orders.

Buyer side:
  /order/[orderNumber]?t=[access_token]  -- token checked server side, no login needed
  Status timeline, items, delivery details, tracking link when present, bank transfer instructions
  when the method is bank_transfer, and a "Message about this order" button that opens a
  conversation already linked to the order.

Owner side:
  /admin/orders          list with status tabs and a search on order number, name, phone
  /admin/orders/[id]     everything about the order, plus:
    - a status stepper he taps through: paid -> printing -> ready -> shipped -> delivered
    - a tracking number field, saved with the carrier, which fills tracking_url from the template
    - for BOX NOW orders, a "Create BOX NOW parcel" button calling createShipment, then a
      "Download label" button for the PDF
    - a copy-to-clipboard block with the buyer's address formatted for a paper label
    - internal notes the buyer never sees

Email via Resend, plain and short, written to CLAUDE.md section 4 rules, no em dashes, no marketing:
  - to buyer on order confirmed, with the tokenised order link
  - to buyer on shipped, with tracking
  - to owner on any new order
  - to owner on a new message when nothing has been read for 15 minutes
Render with react-email. Every template must be readable as plain text too.

Write order_events rows for every status change so there is an audit trail.

Stop and report.
```

---

## Prompt 11: chat

```
Build the on-site chat. This is the feature the client cares most about after selling, so it has to
feel instant and it has to work for someone who has never made an account.

Buyer side:
  - A floating message button, bottom right, above the mobile nav, hidden while a Dialog is open.
  - Opening it while signed out sends the visitor to /sign-in?next=<current path> and returns them
    to the open chat afterwards. Signed in, it shows their conversation, or a starter form with a
    first message. Name and email come from the account, so do not ask for them again.
  - Message list with Supabase Realtime subscription on messages filtered by conversation_id.
  - Optimistic send with a pending state and a retry on failure.
  - Image attachments to the chat-uploads bucket, max 5MB, images only, shown as thumbnails.
  - A visible line explaining that this is one person, not a bot, and roughly when he replies.
  - A WhatsApp button next to the send box: https://wa.me/{number}?text={encoded context}.
    Build the number from settings.whatsapp_number, strip everything except digits.

Owner side:
  /admin/messages           inbox, unread first, showing last message preview and time
  /admin/messages/[id]      thread, reply box, mark closed, and a "Turn into an order" action that
                            prefills a draft product or a manual order
  - Realtime subscription so new messages arrive without a refresh.
  - Canned replies he can edit in settings, inserted with one tap. Three defaults, written plainly.

Two message types beyond plain text, because the order flow runs through this conversation and not
through a checkout page:

  Payment link, sent by the owner (built in prompt 9b, rendered here)
    - Shows as a card in the thread: the amount owed, and a button that opens the link.
    - Only the owner can send one. A buyer posting a link is just text.

  Delivery details, opened by the buyer
    - A button in the conversation, shown when the order still has no address, opening a Dialog
      with: full name, phone, address lines, city, postal code, country select, and a choice
      between having it posted and collecting it at a market.
    - Submitting writes the address onto the order, re-quotes shipping through the shipping layer
      for the country given, updates shipping_cents and total_cents, and posts a message into the
      conversation summarising what was entered so the owner sees it in the thread rather than
      having to go and look.
    - Choosing collection instead clears the address and sets the collect-in-person method, so the
      shipping cost goes to zero.
    - It is a Dialog opened from inside the chat, not a separate page: the buyer never loses the
      conversation. Radix Dialog, focus trapped, per CLAUDE.md section 8.
    - Re-quoting happens server side from the database. Never take a shipping cost from the form.

Storage policy on chat-uploads: a buyer can read and write only under their own conversation prefix,
the owner can read everything. Verify by trying to read another conversation's file while signed in
as a different buyer, and confirm it is denied.

Stop and report.
```

---

## Prompt 12: custom requests

```
Build the custom request flow, which is a conversation with structure.

/custom
  - A short page explaining what he can and cannot print, written plainly, no bullet-point sales copy.
  - A form: what do you want, reference images (up to 5, custom-request uploads), rough size,
    colour preference, budget, when you need it by, name, email.
  - Submitting creates a conversation with kind = 'custom_request', a custom_request_details row,
    and a first message summarising the request in readable prose.
  - Confirmation page setting expectations: he replies within a day or two, quotes are free.
  - The same WhatsApp fallback link.

Admin:
  - Custom requests appear in /admin/messages with a distinct tag using --magenta.
  - The thread view shows the structured details in a panel beside the messages.
  - A "Send a quote" action: the owner enters a price and a description, which creates a one-off
    unlisted product and sends the buyer a link that goes straight to checkout.

Note in the UI, once, that custom made items are excluded from the EU 14 day right of withdrawal.
Do not bury it and do not repeat it on every screen.

Stop and report.
```

---

## Prompt 13: polish

```
Final pass before deploy. No new features.

- Legal pages with real content, written to CLAUDE.md section 4: /privacy, /terms, /shipping,
  /returns. Leave clearly marked TODO blocks for the trader name, address and VAT status rather
  than inventing them.
- Cookie policy: confirm we set no non-essential cookies, so no consent banner. If anything you
  built does set one, tell me instead of adding a banner.
- SEO: sitemap.ts, robots.ts excluding /admin and /styleguide, JSON-LD Product schema on product
  pages with real price and availability, canonical URLs.
- A 404 and an error boundary in the site's voice.
- Loading and error states on every route that fetches. No unstyled spinners.
- Run through the whole buyer flow with keyboard only and fix what breaks.
- Run Lighthouse mobile on /, /shop and a product page. Report the numbers. Fix anything under 90
  on performance or accessibility.
- Audit every string in the app for em dashes and the banned words in CLAUDE.md section 4.
  Show me the list of what you found and changed.
- Delete dead code, unused deps, and the .gitkeep files in directories that now have real content.

Stop and report with the Lighthouse numbers and the copy audit list.
```

---

## Prompt 14: deploy

```
Prepare for deployment to Vercel. Read SETUP.md sections 6 and 7.

- Confirm every env var in .env.example is documented and that the build fails loudly with a clear
  message if a required one is missing at boot. Add a src/lib/env.ts that parses process.env with
  zod at module load.
- Add a GitHub Actions workflow running typecheck, lint and vitest on pull requests. No deploy step,
  Vercel handles that.
- Verify no service role key is reachable from client bundles: grep the built output for the key
  name and confirm src/lib/supabase/admin.ts is not in any client chunk.
- Write DEPLOY.md with the ordered runbook: link the production Supabase project, push migrations,
  create the storage buckets and policies, set env vars in Vercel, register the Stripe production
  webhook, and the smoke test list to run against production before telling the client it is live.

Stop and report.
```

---

## Prompt 15: BOX NOW go-live

Run this only after the BOX NOW partner account is approved and you have sandbox credentials.

```
Take the BOX NOW integration from stub to live against the sandbox environment.

- Fill BOXNOW_API_URL, BOXNOW_CLIENT_ID, BOXNOW_CLIENT_SECRET and NEXT_PUBLIC_BOXNOW_PARTNER_ID
  in .env.local with the sandbox values.
- Fetch origins and store the warehouse locationId in settings.boxnow_origin_location_id via
  /admin/settings, with a "Refresh from BOX NOW" button rather than a hardcoded value.
- End to end test: place a sandbox order to a sandbox locker, create the delivery request, fetch
  the label PDF, then cancel the parcel. Log each API response shape you actually received and tell
  me where it differed from the documented shape.
- Cash on delivery: set paymentMode and amountToBeCollected correctly and confirm the account is
  eligible. If you get P411, report it, do not work around it.
- Add a nightly tracking sync: a Vercel cron hitting a route handler that polls /parcels for orders
  in 'shipped' and updates status to 'delivered'. Rate limit it and skip orders older than 30 days.

Stop and report.
```

---

## After launch

Things worth doing later, in rough priority order. Do not build them now.

0. **Card, cash on delivery and bank transfer.** Moved here 2026-08-07: payment is a link the
   seller sends in the conversation for now. These were specified in detail in the old prompt 9,
   which is in the git history if it is wanted back. What survives in the codebase for them:
   `src/lib/payments/` with a `PaymentMethod` interface, the `payment_method` enum already
   carrying `card`, `cod` and `bank_transfer`, the `stripe_session_id` and `stripe_payment_intent`
   columns on orders, and the bank detail columns on settings. Adding one is an implementation
   behind an existing interface, not a rewrite. Stripe needs test keys, free and immediate; cash
   on delivery needs the BOX NOW account for the locker case, since that is a separate product on
   their side per SETUP.md section 5.
1. Greek language toggle. The market is bilingual and the buyer age group is comfortable in both,
   but shipping English first is fine. Structure copy in `next-intl` from the start if you have
   the appetite, or accept a refactor later.
2. A "print queue" view for the owner showing everything that needs printing across open orders,
   grouped by colour so he batches sensibly.
3. Discount codes, festival-specific, so he can hand out cards at his stall.
4. Instagram feed pull, since that is where this audience actually is.
5. Digital STL sales, which changes the tax picture and needs a different fulfilment path.
