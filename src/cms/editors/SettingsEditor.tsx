import { useState } from 'react'
import { useAuth } from '@/cms/auth/AuthProvider'
import { useCms } from '@/cms/CmsProvider'
import { ResetContentModal } from '@/cms/editors/ResetContentModal'
import { EditorSection } from '@/cms/fields'

export function SettingsEditor() {
  const { content, resetContent, savedAt } = useCms()
  const { user, authRequired } = useAuth()
  const [resetOpen, setResetOpen] = useState(false)

  return (
    <>
      <EditorSection
        title="Account"
        description="Who is signed in to this CMS."
        defaultOpen
      >
        <p className="type-body text-sm text-ink/70">
          {authRequired
            ? user?.email ?? 'Signed in'
            : 'Local mode — no login required.'}
        </p>
        {savedAt ? (
          <p className="type-body text-xs text-ink/40">
            Last save {new Date(savedAt).toLocaleString('nl-BE')}
          </p>
        ) : null}
      </EditorSection>

      <EditorSection
        title="Danger zone"
        description="Destructive actions. These cannot be undone."
        defaultOpen
        badge="Danger"
      >
        <div className="rounded-xl border border-red-500/25 bg-red-500/5 px-4 py-4">
          <p className="type-headline m-0 text-sm text-ink">Reset content</p>
          <p className="type-body mt-1.5 text-xs text-ink/50">
            Restore all CMS content to the defaults shipped with the site. You
            will be asked to type RESET and can download a backup first.
          </p>
          <button
            type="button"
            onClick={() => setResetOpen(true)}
            className="type-label mt-4 rounded-xl border border-red-500/40 px-3.5 py-2.5 text-[0.65rem] tracking-[0.12em] text-red-600 uppercase transition-colors hover:bg-red-500/10 dark:text-red-400"
          >
            Reset content…
          </button>
        </div>
      </EditorSection>

      <ResetContentModal
        open={resetOpen}
        content={content}
        onClose={() => setResetOpen(false)}
        onConfirm={() => resetContent()}
      />
    </>
  )
}
