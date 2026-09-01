-- Phase 3.1 — temporary anon policies for CMS artist writes
-- Auth UI is not wired yet; the browser anon key must be able to manage artists.
-- REMOVE these policies in Phase 5 when /cms requires login.

-- Allow CMS to load hidden artists (visible = false) before auth lands.
drop policy if exists "Temp anon can read all artists" on public.artists;
create policy "Temp anon can read all artists"
  on public.artists
  for select
  to anon
  using (true);

drop policy if exists "Temp anon can insert artists" on public.artists;
create policy "Temp anon can insert artists"
  on public.artists
  for insert
  to anon
  with check (true);

drop policy if exists "Temp anon can update artists" on public.artists;
create policy "Temp anon can update artists"
  on public.artists
  for update
  to anon
  using (true)
  with check (true);

drop policy if exists "Temp anon can delete artists" on public.artists;
create policy "Temp anon can delete artists"
  on public.artists
  for delete
  to anon
  using (true);
