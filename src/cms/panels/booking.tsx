import { createCmsPanel } from '@/cms/panels/createCmsPanel.tsx'
import { BookingEditor } from '@/cms/editors/BookingEditor'
import { BookingPreview } from '@/cms/previews/BookingPreview'

export default createCmsPanel(BookingEditor, BookingPreview)
