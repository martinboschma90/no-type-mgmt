import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  MonitorSmartphone,
  MousePointer2,
  RefreshCw,
  Users,
} from 'lucide-react'
import { useAuth } from '@/cms/auth/AuthProvider'
import { useCms } from '@/cms/CmsProvider'

type MetricRow = {
  timestamp?: string
  requestPath?: string
  referrerHostname?: string
  country?: string
  deviceType?: string
  pageviews: number
  visitors: number
}

type TrafficData = {
  totals: { pageviews: number; visitors: number }
  previous: { pageviews: number; visitors: number }
  trend: MetricRow[]
  pages: MetricRow[]
  artists: MetricRow[]
  referrers: MetricRow[]
  countries: MetricRow[]
  devices: MetricRow[]
  countryArtists: MetricRow[]
}

const periods = [7, 30, 90] as const

function asList(value: unknown): MetricRow[] {
  return Array.isArray(value) ? value : []
}

function number(value: number) {
  return new Intl.NumberFormat('nl-NL').format(value || 0)
}

function change(current: number, previous: number) {
  if (!previous) return current ? '+100%' : '0%'
  const percentage = ((current - previous) / previous) * 100
  return `${percentage >= 0 ? '+' : ''}${Math.round(percentage)}%`
}

function countryFlag(code?: string) {
  const country = code?.trim().toUpperCase()
  if (!country || country.length !== 2 || country === 'ZZ') return '🌍'
  const first = country.charCodeAt(0)
  const second = country.charCodeAt(1)
  if (first < 65 || first > 90 || second < 65 || second > 90) return '🌍'
  return String.fromCodePoint(127397 + first, 127397 + second)
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

export function TrafficDashboard() {
  const { session } = useAuth()
  const { content } = useCms()
  const [days, setDays] = useState<(typeof periods)[number]>(30)
  const [data, setData] = useState<TrafficData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

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
          countries: asList(payload.countries),
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
    return [...merged.values()].sort((a, b) => b.pageviews - a.pageviews).slice(0, 4)
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

    return countries.slice(0, 6).map((row) => {
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

  const trend = data?.trend ?? []
  const maxTrend = Math.max(1, ...trend.map((row) => row.pageviews || 0), 1)

  return (
    <section className="cms-traffic-panel mb-4 overflow-hidden rounded-2xl border border-neutral-800 bg-[#111] text-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-400/15">
            <Activity className="h-3.5 w-3.5 text-emerald-300" />
          </span>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-white">Website traffic</h3>
            <p className="text-[11px] text-white/45">Artiesten, landen, bronnen en apparaten</p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-white/5 p-1">
          {periods.map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setDays(period)}
              className={[
                'rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors',
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
          <div className="h-16 rounded-lg bg-white/5" />
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
          <div className="grid grid-cols-2 border-b border-white/10 sm:grid-cols-[1fr_1fr_1.3fr]">
            <Metric
              icon={<MousePointer2 className="h-3.5 w-3.5" />}
              label="Bezoeken"
              value={number(data.totals.pageviews)}
              delta={change(data.totals.pageviews, data.previous.pageviews)}
            />
            <Metric
              icon={<Users className="h-3.5 w-3.5" />}
              label="Unieke bezoekers"
              value={number(data.totals.visitors)}
              delta={change(data.totals.visitors, data.previous.visitors)}
            />
            <div className="col-span-2 hidden h-14 items-end gap-px px-4 py-3 sm:col-span-1 sm:flex">
              {(trend.length ? trend : [{ timestamp: 'empty', pageviews: 0, visitors: 0 }]).map(
                (row, index) => (
                  <div
                    key={row.timestamp || index}
                    className="flex h-full min-w-0 flex-1 flex-col justify-end"
                  >
                    <div
                      className="rounded-sm bg-emerald-400/80"
                      style={{
                        height: `${Math.max(8, ((row.pageviews || 0) / maxTrend) * 100)}%`,
                      }}
                    />
                  </div>
                ),
              )}
            </div>
          </div>

          {countryCards.length > 0 ? (
            <div className="border-b border-white/10 px-3 py-3">
              <p className="mb-2.5 px-1 text-[10px] font-semibold tracking-wider text-white/45 uppercase">
                Landen en bekeken artiesten
              </p>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {countryCards.map((card) => (
                  <div
                    key={card.code || 'unknown'}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg leading-none" aria-hidden>
                        {countryFlag(card.code)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-semibold text-white">
                          {countryName(card.code)}
                        </p>
                        <p className="text-[10px] text-white/40">
                          {number(card.pageviews)} bezoeken
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 truncate text-[11px] text-white/70">
                      {card.artists.length
                        ? card.artists.map((artist) => artist.name).join(' · ')
                        : 'Nog geen artiestenpagina’s'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

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
  )
}

function Metric({
  icon,
  label,
  value,
  delta,
}: {
  icon: React.ReactNode
  label: string
  value: string
  delta: string
}) {
  const positive = !delta.startsWith('-')
  return (
    <div className="border-b border-white/10 px-4 py-3 sm:border-b-0 sm:border-r">
      <div className="flex items-center gap-1.5 text-[11px] text-white/45">
        {icon}
        {label}
      </div>
      <div className="mt-1 flex items-end gap-2">
        <span className="text-xl font-semibold tracking-tight text-white">{value}</span>
        <span className={`mb-0.5 text-[11px] font-medium ${positive ? 'text-emerald-300' : 'text-red-400'}`}>
          {delta}
        </span>
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
  icon?: React.ReactNode
}) {
  const list = Array.isArray(rows) ? rows : []
  const max = Math.max(1, ...list.map((row) => row.pageviews || 0), 1)
  return (
    <div className="border-t border-white/10 p-3.5 xl:border-t-0 xl:border-l xl:first:border-l-0">
      <p className="mb-2.5 flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-white/45 uppercase">
        {icon}
        {title}
      </p>
      {list.length === 0 ? (
        <p className="text-[11px] text-white/30">Nog geen gegevens</p>
      ) : (
        <ol className="space-y-1.5">
          {list.slice(0, 4).map((row, index) => (
            <li key={`${label(row)}-${index}`}>
              <div className="mb-0.5 flex items-center gap-2 text-[11px]">
                <span className="w-3 text-white/30">{index + 1}</span>
                <span className="min-w-0 flex-1 truncate font-medium text-white/90">{label(row)}</span>
                <span className="tabular-nums text-white/40">{number(row.pageviews || 0)}</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-400/80"
                  style={{ width: `${Math.max(6, ((row.pageviews || 0) / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
