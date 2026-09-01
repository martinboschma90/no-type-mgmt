import { createCmsPanel } from '@/cms/panels/createCmsPanel.tsx'
import { RosterEditor } from '@/cms/editors/RosterEditor'
import { RosterPreview } from '@/cms/previews/RosterPreview'

export default createCmsPanel(RosterEditor, RosterPreview)
