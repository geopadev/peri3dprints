-- Reference images for custom requests. Private, five per request, images
-- only, same shape as chat-uploads: files live under {conversation_id}/ and a
-- buyer reaches only the prefix of a conversation that is theirs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('custom-request-uploads', 'custom-request-uploads', false, 5242880, array['image/*'])
on conflict (id) do nothing;

-- The form uploads before the conversation exists, so the prefix is the
-- buyer's own user id, which cannot be forged. Reads still go through the
-- conversation, since reference_paths are copied onto the message.
drop policy if exists "custom_uploads_insert" on storage.objects;
create policy "custom_uploads_insert" on storage.objects for insert
  with check (bucket_id = 'custom-request-uploads'
    and (public.is_owner() or split_part(objects.name, '/', 1) = auth.uid()::text));

drop policy if exists "custom_uploads_read" on storage.objects;
create policy "custom_uploads_read" on storage.objects for select
  using (bucket_id = 'custom-request-uploads'
    and (public.is_owner() or split_part(objects.name, '/', 1) = auth.uid()::text));

-- The buyer writes the structured row for their own request, once.
grant insert on public.custom_request_details to authenticated;
drop policy if exists custom_request_details_insert_own on public.custom_request_details;
create policy custom_request_details_insert_own on public.custom_request_details
  for insert with check (exists (
    select 1 from public.conversations c
    where c.id = conversation_id and c.buyer_id = (select auth.uid())));
