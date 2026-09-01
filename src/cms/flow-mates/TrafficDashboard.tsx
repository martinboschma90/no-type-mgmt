import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Globe2,
  MonitorSmartphone,
  MousePointer2,
  RefreshCw,
  Users,
} from 'lucide-react'
import { useAuth } from '@/cms/auth/AuthProvider'

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
  period: { days: number; since: string; until: string }
  totals: { pageviews: number; visitors: number }
  previous: { pageviews: number; visitors: number }
  trend: MetricRow[]
  pages: MetricRow[]
  referrers: MetricRow[]
  countries: MetricRow[]
  devices: MetricRow[]
}

const periods = [7, 30, 90] as const

function number(value: number) {
  return new Intl.NumberFormat('nl-NL').format(value || 0)
}

function change(current: number, previous: number) {
  if (!previous) return current ? '+100%' : '0%'
  const percentage = ((current - previous) / previous) * 100
  return `${percentage >= 0 ? '+' : ''}${Math.round(percentage)}%`
}

function formatDate(value?: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value))
}

function countryName(code?: string) {
  if (!code) return 'Onbekend'
  try {
    return new Intl.DisplayNames(['nl'], { type: 'region' }).of(code) || code
  } catch {
    return code
  }
}

const deviceNames: Record<string, string> = {
  desktop: 'Desktop',
  mobile: 'Mobiel',
  tablet: 'Tablet',
}

export function TrafficDashboard() {
  const { session } = useAuth()
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
        if (
          !payload?.totals ||
          !Array.isArray(payload.trend) ||
          !Array.isArray(payload.pages)
        ) {
          throw new Error('Analytics gaf nog geen geldige gegevens terug.')
        }
        return payload as TrafficData
      })
      .then(setData)
      .catch((reason) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return
        setError(reason instanceof Error ? reason.message : 'Analytics kon niet worden geladen.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [days, reloadKey, session?.access_token])

  const maxTrend = useMemo(
    () => Math.max(1, ...(data?.trend.map((row) => row.pageviews) || [1])),
    [data?.trend],
  )

  return (
    <section className="mb-8 overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-4 sm:px-5">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-neutral-500" />
            <h3 className="text-base font-semibold tracking-tight text-neutral-900">
              Website traffic
            </h3>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Alleen openbare pagina’s, gemeten door Vercel Analytics.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-neutral-100 p-1">
          {periods.map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setDays(period)}
              className={[
                'rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors',
                days === period
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900',
              ].join(' ')}
            >
              {period} dagen
            </button>
          ))}
        </div>
      </div>

      {loading ? <TrafficLoading /> : null}

      {!loading && error ? (
        <div className="flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center">
          <p className="max-w-lg text-sm font-medium text-neutral-800">{error}</p>
          <p className="mt-1 max-w-lg text-xs leading-relaxed text-neutral-500">
            Voeg de servervariabelen toe in Vercel en plaats de site daarna opnieuw online.
          </p>
          <button
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
            className="cms-secondary-action mt-4 inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Opnieuw proberen
          </button>
        </div>
      ) : null}

      {!loading && !error && data ? (
        <>
          <div className="grid border-b border-neutral-200 sm:grid-cols-2">
            <TrafficMetric
              icon={<MousePointer2 className="h-4 w-4" />}
              label="Bezoeken"
              value={number(data.totals.pageviews)}
              delta={change(data.totals.pageviews, data.previous.pageviews)}
            />
            <TrafficMetric
              icon={<Users className="h-4 w-4" />}
              label="Unieke bezoekers"
              value={number(data.totals.visitors)}
              delta={change(data.totals.visitors, data.previous.visitors)}
              border
            />
          </div>

          <div className="grid xl:grid-cols-[1.5fr_1fr]">
            <div className="border-b border-neutral-200 p-4 sm:p-5 xl:border-b-0 xl:border-r">
              <p className="mb-5 text-xs font-semibold text-neutral-700">Bezoeken per dag</p>
              <div className="flex h-44 items-end gap-1">
                {data.trend.map((row) => (
                  <div
                    key={row.timestamp}
                    className="group flex h-full min-w-0 flex-1 flex-col justify-end"
                    title={`${formatDate(row.timestamp)} · ${number(row.pageviews)} bezoeken`}
                  >
                    <div
                      className="min-h-1 rounded-sm bg-neutral-300 transition-colors group-hover:bg-neutral-800"
                      style={{ height: `${Math.max(3, (row.pageviews / maxTrend) * 100)}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-neutral-400">
                <span>{formatDate(data.trend[0]?.timestamp)}</span>
                <span>{formatDate(data.trend.at(-1)?.timestamp)}</span>
              </div>
            </div>

            <RankedList
              title="Populairste pagina’s"
              rows={data.pages}
              label={(row) => row.requestPath || '/'}
            />
          </div>

          <div className="grid border-t border-neutral-200 md:grid-cols-3">
            <RankedList
              icon={<Globe2 className="h-3.5 w-3.5" />}
              title="Verkeersbronnen"
              rows={data.referrers}
              label={(row) => row.referrerHostname || 'Direct'}
              compact
            />
            <RankedList
              title="Landen"
              rows={data.countries}
              label={(row) => countryName(row.country)}
              compact
              border
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
              compact
              border
            />
          </div>
        </>
      ) : null}
    </section>
  )
}

function TrafficMetric({
  icon,
  label,
  value,
  delta,
  border = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  delta: string
  border?: boolean
}) {
  const positive = !delta.startsWith('-')
  return (
    <div className={`p-4 sm:p-5 ${border ? 'sm:border-l sm:border-neutral-200' : ''}`}>
      <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
        {icon}
        {label}
      </div>
      <div className="mt-2 flex items-end gap-2">
        <span className="text-2xl font-semibold tracking-tight text-neutral-900">{value}</span>
        <span
          className={`mb-0.5 text-[11px] font-medium ${
            positive ? 'text-emerald-600' : 'text-red-500'
          }`}
        >
          {delta}
        </span>
      </div>
      <p className="mt-1 text-[10px] text-neutral-400">ten opzichte van vorige periode</p>
    </div>
  )
}

function RankedList({
  title,
  rows,
  label,
  icon,
  compact = false,
  border = false,
}: {
  title: string
  rows: MetricRow[]
  label: (row: MetricRow) => string
  icon?: React.ReactNode
  compact?: boolean
  border?: boolean
}) {
  const max = Math.max(1, ...rows.map((row) => row.pageviews))
  return (
    <div
      className={[
        compact ? 'p-4 sm:p-5' : 'p-4 sm:p-5',
        border ? 'border-t border-neutral-200 md:border-l md:border-t-0' : '',
      ].join(' ')}
    >
      <p className="mb-4 flex items-center gap-2 text-xs font-semibold text-neutral-700">
        {icon}
        {title}
      </p>
      {rows.length === 0 ? (
        <p className="text-xs text-neutral-400">Nog geen gegevens.</p>
      ) : (
        <ol className="space-y-3">
          {rows.slice(0, compact ? 5 : 8).map((row, index) => (
            <li key={`${label(row)}-${index}`}>
              <div className="mb-1 flex items-center gap-3 text-[11px]">
                <span className="min-w-0 flex-1 truncate font-medium text-neutral-700">
                  {label(row)}
                </span>
                <span className="tabular-nums text-neutral-400">{number(row.pageviews)}</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full bg-neutral-400"
                  style={{ width: `${Math.max(4, (row.pageviews / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function TrafficLoading() {
  return (
    <div className="animate-pulse p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-24 rounded-lg bg-neutral-100" />
        <div className="h-24 rounded-lg bg-neutral-100" />
      </div>
      <div className="mt-5 h-48 rounded-lg bg-neutral-100" />
    </div>
  )
}
