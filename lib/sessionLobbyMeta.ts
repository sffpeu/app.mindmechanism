import { getMyLobbyGroup } from '@/lib/lobbyGroups'

/** Snapshot symbolic-lobby membership at session end (for notes / history). */
export async function getSessionLobbySnapshot(userId: string): Promise<{
  is_group_session: boolean
  group_participant_count: number
}> {
  if (!userId) {
    return { is_group_session: false, group_participant_count: 1 }
  }
  try {
    const group = await getMyLobbyGroup(userId)
    if (!group) {
      return { is_group_session: false, group_participant_count: 1 }
    }
    const n = group.member_uids.length
    return { is_group_session: n >= 2, group_participant_count: n }
  } catch {
    return { is_group_session: false, group_participant_count: 1 }
  }
}
