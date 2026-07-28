# No Type Management

Premium artist management website — frontend only.

## Stack

- React + TypeScript
- Vite
- Tailwind CSS v4
- Framer Motion
- React Router

## Develop

```bash
npm install
cp .env.example .env.local   # optional — Phase 1 Supabase foundation
npm run dev
```

Local CMS (`/cms`) still uses browser `localStorage` + IndexedDB.  
Supabase is foundation-only until Phase 2 (see `supabase/`).

## Supabase (Phase 1)

Infra only — client, schema migration, storage bucket, RLS, auth helpers.  
Not wired to the CMS yet.

1. Create a project at [supabase.com](https://supabase.com)
2. Copy `.env.example` → `.env.local` and set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
3. Run SQL in `supabase/migrations/20260728120000_phase1_foundation.sql` (SQL Editor or CLI)
4. Auth → create an admin user (for later CMS login)
5. Confirm Storage bucket `media` exists and is public

## Structure

```
src/
  components/
    layout/     # AppShell, Navbar, Menu, Footer
    hero/       # Hero, graphic, pixel accents
    artists/    # Cards, grid/list, detail hero, player
    about/      # About / Contact / Legal / Team
    ui/         # Brand primitives
  data/         # Artists + site content (CMS-ready)
  pages/        # HomePage, ArtistPage
  types/        # Shared types
```

Routes:
- `/` — home (hero + artist roster)
- `/artists/:slug` — artist detail
- `/about` — about, legal, team
- `/contact` — contact

Artist data: `src/data/artists.ts` (max 12 on site) + `src/data/artistDetails.ts`  
Site copy/contact: `src/data/site.ts`  
Brand assets: `public/brand/` (from official `notype_geel-1.ai`)
