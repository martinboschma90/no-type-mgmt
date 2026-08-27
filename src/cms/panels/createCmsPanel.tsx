import type { ComponentType } from 'react'
import type { CmsPanelProps } from '@/cms/panels/types'

/** Pair an editor and preview into one lazy route chunk. */
export function createCmsPanel(
  Editor: ComponentType,
  Preview: ComponentType,
) {
  return function CmsPanel({ slot }: CmsPanelProps) {
    return slot === 'preview' ? <Preview /> : <Editor />
  }
}
