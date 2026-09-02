import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import type { Artist } from '@/types/artist'
import { useAuth } from '@/cms/auth/AuthProvider'
import {
  loadStoredContent,
  loadStoredContentUpdatedAt,
  persistContent,
  type CmsContent,
} from '@/cms/content'
import { createDefaultContent } from '@/cms/defaultCmsContent'
import { createBlankArtist } from '@/cms/createArtist'
import {
  deleteArtistInSupabase,
  insertArtistInSupabase,
  updateArtistInSupabase,
} from '@/cms/api/artists'
import {
  fetchArtistsFromSupabaseCached,
  invalidateArtistsCache,
} from '@/cms/api/artistsCache'
import {
  fetchSiteSettingsFromSupabase,
  upsertSiteSettingsInSupabase,
} from '@/cms/api/site'
import {
  deleteCmsArtist,
  fetchCmsContentBlob,
  pushCmsSnapshot,
  upsertCmsArtist,
} from '@/cms/api/cmsStore'
import {
  fetchTeamMembersFromSupabase,
  replaceTeamMembersInSupabase,
} from '@/cms/api/team'
import { applyArtistStatus } from '@/cms/artistVisibility'
import {
  artistHasLocalMediaRefs,
  LOCAL_MEDIA_PUBLISH_WARNING,
} from '@/cms/artistLocalMedia'
import { ART_DIRECTION_VERSION, withArtDirection } from '@/cms/imageFocus'
import { isSupabaseConfigured } from '@/lib/supabaseEnv'
import { storageSet } from '@/lib/safeStorage'
import {
  PUBLIC_SITE_STORAGE_KEY,
  PUBLIC_TEAM_STORAGE_KEY,
} from '@/cms/storageKeys'
import { useLocation } from 'react-router-dom'
import { mergeRemoteArtists } from '@/cms/dedupeArtists'
import {
  CmsContext,
  type CmsContextValue,
  type ContentSyncStatus,
} from '@/cms/CmsContext'

function initialContent(): CmsContent {
  const defaults = createDefaultContent()
  const stored = loadStoredContent()
  if (!stored) return defaults

  const artists =
    isSupabaseConfigured
      ? []
      : stored.artists.length > 0
      ? stored.artists.map((artist) => withArtDirection(artist))
      : defaults.artists

  return {
    site: stored.site,
    team: stored.team,
    artists,
  }
}

function cachePublicSite(content: CmsContent) {
  storageSet(PUBLIC_SITE_STORAGE_KEY, JSON.stringify(content.site))
}

function cachePublicTeam(content: CmsContent) {
  storageSet(PUBLIC_TEAM_STORAGE_KEY, JSON.stringify(content.team))
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
  const { pathname } = useLocation()
  const isCmsRoute = pathname.startsWith('/cms')
  const { ready: authReady, session, authRequired, canEdit } = useAuth()
  const canWriteRemote = authReady && (!authRequired || Boolean(session))
  const [content, setContent] = useState<CmsContent>(initialContent)
  const [savedAt, setSavedAt] = useState<number | null>(() =>
    loadStoredContent() ? Date.now() : null,
  )
  const [artistSyncError, setArtistSyncError] = useState<string | null>(null)
  const [siteSyncError, setSiteSyncError] = useState<string | null>(null)
  const [dirtyArtistIds, setDirtyArtistIds] = useState<Set<string>>(
    () => new Set(),
  )
  const [artistSaving, setArtistSaving] = useState(false)
  const [contentSyncStatus, setContentSyncStatus] =
    useState<ContentSyncStatus>(
      isSupabaseConfigured ? 'pending' : 'synced',
    )

  const contentRef = useRef(content)
  contentRef.current = content
  const dirtyArtistIdsRef = useRef(dirtyArtistIds)
  dirtyArtistIdsRef.current = dirtyArtistIds
  const artistsHydrated = useRef(false)
  const siteHydrated = useRef(false)
  const cmsStoreHydrated = useRef(false)
  const skipSiteRemoteSync = useRef(false)
  const skipCmsPush = useRef(false)

  const persistLocal = useCallback((next: CmsContent) => {
    persistContent(next)
    if (!isSupabaseConfigured) {
      cachePublicSite(next)
      cachePublicTeam(next)
    }
    setSavedAt(Date.now())
  }, [])

  const reportArtistError = useCallback((message: string) => {
    console.error('[cms] artist sync:', message)
    setArtistSyncError(message)
  }, [])

  const clearArtistError = useCallback(() => {
    setArtistSyncError(null)
  }, [])

  const reportSiteError = useCallback((message: string) => {
    console.error('[cms] site sync:', message)
    setSiteSyncError(message)
  }, [])

  const clearSiteError = useCallback(() => {
    setSiteSyncError(null)
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
      const storeError = await upsertCmsArtist(server ?? artist)
      if (storeError.error) {
        reportArtistError(storeError.error)
        setContentSyncStatus('pending')
      }
      invalidateArtistsCache()
      clearArtistError()
      setSavedAt(Date.now())
      clearDirty(setDirtyArtistIds, artist.id)
      if (server) adoptServerArtist(server)
      return { error: null, artist: server }
    },
    [adoptServerArtist, clearArtistError, persistLocal, reportArtistError],
  )

  // Site + team (+ artists) → localStorage cache
  useEffect(() => {
    persistLocal(content)
  }, [content, persistLocal])

  // JSON store: Supabase first, localStorage cache; newer remote wins
  useEffect(() => {
    if (!isSupabaseConfigured || cmsStoreHydrated.current) return
    if (!canWriteRemote) return
    let cancelled = false

    void (async () => {
      const localTs = loadStoredContentUpdatedAt()
      const [remoteBlob, remoteRoster] = await Promise.all([
        fetchCmsContentBlob(),
        fetchArtistsFromSupabaseCached(),
      ])
      if (cancelled) return

      const remoteTs = remoteBlob?.updatedAt ?? 0
      const hasRemote = Boolean(remoteBlob) || remoteRoster.fromSupabase

      if (hasRemote && remoteTs >= localTs) {
        const remoteList = remoteRoster.fromSupabase
          ? remoteRoster.artists.map((artist) => withArtDirection(artist))
          : []
        const next: CmsContent = {
          site: remoteBlob?.content.site ?? contentRef.current.site,
          team: remoteBlob?.content.team?.length
            ? remoteBlob.content.team
            : contentRef.current.team,
          artists: mergeRemoteArtists(
            contentRef.current.artists,
            remoteList,
            dirtyArtistIdsRef.current,
          ),
        }
        skipCmsPush.current = true
        skipSiteRemoteSync.current = true
        artistsHydrated.current = remoteRoster.fromSupabase
        siteHydrated.current = true
        cmsStoreHydrated.current = true
        setContent(next)
        persistContent(next, { updatedAt: remoteTs || Date.now() })
        setSavedAt(remoteTs || Date.now())
        setContentSyncStatus('synced')
        return
      }

      cmsStoreHydrated.current = true
      const { error, updatedAt } = await pushCmsSnapshot(contentRef.current)
      if (cancelled) return
      if (error) {
        reportSiteError(error)
        setContentSyncStatus('pending')
        return
      }
      skipCmsPush.current = true
      persistContent(contentRef.current, { updatedAt: updatedAt ?? Date.now() })
      setContentSyncStatus('synced')
      clearSiteError()
    })()

    return () => {
      cancelled = true
    }
  }, [canWriteRemote, clearSiteError, reportSiteError])

  useEffect(() => {
    if (!isSupabaseConfigured || !cmsStoreHydrated.current || !canWriteRemote) {
      return
    }
    if (skipCmsPush.current) {
      skipCmsPush.current = false
      return
    }
    setContentSyncStatus('pending')
    const timer = window.setTimeout(() => {
      void pushCmsSnapshot(contentRef.current).then(({ error, updatedAt }) => {
        if (error) {
          reportSiteError(error)
          setContentSyncStatus('pending')
          return
        }
        persistContent(contentRef.current, { updatedAt: updatedAt ?? Date.now() })
        setContentSyncStatus('synced')
        clearSiteError()
        setSavedAt(Date.now())
      })
    }, 700)
    return () => window.clearTimeout(timer)
  }, [
    canWriteRemote,
    content,
    clearSiteError,
    reportSiteError,
  ])

  // Hydrate full artist catalog only in CMS — public pages use slim roster / by-slug.
  useEffect(() => {
    if (!isSupabaseConfigured || artistsHydrated.current || !isCmsRoute) return
    if (!canWriteRemote) return
    let cancelled = false

    void fetchArtistsFromSupabaseCached()
      .then(({ artists, fromSupabase }) => {
        if (cancelled || !fromSupabase) return
        artistsHydrated.current = true
        setContent((prev) => ({
          ...prev,
          artists: mergeRemoteArtists(
            prev.artists,
            artists.map((artist) => withArtDirection(artist)),
            dirtyArtistIdsRef.current,
          ),
        }))
        setSavedAt(Date.now())
      })
      .catch((error) => {
        console.warn('[cms] artist hydrate failed', error)
      })

    return () => {
      cancelled = true
    }
  }, [canWriteRemote, isCmsRoute])

  // Hydrate site + team from Supabase (source of truth when rows exist)
  useEffect(() => {
    if (!isSupabaseConfigured || siteHydrated.current) return
    if (!canWriteRemote) return
    let cancelled = false

    void Promise.all([
      fetchSiteSettingsFromSupabase(),
      fetchTeamMembersFromSupabase(),
    ]).then(([siteResult, teamResult]) => {
      if (cancelled) return
      siteHydrated.current = true

      if (!siteResult.fromSupabase && !teamResult.fromSupabase) {
        const current = contentRef.current
        void upsertSiteSettingsInSupabase(current.site).then(({ error }) => {
          if (error) reportSiteError(error)
          else {
            clearSiteError()
            cachePublicSite(contentRef.current)
          }
        })
        void replaceTeamMembersInSupabase(current.team).then(
          ({ team, error }) => {
            if (error) {
              reportSiteError(error)
              return
            }
            clearSiteError()
            storageSet(PUBLIC_TEAM_STORAGE_KEY, JSON.stringify(team))
            if (team.length) {
              skipSiteRemoteSync.current = true
              setContent((prev) => ({ ...prev, team }))
            }
          },
        )
        return
      }

      skipSiteRemoteSync.current = true
      setContent((prev) => ({
        ...prev,
        site: siteResult.site ?? prev.site,
        team: teamResult.fromSupabase ? teamResult.team : prev.team,
      }))
      if (siteResult.site) {
        storageSet(PUBLIC_SITE_STORAGE_KEY, JSON.stringify(siteResult.site))
      }
      if (teamResult.fromSupabase) {
        storageSet(PUBLIC_TEAM_STORAGE_KEY, JSON.stringify(teamResult.team))
      }
      setSavedAt(Date.now())

      if (siteResult.fromSupabase && !teamResult.fromSupabase) {
        void replaceTeamMembersInSupabase(contentRef.current.team).then(
          ({ team, error }) => {
            if (error) {
              reportSiteError(error)
              return
            }
            clearSiteError()
            storageSet(PUBLIC_TEAM_STORAGE_KEY, JSON.stringify(team))
            if (team.length) {
              skipSiteRemoteSync.current = true
              setContent((prev) => ({ ...prev, team }))
            }
          },
        )
      }

      if (!siteResult.fromSupabase && teamResult.fromSupabase) {
        void upsertSiteSettingsInSupabase(contentRef.current.site).then(
          ({ error }) => {
            if (error) reportSiteError(error)
            else {
              clearSiteError()
              cachePublicSite(contentRef.current)
            }
          },
        )
      }
    })
      .catch((error) => {
        console.warn('[cms] site/team hydrate failed', error)
      })

    return () => {
      cancelled = true
    }
  }, [canWriteRemote, clearSiteError, reportSiteError])

  // Debounced site + team → Supabase
  useEffect(() => {
    if (!isSupabaseConfigured || !siteHydrated.current || !canWriteRemote) return
    if (skipSiteRemoteSync.current) {
      skipSiteRemoteSync.current = false
      return
    }

    const timer = window.setTimeout(() => {
      const { site, team } = contentRef.current
      void upsertSiteSettingsInSupabase(site).then(({ error }) => {
        if (error) reportSiteError(error)
        else {
          clearSiteError()
          cachePublicSite(contentRef.current)
          setSavedAt(Date.now())
        }
      })
      void replaceTeamMembersInSupabase(team).then(({ team: nextTeam, error }) => {
        if (error) {
          reportSiteError(error)
          return
        }
        clearSiteError()
        storageSet(PUBLIC_TEAM_STORAGE_KEY, JSON.stringify(nextTeam))
        setSavedAt(Date.now())
        const sameIds =
          nextTeam.length === team.length &&
          nextTeam.every((member, i) => member.id === team[i]?.id)
        if (!sameIds) {
          skipSiteRemoteSync.current = true
          setContent((prev) => ({ ...prev, team: nextTeam }))
        }
      })
    }, 700)

    return () => window.clearTimeout(timer)
  }, [canWriteRemote, content.site, content.team, clearSiteError, reportSiteError])

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
      if (!canEdit) return { error: 'Geen schrijfrechten.' }
      if (!artist) return { error: 'Artist not found' }
      setArtistSaving(true)
      const result = await persistArtistNow(artist)
      setArtistSaving(false)
      return { error: result.error }
    },
    [canEdit, findBySlug, persistArtistNow],
  )

  const publishArtist = useCallback(
    async (slug: string) => {
      const current = findBySlug(slug)
      if (!canEdit) return { error: 'Geen schrijfrechten.' }
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
    [canEdit, findBySlug, persistArtistNow, reportArtistError],
  )

  const unpublishArtist = useCallback(
    async (slug: string) => {
      const current = findBySlug(slug)
      if (!canEdit) return { error: 'Geen schrijfrechten.' }
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
    [canEdit, findBySlug, persistArtistNow],
  )

  const value = useMemo<CmsContextValue>(
    () => ({
      content,
      savedAt,
      contentSyncStatus,
      artistSyncError,
      siteSyncError,
      dirtyArtistIds,
      artistSaving,
      setSite: (updater) => {
        if (!canEdit) return
        setContent((prev) => ({ ...prev, site: updater(prev.site) }))
      },
      setTeam: (updater) => {
        if (!canEdit) return
        setContent((prev) => ({ ...prev, team: updater(prev.team) }))
      },
      setArtists: (updater) => {
        if (!canEdit) return
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
        if (!canEdit) return
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
        if (!canEdit) {
          return (
            contentRef.current.artists[0] ??
            createBlankArtist(name, contentRef.current.artists.map((a) => a.slug))
          )
        }
        const created = createBlankArtist(
          name,
          contentRef.current.artists.map((a) => a.slug),
        )
        artistsHydrated.current = true
        setContent((prev) => {
          if (prev.artists.some((artist) => artist.slug === created.slug)) {
            return prev
          }
          return {
            ...prev,
            artists: [...prev.artists, created],
          }
        })
        markDirty(setDirtyArtistIds, created.id)
        if (isSupabaseConfigured) {
          void insertArtistInSupabase(created).then(({ artist, error }) => {
            if (error) {
              reportArtistError(error)
              return
            }
            void upsertCmsArtist(artist ?? created)
            invalidateArtistsCache()
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
        if (!canEdit) return
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
            void deleteCmsArtist(existing.slug)
            invalidateArtistsCache()
            clearArtistError()
            setSavedAt(Date.now())
          })
        }
      },
      saveArtist,
      publishArtist,
      unpublishArtist,
      resetContent: () => {
        if (!canEdit) return
        const next = createDefaultContent()
        skipSiteRemoteSync.current = true
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
          void upsertSiteSettingsInSupabase(next.site).then(({ error }) => {
            if (error) reportSiteError(error)
            else {
              clearSiteError()
              cachePublicSite(next)
            }
          })
          void replaceTeamMembersInSupabase(next.team).then(
            ({ team, error }) => {
              if (error) {
                reportSiteError(error)
                return
              }
              clearSiteError()
              storageSet(PUBLIC_TEAM_STORAGE_KEY, JSON.stringify(team))
              skipSiteRemoteSync.current = true
              setContent((prev) => ({ ...prev, team }))
            },
          )
          void pushCmsSnapshot(next).then(({ error, updatedAt }) => {
            if (error) {
              reportSiteError(error)
              setContentSyncStatus('pending')
              return
            }
            persistContent(next, { updatedAt: updatedAt ?? Date.now() })
            setContentSyncStatus('synced')
          })
        }
      },
      getArtistBySlug: (slug) => content.artists.find((a) => a.slug === slug),
      isArtistDirty: (id) => dirtyArtistIds.has(id),
    }),
    [
      content,
      savedAt,
      contentSyncStatus,
      artistSyncError,
      siteSyncError,
      dirtyArtistIds,
      artistSaving,
      canEdit,
      persistLocal,
      reportArtistError,
      clearArtistError,
      reportSiteError,
      clearSiteError,
      adoptServerArtist,
      saveArtist,
      publishArtist,
      unpublishArtist,
    ],
  )

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>
}

export { useCms, CmsContext } from '@/cms/CmsContext'
