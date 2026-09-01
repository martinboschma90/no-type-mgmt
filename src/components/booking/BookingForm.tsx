import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePublicArtists } from '@/cms/usePublicArtists'
import {
  openBookingMailto,
  submitBookingRequest,
} from '@/data/booking'
import {
  EVENT_TYPES,
  VENUE_TYPES,
  createEmptyBookingDraft,
  type ArtistOffer,
  type BookingRequestDraft,
  type SelectedArtist,
} from '@/types/booking'
import {
  ArtistSelectChip,
  BookingButton,
  BookingField,
  BookingInput,
  BookingSelect,
} from '@/components/booking/bookingUi'

const COUNTRIES = [
  'Netherlands',
  'Belgium',
  'Germany',
  'France',
  'United Kingdom',
  'Spain',
  'Italy',
  'Portugal',
  'Switzerland',
  'Austria',
  'United States',
  'Other',
] as const

function offersForArtists(
  artists: SelectedArtist[],
  previous: ArtistOffer[],
): ArtistOffer[] {
  return artists.map((artist) => {
    const existing = previous.find((o) => o.artistId === artist.id)
    return (
      existing ?? {
        artistId: artist.id,
        artistName: artist.name,
        offer: '',
        notes: '',
      }
    )
  })
}

function isValidDraft(draft: BookingRequestDraft): boolean {
  const c = draft.company
  const e = draft.event
  return Boolean(
    draft.artists.length > 0 &&
      c.companyName.trim() &&
      c.contactPerson.trim() &&
      c.email.trim() &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim()) &&
      c.phone.trim() &&
      e.eventName.trim() &&
      e.eventType &&
      e.venueType &&
      e.country.trim() &&
      e.city.trim() &&
      e.venue.trim() &&
      e.eventDate &&
      e.pax.trim() &&
      draft.offers.every((o) => o.offer.trim()),
  )
}

export function BookingForm() {
  const { artists } = usePublicArtists()
  const [searchParams] = useSearchParams()
  const [draft, setDraft] = useState<BookingRequestDraft>(createEmptyBookingDraft)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const prefillApplied = useRef(false)

  const selectedIds = useMemo(
    () => new Set(draft.artists.map((a) => a.id)),
    [draft.artists],
  )

  // Prefill from /booking?artist=slug (artist profile Book now).
  useEffect(() => {
    if (prefillApplied.current || artists.length === 0) return
    const slug = searchParams.get('artist')?.trim().toLowerCase()
    if (!slug) return
    const match = artists.find((a) => a.slug.toLowerCase() === slug)
    if (!match) return
    prefillApplied.current = true
    setDraft((prev) => {
      if (prev.artists.some((a) => a.id === match.id)) return prev
      const nextArtists = [...prev.artists, { id: match.id, name: match.name }]
      return {
        ...prev,
        artists: nextArtists,
        offers: offersForArtists(nextArtists, prev.offers),
      }
    })
  }, [artists, searchParams])

  function toggleArtist(id: string, name: string) {
    setDraft((prev) => {
      const exists = prev.artists.some((a) => a.id === id)
      const nextArtists = exists
        ? prev.artists.filter((a) => a.id !== id)
        : [...prev.artists, { id, name }]
      return {
        ...prev,
        artists: nextArtists,
        offers: offersForArtists(nextArtists, prev.offers),
      }
    })
  }

  function updateOffer(artistId: string, patch: Partial<ArtistOffer>) {
    setDraft((prev) => ({
      ...prev,
      offers: prev.offers.map((o) =>
        o.artistId === artistId ? { ...o, ...patch } : o,
      ),
    }))
  }

  function clearForm() {
    setDraft(createEmptyBookingDraft())
    setError(null)
    setSubmitted(false)
  }

  async function handleSubmit() {
    if (!isValidDraft(draft)) {
      setError('Please complete all required fields and select at least one artist.')
      return
    }

    setSubmitting(true)
    setError(null)

    const payload = {
      ...draft,
      offers: offersForArtists(draft.artists, draft.offers),
      submittedAt: new Date().toISOString(),
    }

    const result = await submitBookingRequest(payload)
    if (result.ok) {
      setSubmitted(true)
      setSubmitting(false)
      return
    }

    openBookingMailto(payload)
    setError(
      `${result.error} Your email app was opened as a backup — please send the message if it appears.`,
    )
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-start gap-4 py-6">
        <h2 className="type-headline text-[clamp(1.35rem,2.5vw,1.75rem)] text-ink">
          Request sent
        </h2>
        <p className="type-body max-w-md text-ink/55">
          Thank you — we will get back to you shortly.
        </p>
        <BookingButton variant="ghost" onClick={clearForm}>
          New request
        </BookingButton>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-7">
      {/* Artists */}
      <section>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="type-headline text-[clamp(1.15rem,2vw,1.4rem)] text-ink">
            Artist(s)
          </h2>
          <p className="type-label text-[0.55rem] tracking-[0.14em] text-ink/40">
            One or more
          </p>
        </div>

        {artists.length === 0 ? (
          <p className="type-body text-sm text-ink/40">Loading roster…</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {artists.map((artist) => (
              <ArtistSelectChip
                key={artist.id}
                active={selectedIds.has(artist.id)}
                onClick={() => toggleArtist(artist.id, artist.name)}
              >
                {artist.name}
              </ArtistSelectChip>
            ))}
          </div>
        )}
      </section>

      {/* Details: company + event in one 2-col grid */}
      <section className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
        <h2 className="type-headline text-[clamp(1.15rem,2vw,1.4rem)] text-ink sm:col-span-2">
          Details
        </h2>

        <p className="type-label text-[0.55rem] tracking-[0.14em] text-ink/40 sm:col-span-2">
          Company
        </p>
        <BookingField label="Company / Promoter">
          <BookingInput
            value={draft.company.companyName}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                company: { ...d.company, companyName: e.target.value },
              }))
            }
            autoComplete="organization"
          />
        </BookingField>
        <BookingField label="Contact Person">
          <BookingInput
            value={draft.company.contactPerson}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                company: { ...d.company, contactPerson: e.target.value },
              }))
            }
            autoComplete="name"
          />
        </BookingField>
        <BookingField label="Email">
          <BookingInput
            type="email"
            value={draft.company.email}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                company: { ...d.company, email: e.target.value },
              }))
            }
            autoComplete="email"
          />
        </BookingField>
        <BookingField label="Phone">
          <BookingInput
            type="tel"
            value={draft.company.phone}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                company: { ...d.company, phone: e.target.value },
              }))
            }
            autoComplete="tel"
          />
        </BookingField>
        <BookingField label="Website" optional>
          <BookingInput
            type="url"
            value={draft.company.website}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                company: { ...d.company, website: e.target.value },
              }))
            }
            placeholder="https://"
          />
        </BookingField>
        <BookingField label="Instagram" optional>
          <BookingInput
            value={draft.company.instagram}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                company: { ...d.company, instagram: e.target.value },
              }))
            }
            placeholder="@handle"
          />
        </BookingField>

        <p className="type-label mt-2 text-[0.55rem] tracking-[0.14em] text-ink/40 sm:col-span-2">
          Event
        </p>
        <BookingField label="Event Name">
          <BookingInput
            value={draft.event.eventName}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                event: { ...d.event, eventName: e.target.value },
              }))
            }
          />
        </BookingField>
        <BookingField label="Event Type">
          <BookingSelect
            value={draft.event.eventType}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                event: {
                  ...d.event,
                  eventType: e.target.value as typeof d.event.eventType,
                },
              }))
            }
          >
            <option value="">Select type</option>
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </BookingSelect>
        </BookingField>
        <BookingField label="Indoor / Outdoor">
          <BookingSelect
            value={draft.event.venueType}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                event: {
                  ...d.event,
                  venueType: e.target.value as typeof d.event.venueType,
                },
              }))
            }
          >
            <option value="">Select</option>
            {VENUE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </BookingSelect>
        </BookingField>
        <BookingField label="Date">
          <BookingInput
            type="date"
            value={draft.event.eventDate}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                event: { ...d.event, eventDate: e.target.value },
              }))
            }
          />
        </BookingField>
        <BookingField label="Country">
          <BookingSelect
            value={draft.event.country}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                event: { ...d.event, country: e.target.value },
              }))
            }
          >
            <option value="">Select country</option>
            {COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </BookingSelect>
        </BookingField>
        <BookingField label="City">
          <BookingInput
            value={draft.event.city}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                event: { ...d.event, city: e.target.value },
              }))
            }
          />
        </BookingField>
        <BookingField label="Venue">
          <BookingInput
            value={draft.event.venue}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                event: { ...d.event, venue: e.target.value },
              }))
            }
          />
        </BookingField>
        <BookingField label="PAX / Capacity">
          <BookingInput
            inputMode="numeric"
            value={draft.event.pax}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                event: { ...d.event, pax: e.target.value },
              }))
            }
          />
        </BookingField>
        <div className="sm:col-span-2">
          <BookingField label="Additional Information" optional>
            <BookingInput
              value={draft.event.additionalInfo}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  event: { ...d.event, additionalInfo: e.target.value },
                }))
              }
            />
          </BookingField>
        </div>
      </section>

      {/* Offer */}
      <section>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="type-headline text-[clamp(1.15rem,2vw,1.4rem)] text-ink">
            Offer
          </h2>
          <p className="type-label text-[0.55rem] tracking-[0.14em] text-ink/40">
            Per selected artist
          </p>
        </div>

        <div className="border-t border-ink/10">
          <div className="grid grid-cols-1 gap-2 border-b border-ink/8 py-2 sm:grid-cols-[minmax(7rem,1fr)_minmax(6rem,0.7fr)_minmax(8rem,1.3fr)] sm:items-center">
            <span className="type-label hidden text-[0.55rem] tracking-[0.14em] text-ink/40 sm:block">
              Artist
            </span>
            <span className="type-label hidden text-[0.55rem] tracking-[0.14em] text-ink/40 sm:block">
              Offer (€)
            </span>
            <span className="type-label hidden text-[0.55rem] tracking-[0.14em] text-ink/40 sm:block">
              Notes
            </span>
          </div>

          {draft.offers.length === 0 ? (
            <p className="type-body py-3 text-sm text-ink/35">
              No artists selected yet.
            </p>
          ) : (
            draft.offers.map((offer) => (
              <div
                key={offer.artistId}
                className="grid grid-cols-1 gap-2 border-b border-ink/8 py-2.5 last:border-b-0 sm:grid-cols-[minmax(7rem,1fr)_minmax(6rem,0.7fr)_minmax(8rem,1.3fr)] sm:items-center"
              >
                <p className="type-ui text-[0.65rem] text-ink">{offer.artistName}</p>
                <label className="block min-w-0 sm:contents">
                  <span className="type-label mb-1 block text-[0.58rem] tracking-[0.14em] text-ink/45 sm:hidden">
                    Offer (€)
                  </span>
                  <BookingInput
                    inputMode="decimal"
                    value={offer.offer}
                    onChange={(e) =>
                      updateOffer(offer.artistId, { offer: e.target.value })
                    }
                    placeholder="0"
                  />
                </label>
                <label className="block min-w-0 sm:contents">
                  <span className="type-label mb-1 block text-[0.58rem] tracking-[0.14em] text-ink/45 sm:hidden">
                    Notes
                  </span>
                  <BookingInput
                    value={offer.notes}
                    onChange={(e) =>
                      updateOffer(offer.artistId, { notes: e.target.value })
                    }
                    placeholder="Optional"
                  />
                </label>
              </div>
            ))
          )}
        </div>
      </section>

      {error ? (
        <p className="type-body text-sm text-red-600/90 dark:text-red-300/90">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <BookingButton variant="ghost" onClick={clearForm} disabled={submitting}>
          Clear form
        </BookingButton>
        <BookingButton
          variant="solid"
          onClick={() => void handleSubmit()}
          disabled={submitting}
        >
          {submitting ? 'Sending…' : 'Send request'}
        </BookingButton>
      </div>
    </div>
  )
}
