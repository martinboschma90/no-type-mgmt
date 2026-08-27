import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react'
import { Link, Navigate, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/cms/auth/AuthProvider'
import { useCms } from '@/cms/CmsProvider'
import {
  ARTIST_EDITOR_TABS,
  artistEditorPath,
  artistEditorTabFromSearch,
  isArtistEditorTabActive,
} from '@/cms/artistEditorTabs'
import { artistSlugFromPath, isArtistsIndexPath } from '@/cms/artistSlug'
import { getArtistStatus, sortArtistsByName } from '@/cms/artistVisibility'
import type { CmsPanelProps } from '@/cms/panels/types'
import { RouteFallback } from '@/components/ui/RouteFallback'
import { useMedia } from '@/cms/media/MediaProvider'
import { countUnsyncedMediaUrls } from '@/cms/media/migrateLocalMedia'
import { CMS_PREVIEW_OPEN_KEY } from '@/cms/storageKeys'
import { storageGet, storageSet } from '@/lib/safeStorage'

const CmsHomePanel = lazy(() => import('@/cms/panels/home'))
const CmsAboutPanel = lazy(() => import('@/cms/panels/about'))
const CmsContactPanel = lazy(() => import('@/cms/panels/contact'))
const CmsBookingPanel = lazy(() => import('@/cms/panels/booking'))
const CmsFaqPanel = lazy(() => import('@/cms/panels/faq'))
const CmsFooterPanel = lazy(() => import('@/cms/panels/footer'))
const CmsRosterPanel = lazy(() => import('@/cms/panels/roster'))
const CmsArtistsIndexPanel = lazy(() => import('@/cms/panels/artistsIndex'))
const CmsArtistDetailPanel = lazy(() => import('@/cms/panels/artistDetail'))
const CmsMediaPanel = lazy(() => import('@/cms/panels/media'))
const CmsSettingsPanel = lazy(() => import('@/cms/panels/settings'))

const siteTabs = [
  { to: '/cms/home', label: 'Home' },
  { to: '/cms/about', label: 'About' },
  { to: '/cms/contact', label: 'Contact' },
  { to: '/cms/booking', label: 'Booking' },
  { to: '/cms/faq', label: 'FAQ' },
  { to: '/cms/footer', label: 'Footer' },
  { to: '/cms/roster', label: 'Roster' },
] as const

const cmsTabActive = 'bg-brand text-[#111111]'
const cmsTabIdle = 'text-ink/70 hover:bg-ink/8 hover:text-ink'

function useCmsPanels(): {
  mode: 'pages' | 'artists' | 'media' | 'settings'
  title: string
  subtitle: string
  Page: ComponentType<CmsPanelProps>
} {
  const { pathname } = useLocation()
  const { getArtistBySlug, content } = useCms()
  const artistSlug = artistSlugFromPath(pathname)

  if (pathname.startsWith('/cms/settings')) {
    return {
      mode: 'settings',
      title: 'Instellingen',
      subtitle: 'Account · danger zone',
      Page: CmsSettingsPanel,
    }
  }

  if (pathname.startsWith('/cms/media')) {
    return {
      mode: 'media',
      title: 'Media',
      subtitle: 'Upload · WebP / WebM',
      Page: CmsMediaPanel,
    }
  }

  if (isArtistsIndexPath(pathname)) {
    return {
      mode: 'artists',
      title: 'Artiesten',
      subtitle: `${content.artists.length} artist pages`,
      Page: CmsArtistsIndexPanel,
    }
  }

  if (artistSlug) {
    const artist = getArtistBySlug(artistSlug)
    return {
      mode: 'artists',
      title: artist?.name ?? 'Artist',
      subtitle: artist ? `/artists/${artist.slug}` : 'Artist detail page',
      Page: CmsArtistDetailPanel,
    }
  }

  if (pathname.startsWith('/cms/about')) {
    return {
      mode: 'pages',
      title: 'About',
      subtitle: 'About · team · social',
      Page: CmsAboutPanel,
    }
  }

  if (pathname.startsWith('/cms/contact')) {
    return {
      mode: 'pages',
      title: 'Contact',
      subtitle: 'Contact channels',
      Page: CmsContactPanel,
    }
  }

  if (pathname.startsWith('/cms/booking')) {
    return {
      mode: 'pages',
      title: 'Booking',
      subtitle: 'Booking request form',
      Page: CmsBookingPanel,
    }
  }

  if (pathname.startsWith('/cms/faq')) {
    return {
      mode: 'pages',
      title: 'FAQ',
      subtitle: 'Promoter FAQ · /faq',
      Page: CmsFaqPanel,
    }
  }

  if (pathname.startsWith('/cms/footer')) {
    return {
      mode: 'pages',
      title: 'Footer',
      subtitle: 'Global footer · all pages',
      Page: CmsFooterPanel,
    }
  }

  if (pathname.startsWith('/cms/roster')) {
    return {
      mode: 'pages',
      title: 'Roster',
      subtitle: 'Homepage artist grid',
      Page: CmsRosterPanel,
    }
  }

  return {
    mode: 'pages',
    title: 'Home',
    subtitle: 'Hero · brand',
    Page: CmsHomePanel,
  }
}

function formatSavedAt(ts: number | null) {
  if (!ts) return 'Nog niet opgeslagen'
  return `Opgeslagen ${new Date(ts).toLocaleString('nl-BE', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

function SidebarHeading({ children }: { children: string }) {
  return (
    <p className="type-label px-2.5 pb-1.5 text-[0.55rem] tracking-[0.16em] text-ink/60 uppercase">
      {children}
    </p>
  )
}

function readPreviewOpen(): boolean {
  const stored = storageGet(CMS_PREVIEW_OPEN_KEY)
  if (stored === '0') return false
  if (stored === '1') return true
  return typeof window !== 'undefined' ? window.innerWidth >= 1280 : true
}

function MediaUnsyncedBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span
      className="ml-1.5 inline-flex min-h-[1.15rem] min-w-[1.15rem] items-center justify-center rounded-full bg-orange-400 px-1 text-[0.6rem] font-medium tracking-normal text-[#111] normal-case"
      title={`${count} unsynced media:// file${count === 1 ? '' : 's'}`}
    >
      {count}
    </span>
  )
}

/** Frame-inspired CMS shell: sidebar · editor · live preview. */
export function CmsLayout() {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const { savedAt, artistSyncError, siteSyncError, content, contentSyncStatus } =
    useCms()
  const { user, authRequired, signOut } = useAuth()
  const { assets } = useMedia()
  const panels = useCmsPanels()
  const artistsActive = pathname.startsWith('/cms/artists')
  const mediaActive = pathname.startsWith('/cms/media')
  const settingsActive = pathname.startsWith('/cms/settings')
  const pagesActive = !artistsActive && !mediaActive && !settingsActive
  const artistSlug = artistSlugFromPath(pathname)
  const editorTab = artistEditorTabFromSearch(
    new URLSearchParams(search).get('tab'),
  )
  const unsyncedMediaCount = countUnsyncedMediaUrls(content)
  const [artistsOpen, setArtistsOpen] = useState(artistsActive)
  const [previewOpen, setPreviewOpen] = useState(readPreviewOpen)

  useEffect(() => {
    if (artistsActive) setArtistsOpen(true)
  }, [artistsActive])

  function togglePreview() {
    setPreviewOpen((open) => {
      const next = !open
      storageSet(CMS_PREVIEW_OPEN_KEY, next ? '1' : '0')
      return next
    })
  }

  if (pathname === '/cms' || pathname === '/cms/') {
    return <Navigate to="/cms/home" replace />
  }

  async function handleLogout() {
    await signOut()
    navigate('/cms/login', { replace: true })
  }

  return (
    <div className="cms-shell flex h-svh overflow-hidden bg-[#ebe8e2] text-ink dark:bg-[#121014]">
      <aside className="hidden min-h-0 w-[220px] shrink-0 flex-col border-r border-ink/8 bg-[var(--body-bg)] md:flex">
        <div className="border-b border-ink/8 px-4 py-5">
          <p className="type-label text-[0.6rem] tracking-[0.18em] text-brand uppercase">
            No Type
          </p>
          <h1 className="type-display m-0 mt-1 text-[1.65rem] leading-none text-ink">CMS</h1>
          <p className="type-body mt-2 text-[0.7rem] text-ink/65">
            {authRequired ? 'Admin · autosave' : 'Local · autosave'}
          </p>
          <p className="mt-2 flex items-center gap-1.5 type-label text-[0.55rem] tracking-[0.12em] text-ink/70 uppercase">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                contentSyncStatus === 'synced' ? 'bg-emerald-500' : 'bg-orange-400'
              }`}
              aria-hidden
            />
            {contentSyncStatus === 'synced' ? 'Synced' : 'Pending'}
          </p>
          {user?.email ? (
            <p
              className="type-body mt-2 truncate text-[0.65rem] text-ink/70"
              title={user.email}
            >
              {user.email}
            </p>
          ) : null}
        </div>

        <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-2" aria-label="CMS">
          <div className="border-b border-ink/12 py-2">
            <SidebarHeading>Pagina&apos;s</SidebarHeading>
            <ul className="space-y-0.5">
              {siteTabs.map((tab) => {
                const active = pathname.startsWith(tab.to)
                return (
                  <li key={tab.to}>
                    <NavLink
                      to={tab.to}
                      className={[
                        'type-label block rounded-lg px-2.5 py-1.5 text-[0.65rem] tracking-[0.12em] uppercase transition-colors',
                        active ? cmsTabActive : cmsTabIdle,
                      ].join(' ')}
                    >
                      {tab.label}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="border-b border-ink/8 py-2">
            <div className="flex items-center gap-0.5">
              <div className="min-w-0 flex-1">
                <SidebarHeading>Artiesten</SidebarHeading>
              </div>
              <span className="type-label mb-1 pr-1 text-[0.55rem] tracking-[0.12em] text-ink/55">
                {content.artists.length}
              </span>
              <button
                type="button"
                className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink/70 transition-colors hover:bg-ink/8 hover:text-ink"
                aria-expanded={artistsOpen}
                aria-label={artistsOpen ? 'Collapse artists' : 'Expand artists'}
                onClick={() => setArtistsOpen((open) => !open)}
              >
                <svg
                  viewBox="0 0 20 20"
                  className={`h-3.5 w-3.5 transition-transform ${artistsOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden
                >
                  <path d="m5 8 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <NavLink
              to="/cms/artists"
              end
              className={[
                'type-label mb-1 block rounded-lg px-2.5 py-1.5 text-[0.65rem] tracking-[0.12em] uppercase transition-colors',
                isArtistsIndexPath(pathname) ? cmsTabActive : cmsTabIdle,
              ].join(' ')}
            >
              Overzicht
            </NavLink>
            {artistsOpen ? (
              <ul className="space-y-0.5">
                {sortArtistsByName(content.artists).map((artist) => {
                  const published = getArtistStatus(artist) === 'published'
                  const href = artistEditorPath(artist.slug, editorTab)
                  const selected = artistSlug === artist.slug
                  return (
                    <li key={artist.id}>
                      <NavLink
                        to={href}
                        title={artist.name}
                        className={[
                          'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[0.75rem] transition-colors',
                          selected
                            ? 'bg-ink/12 text-ink'
                            : 'text-ink/75 hover:bg-ink/8 hover:text-ink',
                        ].join(' ')}
                      >
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                            published ? 'bg-emerald-500' : 'bg-ink/25'
                          }`}
                          title={published ? 'Published' : 'Draft'}
                          aria-label={published ? 'Published' : 'Draft'}
                        />
                        <span className="min-w-0 truncate type-body">{artist.name}</span>
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            ) : null}
          </div>

          <div className="border-b border-ink/8 py-2">
            <SidebarHeading>Media</SidebarHeading>
            <NavLink
              to="/cms/media"
              className={[
                'type-label flex items-center rounded-lg px-2.5 py-2 text-[0.7rem] tracking-[0.12em] uppercase transition-colors',
                mediaActive ? cmsTabActive : cmsTabIdle,
              ].join(' ')}
            >
              Bibliotheek
              <span className="ml-2 text-ink/70">{assets.length}</span>
              <MediaUnsyncedBadge count={unsyncedMediaCount} />
            </NavLink>
          </div>

          <div className="py-2">
            <SidebarHeading>Systeem</SidebarHeading>
            <NavLink
              to="/cms/settings"
              className={[
                'type-label block rounded-lg px-2.5 py-2 text-[0.7rem] tracking-[0.12em] uppercase transition-colors',
                settingsActive ? cmsTabActive : cmsTabIdle,
              ].join(' ')}
            >
              Instellingen
            </NavLink>
          </div>
        </nav>

        <div className="space-y-2 border-t border-ink/8 p-4">
          <a
            href="/"
            className="type-label block rounded-xl bg-brand px-3 py-2.5 text-center text-[0.65rem] tracking-[0.12em] text-[#111111] uppercase transition-opacity hover:opacity-90"
          >
            View site
          </a>
          {authRequired ? (
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="type-label w-full rounded-xl px-3 py-2 text-[0.65rem] tracking-[0.12em] text-ink/65 uppercase transition-colors hover:text-ink"
            >
              Log out
            </button>
          ) : null}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col xl:flex-row">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col border-ink/8 bg-[var(--body-bg)] xl:border-r">
          <div className="shrink-0 border-b border-ink/12 px-4 py-3 sm:px-5">
            {panels.mode === 'pages' ? (
              <>
                <p className="type-headline hidden text-base text-ink md:block">{panels.title}</p>
                <div className="flex gap-1 overflow-x-auto pb-1 md:hidden">
                  {siteTabs.map((tab) => {
                    const active = pathname.startsWith(tab.to)
                    return (
                      <NavLink
                        key={tab.to}
                        to={tab.to}
                        className={[
                          'type-label shrink-0 rounded-full px-3.5 py-2 text-[0.65rem] tracking-[0.12em] uppercase transition-colors',
                          active ? cmsTabActive : cmsTabIdle,
                        ].join(' ')}
                      >
                        {tab.label}
                      </NavLink>
                    )
                  })}
                </div>
              </>
            ) : null}

            {panels.mode === 'artists' && artistSlug ? (
              <div className="space-y-2">
                <Link
                  to="/cms/artists"
                  className="type-label inline-flex text-[0.65rem] tracking-[0.12em] text-ink/70 uppercase transition-colors hover:text-ink"
                >
                  ← Alle artiesten
                </Link>
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {ARTIST_EDITOR_TABS.map((tab) => {
                    const to = artistEditorPath(artistSlug, tab.id)
                    const isActive = isArtistEditorTabActive(
                      tab.id,
                      new URLSearchParams(search).get('tab'),
                    )
                    return (
                      <Link
                        key={tab.id}
                        to={to}
                        aria-current={isActive ? 'page' : undefined}
                        className={[
                          'type-label shrink-0 rounded-full px-3.5 py-2 text-[0.65rem] tracking-[0.12em] uppercase transition-colors',
                          isActive ? cmsTabActive : cmsTabIdle,
                        ].join(' ')}
                      >
                        {tab.label}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ) : null}

            {panels.mode === 'artists' && !artistSlug ? (
              <p className="type-headline text-base text-ink">Artiesten</p>
            ) : null}

            {panels.mode === 'media' ? (
              <p className="type-headline text-base text-ink">Media library</p>
            ) : null}

            {panels.mode === 'settings' ? (
              <p className="type-headline text-base text-ink">Instellingen</p>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="type-label text-[0.55rem] tracking-[0.12em] text-ink/70 uppercase">
                {formatSavedAt(savedAt)}
              </span>
              {artistSyncError ? (
                <span
                  className="type-body max-w-full text-[0.7rem] text-red-500"
                  role="alert"
                  title={artistSyncError}
                >
                  Artist sync: {artistSyncError}
                </span>
              ) : null}
              {siteSyncError ? (
                <span
                  className="type-body max-w-full text-[0.7rem] text-red-500"
                  role="alert"
                  title={siteSyncError}
                >
                  Site sync: {siteSyncError}
                </span>
              ) : null}
              {authRequired ? (
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="type-label text-[0.55rem] tracking-[0.12em] text-ink/70 uppercase transition-colors hover:text-ink md:hidden"
                >
                  Log out
                </button>
              ) : null}
              <button
                type="button"
                onClick={togglePreview}
                aria-pressed={previewOpen}
                className="type-label ml-auto rounded-full border border-ink/20 bg-[var(--cms-surface)] px-3 py-1.5 text-[0.55rem] tracking-[0.12em] text-ink uppercase transition-colors hover:border-ink/35"
              >
                {previewOpen ? 'Verberg preview' : 'Toon preview'}
              </button>
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto border-b border-ink/8 px-3 py-2 md:hidden">
            <NavLink
              to="/cms/home"
              className={() =>
                [
                  'type-label shrink-0 rounded-full px-3 py-1.5 text-[0.6rem] tracking-[0.1em] uppercase',
                  pagesActive ? cmsTabActive : 'bg-ink/8 text-ink/70',
                ].join(' ')
              }
            >
              Pagina&apos;s
            </NavLink>
            <NavLink
              to="/cms/artists"
              className={() =>
                [
                  'type-label shrink-0 rounded-full px-3 py-1.5 text-[0.6rem] tracking-[0.1em] uppercase',
                  artistsActive ? cmsTabActive : 'bg-ink/8 text-ink/70',
                ].join(' ')
              }
            >
              Artiesten
            </NavLink>
            <NavLink
              to="/cms/media"
              className={() =>
                [
                  'type-label shrink-0 rounded-full px-3 py-1.5 text-[0.6rem] tracking-[0.1em] uppercase',
                  mediaActive ? cmsTabActive : 'bg-ink/8 text-ink/70',
                ].join(' ')
              }
            >
              Media
              <MediaUnsyncedBadge count={unsyncedMediaCount} />
            </NavLink>
            <NavLink
              to="/cms/settings"
              className={() =>
                [
                  'type-label shrink-0 rounded-full px-3 py-1.5 text-[0.6rem] tracking-[0.1em] uppercase',
                  settingsActive ? cmsTabActive : 'bg-ink/8 text-ink/70',
                ].join(' ')
              }
            >
              Instellingen
            </NavLink>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            <div className="space-y-3">
              <Suspense fallback={<RouteFallback compact />}>
                <panels.Page slot="editor" />
              </Suspense>
            </div>
          </div>
        </section>

        <section
          className={[
            'min-h-[38vh] min-w-0 flex-col bg-[#ebe8e2] p-4 xl:min-h-0 xl:flex-[1.1] dark:bg-[#151217]',
            previewOpen ? 'flex' : 'hidden',
          ].join(' ')}
        >
          <div className="min-h-0 flex-1">
            <Suspense fallback={<RouteFallback compact />}>
              <panels.Page slot="preview" />
            </Suspense>
          </div>
        </section>
      </div>
    </div>
  )
}
