import { useMedia } from '@/cms/media/MediaProvider'
import { PreviewFrame } from '@/cms/previews/PreviewFrame'

export function MediaPreview() {
  const { assets, ready } = useMedia()
  const images = assets.filter((a) => a.kind === 'image').length
  const videos = assets.filter((a) => a.kind === 'video').length

  return (
    <PreviewFrame label="Media library">
      <div className="space-y-6 p-6 sm:p-8">
        <div>
          <p className="type-label text-[0.65rem] tracking-[0.16em] text-ink/40 uppercase">
            Converted assets
          </p>
          <h3 className="type-headline mt-2 text-[clamp(1.4rem,3vw,2rem)] text-ink">
            {ready ? `${assets.length} files` : 'Loading…'}
          </h3>
          <p className="type-body mt-2 text-sm text-ink/50">
            {images} WebP · {videos} WebM — stored locally in this browser.
          </p>
        </div>

        {assets.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {assets.slice(0, 9).map((asset) => (
              <div
                key={asset.id}
                className="overflow-hidden rounded-xl border border-ink/8 bg-cream-dark/40"
              >
                {asset.kind === 'image' ? (
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <video
                    src={asset.url}
                    muted
                    className="aspect-square w-full object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="type-body text-sm text-ink/40">
            Upload photos or videos on the left. Everything is converted to WebP / WebM.
          </p>
        )}
      </div>
    </PreviewFrame>
  )
}
