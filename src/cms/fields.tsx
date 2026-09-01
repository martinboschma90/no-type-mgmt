import { useEffect, useId, useState, type ChangeEvent, type ReactNode } from 'react'
import {
  ChevronDown,
  Eye,
  EyeOff,
  FileText,
  Image as ImageIcon,
  Pencil,
  Settings,
  X,
} from 'lucide-react'
import { Card, Tabs, inputCls } from '@/cms/flow-mates/cms-ui'
import { useEditorAccordion } from '@/cms/flow-mates/EditorAccordionScope'

type FieldProps = {
  label: string
  hint?: string
  children: ReactNode
}

export function Field({ label, hint, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">
        {label}
      </label>
      {children}
      {hint ? <p className="text-[11px] leading-relaxed text-neutral-500">{hint}</p> : null}
    </div>
  )
}

export const controlClass = inputCls
export const controlStyle = undefined

type TextInputProps = {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  placeholder?: string
}

export function TextInput({ label, value, onChange, hint, placeholder }: TextInputProps) {
  return (
    <Field label={label} hint={hint}>
      <input
        type="text"
        className={inputCls}
        value={value}
        placeholder={placeholder}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      />
    </Field>
  )
}

type TextAreaProps = {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  rows?: number
}

export function TextArea({ label, value, onChange, hint, rows = 4 }: TextAreaProps) {
  return (
    <Field label={label} hint={hint}>
      <textarea
        className={`${inputCls} min-h-[6rem] resize-y`}
        value={value}
        rows={rows}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
      />
    </Field>
  )
}

type SectionTab = {
  id: string
  label: string
  children: ReactNode
}

type EditorSectionProps = {
  title: string
  description?: string
  children?: ReactNode
  tabs?: SectionTab[]
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultTabId?: string
  badge?: string
  sectionKey?: string
  visible?: boolean
  onVisibleChange?: (visible: boolean) => void
}

function tabIcon(id: string) {
  if (id === 'media') return ImageIcon
  if (id === 'settings') return Settings
  return FileText
}

export function EditorSection({
  title,
  description,
  children,
  tabs,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  defaultTabId,
  badge,
  sectionKey,
  visible = true,
  onVisibleChange,
}: EditorSectionProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const generatedId = useId().replaceAll(':', '')
  const accordion = useEditorAccordion()
  const accordionRegister = accordion?.register
  const accordionUnregister = accordion?.unregister
  const id = sectionKey ?? generatedId
  const accordionOpen =
    accordion && accordion.hasSection(id) ? accordion.isOpen(id) : defaultOpen
  const open = openProp ?? (accordion ? accordionOpen : uncontrolledOpen)

  useEffect(() => {
    accordionRegister?.(id, defaultOpen)
    return () => accordionUnregister?.(id)
  }, [accordionRegister, accordionUnregister, defaultOpen, id])

  const setOpen = (next: boolean) => {
    if (openProp === undefined) {
      if (accordion) accordion.setOpen(id, next)
      else setUncontrolledOpen(next)
    }
    onOpenChange?.(next)
  }
  const [tabId, setTabId] = useState(defaultTabId ?? tabs?.[0]?.id ?? 'content')
  const panelId = useId()
  const activeTab = tabs?.find((t) => t.id === tabId) ?? tabs?.[0]
  const body = tabs ? activeTab?.children : children

  return (
    <Card
      id={`cms-editor-section-${id}`}
      className={`overflow-hidden ${open ? 'ring-1 ring-neutral-900/5' : ''}`}
    >
      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 sm:px-5">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex min-w-48 flex-1 items-center gap-3 text-left"
          aria-expanded={open}
          aria-controls={panelId}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-white">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-[13.5px] font-semibold tracking-tight text-neutral-900">
                {title}
              </h3>
              {badge ? (
                <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                  {badge}
                </span>
              ) : null}
            </div>
            {description ? (
              <p className="mt-0.5 truncate text-[11px] leading-relaxed text-neutral-500">
                {description}
              </p>
            ) : null}
          </div>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-300 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${
              open
                ? 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                : 'border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800'
            }`}
          >
            {open ? <X className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
            {open ? 'Sluiten' : 'Bewerken'}
          </button>
          {onVisibleChange ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onVisibleChange(!visible)
              }}
              title={visible ? 'Sectie verbergen' : 'Sectie tonen'}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                visible
                  ? 'border-emerald-200/70 bg-emerald-50/80 text-emerald-700 hover:bg-emerald-100'
                  : 'border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50'
              }`}
            >
              {visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              {visible ? 'Zichtbaar' : 'Verborgen'}
            </button>
          ) : null}
        </div>
      </div>

      {open ? (
        <div id={panelId} className="border-t border-neutral-200/70">
          {tabs && tabs.length > 1 ? (
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3 sm:px-5">
              <Tabs
                tabs={tabs.map((t) => ({
                  key: t.id,
                  label: t.label,
                  icon: tabIcon(t.id),
                }))}
                value={tabId}
                onChange={setTabId}
              />
            </div>
          ) : null}
          <div className="space-y-3.5 px-4 pb-5 pt-4 sm:px-5">{body}</div>
        </div>
      ) : null}
    </Card>
  )
}
