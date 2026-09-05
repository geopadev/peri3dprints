-- The dashboard counted unread conversations and called it "waiting on a
-- reply". Those are different things: opening a thread clears unread, so a
-- message he had read but not answered dropped to zero the moment he looked
-- at it, which is exactly when he still needs reminding. Waiting on a reply
-- means the last word was the buyer's, so record whose it was.
alter table public.conversations
  add column if not exists last_sender_role public.sender_role;

update public.conversations c
set last_sender_role = m.sender_role
from (
  select distinct on (conversation_id) conversation_id, sender_role
  from public.messages
  order by conversation_id, created_at desc
) m
where m.conversation_id = c.id;

create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.conversations
  set last_message_at = now(),
      last_sender_role = new.sender_role,
      unread_for_owner = case when new.sender_role = 'buyer' then true
                              else unread_for_owner end,
      unread_for_buyer = case when new.sender_role = 'owner' then true
                              else unread_for_buyer end
  where id = new.conversation_id;
  return new;
end;
$$;

create index if not exists conversations_awaiting_reply_idx
  on public.conversations (last_message_at)
  where status = 'open' and last_sender_role = 'buyer';
