-- Conversations already tell the owner what is unread; orders did not. A new
-- order arriving is the other thing worth a badge, so it gets the same flag,
-- defaulting to unread because an order nobody has opened yet is exactly that.
--
-- No change needed to orders_guard_buyer_update: the owner is exempt from it
-- outright, and a buyer changing this column is caught by the existing
-- forbidden column list, which is the behaviour we want.
alter table public.orders
  add column if not exists unread_for_owner boolean not null default true;

create index if not exists orders_unread_for_owner_idx
  on public.orders (unread_for_owner)
  where unread_for_owner;
