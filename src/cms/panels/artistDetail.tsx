import { createCmsPanel } from '@/cms/panels/createCmsPanel.tsx'
import { ArtistEditor } from '@/cms/editors/ArtistEditor'
import { ArtistPreview } from '@/cms/previews/ArtistPreview'

export default createCmsPanel(ArtistEditor, ArtistPreview)
