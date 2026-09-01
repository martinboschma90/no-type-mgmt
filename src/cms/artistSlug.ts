/** Extract artist slug from `/cms/artists/:slug` (cms is a splat route). */
export function artistSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/cms\/artists\/([^/]+)\/?$/)
  return match?.[1] ?? null
}

export function isArtistsIndexPath(pathname: string) {
  return pathname === '/cms/artists' || pathname === '/cms/artists/'
}
