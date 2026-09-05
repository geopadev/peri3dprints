-- A photo can be refitted after upload. The square the shop shows is a crop,
-- and cropping the crop again could only ever zoom in, so the uncropped
-- upload is kept next to it and the square is remade from that. `crop` is
-- where the square sat on the original, so the cropper opens where the owner
-- left it. Both are null for videos, and for photos from before this existed:
-- those get refitted from whatever file they have, which then becomes their
-- original.
alter table public.product_images
  add column if not exists original_path text,
  add column if not exists crop jsonb;
