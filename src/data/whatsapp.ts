/** Default NOTYP MGMT WhatsApp / phone display number. */
export const DEFAULT_WHATSAPP_NUMBER = '+31 36 236 53232'

export function normalizeWhatsAppDigits(phone: string): string {
  return phone.replace(/\D/g, '')
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = normalizeWhatsAppDigits(phone)
  if (!digits) return '#'
  const text = encodeURIComponent(message)
  return `https://wa.me/${digits}?text=${text}`
}

export function artistBookingWhatsAppMessage(artistName: string): string {
  return `Hi NOTYP MGMT, I would like to discuss booking ${artistName}.`
}
