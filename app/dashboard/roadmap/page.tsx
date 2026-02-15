import { createClient } from '@/lib/supabase/server'
import { RoadmapView } from '@/components/dashboard/roadmap-view'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Info } from 'lucide-react'

interface RoadmapPageProps {
  searchParams: {
    team?: string
  }
}

export default async function RoadmapPage({ searchParams }: RoadmapPageProps) {
  const teamId = searchParams.team

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  let tasksQuery = supabase
    .from('tasks')
    .select('*, category:categories(*)')
    .order('due_date', { ascending: true })

  if (teamId) {
    tasksQuery = tasksQuery.eq('team_id', teamId)
  } else {
    tasksQuery = tasksQuery.eq('user_id', user.id)
  }

  const { data: tasks } = await tasksQuery

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Roadmap Estratégico</h1>
          <p className="text-muted-foreground">Visão macro de entregas e prazos do mês.</p>
        </div>
      </div>

      {!tasks?.length ? (
        <Alert className="border-brand-violet/20 bg-brand-violet/5">
          <Info className="h-4 w-4 text-brand-violet" />
          <AlertTitle>Nenhuma tarefa encontrada</AlertTitle>
          <AlertDescription>
            Comece adicionando tarefas com categorias para vê-las no roadmap.
          </AlertDescription>
        </Alert>
      ) : (
        <RoadmapView
          tasks={tasks || []}
          categories={categories || []}
        />
      )}
    </div>
  )
}
