import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  MapPin,
  MonitorSmartphone,
  MousePointer2,
  Percent,
  Radio,
  RefreshCw,
  Star,
  Users,
} from 'lucide-react'
import { useAuth } from '@/cms/auth/AuthProvider'
import { useCms } from '@/cms/CmsProvider'
import { fetchBookingRequestsSince } from '@/cms/api/bookingRequests'
import type { LiveSiteSnapshot } from '@/cms/flow-mates/liveSite'
import {
  coordsForCity,
  coordsForCountry,
  WorldTrafficMap,
} from '@/cms/flow-mates/WorldTrafficMap'

type MetricRow = {
  timestamp?: string
  requestPath?: string
  referrerHostname?: string
  country?: string
  city?: string
  deviceType?: string
  pageviews: number
  visitors: number
  bounceRate?: number | null
  duration?: number | null
}

type ChannelCounts = {
  organic: number
  direct: number
  social: number
  referral: number
}

type TrafficData = {
  totals: { pageviews: number; visitors: number }
  previous: { pageviews: number; visitors: number }
  trend: MetricRow[]
  pages: MetricRow[]
  artists: MetricRow[]
  referrers: MetricRow[]
  channels?: ChannelCounts
  countries: MetricRow[]
  cities: MetricRow[]
  citiesSource?: string | null
  devices: MetricRow[]
  countryArtists: MetricRow[]
}

const periods = [7, 30, 90] as const
type PageSort = 'pageviews' | 'duration' | 'bounceRate'

function asList(value: unknown): MetricRow[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => {
    const row = (item || {}) as Record<string, unknown>
    const bounce = Number(row.bounceRate ?? row.bounce_rate)
    const duration = Number(
      row.duration ?? row.sessionDuration ?? row.averageDuration ?? row.avgDuration,
    )
    return {
      timestamp: typeof row.timestamp === 'string' ? row.timestamp : undefined,
      requestPath: typeof row.requestPath === 'string' ? row.requestPath : undefined,
      referrerHostname:
        typeof row.referrerHostname === 'string' ? row.referrerHostname : undefined,
      country: typeof row.country === 'string' ? row.country : undefined,
      city:
        typeof row.city === 'string'
          ? row.city
          : typeof row.region === 'string'
            ? row.region
            : undefined,
      deviceType: typeof row.deviceType === 'string' ? row.deviceType : undefined,
      pageviews: Number(row.pageviews) || 0,
      visitors: Number(row.visitors) || 0,
      bounceRate: Number.isFinite(bounce) && bounce > 0 ? bounce : null,
      duration: Number.isFinite(duration) && duration > 0 ? duration : null,
    }
  })
}

function number(value: number) {
  return new Intl.NumberFormat('nl-NL').format(value || 0)
}

function change(current: number, previous: number) {
  if (!previous) return current ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

function countryFlag(code?: string) {
  const country = code?.trim().toUpperCase()
  if (!country || country.length !== 2 || country === 'ZZ') return '🌍'
  const first = country.charCodeAt(0)
  const second = country.charCodeAt(1)
  if (first < 65 || first > 90 || second < 65 || second > 90) return '🌍'
  return String.fromCodePoint(127397 + first, 127397 + second)
}

const regionNames = new Intl.DisplayNames(['nl'], { type: 'region' })

function countryName(code?: string) {
  const country = code?.trim().toUpperCase()
  if (!country || country.length !== 2 || country === 'ZZ') return 'Onbekend'
  try {
    return regionNames.of(country) ?? country
  } catch {
    return country
  }
}

const deviceNames: Record<string, string> = {
  desktop: 'Desktop',
  mobile: 'Mobiel',
  tablet: 'Tablet',
}

function artistSlugFromPath(path?: string) {
  const match = path?.match(/^\/artists\/([^/?#]+)/i)
  return match?.[1] ? decodeURIComponent(match[1]).toLowerCase() : null
}

function pageTitle(path: string | undefined, artistNames: Map<string, string>) {
  const raw = (path || '/').split('?')[0] || '/'
  if (raw === '/') return 'Home'
  const slug = artistSlugFromPath(raw)
  if (slug) return artistNames.get(slug) || slug
  const labels: Record<string, string> = {
    '/about': 'About',
    '/contact': 'Contact',
    '/booking': 'Booking',
    '/faq': 'FAQ',
    '/artists': 'Artiesten',
  }
  return labels[raw] || raw.replace(/^\//, '') || 'Pagina'
}

function formatDuration(seconds: number | null | undefined) {
  if (!seconds || seconds <= 0) return '—'
  const total = Math.round(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatBounce(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '—'
  return `${Math.round(value)}%`
}

function classifyReferrer(host?: string): keyof ChannelCounts {
  const value = (host || '').toLowerCase()
  if (!value) return 'direct'
  if (/google\.|bing\.|duckduckgo\.|yahoo\.|ecosia\.|baidu\.|search\.brave/.test(value)) {
    return 'organic'
  }
  if (
    /instagram\.|facebook\.|fb\.com|t\.co$|twitter\.|x\.com|tiktok\.|linkedin\.|youtube\.|youtu\.be|pinterest\./.test(
      value,
    )
  ) {
    return 'social'
  }
  return 'referral'
}

const channelLabels: Record<keyof ChannelCounts, string> = {
  organic: 'Organisch',
  direct: 'Direct',
  social: 'Social',
  referral: 'Referral',
}

export function TrafficDashboard({ live }: { live?: LiveSiteSnapshot | null } = {}) {
  const { session } = useAuth()
  const { content } = useCms()
  const [days, setDays] = useState<(typeof periods)[number]>(30)
  const [data, setData] = useState<TrafficData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [pageSort, setPageSort] = useState<PageSort>('pageviews')
  const [pageDir, setPageDir] = useState<'asc' | 'desc'>('desc')
  const [monthBookings, setMonthBookings] = useState(0)
  const [topBookedArtist, setTopBookedArtist] = useState('—')
  const [bookingCities, setBookingCities] = useState<{ city: string; count: number }[]>([])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    void fetch(`/api/analytics?days=${days}`, {
      signal: controller.signal,
      headers: session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {},
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => null)
        if (!response.ok) {
          throw new Error(payload?.error || 'Analytics kon niet worden geladen.')
        }
        if (!payload?.totals || typeof payload.totals !== 'object') {
          throw new Error('Analytics gaf nog geen geldige gegevens terug.')
        }
        const next: TrafficData = {
          totals: {
            pageviews: Number(payload.totals.pageviews) || 0,
            visitors: Number(payload.totals.visitors) || 0,
          },
          previous: {
            pageviews: Number(payload.previous?.pageviews) || 0,
            visitors: Number(payload.previous?.visitors) || 0,
          },
          trend: asList(payload.trend),
          pages: asList(payload.pages),
          artists: asList(payload.artists),
          referrers: asList(payload.referrers),
          channels: payload.channels,
          countries: asList(payload.countries),
          cities: asList(payload.cities),
          citiesSource: payload.citiesSource || null,
          devices: asList(payload.devices),
          countryArtists: asList(payload.countryArtists),
        }
        return next
      })
      .then(setData)
      .catch((reason) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return
        setData(null)
        setError(reason instanceof Error ? reason.message : 'Analytics kon niet worden geladen.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [days, reloadKey, session?.access_token])

  useEffect(() => {
    const start = new Date()
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
    void fetchBookingRequestsSince(start.toISOString()).then((rows) => {
      setMonthBookings(rows.length)
      const counts = new Map<string, number>()
      const cities = new Map<string, number>()
      for (const row of rows) {
        const city = row.city?.trim()
        if (city) cities.set(city, (cities.get(city) || 0) + 1)
        for (const artist of row.artists) {
          const name = artist.name?.trim()
          if (!name) continue
          counts.set(name, (counts.get(name) || 0) + 1)
        }
      }
      const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
      setTopBookedArtist(top?.[0] || '—')
      setBookingCities(
        [...cities.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([city, count]) => ({ city, count })),
      )
    })
  }, [reloadKey])

  const artistNames = useMemo(() => {
    const map = new Map<string, string>()
    const artists = Array.isArray(content.artists) ? content.artists : []
    for (const artist of artists) {
      if (artist?.slug) map.set(artist.slug.toLowerCase(), artist.name)
    }
    return map
  }, [content.artists])

  const topArtists = useMemo(() => {
    const merged = new Map<string, MetricRow>()
    for (const row of [...(data?.artists ?? []), ...(data?.pages ?? [])]) {
      const slug = artistSlugFromPath(row.requestPath)
      if (!slug) continue
      const current = merged.get(slug)
      merged.set(slug, {
        requestPath: `/artists/${slug}`,
        pageviews: (current?.pageviews || 0) + (row.pageviews || 0),
        visitors: (current?.visitors || 0) + (row.visitors || 0),
      })
    }
    return [...merged.values()].sort((a, b) => b.pageviews - a.pageviews).slice(0, 5)
  }, [data])

  const countryCards = useMemo(() => {
    const artistsByCountry = new Map<string, { name: string; pageviews: number }[]>()
    for (const row of data?.countryArtists ?? []) {
      const code = row.country?.toUpperCase()
      const slug = artistSlugFromPath(row.requestPath)
      if (!code || !slug) continue
      const name = artistNames.get(slug) || slug
      const list = artistsByCountry.get(code) ?? []
      const existing = list.find((item) => item.name === name)
      if (existing) existing.pageviews += row.pageviews || 0
      else list.push({ name, pageviews: row.pageviews || 0 })
      artistsByCountry.set(code, list)
    }

    const countries = (data?.countries ?? []).length
      ? data?.countries ?? []
      : [...artistsByCountry.keys()].map((country) => ({
          country,
          pageviews: 0,
          visitors: 0,
        }))

    return countries.map((row) => {
      const code = row.country?.toUpperCase() || ''
      const artists = (artistsByCountry.get(code) ?? [])
        .sort((a, b) => b.pageviews - a.pageviews)
        .slice(0, 2)
      return {
        code,
        pageviews: row.pageviews || 0,
        artists,
      }
    })
  }, [artistNames, data])

  const sortedPages = useMemo(() => {
    const rows = [...(data?.pages ?? [])]
    rows.sort((a, b) => {
      const av = a[pageSort] ?? -1
      const bv = b[pageSort] ?? -1
      return pageDir === 'desc' ? Number(bv) - Number(av) : Number(av) - Number(bv)
    })
    return rows.slice(0, 8)
  }, [data, pageDir, pageSort])

  const channels = useMemo<ChannelCounts>(() => {
    if (data?.channels) return data.channels
    const counts: ChannelCounts = { organic: 0, direct: 0, social: 0, referral: 0 }
    for (const row of data?.referrers ?? []) {
      counts[classifyReferrer(row.referrerHostname)] += row.pageviews || 0
    }
    return counts
  }, [data])

  const channelTotal = Math.max(
    1,
    channels.organic + channels.direct + channels.social + channels.referral,
  )
  const visitors = data?.totals.visitors || 0
  const pageviews = data?.totals.pageviews || 0
  const returningShare = pageviews > 0 ? Math.max(0, 1 - visitors / pageviews) : 0
  const newShare = 1 - returningShare
  const conversion =
    visitors > 0 ? Math.min(100, (monthBookings / visitors) * 100) : null

  const maxCountry = Math.max(1, ...countryCards.map((row) => row.pageviews), 1)
  const cityRows = useMemo(() => {
    const fromAnalytics = (data?.cities ?? [])
      .map((row) => ({
        city: row.city?.trim() || '',
        country: row.country?.trim().toUpperCase() || '',
        pageviews: row.pageviews || 0,
      }))
      .filter((row) => row.city)
    if (fromAnalytics.length) return fromAnalytics.slice(0, 8)
    const fromRum = (live?.cities ?? [])
      .filter((row) => row.city?.trim())
      .map((row) => ({
        city: row.city,
        country: row.country?.toUpperCase() || '',
        pageviews: row.count,
      }))
    if (fromRum.length) return fromRum.slice(0, 8)
    return bookingCities.map((row) => ({ city: row.city, country: '', pageviews: row.count }))
  }, [bookingCities, data, live])
  const mapDots = useMemo(() => {
    const dots = countryCards.flatMap((card) => {
      const xy = coordsForCountry(card.code)
      if (!xy) return []
      const citiesHere = cityRows
        .filter((row) => row.country === card.code)
        .map((row) => row.city)
      return [
        {
          id: card.code,
          label: countryName(card.code),
          lng: xy[0],
          lat: xy[1],
          value: card.pageviews,
          kind: 'country' as const,
          artists: card.artists.map((artist) => artist.name),
          cities: citiesHere,
        },
      ]
    })
    for (const row of cityRows) {
      const xy = coordsForCity(row.city)
      if (!xy) continue
      dots.push({
        id: `city-${row.city}`,
        label: row.city,
        lng: xy[0],
        lat: xy[1],
        value: Math.max(row.pageviews, 1),
        kind: 'city' as const,
        artists: row.country
          ? countryCards
              .find((card) => card.code === row.country)
              ?.artists.map((artist) => artist.name)
          : undefined,
      })
    }
    return dots
  }, [cityRows, countryCards])

  function toggleSort(key: PageSort) {
    if (pageSort === key) {
      setPageDir((dir) => (dir === 'desc' ? 'asc' : 'desc'))
      return
    }
    setPageSort(key)
    setPageDir('desc')
  }

  return (
    <>
      <section className="cms-traffic-panel mb-5 overflow-hidden rounded-2xl border border-neutral-800 bg-[#111] text-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-400/15">
              <Activity className="h-3.5 w-3.5 text-emerald-300" />
            </span>
            <h3 className="text-sm font-semibold tracking-tight text-white">Website traffic</h3>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-white/5 p-0.5">
            {periods.map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setDays(period)}
                className={[
                  'rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
                  days === period ? 'bg-white text-neutral-950' : 'text-white/45 hover:text-white',
                ].join(' ')}
              >
                {period}d
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse p-4">
            <div className="h-24 rounded-lg bg-white/5" />
          </div>
        ) : null}

        {!loading && error ? (
          <div className="flex items-center justify-between gap-3 px-4 py-4">
            <p className="text-xs text-white/70">{error}</p>
            <button
              type="button"
              onClick={() => setReloadKey((value) => value + 1)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] font-medium text-white/80 hover:bg-white/5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Opnieuw
            </button>
          </div>
        ) : null}

        {!loading && !error && data ? (
          <>
            <div className="grid gap-3 border-b border-white/10 px-4 py-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="grid grid-cols-3 gap-2">
                <Metric
                  icon={<MousePointer2 className="h-3.5 w-3.5" />}
                  label="Bezoeken"
                  value={number(data.totals.pageviews)}
                  delta={change(data.totals.pageviews, data.previous.pageviews)}
                />
                <Metric
                  icon={<Users className="h-3.5 w-3.5" />}
                  label="Unieke"
                  value={number(data.totals.visitors)}
                  delta={change(data.totals.visitors, data.previous.visitors)}
                />
                <Metric
                  icon={<Radio className="h-3.5 w-3.5" />}
                  label="Nu live"
                  value={number(live?.presence.live ?? 0)}
                  delta={0}
                  hideDelta
                />
              </div>
              <div className="min-w-0">
                <p className="mb-1 text-[10px] font-semibold tracking-wider text-white/40 uppercase">
                  Bezoeken over tijd
                </p>
                <AreaChart rows={data.trend} />
              </div>
            </div>

            <div className="grid gap-3 border-b border-white/10 p-3 lg:grid-cols-[minmax(0,1.65fr)_minmax(220px,0.9fr)]">
              <div className="min-h-[240px] lg:min-h-[300px]">
                {mapDots.length ? (
                  <WorldTrafficMap dots={mapDots} />
                ) : (
                  <div className="flex h-full min-h-[240px] items-center justify-center rounded-xl bg-[#0c0c0c] text-[11px] text-white/35">
                    Nog geen locaties
                  </div>
                )}
              </div>
              <div className="grid min-h-0 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <CompactPlaces
                  title="Landen"
                  rows={countryCards.slice(0, 6).map((card) => ({
                    key: card.code || 'unknown',
                    flag: countryFlag(card.code),
                    label: countryName(card.code),
                    hint: card.artists.map((artist) => artist.name).join(' · '),
                    value: card.pageviews,
                    max: maxCountry,
                  }))}
                />
                <CompactPlaces
                  title="Steden"
                  icon={<MapPin className="h-3 w-3" />}
                  emptyHint={
                    live?.cities?.length
                      ? undefined
                      : data.citiesSource
                        ? undefined
                        : 'Steden komen van live bezoekers (niet van Vercel Analytics). Na traffic op de live site vullen ze zich.'
                  }
                  rows={cityRows.slice(0, 6).map((row) => ({
                    key: row.city,
                    label: row.city,
                    value: row.pageviews,
                    max: Math.max(1, ...cityRows.map((item) => item.pageviews)),
                  }))}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3">
              <RankedList
                title="Artiesten"
                rows={topArtists}
                label={(row) =>
                  artistNames.get(artistSlugFromPath(row.requestPath) || '') ||
                  artistSlugFromPath(row.requestPath) ||
                  'Onbekend'
                }
              />
              <RankedList
                title="Bronnen"
                rows={data.referrers}
                label={(row) => row.referrerHostname || 'Direct'}
              />
              <RankedList
                icon={<MonitorSmartphone className="h-3.5 w-3.5" />}
                title="Apparaten"
                rows={data.devices}
                label={(row) =>
                  deviceNames[row.deviceType?.toLocaleLowerCase() || ''] ||
                  row.deviceType ||
                  'Onbekend'
                }
              />
            </div>
          </>
        ) : null}
      </section>

      {!loading && !error && data ? (
        <>
          <DashBlock
            title="Meest bezochte pagina's"
            description="Gesorteerd op bezoeken. Klik een kolom om te wisselen."
          >
            <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-[#111] text-white">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-[12px]">
                  <thead className="border-b border-white/10 text-[10px] font-semibold tracking-wider text-white/40 uppercase">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Pagina</th>
                      <th className="px-4 py-3 font-semibold">URL</th>
                      <SortHead
                        active={pageSort === 'pageviews'}
                        dir={pageDir}
                        onClick={() => toggleSort('pageviews')}
                      >
                        Bezoeken
                      </SortHead>
                      <SortHead
                        active={pageSort === 'duration'}
                        dir={pageDir}
                        onClick={() => toggleSort('duration')}
                      >
                        Gem. tijd
                      </SortHead>
                      <SortHead
                        active={pageSort === 'bounceRate'}
                        dir={pageDir}
                        onClick={() => toggleSort('bounceRate')}
                      >
                        Bounce
                      </SortHead>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPages.length === 0 ? (
                      <tr>
                        <td className="px-4 py-6 text-white/35" colSpan={5}>
                          Nog geen paginagegevens
                        </td>
                      </tr>
                    ) : (
                      sortedPages.map((row) => {
                        const path = row.requestPath || '/'
                        return (
                          <tr
                            key={path}
                            className="border-t border-white/5 hover:bg-white/[0.03]"
                          >
                            <td className="px-4 py-2.5 font-medium text-white">
                              {pageTitle(path, artistNames)}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-[11px] text-white/45">
                              {path}
                            </td>
                            <td className="px-4 py-2.5 tabular-nums text-white/80">
                              {number(row.pageviews)}
                            </td>
                            <td className="px-4 py-2.5 tabular-nums text-white/55">
                              {formatDuration(row.duration)}
                            </td>
                            <td className="px-4 py-2.5 tabular-nums text-white/55">
                              {formatBounce(row.bounceRate)}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </DashBlock>
        </>
      ) : null}

      <DashBlock
        title="Booking aanvragen"
        description="Aanvragen deze kalendermaand, uit Supabase."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <InsightCard
            icon={<CalendarDays className="h-4 w-4" />}
            label="Aanvragen deze maand"
            value={number(monthBookings)}
          />
          <InsightCard
            icon={<Star className="h-4 w-4" />}
            label="Meest aangevraagd"
            value={topBookedArtist}
          />
          <InsightCard
            icon={<Percent className="h-4 w-4" />}
            label="Bezoeker → aanvraag"
            value={conversion == null ? '—' : `${conversion.toFixed(1)}%`}
            hint={visitors ? `op ${number(visitors)} bezoekers` : undefined}
          />
        </div>
      </DashBlock>

      {!loading && !error && data ? (
        <>
          <DashBlock
            title="Verkeer uitsplitsing"
            description="Nieuwe vs. terugkerende weergaven, plus herkomst."
          >
            <div className="grid gap-4 rounded-2xl border border-neutral-800 bg-[#111] p-4 text-white lg:grid-cols-[160px_minmax(0,1fr)]">
              <div className="flex flex-col items-center justify-center">
                <Donut newShare={newShare} returningShare={returningShare} />
                <div className="mt-3 space-y-1 text-center text-[11px] text-white/55">
                  <p>
                    <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-emerald-400" />
                    Nieuw {Math.round(newShare * 100)}%
                  </p>
                  <p>
                    <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-white/25" />
                    Terugkerend {Math.round(returningShare * 100)}%
                  </p>
                </div>
              </div>
              <ol className="space-y-3">
                {(Object.keys(channelLabels) as (keyof ChannelCounts)[]).map((key) => {
                  const value = channels[key]
                  const pct = Math.round((value / channelTotal) * 100)
                  return (
                    <li key={key}>
                      <div className="mb-1 flex items-center justify-between text-[12px]">
                        <span className="font-medium text-white/90">{channelLabels[key]}</span>
                        <span className="tabular-nums text-white/45">
                          {number(value)} · {pct}%
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-emerald-400/85"
                          style={{ width: `${Math.max(value ? 6 : 0, pct)}%` }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>
          </DashBlock>
        </>
      ) : null}
    </>
  )
}

function DashBlock({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="mb-5">
      <div className="mb-3 border-l-2 border-emerald-500 pl-3">
        <h3 className="text-sm font-semibold tracking-tight text-neutral-900">{title}</h3>
        <p className="mt-0.5 text-xs text-neutral-500">{description}</p>
      </div>
      {children}
    </section>
  )
}

function InsightCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-[#111] px-3 py-3 text-white">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold tracking-wider text-white/40 uppercase">{label}</p>
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/8 text-neutral-300">
          {icon}
        </span>
      </div>
      <p className="mt-1 truncate text-xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-white/40">{hint}</p> : null}
    </div>
  )
}

function SortHead({
  children,
  active,
  dir,
  onClick,
}: {
  children: ReactNode
  active: boolean
  dir: 'asc' | 'desc'
  onClick: () => void
}) {
  return (
    <th className="px-4 py-3">
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 font-semibold ${
          active ? 'text-emerald-300' : 'text-white/40 hover:text-white/70'
        }`}
      >
        {children}
        {active ? (dir === 'desc' ? '↓' : '↑') : ''}
      </button>
    </th>
  )
}

function Metric({
  icon,
  label,
  value,
  delta,
  hideDelta,
}: {
  icon: ReactNode
  label: string
  value: string
  delta: number
  hideDelta?: boolean
}) {
  const positive = delta >= 0
  return (
    <div className="relative overflow-hidden rounded-lg bg-white/[0.04] px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] text-white/45">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 flex items-end gap-1.5">
        <span className="text-2xl font-semibold tracking-tight text-white">{value}</span>
        {hideDelta ? null : (
          <span
            className={`mb-1 inline-flex items-center gap-0.5 text-[11px] font-medium ${
              positive ? 'text-emerald-300' : 'text-red-400'
            }`}
          >
            {positive ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {delta >= 0 ? '+' : ''}
            {delta}%
          </span>
        )}
      </div>
    </div>
  )
}

function RankedList({
  title,
  rows,
  label,
  icon,
}: {
  title: string
  rows: MetricRow[]
  label: (row: MetricRow) => string
  icon?: ReactNode
}) {
  const list = Array.isArray(rows) ? rows : []
  const max = Math.max(1, ...list.map((row) => row.pageviews || 0), 1)
  return (
    <div className="border-t border-white/10 p-3 xl:border-t-0 xl:border-l xl:first:border-l-0">
      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-white/45 uppercase">
        {icon}
        {title}
      </p>
      {list.length === 0 ? (
        <p className="text-[11px] text-white/30">Nog geen gegevens</p>
      ) : (
        <ol className="space-y-1.5">
          {list.slice(0, 4).map((row, index) => {
            const pct = Math.round(((row.pageviews || 0) / max) * 100)
            return (
              <li key={`${label(row)}-${index}`}>
                <div className="mb-0.5 flex items-center gap-2 text-[11px]">
                  <span className="w-3 text-white/30">{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate font-medium text-white/90">
                    {label(row)}
                  </span>
                  <span className="tabular-nums text-white/55">
                    {number(row.pageviews || 0)}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-400/80"
                    style={{ width: `${Math.max(6, pct)}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

function CompactPlaces({
  title,
  rows,
  icon,
  emptyHint,
}: {
  title: string
  icon?: ReactNode
  emptyHint?: string
  rows: {
    key: string
    flag?: string
    label: string
    hint?: string
    value: number
    max: number
  }[]
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-white/45 uppercase">
        {icon}
        {title}
      </p>
      {rows.length === 0 ? (
        <p className="text-[11px] text-white/30">{emptyHint || 'Nog geen gegevens'}</p>
      ) : (
        <ol className="space-y-1.5">
          {rows.map((row) => {
            const pct = Math.round((row.value / Math.max(1, row.max)) * 100)
            return (
              <li key={row.key}>
                <div className="mb-0.5 flex items-center gap-1.5 text-[11px]">
                  {row.flag ? <span aria-hidden>{row.flag}</span> : null}
                  <span className="min-w-0 flex-1 truncate font-medium text-white/90">
                    {row.label}
                    {row.hint ? (
                      <span className="ml-1 font-normal text-white/35">{row.hint}</span>
                    ) : null}
                  </span>
                  <span className="tabular-nums text-white/45">{number(row.value)}</span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-400/80"
                    style={{ width: `${Math.max(6, pct)}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

function AreaChart({ rows }: { rows: MetricRow[] }) {
  const points = rows.length
    ? rows
    : [{ timestamp: 'empty', pageviews: 0, visitors: 0 }]
  const max = Math.max(1, ...points.map((row) => row.pageviews || 0))
  const w = 640
  const h = 56
  const step = points.length > 1 ? w / (points.length - 1) : w
  const coords = points.map((row, index) => {
    const x = index * step
    const y = h - ((row.pageviews || 0) / max) * (h - 8) - 4
    return `${x},${y}`
  })
  const line = coords.join(' ')
  const area = `0,${h} ${line} ${w},${h}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-14 w-full overflow-visible" aria-hidden>
      <defs>
        <linearGradient id="traffic-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill="url(#traffic-fill)" points={area} />
      <polyline
        fill="none"
        stroke="#22c55e"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={line}
      />
    </svg>
  )
}

function Donut({
  newShare,
  returningShare,
}: {
  newShare: number
  returningShare: number
}) {
  const r = 36
  const c = 2 * Math.PI * r
  const newLen = c * newShare
  return (
    <svg viewBox="0 0 100 100" className="h-24 w-24" aria-hidden>
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="12"
        strokeDasharray={`${c * returningShare} ${c}`}
        strokeDashoffset={0}
        transform="rotate(-90 50 50)"
      />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="#22c55e"
        strokeWidth="12"
        strokeDasharray={`${newLen} ${c}`}
        strokeDashoffset={-c * returningShare}
        transform="rotate(-90 50 50)"
      />
    </svg>
  )
}
