import { Footer } from '@/components/layout/Footer'
import { PreviewFrame } from '@/cms/previews/PreviewFrame'

export function FooterPreview() {
  return (
    <PreviewFrame label="Footer">
      <div className="min-h-[50vh] bg-[var(--body-bg)] pt-16">
        <Footer />
      </div>
    </PreviewFrame>
  )
}
