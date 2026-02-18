import { createClient } from '@/lib/supabase/server'
import { TimelineView } from '@/components/dashboard/timeline-view'
import { EmotionalCheckinPrompt } from '@/components/dashboard/emotional-checkin-prompt'
import { HeaderActions } from '@/components/dashboard/header-actions'
import { Separator } from '@/components/ui/separator'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)

  const hour = now.getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  // 1. QUERY OTIMIZADA: Trazemos Tarefas, Categorias e Check-in de uma só vez
  const [tasksResult, categoriesResult, checkinResult] = await Promise.all([
    supabase.from('tasks')
      .select(`*, category:categories(*)`)
      .eq('user_id', user.id)
      .or(`due_date.lte.${now.toISOString()},status.eq.in_progress`) 
      .neq('status', 'done')
      .order('priority', { ascending: false })
      .order('due_date', { ascending: true }),
    
    // AQUI ESTAVA FALTANDO: Buscar as categorias do usuário
    supabase.from('categories').select('*').eq('user_id', user.id),

    supabase.from('emotional_checkins')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', todayStart.toISOString())
      .lt('created_at', tomorrowStart.toISOString())
      .single()
  ])

  const tasks = tasksResult.data || []
  const categories = categoriesResult.data || [] // Agora temos as categorias!
  const todayCheckin = checkinResult.data

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {greeting}, <span className="text-brand-violet">Arthur</span>.
          </h1>
          <p className="text-muted-foreground capitalize">
            {dateStr} • Vamos fazer acontecer?
          </p>
        </div>
        
        {/* Passamos as categorias para o botão "Nova Tarefa" */}
        <HeaderActions categories={categories} />
      </div>

      <Separator className="bg-white/5" />

      {!todayCheckin && (
        <div className="transform transition-all hover:scale-[1.01]">
          <EmotionalCheckinPrompt />
        </div>
      )}
      
      <div className="relative min-h-[500px]">
        {tasks && tasks.length > 0 ? (
           // Passamos categorias também para o TimelineView poder editar tarefas
           <TimelineView tasks={tasks} categories={categories} />
        ) : (
           <div className="flex flex-col items-center justify-center h-64 border border-dashed border-white/10 rounded-2xl bg-white/5 text-center p-8">
              <p className="text-muted-foreground mb-4">Nada na pauta para hoje (ou você limpou tudo! 🎉)</p>
              {/* Passamos categorias aqui também */}
              <HeaderActions categories={categories} />
           </div>
        )}
      </div>
    </div>
  )
}