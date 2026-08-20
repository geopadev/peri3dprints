-- last_message_at and the two unread flags were maintained by nobody. Doing it
-- in the server action means every future caller has to remember, and one that
-- forgets leaves a thread that never surfaces in the inbox. A trigger cannot
-- forget.
--
-- SECURITY DEFINER with a pinned search_path, same as the other trigger
-- functions here: a buyer inserting a message has to be able to touch the
-- conversation row, and this is the only write it is allowed to make.
create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.conversations
  set last_message_at = now(),
      unread_for_owner = case when new.sender_role = 'buyer' then true
                              else unread_for_owner end,
      unread_for_buyer = case when new.sender_role = 'owner' then true
                              else unread_for_buyer end
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists touch_conversation_on_message on public.messages;
create trigger touch_conversation_on_message
  after insert on public.messages
  for each row
  execute function public.touch_conversation_on_message();
