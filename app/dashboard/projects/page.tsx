import { createClient } from '@/lib/supabase/server'
import { ProjectTree } from '@/components/dashboard/project-tree'
import { HeaderActions } from '@/components/dashboard/header-actions'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Busca TUDO (exceto concluídos muito antigos, talvez?)
  const [tasksResult, categoriesResult] = await Promise.all([
    supabase.from('tasks')
      .select(`*, category:categories(*)`)
      .eq('user_id', user.id)
      .neq('status', 'done') // Opcional: mostrar concluídos na árvore? Geralmente sim, mas pode poluir.
      .order('created_at', { ascending: true }), // Ordem de criação costuma ser melhor para árvores
    
    supabase.from('categories').select('*').eq('user_id', user.id)
  ])

  const tasks = tasksResult.data || []
  const categories = categoriesResult.data || []

  return (
    <div className="space-y-6 pb-24 h-full flex flex-col animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Árvore de Projetos</h1>
          <p className="text-muted-foreground">
            Visualize a hierarquia e quebre grandes metas em tarefas menores.
          </p>
        </div>
        <HeaderActions categories={categories} />
      </div>

      <div className="flex-1 min-h-0 bg-[#121214]/50 border border-white/5 rounded-2xl overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 backdrop-blur-sm">
        <ProjectTree tasks={tasks} categories={categories} />
      </div>
    </div>
  )
}