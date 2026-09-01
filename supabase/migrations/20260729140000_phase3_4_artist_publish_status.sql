-- Phase 3.4 — artist draft / publish workflow
-- Adds status + published_at. Keeps `visible` in sync for existing RLS.

alter table public.artists
  add column if not exists status text;

alter table public.artists
  add column if not exists published_at timestamptz;

-- Backfill from legacy visible flag
update public.artists
set
  status = case when visible then 'published' else 'draft' end,
  published_at = case
    when visible then coalesce(published_at, updated_at, created_at)
    else published_at
  end
where status is null;

alter table public.artists
  alter column status set default 'draft';

update public.artists set status = 'draft' where status is null;

alter table public.artists
  alter column status set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'artists_status_check'
  ) then
    alter table public.artists
      add constraint artists_status_check
      check (status in ('draft', 'published'));
  end if;
end $$;

create index if not exists artists_status_visible_idx
  on public.artists (status, visible);
