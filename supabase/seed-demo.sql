-- DEMO DATA FOR LOCAL DEVELOPMENT ONLY.
--
-- This file is deliberately NOT in supabase/migrations/, so it never runs on a
-- db push and never reaches production. Apply it by hand when you want a full
-- looking shop to design against.
--
-- Undo, in one line, because every row here is tagged 'demo':
--
--   delete from public.products where 'demo' = any(tags);
--
-- Images and variants cascade on delete, so that statement is a complete
-- teardown. There are no product_images rows here on purpose: pointing at
-- storage objects that do not exist renders broken images, which looks worse
-- than the "No photo" placeholder the card already draws.

insert into public.products (
  slug, title, short_description, description, price_cents, compare_at_cents,
  status, made_to_order, stock_qty, material, weight_grams,
  length_mm, width_mm, height_mm, print_minutes, spec_note, tags, category_id
)
values
  ('demo-articulated-axolotl', 'Articulated axolotl',
   'Prints in one piece, joints move straight off the plate.',
   'Prints in one piece with the joints already working, so there is nothing to glue or clip together. Pick a colour and I will print it. Message me if you want a bigger one.',
   1800, null, 'active', true, null, 'PLA', 46, 82, 40, 95, 260, 'Articulated',
   array['demo'], (select id from public.categories where slug = 'articulated')),

  ('demo-articulated-dragon', 'Articulated dragon',
   'Long body, every segment moves.',
   'Twenty segments, all of them move. It comes off the plate ready to play with. Takes most of a day to print, so allow a few days if it is not in stock.',
   3200, 3900, 'active', true, null, 'PLA', 128, 240, 55, 70, 690, 'Articulated',
   array['demo'], (select id from public.categories where slug = 'articulated')),

  ('demo-articulated-octopus', 'Articulated octopus',
   'Eight arms, all of them curl.',
   'The arms curl and hold their shape, so it will sit on a shelf or grip a monitor. Comes in one piece.',
   2200, null, 'active', false, 4, 'PLA', 61, 110, 110, 45, 320, 'Articulated',
   array['demo'], (select id from public.categories where slug = 'articulated')),

  ('demo-hex-planter-small', 'Hex planter, small',
   'Fits a 6 cm pot, drains into a saucer.',
   'Holds a 6 cm nursery pot. The base catches water so it will not mark a desk. Printed in a matte finish.',
   1400, null, 'active', false, 4, 'PETG', 88, 95, 82, 70, 240, 'Watertight',
   array['demo'], (select id from public.categories where slug = 'desk-and-home')),

  ('demo-cable-tidy-six', 'Cable tidy, six slots',
   'Keeps six cables from sliding off the desk.',
   'Six slots, weighted base. It holds a charging cable without being dragged along with it.',
   900, 1200, 'active', false, 4, 'PLA', 34, 120, 35, 22, 95, 'Weighted base',
   array['demo'], (select id from public.categories where slug = 'desk-and-home')),

  ('demo-desk-tray', 'Desk tray',
   'One place for the things that end up everywhere.',
   'Keys, coins, a memory card. Stackable if you want two. The inside is printed smooth so it is easy to wipe out.',
   1600, null, 'active', true, null, 'PLA', 74, 160, 110, 28, 210, 'Stackable',
   array['demo'], (select id from public.categories where slug = 'desk-and-home')),

  ('demo-pen-pot-hex', 'Hex pen pot',
   'Holds about a dozen pens.',
   'Same hex pattern as the planters. Heavy enough that it does not tip when you pull a pen out.',
   1200, null, 'active', false, 0, 'PLA', 58, 80, 80, 100, 165, 'Matte finish',
   array['demo'], (select id from public.categories where slug = 'desk-and-home')),

  ('demo-keyring-spool', 'Filament spool keyring',
   'A tiny spool, because of course.',
   'A small spool with a working centre. Prints in about half an hour, so it is the one I bring to markets by the boxful.',
   400, null, 'active', false, 4, 'PLA', 7, 38, 38, 14, 32, 'Spins',
   array['demo'], (select id from public.categories where slug = 'keyrings')),

  ('demo-keyring-name', 'Name keyring',
   'Tell me the name and I will print it.',
   'Any name up to ten letters. Tell me the name and the colour when you order, or message me if you want two colours.',
   500, null, 'active', true, null, 'PLA', 9, 65, 22, 6, 40, 'Made to order',
   array['demo'], (select id from public.categories where slug = 'keyrings')),

  ('demo-keyring-hex', 'Hex keyring',
   'Plain, cheap, hard to lose.',
   'A simple hex tag. Pick a colour. It is the cheapest thing I make and it survives being sat on.',
   350, null, 'active', false, 4, 'PLA', 6, 42, 36, 5, 28, 'Hard wearing',
   array['demo'], (select id from public.categories where slug = 'keyrings')),

  ('demo-custom-nameplate', 'Custom nameplate',
   'For a door, a desk, or a shelf.',
   'Tell me the text and roughly how big. I will send you a picture before I print it so you can change your mind.',
   2400, null, 'active', true, null, 'PLA', 96, 200, 60, 12, 300, 'Made to order',
   array['demo'], (select id from public.categories where slug = 'made-to-order')),

  ('demo-custom-figure', 'Custom figure',
   'Send me a reference and I will tell you if I can print it.',
   'Send a picture or a link and I will tell you honestly whether it will print well and what it will cost. Bigger ones take a few days.',
   4500, null, 'active', true, null, 'PLA', 210, 150, 90, 180, 900, 'Made to order',
   array['demo'], (select id from public.categories where slug = 'made-to-order'))
on conflict (slug) do nothing;

-- Colour options on a few of them, so the swatches in the purchase panel have
-- something to draw.
insert into public.product_variants (product_id, option_label, name, swatch_hex, price_delta_cents, stock_qty, position)
select p.id, 'Colour', v.name, v.hex, 0, 4, v.position
from public.products p
join (values
  ('Flame orange', '#FF5C1A', 0),
  ('Deep black',   '#12151A', 1),
  ('Bone white',   '#F2F0EA', 2),
  ('Lime',         '#B8E62E', 3)
) as v(name, hex, position) on true
where p.slug in ('demo-articulated-axolotl', 'demo-keyring-hex', 'demo-hex-planter-small', 'demo-keyring-spool');
