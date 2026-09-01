import type { ComponentType } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FileText,
  FolderOpen,
  Home,
  Settings,
  Users,
} from 'lucide-react'
import { useCms } from '@/cms/CmsProvider'
import { useMedia } from '@/cms/media/MediaProvider'
import { PAGE_TABS } from '@/cms/flow-mates/PagesTabBar'
import { TrafficDashboard } from '@/cms/flow-mates/TrafficDashboard'

function relativeTime(ts: number | null): string {
  if (!ts) return '—'
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'zojuist'
  if (m < 60) return `${m} min geleden`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} uur geleden`
  const d = Math.floor(h / 24)
  return `${d} dag${d === 1 ? '' : 'en'} geleden`
}

const toneMap: Record<string, string> = {
  emerald: 'bg-emerald-500/10 text-emerald-500',
  amber: 'bg-neutral-100 text-neutral-500',
  sky: 'bg-neutral-100 text-neutral-500',
  rose: 'bg-neutral-100 text-neutral-500',
  violet: 'bg-neutral-100 text-neutral-500',
  neutral: 'bg-neutral-100 text-neutral-500',
}

function StatusCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  hint: string
  tone?: string
}) {
  return (
    <div className="cms-status-card rounded-xl border border-neutral-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
          {label}
        </p>
        <span
          className={`inline-flex h-6 w-6 items-center justify-center rounded-md ${toneMap[tone] ?? toneMap.neutral}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className="mt-2 truncate text-base font-semibold tracking-tight text-neutral-900">{value}</p>
      <p className="mt-0.5 truncate text-[10px] text-neutral-500">{hint}</p>
    </div>
  )
}

function ActionTile({
  to,
  label,
  description,
  icon: Icon,
  accent,
}: {
  to: string
  label: string
  description: string
  icon: ComponentType<{ className?: string }>
  accent: string
}) {
  return (
    <Link
      to={to}
      className="cms-action-card group relative flex flex-col rounded-xl border border-neutral-200 bg-white p-3 transition-colors duration-200 hover:border-neutral-400"
    >
      <div
        className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${accent}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="mt-2.5 text-sm font-semibold tracking-tight text-neutral-900">{label}</h3>
      <p className="mt-1 text-xs leading-relaxed text-neutral-500">{description}</p>
      <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-neutral-700 transition group-hover:gap-2 group-hover:text-neutral-900">
        Openen <ArrowUpRight className="h-3.5 w-3.5" />
      </div>
    </Link>
  )
}

/** First screen — same Frame CMS dashboard, Notype counts. */
export function DashboardHome() {
  const { content, savedAt } = useCms()
  const { assets } = useMedia()
  const pagesCount = PAGE_TABS.length
  const artistsCount = content.artists.length
  const mediaCount = assets.length

  return (
    <>
      <div className="relative mb-4 overflow-hidden rounded-xl border border-neutral-200 bg-[#181818] p-5 text-white">
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-xl">
            <h2 className="text-xl font-semibold tracking-tight">Welkom terug.</h2>
            <p className="mt-1 text-xs text-white/70">
              Bewerk content en houd de website up-to-date — alles op één plek.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-200 ring-1 ring-emerald-400/30">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Website online
            </div>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white"
            >
              Bekijk live site <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <StatusCard
          icon={CheckCircle2}
          label="Website status"
          value="Alles in orde"
          hint="Live en bereikbaar"
          tone="emerald"
        />
        <StatusCard
          icon={Clock}
          label="Laatste wijziging"
          value={relativeTime(savedAt)}
          hint="in het CMS"
          tone="amber"
        />
        <StatusCard
          icon={FileText}
          label="Pagina's"
          value={String(pagesCount)}
          hint="in het CMS"
          tone="sky"
        />
        <StatusCard
          icon={Users}
          label="Artiesten"
          value={String(artistsCount)}
          hint="artist pages"
          tone="rose"
        />
        <StatusCard
          icon={FolderOpen}
          label="Mediabibliotheek"
          value={String(mediaCount)}
          hint="afbeeldingen & video's"
          tone="neutral"
        />
        <StatusCard
          icon={Activity}
          label="Recente wijzigingen"
          value={savedAt ? '1' : '0'}
          hint="laatste opslag"
          tone="neutral"
        />
        <StatusCard
          icon={CheckCircle2}
          label="Publicatie"
          value="Live"
          hint="autosave aan"
          tone="emerald"
        />
      </div>

      <TrafficDashboard />

      <div className="mb-2">
        <h3 className="text-sm font-semibold tracking-tight text-neutral-900">Snelle acties</h3>
        <p className="text-xs text-neutral-500">
          Ga direct naar de onderdelen die je het vaakst bewerkt.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <ActionTile
          to="/cms/home"
          label="Homepage"
          description="Hero, tagline en merkinhoud."
          icon={Home}
          accent="bg-neutral-100 text-neutral-600"
        />
        <ActionTile
          to="/cms/artists"
          label="Artiesten"
          description="Roster, profielen en publicatie."
          icon={Users}
          accent="bg-neutral-100 text-neutral-600"
        />
        <ActionTile
          to="/cms/media"
          label="Media"
          description="Bibliotheek, WebP en WebM."
          icon={FolderOpen}
          accent="bg-neutral-100 text-neutral-600"
        />
        <ActionTile
          to="/cms/settings"
          label="Instellingen"
          description="Account en systeem."
          icon={Settings}
          accent="bg-neutral-100 text-neutral-600"
        />
      </div>
    </>
  )
}
