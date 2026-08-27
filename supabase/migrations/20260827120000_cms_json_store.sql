-- CMS JSON store: localStorage-shaped content + per-artist blobs
-- Keys stay `notype-cms-content-v1` and `notype-public-artists-v3` in `cms_content.key`.

create table if not exists public.cms_content (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.cms_artists (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists cms_content_set_updated_at on public.cms_content;
create trigger cms_content_set_updated_at
  before update on public.cms_content
  for each row
  execute function public.set_updated_at();

drop trigger if exists cms_artists_set_updated_at on public.cms_artists;
create trigger cms_artists_set_updated_at
  before update on public.cms_artists
  for each row
  execute function public.set_updated_at();

alter table public.cms_content enable row level security;
alter table public.cms_artists enable row level security;

grant select on public.cms_content to anon, authenticated;
grant insert, update, delete on public.cms_content to authenticated;
grant all on public.cms_content to service_role;
grant select on public.cms_artists to anon, authenticated;
grant insert, update, delete on public.cms_artists to authenticated;
grant all on public.cms_artists to service_role;

drop policy if exists "Public can read public CMS cache" on public.cms_content;
create policy "Public can read public CMS cache"
  on public.cms_content
  for select
  to anon, authenticated
  using (
    key in (
      'notype-public-artists-v2',
      'notype-public-artists-v3'
    )
  );

drop policy if exists "Authenticated can read all CMS content" on public.cms_content;
create policy "Authenticated can read all CMS content"
  on public.cms_content
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated can insert CMS content" on public.cms_content;
create policy "Authenticated can insert CMS content"
  on public.cms_content
  for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated can update CMS content" on public.cms_content;
create policy "Authenticated can update CMS content"
  on public.cms_content
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated can delete CMS content" on public.cms_content;
create policy "Authenticated can delete CMS content"
  on public.cms_content
  for delete
  to authenticated
  using (true);

drop policy if exists "Public can read published CMS artists" on public.cms_artists;
create policy "Public can read published CMS artists"
  on public.cms_artists
  for select
  to anon, authenticated
  using (coalesce(data->>'status', 'published') = 'published');

drop policy if exists "Authenticated can read all CMS artists" on public.cms_artists;
create policy "Authenticated can read all CMS artists"
  on public.cms_artists
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated can insert CMS artists" on public.cms_artists;
create policy "Authenticated can insert CMS artists"
  on public.cms_artists
  for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated can update CMS artists" on public.cms_artists;
create policy "Authenticated can update CMS artists"
  on public.cms_artists
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated can delete CMS artists" on public.cms_artists;
create policy "Authenticated can delete CMS artists"
  on public.cms_artists
  for delete
  to authenticated
  using (true);
