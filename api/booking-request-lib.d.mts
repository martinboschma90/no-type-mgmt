export const BOOKING_REQUEST_EMAIL: string

export function formatBookingEmailBody(payload: unknown): string
export function formatBookingEmailSubject(payload: unknown): string
export function isValidBookingPayload(payload: unknown): boolean
