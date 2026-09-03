# Things you have to do by hand

Everything code could not do, in the order to do it. `DEPLOY.md` is the short checklist;
this is the version with the why. Items marked **blocking** stop the site working.

---

## 1. Keep both Supabase projects from pausing, blocking

Both projects paused twice during this build. On the free tier a project pauses after a
week without traffic, and when it pauses the site is simply down: sign in fails, the
catalogue is empty, every page errors. A restore takes several minutes and the schema is
unreachable while it happens.

**Do:** upgrade the production project to Pro before launch. Keep dev on free if you like,
and expect to unpause it by hand when you come back to it.

## 2. Dev database, done

All fifteen migrations are applied to the dev project and the types are regenerated
from the real schema. `npx supabase migration list` shows every row matching. Nothing
for you to do here; it is recorded because the earlier draft of this file asked you to
do it by hand.

One thing worth knowing came out of applying them. The original schema grants table wide
UPDATE on `orders` to every signed in user, relying on row policies to keep buyers out.
That was safe until this build added a row policy so a buyer can set delivery details on
their own pending order, at which point the same grant let them set `payment_status`
too. It is closed by a trigger (`orders_guard_buyer_update`) that refuses any non owner
change outside the delivery columns and recomputes the money itself. Proven live: a
buyer setting `total_cents` to 1 gets it recomputed to the real total, and setting
`payment_status` to `paid` is refused. The same table wide grant also exists on
`order_items` and `order_events`; those have owner only update policies and no buyer
policy, so they are safe as long as nobody adds one without a matching trigger.

## 3. Production database, blocking

Production has zero migrations applied. Steps 1 and 2 in `DEPLOY.md`. The one thing that
is easy to get wrong: the very first owner cannot be made through the admin, because
`set_user_role` refuses to run for anyone who is not already an owner. Once, in the SQL
editor on production:

```sql
update public.profiles set role = 'owner' where email = 'your@email';
```

After that first one, promote and demote people only through `/admin/people`. It writes
an audit row and refuses to demote the last owner, which the SQL above does not.

## 4. A domain, blocking

You do not have one. Any registrar is fine. Once you own it:

- Vercel > Project > Settings > Domains > add both `yourdomain.com` and `www.yourdomain.com`.
- At the registrar, either add the records Vercel shows (`A @ 76.76.21.21` and
  `CNAME www cname.vercel-dns.com`) or switch the nameservers to `ns1.vercel-dns.com` and
  `ns2.vercel-dns.com`, which lets Vercel manage everything including wildcards.
- Propagation is usually minutes, occasionally an hour.

## 5. TLS certificate, not a task

You do not buy or upload one. Vercel talks to Let's Encrypt for you over ACME the moment
the DNS check passes, and renews it automatically. If the Domains page says the
certificate is not issuing, the cause is nearly always a stale DNS record somewhere else
(a CAA record, or an old `A` record still pointing at a previous host). The code already
sends `Strict-Transport-Security` with `preload`, so once the domain has served HTTPS for
a while you can submit it at hstspreload.org if you want browsers to refuse HTTP outright.

## 6. Email through Resend, blocking for sign up at any volume

Supabase's built in sender is rate limited to a couple of emails an hour and is not for
production: confirmation and reset emails quietly stop arriving. This needs the domain
from step 4 first.

1. Resend > Domains > Add. Use a subdomain, `mail.yourdomain.com`, so the shop's
   deliverability is separate from any personal mail on the root domain.
2. Add the SPF, DKIM and MX records it gives you at your registrar. Verify.
3. Resend > API Keys > create one with sending permission only.
4. Supabase > Authentication > Emails > SMTP Settings > Enable Custom SMTP:
   host `smtp.resend.com`, port `465`, username `resend`, password = the API key,
   sender email = `orders@mail.yourdomain.com` (or similar), sender name = the shop.
5. Resend > the domain > turn off click tracking, otherwise auth links get rewritten.
6. Vercel env: `RESEND_API_KEY` = the key, `EMAIL_FROM` = `Peri 3D Prints
   <orders@mail.yourdomain.com>`, `OWNER_EMAIL` = where you want new order and new message
   alerts.

Until this is done the app still works: emails are skipped and logged, never thrown.

## 7. Vercel plan

Hobby is free but its terms exclude commercial use. Budget for Pro at about $20 a month
once the shop takes money.

## 8. Fill in the legal gaps, blocking for launch

`/privacy` and `/terms` each have one clearly marked box: trader name, trading address,
contact email, and whether you are VAT registered. I did not invent them. Edit
`src/app/(site)/privacy/page.tsx` and `src/app/(site)/terms/page.tsx`, replace the
`<Todo>` block with a paragraph, and delete the import if it is no longer used.

## 9. Photos, the biggest visual gap

Every product currently shows a grey "No photo" square. The seed deliberately created no
image rows, since pointing at storage objects that do not exist renders broken images.
Upload through `/admin/products` on a phone, three photos per print, square framing.
Delete the demo products first if you want a clean slate:

```sql
delete from public.products where 'demo' = any(tags);
```

## 10. Settings, quick

`/admin/settings`: your WhatsApp number (the chat and cart offer it as a fallback), the
announcement strip, and the three canned replies.

## 11. Things to check on a real phone

Every screenshot in this build was headless Chrome at 390px and 1280px. That catches
layout, not feel. Look at: the orange masthead and lime band in daylight, the carousel
actually rotating and pausing when you touch it, and a chat reply appearing without a
refresh (open the same thread as owner on one device and buyer on another).

## 12. Security settings that live in dashboards, not code

From Supabase's own production checklist, none of which the code can set:

- Database > Settings: SSL enforcement on. Network restrictions if you can.
- Authentication > Providers: email confirmations on, OTP expiry 3600 seconds or lower.
- Authentication > Rate Limits: keep the defaults.
- Your Supabase account and your GitHub account: turn on two factor authentication. An
  attacker with either has the database.
- Add a second organisation owner in Supabase so one lost login does not lock you out.
- Settings > Add-ons: daily backups now, point in time recovery once orders exist.

Vercel: enable Deployment Protection on preview URLs so half finished branches are not
public. Nothing on the site sets a tracking cookie, so there is no consent banner to add.

## 13. Not built, and why

- **BOX NOW live** (stage 15): blocked on partner credentials that do not exist. The
  provider is built against the real API shape and reports `not-configured` cleanly.
  When you have them, fill the four `BOXNOW_*` variables and the locker flow turns on.
- **Card, cash on delivery, bank transfer**: backlog by your decision. The
  `PaymentMethod` interface and the enum values are in place, so each is an
  implementation behind an existing seam, not a rewrite.
- **Lighthouse numbers**: the plan asks for them on `/`, `/shop` and a product page.
  Headless Chrome here has no compositor, so the scores it gives are not real. Run them
  from Chrome DevTools on the live domain: Lighthouse > Mobile > Performance and
  Accessibility, target 90 or above on both. The site is built for it (next/image with
  sizes, no layout shift on the grid, self hosted fonts) but the numbers need a real run.
- **Owner email when a message sits unread for 15 minutes**: the alert is sent on every
  new custom request and every new order now. The 15 minute unread digest needs a
  scheduled job; the cleanest home for it is a Vercel cron hitting a route that queries
  `conversations where unread_for_owner and last_message_at < now() - 15 min`. Not built.

## 14. Attribution note

The commits from this session carry a `Co-Authored-By` trailer because the harness that
ran me asked for it after the session started, which conflicts with CLAUDE.md section 9.
They are all local and unpushed on `feat/complete-shop`, so if you would rather strip
the trailers before they land on `main`, say so and I will redo the messages before
merging. Nothing else about the history is affected.
