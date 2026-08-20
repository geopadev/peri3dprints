# Things you have to do by hand

Written after the colour system work. Everything here needs a person: a login, a
photograph, or a judgement call.

---

## 1. Both Supabase projects are unreachable

**This blocks everything else on this page.** While working, both project
hostnames stopped resolving:

```
bmepjrxejreysevrvkol.supabase.co   NXDOMAIN   (dev)
xxgkdbcgllpvbdvouyyr.supabase.co   NXDOMAIN   (prod)
```

General internet and `supabase.com` both resolve fine from this machine, so it
is not a local DNS fault. Two projects disappearing together points at the free
tier pausing them after inactivity, or the projects being deleted.

**Do this:** sign in at https://supabase.com/dashboard and look at both
projects. If they are paused, restore them. If they are gone, they need
recreating and every migration in `supabase/migrations/` reapplying in order.

Nothing below can be verified until this is fixed.

---

## 2. Load the demo products

The catalogue is empty, so the grid renders as one dashed box. There are twelve
demo products ready to load.

```bash
# once the project is awake, in the Supabase SQL editor, or:
supabase db execute -f supabase/seed-demo.sql
```

It is deliberately **not** a migration, so it never runs on `db push` and never
reaches production.

**To remove it again**, one line, because every row is tagged:

```sql
delete from public.products where 'demo' = any(tags);
```

Images and variants cascade, so that is a complete teardown.

---

## 3. Upload real product photos

**The seed gives you structure, not photography.** It deliberately creates zero
image rows: pointing at storage objects that do not exist renders broken
images, which looks worse than the "No photo" placeholder.

So the grid currently shows correct layout, badges and spec strips, with grey
placeholders where the prints should be. **The site will not actually look
finished until real photos exist**, and no amount of code fixes that.

**Do this:** go to `/admin/products`, open each product and upload photos
through the existing uploader. Square-ish framing works best, the card crops to
`aspect-square` on a phone. Store at 1600px max, per section 8.

Alt text is required and should say what the thing is, not "product image".

---

## 4. Check the colour on a real phone

Every screenshot behind this work was taken headless at 390px and 1280px. That
catches layout, but it does not catch how flame and lime look on a real OLED
screen in daylight, which is where most of your buyers will see them.

**Look at, specifically:**

- the orange masthead on the home page, in sunlight
- the lime band, which is the brightest thing on the site
- whether the coloured category chips read as a set or as noise once there are
  real categories with real names

If the lime is too much, the cheapest fix is changing one token:
`--color-highlight` in `src/app/globals.css`.

---

## 5. Decisions I made that you may want to reverse

| What | Where | Why, and how to undo |
| --- | --- | --- |
| Magenta no longer marks errors | `notice.tsx`, `input.tsx` | It now means sale only. Errors are an ink border on a faint pink field. Undo by pointing `--color-alert-tint` back at a magenta border. |
| Category chips now show on phones | `(site)/page.tsx` | They were hidden because the drawer lists them. A visible coloured row is worth more on a phone. Re-add `hidden sm:block` to undo. |
| "Made to order" has no colour | `tag.tsx` | It is true of nearly every product, so a coloured tag would put the same colour on every card. Give the `made` tone a fill to undo. |
| Empty state points at chat | `(site)/page.tsx` | The band underneath already says "Ask for a custom print", and the same button twice reads as a bug. |
| Announcement strip stays ink | `announcement-strip.tsx` | It is above the fold on every page, so a colour there spends the accent before the page starts. |

---

## 6. Not done, needs your call

- **Toasts are still not mounted anywhere.** `ToastProvider` and `ToastViewport`
  exist and are styled, but only the styleguide mounts them, so no toast can
  ever appear on the real site. Mounting them in `(site)/layout.tsx` and
  converting the "Added." line in `ProductPurchasePanel` is a small job that
  would add a bit of life. It is scope-adjacent to a colour change, so I left it.
- **`/orders` and `/messages` are linked but do not exist yet** (stages 10 and
  11). The account menu and the new empty-state button both point at
  `/messages`, which 404s today.
- **Stage 11 chat is half built.** The data layer, schema and triggers are done
  and verified; the widget and owner inbox are not.
- **The privilege escalation in stage 5b is still open.** Any signed-in buyer
  can set their own `role` to `owner`, because `profiles` grants table-wide
  update and RLS cannot restrict columns. Not urgent while yours is the only
  account. It must close before anyone else signs up.
