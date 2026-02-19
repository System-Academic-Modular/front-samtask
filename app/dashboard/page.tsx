import { createClient } from '@/lib/supabase/server'
import { TimelineView } from '@/components/dashboard/timeline-view'
import { EmotionalCheckinPrompt } from '@/components/dashboard/emotional-checkin-prompt'
import { HeaderActions } from '@/components/dashboard/header-actions'
import { Separator } from '@/components/ui/separator'
import { CheckCircle2, Flame, Target, Zap } from 'lucide-react'
import { differenceInDays, startOfDay, subDays } from 'date-fns'

// --- FUNÇÃO AUXILIAR PARA CALCULAR O STREAK REAL ---
// --- FUNÇÃO AUXILIAR PARA CALCULAR O STREAK REAL ---
async function calculateRealStreak(supabase: any, userId: string) {
  // Busca os últimos 30 dias de sessões de foco do usuário, ordenados do mais recente
  const { data: sessions } = await supabase
    .from('focus_sessions')
    .select('completed_at')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(30)

  if (!sessions || sessions.length === 0) return 0

  let streak = 0
  let currentDate = startOfDay(new Date()) // Começa hoje
  let hasSessionToday = false

  // 💡 CORREÇÃO AQUI: Tipando o Array.from para Array<number>
  const uniqueTimes = Array.from<number>(new Set(
    sessions.map((s: any) => startOfDay(new Date(s.completed_at)).getTime())
  ))
  
  // Agora o TS sabe que 'time' é um number nativamente
  const uniqueDates = uniqueTimes.map((time) => new Date(time))

  // Verifica se o usuário já focou hoje
  if (uniqueDates.length > 0 && uniqueDates[0].getTime() === currentDate.getTime()) {
    hasSessionToday = true
    streak = 1
    uniqueDates.shift() // Remove hoje da lista para verificar o passado
  }

  // Volta no tempo dia após dia para contar o streak
  let checkDate = subDays(currentDate, 1) // Ontem

  for (const date of uniqueDates) {
    if (date.getTime() === checkDate.getTime()) {
      streak++
      checkDate = subDays(checkDate, 1) // Volta mais um dia
    } else {
      break // Quebrou a sequência
    }
  }

  return streak
}

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

  // 1. QUERIES REAIS
  const [
    profileResult,
    tasksResult, 
    categoriesResult, 
    checkinResult,
    doneCountResult
  ] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    supabase.from('tasks')
      .select(`*, category:categories(*)`)
      .eq('user_id', user.id)
      .neq('status', 'done')
      .order('priority', { ascending: false })
      .order('due_date', { ascending: true }),
    supabase.from('categories').select('*').eq('user_id', user.id),
    supabase.from('emotional_checkins')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', todayStart.toISOString())
      .lt('created_at', tomorrowStart.toISOString())
      .order('created_at', { ascending: false }) // Pega o mais recente do dia
      .limit(1)
      .maybeSingle(),
    supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'done')
  ])

  // Tratamento do Nome (Mais Robusto)
  const profile = profileResult.data
  let firstName = 'Explorador'
  
  if (profile?.full_name) {
      const nameParts = profile.full_name.trim().split(/\s+/)
      if (nameParts.length > 0 && nameParts[0].length > 0) {
          // Garante que o primeiro nome não seja vazio e capitaliza a primeira letra (opcional, mas bom pra UI)
          const rawName = nameParts[0]
          firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase()
      }
  }
  const tasks = tasksResult.data || []
  const categories = categoriesResult.data || []
  
  // Tratamento do Check-in (Pega o real do banco)
  const todayCheckin = checkinResult.data
  
  const totalDone = doneCountResult.count || 0

  // Cálculo de Tarefas para Hoje
  const tasksForToday = tasks.filter(t => t.due_date && new Date(t.due_date) < tomorrowStart)
  const pendingTodayCount = tasksForToday.length
  
  // Cálculo REAL do Streak (Fogo) chamando a função que criamos acima
  const currentStreak = await calculateRealStreak(supabase, user.id)

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-500">
      
      {/* Header com Nome Dinâmico */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-1">
            {greeting}, <span className="bg-gradient-to-r from-brand-violet to-brand-cyan bg-clip-text text-transparent">{firstName}</span>.
          </h1>
          <p className="text-muted-foreground capitalize text-sm md:text-base">
            {dateStr} • Vamos fazer acontecer?
          </p>
        </div>
        
        <HeaderActions categories={categories} />
      </div>

      {/* PAINEL DE ESTATÍSTICAS (Dados Reais) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Card 1: Foco do Dia */}
        <div className="bg-black/20 border border-white/5 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-brand-violet/30 transition-colors">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-brand-violet/10 rounded-full blur-2xl group-hover:bg-brand-violet/20 transition-colors" />
            <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <Target className="w-4 h-4 text-brand-violet" />
                <span className="text-xs font-semibold uppercase tracking-wider">Para Hoje</span>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{pendingTodayCount}</span>
                <span className="text-xs text-muted-foreground">tarefas</span>
            </div>
        </div>

        {/* Card 2: Concluídas (Total Real) */}
        <div className="bg-black/20 border border-white/5 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-brand-emerald/30 transition-colors">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-brand-emerald/10 rounded-full blur-2xl group-hover:bg-brand-emerald/20 transition-colors" />
            <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <CheckCircle2 className="w-4 h-4 text-brand-emerald" />
                <span className="text-xs font-semibold uppercase tracking-wider">Concluídas</span>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{totalDone}</span>
                <span className="text-xs text-muted-foreground">no total</span>
            </div>
        </div>

        {/* Card 3: Streak (Fogo Real) */}
        <div className="bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-orange-500/40 transition-colors col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 text-orange-200/70 mb-3">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-semibold uppercase tracking-wider">Sequência</span>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]">
                    {currentStreak}
                </span>
                <span className="text-xs text-orange-200/50">dias seguidos</span>
            </div>
        </div>

        {/* Card 4: Energia/Check-in Real */}
        <div className="bg-black/20 border border-white/5 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden md:col-span-1 col-span-2">
             <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <Zap className="w-4 h-4 text-brand-cyan" />
                <span className="text-xs font-semibold uppercase tracking-wider">Energia Hoje</span>
            </div>
            {todayCheckin ? (
                <div className="flex items-center gap-3">
                    <span className="text-3xl">
                        {todayCheckin.mood === 5 ? '🚀' : todayCheckin.mood === 4 ? '✨' : todayCheckin.mood === 3 ? '☕' : todayCheckin.mood === 2 ? '🌫️' : '🌧️'}
                    </span>
                    <span className="text-sm font-medium text-white/80 capitalize">
                        {todayCheckin.mood === 5 ? 'Incrível' : todayCheckin.mood === 4 ? 'Boa' : todayCheckin.mood === 3 ? 'Neutra' : todayCheckin.mood === 2 ? 'Baixa' : 'Péssima'}
                    </span>
                </div>
            ) : (
                <div className="text-sm text-muted-foreground flex items-center h-full">
                    Aguardando check-in...
                </div>
            )}
        </div>

      </div>

      <Separator className="bg-white/5" />

      {/* CHECK-IN EMOCIONAL */}
      {!todayCheckin && (
        <div className="transform transition-all hover:scale-[1.01] shadow-2xl">
          <EmotionalCheckinPrompt />
        </div>
      )}
      
      {/* TIMELINE PRINCIPAL */}
      <div className="relative min-h-[500px]">
        {tasks && tasks.length > 0 ? (
           <TimelineView tasks={tasks} categories={categories} />
        ) : (
           <div className="flex flex-col items-center justify-center h-64 border border-dashed border-white/10 rounded-3xl bg-white/5 text-center p-8 backdrop-blur-sm">
              <div className="w-16 h-16 bg-brand-violet/10 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-brand-violet opacity-80" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Tudo limpo por aqui!</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">Você não tem nenhuma tarefa pendente. Aproveite o tempo livre ou adicione novos objetivos.</p>
              <HeaderActions categories={categories} />
           </div>
        )}
      </div>
    </div>
  )
}