import type { Artist } from '@/types/artist'

/**
 * Static artist roster — structured for easy CMS swap later.
 * Image URLs use Unsplash placeholders until real press assets land.
 * Homepage shows max 12.
 */
const roster: Artist[] = [
  {
    id: '1',
    name: 'Alber-K',
    slug: 'alber-k',
    genre: 'House',
    imageUrl:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=800&fit=crop&q=80',
    imageAlt: 'Alber-K portrait',
  },
  {
    id: '2',
    name: 'Apollonia',
    slug: 'apollonia',
    genre: 'Techno',
    imageUrl:
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&h=800&fit=crop&q=80',
    imageAlt: 'Apollonia portrait',
  },
  {
    id: '3',
    name: 'Audiowave',
    slug: 'audiowave',
    genre: 'Electronic',
    imageUrl:
      'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=600&h=800&fit=crop&q=80',
    imageAlt: 'Audiowave portrait',
  },
  {
    id: '4',
    name: 'Bavo Mortier',
    slug: 'bavo-mortier',
    genre: 'Pop',
    imageUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop&q=80',
    imageAlt: 'Bavo Mortier portrait',
  },
  {
    id: '5',
    name: 'C-Man',
    slug: 'c-man',
    genre: 'Hip-Hop',
    imageUrl:
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&h=800&fit=crop&q=80',
    imageAlt: 'C-Man portrait',
  },
  {
    id: '6',
    name: 'C-track',
    slug: 'c-track',
    genre: 'Electronic',
    imageUrl:
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=800&fit=crop&q=80',
    imageAlt: 'C-track portrait',
  },
  {
    id: '7',
    name: 'CA$SA CA$SA',
    slug: 'cassa-cassa',
    genre: 'Rap',
    imageUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop&q=80',
    imageAlt: 'CA$SA CA$SA portrait',
  },
  {
    id: '8',
    name: 'De Jaren Nul met Sam De Bruyn',
    slug: 'de-jaren-nul',
    genre: 'Talk',
    imageUrl:
      'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=600&h=800&fit=crop&q=80',
    imageAlt: 'De Jaren Nul portrait',
  },
  {
    id: '9',
    name: 'Diskobar Sabrina',
    slug: 'diskobar-sabrina',
    genre: 'Party',
    imageUrl:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop&q=80',
    imageAlt: 'Diskobar Sabrina portrait',
  },
  {
    id: '10',
    name: 'DJ Creator',
    slug: 'dj-creator',
    genre: 'DJ',
    imageUrl:
      'https://images.unsplash.com/photo-1571266028241-5c9b0ad04f48?w=600&h=800&fit=crop&q=80',
    imageAlt: 'DJ Creator portrait',
  },
  {
    id: '11',
    name: 'DJ Licious',
    slug: 'dj-licious',
    genre: 'Dance',
    imageUrl:
      'https://images.unsplash.com/photo-1598387993281-cecf8b71a8f8?w=600&h=800&fit=crop&q=80',
    imageAlt: 'DJ Licious portrait',
  },
  {
    id: '12',
    name: 'DJ Yolotanker',
    slug: 'dj-yolotanker',
    genre: 'Techno',
    imageUrl:
      'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&h=800&fit=crop&q=80',
    imageAlt: 'DJ Yolotanker portrait',
  },
  {
    id: '13',
    name: 'Double D',
    slug: 'double-d',
    genre: 'Hip-Hop',
    imageUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop&q=80',
    imageAlt: 'Double D portrait',
  },
  {
    id: '14',
    name: 'Eagl',
    slug: 'eagl',
    genre: 'Pop',
    imageUrl:
      'https://images.unsplash.com/photo-1463453091185-61582044d556?w=600&h=800&fit=crop&q=80',
    imageAlt: 'Eagl portrait',
  },
  {
    id: '15',
    name: 'Flo Windey & Laurens Luyten',
    slug: 'flo-windey-laurens-luyten',
    genre: 'Entertainment',
    imageUrl:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop&q=80',
    imageAlt: 'Flo Windey & Laurens Luyten portrait',
  },
  {
    id: '16',
    name: 'Henok D',
    slug: 'henok-d',
    genre: 'Afro',
    imageUrl:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop&q=80',
    imageAlt: 'Henok D portrait',
  },
  {
    id: '17',
    name: 'Henri PFR',
    slug: 'henri-pfr',
    genre: 'Electronic',
    imageUrl:
      'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=600&h=800&fit=crop&q=80',
    imageAlt: 'Henri PFR portrait',
  },
  {
    id: '18',
    name: 'Hide N Seek',
    slug: 'hide-n-seek',
    genre: 'Dance',
    imageUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop&q=80',
    imageAlt: 'Hide N Seek portrait',
  },
  {
    id: '19',
    name: 'Jaël Ost & MagiK',
    slug: 'jael-ost-magik',
    genre: 'Radio',
    imageUrl:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=800&fit=crop&q=80',
    imageAlt: 'Jaël Ost & MagiK portrait',
  },
  {
    id: '20',
    name: 'Kurkdroog',
    slug: 'kurkdroog',
    genre: 'Comedy',
    imageUrl:
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&h=800&fit=crop&q=80',
    imageAlt: 'Kurkdroog portrait',
  },
  {
    id: '21',
    name: 'Laura Govaerts',
    slug: 'laura-govaerts',
    genre: 'Radio',
    imageUrl:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop&q=80',
    imageAlt: 'Laura Govaerts portrait',
  },
  {
    id: '22',
    name: 'Laurens Luyten',
    slug: 'laurens-luyten',
    genre: 'Entertainment',
    imageUrl:
      'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=600&h=800&fit=crop&q=80',
    imageAlt: 'Laurens Luyten portrait',
  },
  {
    id: '23',
    name: 'LOUIS XIV',
    slug: 'louis-xiv',
    genre: 'Pop',
    imageUrl:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&h=800&fit=crop&q=80',
    imageAlt: 'LOUIS XIV portrait',
  },
  {
    id: '24',
    name: 'MagiK',
    slug: 'magik',
    genre: 'DJ',
    imageUrl:
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb30?w=600&h=800&fit=crop&crop=faces&q=80',
    imageAlt: 'MagiK portrait',
  },
  {
    id: '25',
    name: 'Manuals',
    slug: 'manuals',
    genre: 'Electronic',
    imageUrl:
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=800&fit=crop&q=80',
    imageAlt: 'Manuals portrait',
  },
  {
    id: '26',
    name: 'Mars',
    slug: 'mars',
    genre: 'Hip-Hop',
    imageUrl:
      'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=600&h=800&fit=crop&q=80',
    imageAlt: 'Mars portrait',
  },
  {
    id: '27',
    name: 'MC Rim',
    slug: 'mc-rim',
    genre: 'Rap',
    imageUrl:
      'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=600&h=800&fit=crop&q=80',
    imageAlt: 'MC Rim portrait',
  },
  {
    id: '28',
    name: 'Meaghan',
    slug: 'meaghan',
    genre: 'Pop',
    imageUrl:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&h=800&fit=crop&q=80',
    imageAlt: 'Meaghan portrait',
  },
  {
    id: '29',
    name: 'MNM Party',
    slug: 'mnm-party',
    genre: 'Party',
    imageUrl:
      'https://images.unsplash.com/photo-1514525253161-7a06099daad1?w=600&h=800&fit=crop&q=80',
    imageAlt: 'MNM Party portrait',
  },
  {
    id: '30',
    name: 'Nachtdienst',
    slug: 'nachtdienst',
    genre: 'Radio',
    imageUrl:
      'https://images.unsplash.com/photo-1459749411177-039141ee193b?w=600&h=800&fit=crop&q=80',
    imageAlt: 'Nachtdienst portrait',
  },
  {
    id: '31',
    name: 'Neal & Senne',
    slug: 'neal-senne',
    genre: 'Entertainment',
    imageUrl:
      'https://images.unsplash.com/photo-1501196354995-cbb552f00afe?w=600&h=800&fit=crop&q=80',
    imageAlt: 'Neal & Senne portrait',
  },
  {
    id: '32',
    name: 'Nina Black',
    slug: 'nina-black',
    genre: 'Techno',
    imageUrl:
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb30?w=600&h=800&fit=crop&crop=top&q=80',
    imageAlt: 'Nina Black portrait',
  },
  {
    id: '33',
    name: 'Nona Van Braeckel',
    slug: 'nona-van-braeckel',
    genre: 'Pop',
    imageUrl:
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=800&fit=crop&q=80',
    imageAlt: 'Nona Van Braeckel portrait',
  },
  {
    id: '34',
    name: "Rick & James 80's Party",
    slug: 'rick-james-80s-party',
    genre: 'Party',
    imageUrl:
      'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&h=800&fit=crop&q=80',
    imageAlt: "Rick & James 80's Party portrait",
  },
  {
    id: '35',
    name: 'RUBY XX',
    slug: 'ruby-xx',
    genre: 'Pop',
    imageUrl:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop&crop=faces&q=80',
    imageAlt: 'RUBY XX portrait',
  },
  {
    id: '36',
    name: 'Tola OG',
    slug: 'tola-og',
    genre: 'Rap',
    imageUrl:
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&h=800&fit=crop&q=80',
    imageAlt: 'Tola OG portrait',
  },
]

export const artists: Artist[] = roster.slice(0, 12)

/** Full catalog — used for public image fallbacks when CMS stored media:// refs. */
export const allArtists: Artist[] = roster

export function getRosterImageUrl(slug: string): string | undefined {
  const hit = roster.find((a) => a.slug === slug)
  const url = hit?.imageUrl?.trim()
  return url && /^https?:\/\//i.test(url) ? url : undefined
}

