import { CmsAuthGate } from '@/cms/auth/CmsAuthGate'
import { CmsLayout } from '@/cms/CmsLayout'
import { MediaProvider } from '@/cms/media/MediaProvider'

/** CMS-only shell — keeps media IndexedDB / upload code off public pages. */
export function CmsShell() {
  return (
    <MediaProvider>
      <CmsAuthGate>
        <CmsLayout />
      </CmsAuthGate>
    </MediaProvider>
  )
}
