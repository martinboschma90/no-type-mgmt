# Supabase

Migrations live in `migrations/`.

## Phase 2.2 — seed artists (one-time)

Upserts the local CMS seed (`src/data/artists.ts` + `artistDetails.ts` + art direction) into `public.artists` by **slug**. Never deletes.

1. Add service role key to `.env.local` (Dashboard → Settings → API → `service_role`):

```
SUPABASE_SERVICE_ROLE_KEY=eyJ…
```

2. Preview:

```bash
npm run seed:artists:dry
```

3. Upsert:

```bash
npm run seed:artists
```

Expected: 12 rows upserted; public site (Phase 2.1) reads them when present.

## Phase 3.1 — temporary anon artist writes

Run `migrations/20260729103000_phase3_1_temp_anon_artist_writes.sql` in the SQL Editor
so the CMS can insert/update/delete artists with the anon key **before** auth lands.

Remove those policies in Phase 5 when `/cms` requires login.
