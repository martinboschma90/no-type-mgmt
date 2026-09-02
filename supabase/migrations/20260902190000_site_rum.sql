-- Real-user metrics for the CMS dashboard (vitals, errors, presence, 404s).

create table if not exists public.site_rum (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  kind text not null,
  name text not null default '',
  value double precision,
  path text not null default '',
  message text not null default '',
  session_id text not null default '',
  city text not null default '',
  country text not null default ''
);

create index if not exists site_rum_created_at_idx
  on public.site_rum (created_at desc);

create index if not exists site_rum_kind_created_idx
  on public.site_rum (kind, created_at desc);

create table if not exists public.site_health_cache (
  cache_key text primary key,
  payload jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default timezone('utc', now())
);

alter table public.site_rum enable row level security;
alter table public.site_health_cache enable row level security;

grant insert on public.site_rum to anon, authenticated;
grant select on public.site_rum to authenticated;
grant all on public.site_rum to service_role;
grant all on public.site_health_cache to service_role;
grant select on public.site_health_cache to authenticated;

drop policy if exists "Anyone can submit site rum" on public.site_rum;
create policy "Anyone can submit site rum"
  on public.site_rum
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "CMS can read site rum" on public.site_rum;
create policy "CMS can read site rum"
  on public.site_rum
  for select
  to authenticated
  using (true);

drop policy if exists "CMS can read health cache" on public.site_health_cache;
create policy "CMS can read health cache"
  on public.site_health_cache
  for select
  to authenticated
  using (true);
