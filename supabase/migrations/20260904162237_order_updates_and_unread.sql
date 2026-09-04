-- Owner-written updates on an order, and the buyer's unread badge for them.
--
-- The buyer already had a status stepper on their order page but never saw why
-- anything moved, and nothing told them it had. This adds the note the owner
-- types when moving an order along, a flag for "there is something here you
-- have not read", and returns both to the order page.

alter table public.orders
  add column if not exists unread_for_buyer boolean not null default false;

/*
  Opening the order clears the badge, so the flag has to survive an update from
  get_order_by_token below, which runs as definer while auth.uid() is still the
  buyer (or nobody at all, on a tokenised link with no session). The guard
  trigger would otherwise reject it: unread_for_buyer is not one of the
  delivery columns, and the status window check refuses anything once an order
  has moved past awaiting_payment, which is exactly when these updates happen.

  Comparing the whole row minus that one column is what keeps this narrow: it
  lets through an update that changed nothing else, and nothing more.
  updated_at is excluded too, so this holds even if orders_set_updated_at ever
  sorts ahead of this trigger and has already stamped the row.
*/
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

  if new.unread_for_buyer is distinct from old.unread_for_buyer
     and (to_jsonb(new) - 'unread_for_buyer' - 'updated_at')
       = (to_jsonb(old) - 'unread_for_buyer' - 'updated_at') then
    return new;
  end if;

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

/*
  Returns the order behind a tokenised link, and marks it read on the way out.
  The events it returns are built key by key rather than passed through: the
  raw payload carries the owner's user id, which the buyer has no reason to
  receive.
*/
create or replace function public.get_order_by_token(p_order_number text, p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders%rowtype;
  v_items jsonb;
  v_events jsonb;
  v_method jsonb;
  v_convo uuid;
  v_unread boolean;
begin
  select * into v_order from public.orders
  where order_number = p_order_number and access_token = p_token;
  if not found then
    return null;
  end if;

  v_unread := v_order.unread_for_buyer;
  if v_unread then
    update public.orders set unread_for_buyer = false where id = v_order.id;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', i.id, 'title', i.title_snapshot, 'variant', i.variant_snapshot,
    'image', i.image_path_snapshot, 'unitCents', i.unit_price_cents, 'quantity', i.quantity
  ) order by i.id), '[]'::jsonb) into v_items
  from public.order_items i where i.order_id = v_order.id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'type', e.type,
    'at', e.created_at,
    'to', e.payload ->> 'to',
    'note', e.payload ->> 'note',
    'tracking', e.payload ->> 'tracking'
  ) order by e.created_at), '[]'::jsonb) into v_events
  from public.order_events e where e.order_id = v_order.id;

  select jsonb_build_object('code', m.code, 'label', m.label, 'carrier', m.carrier)
  into v_method from public.shipping_methods m where m.id = v_order.shipping_method_id;

  select c.id into v_convo from public.conversations c
  where c.order_id = v_order.id order by c.created_at limit 1;

  return jsonb_build_object(
    'id', v_order.id,
    'orderNumber', v_order.order_number,
    'status', v_order.status,
    'paymentMethod', v_order.payment_method,
    'paymentStatus', v_order.payment_status,
    'fullName', v_order.full_name,
    'email', v_order.email,
    'phone', v_order.phone,
    'shippingAddress', v_order.shipping_address,
    'pickupPoint', v_order.pickup_point,
    'subtotalCents', v_order.subtotal_cents,
    'shippingCents', v_order.shipping_cents,
    'totalCents', v_order.total_cents,
    'trackingNumber', v_order.tracking_number,
    'trackingUrl', v_order.tracking_url,
    'buyerNote', v_order.buyer_note,
    'createdAt', v_order.created_at,
    'unreadForBuyer', v_unread,
    'method', v_method,
    'items', v_items,
    'events', v_events,
    'conversationId', v_convo
  );
end;
$$;

revoke all on function public.get_order_by_token(text, uuid) from public;
grant execute on function public.get_order_by_token(text, uuid) to anon, authenticated;
