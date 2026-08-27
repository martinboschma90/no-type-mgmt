import { createCmsPanel } from '@/cms/panels/createCmsPanel.tsx'
import { HomeEditor } from '@/cms/editors/HomeEditor'
import { HomePreview } from '@/cms/previews/HomePreview'

export default createCmsPanel(HomeEditor, HomePreview)
