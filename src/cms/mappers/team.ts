import type { TeamMember } from '@/types/artist'
import type { Database, TeamMemberRow } from '@/lib/database.types'

type TeamInsert = Database['public']['Tables']['team_members']['Insert']

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isTeamUuid(id: string) {
  return UUID_RE.test(id)
}

export function teamMemberFromRow(row: TeamMemberRow): TeamMember {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    imageUrl: row.image_url ?? '',
  }
}

export function teamMemberToInsert(
  member: TeamMember,
  sortOrder: number,
): TeamInsert {
  const base: TeamInsert = {
    name: member.name,
    role: member.role,
    image_url: member.imageUrl || null,
    sort_order: sortOrder,
  }
  if (isTeamUuid(member.id)) {
    return { ...base, id: member.id }
  }
  return base
}
