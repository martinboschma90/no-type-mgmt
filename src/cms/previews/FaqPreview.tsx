import { motion } from 'framer-motion'
import { FaqHub } from '@/components/faq/FaqHub'
import { AppShell } from '@/components/layout/AppShell'
import { useCms } from '@/cms/CmsProvider'
import { PreviewFrame } from '@/cms/previews/PreviewFrame'

export function FaqPreview() {
  const { content } = useCms()
  const { site } = content

  return (
    <PreviewFrame label="FAQ">
      <AppShell navVariant="wordmark">
      <div className="px-4 pb-20 pt-24 sm:px-6 sm:pt-28 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          {!site.faqVisible ? (
            <p className="type-body mb-4 rounded-xl border border-ink/10 bg-ink/5 px-3 py-2 text-xs text-ink/50">
              Page hidden — /faq redirects home.
            </p>
          ) : null}

          <motion.div initial={false}>
            {site.faqVisible !== false ? (
              <FaqHub
                title={site.faqTitle.trim() || 'Promoter FAQ'}
                intro={site.faqIntro}
                categories={site.faqCategories}
              />
            ) : (
              <p className="type-body text-sm text-ink/40">
                Enable visibility to preview the FAQ page.
              </p>
            )}
          </motion.div>
        </div>
      </div>
      </AppShell>
    </PreviewFrame>
  )
}
