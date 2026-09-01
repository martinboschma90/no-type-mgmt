import { MediaArtistRepair } from '@/cms/media/MediaArtistRepair'
import { MediaLibrary } from '@/cms/media/MediaLibrary'
import { MediaPreview } from '@/cms/previews/MediaPreview'
import type { CmsPanelProps } from '@/cms/panels/types'

function MediaEditor() {
  return (
    <>
      <MediaArtistRepair />
      <div className="space-y-3">
        <MediaLibrary />
      </div>
    </>
  )
}

export default function CmsMediaPanel({ slot }: CmsPanelProps) {
  if (slot === 'preview') return <MediaPreview />
  return <MediaEditor />
}
