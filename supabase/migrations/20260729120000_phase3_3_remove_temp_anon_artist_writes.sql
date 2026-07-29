-- Phase 3.3 — Auth is live in the CMS UI.
-- After verifying admin login works, remove temporary anon artist write policies
-- from 20260729103000_phase3_1_temp_anon_artist_writes.sql so only authenticated
-- users can mutate artists (matches Phase 1 RLS).
--
-- Run this ONLY after at least one admin user exists in Auth → Users
-- and you have confirmed /cms/login works.

drop policy if exists "Temp anon can read all artists" on public.artists;
drop policy if exists "Temp anon can insert artists" on public.artists;
drop policy if exists "Temp anon can update artists" on public.artists;
drop policy if exists "Temp anon can delete artists" on public.artists;

-- Public read of visible artists (Phase 1) remains:
--   "Public can read visible artists"
-- Authenticated CMS CRUD (Phase 1) remains:
--   "Authenticated can read all artists"
--   "Authenticated can insert/update/delete artists"
