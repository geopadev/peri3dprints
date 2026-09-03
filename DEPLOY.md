# Deploy runbook

The ordered list for taking this shop from the dev project to a live site. Do it top to
bottom. `MANUAL_STEPS.md` has the fuller explanations and the things that need a human
judgement; this file is the checklist.

## 0. Before anything

- [ ] `npm run typecheck && npm run lint && npx vitest run && npm run build` all pass on `main`.
- [ ] Both Supabase projects are on a plan that does not pause. The free tier pauses after a
      week of inactivity and the site goes down with it. Pro is the fix.
- [ ] You have: a domain, a Resend account, the production Supabase project ref.

## 1. Production database

Everything below runs against the production project, not dev.

- [ ] Link the CLI: `npx supabase link --project-ref <prod ref>`.
- [ ] Apply every migration in order: `npx supabase db push`. Confirm with
      `npx supabase migration list` that local and remote match, all of them.
- [ ] Do NOT run `supabase/seed-demo.sql` on production. It is dev only.
- [ ] Run `supabase/migrations/0002_seed.sql` content is applied by the push (categories,
      shipping methods, settings row). Check `select * from public.settings` returns one row.
- [ ] Storage: confirm three buckets exist: `product-images` (public), `chat-uploads`
      (private), `custom-request-uploads` (private). The migrations create them.
- [ ] Security, in the dashboard (Database > Settings): turn on SSL enforcement. Add network
      restrictions if you only ever connect from known places.
- [ ] Auth > Providers > Email: confirmations ON. OTP expiry 3600 seconds or lower.
- [ ] Auth > Rate Limits: leave the defaults unless you have a reason.
- [ ] Auth > URL Configuration: Site URL = `https://<your domain>`. Redirect URLs: add
      `https://<your domain>/**` and `https://*-<vercel team>.vercel.app/**` for previews.
      Confirmation and reset emails fail silently if this is wrong.
- [ ] Turn on MFA for your Supabase account itself.
- [ ] Create the owner: sign up through the live site once it is up, confirm the email, then in
      the SQL editor: `select public.set_user_role('<your user id>', 'owner');` will refuse
      (no owner exists yet to call it), so for the very first owner only run
      `update public.profiles set role = 'owner' where email = '<your email>';`.
      After that, every role change goes through `/admin/people`.

## 2. Email

- [ ] In Resend: add a domain. Use a subdomain such as `mail.<your domain>`. Add the DNS
      records it gives you (SPF, DKIM, and the MX for bounces). Wait for Verified.
- [ ] Create an API key with sending access only.
- [ ] Supabase Auth > Emails > SMTP Settings: enable custom SMTP. Host `smtp.resend.com`,
      port 465, user `resend`, password = the API key, sender = an address on the verified
      subdomain. This is what stops confirmation emails hitting the built in rate limit.
- [ ] Disable link tracking in Resend for this domain, so the auth links are not rewritten.

## 3. Vercel

- [ ] Import the GitHub repo. Framework preset detects Next.js.
- [ ] Environment variables, Production AND Preview set separately. Preview must point at
      the dev project. From `.env.example`:
      `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
      `RESEND_API_KEY`, `EMAIL_FROM`, `OWNER_EMAIL`. Leave the BOX NOW and service role
      ones empty until you have them. The build fails with a sentence naming any required
      one that is missing.
- [ ] Deploy `main`. Open the `.vercel.app` URL and confirm the home page renders.

## 4. Domain and TLS

- [ ] Vercel project > Settings > Domains > add `<your domain>` and `www.<your domain>`.
- [ ] At your registrar: apex `A` record `@` to `76.76.21.21`, and `CNAME` `www` to
      `cname.vercel-dns.com`. Or hand the whole zone to Vercel with nameservers
      `ns1.vercel-dns.com` and `ns2.vercel-dns.com`.
- [ ] Wait for the domain to show Valid Configuration. The TLS certificate is issued
      automatically by Let's Encrypt through Vercel, usually within minutes. There is
      nothing to buy and nothing to upload.
- [ ] Set `NEXT_PUBLIC_SITE_URL` to `https://<your domain>` in Production and redeploy.
      Emails and the sitemap use it.
- [ ] Go back to Supabase Auth URL Configuration and confirm the real domain is there.

## 5. Content

- [ ] Fill in the marked gaps on `/privacy` and `/terms`: trader name, address, VAT status.
- [ ] `/admin/settings`: WhatsApp number, announcement, canned replies.
- [ ] `/admin/products`: real prints with real photos. The site does not look finished
      until this is done.

## 6. Smoke test against the live site

- [ ] Sign up with a fresh email in a private window, confirm by email, sign in.
- [ ] Add a print to the cart, reload, cart survives. Ask to buy, fill the form, land on the
      order page.
- [ ] Open the order link from the confirmation email in a different private window with no
      session: it opens. Change one character of the token: it 404s.
- [ ] As the owner: `/admin/orders`, open the order, send a payment link, watch it appear in
      the buyer's thread without a refresh. Mark paid. Buyer's order page shows Paid.
- [ ] Buyer: add delivery details in the thread, choose posting to a country. Owner sees the
      address and the recalculated shipping.
- [ ] Owner: add tracking, press Posted. Buyer gets the shipped email.
- [ ] Submit a custom request with three pictures. Owner sees them and sends a quote.
- [ ] Sign in as the fresh non owner account and open `/admin`: refused.
- [ ] Open the site on a real phone on mobile data.
- [ ] `curl -I https://<your domain>` shows `strict-transport-security` and
      `content-security-policy`.

## 7. After launch

- [ ] Submit `https://<your domain>/sitemap.xml` to Google Search Console.
- [ ] Turn on daily backups and, once the database matters, point in time recovery.
- [ ] Check the Vercel Analytics tab is receiving pageviews.
