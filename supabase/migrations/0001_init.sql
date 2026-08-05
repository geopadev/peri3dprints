-- Initial schema for the shop: catalogue, orders, chat, and the RLS that guards them.
--
-- Two rules that shape everything below:
--   1. Money is integer cents, never a float.
--   2. Nothing is readable unless a policy says so. Never disable RLS to fix a
--      bug, fix the policy.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.product_status as enum ('draft', 'active', 'archived');

create type public.order_status as enum (
  'pending', 'paid', 'awaiting_payment', 'printing',
  'ready', 'shipped', 'delivered', 'cancelled', 'refunded'
);

create type public.payment_method as enum ('card', 'cod', 'bank_transfer');

create type public.payment_status as enum ('unpaid', 'paid', 'refunded', 'failed');

create type public.carrier as enum ('boxnow', 'acs', 'cypost', 'pickup');

create type public.ship_zone as enum ('cy', 'eu', 'world');

create type public.convo_kind as enum ('general', 'custom_request');

create type public.convo_status as enum ('open', 'awaiting_owner', 'awaiting_buyer', 'closed');

create type public.sender_role as enum ('buyer', 'owner');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null default 'customer' check (role in ('customer', 'owner')),
  display_name text,
  email text,
  phone text,
  created_at timestamptz default now()
);

-- Single row of shop-wide settings. The client edits these himself, which is why
-- the WhatsApp number lives here and not in an env var.
create table public.settings (
  id int primary key default 1 check (id = 1),
  whatsapp_number text,
  announcement text,
  shop_open boolean default true,
  boxnow_origin_location_id text,
  updated_at timestamptz default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  position int default 0
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  short_description text,
  description text,
  price_cents int not null check (price_cents >= 0),
  compare_at_cents int,
  status public.product_status not null default 'draft',
  made_to_order boolean default true,
  lead_time_days int default 3,
  stock_qty int,
  material text default 'PLA',
  weight_grams int,
  length_mm int,
  width_mm int,
  height_mm int,
  print_minutes int,
  spec_note text,
  category_id uuid references public.categories on delete set null,
  tags text[] default '{}',
  featured boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products on delete cascade,
  storage_path text not null,
  alt_text text not null,
  position int default 0
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products on delete cascade,
  option_label text not null default 'Colour',
  name text not null,
  swatch_hex text,
  price_delta_cents int default 0,
  stock_qty int,
  sku text,
  position int default 0
);

create table public.shipping_methods (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  carrier public.carrier not null,
  zone public.ship_zone not null,
  label text not null,
  description text,
  base_cents int not null,
  per_extra_100g_cents int default 0,
  free_over_cents int,
  max_weight_grams int,
  requires_locker boolean default false,
  supports_cod boolean default false,
  active boolean default true,
  position int default 0
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  -- Lets a buyer with no session open their own order from an email link.
  access_token uuid not null default gen_random_uuid(),
  buyer_id uuid references auth.users on delete set null,
  email text not null,
  phone text not null,
  full_name text not null,
  status public.order_status not null default 'pending',
  payment_method public.payment_method not null,
  payment_status public.payment_status not null default 'unpaid',
  shipping_method_id uuid references public.shipping_methods,
  shipping_address jsonb,
  pickup_point jsonb,
  subtotal_cents int not null,
  shipping_cents int not null,
  total_cents int not null,
  currency text not null default 'EUR',
  stripe_session_id text,
  stripe_payment_intent text,
  carrier_reference text,
  tracking_number text,
  tracking_url text,
  buyer_note text,
  owner_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Snapshots, so an order still reads correctly after a product is renamed,
-- repriced or deleted.
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders on delete cascade,
  product_id uuid references public.products on delete set null,
  variant_id uuid references public.product_variants on delete set null,
  title_snapshot text not null,
  variant_snapshot text,
  image_path_snapshot text,
  unit_price_cents int not null,
  quantity int not null check (quantity > 0)
);

create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders on delete cascade,
  type text not null,
  payload jsonb,
  created_at timestamptz default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references auth.users on delete set null,
  email text,
  display_name text,
  subject text,
  kind public.convo_kind not null default 'general',
  status public.convo_status not null default 'open',
  product_id uuid references public.products on delete set null,
  last_message_at timestamptz default now(),
  unread_for_owner boolean default true,
  unread_for_buyer boolean default false,
  created_at timestamptz default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations on delete cascade,
  sender_id uuid references auth.users on delete set null,
  sender_role public.sender_role not null,
  body text,
  attachments jsonb default '[]',
  created_at timestamptz default now(),
  read_at timestamptz
);

create table public.custom_request_details (
  conversation_id uuid primary key references public.conversations on delete cascade,
  budget_cents int,
  deadline date,
  colour_pref text,
  size_note text,
  reference_paths text[] default '{}'
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index products_status_created_at_idx on public.products (status, created_at desc);
create index products_category_id_idx on public.products (category_id);
create index product_images_product_id_position_idx on public.product_images (product_id, position);
create index orders_buyer_id_idx on public.orders (buyer_id);
create index orders_created_at_idx on public.orders (created_at desc);
create index messages_conversation_id_created_at_idx on public.messages (conversation_id, created_at);
create index conversations_last_message_at_idx on public.conversations (last_message_at desc);

-- ---------------------------------------------------------------------------
-- Functions and triggers
-- ---------------------------------------------------------------------------

-- SECURITY DEFINER so it reads profiles as the table owner and therefore skips
-- RLS. That is what stops the profiles policies, which call this function, from
-- recursing into themselves. search_path is pinned so the function cannot be
-- hijacked by a caller-controlled path.
create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'owner'
  );
$$;

grant execute on function public.is_owner() to anon, authenticated;

-- Every auth user gets a profile row. Buyers sign in anonymously, so this fires
-- for them too.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'display_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at
  before update on public.products
  for each row
  execute function public.set_updated_at();

create trigger orders_set_updated_at
  before update on public.orders
  for each row
  execute function public.set_updated_at();

-- Human readable order number, e.g. CY-2609-0042.
--
-- The counter is scoped to the same calendar month as the YYMM prefix. The brief
-- asked for a daily sequence, but a daily counter under a monthly prefix collides
-- on the unique index the moment two different days both reach the same count.
-- If a daily reset is really wanted, the prefix has to carry the day too
-- (CY-YYMMDD-NNNN). Raised in the report rather than silently picked.
--
-- The advisory lock serialises allocation within a month so two concurrent
-- checkouts cannot be handed the same number. It is released with the
-- transaction.
create or replace function public.generate_order_number()
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  period_start timestamptz := date_trunc('month', now());
  yymm text := to_char(now(), 'YYMM');
  seq int;
begin
  perform pg_advisory_xact_lock(hashtext('order_number:' || yymm));

  select count(*) + 1
  into seq
  from public.orders
  where created_at >= period_start;

  return 'CY-' || yymm || '-' || lpad(seq::text, 4, '0');
end;
$$;

create or replace function public.set_order_number()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.order_number is null or new.order_number = '' then
    new.order_number := public.generate_order_number();
  end if;
  return new;
end;
$$;

create trigger orders_set_order_number
  before insert on public.orders
  for each row
  execute function public.set_order_number();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.shipping_methods enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.custom_request_details enable row level security;

-- profiles ------------------------------------------------------------------

create policy profiles_select_own_or_owner on public.profiles
  for select
  using (id = (select auth.uid()) or public.is_owner());

create policy profiles_update_own_or_owner on public.profiles
  for update
  using (id = (select auth.uid()) or public.is_owner())
  with check (id = (select auth.uid()) or public.is_owner());

-- settings ------------------------------------------------------------------

create policy settings_select_public on public.settings
  for select
  using (true);

create policy settings_write_owner on public.settings
  for all
  using (public.is_owner())
  with check (public.is_owner());

-- categories ----------------------------------------------------------------

create policy categories_select_public on public.categories
  for select
  using (true);

create policy categories_write_owner on public.categories
  for all
  using (public.is_owner())
  with check (public.is_owner());

-- products ------------------------------------------------------------------

create policy products_select_active_or_owner on public.products
  for select
  using (status = 'active' or public.is_owner());

create policy products_write_owner on public.products
  for all
  using (public.is_owner())
  with check (public.is_owner());

-- product_images ------------------------------------------------------------

create policy product_images_select_active_or_owner on public.product_images
  for select
  using (
    public.is_owner()
    or exists (
      select 1
      from public.products p
      where p.id = product_images.product_id
        and p.status = 'active'
    )
  );

create policy product_images_write_owner on public.product_images
  for all
  using (public.is_owner())
  with check (public.is_owner());

-- product_variants ----------------------------------------------------------

create policy product_variants_select_active_or_owner on public.product_variants
  for select
  using (
    public.is_owner()
    or exists (
      select 1
      from public.products p
      where p.id = product_variants.product_id
        and p.status = 'active'
    )
  );

create policy product_variants_write_owner on public.product_variants
  for all
  using (public.is_owner())
  with check (public.is_owner());

-- shipping_methods ----------------------------------------------------------

create policy shipping_methods_select_active_or_owner on public.shipping_methods
  for select
  using (active or public.is_owner());

create policy shipping_methods_write_owner on public.shipping_methods
  for all
  using (public.is_owner())
  with check (public.is_owner());

-- orders --------------------------------------------------------------------
-- No insert policy on purpose. Orders are created by server code with the
-- service role, which bypasses RLS, so totals are always recomputed server side
-- and never taken from the browser.

create policy orders_select_own_or_owner on public.orders
  for select
  using (buyer_id = (select auth.uid()) or public.is_owner());

create policy orders_update_owner on public.orders
  for update
  using (public.is_owner())
  with check (public.is_owner());

-- order_items ---------------------------------------------------------------

create policy order_items_select_own_or_owner on public.order_items
  for select
  using (
    public.is_owner()
    or exists (
      select 1
      from public.orders o
      where o.id = order_items.order_id
        and o.buyer_id = (select auth.uid())
    )
  );

create policy order_items_update_owner on public.order_items
  for update
  using (public.is_owner())
  with check (public.is_owner());

-- order_events --------------------------------------------------------------

create policy order_events_select_own_or_owner on public.order_events
  for select
  using (
    public.is_owner()
    or exists (
      select 1
      from public.orders o
      where o.id = order_events.order_id
        and o.buyer_id = (select auth.uid())
    )
  );

create policy order_events_update_owner on public.order_events
  for update
  using (public.is_owner())
  with check (public.is_owner());

-- conversations -------------------------------------------------------------

create policy conversations_select_own_or_owner on public.conversations
  for select
  using (buyer_id = (select auth.uid()) or public.is_owner());

create policy conversations_insert_own_or_owner on public.conversations
  for insert
  with check (buyer_id = (select auth.uid()) or public.is_owner());

create policy conversations_update_own_or_owner on public.conversations
  for update
  using (buyer_id = (select auth.uid()) or public.is_owner())
  with check (buyer_id = (select auth.uid()) or public.is_owner());

-- messages ------------------------------------------------------------------

create policy messages_select_own_or_owner on public.messages
  for select
  using (
    public.is_owner()
    or exists (
      select 1
      from public.conversations c
      where c.id = messages.conversation_id
        and c.buyer_id = (select auth.uid())
    )
  );

create policy messages_insert_own_or_owner on public.messages
  for insert
  with check (
    public.is_owner()
    or (
      sender_id = (select auth.uid())
      and exists (
        select 1
        from public.conversations c
        where c.id = messages.conversation_id
          and c.buyer_id = (select auth.uid())
      )
    )
  );

create policy messages_update_sender_or_owner on public.messages
  for update
  using (sender_id = (select auth.uid()) or public.is_owner())
  with check (sender_id = (select auth.uid()) or public.is_owner());

-- custom_request_details ----------------------------------------------------

create policy custom_request_details_select_own_or_owner on public.custom_request_details
  for select
  using (
    public.is_owner()
    or exists (
      select 1
      from public.conversations c
      where c.id = custom_request_details.conversation_id
        and c.buyer_id = (select auth.uid())
    )
  );

create policy custom_request_details_insert_own_or_owner on public.custom_request_details
  for insert
  with check (
    public.is_owner()
    or exists (
      select 1
      from public.conversations c
      where c.id = custom_request_details.conversation_id
        and c.buyer_id = (select auth.uid())
    )
  );

create policy custom_request_details_update_own_or_owner on public.custom_request_details
  for update
  using (
    public.is_owner()
    or exists (
      select 1
      from public.conversations c
      where c.id = custom_request_details.conversation_id
        and c.buyer_id = (select auth.uid())
    )
  )
  with check (
    public.is_owner()
    or exists (
      select 1
      from public.conversations c
      where c.id = custom_request_details.conversation_id
        and c.buyer_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Grants
--
-- RLS is the gate that decides which rows come back. These grants only decide
-- which tables the API roles may attempt at all.
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select on all tables in schema public to anon, authenticated;

-- Buyers write their own chat rows and their own profile.
grant insert, update on
  public.conversations,
  public.messages,
  public.custom_request_details
  to authenticated;

grant update on public.profiles to authenticated;

-- The owner is just an authenticated user with profiles.role = 'owner', so the
-- catalogue grants have to go to the whole role. The owner-only policies above
-- are what actually restrict them.
grant insert, update, delete on
  public.categories,
  public.products,
  public.product_images,
  public.product_variants,
  public.shipping_methods
  to authenticated;

grant insert, update on public.settings to authenticated;

-- Orders deliberately get no insert grant. They are created by server code with
-- the service role after the totals are recomputed from the database. The owner
-- still needs update, to mark an order shipped.
grant update on
  public.orders,
  public.order_items,
  public.order_events
  to authenticated;
