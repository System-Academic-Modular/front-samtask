import { createClient } from '@/lib/supabase/server'
import { RoadmapView } from '@/components/dashboard/roadmap-view'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Info, CalendarDays, Sparkles } from 'lucide-react'
import type { Tarefa, Categoria } from '@/lib/types'

interface RoadmapPageProps {
  searchParams: Promise<{
    team?: string
  }>
}

export default async function RoadmapPage({ searchParams }: RoadmapPageProps) {
  const { team: teamId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // 1. Queries Paralelas para Performance
  // Filtramos apenas tarefas com data_vencimento (essencial para o Roadmap)
  let tasksQuery = supabase
    .from('tasks')
    .select('*, category:categories(*)')
    .not('data_vencimento', 'is', null) // Sincronizado: due_date -> data_vencimento
    .neq('status', 'concluida')
    .order('data_vencimento', { ascending: true })

  if (teamId) {
    tasksQuery = tasksQuery.eq('team_id', teamId)
  } else {
    tasksQuery = tasksQuery.eq('user_id', user.id).is('team_id', null)
  }

  const [tasksResult, categoriesResult] = await Promise.all([
    tasksQuery,
    supabase.from('categories').select('*').eq('user_id', user.id)
  ])

  const tasks = (tasksResult.data || []) as Tarefa[]
  const categories = (categoriesResult.data || []) as Categoria[]

  return (
    <div className="h-full flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Estilo FocusOS Engine */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 px-1">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-violet/10 rounded-xl border border-brand-violet/20 shadow-neon-violet/10">
              <CalendarDays className="w-6 h-6 text-brand-violet" />
            </div>
            <h1 className="text-3xl font-[1000] italic uppercase tracking-tighter text-white">
              Roadmap <span className="text-brand-violet">Estratégico</span>
            </h1>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">
            Vetor de progressão e marcos temporais do esquadrão
          </p>
        </div>

        {/* Widget de Status de Entregas */}
        <div className="flex items-center gap-5 bg-card/40 border border-white/5 p-4 rounded-[2rem] backdrop-blur-xl hover:border-brand-violet/30 transition-all group">
            <div className="text-right">
                <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-black">Carga de Entregas</p>
                <p className="text-2xl font-black text-white group-hover:text-brand-violet transition-colors">{tasks.length}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-violet/10 border border-brand-violet/20 flex items-center justify-center shadow-neon-violet/5">
                <Sparkles className="w-6 h-6 text-brand-violet animate-pulse" />
            </div>
        </div>
      </div>

      {/* Área Principal do Roadmap */}
      <div className="flex-1 min-h-[500px] relative">
        {!tasks.length ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--brand-violet)_0,transparent_70%)] opacity-5" />
            <Alert className="max-w-md border-white/5 bg-black/40 backdrop-blur-2xl p-10 rounded-[2.5rem] text-center flex flex-col items-center gap-6 border-t-brand-violet/20">
                <div className="w-20 h-20 bg-brand-violet/10 rounded-full flex items-center justify-center border border-brand-violet/20">
                    <Info className="h-10 w-10 text-brand-violet" />
                </div>
                <div className="space-y-2">
                    <AlertTitle className="text-2xl font-black text-white uppercase tracking-tighter italic">Horizonte Vazio</AlertTitle>
                    <AlertDescription className="text-sm text-muted-foreground leading-relaxed">
                        Nenhum vetor de entrega detectado. Adicione tarefas com <strong>Data de Vencimento</strong> para mapear o Roadmap.
                    </AlertDescription>
                </div>
            </Alert>
          </div>
        ) : (
          <div className="h-full bg-card/20 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-md shadow-2xl relative">
            <div className="absolute inset-0 bg-cyber-grid opacity-[0.03] pointer-events-none" />
            <RoadmapView
              tasks={tasks}
              categories={categories}
            />
          </div>
        )}
      </div>

      {/* Footer de Sincronia */}
      <footer className="flex justify-between items-center px-4 text-[9px] font-black uppercase tracking-[0.5em] text-white/10">
        <span>Temporal Engine v2.4</span>
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-brand-violet animate-ping" />
          <span>Real-time Sync</span>
        </div>
      </footer>
    </div>
  )
}