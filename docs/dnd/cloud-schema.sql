-- PREPARED ONLY. Supabase reconnection and the owner's auth identity are required.
-- Provision in a dedicated/approved project. No new user can claim Bob through this schema.
begin;
create table public.dnd_characters (
  id text primary key check (id = 'bob'),
  owner_id uuid not null references auth.users(id),
  data jsonb not null check (jsonb_typeof(data) = 'object' and octet_length(data::text) < 1000000 and data->>'schemaVersion' = '1'),
  version bigint not null default 1,
  updated_at timestamptz not null default now()
);
alter table public.dnd_characters enable row level security;
revoke all on public.dnd_characters from anon, authenticated;
grant select (id, data, version, updated_at) on public.dnd_characters to anon;
grant select on public.dnd_characters to authenticated;
grant update (data) on public.dnd_characters to authenticated;
create policy "Bob is publicly readable" on public.dnd_characters for select to anon, authenticated using (id = 'bob');
create policy "Only Bob owner can edit" on public.dnd_characters for update to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create function public.dnd_revision() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.version := old.version + 1;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.dnd_revision() from public, anon, authenticated;
create trigger dnd_revision before update on public.dnd_characters for each row execute function public.dnd_revision();
commit;
-- Then seed id='bob', owner_id=<verified auth.users UUID>, data=<validated seed JSON>.
-- Verify anonymous reads, rejected anonymous writes, rejected non-owner writes,
-- successful owner writes, and a stale-version update returning zero rows.
