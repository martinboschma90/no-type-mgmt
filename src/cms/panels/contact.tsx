import { createCmsPanel } from '@/cms/panels/createCmsPanel.tsx'
import { ContactEditor } from '@/cms/editors/ContactEditor'
import { ContactPreview } from '@/cms/previews/ContactPreview'

export default createCmsPanel(ContactEditor, ContactPreview)
