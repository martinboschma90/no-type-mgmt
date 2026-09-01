import { createCmsPanel } from '@/cms/panels/createCmsPanel.tsx'
import { ArtistsIndexEditor } from '@/cms/editors/ArtistsIndexEditor'
import { ArtistsIndexPreview } from '@/cms/previews/ArtistsIndexPreview'

export default createCmsPanel(ArtistsIndexEditor, ArtistsIndexPreview)
