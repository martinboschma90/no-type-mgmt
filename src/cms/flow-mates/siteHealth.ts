import type { CmsContent } from '@/cms/content'
import type { ContentSyncStatus } from '@/cms/CmsContext'
import { getArtistStatus } from '@/cms/artistVisibility'
import { normalizeArtistVideos } from '@/cms/artistVideos'
import { countUnsyncedMediaUrls } from '@/cms/media/migrateLocalMedia'
import {
  vitalRating,
  type LiveSiteSnapshot,
} from '@/cms/flow-mates/liveSite'

/** Content ouder dan dit telt als “bijwerken”. */
export const STALE_CONTENT_DAYS = 14

export type HealthCheck = {
  id: string
  label: string
  ok: boolean
  weight: number
  hint?: string
  to?: string
}

export type PageHealth = {
  id: string
  label: string
  to: string
  score: number
  issues: string[]
}

export type HealthRuntime = {
  savedAt: number | null
  contentSyncStatus: ContentSyncStatus
  artistSyncError: string | null
  siteSyncError: string | null
  dirtyCount: number
  live?: LiveSiteSnapshot | null
}

export type SiteHealth = {
  score: number
  seoScore: number
  pagesScore: number
  artistsScore: number
  performanceScore: number
  stabilityScore: number
  errorsScore: number
  label: string
  checks: HealthCheck[]
  pages: PageHealth[]
  issues: HealthCheck[]
  errors: HealthCheck[]
  updateNeeded: boolean
  updateHint: string
  savedAt: number | null
  checkedAt: number
}

function scoreOf(checks: { ok: boolean; weight: number }[]) {
  const total = checks.reduce((sum, item) => sum + item.weight, 0) || 1
  const earned = checks.reduce((sum, item) => sum + (item.ok ? item.weight : 0), 0)
  return Math.round((earned / total) * 100)
}

function healthLabel(score: number) {
  if (score >= 90) return 'Sterk'
  if (score >= 75) return 'Goed'
  if (score >= 55) return 'Aandacht'
  return 'Zwak'
}

function metaOk(text: string) {
  const len = text.trim().length
  return len >= 70 && len <= 170
}

export function assessSiteHealth(
  content: CmsContent,
  runtime: HealthRuntime = {
    savedAt: null,
    contentSyncStatus: 'synced',
    artistSyncError: null,
    siteSyncError: null,
    dirtyCount: 0,
  },
): SiteHealth {
  const { site, artists } = content
  const checkedAt = Date.now()
  const url = (site.publicSiteUrl || '').trim()
  const https = /^https:\/\//i.test(url) && !/localhost|127\.0\.0\.1/i.test(url)
  const meta = site.metaDescription?.trim() || ''
  const faqItems = (site.faqCategories || []).flatMap((cat) =>
    cat.visible === false ? [] : cat.items.filter((item) => item.visible !== false),
  )
  const published = artists.filter((artist) => getArtistStatus(artist) === 'published')
  const unsynced = countUnsyncedMediaUrls(content)

  const seoChecks: HealthCheck[] = [
    {
      id: 'https',
      label: 'HTTPS-URL',
      ok: https,
      weight: 18,
      hint: https ? undefined : 'Zet de publieke URL op https://…',
      to: '/cms/settings',
    },
    {
      id: 'index',
      label: 'Google-index',
      ok: site.searchIndexing !== false,
      weight: 16,
      hint: site.searchIndexing === false ? 'Zoeken staat uit (noindex).' : undefined,
      to: '/cms/settings',
    },
    {
      id: 'meta',
      label: 'Meta beschrijving',
      ok: metaOk(meta),
      weight: 20,
      hint: metaOk(meta)
        ? undefined
        : meta
          ? `${meta.length} tekens — mik op 70–170.`
          : 'Nog geen meta beschrijving.',
      to: '/cms/settings',
    },
    {
      id: 'tagline',
      label: 'Tagline',
      ok: (site.tagline || '').trim().length > 12,
      weight: 10,
      to: '/cms/home',
    },
    ...(runtime.live
      ? [
          {
            id: 'robots',
            label: 'robots.txt',
            ok: runtime.live.search.robots.ok,
            weight: 8,
            hint: runtime.live.search.robots.ok
              ? undefined
              : 'robots.txt ontbreekt of is de HTML-app.',
          },
          {
            id: 'sitemap',
            label: 'Sitemap',
            ok: runtime.live.search.sitemap.ok,
            weight: 8,
            hint: runtime.live.search.sitemap.ok
              ? undefined
              : 'sitemap.xml ontbreekt — Google kan minder goed crawlen.',
          },
        ]
      : []),
  ]

  const pages: PageHealth[] = [
    {
      id: 'home',
      label: 'Home',
      to: '/cms/home',
      score: scoreOf([
        { ok: (site.tagline || '').trim().length > 12, weight: 1 },
        { ok: site.homeHeroVisible !== false, weight: 1 },
        { ok: published.length > 0, weight: 1 },
      ]),
      issues: [
        ...(site.tagline || '').trim().length > 12 ? [] : ['Tagline ontbreekt'],
        ...(published.length ? [] : ['Geen gepubliceerde artiesten']),
      ],
    },
    {
      id: 'about',
      label: 'About',
      to: '/cms/about',
      score: scoreOf([
        { ok: (site.aboutTitle || '').trim().length > 2, weight: 1 },
        { ok: (site.about || []).some((p) => p.trim().length > 40), weight: 2 },
      ]),
      issues: (site.about || []).some((p) => p.trim().length > 40)
        ? []
        : ['About-tekst is te kort'],
    },
    {
      id: 'contact',
      label: 'Contact',
      to: '/cms/contact',
      score: scoreOf([
        {
          ok: (site.contact || []).some((item) => item.email?.includes('@')),
          weight: 2,
        },
        { ok: Boolean(site.phoneNumber?.trim() || site.whatsappNumber?.trim()), weight: 1 },
      ]),
      issues: (site.contact || []).some((item) => item.email?.includes('@'))
        ? []
        : ['Geen contact-e-mail'],
    },
    {
      id: 'booking',
      label: 'Booking',
      to: '/cms/booking',
      score: site.bookingVisible === false
        ? 40
        : scoreOf([
            { ok: (site.bookingTitle || '').trim().length > 2, weight: 1 },
            { ok: (site.bookingIntro || '').trim().length > 12, weight: 1 },
          ]),
      issues: site.bookingVisible === false ? ['Pagina staat uit'] : [],
    },
    {
      id: 'faq',
      label: 'FAQ',
      to: '/cms/faq',
      score: site.faqVisible === false
        ? 40
        : scoreOf([{ ok: faqItems.length >= 4, weight: 1 }]),
      issues:
        site.faqVisible === false
          ? ['Pagina staat uit']
          : faqItems.length >= 4
            ? []
            : ['Weinig zichtbare vragen'],
    },
  ]

  const withBio = published.filter((a) => (a.bio || '').trim().length > 40).length
  const withImage = published.filter((a) => Boolean(a.imageUrl?.trim())).length
  const withAlt = published.filter((a) => (a.imageAlt || '').trim().length > 3).length
  const draftCount = artists.length - published.length

  const videos = published.flatMap((artist) =>
    normalizeArtistVideos(artist).map((video) => ({ artist, video })),
  )
  const videosWithoutClip = videos.filter((item) => !item.video.clipUrl?.trim()).length
  const videosWithoutPoster = videos.filter((item) => !item.video.posterUrl?.trim()).length
  const clipRatioOk =
    videos.length === 0 || videosWithoutClip / videos.length <= 0.35
  const posterRatioOk =
    videos.length === 0 || videosWithoutPoster / videos.length <= 0.5

  const ageMs = runtime.savedAt ? checkedAt - runtime.savedAt : 0
  const stale =
    Boolean(runtime.savedAt) &&
    ageMs > STALE_CONTENT_DAYS * 24 * 60 * 60 * 1000
  const pending = runtime.contentSyncStatus === 'pending' || runtime.dirtyCount > 0
  const hasArtistError = Boolean(runtime.artistSyncError)
  const hasSiteError = Boolean(runtime.siteSyncError)

  const updateHint = !runtime.savedAt
    ? 'Nog geen opslagmoment — health volgt de huidige CMS-staat.'
    : stale
      ? `Content is ${Math.floor(ageMs / 86400000)} dagen oud. Werk pagina’s of artiesten bij.`
      : pending
        ? 'Er staan nog wijzigingen klaar om te syncen.'
        : 'Content is recent bijgewerkt.'

  const artistChecks: HealthCheck[] = [
    {
      id: 'published',
      label: 'Artiesten live',
      ok: published.length > 0,
      weight: 16,
      hint: published.length ? undefined : 'Nog geen gepubliceerde artiest.',
      to: '/cms/artists',
    },
    {
      id: 'bios',
      label: 'Bio’s',
      ok: published.length > 0 && withBio / published.length >= 0.7,
      weight: 12,
      hint:
        published.length && withBio / published.length < 0.7
          ? `${withBio}/${published.length} bio’s zijn gevuld.`
          : undefined,
      to: '/cms/artists',
    },
    {
      id: 'alts',
      label: 'Afbeelding-alt',
      ok: published.length > 0 && withAlt / published.length >= 0.7,
      weight: 8,
      hint:
        published.length && withAlt / published.length < 0.7
          ? `${withAlt}/${published.length} met alt-tekst.`
          : undefined,
      to: '/cms/artists',
    },
    {
      id: 'media',
      label: 'Media gesynct',
      ok: unsynced === 0,
      weight: 10,
      hint: unsynced ? `${unsynced} lokale media-refs nog niet in Storage.` : undefined,
      to: '/cms/media',
    },
  ]

  const pageChecks: HealthCheck[] = pages.map((page) => ({
    id: `page-${page.id}`,
    label: page.label,
    ok: page.score >= 70,
    weight: 8,
    hint: page.issues[0],
    to: page.to,
  }))

  const performanceChecks: HealthCheck[] = [
    {
      id: 'perf-media',
      label: 'Media in Storage',
      ok: unsynced === 0,
      weight: 28,
      hint: unsynced
        ? `${unsynced} lokale refs — langzame of kapotte media.`
        : undefined,
      to: '/cms/media',
    },
    {
      id: 'perf-clips',
      label: 'Video-clips',
      ok: clipRatioOk,
      weight: 32,
      hint: clipRatioOk
        ? undefined
        : `${videosWithoutClip}/${videos.length} video’s zonder clip — zwaar op live.`,
      to: '/cms/artists',
    },
    {
      id: 'perf-posters',
      label: 'Video-posters',
      ok: posterRatioOk,
      weight: 16,
      hint: posterRatioOk
        ? undefined
        : `${videosWithoutPoster} video’s zonder poster.`,
      to: '/cms/artists',
    },
    {
      id: 'perf-https',
      label: 'HTTPS',
      ok: https,
      weight: 14,
      hint: https ? undefined : 'Publieke URL is geen https.',
      to: '/cms/settings',
    },
    {
      id: 'perf-images',
      label: 'Artiest-beelden',
      ok: published.length === 0 || withImage / published.length >= 0.9,
      weight: 10,
      to: '/cms/artists',
    },
    ...livePerformanceChecks(runtime.live),
  ]

  const stabilityChecks: HealthCheck[] = [
    {
      id: 'stab-site-sync',
      label: 'Site-sync',
      ok: !hasSiteError,
      weight: 34,
      hint: runtime.siteSyncError || undefined,
      to: '/cms/settings',
    },
    {
      id: 'stab-artist-sync',
      label: 'Artiest-sync',
      ok: !hasArtistError,
      weight: 34,
      hint: runtime.artistSyncError || undefined,
      to: '/cms/artists',
    },
    {
      id: 'stab-pending',
      label: 'Geen wachtende sync',
      ok: !pending,
      weight: 16,
      hint: pending
        ? runtime.dirtyCount
          ? `${runtime.dirtyCount} artiest(en) nog niet opgeslagen.`
          : 'Site-content wacht op sync.'
        : undefined,
    },
    {
      id: 'stab-fresh',
      label: 'Content vers',
      ok: !stale,
      weight: 16,
      hint: stale ? updateHint : undefined,
      to: '/cms/home',
    },
    {
      id: 'stab-uptime',
      label: 'Uptime',
      ok: !runtime.live || runtime.live.uptime.ok,
      weight: 24,
      hint:
        runtime.live && !runtime.live.uptime.ok
          ? `Live site antwoordt ${runtime.live.uptime.status || 'niet'}.`
          : undefined,
    },
  ]

  const errorChecks: HealthCheck[] = [
    {
      id: 'err-site',
      label: 'Site-fout',
      ok: !hasSiteError,
      weight: 40,
      hint: runtime.siteSyncError || undefined,
      to: '/cms/settings',
    },
    {
      id: 'err-artist',
      label: 'Artiest-fout',
      ok: !hasArtistError,
      weight: 40,
      hint: runtime.artistSyncError || undefined,
      to: '/cms/artists',
    },
    {
      id: 'err-media',
      label: 'Media-refs',
      ok: unsynced === 0,
      weight: 20,
      hint: unsynced ? `${unsynced} kapotte of lokale media-refs.` : undefined,
      to: '/cms/media',
    },
    {
      id: 'err-js',
      label: 'JS-crashes',
      ok: !runtime.live || runtime.live.errors.jsCount24h < 3,
      weight: 28,
      hint:
        runtime.live && runtime.live.errors.jsCount24h
          ? `${runtime.live.errors.jsCount24h} in 24u op de live site.`
          : undefined,
    },
    {
      id: 'err-404',
      label: 'Onbekende URL’s',
      ok: !runtime.live || runtime.live.errors.notFoundCount24h < 8,
      weight: 12,
      hint:
        runtime.live && runtime.live.errors.notFoundCount24h
          ? `${runtime.live.errors.notFoundCount24h} hits op niet-bestaande paden.`
          : undefined,
    },
  ]

  const checks = [
    ...seoChecks,
    ...pageChecks,
    ...artistChecks,
    ...performanceChecks,
    ...stabilityChecks,
    ...errorChecks,
  ]
  const seoScore = scoreOf(seoChecks)
  const pagesScore = Math.round(
    pages.reduce((sum, page) => sum + page.score, 0) / Math.max(1, pages.length),
  )
  const artistsScore = scoreOf([
    ...artistChecks,
    {
      ok: published.length > 0 && withImage / published.length >= 0.9,
      weight: 8,
    },
    { ok: draftCount <= 2, weight: 4 },
  ])
  const performanceScore = scoreOf(performanceChecks)
  const stabilityScore = scoreOf(stabilityChecks)
  const errorsScore = scoreOf(errorChecks)
  const score = scoreOf(checks)

  return {
    score,
    seoScore,
    pagesScore,
    artistsScore,
    performanceScore,
    stabilityScore,
    errorsScore,
    label: healthLabel(score),
    checks,
    pages,
    issues: checks.filter((check) => !check.ok),
    errors: errorChecks.filter((check) => !check.ok),
    updateNeeded: stale || pending,
    updateHint,
    savedAt: runtime.savedAt,
    checkedAt,
  }
}

function livePerformanceChecks(live?: LiveSiteSnapshot | null): HealthCheck[] {
  if (!live) return []
  const lcpValue = live.vitals.lcp ?? live.psi?.lcp ?? null
  const inpValue = live.vitals.inp ?? live.psi?.inp ?? null
  const clsValue = live.vitals.cls ?? live.psi?.cls ?? null
  const ttfbValue = live.vitals.ttfb ?? live.uptime.ttfbMs
  const lcp = vitalRating('lcp', lcpValue)
  const inp = vitalRating('inp', inpValue)
  const cls = vitalRating('cls', clsValue)
  const ttfb = vitalRating('ttfb', ttfbValue)
  const checks: HealthCheck[] = [
    {
      id: 'perf-lcp',
      label: 'LCP',
      ok: lcp !== 'poor',
      weight: 28,
      hint:
        lcp === 'empty'
          ? 'Nog geen bezoekersmeting (wacht op live traffic).'
          : lcpValue != null
            ? `${Math.round(lcpValue)} ms (p75).`
            : undefined,
    },
    {
      id: 'perf-inp',
      label: 'INP',
      ok: inp !== 'poor',
      weight: 16,
      hint:
        inp === 'empty'
          ? undefined
          : inpValue != null
            ? `${Math.round(inpValue)} ms.`
            : undefined,
    },
    {
      id: 'perf-cls',
      label: 'CLS',
      ok: cls !== 'poor',
      weight: 12,
      hint:
        cls === 'empty' ? undefined : clsValue != null ? clsValue.toFixed(3) : undefined,
    },
    {
      id: 'perf-ttfb',
      label: 'TTFB',
      ok: ttfb !== 'poor',
      weight: 16,
      hint: ttfbValue != null ? `${Math.round(ttfbValue)} ms tot eerste byte.` : undefined,
    },
  ]
  if (live.psi?.score != null) {
    checks.push({
      id: 'perf-psi',
      label: 'PageSpeed',
      ok: live.psi.score >= 70,
      weight: 18,
      hint: `Lighthouse ${live.psi.score}/100.`,
    })
  }
  return checks
}
