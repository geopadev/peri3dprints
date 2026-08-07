-- Checkout needs two things the schema does not have yet: somewhere to keep
-- the bank details a buyer is told to pay into, and an atomic way to create an
-- order.

-- ---------------------------------------------------------------------------
-- Bank transfer details
--
-- These live in settings, next to the WhatsApp number, for the same reason:
-- the owner can change them himself without a redeploy. They are not secrets,
-- they are what the buyer is asked to pay into, so they do not belong in env.
-- ---------------------------------------------------------------------------

alter table public.settings
  add column if not exists bank_account_name text,
  add column if not exists bank_iban text,
  add column if not exists bank_bic text;

-- ---------------------------------------------------------------------------
-- create_order
--
-- Every price is recomputed here, from the products and shipping_methods
-- tables, and nothing about money is taken from the caller. That matters more
-- than usual because this is SECURITY DEFINER and therefore callable directly
-- by any signed in buyer through PostgREST, not only by our Server Action. It
-- has to be safe against someone crafting the call by hand.
--
-- The shipping formula is duplicated from src/lib/shipping/rates.ts. Both
-- must change together. The pair is covered by a test that runs the same cases
-- through each and compares, so a drift fails the suite rather than quietly
-- charging the wrong postage.
-- ---------------------------------------------------------------------------

create or replace function public.create_order(
  p_email text,
  p_phone text,
  p_full_name text,
  p_payment_method public.payment_method,
  p_shipping_method_id uuid,
  p_country_code text,
  p_shipping_address jsonb,
  p_pickup_point jsonb,
  p_items jsonb,
  p_buyer_note text default null
)
returns table (
  order_id uuid,
  order_number text,
  access_token uuid,
  subtotal_cents int,
  shipping_cents int,
  total_cents int
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_buyer uuid := auth.uid();
  v_item jsonb;
  v_product public.products%rowtype;
  v_variant public.product_variants%rowtype;
  v_qty int;
  v_unit int;
  v_available int;
  v_subtotal int := 0;
  v_weight int := 0;
  v_method public.shipping_methods%rowtype;
  v_zone public.ship_zone;
  v_shipping int;
  v_steps int;
  v_order_id uuid;
begin
  -- No order without a signed in buyer. CLAUDE.md section 6.
  if v_buyer is null then
    raise exception 'You have to be signed in to place an order.' using errcode = '28000';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty.' using errcode = '22023';
  end if;

  -- Pass one: price every line from the database and check it can be supplied.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := coalesce((v_item ->> 'quantity')::int, 0);
    if v_qty <= 0 then
      raise exception 'A line in your cart has no quantity.' using errcode = '22023';
    end if;

    select * into v_product
    from public.products
    where id = (v_item ->> 'product_id')::uuid;

    if not found or v_product.status <> 'active' then
      raise exception 'One of the prints in your cart is not available any more.'
        using errcode = '22023';
    end if;

    v_variant := null;
    if v_item ->> 'variant_id' is not null then
      select * into v_variant
      from public.product_variants
      where id = (v_item ->> 'variant_id')::uuid
        and product_id = v_product.id;

      if not found then
        raise exception 'One of the options in your cart is not available any more.'
          using errcode = '22023';
      end if;
    end if;

    -- Stock lives on the variant when there is one, the product otherwise, and
    -- is unlimited for a made to order print.
    if coalesce(v_product.made_to_order, true) then
      v_available := null;
    else
      v_available := coalesce(v_variant.stock_qty, v_product.stock_qty);
    end if;

    if v_available is not null and v_qty > v_available then
      raise exception 'There is not enough stock of %.', v_product.title using errcode = '22023';
    end if;

    v_unit := v_product.price_cents + coalesce(v_variant.price_delta_cents, 0);
    v_subtotal := v_subtotal + v_unit * v_qty;
    v_weight := v_weight + coalesce(v_product.weight_grams, 0) * v_qty;
  end loop;

  -- Shipping, recomputed the same way rates.ts does it.
  select * into v_method from public.shipping_methods where id = p_shipping_method_id;
  if not found or not coalesce(v_method.active, false) then
    raise exception 'That delivery option is not available.' using errcode = '22023';
  end if;

  v_zone := case
    when upper(trim(p_country_code)) = 'CY' then 'cy'
    when upper(trim(p_country_code)) in (
      'AT','BE','BG','HR','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT',
      'LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'
    ) then 'eu'
    else 'world'
  end::public.ship_zone;

  if v_method.zone <> v_zone then
    raise exception 'That delivery option does not go to that country.' using errcode = '22023';
  end if;

  if v_method.max_weight_grams is not null and v_weight > v_method.max_weight_grams then
    raise exception 'That delivery option cannot take a parcel this heavy.' using errcode = '22023';
  end if;

  if v_method.free_over_cents is not null and v_subtotal >= v_method.free_over_cents then
    v_shipping := 0;
  else
    v_steps := ceil(greatest(0, v_weight - 500)::numeric / 100);
    v_shipping := v_method.base_cents + v_steps * coalesce(v_method.per_extra_100g_cents, 0);
  end if;

  if v_method.requires_locker and p_pickup_point is null then
    raise exception 'Pick a locker before you order.' using errcode = '22023';
  end if;

  if p_payment_method = 'cod' and not coalesce(v_method.supports_cod, false) then
    raise exception 'Cash on delivery is not available with that delivery option.'
      using errcode = '22023';
  end if;

  insert into public.orders (
    buyer_id, email, phone, full_name,
    status, payment_method, payment_status,
    shipping_method_id, shipping_address, pickup_point,
    subtotal_cents, shipping_cents, total_cents,
    buyer_note
  )
  values (
    v_buyer, p_email, p_phone, p_full_name,
    (case when p_payment_method = 'cod' then 'awaiting_payment' else 'pending' end)::public.order_status,
    p_payment_method, 'unpaid',
    p_shipping_method_id, p_shipping_address, p_pickup_point,
    v_subtotal, v_shipping, v_subtotal + v_shipping,
    p_buyer_note
  )
  returning id into v_order_id;

  -- Snapshots, so the order still reads correctly after a rename or a reprice.
  insert into public.order_items (
    order_id, product_id, variant_id,
    title_snapshot, variant_snapshot, image_path_snapshot,
    unit_price_cents, quantity
  )
  select
    v_order_id,
    p.id,
    v.id,
    p.title,
    v.name,
    (select i.storage_path from public.product_images i
      where i.product_id = p.id order by i.position limit 1),
    p.price_cents + coalesce(v.price_delta_cents, 0),
    (item ->> 'quantity')::int
  from jsonb_array_elements(p_items) as item
  join public.products p on p.id = (item ->> 'product_id')::uuid
  left join public.product_variants v on v.id = (item ->> 'variant_id')::uuid;

  return query
  select o.id, o.order_number, o.access_token, o.subtotal_cents, o.shipping_cents, o.total_cents
  from public.orders o
  where o.id = v_order_id;
end;
$$;

-- Buyers create their own orders through this and only through this: the
-- orders table still has no insert policy, so there is no other way in.
revoke execute on function public.create_order(
  text, text, text, public.payment_method, uuid, text, jsonb, jsonb, jsonb, text
) from public, anon;

grant execute on function public.create_order(
  text, text, text, public.payment_method, uuid, text, jsonb, jsonb, jsonb, text
) to authenticated;
