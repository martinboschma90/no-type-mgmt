import { createCmsPanel } from '@/cms/panels/createCmsPanel.tsx'
import { FaqEditor } from '@/cms/editors/FaqEditor'
import { FaqPreview } from '@/cms/previews/FaqPreview'

export default createCmsPanel(FaqEditor, FaqPreview)
