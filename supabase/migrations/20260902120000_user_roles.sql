-- CMS roles: admin, editor, viewer. First authenticated user becomes admin.

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  display_name text not null default '',
  role text not null check (role in ('admin', 'editor', 'viewer')),
  status text not null default 'invited' check (status in ('active', 'invited')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists user_roles_set_updated_at on public.user_roles;
create trigger user_roles_set_updated_at
  before update on public.user_roles
  for each row
  execute function public.set_updated_at();

alter table public.user_roles enable row level security;

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

create or replace function public.cms_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select role
      from public.user_roles
      where user_id = auth.uid()
      limit 1
    ),
    'viewer'
  );
$$;

create or replace function public.cms_is_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.cms_role() in ('admin', 'editor');
$$;

create or replace function public.cms_ensure_role()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_role text;
  total int;
  user_email text;
begin
  if auth.uid() is null then
    return 'viewer';
  end if;

  user_email := coalesce(auth.jwt() ->> 'email', '');

  select role into current_role
  from public.user_roles
  where user_id = auth.uid();

  if current_role is not null then
    update public.user_roles
    set
      status = 'active',
      email = case when email = '' then user_email else email end
    where user_id = auth.uid();
    return current_role;
  end if;

  select count(*) into total from public.user_roles;
  if total = 0 then
    insert into public.user_roles (user_id, email, display_name, role, status)
    values (
      auth.uid(),
      user_email,
      coalesce(auth.jwt() ->> 'email', 'Admin'),
      'admin',
      'active'
    );
    return 'admin';
  end if;

  insert into public.user_roles (user_id, email, display_name, role, status)
  values (
    auth.uid(),
    user_email,
    coalesce(user_email, 'Gebruiker'),
    'viewer',
    'active'
  )
  on conflict (user_id) do nothing;

  return 'viewer';
end;
$$;

grant execute on function public.cms_role() to authenticated, anon;
grant execute on function public.cms_is_editor() to authenticated, anon;
grant execute on function public.cms_ensure_role() to authenticated;

drop policy if exists "Users can read own role" on public.user_roles;
create policy "Users can read own role"
  on public.user_roles
  for select
  to authenticated
  using (user_id = auth.uid() or public.cms_role() = 'admin');

-- Tighten CMS writes: viewers can read, only admin/editor can mutate.
drop policy if exists "Authenticated can insert CMS content" on public.cms_content;
create policy "Editors can insert CMS content"
  on public.cms_content
  for insert
  to authenticated
  with check (public.cms_is_editor());

drop policy if exists "Authenticated can update CMS content" on public.cms_content;
create policy "Editors can update CMS content"
  on public.cms_content
  for update
  to authenticated
  using (public.cms_is_editor())
  with check (public.cms_is_editor());

drop policy if exists "Authenticated can delete CMS content" on public.cms_content;
create policy "Editors can delete CMS content"
  on public.cms_content
  for delete
  to authenticated
  using (public.cms_is_editor());

drop policy if exists "Authenticated can insert CMS artists" on public.cms_artists;
create policy "Editors can insert CMS artists"
  on public.cms_artists
  for insert
  to authenticated
  with check (public.cms_is_editor());

drop policy if exists "Authenticated can update CMS artists" on public.cms_artists;
create policy "Editors can update CMS artists"
  on public.cms_artists
  for update
  to authenticated
  using (public.cms_is_editor())
  with check (public.cms_is_editor());

drop policy if exists "Authenticated can delete CMS artists" on public.cms_artists;
create policy "Editors can delete CMS artists"
  on public.cms_artists
  for delete
  to authenticated
  using (public.cms_is_editor());

drop policy if exists "Authenticated can insert artists" on public.artists;
create policy "Editors can insert artists"
  on public.artists
  for insert
  to authenticated
  with check (public.cms_is_editor());

drop policy if exists "Authenticated can update artists" on public.artists;
create policy "Editors can update artists"
  on public.artists
  for update
  to authenticated
  using (public.cms_is_editor())
  with check (public.cms_is_editor());

drop policy if exists "Authenticated can delete artists" on public.artists;
create policy "Editors can delete artists"
  on public.artists
  for delete
  to authenticated
  using (public.cms_is_editor());

drop policy if exists "Authenticated can insert team members" on public.team_members;
create policy "Editors can insert team members"
  on public.team_members
  for insert
  to authenticated
  with check (public.cms_is_editor());

drop policy if exists "Authenticated can update team members" on public.team_members;
create policy "Editors can update team members"
  on public.team_members
  for update
  to authenticated
  using (public.cms_is_editor())
  with check (public.cms_is_editor());

drop policy if exists "Authenticated can delete team members" on public.team_members;
create policy "Editors can delete team members"
  on public.team_members
  for delete
  to authenticated
  using (public.cms_is_editor());

drop policy if exists "Authenticated can insert site settings" on public.site_settings;
create policy "Editors can insert site settings"
  on public.site_settings
  for insert
  to authenticated
  with check (public.cms_is_editor());

drop policy if exists "Authenticated can update site settings" on public.site_settings;
create policy "Editors can update site settings"
  on public.site_settings
  for update
  to authenticated
  using (public.cms_is_editor())
  with check (public.cms_is_editor());

drop policy if exists "Authenticated can delete site settings" on public.site_settings;
create policy "Editors can delete site settings"
  on public.site_settings
  for delete
  to authenticated
  using (public.cms_is_editor());

drop policy if exists "Authenticated can insert media assets" on public.media_assets;
create policy "Editors can insert media assets"
  on public.media_assets
  for insert
  to authenticated
  with check (public.cms_is_editor());

drop policy if exists "Authenticated can update media assets" on public.media_assets;
create policy "Editors can update media assets"
  on public.media_assets
  for update
  to authenticated
  using (public.cms_is_editor())
  with check (public.cms_is_editor());

drop policy if exists "Authenticated can delete media assets" on public.media_assets;
create policy "Editors can delete media assets"
  on public.media_assets
  for delete
  to authenticated
  using (public.cms_is_editor());

drop policy if exists "Authenticated can upload media" on storage.objects;
create policy "Editors can upload media"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'media' and public.cms_is_editor());

drop policy if exists "Authenticated can update media" on storage.objects;
create policy "Editors can update media"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'media' and public.cms_is_editor())
  with check (bucket_id = 'media' and public.cms_is_editor());

drop policy if exists "Authenticated can delete media" on storage.objects;
create policy "Editors can delete media"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'media' and public.cms_is_editor());
