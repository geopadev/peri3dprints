-- convo_status has four values and only two are written today, open and
-- closed. Counting status = 'open' would silently miss awaiting_owner the
-- day something starts setting it. Not closed is what the dashboard means.
drop index if exists public.conversations_awaiting_reply_idx;
create index if not exists conversations_awaiting_reply_idx
  on public.conversations (last_message_at)
  where status <> 'closed' and last_sender_role = 'buyer';
