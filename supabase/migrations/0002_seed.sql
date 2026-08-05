-- Seed data: the settings row, starter categories, and the shipping methods
-- from SETUP.md section 5.
--
-- Every statement is safe to run twice, so this can be replayed against a fresh
-- project without erroring.
--
-- The rates below are the placeholders from SETUP.md and are explicitly
-- illustrative. Confirm real prices with each carrier before launch.

-- ---------------------------------------------------------------------------
-- Settings, single row
-- ---------------------------------------------------------------------------

insert into public.settings (id, shop_open)
values (1, true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Categories
--
-- Neither CLAUDE.md nor SETUP.md names these, so they are a starting guess for
-- a shop selling printed toys and objects. Rename them in the admin, the slugs
-- are what the URLs use.
-- ---------------------------------------------------------------------------

insert into public.categories (slug, name, position) values
  ('articulated',  'Articulated',    0),
  ('desk-and-home','Desk and home',  1),
  ('keyrings',     'Keyrings',       2),
  ('made-to-order','Made to order',  3)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Shipping methods
-- ---------------------------------------------------------------------------

insert into public.shipping_methods (
  code, carrier, zone, label, description,
  base_cents, per_extra_100g_cents, free_over_cents, max_weight_grams,
  requires_locker, supports_cod, active, position
) values
  (
    'boxnow-cy', 'boxnow', 'cy', 'BOX NOW locker',
    'Pick it up from any BOX NOW locker, usually the next day.',
    300, 0, 3500, 20000, true, true, true, 0
  ),
  (
    'acs-cy-home', 'acs', 'cy', 'ACS to your door',
    'ACS brings it to your address.',
    450, 50, 5000, 20000, false, true, true, 1
  ),
  (
    'acs-cy-point', 'acs', 'cy', 'ACS pickup point',
    'Collect it from an ACS pickup point.',
    350, 50, 4000, 20000, false, true, true, 2
  ),
  (
    'cypost-cy', 'cypost', 'cy', 'Cyprus Post',
    'Cheaper, but slower than the couriers.',
    250, 40, 3000, 2000, false, false, true, 3
  ),
  (
    'cypost-eu', 'cypost', 'eu', 'Post to Europe',
    'Usually 5 to 10 working days.',
    900, 120, null, 2000, false, false, true, 4
  ),
  (
    'cypost-world', 'cypost', 'world', 'Post worldwide',
    'How long it takes depends on the country.',
    1400, 180, null, 2000, false, false, true, 5
  ),
  (
    'pickup-festival', 'pickup', 'cy', 'Collect from me at a market',
    'Find me at a market and take it in person. Costs you nothing.',
    0, 0, null, null, false, false, true, 6
  )
on conflict (code) do nothing;
