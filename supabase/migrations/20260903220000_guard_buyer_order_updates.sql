-- SECURITY FIX for a hole opened by 20260903210559.
--
-- 0001_init.sql grants table wide UPDATE on public.orders to authenticated,
-- which was harmless while the only update policy was owner only. Adding a
-- row policy that lets a buyer update their own pending order meant the grant
-- suddenly covered every column for them too: a buyer could set
-- payment_status = 'paid', or total_cents = 1, through PostgREST.
--
-- RLS cannot restrict columns and cannot see OLD, so a trigger does it. For
-- anyone who is not the owner: only the delivery columns may change, and the
-- money columns are recomputed here from the chosen method and the order's own
-- items, ignoring whatever was sent. The owner is exempt and keeps the full
-- grant, since marking paid and adding tracking are his job.

create or replace function public.ship_zone_for(p_country text)
returns public.ship_zone
language sql
immutable
as $$
  select case
    when upper(trim(p_country)) = 'CY' then 'cy'
    when upper(trim(p_country)) in (
      'AT','BE','BG','HR','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT',
      'LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'
    ) then 'eu'
    else 'world'
  end::public.ship_zone;
$$;

create or replace function public.orders_guard_buyer_update()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_method public.shipping_methods%rowtype;
  v_weight int;
  v_steps int;
  v_country text;
begin
  if public.is_owner() then
    return new;
  end if;

  -- Everything a buyer must not touch. Compared with IS DISTINCT FROM so a
  -- null stays null without tripping.
  if new.status              is distinct from old.status
  or new.payment_status      is distinct from old.payment_status
  or new.payment_method      is distinct from old.payment_method
  or new.subtotal_cents      is distinct from old.subtotal_cents
  or new.buyer_id            is distinct from old.buyer_id
  or new.email               is distinct from old.email
  or new.phone               is distinct from old.phone
  or new.full_name           is distinct from old.full_name
  or new.access_token        is distinct from old.access_token
  or new.order_number        is distinct from old.order_number
  or new.tracking_number     is distinct from old.tracking_number
  or new.tracking_url        is distinct from old.tracking_url
  or new.carrier_reference   is distinct from old.carrier_reference
  or new.owner_note          is distinct from old.owner_note
  or new.pickup_point        is distinct from old.pickup_point
  or new.currency            is distinct from old.currency
  or new.stripe_session_id   is distinct from old.stripe_session_id
  or new.stripe_payment_intent is distinct from old.stripe_payment_intent
  or new.created_at          is distinct from old.created_at
  then
    raise exception 'Only the delivery details on an order can be changed.' using errcode = '42501';
  end if;

  if old.status not in ('pending', 'awaiting_payment') then
    raise exception 'That order is already being made, so the address cannot change.' using errcode = '42501';
  end if;

  -- Money is recomputed from the method, never taken from the request.
  select * into v_method from public.shipping_methods where id = new.shipping_method_id and active;
  if not found then
    raise exception 'Pick a delivery option.' using errcode = '22023';
  end if;

  if v_method.carrier = 'pickup' then
    new.shipping_address := null;
    new.shipping_cents := 0;
  else
    v_country := new.shipping_address ->> 'countryCode';
    if v_country is null or v_method.zone <> public.ship_zone_for(v_country) then
      raise exception 'That delivery option does not go to that country.' using errcode = '22023';
    end if;

    select coalesce(sum(i.quantity * coalesce(p.weight_grams, 0)), 0) into v_weight
    from public.order_items i left join public.products p on p.id = i.product_id
    where i.order_id = new.id;

    if v_method.max_weight_grams is not null and v_weight > v_method.max_weight_grams then
      raise exception 'That delivery option cannot take a parcel this heavy.' using errcode = '22023';
    end if;

    if v_method.free_over_cents is not null and new.subtotal_cents >= v_method.free_over_cents then
      new.shipping_cents := 0;
    else
      v_steps := ceil(greatest(0, v_weight - 500)::numeric / 100);
      new.shipping_cents := v_method.base_cents + v_steps * coalesce(v_method.per_extra_100g_cents, 0);
    end if;
  end if;

  new.total_cents := new.subtotal_cents + new.shipping_cents;
  return new;
end;
$$;

drop trigger if exists orders_guard_buyer_update on public.orders;
create trigger orders_guard_buyer_update
  before update on public.orders
  for each row
  execute function public.orders_guard_buyer_update();

-- order_items and order_events also carry table wide update grants from 0001,
-- but their only update policies are owner only and nothing here adds a buyer
-- policy to them, so the grant stays harmless. Recorded so nobody repeats
-- this mistake on those tables.
