import {
  isSupabaseConfigured,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
} from '@/lib/supabaseEnv'

const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  Accept: 'application/json',
}

export async function restGet<T>(pathAndQuery: string): Promise<T | null> {
  if (!isSupabaseConfigured) return null
  const url = `${SUPABASE_URL}/rest/v1/${pathAndQuery}`
  try {
    const res = await fetch(url, { headers })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export function publicStorageUrl(storagePath: string): string {
  const encoded = storagePath
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')
  return `${SUPABASE_URL}/storage/v1/object/public/media/${encoded}`
}
