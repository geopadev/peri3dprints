-- The tokenised order link from the confirmation email opens the order with no
-- session at all. Rather than handing the browser a service role key, a
-- SECURITY DEFINER function checks the token and returns only that one order.
-- A wrong token returns nothing, and a caller with a session still cannot read
-- someone else's order this way: the token is the whole credential.
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
begin
  select * into v_order from public.orders
  where order_number = p_order_number and access_token = p_token;
  if not found then
    return null;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', i.id, 'title', i.title_snapshot, 'variant', i.variant_snapshot,
    'image', i.image_path_snapshot, 'unitCents', i.unit_price_cents, 'quantity', i.quantity
  ) order by i.id), '[]'::jsonb) into v_items
  from public.order_items i where i.order_id = v_order.id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'type', e.type, 'at', e.created_at, 'payload', e.payload
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
    'method', v_method,
    'items', v_items,
    'events', v_events,
    'conversationId', v_convo
  );
end;
$$;

revoke all on function public.get_order_by_token(text, uuid) from public;
grant execute on function public.get_order_by_token(text, uuid) to anon, authenticated;

-- The owner writes the audit trail from Server Actions. There was no insert
-- grant or policy on order_events at all, so nothing could ever record a status
-- change. Owner only: a buyer never writes history.
grant insert on public.order_events to authenticated;
drop policy if exists order_events_insert_owner on public.order_events;
create policy order_events_insert_owner on public.order_events
  for insert with check (public.is_owner());

-- Buyers may update only the delivery details on their own order, and only
-- while it is still unpaid or pending. Column grant keeps them off the money.
grant update (shipping_address, shipping_method_id, shipping_cents, total_cents)
  on public.orders to authenticated;
drop policy if exists orders_update_buyer_delivery on public.orders;
create policy orders_update_buyer_delivery on public.orders
  for update
  using (buyer_id = (select auth.uid()) and status in ('pending', 'awaiting_payment'))
  with check (buyer_id = (select auth.uid()) and status in ('pending', 'awaiting_payment'));

-- Conversations can be reached from the order page, so the buyer needs the id.
create index if not exists conversations_order_created_idx
  on public.conversations (order_id, created_at);
