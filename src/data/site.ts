import type { TeamMember } from '@/types/artist'

export const site = {
  name: 'NOTYPE',
  fullName: 'NOTYPE MGMT',
  tagline: 'Artist management\nBooking · Development · Creative',
  instagram: 'https://www.instagram.com/notype/',
  year: 2026,
  contact: [
    {
      label: 'Bookings',
      email: 'martin@notype-mgmt.com',
    },
  ],
  legal: {
    company: 'NOTYPE MGMT',
    vat: 'notype-mgmt.com',
    addressLines: ['Helsingistraat 6', 'Groningen, Netherlands'] as string[],
  },
  about: [
    'No Type was founded in 2024 as a sister brand of Kurious, built for artists who refuse a single lane.',
    'We focus on crossover dance and pop talent across the Benelux — and beyond into Europe, the UK and Oceania.',
    'From day-to-day guidance to long-term strategy, we offer full-service artist management with a sharp creative edge.',
    'No templates. No copy-paste careers. Just clear ambition, strong taste, and the infrastructure to match.',
  ],
  photoCredits: 'Credits pictures: @notype',
  legalLinks: [
    { label: 'Privacy', href: '#privacy' },
    { label: 'Terms', href: '#terms' },
    { label: 'Cookies', href: '#cookies' },
  ],
} as const

export const team: TeamMember[] = [
  {
    id: 't1',
    name: 'Alex Rivera',
    role: 'Founder',
    imageUrl:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&q=80',
  },
  {
    id: 't2',
    name: 'Sam Okoye',
    role: 'Artist Manager',
    imageUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&q=80',
  },
  {
    id: 't3',
    name: 'Jules Martens',
    role: 'Bookings',
    imageUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&q=80',
  },
  {
    id: 't4',
    name: 'Nora Veld',
    role: 'Production',
    imageUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&q=80',
  },
  {
    id: 't5',
    name: 'Kai Berg',
    role: 'Press',
    imageUrl:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop&q=80',
  },
]
