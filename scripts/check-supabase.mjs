/**
 * Temporary Phase 1 connection check.
 * Usage: node scripts/check-supabase.mjs
 * Does not touch CMS providers or migrate data.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnvFile(filename) {
  const path = resolve(process.cwd(), filename)
  if (!existsSync(path)) return false
  const text = readFileSync(path, 'utf8')
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
  return true
}

const loaded = ['.env.local', '.env'].filter((f) => loadEnvFile(f))

const url = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY

const urlPresent = Object.prototype.hasOwnProperty.call(process.env, 'VITE_SUPABASE_URL')
const keyPresent = Object.prototype.hasOwnProperty.call(
  process.env,
  'VITE_SUPABASE_ANON_KEY',
)
const urlValue = (url ?? '').trim()
const keyValue = (anonKey ?? '').trim()

const placeholder =
  !urlValue ||
  !keyValue ||
  urlValue.includes('YOUR_PROJECT') ||
  keyValue === 'your-anon-key' ||
  urlValue === 'your-project-url'

const configured = Boolean(urlValue && keyValue && !placeholder)

console.log('=== No Type · Supabase connection check ===\n')
console.log('Env files loaded:', loaded.length ? loaded.join(', ') : '(none)')
console.log(
  'VITE_SUPABASE_URL:',
  !urlPresent
    ? '(not detected)'
    : urlValue
      ? `${urlValue.slice(0, 32)}…`
      : '(detected, empty — paste your project URL)',
)
console.log(
  'VITE_SUPABASE_ANON_KEY:',
  !keyPresent
    ? '(not detected)'
    : keyValue
      ? `${keyValue.slice(0, 12)}… (${keyValue.length} chars)`
      : '(detected, empty — paste your anon key)',
)
console.log('Supabase configured:', configured ? 'yes' : 'no')

if (!configured) {
  console.log('\nConnection status: skipped')
  if (!urlPresent || !keyPresent) {
    console.log(
      'Error: Variables not found. Ensure .env.local exists next to package.json.',
    )
  } else if (!urlValue || !keyValue) {
    console.log(
      'Error: Variables are detected but empty. Add real keys from the Supabase dashboard (no placeholders).',
    )
  } else {
    console.log(
      'Error: Placeholder values detected. Replace YOUR_PROJECT_REF / your-anon-key with real credentials.',
    )
  }
  process.exitCode = 1
  process.exit()
}

const supabase = createClient(urlValue, keyValue, {
  auth: { persistSession: false, autoRefreshToken: false },
})

console.log('\nClient loaded: yes')

try {
  // Lightweight API round-trip (works even if tables are empty / migration not run)
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    console.log('Connection status: failed')
    console.log('Error (auth.getSession):', error.message)
    process.exitCode = 1
  } else {
    console.log('Connection status: ok')
    console.log('Session:', data.session ? 'active' : 'none (expected)')
  }

  // Optional schema probe — does not fail the check if tables are missing yet
  const artists = await supabase.from('artists').select('id', { count: 'exact', head: true })
  if (artists.error) {
    console.log(
      'artists table probe:',
      artists.error.message,
      '(run the Phase 1 migration if this errors)',
    )
  } else {
    console.log('artists table probe: ok (count', artists.count ?? 0, ')')
  }
} catch (err) {
  console.log('Connection status: failed')
  console.log('Error:', err instanceof Error ? err.message : String(err))
  process.exitCode = 1
}
