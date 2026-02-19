import { createClient } from '@/lib/supabase/server'
import { KanbanView } from '@/components/dashboard/kanban-view'
import type { TeamMember } from '@/lib/types'

// 1. ATUALIZAÇÃO: searchParams agora é uma Promise no Next.js 15+
interface KanbanPageProps {
  searchParams: Promise<{
    team?: string
  }>
}

export default async function KanbanPage(props: KanbanPageProps) {
  // 2. ATUALIZAÇÃO: Precisamos aguardar (await) os searchParams antes de usá-los
  const searchParams = await props.searchParams
  const teamId = searchParams.team

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  let taskQuery = supabase
    .from('tasks')
    .select(`
      *,
      category:categories(*)
    `)
    .is('parent_id', null)
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })

  if (teamId) {
    taskQuery = taskQuery.eq('team_id', teamId)
  } else {
    taskQuery = taskQuery.eq('user_id', user.id)
  }

  const { data: tasks } = await taskQuery

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  const teamMembers: TeamMember[] = []

  if (teamId) {
    const { data: members } = await supabase
      .from('team_members')
      .select('id,team_id,user_id,role,joined_at')
      .eq('team_id', teamId)

    const memberIds = (members || []).map((member) => member.user_id)
    const { data: profiles } = memberIds.length
      ? await supabase
          .from('profiles')
          .select('id,full_name,avatar_url')
          .in('id', memberIds)
      : { data: [] }

    const profileMap = Object.fromEntries((profiles || []).map((profile) => [profile.id, profile]))

    for (const member of members || []) {
      teamMembers.push({
        id: member.id,
        team_id: member.team_id,
        user_id: member.user_id,
        role: member.role,
        joined_at: member.joined_at,
        profile: profileMap[member.user_id] || null,
      })
    }
  }

  return (
    <KanbanView
      tasks={tasks || []}
      categories={categories || []}
      selectedTeamId={teamId || null}
      teamMembers={teamMembers}
    />
  )
}