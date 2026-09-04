# What you have to do by hand

Things I cannot do from here, because they need a login to a website, a payment, or a
decision that is yours. In order. Each one says exactly where to click.

If you only do one thing today, do number 1. It is the bug you just hit.

---

# 1. Fix the verification email going to localhost

**The problem:** someone signs up, gets the email, clicks the link, and lands on
`http://localhost:3000/...` which is a page on *their own computer*, so nothing happens.

**Why:** two settings still say your site lives at localhost. One is in Vercel, one is in
Supabase. I fixed the code so it stops trusting a stale localhost value, but Supabase has
the final say on where that email link points, and only you can change it.

### 1a. Vercel

1. Go to https://vercel.com/dashboard and open the **peri3dprints** project.
2. **Settings** (top tabs) then **Environment Variables** (left menu).
3. Find `NEXT_PUBLIC_SITE_URL`. It probably says `http://localhost:3000`.
4. **Delete it** and add a new one named `SITE_URL` instead. Vercel warns that the
   `NEXT_PUBLIC_` prefix exposes a value to the browser, and nothing in the browser needs
   this one. Dropping the prefix also means you can change it later without redeploying.
5. Value: your real site address, the one in the browser when you visit the deployed site.
   Looks like `https://peri3dprints.vercel.app`, no slash at the end.
6. Tick **Production**. Save.

   (If you would rather not touch it right now, the old name still works. The site will
   not break either way.)

### 1b. Supabase

1. Go to https://supabase.com/dashboard and open your project.
2. Left menu: **Authentication**, then **URL Configuration**.
3. **Site URL**: put the same address, `https://peri3dprints.vercel.app`.
4. **Redirect URLs**: click Add URL and add these two, one at a time:
   - `https://peri3dprints.vercel.app/**`
   - `http://localhost:3000/**`  (so signing up still works while you develop)
5. Save.

### 1c. Redeploy and test

1. Back in Vercel, **Deployments** tab, the top one, three dots, **Redeploy**.
2. When it finishes, open your site in a **private/incognito window**.
3. Sign up with an email you can read. Click the link in the email.
4. You should land on your real site, signed in. If it still says localhost, the Supabase
   Site URL in step 1b did not save. That one is the one that matters most.

---

# 2. Stop the database going to sleep

**The problem:** your Supabase project is on the free plan. If nobody uses it for about a
week it **pauses**, and while it is paused your whole site is broken: nobody can sign in,
the shop is empty, every page errors. It paused twice while I was building.

**Fix:** open the project in Supabase, **Settings** then **Billing**, and upgrade to
**Pro** (about $25 a month). Do this before you tell anyone the shop is open.

---

# 3. Send emails properly

**The problem:** right now Supabase sends the sign up emails itself, and it only allows a
couple per hour before it silently stops. Real customers will not get their emails.

You need a domain first (step 4), because email needs a domain to send from.

Once you have one:

1. Sign up at https://resend.com (free for 3,000 emails a month).
2. **Domains** then **Add Domain**. Type `mail.yourdomain.com` (a subdomain, not the bare
   domain).
3. Resend shows you a list of DNS records. Go to wherever you bought the domain and add
   them exactly as shown. Then click **Verify** in Resend. It takes 5 to 10 minutes.
4. In Resend, **API Keys**, **Create API Key**. Copy it, you only see it once.
5. In Resend, open your domain settings and turn **click tracking off**. If it is on, it
   rewrites the links in the sign up emails and they break.
6. Back in Supabase: **Project Settings**, **Authentication**, scroll to **SMTP Settings**,
   turn on **Enable Custom SMTP** and fill in:
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: the API key from step 4
   - Sender email: `orders@mail.yourdomain.com`
   - Sender name: `Peri 3D Prints`
7. In Vercel, Environment Variables, add three:
   - `RESEND_API_KEY` = the API key
   - `EMAIL_FROM` = `Peri 3D Prints <orders@mail.yourdomain.com>`
   - `OWNER_EMAIL` = your own email, where you want to hear about new orders

   None of these three need the `NEXT_PUBLIC_` prefix. They are secrets, and the browser
   never sees them.
8. Redeploy.

Until you do this the site still works. Order emails are just skipped, not broken.

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
