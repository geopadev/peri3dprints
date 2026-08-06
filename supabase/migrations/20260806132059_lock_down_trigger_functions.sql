-- The Supabase security advisor flags generate_order_number() and
-- handle_new_user() as callable directly via PostgREST RPC by anon and
-- authenticated, because CREATE FUNCTION grants EXECUTE to PUBLIC by default.
-- Neither is meant to be called directly: generate_order_number() only runs
-- from the orders_set_order_number trigger, and handle_new_user() only runs
-- from the auth.users insert trigger. Trigger firing does not require the
-- invoking role to hold EXECUTE on the function, so this is a pure tightening.
--
-- is_owner() is deliberately left alone. The app calls it directly via
-- supabase.rpc('is_owner') from middleware and the admin pages, and its grant
-- to anon and authenticated is already explicit in 0001_init.sql.

revoke execute on function public.generate_order_number() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
