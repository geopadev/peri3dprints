-- A conversation can now belong to an order. That is the whole point of the
-- changed payment plan: the order is discussed, paid for and addressed inside
-- the thread, so the thread has to know which order it is about.
alter table public.conversations
  add column if not exists order_id uuid references public.orders on delete set null;

create index if not exists conversations_order_id_idx
  on public.conversations (order_id);

-- 'general' and 'custom_request' were the only kinds. A chat opened from a
-- product page and a chat opened by asking to buy are neither.
alter type public.convo_kind add value if not exists 'product';
alter type public.convo_kind add value if not exists 'order';

-- Canned replies the owner edits in settings. Three defaults, written the way
-- he would say them at the stall.
alter table public.settings
  add column if not exists canned_replies jsonb not null default
    '["Thanks for the message, I will get back to you today.",
      "That one is made to order, ready in about 3 days.",
      "I can print it in a different colour, tell me which one you want."]'::jsonb;
