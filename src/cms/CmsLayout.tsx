import { lazy, Suspense, useCallback, useEffect, useState, type ComponentType } from 'react'
import { Link, Navigate, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  Moon,
  Search,
  Settings,
  Sun,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '@/cms/auth/AuthProvider'
import { useCms } from '@/cms/CmsProvider'
import {
  ARTIST_EDITOR_TABS,
  artistEditorPath,
  isArtistEditorTabActive,
} from '@/cms/artistEditorTabs'
import { artistSlugFromPath, isArtistsIndexPath } from '@/cms/artistSlug'
import {
  FlowMatesCommandPalette,
  useFlowMatesSearchHotkey,
} from '@/cms/flow-mates/CommandPalette'
import { EditorPreviewLayout } from '@/cms/flow-mates/EditorPreviewLayout'
import { EditorTopBar } from '@/cms/flow-mates/EditorTopBar'
import { DashboardHome } from '@/cms/flow-mates/Dashboard'
import { EditorAccordionScope } from '@/cms/flow-mates/EditorAccordionScope'
import { useCmsTheme } from '@/cms/flow-mates/CmsTheme'
import { isPagesWorkspacePath, PagesTabBar } from '@/cms/flow-mates/PagesTabBar'
import type { CmsPanelProps } from '@/cms/panels/types'
import { RouteFallback } from '@/components/ui/RouteFallback'

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

const NAV = [
  { to: '/cms/dashboard', label: 'Dashboard', icon: LayoutDashboard, match: 'dashboard' as const },
  { to: '/cms/home', label: "Pagina's", icon: FileText, match: 'pages' as const },
  { to: '/cms/artists', label: 'Artiesten', icon: Users, match: 'artists' as const },
  { to: '/cms/media', label: 'Media', icon: FolderOpen, match: 'media' as const },
  { to: '/cms/settings', label: 'Instellingen', icon: Settings, match: 'settings' as const },
]

function useCmsPanels(): {
  mode: 'dashboard' | 'pages' | 'artists' | 'media' | 'settings'
  title: string
  subtitle: string
  Page: ComponentType<CmsPanelProps> | null
} {
  const { pathname } = useLocation()
  const { getArtistBySlug, content } = useCms()
  const artistSlug = artistSlugFromPath(pathname)

  if (pathname.startsWith('/cms/dashboard') || pathname === '/cms' || pathname === '/cms/') {
    return {
      mode: 'dashboard',
      title: 'Dashboard',
      subtitle: 'Notype · Flow Mates CMS',
      Page: null,
    }
  }
  if (pathname.startsWith('/cms/settings')) {
    return {
      mode: 'settings',
      title: 'Instellingen',
      subtitle: 'Account · gevaarzone',
      Page: CmsSettingsPanel,
    }
  }
  if (pathname.startsWith('/cms/media')) {
    return {
      mode: 'media',
      title: 'Media',
      subtitle: 'Upload wordt WebP / WebM',
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
    return { mode: 'pages', title: 'About', subtitle: 'About · team · social', Page: CmsAboutPanel }
  }
  if (pathname.startsWith('/cms/contact')) {
    return { mode: 'pages', title: 'Contact', subtitle: 'Contactkanalen', Page: CmsContactPanel }
  }
  if (pathname.startsWith('/cms/booking')) {
    return { mode: 'pages', title: 'Booking', subtitle: 'Booking request', Page: CmsBookingPanel }
  }
  if (pathname.startsWith('/cms/faq')) {
    return { mode: 'pages', title: 'FAQ', subtitle: 'Promoter FAQ', Page: CmsFaqPanel }
  }
  if (pathname.startsWith('/cms/footer')) {
    return { mode: 'pages', title: 'Footer', subtitle: 'Globale footer', Page: CmsFooterPanel }
  }
  if (pathname.startsWith('/cms/roster')) {
    return { mode: 'pages', title: 'Roster', subtitle: 'Homepage artist grid', Page: CmsRosterPanel }
  }
  return { mode: 'pages', title: 'Home', subtitle: 'Hero · brand', Page: CmsHomePanel }
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

const shellFont = { fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" } as const

/** Flow Mates CMS — Frame admin layout, Notype content. */
export function CmsLayout() {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const { savedAt, artistSyncError, siteSyncError, artistSaving, contentSyncStatus } = useCms()
  const { user, authRequired, signOut } = useAuth()
  const { theme, toggleTheme } = useCmsTheme()
  const panels = useCmsPanels()
  const artistSlug = artistSlugFromPath(pathname)
  const pagesWorkspace = isPagesWorkspacePath(pathname)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const openSearch = useCallback(() => setSearchOpen(true), [])
  useFlowMatesSearchHotkey(openSearch)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  if (pathname === '/cms' || pathname === '/cms/') {
    return <Navigate to="/cms/dashboard" replace />
  }

  async function handleLogout() {
    await signOut()
    navigate('/cms/login', { replace: true })
  }

  const navLinks = (collapsible: boolean) => (
    <nav className="flex-1 overflow-y-auto px-3 py-5">
      <p
        className={`mb-2 whitespace-nowrap px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400 ${
          collapsible ? 'hidden group-hover/sidebar:block' : ''
        }`}
      >
        Werkomgeving
      </p>
      <ul className="space-y-0.5">
        {NAV.map((n) => {
          const active =
            n.match === 'pages'
              ? pagesWorkspace
              : n.match === 'artists'
                ? panels.mode === 'artists'
                : n.match === 'dashboard'
                  ? panels.mode === 'dashboard'
                  : pathname.startsWith(n.to)
          const Icon = n.icon
          return (
            <li key={n.to}>
              <NavLink
                to={n.to}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                  active
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span
                  className={`whitespace-nowrap font-medium ${
                    collapsible ? 'hidden group-hover/sidebar:inline' : ''
                  }`}
                >
                  {n.label}
                </span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )

  const brand = (onClose?: () => void) => {
    const collapsible = !onClose
    return (
      <div
        className={`flex shrink-0 items-center justify-between border-b border-neutral-200 ${
          collapsible ? 'h-[77px] px-3 group-hover/sidebar:px-5' : 'px-5 py-5'
        }`}
      >
        <Link
          to="/cms/dashboard"
          className={`flex flex-col leading-tight ${
            collapsible ? 'min-w-10 items-center group-hover/sidebar:items-start' : ''
          }`}
        >
          <span
            className={`font-semibold tracking-tight text-neutral-900 ${
              collapsible ? 'text-[11px] group-hover/sidebar:text-[15px]' : 'text-[15px]'
            }`}
          >
            Flow Mates
          </span>
          <span
            className={`mt-1 whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500 ${
              collapsible ? 'hidden group-hover/sidebar:block' : ''
            }`}
          >
            CMS
          </span>
        </Link>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100"
            aria-label="Menu sluiten"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    )
  }

  const searchBtn = (collapsible: boolean) => (
    <div className="px-3 pt-4">
      <button
        type="button"
        onClick={() => {
          setMobileOpen(false)
          setSearchOpen(true)
        }}
        className={`flex items-center gap-2.5 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50/60 px-3 py-2 text-left text-sm text-neutral-500 hover:border-neutral-300 hover:bg-white ${
          collapsible ? 'w-10 group-hover/sidebar:w-full' : 'w-full'
        }`}
      >
        <Search className="h-4 w-4 shrink-0 text-neutral-400" />
        <span className={`flex-1 truncate ${collapsible ? 'hidden group-hover/sidebar:block' : ''}`}>
          Zoek pagina's, media…
        </span>
      </button>
    </div>
  )

  const footer = (collapsible: boolean) => (
    <div
      className={`border-t border-neutral-200 py-4 ${
        collapsible ? 'px-3 group-hover/sidebar:px-5' : 'px-5'
      }`}
    >
      <p
        className={`truncate text-xs font-medium text-neutral-700 ${
          collapsible ? 'hidden group-hover/sidebar:block' : ''
        }`}
      >
        {user?.email ?? (authRequired ? 'Niet ingelogd' : 'Lokaal')}
      </p>
      <a
        href="/"
        className={`mt-3 flex items-center justify-center gap-1.5 overflow-hidden rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 ${
          collapsible ? 'w-10 group-hover/sidebar:w-full' : 'w-full'
        }`}
      >
        <LayoutDashboard className="h-3.5 w-3.5 shrink-0" />
        <span className={collapsible ? 'hidden whitespace-nowrap group-hover/sidebar:inline' : ''}>
          Site bekijken
        </span>
      </a>
      <button
        type="button"
        onClick={toggleTheme}
        className={`mt-2 flex items-center justify-center gap-1.5 overflow-hidden rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 ${
          collapsible ? 'w-10 group-hover/sidebar:w-full' : 'w-full'
        }`}
        aria-label={theme === 'dark' ? 'Lichte modus' : 'Donkere modus'}
      >
        {theme === 'dark' ? (
          <Sun className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <Moon className="h-3.5 w-3.5 shrink-0" />
        )}
        <span className={collapsible ? 'hidden whitespace-nowrap group-hover/sidebar:inline' : ''}>
          {theme === 'dark' ? 'Lichte modus' : 'Donkere modus'}
        </span>
      </button>
      {authRequired ? (
        <button
          type="button"
          onClick={() => void handleLogout()}
          className={`mt-2 flex items-center justify-center gap-1.5 overflow-hidden rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 ${
            collapsible ? 'w-10 group-hover/sidebar:w-full' : 'w-full'
          }`}
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          <span className={collapsible ? 'hidden whitespace-nowrap group-hover/sidebar:inline' : ''}>
            Uitloggen
          </span>
        </button>
      ) : null}
    </div>
  )

  return (
    <div className="cms-layout min-h-svh text-neutral-900" style={shellFont}>
      <FlowMatesCommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />

      <aside className="group/sidebar peer/sidebar fixed inset-y-0 left-0 z-30 hidden w-16 flex-col overflow-hidden border-r border-neutral-200/80 bg-white shadow-sm transition-[width,box-shadow] duration-300 ease-out hover:w-64 hover:shadow-xl lg:flex">
        {brand()}
        {searchBtn(true)}
        {navLinks(true)}
        {footer(true)}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-neutral-900/50"
            aria-label="Sluiten"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-white shadow-2xl">
            {brand(() => setMobileOpen(false))}
            {searchBtn(false)}
            {navLinks(false)}
            {footer(false)}
          </aside>
        </div>
      ) : null}

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-neutral-200/80 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-neutral-700 hover:bg-neutral-100"
          aria-label="Menu openen"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <div className="flex flex-col items-center leading-tight">
          <span className="text-[13px] font-semibold text-neutral-900">Flow Mates</span>
          <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            CMS
          </span>
        </div>
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="rounded-lg p-2 text-neutral-700 hover:bg-neutral-100"
          aria-label="Zoeken"
        >
          <Search className="h-5 w-5" />
        </button>
      </header>

      <main
        className={`transition-[padding-left] duration-300 ease-out lg:pl-16 lg:peer-hover/sidebar:pl-64 ${
          pagesWorkspace
            ? '[--cms-editor-sticky-top:6.25rem] lg:[--cms-editor-sticky-top:3rem]'
            : panels.mode === 'artists' && artistSlug
              ? '[--cms-editor-sticky-top:3.5rem] lg:[--cms-editor-sticky-top:1.5rem]'
              : '[--cms-editor-sticky-top:3.5rem] lg:[--cms-editor-sticky-top:1.5rem]'
        }`}
      >
        <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {pagesWorkspace ? <PagesTabBar /> : null}

          {panels.mode === 'dashboard' || panels.mode === 'media' || !panels.Page ? (
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-neutral-200/70 pb-6">
            <div className="min-w-0">
              <h1
                className="text-2xl font-medium tracking-tight text-neutral-900 sm:text-[1.75rem]"
                style={{ letterSpacing: '-0.01em' }}
              >
                {panels.title}
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{panels.subtitle}</p>
              {panels.mode !== 'dashboard' ? (
                <p className="mt-2 text-[11px] uppercase tracking-wide text-neutral-400">
                  {formatSavedAt(savedAt)}
                  {artistSyncError ? ` · Artist: ${artistSyncError}` : ''}
                  {siteSyncError ? ` · Site: ${siteSyncError}` : ''}
                </p>
              ) : null}
            </div>
          </div>
          ) : null}

          {panels.mode === 'dashboard' ? (
            <DashboardHome />
          ) : panels.Page ? (
            panels.mode === 'media' ? (
              <div className="cms-editor-pane min-w-0">
                <EditorTopBar
                  mode="auto-save"
                  saving={artistSaving || contentSyncStatus === 'pending'}
                  lastSavedAt={savedAt ? new Date(savedAt) : null}
                  hint="Media wordt automatisch opgeslagen"
                  extraInfo={
                    artistSyncError || siteSyncError ? (
                      <span className="text-rose-600">
                        {artistSyncError ? `Artist: ${artistSyncError}` : ''}
                        {siteSyncError ? ` Site: ${siteSyncError}` : ''}
                      </span>
                    ) : null
                  }
                />
                <EditorAccordionScope key={`${pathname}${search}`}>
                  <Suspense fallback={<RouteFallback compact />}>
                    <panels.Page slot="editor" />
                  </Suspense>
                </EditorAccordionScope>
              </div>
            ) : (
              <EditorPreviewLayout>
              <div className="cms-editor-pane sticky top-[var(--cms-editor-sticky-top,0px)] flex h-[calc(100dvh-var(--cms-editor-sticky-top,0px)-1.5rem)] min-h-0 min-w-0 flex-col self-start pr-1">
                <div className="shrink-0 border-b border-neutral-200/70 pb-4">
                  <h1
                    className="text-2xl font-medium tracking-tight text-neutral-900 sm:text-[1.75rem]"
                    style={{ letterSpacing: '-0.01em' }}
                  >
                    {panels.title}
                  </h1>
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{panels.subtitle}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-wide text-neutral-400">
                    {formatSavedAt(savedAt)}
                    {artistSyncError ? ` · Artist: ${artistSyncError}` : ''}
                    {siteSyncError ? ` · Site: ${siteSyncError}` : ''}
                  </p>
                </div>
                {panels.mode === 'artists' && artistSlug ? (
                  <div className="cms-artist-tabs shrink-0 bg-[#fafaf8] py-3">
                    <div className="rounded-xl border border-neutral-200 bg-white p-2.5 shadow-sm">
                    <div className="mb-2 flex items-center justify-between gap-3 px-1">
                      <Link
                        to="/cms/artists"
                        className="shrink-0 text-xs font-medium text-neutral-500 hover:text-neutral-900"
                      >
                        ← Alle artiesten
                      </Link>
                      <span className="text-[10px] font-semibold text-neutral-400">
                        Artiestenpagina invullen
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
                      {ARTIST_EDITOR_TABS.map((tab) => {
                        const isActive = isArtistEditorTabActive(
                          tab.id,
                          new URLSearchParams(search).get('tab'),
                        )
                        return (
                          <Link
                            key={tab.id}
                            to={artistEditorPath(artistSlug, tab.id)}
                            className={`rounded-lg px-3 py-2.5 transition-colors ${
                              isActive
                                ? 'bg-neutral-900 text-white'
                                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                            }`}
                          >
                            <span className="block text-sm font-semibold">{tab.label}</span>
                            <span
                              className={`mt-0.5 block truncate text-[10px] ${
                                isActive ? 'text-white/65' : 'text-neutral-400'
                              }`}
                            >
                              {tab.description}
                            </span>
                          </Link>
                        )
                      })}
                    </div>
                    </div>
                  </div>
                ) : null}
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pt-3">
                {panels.mode === 'artists' && artistSlug ? null : (
                  <EditorTopBar
                    mode="auto-save"
                    saving={artistSaving || contentSyncStatus === 'pending'}
                    lastSavedAt={savedAt ? new Date(savedAt) : null}
                    hint="Wijzigingen worden automatisch opgeslagen"
                    extraInfo={
                      artistSyncError || siteSyncError ? (
                        <span className="text-rose-600">
                          {artistSyncError ? `Artist: ${artistSyncError}` : ''}
                          {siteSyncError ? ` Site: ${siteSyncError}` : ''}
                        </span>
                      ) : null
                    }
                  />
                )}
                <EditorAccordionScope key={`${pathname}${search}`}>
                  <Suspense fallback={<RouteFallback compact />}>
                    <panels.Page slot="editor" />
                  </Suspense>
                </EditorAccordionScope>
                </div>
              </div>
              <div className="min-h-0 min-w-0 flex-1">
                <Suspense fallback={<RouteFallback compact />}>
                  <panels.Page slot="preview" />
                </Suspense>
              </div>
              </EditorPreviewLayout>
            )
          ) : null}
        </div>
      </main>
    </div>
  )
}
