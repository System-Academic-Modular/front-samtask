import { createClient } from '@/lib/supabase/server'
import { KanbanView } from '@/components/dashboard/kanban-view'
import type { Task, Category, TeamMember } from '@/lib/types'

interface KanbanPageProps {
  searchParams: Promise<{
    team?: string
  }>
}

export default async function KanbanPage(props: KanbanPageProps) {
  const { team: teamId } = await props.searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Preparamos as queries para disparar em paralelo (Performance Boost)
  const tasksQuery = supabase
    .from('tasks')
    .select(`
      *,
      category:categories(*)
    `)
    .is('parent_id', null) // Apenas tarefas principais no board
    .order('posicao', { ascending: true }) // Ajustado: position -> posicao
    .order('created_at', { ascending: false })

  if (teamId) {
    tasksQuery.eq('team_id', teamId)
  } else {
    tasksQuery.eq('user_id', user.id).is('team_id', null)
  }

  const categoriesQuery = supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('nome') // Ajustado: name -> nome

  // Execução paralela
  const [tasksRes, categoriesRes] = await Promise.all([
    tasksQuery,
    categoriesQuery
  ])

  const tasks = (tasksRes.data || []) as Task[]
  const categories = (categoriesRes.data || []) as Category[]

  // Lógica de Membros do Time (Se houver teamId)
  let teamMembers: TeamMember[] = []

  if (teamId) {
    // Buscamos os membros e seus perfis em uma única operação se possível, 
    // ou mantemos a lógica de mapa para garantir integridade.
    const { data: members } = await supabase
      .from('team_members')
      .select('*, profile:profiles(id, full_name, avatar_url)')
      .eq('team_id', teamId)

    if (members) {
      teamMembers = members.map(m => ({
        ...m,
        profile: m.profile // O Supabase já faz o join aqui
      })) as unknown as TeamMember[]
    }
  }

 return (
    <div className="h-full flex flex-col overflow-hidden animate-in fade-in duration-700">
      {/* Container do Kanban */}
      <div className="flex-1 overflow-x-auto custom-scrollbar">
        <KanbanView
          tasks={tasks}
          categories={categories}
          selectedTeamId={teamId || null}
          teamMembers={teamMembers}
        />
      </div>
      
      {/* Footer Técnico - Corrigido */}
      <footer className="h-8 flex items-center px-6 border-t border-white/5 bg-black/20 justify-between shrink-0">
        <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.3em] text-white/20">
          <span>Board: {teamId ? 'Sincronização de Time' : 'Foco Pessoal'}</span>
          <span className="w-1 h-1 rounded-full bg-white/10" />
          <span>{tasks.length} Objetivos Ativos</span>
        </div>
        <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/10">
          FocusOS Engine v3.1
        </div>
      </footer>
    </div>
  )
}