import { createCmsPanel } from '@/cms/panels/createCmsPanel.tsx'
import { FooterEditor } from '@/cms/editors/FooterEditor'
import { FooterPreview } from '@/cms/previews/FooterPreview'

export default createCmsPanel(FooterEditor, FooterPreview)
