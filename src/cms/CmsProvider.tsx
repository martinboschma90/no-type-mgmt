import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import type { Artist, TeamMember } from '@/types/artist'
import {
  createDefaultContent,
  loadStoredContent,
  persistContent,
  type CmsContent,
  type SiteContent,
} from '@/cms/content'
import { createBlankArtist } from '@/cms/createArtist'
import {
  deleteArtistInSupabase,
  fetchArtistsFromSupabase,
  insertArtistInSupabase,
  updateArtistInSupabase,
} from '@/cms/api/artists'
import { applyArtistStatus } from '@/cms/artistVisibility'
import {
  artistHasLocalMediaRefs,
  LOCAL_MEDIA_PUBLISH_WARNING,
} from '@/cms/artistLocalMedia'
import { ART_DIRECTION_VERSION, withArtDirection } from '@/cms/imageFocus'
import { isSupabaseConfigured } from '@/lib/supabase'

type CmsContextValue = {
  content: CmsContent
  savedAt: number | null
  /** Last artist ↔ Supabase sync error, if any. */
  artistSyncError: string | null
  /** Artist ids with unsaved local edits. */
  dirtyArtistIds: ReadonlySet<string>
  artistSaving: boolean
  setSite: (updater: (site: SiteContent) => SiteContent) => void
  setTeam: (updater: (team: TeamMember[]) => TeamMember[]) => void
  setArtists: (updater: (artists: Artist[]) => Artist[]) => void
  /** Local edit only — does not sync until saveArtist / publish. */
  updateArtist: (slug: string, updater: (artist: Artist) => Artist) => void
  addArtist: (name: string) => Artist
  removeArtist: (slug: string) => void
  /** Persist current artist draft to Supabase (or localStorage fallback). */
  saveArtist: (slug: string) => Promise<{ error: string | null }>
  /** Save + set status published (public). */
  publishArtist: (slug: string) => Promise<{ error: string | null }>
  /** Save + set status draft (hidden from public). */
  unpublishArtist: (slug: string) => Promise<{ error: string | null }>
  resetContent: () => void
  getArtistBySlug: (slug: string) => Artist | undefined
  isArtistDirty: (id: string) => boolean
}

const CmsContext = createContext<CmsContextValue | null>(null)

function initialContent(): CmsContent {
  const defaults = createDefaultContent()
  const stored = loadStoredContent()
  if (!stored) return defaults

  const artists =
    stored.artists.length > 0
      ? stored.artists.map((artist) => withArtDirection(artist))
      : defaults.artists

  return {
    site: stored.site,
    team: stored.team,
    artists,
  }
}

function markDirty(
  set: Dispatch<SetStateAction<Set<string>>>,
  id: string,
) {
  set((prev) => {
    if (prev.has(id)) return prev
    const next = new Set(prev)
    next.add(id)
    return next
  })
}

function clearDirty(
  set: Dispatch<SetStateAction<Set<string>>>,
  id: string,
) {
  set((prev) => {
    if (!prev.has(id)) return prev
    const next = new Set(prev)
    next.delete(id)
    return next
  })
}

export function CmsProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<CmsContent>(initialContent)
  const [savedAt, setSavedAt] = useState<number | null>(() =>
    loadStoredContent() ? Date.now() : null,
  )
  const [artistSyncError, setArtistSyncError] = useState<string | null>(null)
  const [dirtyArtistIds, setDirtyArtistIds] = useState<Set<string>>(
    () => new Set(),
  )
  const [artistSaving, setArtistSaving] = useState(false)

  const contentRef = useRef(content)
  contentRef.current = content
  const artistsHydrated = useRef(false)

  const persistLocal = useCallback((next: CmsContent) => {
    persistContent(next, { persistArtists: !isSupabaseConfigured })
    setSavedAt(Date.now())
  }, [])

  const reportArtistError = useCallback((message: string) => {
    console.error('[cms] artist sync:', message)
    setArtistSyncError(message)
  }, [])

  const clearArtistError = useCallback(() => {
    setArtistSyncError(null)
  }, [])

  const adoptServerArtist = useCallback((server: Artist) => {
    setContent((prev) => {
      const idx = prev.artists.findIndex(
        (a) => a.id === server.id || a.slug === server.slug,
      )
      if (idx === -1) return prev
      const current = prev.artists[idx]
      if (
        current.id === server.id &&
        current.slug === server.slug &&
        current.status === server.status &&
        current.publishedAt === server.publishedAt
      ) {
        return prev
      }
      const artists = prev.artists.map((a, i) =>
        i === idx
          ? {
              ...a,
              id: server.id,
              slug: server.slug,
              status: server.status,
              publishedAt: server.publishedAt,
              visible: server.visible,
            }
          : a,
      )
      return { ...prev, artists }
    })
  }, [])

  const persistArtistNow = useCallback(
    async (artist: Artist): Promise<{ error: string | null; artist: Artist | null }> => {
      if (!isSupabaseConfigured) {
        persistLocal(contentRef.current)
        clearDirty(setDirtyArtistIds, artist.id)
        return { error: null, artist }
      }

      const { artist: server, error } = await updateArtistInSupabase(artist)
      if (error) {
        reportArtistError(error)
        return { error, artist: null }
      }
      clearArtistError()
      setSavedAt(Date.now())
      clearDirty(setDirtyArtistIds, artist.id)
      if (server) adoptServerArtist(server)
      return { error: null, artist: server }
    },
    [adoptServerArtist, clearArtistError, persistLocal, reportArtistError],
  )

  // Site + team (+ artists when Supabase off) → localStorage
  useEffect(() => {
    persistLocal(content)
  }, [content, persistLocal])

  // Hydrate CMS artists from Supabase when available
  useEffect(() => {
    if (!isSupabaseConfigured || artistsHydrated.current) return
    let cancelled = false

    void fetchArtistsFromSupabase().then(({ artists, fromSupabase }) => {
      if (cancelled || !fromSupabase) return
      artistsHydrated.current = true
      setContent((prev) => ({
        ...prev,
        artists: artists.map((artist) => withArtDirection(artist)),
      }))
      setDirtyArtistIds(new Set())
      setSavedAt(Date.now())
    })

    return () => {
      cancelled = true
    }
  }, [])

  // Re-apply campaign seeds when art-direction version bumps
  useEffect(() => {
    setContent((prev) => {
      const nextArtists = prev.artists.map((artist) => withArtDirection(artist))
      const changed = nextArtists.some(
        (artist, i) =>
          artist.imageFocusX !== prev.artists[i]?.imageFocusX ||
          artist.imageFocusY !== prev.artists[i]?.imageFocusY ||
          artist.imageScale !== prev.artists[i]?.imageScale ||
          artist.artDirectionVersion !== prev.artists[i]?.artDirectionVersion,
      )
      return changed ? { ...prev, artists: nextArtists } : prev
    })
  }, [ART_DIRECTION_VERSION])

  const findBySlug = useCallback(
    (slug: string) => contentRef.current.artists.find((a) => a.slug === slug),
    [],
  )

  const saveArtist = useCallback(
    async (slug: string) => {
      const artist = findBySlug(slug)
      if (!artist) return { error: 'Artist not found' }
      setArtistSaving(true)
      const result = await persistArtistNow(artist)
      setArtistSaving(false)
      return { error: result.error }
    },
    [findBySlug, persistArtistNow],
  )

  const publishArtist = useCallback(
    async (slug: string) => {
      const current = findBySlug(slug)
      if (!current) return { error: 'Artist not found' }

      if (artistHasLocalMediaRefs(current)) {
        reportArtistError(LOCAL_MEDIA_PUBLISH_WARNING)
        return { error: LOCAL_MEDIA_PUBLISH_WARNING }
      }

      const published = applyArtistStatus(current, 'published', {
        touchPublishedAt: true,
      })

      setContent((prev) => ({
        ...prev,
        artists: prev.artists.map((a) =>
          a.slug === slug || a.id === current.id ? published : a,
        ),
      }))

      setArtistSaving(true)
      const result = await persistArtistNow(published)
      setArtistSaving(false)
      return { error: result.error }
    },
    [findBySlug, persistArtistNow, reportArtistError],
  )

  const unpublishArtist = useCallback(
    async (slug: string) => {
      const current = findBySlug(slug)
      if (!current) return { error: 'Artist not found' }

      const draft = applyArtistStatus(current, 'draft')

      setContent((prev) => ({
        ...prev,
        artists: prev.artists.map((a) =>
          a.slug === slug || a.id === current.id ? draft : a,
        ),
      }))

      setArtistSaving(true)
      const result = await persistArtistNow(draft)
      setArtistSaving(false)
      return { error: result.error }
    },
    [findBySlug, persistArtistNow],
  )

  const value = useMemo<CmsContextValue>(
    () => ({
      content,
      savedAt,
      artistSyncError,
      dirtyArtistIds,
      artistSaving,
      setSite: (updater) => {
        setContent((prev) => ({ ...prev, site: updater(prev.site) }))
      },
      setTeam: (updater) => {
        setContent((prev) => ({ ...prev, team: updater(prev.team) }))
      },
      setArtists: (updater) => {
        setContent((prev) => {
          const nextArtists = updater(prev.artists)
          const prevById = new Map(prev.artists.map((a) => [a.id, a]))
          for (const artist of nextArtists) {
            const before = prevById.get(artist.id)
            if (!before || before !== artist) {
              markDirty(setDirtyArtistIds, artist.id)
            }
          }
          return { ...prev, artists: nextArtists }
        })
      },
      updateArtist: (slug, updater) => {
        setContent((prev) => {
          let updatedId: string | null = null
          const nextArtists = prev.artists.map((artist) => {
            if (artist.slug !== slug) return artist
            const next = updater(artist)
            updatedId = next.id
            return next
          })
          if (updatedId) {
            markDirty(setDirtyArtistIds, updatedId)
          }
          return { ...prev, artists: nextArtists }
        })
      },
      addArtist: (name) => {
        const created = createBlankArtist(
          name,
          content.artists.map((a) => a.slug),
        )
        setContent((prev) => ({
          ...prev,
          artists: [...prev.artists, created],
        }))
        if (isSupabaseConfigured) {
          void insertArtistInSupabase(created).then(({ artist, error }) => {
            if (error) {
              reportArtistError(error)
              return
            }
            clearArtistError()
            setSavedAt(Date.now())
            clearDirty(setDirtyArtistIds, created.id)
            if (artist && artist.id !== created.id) {
              adoptServerArtist(artist)
            }
          })
        } else {
          clearDirty(setDirtyArtistIds, created.id)
        }
        return created
      },
      removeArtist: (slug) => {
        const existing = contentRef.current.artists.find((a) => a.slug === slug)
        setContent((prev) => ({
          ...prev,
          artists: prev.artists.filter((artist) => artist.slug !== slug),
        }))
        if (existing) {
          clearDirty(setDirtyArtistIds, existing.id)
        }
        if (existing && isSupabaseConfigured) {
          void deleteArtistInSupabase(existing).then(({ error }) => {
            if (error) {
              reportArtistError(error)
              return
            }
            clearArtistError()
            setSavedAt(Date.now())
          })
        }
      },
      saveArtist,
      publishArtist,
      unpublishArtist,
      resetContent: () => {
        const next = createDefaultContent()
        setContent(next)
        persistLocal(next)
        setDirtyArtistIds(new Set())
        setSavedAt(Date.now())
        if (isSupabaseConfigured) {
          for (const artist of next.artists) {
            void updateArtistInSupabase(artist).then(({ error }) => {
              if (error) reportArtistError(error)
              else clearArtistError()
            })
          }
        }
      },
      getArtistBySlug: (slug) => content.artists.find((a) => a.slug === slug),
      isArtistDirty: (id) => dirtyArtistIds.has(id),
    }),
    [
      content,
      savedAt,
      artistSyncError,
      dirtyArtistIds,
      artistSaving,
      persistLocal,
      reportArtistError,
      clearArtistError,
      adoptServerArtist,
      saveArtist,
      publishArtist,
      unpublishArtist,
    ],
  )

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>
}

export function useCms() {
  const ctx = useContext(CmsContext)
  if (!ctx) {
    throw new Error('useCms must be used within CmsProvider')
  }
  return ctx
}
