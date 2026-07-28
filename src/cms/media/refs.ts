/** Stable content refs that survive page reloads (resolved via IndexedDB library). */

export function toMediaRef(id: string) {
  return `media://${id}`
}

export function parseMediaRef(value: string | undefined | null): string | null {
  if (!value) return null
  if (value.startsWith('media://')) return value.slice('media://'.length)
  return null
}

export function isMediaRef(value: string | undefined | null) {
  return Boolean(parseMediaRef(value))
}
