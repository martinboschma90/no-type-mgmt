import { PreviewFrame } from '@/cms/previews/PreviewFrame'

export function SettingsPreview() {
  return (
    <PreviewFrame label="Settings">
      <div className="space-y-4 p-6 sm:p-8">
        <p className="type-label text-[0.65rem] tracking-[0.16em] text-ink/40 uppercase">
          CMS
        </p>
        <h3 className="type-headline mt-2 text-[clamp(1.4rem,3vw,2rem)] text-ink">
          Instellingen
        </h3>
        <p className="type-body max-w-md text-sm text-ink/50">
          Account and destructive actions live here so they stay off the main
          sidebar. Reset still uses the same restore-to-defaults logic.
        </p>
      </div>
    </PreviewFrame>
  )
}
