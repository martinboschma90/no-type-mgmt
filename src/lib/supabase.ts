import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { storageGet, storageRemove, storageSet } from '@/lib/safeStorage'
import {
  isSupabaseConfigured,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
} from '@/lib/supabaseEnv'

export { isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabaseEnv'

function createSupabaseClient(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured) {
    return null
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
