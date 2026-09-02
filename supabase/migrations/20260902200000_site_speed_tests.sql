-- Two-weekly PageSpeed history for the CMS dashboard.

create table if not exists public.site_speed_tests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  origin text not null,
  score integer,
  lcp double precision,
  inp double precision,
  cls double precision,
  ttfb double precision,
  source text not null default 'pagespeed',
  optimized_at timestamptz,
  optimize_summary text not null default ''
);

create index if not exists site_speed_tests_created_at_idx
  on public.site_speed_tests (created_at desc);

alter table public.site_speed_tests enable row level security;

grant select, insert, update on public.site_speed_tests to authenticated;
grant all on public.site_speed_tests to service_role;

drop policy if exists "CMS can read speed tests" on public.site_speed_tests;
create policy "CMS can read speed tests"
  on public.site_speed_tests
  for select
  to authenticated
  using (true);

drop policy if exists "CMS can insert speed tests" on public.site_speed_tests;
create policy "CMS can insert speed tests"
  on public.site_speed_tests
  for insert
  to authenticated
  with check (true);

drop policy if exists "CMS can update speed tests" on public.site_speed_tests;
create policy "CMS can update speed tests"
  on public.site_speed_tests
  for update
  to authenticated
  using (true);
