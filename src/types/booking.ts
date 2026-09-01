export const BOOKING_STEPS = [
  'artists',
  'company',
  'event',
  'offers',
  'review',
] as const

export type BookingStepId = (typeof BOOKING_STEPS)[number]

export const EVENT_TYPES = [
  'Club Event',
  'Festival',
  'Private Event',
  'Corporate Event',
  'Other',
] as const

export type EventType = (typeof EVENT_TYPES)[number]

export const VENUE_TYPES = ['Indoor', 'Outdoor'] as const

export type VenueType = (typeof VENUE_TYPES)[number]

export type SelectedArtist = {
  id: string
  name: string
}

export type ArtistOffer = {
  artistId: string
  artistName: string
  offer: string
  notes: string
}

export type CompanyDetails = {
  companyName: string
  contactPerson: string
  email: string
  phone: string
  website: string
  instagram: string
}

export type EventDetails = {
  eventName: string
  eventType: EventType | ''
  venueType: VenueType | ''
  country: string
  city: string
  venue: string
  eventDate: string
  pax: string
  additionalInfo: string
}

export type BookingRequestDraft = {
  artists: SelectedArtist[]
  company: CompanyDetails
  event: EventDetails
  offers: ArtistOffer[]
}

export type BookingRequestPayload = BookingRequestDraft & {
  submittedAt: string
}

export const emptyCompany = (): CompanyDetails => ({
  companyName: '',
  contactPerson: '',
  email: '',
  phone: '',
  website: '',
  instagram: '',
})

export const emptyEvent = (): EventDetails => ({
  eventName: '',
  eventType: '',
  venueType: '',
  country: '',
  city: '',
  venue: '',
  eventDate: '',
  pax: '',
  additionalInfo: '',
})

export function createEmptyBookingDraft(): BookingRequestDraft {
  return {
    artists: [],
    company: emptyCompany(),
    event: emptyEvent(),
    offers: [],
  }
}

export const BOOKING_STEP_LABELS: Record<BookingStepId, string> = {
  artists: 'Artists',
  company: 'Company',
  event: 'Event',
  offers: 'Offer',
  review: 'Review',
}
