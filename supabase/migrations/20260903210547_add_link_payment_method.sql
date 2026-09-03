-- A Revolut link is not a card, not cash on delivery and not a bank transfer.
-- Pretending it is one of those makes the orders list lie about how people
-- actually paid. New value only; nothing in this file uses it, because Postgres
-- refuses to use a new enum value in the transaction that added it.
alter type public.payment_method add value if not exists 'link';
