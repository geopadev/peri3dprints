-- Messages carry three shapes now, not one: plain text, a payment link the
-- owner sends, and the delivery details a buyer fills in from inside the
-- conversation. `payload` holds whatever the kind needs; `attachments` stays
-- what it was, a list of uploaded files.
alter table public.messages
  add column if not exists kind text not null default 'text',
  add column if not exists payload jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'messages_kind_check'
  ) then
    alter table public.messages
      add constraint messages_kind_check
      check (kind in ('text', 'payment_link', 'delivery_details'));
  end if;
end $$;

-- chat-uploads, per SETUP.md section 2: private, 5 MB, images only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-uploads', 'chat-uploads', false, 5242880, array['image/*'])
on conflict (id) do nothing;

-- Files live under {conversation_id}/{file}. A buyer reaches only the prefix
-- belonging to a conversation that is theirs; the owner reaches everything.
drop policy if exists "chat_uploads_read" on storage.objects;
create policy "chat_uploads_read" on storage.objects
  for select
  using (
    bucket_id = 'chat-uploads'
    and (
      public.is_owner()
      or exists (
        select 1 from public.conversations c
        where c.id::text = split_part(objects.name, '/', 1)
          and c.buyer_id = auth.uid()
      )
    )
  );

drop policy if exists "chat_uploads_insert" on storage.objects;
create policy "chat_uploads_insert" on storage.objects
  for insert
  with check (
    bucket_id = 'chat-uploads'
    and (
      public.is_owner()
      or exists (
        select 1 from public.conversations c
        where c.id::text = split_part(objects.name, '/', 1)
          and c.buyer_id = auth.uid()
      )
    )
  );

drop policy if exists "chat_uploads_delete" on storage.objects;
create policy "chat_uploads_delete" on storage.objects
  for delete
  using (
    bucket_id = 'chat-uploads'
    and (
      public.is_owner()
      or exists (
        select 1 from public.conversations c
        where c.id::text = split_part(objects.name, '/', 1)
          and c.buyer_id = auth.uid()
      )
    )
  );

-- Only the owner may send a payment link. A buyer pasting a URL is plain text,
-- so a link cannot be dressed up as one the shop sent.
create or replace function public.messages_guard_kind()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.kind = 'payment_link' and not public.is_owner() then
    raise exception 'Only the shop owner can send a payment link.' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists messages_guard_kind on public.messages;
create trigger messages_guard_kind
  before insert on public.messages
  for each row
  execute function public.messages_guard_kind();
