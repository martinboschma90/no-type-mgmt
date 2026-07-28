import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * True when both Vite env vars are set.
 * Local CMS keeps working when this is false — Phase 1 does not switch data sources.
 */
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'your-project-url' &&
    supabaseAnonKey !== 'your-anon-key',
)

function createSupabaseClient(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured) {
    return null
  }

  return createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'notype-supabase-auth',
    },
  })
}

/**
 * Browser Supabase client.
 * Null when env is missing — callers must handle that until Phase 2+.
 */
export const supabase = createSupabaseClient()

export type { SupabaseClient }
