-- SECURITY FIX. Any signed in buyer could make themselves the shop owner.
--
-- `grant update on public.profiles to authenticated` was table wide, and
-- `profiles_update_own_or_owner` only decides WHICH ROW you may touch, never
-- which column. RLS is row level and cannot restrict columns, so
-- `update profiles set role = 'owner' where id = auth.uid()` passed the grant,
-- passed the policy, and passed the check constraint. Verified exploitable
-- before this migration was written, and verified refused after it.

-- Column level grants. Everything a person may legitimately edit about
-- themselves is listed; `role` is deliberately absent, so a direct update of it
-- is refused by the grant regardless of what any policy says.
revoke update on public.profiles from authenticated;
grant update (display_name, email, phone) on public.profiles to authenticated;

-- An audit trail, because a role change is the one edit worth being able to
-- explain six months later.
create table if not exists public.role_changes (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references auth.users on delete cascade,
  actor_id uuid references auth.users on delete set null,
  from_role text,
  to_role text not null,
  created_at timestamptz default now()
);

alter table public.role_changes enable row level security;

drop policy if exists role_changes_select_owner on public.role_changes;
create policy role_changes_select_owner on public.role_changes
  for select using (public.is_owner());

-- No insert, update or delete policy and no grant: rows are written only by
-- set_user_role below, which runs as definer. The trail cannot be edited by
-- anyone through the API, including an owner.

create index if not exists role_changes_subject_idx
  on public.role_changes (subject_id, created_at desc);

-- The only supported way to change a role.
create or replace function public.set_user_role(p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_from  text;
  v_owners int;
begin
  if not public.is_owner() then
    raise exception 'Only the shop owner can change what someone is allowed to do.'
      using errcode = '42501';
  end if;

  if p_role not in ('customer', 'owner') then
    raise exception 'Unknown role.' using errcode = '22023';
  end if;

  select role into v_from from public.profiles where id = p_user_id;
  if v_from is null then
    raise exception 'No such person.' using errcode = 'P0002';
  end if;

  -- Nothing to do, and writing an audit row for it would be noise.
  if v_from = p_role then
    return;
  end if;

  -- Locking the shop out of its own admin is not recoverable through the UI,
  -- so the last owner cannot be demoted, including by themselves.
  if v_from = 'owner' and p_role <> 'owner' then
    select count(*) into v_owners from public.profiles where role = 'owner';
    if v_owners <= 1 then
      raise exception 'That is the only owner left. Make someone else an owner first.'
        using errcode = '23514';
    end if;
  end if;

  update public.profiles set role = p_role where id = p_user_id;

  insert into public.role_changes (subject_id, actor_id, from_role, to_role)
  values (p_user_id, v_actor, v_from, p_role);
end;
$$;

revoke all on function public.set_user_role(uuid, text) from public;
grant execute on function public.set_user_role(uuid, text) to authenticated;
