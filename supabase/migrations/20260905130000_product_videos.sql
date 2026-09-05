-- Videos on a product. They share the list with the photos, one row per file
-- in product_images, so the owner orders them together and the gallery shows
-- them in that order.
alter table public.product_images
  add column if not exists kind text not null default 'image'
  check (kind in ('image', 'video'));

-- A video can never be first. The card in the shop shows whatever is first
-- and a card does not play video, and create_order copies the first row's
-- path onto the order line as its picture. The form refuses this with a
-- sentence; this is the backstop for every other path to the table.
create or replace function public.product_images_guard_first()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.kind = 'video' and coalesce(new.position, 0) = 0 then
    raise exception 'A video cannot be the first thing on a product. Put a photo first.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists product_images_guard_first on public.product_images;
create trigger product_images_guard_first
  before insert or update on public.product_images
  for each row execute function public.product_images_guard_first();

-- Their own bucket. The photo bucket is capped at 10 MB and images only, and
-- neither suits a phone video. 50 MB is the ceiling for any upload on this
-- plan, so that is the limit here too.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-videos', 'product-videos', true, 52428800, array['video/*'])
on conflict (id) do nothing;

drop policy if exists "product_videos_public_read" on storage.objects;
create policy "product_videos_public_read" on storage.objects
  for select using (bucket_id = 'product-videos');

drop policy if exists "product_videos_owner_insert" on storage.objects;
create policy "product_videos_owner_insert" on storage.objects
  for insert with check (bucket_id = 'product-videos' and public.is_owner());

drop policy if exists "product_videos_owner_update" on storage.objects;
create policy "product_videos_owner_update" on storage.objects
  for update using (bucket_id = 'product-videos' and public.is_owner())
  with check (bucket_id = 'product-videos' and public.is_owner());

drop policy if exists "product_videos_owner_delete" on storage.objects;
create policy "product_videos_owner_delete" on storage.objects
  for delete using (bucket_id = 'product-videos' and public.is_owner());
