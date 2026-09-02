import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Lock, UserPlus } from 'lucide-react'
import { useAuth } from '@/cms/auth/AuthProvider'
import { useCms } from '@/cms/CmsProvider'
import { ResetContentModal } from '@/cms/editors/ResetContentModal'
import { ArtistVisibilityToggle } from '@/cms/editors/ArtistVisibilityToggle'
import { EditorSection, TextArea, TextInput } from '@/cms/fields'

export function SettingsEditor() {
  const { content, setSite, resetContent, savedAt } = useCms()
  const { site } = content
  const { user, authRequired, canManageUsers, canSettings, signIn } = useAuth()
  const [resetOpen, setResetOpen] = useState(false)
  const [dangerUnlocked, setDangerUnlocked] = useState(false)
  const [dangerPassword, setDangerPassword] = useState('')
  const [dangerError, setDangerError] = useState<string | null>(null)
  const [dangerBusy, setDangerBusy] = useState(false)
  const publicUrl = site.publicSiteUrl || 'https://www.notype-mgmt.com'
  const httpsUrl = publicUrl.replace(/^http:\/\//i, 'https://')

  useEffect(() => {
    if (!dangerUnlocked) return
    const timer = window.setTimeout(() => {
      setDangerUnlocked(false)
      setDangerPassword('')
    }, 5 * 60 * 1000)
    return () => window.clearTimeout(timer)
  }, [dangerUnlocked])

  async function unlockDanger(event: FormEvent) {
    event.preventDefault()
    setDangerError(null)
    const email = user?.email?.trim()
    if (!authRequired || !email) {
      setDangerError('Gevarenzone is alleen beschikbaar na CMS-login.')
      return
    }
    if (!dangerPassword.trim()) {
      setDangerError('Vul je wachtwoord in.')
      return
    }
    setDangerBusy(true)
    const result = await signIn(email, dangerPassword)
    setDangerBusy(false)
    if (result.error) {
      setDangerError('Wachtwoord klopt niet.')
      return
    }
    setDangerUnlocked(true)
    setDangerPassword('')
  }

  return (
    <>
      <EditorSection
        title="Website"
        description="Standaardgegevens van de publieke site."
        defaultOpen
      >
        <TextInput
          label="Publieke URL"
          value={site.publicSiteUrl}
          placeholder="https://www.notype-mgmt.com"
          hint="Gebruik https://www.notype-mgmt.com. Dit wordt de canonieke link in Google en socials."
          onChange={(publicSiteUrl) => setSite((current) => ({ ...current, publicSiteUrl }))}
        />
        <TextInput
          label="Naam"
          value={site.name}
          onChange={(name) => setSite((current) => ({ ...current, name }))}
        />
        <TextInput
          label="Volledige naam"
          value={site.fullName}
          onChange={(fullName) => setSite((current) => ({ ...current, fullName }))}
        />
        <TextArea
          label="Tagline"
          value={site.tagline}
          rows={2}
          onChange={(tagline) => setSite((current) => ({ ...current, tagline }))}
        />
        <TextArea
          label="Meta beschrijving"
          value={site.metaDescription}
          rows={3}
          hint={`${(site.metaDescription || '').trim().length} tekens · mik op 70–170. Dit is de tekst in Google.`}
          onChange={(metaDescription) =>
            setSite((current) => ({ ...current, metaDescription }))
          }
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">
            Zichtbaar in Google
          </p>
          <ArtistVisibilityToggle
            visible={site.searchIndexing !== false}
            onLabel="Aan"
            offLabel="Uit"
            onChange={(searchIndexing) =>
              setSite((current) => ({ ...current, searchIndexing }))
            }
          />
        </div>
      </EditorSection>

      <EditorSection
        title="Beveiliging / slotje"
        description="Waarom de browser ‘Niet beveiligd’ kan tonen."
        defaultOpen
      >
        <p className="type-body text-sm text-ink/70">
          Dat slotje naast de URL gaat over <span className="font-medium">HTTPS</span>, niet over
          het CMS-wachtwoord. Als je <span className="font-mono text-xs">http://</span> ziet in
          de balk, zet Chrome “Niet beveiligd”.
        </p>
        <p className="type-body mt-3 text-sm text-ink/70">
          Open de site altijd via{' '}
          <a
            className="font-medium text-neutral-900 underline"
            href={httpsUrl}
            target="_blank"
            rel="noreferrer"
          >
            {httpsUrl}
          </a>
          . Het certificaat zelf activeer je in Vercel → Settings → Domains, tot
          daar een groen slotje / “Valid Certificate” staat.
        </p>
        <p className="type-body mt-3 text-sm text-ink/70">
          CMS-login blijft via Supabase. Booking-formulieren worden alleen vanaf dit
          domein geaccepteerd.
        </p>
      </EditorSection>

      <EditorSection
        title="Account"
        description="Wie is ingelogd in dit CMS."
        defaultOpen
      >
        <p className="type-body text-sm text-ink/70">
          {authRequired
            ? user?.email ?? 'Ingelogd'
            : 'Lokale modus — geen login nodig.'}
        </p>
        {savedAt ? (
          <p className="type-body text-xs text-ink/40">
            Laatste opslag {new Date(savedAt).toLocaleString('nl-BE')}
          </p>
        ) : null}
      </EditorSection>

      {canManageUsers ? (
        <EditorSection
          title="Team"
          description="Collega’s uitnodigen en rollen beheren."
          defaultOpen
        >
          <p className="type-body text-sm text-ink/70">
            Admins beheren CMS-toegang op een aparte pagina: uitnodigen, rol wijzigen
            (admin, editor, viewer) en accounts verwijderen.
          </p>
          <Link
            to="/cms/settings/users"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-3.5 py-2.5 text-xs font-medium text-white hover:bg-neutral-800"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Rollen en collega’s
          </Link>
        </EditorSection>
      ) : null}

      {canSettings ? (
        <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-4 sm:px-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
              <Lock className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-semibold text-neutral-900">Gevarenzone</p>
              <p className="mt-0.5 text-[11px] text-neutral-500">
                Destructieve acties. Alleen te openen met je CMS-wachtwoord.
              </p>
            </div>
          </div>

          {!dangerUnlocked ? (
            <form className="mt-4 space-y-3" onSubmit={(event) => void unlockDanger(event)}>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">
                  Wachtwoord
                </span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={dangerPassword}
                  onChange={(event) => setDangerPassword(event.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-900"
                  placeholder="Je CMS-wachtwoord"
                />
              </label>
              {dangerError ? <p className="text-xs text-red-600">{dangerError}</p> : null}
              <button
                type="submit"
                disabled={dangerBusy}
                className="rounded-lg border border-neutral-300 px-3.5 py-2 text-xs font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
              >
                {dangerBusy ? 'Controleren…' : 'Ontgrendelen'}
              </button>
            </form>
          ) : (
            <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/5 px-4 py-4">
              <p className="m-0 text-sm font-semibold text-neutral-900">CMS-inhoud resetten</p>
              <p className="type-body mt-1.5 text-xs text-ink/50">
                Zet alle CMS-content terug naar de standaard van de site. Je moet
                RESET typen en kunt eerst een backup downloaden. Vergrendelt automatisch
                na 5 minuten.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setResetOpen(true)}
                  className="rounded-lg border border-red-500/30 px-3.5 py-2.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/10"
                >
                  Reset content…
                </button>
                <button
                  type="button"
                  onClick={() => setDangerUnlocked(false)}
                  className="rounded-lg border border-neutral-200 px-3.5 py-2.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
                >
                  Vergrendelen
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      <ResetContentModal
        open={resetOpen}
        content={content}
        onClose={() => setResetOpen(false)}
        onConfirm={() => resetContent()}
      />
    </>
  )
}
