import { createClient } from '@/lib/supabase/server'
import { ReportsView } from '@/components/dashboard/reports-view'
import type { Category } from '@/lib/types'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .is('parent_id', null)

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: sessions } = await supabase
    .from('pomodoro_sessions')
    .select('*')
    .eq('user_id', user.id)
    .gte('completed_at', sevenDaysAgo.toISOString())
    .order('completed_at', { ascending: true })

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)

  return (
    <ReportsView
      tasks={tasks || []}
      sessions={sessions || []}
      categories={(categories || []) as Category[]}
    />
  )
}
