-- Phase 1: No Type CMS foundation
-- Tables, updated_at trigger, storage bucket, RLS
-- Does not seed or migrate local CMS data.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- artists
-- ---------------------------------------------------------------------------

create table if not exists public.artists (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  genre text,
  bio text,
  image_url text,
  image_alt text,
  image_focus text,
  image_focus_x numeric,
  image_focus_y numeric,
  image_scale numeric,
  art_direction_version integer,
  video_url text,
  socials jsonb not null default '[]'::jsonb,
  tracks jsonb not null default '[]'::jsonb,
  sections jsonb not null default '[]'::jsonb,
  presskit_url text,
  visible boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists artists_visible_name_idx
  on public.artists (visible, name);

create index if not exists artists_slug_idx
  on public.artists (slug);

drop trigger if exists artists_set_updated_at on public.artists;
create trigger artists_set_updated_at
  before update on public.artists
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- team_members
-- ---------------------------------------------------------------------------

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists team_members_set_updated_at on public.team_members;
create trigger team_members_set_updated_at
  before update on public.team_members
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- site_settings (single-row content blob matching SiteContent)
-- ---------------------------------------------------------------------------

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- media_assets
-- ---------------------------------------------------------------------------

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('image', 'video')),
  mime_type text not null,
  storage_path text not null unique,
  size bigint not null check (size >= 0),
  width integer,
  height integer,
  duration numeric,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists media_assets_kind_created_idx
  on public.media_assets (kind, created_at desc);

-- ---------------------------------------------------------------------------
-- Storage bucket: media
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  104857600, -- 100 MB
  array[
    'image/webp',
    'image/jpeg',
    'image/png',
    'image/gif',
    'video/webm',
    'video/mp4'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Row Level Security — tables
-- ---------------------------------------------------------------------------

alter table public.artists enable row level security;
alter table public.team_members enable row level security;
alter table public.site_settings enable row level security;
alter table public.media_assets enable row level security;

-- artists: public reads only visible rows; auth manages all
drop policy if exists "Public can read visible artists" on public.artists;
create policy "Public can read visible artists"
  on public.artists
  for select
  to anon, authenticated
  using (visible = true);

drop policy if exists "Authenticated can read all artists" on public.artists;
create policy "Authenticated can read all artists"
  on public.artists
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated can insert artists" on public.artists;
create policy "Authenticated can insert artists"
  on public.artists
  for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated can update artists" on public.artists;
create policy "Authenticated can update artists"
  on public.artists
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated can delete artists" on public.artists;
create policy "Authenticated can delete artists"
  on public.artists
  for delete
  to authenticated
  using (true);

-- team_members: public read all; auth manage
drop policy if exists "Public can read team members" on public.team_members;
create policy "Public can read team members"
  on public.team_members
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Authenticated can insert team members" on public.team_members;
create policy "Authenticated can insert team members"
  on public.team_members
  for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated can update team members" on public.team_members;
create policy "Authenticated can update team members"
  on public.team_members
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated can delete team members" on public.team_members;
create policy "Authenticated can delete team members"
  on public.team_members
  for delete
  to authenticated
  using (true);

-- site_settings: public read; auth manage
drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
  on public.site_settings
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Authenticated can insert site settings" on public.site_settings;
create policy "Authenticated can insert site settings"
  on public.site_settings
  for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated can update site settings" on public.site_settings;
create policy "Authenticated can update site settings"
  on public.site_settings
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated can delete site settings" on public.site_settings;
create policy "Authenticated can delete site settings"
  on public.site_settings
  for delete
  to authenticated
  using (true);

-- media_assets: public read metadata; auth manage
drop policy if exists "Public can read media assets" on public.media_assets;
create policy "Public can read media assets"
  on public.media_assets
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Authenticated can insert media assets" on public.media_assets;
create policy "Authenticated can insert media assets"
  on public.media_assets
  for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated can update media assets" on public.media_assets;
create policy "Authenticated can update media assets"
  on public.media_assets
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated can delete media assets" on public.media_assets;
create policy "Authenticated can delete media assets"
  on public.media_assets
  for delete
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Storage RLS — bucket: media
-- ---------------------------------------------------------------------------

drop policy if exists "Public can read media bucket" on storage.objects;
create policy "Public can read media bucket"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'media');

drop policy if exists "Authenticated can upload media" on storage.objects;
create policy "Authenticated can upload media"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'media');

drop policy if exists "Authenticated can update media" on storage.objects;
create policy "Authenticated can update media"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'media')
  with check (bucket_id = 'media');

drop policy if exists "Authenticated can delete media" on storage.objects;
create policy "Authenticated can delete media"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'media');
