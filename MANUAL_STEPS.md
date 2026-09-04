# What you have to do by hand

Things I cannot do from here, because they need a login to a website, a payment, or a
decision that is yours. In order. Each one says exactly where to click.

If you only do one thing today, do number 1. It is the bug you just hit.

---

# 1. Fix the verification email going to localhost — done

You did this. For the record, what it took:

- **Vercel**: `NEXT_PUBLIC_SITE_URL` replaced with `SITE_URL`, set to the real deployed
  address, in Production.
- **Supabase → Authentication → URL Configuration**: Site URL set to the same address,
  and both that address and `http://localhost:3000` added under Redirect URLs.
- A second, deeper bug found once the first fix was live: the confirmation link worked
  from the *same* browser that signed up, but failed with an error in any other browser
  or device, because it relied on a cookie only that first browser had. Fixed in code
  (`src/app/auth/callback/route.ts` now accepts a `token_hash` link that needs no cookie),
  plus two template edits in **Supabase → Authentication → Email Templates**: Confirm
  signup and Reset Password both now link to `/auth/callback` with `token_hash` and
  `type` rather than Supabase's default link shape.
- Custom SMTP through Resend, using the `onboarding@resend.dev` test sender, which is
  also what unblocked editing the templates in the first place (Supabase requires custom
  SMTP configured before it lets a free tier project touch its email templates at all).

**One thing to come back to**: `onboarding@resend.dev` can only deliver to the email
address your Resend account itself is registered under. It is fine for testing, but real
customers will not receive anything through it. Step 3 below is what replaces it, and it
needs a domain first (step 4).

---

# 2. Stop the database going to sleep

**The problem:** your Supabase project is on the free plan. If nobody uses it for about a
week it **pauses**, and while it is paused your whole site is broken: nobody can sign in,
the shop is empty, every page errors. It paused twice while I was building.

**Fix:** open the project in Supabase, **Settings** then **Billing**, and upgrade to
**Pro** (about $25 a month). Do this before you tell anyone the shop is open.

---

# 3. Move Resend onto your own domain

You already have a Resend account and custom SMTP is already connected to Supabase, from
step 1. This is the follow-up once you have a domain (step 4): swap the test sender for
one on your own domain, so email actually reaches real customers instead of only your own
Resend account address.

1. In Resend, **Domains** then **Add Domain**. Type `mail.yourdomain.com` (a subdomain,
   not the bare domain).
2. Resend shows you a list of DNS records. Go to wherever you bought the domain and add
   them exactly as shown. Then click **Verify** in Resend. It takes 5 to 10 minutes.
3. In Resend, open the new domain's settings and turn **click tracking off**. If it is on,
   it rewrites the links in the sign up emails and they break.
4. Back in Supabase: **Project Settings**, **Authentication**, **SMTP Settings**. The
   host, port and username are already right (`smtp.resend.com`, `465`, `resend`).
   Change:
   - Sender email: `orders@mail.yourdomain.com` (was `onboarding@resend.dev`)
   - Sender name: `Peri 3D Prints`, if it is not already.
5. In Vercel, Environment Variables, add three:
   - `RESEND_API_KEY` = the same API key you already created
   - `EMAIL_FROM` = `Peri 3D Prints <orders@mail.yourdomain.com>`
   - `OWNER_EMAIL` = your own email, where you want to hear about new orders

   None of these three need the `NEXT_PUBLIC_` prefix. They are secrets, and the browser
   never sees them. These three are what the shop's own order and message emails read
   from (`src/lib/email/`) — separate from the Supabase SMTP settings, which only cover
   sign up and password reset.
6. Redeploy.

Until you do this, order and message emails are skipped rather than broken: the code
checks for `RESEND_API_KEY` before trying to send, and logs instead of failing the order
when it is missing.

---

# 4. Get a domain

You do not have one yet. Buy one anywhere (Namecheap, Cloudflare, GoDaddy). Something like
`peri3dprints.com`.

Then:

1. Vercel, your project, **Settings**, **Domains**, **Add**.
2. Type your domain. Add `www.yourdomain.com` as well.
3. Vercel shows you what to put at your registrar. Usually:
   - Type `A`, Name `@`, Value `76.76.21.21`
   - Type `CNAME`, Name `www`, Value `cname.vercel-dns.com`
4. Add those where you bought the domain, under DNS settings.
5. Wait. Usually minutes, sometimes an hour. Vercel will show **Valid Configuration**.
6. **Then go back and redo step 1** with the real domain instead of the vercel.app one.
   `SITE_URL` is read at runtime, so that one takes effect without a redeploy.

---

# 5. The security certificate (https)

**Nothing to do.** You do not buy one and you do not install one. The moment step 4 works,
Vercel gets a free certificate from Let's Encrypt automatically and renews it forever. Your
site will show the padlock on its own.

If it does not appear after an hour, it is almost always an old DNS record left over from
somewhere else. Vercel's Domains page will tell you which one.

---

# 6. Make yourself the owner on the real site

The admin is locked to owner accounts. The very first owner cannot be made through the
admin, because there is nobody to approve it yet. So once, by hand:

1. Sign up on your live site with the email you want to use. Confirm it.
2. Supabase dashboard, **SQL Editor**, **New query**, paste this with your email:
   ```sql
   update public.profiles set role = 'owner' where email = 'your@email.com';
   ```
3. Run it. Reload the site. `/admin` now opens.

After that, never do this again. Add and remove owners in **/admin/people**, which keeps a
record of who changed what.

---

# 7. Put your real prints in

Every product on the site right now is fake demo data with a grey "No photo" box. This is
the biggest reason it does not look finished.

1. Delete the demo products. Supabase, SQL Editor:
   ```sql
   delete from public.products where 'demo' = any(tags);
   ```
2. Go to `/admin/products` on your phone and add your real prints, with photos.
3. Fill in `/admin/settings`: your WhatsApp number, the announcement line, and the three
   quick replies.

---

# 8. Fill in the legal blanks

`/privacy` and `/terms` each have a coloured box saying "To fill in before launch". They
need your trading name, address, contact email, and whether you are VAT registered. I did
not invent them.

Edit `src/app/(site)/privacy/page.tsx` and `src/app/(site)/terms/page.tsx`, replace the
`<Todo>...</Todo>` block with a normal paragraph.

---

# 9. Security settings that live in dashboards

Quick, and worth doing:

- **Supabase**: turn on two factor authentication on your account. Anyone who gets into
  your Supabase account has every customer's details.
- **GitHub**: same, turn on two factor.
- **Supabase**, Authentication, Providers, Email: make sure **Confirm email** is on.
- **Supabase**, Settings, Add-ons: turn on **daily backups**. Once you have real orders,
  turn on Point in Time Recovery too.
- **Vercel**, Settings, Deployment Protection: turn it on for Preview, so half finished
  work is not public.

The site sets no tracking cookies, so you do not need a cookie banner.

---

# 10. Things I could not finish, and why

- **BOX NOW lockers**: needs a partner account you do not have. The code is written and
  waiting; fill in the four `BOXNOW_` variables when you get credentials and it turns on.
- **Card payments, cash on delivery, bank transfer**: you decided payment happens by
  Revolut link in the chat. The groundwork for the others is in place if you change your
  mind.
- **Speed and accessibility scores**: I cannot measure these honestly from here, the
  browser I use has no graphics. Open your live site in Chrome, press F12, **Lighthouse**
  tab, choose Mobile, Analyse. Aim for 90+ on Performance and Accessibility.
- **Owner alert when a message sits unread**: you get an email for every new order and
  custom request. A "nobody replied in 15 minutes" reminder needs a scheduled job, which
  is not built.

---

# 11. One command for me, when you are ready

I rewrote the last 15 commit messages to remove the "Co-Authored-By: Claude" line you
asked about, but a safety check stopped me pushing rewritten history. The commits are
correct on your machine and I verified the files are byte for byte identical to before.
To publish them, run this once:

```bash
cd /home/george/repos/peri3dprints/peri3dprints
git push --force-with-lease origin main
```

If anything looks wrong afterwards, the old history is saved as a tag and this puts it
back exactly:

```bash
git reset --hard backup-before-trailer-strip
git push --force-with-lease origin main
```

Once you are happy, delete the safety tag: `git tag -d backup-before-trailer-strip`
