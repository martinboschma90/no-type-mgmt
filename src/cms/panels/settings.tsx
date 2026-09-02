import { createCmsPanel } from '@/cms/panels/createCmsPanel.tsx'
import { SettingsEditor } from '@/cms/editors/SettingsEditor'

function EmptyPreview() {
  return null
}

export default createCmsPanel(SettingsEditor, EmptyPreview)
