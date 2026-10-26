-- DESIGN DRAFT ONLY: NOT APPLIED, NOT A RELEASE MIGRATION, NOT LIVE-TESTED.
-- Requires approval of the exact project, owner, grants, policies and private bucket.
-- Deliberately aborts. Adapt and generate a migration with the supported CLI later.
do $$ begin raise exception 'Unapproved health schema draft: do not execute'; end $$;

-- Illustrative record contract. No real records, credentials or owner identity.
begin;
create table public.health_owners (
  user_id uuid primary key references auth.users(id),
  enabled boolean not null default true
);
alter table public.health_owners enable row level security;
revoke all on public.health_owners from public, anon, authenticated;
grant select on public.health_owners to authenticated;
create policy "Owner can inspect own enabled registration" on public.health_owners
  for select to authenticated using (enabled and user_id = (select auth.uid()));
-- No API role may add/enable owners. An administrator must approve the single owner.

create table public.health_meals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.health_owners(user_id),
  original_timestamp text not null,
  occurred_at timestamptz not null,
  eating_day date generated always as ((occurred_at at time zone 'Asia/Shanghai')::date) stored,
  name text not null check (length(name) between 1 and 200),
  status text not null check (status in ('planned','consumed')),
  amount_kind text not null check (amount_kind in ('estimated','measured')),
  portion_grams numeric check (portion_grams > 0 and portion_grams <= 5000),
  calories numeric check (calories >= 0), protein_g numeric check (protein_g >= 0),
  carbs_g numeric check (carbs_g >= 0), fat_g numeric check (fat_g >= 0),
  nutrition_source text not null,
  confidence text not null check (confidence in ('low','medium','high','unknown')),
  source_system text not null, source_message_id text not null,
  photo_sha256 text check (photo_sha256 ~ '^[a-f0-9]{64}$'),
  version bigint not null default 1,
  updated_at timestamptz not null default now(),
  unique(owner_id,source_system,source_message_id), unique(owner_id,photo_sha256)
);
alter table public.health_meals enable row level security;
revoke all on public.health_meals from public, anon, authenticated;
grant select, delete on public.health_meals to authenticated;
grant insert (owner_id,original_timestamp,occurred_at,name,status,amount_kind,portion_grams,calories,protein_g,carbs_g,fat_g,nutrition_source,confidence,source_system,source_message_id,photo_sha256) on public.health_meals to authenticated;
grant update (name,status,amount_kind,portion_grams,calories,protein_g,carbs_g,fat_g,nutrition_source,confidence) on public.health_meals to authenticated;
create policy "Only enabled owner reads meals" on public.health_meals for select to authenticated
  using (owner_id=(select auth.uid()) and exists(select 1 from public.health_owners o where o.user_id=owner_id and o.enabled));
create policy "Only enabled owner inserts own meals" on public.health_meals for insert to authenticated
  with check (owner_id=(select auth.uid()) and exists(select 1 from public.health_owners o where o.user_id=owner_id and o.enabled));
create policy "Only enabled owner updates own meals" on public.health_meals for update to authenticated
  using (owner_id=(select auth.uid()) and exists(select 1 from public.health_owners o where o.user_id=owner_id and o.enabled))
  with check (owner_id=(select auth.uid()) and exists(select 1 from public.health_owners o where o.user_id=owner_id and o.enabled));
create policy "Only enabled owner deletes own meals" on public.health_meals for delete to authenticated
  using (owner_id=(select auth.uid()) and exists(select 1 from public.health_owners o where o.user_id=owner_id and o.enabled));

-- Next implementation must provide audited atomic compare-and-swap updates,
-- revision trigger, import receipts/idempotency conflicts, day completeness,
-- photos with private ownership linkage, measurements and versioned targets.
-- Do not enable UI saves using this incomplete contract.

-- Proposed bucket settings, not an executed operation:
-- id/name: health-photos; public: false; MIME: JPEG/PNG/WebP; size limit: 10 MiB.
-- Each storage.objects policy (SELECT/INSERT/UPDATE/DELETE) must require:
-- bucket_id='health-photos'
-- AND (storage.foldername(name))[1]=(select auth.uid())::text
-- AND exists(select 1 from public.health_owners o
--            where o.user_id=(select auth.uid()) and o.enabled).
-- UPDATE needs both USING and WITH CHECK. Object path/owner cannot be reassigned.
-- Original objects and derived thumbnails require the same private authorization.
-- Policy names, grants and bucket mutation require action-time approval.
rollback;
