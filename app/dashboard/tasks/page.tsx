import { createClient } from '@/lib/supabase/server'
import { AllTasksView } from '@/components/dashboard/all-tasks-view'
import { normalizeCategory, normalizeTask } from '@/lib/normalizers'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: tasks } = await supabase
    .from('tarefas')
    .select(`
      *,
      categoria:categorias(*)
    `)
    .eq('usuario_id', user.id)
    .is('tarefa_pai_id', null)
    .order('status', { ascending: true })
    .order('prioridade', { ascending: false })
    .order('criado_em', { ascending: false })

  const { data: categories } = await supabase
    .from('categorias')
    .select('*')
    .eq('usuario_id', user.id)
    .order('nome')

  const normalizedTasks = (tasks || []).map(normalizeTask)
  const normalizedCategories = (categories || []).map(normalizeCategory)

  return (
    <AllTasksView 
      tasks={normalizedTasks} 
      categories={normalizedCategories}
    />
  )
}
