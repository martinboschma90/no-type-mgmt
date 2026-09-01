import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import {
  isTeamUuid,
  teamMemberFromRow,
  teamMemberToInsert,
} from '@/cms/mappers/team'
import type { TeamMember } from '@/types/artist'

export type TeamReadResult = {
  team: TeamMember[]
  fromSupabase: boolean
}

export type TeamWriteResult = {
  team: TeamMember[]
  error: string | null
}

export async function fetchTeamMembersFromSupabase(): Promise<TeamReadResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { team: [], fromSupabase: false }
  }

  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    console.warn('[supabase] fetchTeamMembers:', error.message)
    return { team: [], fromSupabase: false }
  }

  if (!data?.length) {
    return { team: [], fromSupabase: false }
  }

  return {
    team: data.map(teamMemberFromRow),
    fromSupabase: true,
  }
}

/**
 * Replace the full team list in Supabase (upsert by UUID, insert legacy ids,
 * delete rows that are no longer present).
 */
export async function replaceTeamMembersInSupabase(
  team: TeamMember[],
): Promise<TeamWriteResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { team: [], error: 'Supabase is not configured' }
  }

  const { data: existing, error: existingError } = await supabase
    .from('team_members')
    .select('id')

  if (existingError) {
    console.warn('[supabase] listTeamMembers:', existingError.message)
    return { team: [], error: existingError.message }
  }

  const existingIds = new Set((existing ?? []).map((row) => row.id))
  const keepIds = new Set<string>()
  const nextTeam: TeamMember[] = []

  for (let index = 0; index < team.length; index++) {
    const member = team[index]
    const insert = teamMemberToInsert(member, index)

    if (isTeamUuid(member.id) && existingIds.has(member.id)) {
      const { data, error } = await supabase
        .from('team_members')
        .update({
          name: insert.name,
          role: insert.role,
          image_url: insert.image_url,
          sort_order: insert.sort_order,
        })
        .eq('id', member.id)
        .select('*')
        .single()

      if (error) {
        console.warn('[supabase] updateTeamMember:', error.message)
        return { team: [], error: error.message }
      }

      keepIds.add(data.id)
      nextTeam.push(teamMemberFromRow(data))
      continue
    }

    const { data, error } = await supabase
      .from('team_members')
      .insert(insert)
      .select('*')
      .single()

    if (error) {
      console.warn('[supabase] insertTeamMember:', error.message)
      return { team: [], error: error.message }
    }

    keepIds.add(data.id)
    nextTeam.push(teamMemberFromRow(data))
  }

  const toDelete = [...existingIds].filter((id) => !keepIds.has(id))
  if (toDelete.length) {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .in('id', toDelete)

    if (error) {
      console.warn('[supabase] deleteTeamMembers:', error.message)
      return { team: [], error: error.message }
    }
  }

  return { team: nextTeam, error: null }
}
