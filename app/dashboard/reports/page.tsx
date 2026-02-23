import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ReportsView } from '@/components/dashboard/reports-view'
import type { Tarefa, Categoria } from '@/lib/types'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Busca Tarefas (Colunas em Inglês conforme seu banco)
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)

  // Busca Sessões (últimos 7 dias)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: sessions } = await supabase
    .from('pomodoro_sessions')
    .select('*')
    .eq('user_id', user.id)
    .gte('completed_at', sevenDaysAgo.toISOString())
    .order('completed_at', { ascending: true })

  // Busca Categorias
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)

  return (
    <ReportsView
      tasks={(tasks || []) as Tarefa[]}
      sessions={sessions || []}
      categories={(categories || []) as Categoria[]}
    />
  )
}