import { 
  CheckCircle2, 
  Flame, 
  Sparkles, 
  Target, 
  Zap, 
  Brain, 
  AlertTriangle, 
  ShieldCheck, 
  TrendingUp, 
  Clock 
} from 'lucide-react'
import { subDays } from 'date-fns'
import { TimelineView } from '@/components/dashboard/timeline-view'
import { EmotionalCheckinPrompt } from '@/components/dashboard/emotional-checkin-prompt'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/server'
import { getEffortProgress } from '@/lib/effort'
import { cn } from '@/lib/utils'

type StreakSession = {
  completed_at: string
}

async function calculateRealStreak(
  sessions: StreakSession[],
  today = new Date(),
): Promise<number> {
  if (!sessions.length) return 0

  const daysWithStudy = new Set(
    sessions.map((session) => {
      const date = new Date(session.completed_at)
      date.setHours(0, 0, 0, 0)
      return date.getTime()
    }),
  )

  const cursor = new Date(today)
  cursor.setHours(0, 0, 0, 0)

  if (!daysWithStudy.has(cursor.getTime())) {
    cursor.setTime(subDays(cursor, 1).getTime())
  }

  let streak = 0
  while (daysWithStudy.has(cursor.getTime())) {
    streak += 1
    cursor.setTime(subDays(cursor, 1).getTime())
  }

  return streak
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)

  const hour = now.getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const dateLabel = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const [
    profileResult,
    timelineTasksResult,
    categoriesResult,
    todayCheckinResult,
    totalDoneResult,
    todayEffortResult,
    streakSessionsResult,
    masteryResult,
  ] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    supabase
      .from('tasks')
      .select('*, category:categories(id,name,color)')
      .eq('user_id', user.id)
      .is('parent_id', null)
      .neq('status', 'done')
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false }),
    supabase.from('categories').select('*').eq('user_id', user.id).order('name'),
    supabase
      .from('emotional_checkins')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', todayStart.toISOString())
      .lt('created_at', tomorrowStart.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'done'),
    supabase
      .from('tasks')
      .select('status,cognitive_load,estimated_minutes,due_date')
      .eq('user_id', user.id)
      .gte('due_date', todayStart.toISOString())
      .lt('due_date', tomorrowStart.toISOString()),
    supabase
      .from('pomodoro_sessions')
      .select('completed_at')
      .eq('user_id', user.id)
      .eq('type', 'work')
      .order('completed_at', { ascending: false })
      .limit(120),
    supabase
      .from('mastery_scores')
      .select('score,total_minutes,last_session_at,category:categories(id,name,color)')
      .eq('user_id', user.id)
      .order('score', { ascending: false }),
  ])

  const fullName = profileResult.data?.full_name || ''
  const firstName = fullName.trim().split(/\s+/).filter(Boolean)[0] || 'Explorador'

  const timelineTasks = timelineTasksResult.data || []
  const categories = categoriesResult.data || []
  const todayCheckin = todayCheckinResult.data
  const totalDone = totalDoneResult.count || 0
  const pendingTodayCount = timelineTasks.filter(
    (task) =>
      task.due_date &&
      new Date(task.due_date).getTime() >= todayStart.getTime() &&
      new Date(task.due_date).getTime() < tomorrowStart.getTime(),
  ).length

  const effortProgress = getEffortProgress(todayEffortResult.data || [])
  const streak = await calculateRealStreak((streakSessionsResult.data || []) as StreakSession[])

  const masteryData = (masteryResult.data || []).map((item: any) => {
    const lastSession = item.last_session_at ? new Date(item.last_session_at) : null
    const daysWithoutStudy = lastSession
      ? Math.floor((now.getTime() - lastSession.getTime()) / (1000 * 60 * 60 * 24))
      : 999

    return {
      score: Number(item.score || 0),
      totalMinutes: Number(item.total_minutes || 0),
      lastSessionAt: item.last_session_at as string | null,
      daysWithoutStudy,
      needsAttention: daysWithoutStudy >= 3,
      isMastered: Number(item.score || 0) >= 100,
      category: item.category as { id: string; name: string; color: string } | null,
    }
  })

  return (
    <div className="space-y-8 pb-24">
      {/* HEADER DO DASHBOARD */}
      <section className="space-y-2 relative">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-violet/20 blur-[100px] pointer-events-none" />
        <h1 className="text-3xl font-black tracking-tighter text-white md:text-5xl">
          {greeting},{' '}
          <span className="bg-gradient-to-r from-brand-violet to-brand-cyan bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            {firstName}
          </span>
          .
        </h1>
        <p className="text-xs uppercase tracking-widest text-muted-foreground md:text-sm font-medium">{dateLabel}</p>
      </section>

      {/* MÉTRICAS TÁTICAS */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-white/5 bg-black/40 p-5 backdrop-blur-xl hover:border-brand-violet/30 transition-all group">
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground group-hover:text-brand-violet transition-colors">
            <Target className="h-4 w-4" /> Para Hoje
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white tracking-tighter">{pendingTodayCount}</span>
            <span className="text-[10px] uppercase tracking-widest text-white/40">Tarefas</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-black/40 p-5 backdrop-blur-xl hover:border-emerald-500/30 transition-all group">
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground group-hover:text-emerald-400 transition-colors">
            <CheckCircle2 className="h-4 w-4" /> Concluídas
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white tracking-tighter">{totalDone}</span>
            <span className="text-[10px] uppercase tracking-widest text-white/40">Total</span>
          </div>
        </div>

        <div className="col-span-2 rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-transparent p-5 backdrop-blur-xl md:col-span-1 hover:border-orange-500/50 transition-all group relative overflow-hidden">
          {streak > 0 && <div className="absolute right-0 bottom-0 w-24 h-24 bg-orange-500/20 blur-[40px] pointer-events-none" />}
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-orange-400/80 group-hover:text-orange-400 transition-colors">
            <Flame className={cn("h-4 w-4", streak > 0 && "animate-pulse")} /> Sequência
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white tracking-tighter">{streak}</span>
            <span className="text-[10px] uppercase tracking-widest text-orange-200/50">Dias Seguidos</span>
          </div>
        </div>

        <div className="col-span-2 rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/5 to-transparent p-5 backdrop-blur-xl md:col-span-1 hover:border-sky-500/40 transition-all group relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-sky-500/10 blur-[40px] pointer-events-none" />
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-sky-400/80 group-hover:text-sky-300 transition-colors">
            <Zap className="h-4 w-4" /> Carga Mental
          </div>
          <div className="flex items-end justify-between gap-2">
            <span className="text-3xl font-black text-white tracking-tighter">{effortProgress.percentage}%</span>
            <span className="text-[10px] uppercase tracking-widest text-sky-200/50 mb-1">
              {effortProgress.completedEffort}/{effortProgress.totalEffort} XP
            </span>
          </div>
          <Progress value={effortProgress.percentage} className="mt-3 h-1.5 bg-black/50 [&>div]:bg-sky-400" />
        </div>
      </section>

      {/* MAPA DE RETENÇÃO NEURAL (O "Boletim Hacker") */}
      <section className="rounded-3xl border border-white/5 bg-black/20 p-6 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-brand-violet/5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="mb-6 flex items-center gap-3">
          <div className="p-2.5 bg-brand-violet/10 rounded-xl border border-brand-violet/20">
            <Brain className="h-5 w-5 text-brand-violet" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-tighter text-white">Mapa de Retenção</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Sincronização de Aprendizado</p>
          </div>
        </div>

        {masteryData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {masteryData.slice(0, 6).map((item, index) => {
              const progressValue = Math.min(item.score, 100)
              
              return (
                <div 
                  key={item.category?.id || `mastery-${index}`}
                  className={cn(
                    "p-4 rounded-2xl border bg-card/30 backdrop-blur-sm transition-all duration-500 relative group overflow-hidden",
                    item.needsAttention 
                      ? "border-red-500/30 hover:border-red-500/60 bg-red-500/[0.02]" 
                      : "border-white/5 hover:border-white/10 hover:bg-white/[0.02]"
                  )}
                >
                  {/* Alerta Visual Lateral para Esquecimento */}
                  {item.needsAttention && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div 
                        className={cn("w-2.5 h-2.5 rounded-full", item.needsAttention && "animate-ping bg-red-500")}
                        style={{ backgroundColor: !item.needsAttention ? item.category?.color || '#8b5cf6' : undefined }}
                      />
                      <span className={cn(
                        "font-bold text-sm truncate max-w-[120px]", 
                        item.needsAttention ? "text-red-400" : "text-white/90"
                      )}>
                        {item.category?.name || 'Sem Categoria'}
                      </span>
                    </div>

                    {/* Tags de Status Táticas */}
                    {item.needsAttention ? (
                      <span className="flex items-center gap-1 text-[9px] uppercase font-black text-red-500 bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20">
                        <AlertTriangle className="w-3 h-3" /> Risco
                      </span>
                    ) : item.isMastered ? (
                      <span className="flex items-center gap-1 text-[9px] uppercase font-black text-brand-cyan bg-brand-cyan/10 px-2 py-1 rounded-md border border-brand-cyan/20">
                        <ShieldCheck className="w-3 h-3" /> Dominado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[9px] uppercase font-black text-white/40">
                        <TrendingUp className="w-3 h-3" /> Estudando
                      </span>
                    )}
                  </div>

                  <div className="relative h-1.5 w-full bg-black/60 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className={cn(
                        "absolute top-0 left-0 h-full transition-all duration-1000",
                        item.needsAttention ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" : "bg-brand-violet shadow-[0_0_10px_var(--brand-glow)]"
                      )}
                      style={{ width: `${progressValue}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center mt-3 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    <span className="text-white/70">{item.score.toFixed(0)} XP</span>
                    {item.needsAttention ? (
                      <span className="text-red-400/80 flex items-center gap-1 animate-pulse">
                        <Clock className="w-3 h-3" /> Há {item.daysWithoutStudy} dias
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Estável
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
            <Brain className="w-8 h-8 text-white/20 mb-3" />
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium text-center">
              Sem dados neurais.<br/> Complete Pomodoros para gerar seu mapa de retenção.
            </p>
          </div>
        )}
      </section>

      <Separator className="bg-white/5" />

      {!todayCheckin && <EmotionalCheckinPrompt />}

      {/* LINHA DO TEMPO */}
      <section className="min-h-[500px]">
        {timelineTasks.length > 0 ? (
          <TimelineView tasks={timelineTasks} categories={categories} />
        ) : (
          <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-black/20 p-8 text-center backdrop-blur-sm">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-violet/10 border border-brand-violet/20 shadow-[0_0_30px_rgba(var(--brand-violet),0.2)]">
              <CheckCircle2 className="h-8 w-8 text-brand-violet" />
            </div>
            <h3 className="mb-2 text-xl font-black tracking-tighter text-white uppercase">Área Limpa</h3>
            <p className="max-w-sm text-xs uppercase tracking-widest text-muted-foreground leading-relaxed">
              Nenhuma tarefa pendente para hoje. Aproveite para descansar a mente ou revisar matérias em risco.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}