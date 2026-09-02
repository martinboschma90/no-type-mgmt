-- Compact booking-form stats for the CMS dashboard (artist + country counts).

create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  submitted_at timestamptz not null default timezone('utc', now()),
  country text not null default '',
  artists jsonb not null default '[]'::jsonb
);

create index if not exists booking_requests_submitted_at_idx
  on public.booking_requests (submitted_at desc);

alter table public.booking_requests enable row level security;

grant insert on public.booking_requests to anon, authenticated;
grant select on public.booking_requests to authenticated;
grant all on public.booking_requests to service_role;

drop policy if exists "Anyone can submit booking stats" on public.booking_requests;
create policy "Anyone can submit booking stats"
  on public.booking_requests
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "CMS can read booking stats" on public.booking_requests;
create policy "CMS can read booking stats"
  on public.booking_requests
  for select
  to authenticated
  using (true);
