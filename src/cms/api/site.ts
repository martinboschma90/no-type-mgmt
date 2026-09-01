import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import {
  normalizeSiteContent,
  siteContentToJson,
} from '@/cms/mappers/site'
import type { SiteContent } from '@/cms/content'

export type SiteReadResult = {
  site: SiteContent | null
  rowId: string | null
  fromSupabase: boolean
}

export type SiteWriteResult = {
  site: SiteContent | null
  rowId: string | null
  error: string | null
}

let cachedRowId: string | null = null

export function getCachedSiteSettingsRowId() {
  return cachedRowId
}

export async function fetchSiteSettingsFromSupabase(): Promise<SiteReadResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { site: null, rowId: null, fromSupabase: false }
  }

  const { data, error } = await supabase
    .from('site_settings')
    .select('id, content')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.warn('[supabase] fetchSiteSettings:', error.message)
    return { site: null, rowId: null, fromSupabase: false }
  }

  if (!data) {
    return { site: null, rowId: null, fromSupabase: false }
  }

  cachedRowId = data.id
  return {
    site: normalizeSiteContent(data.content),
    rowId: data.id,
    fromSupabase: true,
  }
}

export async function upsertSiteSettingsInSupabase(
  site: SiteContent,
): Promise<SiteWriteResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { site: null, rowId: null, error: 'Supabase is not configured' }
  }

  const payload = {
    content: siteContentToJson(site),
  }

  if (cachedRowId) {
    const { data, error } = await supabase
      .from('site_settings')
      .update(payload)
      .eq('id', cachedRowId)
      .select('id, content')
      .maybeSingle()

    if (error) {
      console.warn('[supabase] updateSiteSettings:', error.message)
      return { site: null, rowId: cachedRowId, error: error.message }
    }

    if (data) {
      return {
        site: normalizeSiteContent(data.content),
        rowId: data.id,
        error: null,
      }
    }
  }

  const existing = await fetchSiteSettingsFromSupabase()
  if (existing.rowId) {
    const { data, error } = await supabase
      .from('site_settings')
      .update(payload)
      .eq('id', existing.rowId)
      .select('id, content')
      .single()

    if (error) {
      console.warn('[supabase] updateSiteSettings:', error.message)
      return { site: null, rowId: existing.rowId, error: error.message }
    }

    cachedRowId = data.id
    return {
      site: normalizeSiteContent(data.content),
      rowId: data.id,
      error: null,
    }
  }

  const { data, error } = await supabase
    .from('site_settings')
    .insert(payload)
    .select('id, content')
    .single()

  if (error) {
    console.warn('[supabase] insertSiteSettings:', error.message)
    return { site: null, rowId: null, error: error.message }
  }

  cachedRowId = data.id
  return {
    site: normalizeSiteContent(data.content),
    rowId: data.id,
    error: null,
  }
}
