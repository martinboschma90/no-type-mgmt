import { CMS_STORAGE_KEY, type CmsContent } from '@/cms/content'
import { storageGet } from '@/lib/safeStorage'

function parseStored(raw: string | null): unknown {
  if (!raw) return null
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return raw
  }
}

/** Download CMS localStorage + live editor state as JSON. Does not reset. */
export function downloadCmsBackup(content: CmsContent) {
  const raw = storageGet(CMS_STORAGE_KEY)
  const payload = {
    exportedAt: new Date().toISOString(),
    storageKey: CMS_STORAGE_KEY,
    localStorage: parseStored(raw),
    content,
  }
  const stamp = payload.exportedAt.slice(0, 19).replace(/[:T]/g, '-')
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `notype-cms-backup-${stamp}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
