import { createClient } from '@/lib/supabase/server'
import { CalendarView } from '@/components/dashboard/calendar-view'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: tasks } = await supabase
    .from('tasks')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('user_id', user.id)
    .is('parent_id', null)
    .not('due_date', 'is', null)
    .order('due_date', { ascending: true })

  // NOTA: Removemos a busca de categorias e a prop 'categories'
  // porque o componente CalendarView ainda não implementou filtros laterais.
  
  return (
    <CalendarView 
      tasks={tasks || []} 
    />
  )
}