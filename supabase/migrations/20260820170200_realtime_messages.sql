-- Realtime only carries tables in the supabase_realtime publication. Messages
-- is the only table chat listens to, and the client filters by
-- conversation_id, so a buyer's socket never receives another thread's rows:
-- RLS applies to Realtime change events for postgres_changes.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

alter table public.messages replica identity full;
