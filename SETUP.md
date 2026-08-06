# Setup

Everything that happens outside Claude Code. Do sections 1 to 3 before prompt 1 in `BUILD_PLAN.md`.

---

## 1. WSL2 and local environment

**Keep the repo on the Linux filesystem.** If it currently lives under `/mnt/c/...`, move it.
Next.js file watching across the Windows/Linux boundary is slow enough to be genuinely painful.

```bash
# inside WSL2
mkdir -p ~/projects && cd ~/projects
git clone git@github.com:<you>/<repo>.git
code .          # opens VS Code attached to WSL
```

VS Code should show "WSL: Ubuntu" in the bottom-left. If it does not, install the WSL extension and
reopen from inside WSL rather than from Windows.

Node via nvm, inside WSL:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
exec $SHELL
nvm install 22 && nvm use 22 && nvm alias default 22
```

**Skip Docker.** The Supabase CLI can run a local stack, but it needs Docker Desktop with WSL
integration and it is a common source of lost evenings. Use two hosted Supabase projects instead
(section 2). It costs nothing on the free tier and removes a whole class of problems.

Install the CLIs as dev dependencies rather than globally, so they are pinned in the repo:

```bash
npm i -D supabase
npx supabase --version
```

Stripe CLI (needed for local webhook testing):

```bash
curl -fsSL https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | \
  gpg --dearmor -o /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | \
  sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update && sudo apt install stripe
```

---

## 2. Supabase

Create **two** projects at supabase.com, both in the **EU (Frankfurt)** region. EU hosting keeps
the personal data of EU buyers inside the EU, which makes the GDPR story simple and makes the site
faster from Cyprus.

- `printshop-dev`
- `printshop-prod`

From each project's dashboard, Settings > API, collect the project URL, the anon key and the
service role key. The service role key bypasses RLS entirely. It goes in `.env.local` and in
Vercel's server-side env vars, and nowhere else, ever.

Link the CLI to dev:

```bash
npx supabase login
npx supabase link --project-ref <dev-project-ref>
npx supabase db push          # applies supabase/migrations
npx supabase gen types typescript --linked > src/lib/database.types.ts
```

Migrations are files in the repo. Never edit the schema through the dashboard SQL editor once
prompt 3 has run, or dev and prod will drift apart and you will not know which is correct.

### Storage buckets

Create these by hand in the dashboard, in both projects:

| Bucket | Public | Size limit | MIME types |
| --- | --- | --- | --- |
| `product-images` | yes | 10 MB | `image/*` |
| `chat-uploads` | no | 5 MB | `image/*` |
| `custom-request-refs` | no | 5 MB | `image/*` |

Policies for the two private buckets get written in prompts 11 and 12. Test them by trying to read
another person's file while signed in as a different buyer and confirming you are refused. An
untested storage policy is usually an open bucket.

### Making yourself and the client owners

Everyone signs in the same way, with email and password or with Google. The owner is not a separate
login, he is a row with a role. After the first sign in on each project, promote the account:

```sql
update public.profiles set role = 'owner' where email = 'client@example.com';
```

Do this for the client's real email on prod, and your own on dev. Until you do, `/admin` shows the
"this account is not the shop owner" page, which is the correct behaviour, not a bug.

---

## 2a. Google sign in

Buyers and the owner can sign in with Google. Supabase brokers this, so the OAuth credentials go
into the Supabase dashboard, **not** into `.env.local`. There is no Google env var in this project.

**You need a separate set of credentials for each Supabase project**, because the callback URL
contains the project ref and Google matches it exactly. Doing dev and prod with one client is the
mistake that produces a `redirect_uri_mismatch` you will stare at for an hour.

In Google Cloud Console (console.cloud.google.com):

1. Create a project, or pick an existing one.
2. **APIs and Services > OAuth consent screen.** External. Fill in the app name, a support email and
   a developer contact. While it is in Testing mode only accounts you list under Test users can sign
   in, which is fine for dev. Publish it before launch, or real buyers get "app is blocked".
3. **APIs and Services > Credentials > Create credentials > OAuth client ID.** Application type is
   **Web application**.
4. Under **Authorised redirect URIs** add the Supabase callback, not a URL on our own domain:

   ```
   https://<project-ref>.supabase.co/auth/v1/callback
   ```

   For this build that is `https://bmepjrxejreysevrvkol.supabase.co/auth/v1/callback` on dev and
   `https://xxgkdbcgllpvbdvouyyr.supabase.co/auth/v1/callback` on prod. Our own
   `/auth/callback` route never appears here. Supabase receives Google's redirect and then sends the
   browser on to us.
5. Copy the client ID and client secret into the Supabase dashboard under
   **Authentication > Providers > Google**, and enable the provider.

### URL configuration

**Authentication > URL Configuration** in the Supabase dashboard, per project.

- **Site URL**: `http://localhost:3000` on dev, the real domain on prod.
- **Redirect URLs**, add all of these:

  ```
  http://localhost:3000/**
  https://<your-vercel-project>-*.vercel.app/**
  https://yourdomain.com/**
  ```

Get this wrong and OAuth and confirmation emails **fail silently**: the link works, Supabase
refuses the redirect, and the person lands back on the sign in page with no error and no session.
It is the most common way this whole flow breaks, and it looks like a code bug when it is not.

### Custom SMTP, before launch

Supabase's built in email sender is rate limited to a handful of messages an hour and their docs say
plainly it is not for production. Confirmation and password reset emails will start disappearing the
moment you have real users, and the buyer sees nothing at all.

Configure Resend as the SMTP provider under **Authentication > Emails > SMTP Settings**, using the
same Resend account as the order emails in section 3. **Treat this as a launch blocker, not a nice
to have.** A shop where the confirmation email silently never arrives is a shop that takes no orders.

---

## 3. Environment variables

`.env.local`, gitignored. Same names in Vercel, different values.

```bash
# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Email
RESEND_API_KEY=
EMAIL_FROM="Shop name <orders@yourdomain.com>"
OWNER_EMAIL=

# BOX NOW (leave empty until the partner account exists, the app must still boot)
NEXT_PUBLIC_BOXNOW_PARTNER_ID=
BOXNOW_API_URL=
BOXNOW_CLIENT_ID=
BOXNOW_CLIENT_SECRET=
```

The WhatsApp number lives in the `settings` table, not in env, so the client can change it himself
without a redeploy.

---

## 4. Payments

Stripe supports Cyprus and individual (sole trader) accounts, so the client does not need a
registered company. He will need a personal tax identification number and a bank account that can
receive EUR payouts. Onboarding sometimes stalls on verification, which is exactly why the build
treats cash on delivery and bank transfer as first-class payment methods rather than fallbacks.

Order of operations:

1. Build and test everything in Stripe **test mode** with the standard test cards.
2. Have the client start Stripe onboarding early, in parallel with development, not the week before
   launch.
3. If Stripe drags, launch with cash on delivery and bank transfer only. Both are normal in Cyprus
   and neither blocks the site. Switch card payments on later by adding two env vars.

Local webhook testing:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# copy the whsec_... it prints into STRIPE_WEBHOOK_SECRET
```

Production webhook: Stripe dashboard > Developers > Webhooks > add endpoint
`https://yourdomain.com/api/webhooks/stripe`, events `checkout.session.completed` and
`charge.refunded`. The signing secret there is different from the local one.

---

## 5. Shipping accounts

### BOX NOW Cyprus

The one carrier worth integrating properly. It has a documented partner API (OAuth2 client
credentials) and a drop-in map widget for locker selection, and the audience for this shop is
exactly the audience that uses lockers.

Contact them through boxnow.cy to open a partner account and ask specifically for **sandbox and
production API credentials plus your partnerId**, saying you have a custom-built site rather than
a WooCommerce or Shopify store. Their documentation lives at `boxnow.cy/en/diy/eshops/tailor-made`.
Cash on delivery is a separate product on the account and needs enabling, otherwise the API returns
error P411. Maximum 20 kg within Cyprus.

Start this conversation now. Account approval is the long pole in this project, not the code.

### ACS Cyprus

ACS has a REST web services API, but access is tied to a corporate courier account with billing
codes, which a hobbyist will struggle to get. Plan for manual fulfilment: the client books the
parcel in the ACS portal or at a branch, then pastes the tracking number into the admin. The build
already supports this through the `manual` shipping provider, and it costs the buyer nothing in
experience. Revisit the API later if volume justifies it.

### Cyprus Post

Manual, for international orders. He fills the customs form at the counter and enters the tracking
number afterwards. There is no realistic API path here and there does not need to be.

### Seed rates

Placeholders for the `0002_seed.sql` migration. **Confirm real prices with each carrier before
launch**, these are illustrative:

| code | carrier | zone | label | base | per extra 100g | free over | max g | locker | COD |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `boxnow-cy` | boxnow | cy | BOX NOW locker | 300 | 0 | 3500 | 20000 | yes | yes |
| `acs-cy-home` | acs | cy | ACS to your door | 450 | 50 | 5000 | 20000 | no | yes |
| `acs-cy-point` | acs | cy | ACS pickup point | 350 | 50 | 4000 | 20000 | no | yes |
| `cypost-cy` | cypost | cy | Cyprus Post | 250 | 40 | 3000 | 2000 | no | no |
| `cypost-eu` | cypost | eu | Post to Europe | 900 | 120 | null | 2000 | no | no |
| `cypost-world` | cypost | world | Post worldwide | 1400 | 180 | null | 2000 | no | no |
| `pickup-festival` | pickup | cy | Collect from me at a market | 0 | 0 | null | null | no | no |

That last one matters. He is at festivals most weekends and regulars will happily collect in person.
It costs him nothing and it is the option a shop built from a template would never have.

---

## 6. Deployment

Vercel, connected to the GitHub repo.

1. Import the repo at vercel.com. Framework preset detects Next.js.
2. Add every variable from section 3 under Settings > Environment Variables. Set Production and
   Preview separately: **preview must point at `printshop-dev` and Stripe test keys**, or a test
   order on a pull request will hit the client's real Stripe account.
3. Deploy `main`. Pull requests get preview URLs automatically.
4. Domain: point the registrar's nameservers or an A/CNAME record at Vercel per its instructions,
   then set `NEXT_PUBLIC_SITE_URL` to the real domain and redeploy.
5. Update the Stripe production webhook URL and the Supabase Auth redirect URLs (Authentication >
   URL Configuration) to the real domain, and add the production Google OAuth redirect URI in
   Google Cloud Console. Sign in and confirmation emails break silently if you forget this one.

Cost at this scale: Vercel Hobby is free but its terms exclude commercial use, so budget for Pro at
$20/month once the shop takes money. Supabase free tier is fine until images pass 1 GB. Resend is
free to 3,000 emails a month. Total realistic running cost is around $20 to $25 a month plus Stripe
fees, which is worth telling the client up front.

---

## 7. Production smoke test

Run all of these against the live site before telling the client it is open. Do not skip the
refund one.

- [ ] Place a card order end to end with a real card, small amount, then refund it in Stripe and
      confirm the order status updates.
- [ ] Place a cash on delivery order to a BOX NOW locker and confirm the parcel is created.
- [ ] Place an international order and confirm shipping cost and the address form behave.
- [ ] Confirm the buyer receives the confirmation email and the tokenised order link works in a
      private window with no session.
- [ ] Send a chat message as a buyer, reply as the owner, confirm both arrive without a refresh and
      that the owner gets the email alert.
- [ ] Submit a custom request with three reference images.
- [ ] Open the site on an actual phone on mobile data, not just the browser device emulator.
- [ ] Log in as a non-owner account and confirm `/admin` refuses you.
- [ ] Try to fetch another buyer's order by guessing the order number without the token.

---

## 8. Practical things to raise with the client

Not legal advice, and worth him checking with an accountant, but do not let these surprise him
after launch.

- **Tax.** Selling online for profit is income even for a hobbyist. Cyprus has a VAT registration
  threshold (last widely quoted at €19,500 of taxable turnover in twelve months) and separate rules
  for cross-border EU sales. Worth thirty minutes with an accountant before the first sale, not
  after.
- **Consumer rights.** EU distance selling gives buyers 14 days to withdraw, but goods made to the
  customer's specification are excluded. That exclusion is the reason to keep custom orders clearly
  labelled as custom in the flow.
- **GDPR.** He is a data controller the moment he stores an email address. EU hosting, a real
  privacy policy, and no analytics that set cookies keeps this proportionate rather than onerous.
- **Product safety.** 3D printed items sold as toys to children fall under toy safety rules
  (small parts, materials). If any of his items read as toys for under-14s rather than collectibles,
  he should look into this properly. Describing items as models or collectibles, when that is
  honestly what they are, is a different position from marketing them as children's toys.
- **Ownership.** Make sure the Supabase, Stripe, Vercel and domain accounts are in the client's name
  with his email, even if you set them up. Add yourself as a collaborator instead. If this
  relationship ends, he keeps his shop and you keep your weekend.
