import type { FaqCategory } from '@/cms/content'

function id(prefix: string, n: number) {
  return `${prefix}-${n}`
}

/** Shipped promoter FAQ copy for CMS defaults / empty Supabase. */
export function createDefaultFaqCategories(): FaqCategory[] {
  return [
    {
      id: id('cat', 1),
      title: 'Regular Bookings',
      visible: true,
      items: [
        {
          id: id('q', 101),
          question: 'How can I request an artist booking?',
          answer:
            'Submit a booking request through our booking form with your event details, preferred artist and offer. Our team will review your request and get back to you.',
          visible: true,
        },
        {
          id: id('q', 102),
          question: 'What information do you need for a booking request?',
          answer:
            'We need details about the event, location, date, capacity, company information, preferred artist and your offer.',
          visible: true,
        },
        {
          id: id('q', 103),
          question: 'Do you book artists for clubs, festivals and private events?',
          answer:
            'Yes. NOTYP MGMT works with clubs, festivals, private events, corporate events and exclusive brand experiences.',
          visible: true,
        },
        {
          id: id('q', 104),
          question:
            'Do you also provide programming for festival stages or complete festival concepts?',
          answer:
            'Yes. NOTYP MGMT can support festival programming and stage curation. We help create the right lineup and connect the right artists with the right audience.',
          visible: true,
        },
        {
          id: id('q', 105),
          question: 'Do you offer full-service support for events?',
          answer:
            'Yes. We can fully support the process, including artist selection, communication, bookings, advancing and coordination. Our goal is to completely unburden the organiser.',
          visible: true,
        },
        {
          id: id('q', 106),
          question: 'Can you help create the right lineup for our event?',
          answer:
            'Yes. We work with organisers to create lineups that match the event identity, audience and overall vision.',
          visible: true,
        },
        {
          id: id('q', 107),
          question: 'Can I request multiple artists?',
          answer:
            'Yes. Multiple artists can be selected through the booking request form.',
          visible: true,
        },
        {
          id: id('q', 108),
          question: 'Do you handle the complete booking process?',
          answer:
            'Yes. From the first request to the final details, NOTYP MGMT manages communication, agreements and coordination.',
          visible: true,
        },
      ],
    },
    {
      id: id('cat', 2),
      title: 'Europe Bookings',
      visible: true,
      items: [
        {
          id: id('q', 201),
          question: 'Do you handle bookings across Europe?',
          answer:
            'Yes. NOTYP MGMT works with promoters, festivals and venues across Europe for selected artists.',
          visible: true,
        },
        {
          id: id('q', 202),
          question: 'How can I request an artist for a European booking?',
          answer:
            'Submit a booking request with your event details, location, date, capacity and offer. Our team will review the opportunity.',
          visible: true,
        },
        {
          id: id('q', 203),
          question: 'Are European bookings different from regular bookings?',
          answer:
            'European bookings may require additional coordination regarding travel, production, scheduling and logistics.',
          visible: true,
        },
        {
          id: id('q', 204),
          question: 'Do you work with European festivals and clubs?',
          answer:
            "Yes. We collaborate with festivals, clubs and promoters across Europe that match the artist's direction and career growth.",
          visible: true,
        },
        {
          id: id('q', 205),
          question: "Can you arrange bookings outside the artist's home country?",
          answer:
            'Yes. We support artists in expanding their reach through strategic opportunities and partnerships.',
          visible: true,
        },
      ],
    },
    {
      id: id('cat', 3),
      title: 'International Bookings',
      visible: true,
      items: [
        {
          id: id('q', 301),
          question: 'Do you handle international bookings?',
          answer:
            'Yes. NOTYP MGMT works with international promoters and partners for selected artists and opportunities.',
          visible: true,
        },
        {
          id: id('q', 302),
          question: 'Can you explore new international markets for an artist?',
          answer:
            'Yes. Depending on the artist and opportunity, we can explore suitable markets and build relationships with promoters, venues and partners internationally.',
          visible: true,
        },
        {
          id: id('q', 303),
          question: 'Do you already work with specific international territories?',
          answer:
            "We evaluate international opportunities on a case-by-case basis. The right market depends on the artist's sound, audience, positioning and long-term strategy.",
          visible: true,
        },
        {
          id: id('q', 304),
          question: 'Can NOTYP MGMT help develop an artist internationally?',
          answer:
            'Yes. International growth is part of our long-term approach. We focus on building the right strategy, partnerships and opportunities to create sustainable growth.',
          visible: true,
        },
        {
          id: id('q', 305),
          question: 'Do you arrange international logistics?',
          answer:
            'Depending on the booking, our team supports communication around travel, production and advancing.',
          visible: true,
        },
      ],
    },
    {
      id: id('cat', 4),
      title: 'Payments & Booking Terms',
      visible: true,
      items: [
        {
          id: id('q', 401),
          question: 'Is there a booking fee?',
          answer:
            'Yes. NOTYP MGMT applies a 15% booking fee on every confirmed booking. This covers the professional coordination, communication, negotiation and handling of the booking process.',
          visible: true,
        },
        {
          id: id('q', 402),
          question: 'Is the booking fee included in the artist fee?',
          answer:
            'The 15% booking fee is added on top of the agreed artist fee and will be clearly communicated before confirmation.',
          visible: true,
        },
        {
          id: id('q', 403),
          question: 'How does the payment process work?',
          answer:
            'After confirmation of the booking, we provide the necessary booking details and payment information. Payment terms are agreed before the event takes place.',
          visible: true,
        },
        {
          id: id('q', 404),
          question: 'When do I need to pay the artist fee?',
          answer:
            'Payment deadlines and terms are agreed during the booking process and confirmed in the booking agreement.',
          visible: true,
        },
        {
          id: id('q', 405),
          question: 'Do you require a deposit?',
          answer:
            'Depending on the booking and agreement, a deposit or advance payment may be required to secure the artist.',
          visible: true,
        },
        {
          id: id('q', 406),
          question: 'Are travel and additional costs included in the offer?',
          answer:
            'This depends on the booking. Additional costs such as travel, accommodation or specific production requirements will be discussed and clearly communicated before confirmation.',
          visible: true,
        },
        {
          id: id('q', 407),
          question: 'Do you provide invoices for bookings?',
          answer:
            'Yes. All bookings are handled professionally with official booking agreements and invoices.',
          visible: true,
        },
      ],
    },
  ]
}

export function cloneFaqCategories(categories: FaqCategory[]): FaqCategory[] {
  return categories.map((category) => ({
    ...category,
    items: category.items.map((item) => ({ ...item })),
  }))
}
