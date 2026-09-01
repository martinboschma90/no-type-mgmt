import { useCallback, useMemo, useRef, useState } from 'react'
import {
  Check,
  ChevronDown,
  Clipboard,
  Cloud,
  Film,
  FolderOpen,
  Image as ImageIcon,
  Search,
  Trash2,
  Upload,
} from 'lucide-react'
import { useMedia } from '@/cms/media/MediaProvider'
import type { MediaAsset, MediaKind } from '@/cms/media/types'

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function formatDuration(seconds?: number) {
  if (!seconds || !Number.isFinite(seconds)) return null
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

type MediaFilter = 'all' | MediaKind
type MediaSort = 'newest' | 'oldest' | 'name'

type MediaLibraryProps = {
  /** When set, clicking an asset selects it for the active field. */
  onSelect?: (asset: MediaAsset) => void
  selectKind?: 'image' | 'video' | 'any'
  /** Compact version used inside media fields. */
  compact?: boolean
}

export function MediaLibrary({
  onSelect,
  selectKind = 'any',
  compact = Boolean(onSelect),
}: MediaLibraryProps) {
  const {
    assets,
    ready,
    syncingRemote,
    uploading,
    uploadFiles,
    removeAsset,
    clearAll,
  } = useMedia()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<MediaFilter>(
    selectKind === 'any' ? 'all' : selectKind,
  )
  const [sort, setSort] = useState<MediaSort>('newest')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleFiles = useCallback(
    async (files: FileList | File[] | null) => {
      if (!files || files.length === 0) return
      setError(null)
      try {
        await uploadFiles(files)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Uploaden mislukt')
      }
    },
    [uploadFiles],
  )

  const allowedAssets = useMemo(
    () =>
      assets.filter(
        (asset) => selectKind === 'any' || asset.kind === selectKind,
      ),
    [assets, selectKind],
  )

  const visible = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('nl')
    const result = allowedAssets.filter((asset) => {
      if (filter !== 'all' && asset.kind !== filter) return false
      return !normalizedQuery || asset.name.toLocaleLowerCase('nl').includes(normalizedQuery)
    })

    return [...result].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name, 'nl')
      if (sort === 'oldest') return a.createdAt - b.createdAt
      return b.createdAt - a.createdAt
    })
  }, [allowedAssets, filter, query, sort])

  const imageCount = allowedAssets.filter((asset) => asset.kind === 'image').length
  const videoCount = allowedAssets.filter((asset) => asset.kind === 'video').length
  const localCount = allowedAssets.filter((asset) => !asset.publicUrl).length

  const openUpload = () => inputRef.current?.click()

  const dragProps = {
    onDragEnter: (event: React.DragEvent) => {
      event.preventDefault()
      setDragOver(true)
    },
    onDragOver: (event: React.DragEvent) => {
      event.preventDefault()
      setDragOver(true)
    },
    onDragLeave: (event: React.DragEvent) => {
      event.preventDefault()
      if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragOver(false)
    },
    onDrop: (event: React.DragEvent) => {
      event.preventDefault()
      setDragOver(false)
      void handleFiles(event.dataTransfer.files)
    },
  }

  const hiddenInput = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*,video/*,.webp,.webm"
      multiple
      className="sr-only"
      onChange={(event) => {
        void handleFiles(event.target.files)
        event.target.value = ''
      }}
    />
  )

  if (compact) {
    return (
      <div className="space-y-3" {...dragProps}>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[12rem] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Zoek media…"
              className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3 text-xs text-neutral-900 outline-none focus:border-neutral-500"
            />
          </div>
          <button
            type="button"
            onClick={openUpload}
            className="cms-secondary-action inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700"
          >
            <Upload className="h-3.5 w-3.5" />
            Uploaden
          </button>
          {hiddenInput}
        </div>
        {error ? <p className="text-xs text-red-500">{error}</p> : null}
        <AssetGrid
          assets={visible}
          onSelect={onSelect}
          onRemove={removeAsset}
          copiedId={copiedId}
          onCopy={setCopiedId}
          compact
        />
      </div>
    )
  }

  return (
    <section
      className={[
        'relative min-h-[64vh] overflow-hidden rounded-2xl border bg-white transition-colors',
        dragOver ? 'border-neutral-500 ring-4 ring-neutral-500/10' : 'border-neutral-200',
      ].join(' ')}
      {...dragProps}
    >
      {dragOver ? (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-white/90 backdrop-blur-sm">
          <div className="rounded-2xl border border-dashed border-neutral-400 px-12 py-10 text-center">
            <Upload className="mx-auto mb-3 h-6 w-6 text-neutral-700" />
            <p className="text-sm font-semibold text-neutral-900">Laat los om te uploaden</p>
          </div>
        </div>
      ) : null}

      <div className="flex min-h-[64vh]">
        <aside className="cms-media-sidebar hidden w-52 shrink-0 border-r border-neutral-200 bg-neutral-50 p-4 lg:block">
          <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400">
            Bibliotheek
          </p>
          <MediaNavButton
            active={filter === 'all'}
            icon={<FolderOpen className="h-3.5 w-3.5" />}
            label="Alle media"
            count={allowedAssets.length}
            onClick={() => setFilter('all')}
          />
          {selectKind !== 'video' ? (
            <MediaNavButton
              active={filter === 'image'}
              icon={<ImageIcon className="h-3.5 w-3.5" />}
              label="Afbeeldingen"
              count={imageCount}
              onClick={() => setFilter('image')}
            />
          ) : null}
          {selectKind !== 'image' ? (
            <MediaNavButton
              active={filter === 'video'}
              icon={<Film className="h-3.5 w-3.5" />}
              label="Video's"
              count={videoCount}
              onClick={() => setFilter('video')}
            />
          ) : null}

          <div className="mt-8 border-t border-neutral-200 pt-5">
            <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400">
              Opslag
            </p>
            <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs text-neutral-600">
              <span className="inline-flex items-center gap-2">
                <Cloud className="h-3.5 w-3.5" />
                Supabase
              </span>
              <span className="tabular-nums">{allowedAssets.length - localCount}</span>
            </div>
            {localCount > 0 ? (
              <p className="mt-2 rounded-lg bg-amber-500/10 px-2.5 py-2 text-[10px] leading-relaxed text-amber-700">
                {localCount} {localCount === 1 ? 'bestand staat' : 'bestanden staan'} alleen lokaal.
              </p>
            ) : null}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 sm:px-5">
            <div>
              <p className="text-sm font-semibold text-neutral-900">Alle media</p>
              <p className="mt-0.5 text-[11px] text-neutral-500">
                {ready ? `${allowedAssets.length} bestanden` : 'Media laden…'}
                {syncingRemote ? ' · synchroniseren…' : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={openUpload}
              className="cms-primary-action inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
            >
              <Upload className="h-3.5 w-3.5" />
              Uploaden
            </button>
            {hiddenInput}
          </div>

          {uploading ? (
            <div className="border-b border-emerald-500/20 bg-emerald-500/10 px-5 py-2 text-[11px] text-emerald-700">
              {uploading.stage} · {uploading.fileName}
              {uploading.message ? ` — ${uploading.message}` : ''}
            </div>
          ) : null}
          {error ? (
            <div className="border-b border-red-500/20 bg-red-500/10 px-5 py-2 text-[11px] text-red-600">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 px-4 py-3 sm:px-5">
            <div className="relative min-w-[14rem] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Zoek op bestandsnaam…"
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-9 pr-3 text-xs text-neutral-900 outline-none transition-colors focus:border-neutral-500 focus:bg-white"
              />
            </div>
            <div className="flex items-center gap-1 lg:hidden">
              <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
                Alles
              </FilterButton>
              {selectKind !== 'video' ? (
                <FilterButton active={filter === 'image'} onClick={() => setFilter('image')}>
                  Foto's
                </FilterButton>
              ) : null}
              {selectKind !== 'image' ? (
                <FilterButton active={filter === 'video'} onClick={() => setFilter('video')}>
                  Video's
                </FilterButton>
              ) : null}
            </div>
            <label className="relative">
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as MediaSort)}
                className="appearance-none rounded-lg border border-neutral-200 bg-white py-2 pl-3 pr-8 text-xs font-medium text-neutral-600 outline-none hover:border-neutral-400"
              >
                <option value="newest">Nieuwste</option>
                <option value="oldest">Oudste</option>
                <option value="name">Naam</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
            </label>
          </div>

          <div className="p-4 sm:p-5">
            <AssetGrid
              assets={visible}
              onSelect={onSelect}
              onRemove={removeAsset}
              copiedId={copiedId}
              onCopy={setCopiedId}
            />
            {assets.length > 0 ? (
              <div className="mt-8 flex justify-end border-t border-neutral-200 pt-4">
                <button
                  type="button"
                  className="text-[11px] font-medium text-neutral-400 hover:text-red-500"
                  onClick={() => {
                    if (window.confirm('Alle media uit deze bibliotheek verwijderen?')) {
                      void clearAll()
                    }
                  }}
                >
                  Bibliotheek leegmaken
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

function MediaNavButton({
  active,
  icon,
  label,
  count,
  onClick,
}: {
  active: boolean
  icon: React.ReactNode
  label: string
  count: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'mb-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors',
        active
          ? 'bg-neutral-900 font-medium text-white'
          : 'text-neutral-600 hover:bg-neutral-200/60 hover:text-neutral-900',
      ].join(' ')}
    >
      {icon}
      <span className="flex-1">{label}</span>
      <span className={active ? 'text-white/60' : 'text-neutral-400'}>{count}</span>
    </button>
  )
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-lg px-2.5 py-2 text-[11px] font-medium transition-colors',
        active ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:bg-neutral-100',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function AssetGrid({
  assets,
  onSelect,
  onRemove,
  copiedId,
  onCopy,
  compact = false,
}: {
  assets: MediaAsset[]
  onSelect?: (asset: MediaAsset) => void
  onRemove: (id: string) => void | Promise<void>
  copiedId: string | null
  onCopy: (id: string | null) => void
  compact?: boolean
}) {
  if (assets.length === 0) {
    return (
      <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-6 text-center">
        <FolderOpen className="mb-3 h-5 w-5 text-neutral-300" />
        <p className="text-sm font-medium text-neutral-700">Geen media gevonden</p>
        <p className="mt-1 text-xs text-neutral-400">Upload een bestand of pas je zoekopdracht aan.</p>
      </div>
    )
  }

  return (
    <ul
      className={
        compact
          ? 'grid grid-cols-2 gap-3 sm:grid-cols-3'
          : 'grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
      }
    >
      {assets.map((asset) => (
        <li key={asset.id}>
          <article className="group overflow-hidden rounded-xl border border-neutral-200 bg-white transition-shadow hover:shadow-md">
            <button
              type="button"
              className="relative block aspect-[4/3] w-full overflow-hidden bg-neutral-100 text-left"
              onClick={() => onSelect?.(asset)}
              disabled={!onSelect}
            >
              {asset.kind === 'image' ? (
                <img
                  src={asset.url}
                  alt={asset.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                />
              ) : (
                <video
                  src={asset.url}
                  muted
                  playsInline
                  className="h-full w-full object-cover"
                  onMouseEnter={(event) => {
                    void event.currentTarget.play().catch(() => undefined)
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.pause()
                    event.currentTarget.currentTime = 0
                  }}
                />
              )}
              <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-1 text-[9px] font-medium text-white backdrop-blur">
                {asset.kind === 'video' ? <Film className="h-2.5 w-2.5" /> : <ImageIcon className="h-2.5 w-2.5" />}
                {asset.kind === 'image'
                  ? 'WebP'
                  : asset.mimeType.includes('webm')
                    ? 'WebM'
                    : 'Video'}
              </span>
              {asset.publicUrl ? (
                <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-emerald-600 px-1.5 py-1 text-[9px] font-medium text-white">
                  <Check className="h-2.5 w-2.5" />
                  Online
                </span>
              ) : null}
            </button>

            <div className="p-2.5">
              <p className="truncate text-xs font-medium text-neutral-800" title={asset.name}>
                {asset.name}
              </p>
              <p className="mt-1 truncate text-[10px] text-neutral-400">
                {formatBytes(asset.size)}
                {asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : null}
                {asset.kind === 'video' && formatDuration(asset.duration)
                  ? ` · ${formatDuration(asset.duration)}`
                  : null}
              </p>
              <div className="mt-2 flex items-center gap-1">
                <button
                  type="button"
                  className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[10px] font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                  onClick={() => {
                    void navigator.clipboard.writeText(asset.publicUrl || `media://${asset.id}`)
                    onCopy(asset.id)
                    window.setTimeout(() => onCopy(null), 1500)
                  }}
                >
                  {copiedId === asset.id ? <Check className="h-3 w-3" /> : <Clipboard className="h-3 w-3" />}
                  {copiedId === asset.id ? 'Gekopieerd' : 'Kopieer'}
                </button>
                <button
                  type="button"
                  aria-label={`${asset.name} verwijderen`}
                  className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 hover:bg-red-500/10 hover:text-red-500"
                  onClick={() => {
                    if (window.confirm(`${asset.name} verwijderen?`)) void onRemove(asset.id)
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </article>
        </li>
      ))}
    </ul>
  )
}
