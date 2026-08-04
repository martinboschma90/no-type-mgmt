import { Navigate, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/cms/auth/AuthProvider'
import { useCms } from '@/cms/CmsProvider'
import { artistSlugFromPath, isArtistsIndexPath } from '@/cms/artistSlug'
import { sortArtistsByName } from '@/cms/artistVisibility'
import { HomeEditor } from '@/cms/editors/HomeEditor'
import { AboutEditor } from '@/cms/editors/AboutEditor'
import { ContactEditor } from '@/cms/editors/ContactEditor'
import { FooterEditor } from '@/cms/editors/FooterEditor'
import { RosterEditor } from '@/cms/editors/RosterEditor'
import { ArtistEditor } from '@/cms/editors/ArtistEditor'
import { ArtistsIndexEditor } from '@/cms/editors/ArtistsIndexEditor'
import { HomePreview } from '@/cms/previews/HomePreview'
import { AboutPreview } from '@/cms/previews/AboutPreview'
import { ContactPreview } from '@/cms/previews/ContactPreview'
import { FooterPreview } from '@/cms/previews/FooterPreview'
import { RosterPreview } from '@/cms/previews/RosterPreview'
import { ArtistPreview } from '@/cms/previews/ArtistPreview'
import { ArtistsIndexPreview } from '@/cms/previews/ArtistsIndexPreview'
import { MediaLibrary } from '@/cms/media/MediaLibrary'
import { MediaPreview } from '@/cms/previews/MediaPreview'
import { useMedia } from '@/cms/media/MediaProvider'
import { MediaArtistRepair } from '@/cms/media/MediaArtistRepair'

const siteTabs = [
  { to: '/cms/home', label: 'Home' },
  { to: '/cms/about', label: 'About' },
  { to: '/cms/contact', label: 'Contact' },
  { to: '/cms/footer', label: 'Footer' },
  { to: '/cms/roster', label: 'Roster' },
] as const

function useCmsPanels() {
  const { pathname } = useLocation()
  const { getArtistBySlug, content } = useCms()
  const artistSlug = artistSlugFromPath(pathname)

  if (pathname.startsWith('/cms/media')) {
    return {
      mode: 'media' as const,
      title: 'Media',
      subtitle: 'Upload · WebP / WebM',
      editor: <MediaLibrary />,
      preview: <MediaPreview />,
    }
  }

  if (isArtistsIndexPath(pathname)) {
    return {
      mode: 'artists' as const,
      title: 'Artiesten',
      subtitle: `${content.artists.length} artist pages`,
      editor: <ArtistsIndexEditor />,
      preview: <ArtistsIndexPreview />,
    }
  }

  if (artistSlug) {
    const artist = getArtistBySlug(artistSlug)
    return {
      mode: 'artists' as const,
      title: artist?.name ?? 'Artist',
      subtitle: artist ? `/artists/${artist.slug}` : 'Artist detail page',
      editor: <ArtistEditor />,
      preview: <ArtistPreview />,
    }
  }

  if (pathname.startsWith('/cms/about')) {
    return {
      mode: 'pages' as const,
      title: 'About',
      subtitle: 'About · team · social',
      editor: <AboutEditor />,
      preview: <AboutPreview />,
    }
  }

  if (pathname.startsWith('/cms/contact')) {
    return {
      mode: 'pages' as const,
      title: 'Contact',
      subtitle: 'Contact channels',
      editor: <ContactEditor />,
      preview: <ContactPreview />,
    }
  }

  if (pathname.startsWith('/cms/footer')) {
    return {
      mode: 'pages' as const,
      title: 'Footer',
      subtitle: 'Global footer · all pages',
      editor: <FooterEditor />,
      preview: <FooterPreview />,
    }
  }

  if (pathname.startsWith('/cms/roster')) {
    return {
      mode: 'pages' as const,
      title: 'Roster',
      subtitle: 'Homepage artist grid',
      editor: <RosterEditor />,
      preview: <RosterPreview />,
    }
  }

  return {
    mode: 'pages' as const,
    title: 'Home',
    subtitle: 'Hero · brand',
    editor: <HomeEditor />,
    preview: <HomePreview />,
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

/** Frame-inspired CMS shell: sidebar · editor · live preview. */
export function CmsLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { resetContent, savedAt, artistSyncError, siteSyncError, content } =
    useCms()
  const { user, authRequired, signOut } = useAuth()
  const { assets } = useMedia()
  const panels = useCmsPanels()

  if (pathname === '/cms' || pathname === '/cms/') {
    return <Navigate to="/cms/home" replace />
  }

  const artistsActive = pathname.startsWith('/cms/artists')
  const mediaActive = pathname.startsWith('/cms/media')
  const pagesActive = !artistsActive && !mediaActive

  async function handleLogout() {
    await signOut()
    navigate('/cms/login', { replace: true })
  }

  return (
    <div className="flex h-svh overflow-hidden bg-[#ebe8e2] text-ink dark:bg-[#0c0b0d]">
      <aside className="hidden w-[210px] shrink-0 flex-col border-r border-ink/8 bg-[var(--body-bg)] md:flex">
        <div className="border-b border-ink/8 px-4 py-5">
          <p className="type-label text-[0.6rem] tracking-[0.18em] text-brand uppercase">
            No Type
          </p>
          <h1 className="type-display m-0 mt-1 text-[1.65rem] leading-none text-ink">CMS</h1>
          <p className="type-body mt-2 text-[0.7rem] text-ink/40">
            {authRequired ? 'Admin · autosave' : 'Local · autosave'}
          </p>
          {user?.email ? (
            <p
              className="type-body mt-2 truncate text-[0.65rem] text-ink/50"
              title={user.email}
            >
              {user.email}
            </p>
          ) : null}
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 p-3" aria-label="CMS">
          <NavLink
            to="/cms/home"
            className={[
              'type-label rounded-xl px-3 py-2.5 text-[0.7rem] tracking-[0.12em] uppercase transition-colors',
              pagesActive
                ? 'bg-ink text-ink-inverse'
                : 'text-ink/50 hover:bg-ink/5 hover:text-ink',
            ].join(' ')}
          >
            Pagina&apos;s
          </NavLink>
          <NavLink
            to="/cms/artists"
            className={[
              'type-label rounded-xl px-3 py-2.5 text-[0.7rem] tracking-[0.12em] uppercase transition-colors',
              artistsActive
                ? 'bg-ink text-ink-inverse'
                : 'text-ink/50 hover:bg-ink/5 hover:text-ink',
            ].join(' ')}
          >
            Artiesten
            <span className="ml-2 opacity-55">{content.artists.length}</span>
          </NavLink>
          <NavLink
            to="/cms/media"
            className={[
              'type-label rounded-xl px-3 py-2.5 text-[0.7rem] tracking-[0.12em] uppercase transition-colors',
              mediaActive
                ? 'bg-ink text-ink-inverse'
                : 'text-ink/50 hover:bg-ink/5 hover:text-ink',
            ].join(' ')}
          >
            Media
            <span className="ml-2 opacity-55">{assets.length}</span>
          </NavLink>
        </nav>

        <div className="space-y-2 border-t border-ink/8 p-4">
          <a
            href="/"
            className="type-label block rounded-xl border border-brand/35 bg-brand/10 px-3 py-2.5 text-center text-[0.65rem] tracking-[0.12em] text-ink uppercase transition-colors hover:bg-brand/20"
          >
            View site
          </a>
          {authRequired ? (
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="type-label w-full rounded-xl border border-ink/12 px-3 py-2.5 text-[0.65rem] tracking-[0.12em] text-ink/45 uppercase transition-colors hover:border-ink/25 hover:text-ink"
            >
              Log out
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  'Reset all CMS content to the defaults shipped with the site?',
                )
              ) {
                resetContent()
              }
            }}
            className="type-label w-full rounded-xl border border-ink/12 px-3 py-2.5 text-[0.65rem] tracking-[0.12em] text-ink/45 uppercase transition-colors hover:border-ink/25 hover:text-ink"
          >
            Reset content
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col xl:flex-row">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col border-ink/8 bg-[var(--body-bg)] xl:border-r">
          <div className="shrink-0 border-b border-ink/8 px-4 py-3 sm:px-5">
            {panels.mode === 'pages' ? (
              <div className="flex gap-1 overflow-x-auto pb-1">
                {siteTabs.map((tab) => {
                  const active = pathname.startsWith(tab.to)
                  return (
                    <NavLink
                      key={tab.to}
                      to={tab.to}
                      className={[
                        'type-label shrink-0 rounded-full px-3.5 py-2 text-[0.65rem] tracking-[0.12em] uppercase transition-colors',
                        active
                          ? 'bg-ink text-ink-inverse'
                          : 'text-ink/45 hover:bg-ink/5 hover:text-ink',
                      ].join(' ')}
                    >
                      {tab.label}
                    </NavLink>
                  )
                })}
              </div>
            ) : null}

            {panels.mode === 'artists' ? (
              <div className="flex gap-1 overflow-x-auto pb-1">
                <NavLink
                  to="/cms/artists"
                  end
                  className={({ isActive }) =>
                    [
                      'type-label shrink-0 rounded-full px-3.5 py-2 text-[0.65rem] tracking-[0.12em] uppercase transition-colors',
                      isActive || pathname === '/cms/artists/'
                        ? 'bg-ink text-ink-inverse'
                        : 'text-ink/45 hover:bg-ink/5 hover:text-ink',
                    ].join(' ')
                  }
                >
                  Overzicht
                </NavLink>
                {sortArtistsByName(content.artists).map((artist) => (
                  <NavLink
                    key={artist.id}
                    to={`/cms/artists/${artist.slug}`}
                    className={({ isActive }) =>
                      [
                        'type-label shrink-0 rounded-full px-3.5 py-2 text-[0.65rem] tracking-[0.1em] uppercase transition-colors',
                        isActive
                          ? 'bg-brand text-[#111111]'
                          : 'text-ink/45 hover:bg-ink/5 hover:text-ink',
                      ].join(' ')
                    }
                  >
                    {artist.name}
                  </NavLink>
                ))}
              </div>
            ) : null}

            {panels.mode === 'media' ? (
              <p className="type-headline text-base text-ink">Media library</p>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="type-label inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-2.5 py-1 text-[0.55rem] tracking-[0.12em] text-ink uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                {authRequired ? 'Admin' : 'Local'}
              </span>
              {user?.email ? (
                <span
                  className="type-body max-w-[10rem] truncate text-[0.7rem] text-ink/45 sm:max-w-[14rem]"
                  title={user.email}
                >
                  {user.email}
                </span>
              ) : null}
              <span className="type-label text-[0.55rem] tracking-[0.12em] text-ink/40 uppercase">
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
                  className="type-label ml-auto text-[0.55rem] tracking-[0.12em] text-ink/40 uppercase transition-colors hover:text-ink md:hidden"
                >
                  Log out
                </button>
              ) : null}
              <span className="type-label hidden text-[0.55rem] tracking-[0.12em] text-ink/35 uppercase sm:inline">
                {panels.subtitle}
              </span>
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto border-b border-ink/8 px-3 py-2 md:hidden">
            <NavLink
              to="/cms/home"
              className={() =>
                [
                  'type-label shrink-0 rounded-full px-3 py-1.5 text-[0.6rem] tracking-[0.1em] uppercase',
                  pagesActive ? 'bg-ink text-ink-inverse' : 'bg-ink/5 text-ink/50',
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
                  artistsActive ? 'bg-ink text-ink-inverse' : 'bg-ink/5 text-ink/50',
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
                  mediaActive ? 'bg-ink text-ink-inverse' : 'bg-ink/5 text-ink/50',
                ].join(' ')
              }
            >
              Media
            </NavLink>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            <MediaArtistRepair />
            <div className="space-y-3">{panels.editor}</div>
          </div>
        </section>

        <section className="flex min-h-[38vh] min-w-0 flex-col bg-[#ebe8e2] p-4 xl:min-h-0 xl:flex-[1.1] dark:bg-[#151217]">
          <div className="min-h-0 flex-1">{panels.preview}</div>
        </section>
      </div>
    </div>
  )
}
