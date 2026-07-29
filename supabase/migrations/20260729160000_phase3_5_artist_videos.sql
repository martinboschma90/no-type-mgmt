-- Phase 3.5 — artist video reels (multiple 9:16 videos)
-- Adds `videos` jsonb. Keeps `video_url` for backward compatibility.

alter table public.artists
  add column if not exists videos jsonb;

update public.artists
set videos = '[]'::jsonb
where videos is null;

alter table public.artists
  alter column videos set default '[]'::jsonb;

alter table public.artists
  alter column videos set not null;

-- Backfill single legacy video into the collection (once)
update public.artists
set videos = jsonb_build_array(
  jsonb_build_object(
    'id', gen_random_uuid()::text,
    'videoUrl', video_url,
    'posterUrl', coalesce(nullif(image_url, ''), '')
  )
)
where video_url is not null
  and btrim(video_url) <> ''
  and (
    videos = '[]'::jsonb
    or videos is null
  );
