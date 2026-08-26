import { Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppShell } from '@/components/layout/AppShell'
import { FaqHub } from '@/components/faq/FaqHub'
import { useCms } from '@/cms/CmsContext'

export function FaqPage() {
  const { content } = useCms()
  const { site } = content

  if (site.faqVisible === false) {
    return <Navigate to="/" replace />
  }

  return (
    <AppShell navVariant="wordmark">
      <div className="px-4 pb-20 pt-24 sm:px-6 sm:pt-28 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <FaqHub
              title={site.faqTitle.trim() || 'Promoter FAQ'}
              intro={site.faqIntro}
              categories={site.faqCategories}
            />
          </motion.div>
        </div>
      </div>
    </AppShell>
  )
}
