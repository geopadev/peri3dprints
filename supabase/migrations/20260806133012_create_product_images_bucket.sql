-- product-images bucket, per SETUP.md section 2: public, 10 MB, images only.
--
-- SETUP.md says to create buckets by hand in the dashboard. Doing it as a
-- migration instead, because the same section warns that dev and prod drifting
-- apart is the thing you will not notice until it bites. A migration keeps them
-- identical and reviewable.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 10485760, array['image/*'])
on conflict (id) do nothing;

-- Anyone may read: the catalogue is public and the bucket is served over the CDN.
drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read" on storage.objects
  for select
  using (bucket_id = 'product-images');

-- Only the owner writes. Same is_owner() gate as the products table itself, so
-- a buyer with an anonymous session cannot push files into the catalogue.
drop policy if exists "product_images_owner_insert" on storage.objects;
create policy "product_images_owner_insert" on storage.objects
  for insert
  with check (bucket_id = 'product-images' and public.is_owner());

drop policy if exists "product_images_owner_update" on storage.objects;
create policy "product_images_owner_update" on storage.objects
  for update
  using (bucket_id = 'product-images' and public.is_owner())
  with check (bucket_id = 'product-images' and public.is_owner());

drop policy if exists "product_images_owner_delete" on storage.objects;
create policy "product_images_owner_delete" on storage.objects
  for delete
  using (bucket_id = 'product-images' and public.is_owner());
