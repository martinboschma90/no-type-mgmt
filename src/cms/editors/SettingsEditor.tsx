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
        title="Live website"
        description="Welke URL de publieke site nu is."
        defaultOpen
      >
        <p className="type-body text-sm text-ink/70">
          Vercel-project <span className="font-medium text-neutral-900">no-type-mgmt</span> is
          gekoppeld aan{' '}
          <a
            className="font-medium text-neutral-900 underline"
            href="https://no-type-mgmt.vercel.app"
            target="_blank"
            rel="noreferrer"
          >
            no-type-mgmt.vercel.app
          </a>{' '}
          én aan <span className="font-medium text-neutral-900">notype-mgmt.com</span>.
          DNS wijst nog naar Mijndomein (
          <span className="font-mono text-xs">nsn1.mijndomein.nl</span>), niet naar
          Vercel. Daardoor zie je op .com de oude site.
        </p>
        <p className="type-body mt-3 text-sm text-ink/70">
          Bij Mijndomein: nameservers zetten op{' '}
          <span className="font-mono text-xs">ns1.vercel-dns.com</span> en{' '}
          <span className="font-mono text-xs">ns2.vercel-dns.com</span>, of een A-record{' '}
          <span className="font-mono text-xs">notype-mgmt.com → 76.76.21.21</span>.
          E-mail op dat domein blijft werken zolang MX-records niet overschreven
          worden — bij nameserver-wissel MX bij Vercel/Mijndomein nalopen.
        </p>
      </EditorSection>

      <EditorSection
        title="Danger zone"
        description="Destructive actions. These cannot be undone."
        defaultOpen
        badge="Danger"
      >
        <div className="rounded-xl border border-red-500/25 bg-red-500/5 px-4 py-4">
          <p className="m-0 text-sm font-semibold text-neutral-900">CMS-inhoud resetten</p>
          <p className="type-body mt-1.5 text-xs text-ink/50">
            Restore all CMS content to the defaults shipped with the site. You
            will be asked to type RESET and can download a backup first.
          </p>
          <button
            type="button"
            onClick={() => setResetOpen(true)}
            className="mt-4 rounded-lg border border-red-500/30 px-3.5 py-2.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/10"
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
