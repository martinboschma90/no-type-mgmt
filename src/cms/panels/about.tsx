import { createCmsPanel } from '@/cms/panels/createCmsPanel.tsx'
import { AboutEditor } from '@/cms/editors/AboutEditor'
import { AboutPreview } from '@/cms/previews/AboutPreview'

export default createCmsPanel(AboutEditor, AboutPreview)
