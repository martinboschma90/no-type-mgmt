import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { storageGet, storageRemove, storageSet } from '@/lib/safeStorage'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()

/**
 * True when both Vite env vars are set to real values.
 * Local CMS keeps working when this is false.
 */
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('YOUR_PROJECT') &&
    supabaseUrl !== 'your-project-url' &&
    supabaseAnonKey !== 'your-anon-key',
)

function createSupabaseClient(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured) {
    return null
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'notype-supabase-auth',
      // Safari private / blocked storage must not throw during auth hydrate.
      storage: {
        getItem: (key) => storageGet(key),
        setItem: (key, value) => {
          storageSet(key, value)
        },
        removeItem: (key) => {
          storageRemove(key)
        },
      },
    },
  })
}

/**
 * Browser Supabase client.
 * Null when env is missing — callers must handle that until Phase 2+.
 */
export const supabase = createSupabaseClient()

export type { SupabaseClient }
