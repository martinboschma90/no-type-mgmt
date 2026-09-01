/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface NotypePublicBoot {
  cached: unknown
  promise: Promise<unknown>
}

interface Window {
  __NOTYPE_BOOT__?: NotypePublicBoot
}
