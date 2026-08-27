import { createCmsPanel } from '@/cms/panels/createCmsPanel.tsx'
import { SettingsEditor } from '@/cms/editors/SettingsEditor'
import { SettingsPreview } from '@/cms/previews/SettingsPreview'

export default createCmsPanel(SettingsEditor, SettingsPreview)
