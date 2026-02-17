import { createClient } from '@/lib/supabase/server'
import { RoadmapView } from '@/components/dashboard/roadmap-view'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Info, CalendarDays, Sparkles } from 'lucide-react'

// Next.js 15+ exige que searchParams seja uma Promise
interface RoadmapPageProps {
  searchParams: Promise<{
    team?: string
  }>
}

export default async function RoadmapPage({ searchParams }: RoadmapPageProps) {
  // 1. Resolver os parâmetros e Auth
  const resolvedParams = await searchParams
  const teamId = resolvedParams.team

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // 2. Preparar as queries (Busca em Paralelo para Performance)
  let tasksQuery = supabase
    .from('tasks')
    .select('*, category:categories(*)')
    .not('due_date', 'is', null) // Roadmap precisa de data para existir!
    .order('due_date', { ascending: true })

  if (teamId) {
    tasksQuery = tasksQuery.eq('team_id', teamId)
  } else {
    tasksQuery = tasksQuery.eq('user_id', user.id).is('team_id', null)
  }

  // 3. Executar buscas simultaneamente
  const [tasksResult, categoriesResult] = await Promise.all([
    tasksQuery,
    supabase.from('categories').select('*').eq('user_id', user.id)
  ])

  const tasks = tasksResult.data || []
  const categories = categoriesResult.data || []

  return (
    <div className="h-full flex flex-col space-y-8 animate-in fade-in duration-700">
      {/* Header com estilo Focus OS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-violet/10 rounded-lg">
              <CalendarDays className="w-5 h-5 text-brand-violet" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Roadmap <span className="text-brand-violet">Estratégico</span>
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Mapeamento visual de metas e prazos para o esquadrão.
          </p>
        </div>

        {/* Pequeno Widget de Status */}
        <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-3 rounded-2xl backdrop-blur-md">
            <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Total de Entregas</p>
                <p className="text-xl font-black text-white">{tasks.length}</p>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-brand-violet flex items-center justify-center shadow-neon-violet">
                <Sparkles className="w-5 h-5 text-brand-violet" />
            </div>
        </div>
      </div>

      <div className="flex-1 min-h-[500px] relative">
        {!tasks.length ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Alert className="max-w-md border-brand-violet/20 bg-[#09090b]/40 backdrop-blur-xl p-8 rounded-3xl text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-brand-violet/10 rounded-full flex items-center justify-center mb-2">
                    <Info className="h-8 w-8 text-brand-violet" />
                </div>
                <div>
                    <AlertTitle className="text-xl font-bold text-white mb-2">Horizonte Vazio</AlertTitle>
                    <AlertDescription className="text-muted-foreground">
                        Para visualizar seu roadmap, adicione tarefas que possuam uma <strong>Data de Entrega</strong> definida.
                    </AlertDescription>
                </div>
            </Alert>
          </div>
        ) : (
          <div className="bg-[#09090b]/40 border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-sm shadow-2xl">
            <RoadmapView
              tasks={tasks}
              categories={categories}
            />
          </div>
        )}
      </div>
    </div>
  )
}