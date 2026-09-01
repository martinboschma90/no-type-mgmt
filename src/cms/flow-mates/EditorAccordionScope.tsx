import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useSearchParams } from 'react-router-dom'
import { SectionAccordionToolbar } from '@/cms/flow-mates/SectionAccordionToolbar'

type EditorAccordionContextValue = {
  register: (id: string, defaultOpen: boolean) => void
  unregister: (id: string) => void
  hasSection: (id: string) => boolean
  isOpen: (id: string) => boolean
  setOpen: (id: string, open: boolean) => void
}

const EditorAccordionContext = createContext<EditorAccordionContextValue | null>(null)

export function EditorAccordionScope({ children }: { children: ReactNode }) {
  const [searchParams] = useSearchParams()
  const requestedSection = searchParams.get('section')
  const [sectionIds, setSectionIds] = useState<string[]>([])
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set())

  const register = useCallback(
    (id: string, defaultOpen: boolean) => {
      setSectionIds((current) => (current.includes(id) ? current : [...current, id]))
      if (defaultOpen || requestedSection === id) {
        setOpenIds((current) => {
          if (current.has(id)) return current
          const next = new Set(current)
          next.add(id)
          return next
        })
      }
      if (requestedSection === id) {
        window.requestAnimationFrame(() => {
          document
            .getElementById(`cms-editor-section-${id}`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
      }
    },
    [requestedSection],
  )

  const unregister = useCallback((id: string) => {
    setSectionIds((current) => current.filter((candidate) => candidate !== id))
    setOpenIds((current) => {
      if (!current.has(id)) return current
      const next = new Set(current)
      next.delete(id)
      return next
    })
  }, [])

  const setOpen = useCallback((id: string, open: boolean) => {
    setOpenIds((current) => {
      const next = new Set(current)
      if (open) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const context = useMemo<EditorAccordionContextValue>(
    () => ({
      register,
      unregister,
      hasSection: (id) => sectionIds.includes(id),
      isOpen: (id) => openIds.has(id),
      setOpen,
    }),
    [openIds, register, sectionIds, setOpen, unregister],
  )

  const openCount = sectionIds.reduce(
    (count, id) => count + (openIds.has(id) ? 1 : 0),
    0,
  )
  const total = sectionIds.length

  return (
    <EditorAccordionContext.Provider value={context}>
      {total > 0 ? (
        <SectionAccordionToolbar
          openCount={openCount}
          total={total}
          allOpen={openCount === total}
          allClosed={openCount === 0}
          onExpandAll={() => setOpenIds(new Set(sectionIds))}
          onCollapseAll={() => setOpenIds(new Set())}
        />
      ) : null}
      {children}
    </EditorAccordionContext.Provider>
  )
}

export function useEditorAccordion() {
  return useContext(EditorAccordionContext)
}
