import { motion } from 'framer-motion'
import { FaqHub } from '@/components/faq/FaqHub'
import { useCms } from '@/cms/CmsProvider'
import { PreviewFrame } from '@/cms/previews/PreviewFrame'

export function FaqPreview() {
  const { content } = useCms()
  const { site } = content

  return (
    <PreviewFrame label="FAQ">
      <div className="px-4 pb-16 pt-14 sm:px-6">
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
    </PreviewFrame>
  )
}
