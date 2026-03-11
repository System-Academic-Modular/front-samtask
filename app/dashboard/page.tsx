import { 
  CheckCircle2, Flame, Sparkles, Target, Zap, Brain, 
  AlertTriangle, ShieldCheck, TrendingUp, Clock 
} from 'lucide-react'
import { subDays, startOfDay, endOfDay } from 'date-fns'
import { TimelineView } from '@/components/dashboard/timeline-view'
import { EmotionalCheckinPrompt } from '@/components/dashboard/emotional-checkin-prompt'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/server'
import { getEffortProgress } from '@/lib/effort'
import { cn } from '@/lib/utils'
import type { Tarefa, Categoria, Perfil, SessaoPomodoro } from '@/lib/types'

// Lógica de Streak otimizada para o banco em português
async function calcularSequenciaReal(
  sessions: { concluido_em: string }[],
  hoje = new Date(),
): Promise<number> {
  if (!sessions.length) return 0

  const diasComFoco = new Set(
    sessions.map((s) => startOfDay(new Date(s.concluido_em)).getTime())
  )

  let cursor = startOfDay(hoje)
  if (!diasComFoco.has(cursor.getTime())) {
    cursor = subDays(cursor, 1)
  }

  let streak = 0
  while (diasComFoco.has(cursor.getTime())) {
    streak++
    cursor = subDays(cursor, 1)
  }

  return streak
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const agora = new Date()
  const inicioHoje = startOfDay(agora)
  const fimHoje = endOfDay(agora)

  const saudacao = agora.getHours() < 12 ? 'Bom dia' : agora.getHours() < 18 ? 'Boa tarde' : 'Boa noite'
  const labelData = agora.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  // 1. Busca Multi-Thread de Dados
  const [
    perfilRes,
    tarefasTimelineRes,
    categoriasRes,
    checkinHojeRes,
    totalConcluidasRes,
    esforcoHojeRes,
    sessoesStreakRes,
    maestriaRes,
  ] = await Promise.all([
    supabase.from('profiles').select('nome_completo').eq('id', user.id).maybeSingle(),
    supabase.from('tasks')
      .select('*, category:categories(*)')
      .eq('user_id', user.id)
      .is('tarefa_pai_id', null)
      .neq('status', 'concluida')
      .order('data_vencimento', { ascending: true, nullsFirst: false }),
    supabase.from('categories').select('*').eq('user_id', user.id).order('nome'),
    supabase.from('emotional_checkins').select('*').eq('usuario_id', user.id).gte('criado_em', inicioHoje.toISOString()).maybeSingle(),
    supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'concluida'),
    supabase.from('tasks').select('status, carga_mental, minutos_estimados, data_vencimento').eq('user_id', user.id).gte('data_vencimento', inicioHoje.toISOString()).lt('data_vencimento', fimHoje.toISOString()),
    supabase.from('sessoes_pomodoro').select('concluido_em').eq('usuario_id', user.id).eq('tipo', 'foco').order('concluido_em', { ascending: false }).limit(100),
    supabase.from('mastery_scores').select('*, category:categories(*)').eq('usuario_id', user.id).order('score', { ascending: false }),
  ])

  // 2. Processamento de Identidade
  const nomeCompleto = perfilRes.data?.nome_completo || ''
  const primeiroNome = nomeCompleto.split(' ')[0] || 'Explorador'

  // 3. Processamento de Métricas
  const tarefasTimeline = (tarefasTimelineRes.data || []) as Tarefa[]
  const totalConcluidas = totalConcluidasRes.count || 0
  const streak = await calcularSequenciaReal(sessoesStreakRes.data || [])
  const progressoEsforco = getEffortProgress(esforcoHojeRes.data || [])

  // 4. Processamento do Mapa de Retenção
  const dadosMaestria = (maestriaRes.data || []).map((m: any) => {
    const ultimaSessao = m.data_ultimo_estudo ? new Date(m.data_ultimo_estudo) : null
    const diasSemEstudo = ultimaSessao ? Math.floor((agora.getTime() - ultimaSessao.getTime()) / (1000 * 60 * 60 * 24)) : 999
    return {
      score: Number(m.pontuacao || 0),
      categoria: m.category,
      emRisco: diasSemEstudo >= 3,
      diasSemEstudo
    }
  })

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-700">
      {/* HEADER TÁTICO */}
      <section className="relative group">
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-brand-violet/10 blur-[100px] pointer-events-none group-hover:bg-brand-violet/20 transition-all duration-1000" />
        <h1 className="text-4xl font-[1000] tracking-tighter text-white md:text-6xl italic uppercase">
          {saudacao}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-violet via-brand-cyan to-brand-violet bg-[length:200%_auto] animate-gradient-x drop-shadow-[0_0_20px_rgba(139,92,246,0.3)]">{primeiroNome}</span>.
        </h1>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground mt-2 flex items-center gap-2">
          <span className="w-8 h-[1px] bg-brand-violet/30" />
          {labelData}
        </p>
      </section>

      {/* MÉTRICAS DE OPERAÇÃO */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Para Hoje', valor: tarefasTimeline.length, icon: Target, color: 'brand-violet', sub: 'Tasks' },
          { label: 'Finalizadas', valor: totalConcluidas, icon: CheckCircle2, color: 'emerald-500', sub: 'Total' },
          { label: 'Sequência', valor: streak, icon: Flame, color: 'orange-500', sub: 'Dias', pulse: streak > 0 },
          { label: 'Carga Mental', valor: `${progressoEsforco.percentage}%`, icon: Zap, color: 'sky-500', sub: 'XP', progress: true }
        ].map((m, i) => (
          <div key={i} className={cn(
            "rounded-[2rem] border border-white/5 bg-black/40 p-6 backdrop-blur-xl transition-all hover:scale-[1.02] active:scale-[0.98]",
            `hover:border-${m.color}/30`
          )}>
            <div className="mb-4 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
              <m.icon className={cn("h-4 w-4", m.pulse && "animate-pulse text-orange-500")} /> {m.label}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-[1000] text-white tracking-tighter">{m.valor}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/20">{m.sub}</span>
            </div>
            {m.progress && (
              <Progress value={progressoEsforco.percentage} className="mt-4 h-1 bg-white/5 [&>div]:bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.2)]" />
            )}
          </div>
        ))}
      </section>

      {/* MAPA DE RETENÇÃO NEURAL */}
      <section className="rounded-[2.5rem] border border-white/5 bg-card/20 p-8 backdrop-blur-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-cyber-grid opacity-[0.03] pointer-events-none" />
        
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-violet/10 rounded-2xl border border-brand-violet/20 shadow-neon-violet/10">
              <Brain className="h-6 w-6 text-brand-violet" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tighter text-white">Mapa de Retenção Neural</h2>
              <p className="text-[9px] text-muted-foreground uppercase tracking-[0.3em] font-bold">Estado de integridade do conhecimento</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dadosMaestria.slice(0, 6).map((item: any, idx: number) => (
            <div key={idx} className={cn(
              "group p-5 rounded-3xl border transition-all duration-500 relative overflow-hidden bg-black/20",
              item.emRisco ? "border-red-500/20 hover:border-red-500/40" : "border-white/5 hover:border-brand-violet/30"
            )}>
              {item.emRisco && <div className="absolute inset-0 bg-red-500/[0.02] animate-pulse" />}
              
              <div className="flex justify-between items-start mb-4">
                <span className={cn("text-xs font-black uppercase tracking-widest", item.emRisco ? "text-red-400" : "text-white/80")}>
                  {item.categoria?.nome || 'Geral'}
                </span>
                {item.emRisco ? (
                  <AlertTriangle className="h-4 w-4 text-red-500 animate-bounce" />
                ) : (
                  <ShieldCheck className="h-4 w-4 text-brand-cyan opacity-40 group-hover:opacity-100 transition-opacity" />
                )}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                  <span className="text-muted-foreground">Estabilidade</span>
                  <span className="text-white">{item.score}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full transition-all duration-1000", item.emRisco ? "bg-red-500" : "bg-brand-violet shadow-[0_0_15px_rgba(139,92,246,0.5)]")} 
                    style={{ width: `${item.score}%` }} 
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-[8px] font-black uppercase tracking-widest opacity-40">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {item.emRisco ? `Atraso: ${item.diasSemEstudo}d` : 'Sincronizado'}</span>
                <span>Neural Link v2</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {!checkinHojeRes.data && <EmotionalCheckinPrompt />}

      {/* TIMELINE DE OPERAÇÕES */}
      <section className="min-h-[500px] bg-black/10 rounded-[3rem] p-1 border border-white/5">
        {tarefasTimeline.length > 0 ? (
          <TimelineView tasks={tarefasTimeline} categories={categoriasRes.data || []} />
        ) : (
          <div className="flex h-80 flex-col items-center justify-center p-8 text-center bg-cyber-grid bg-[length:30px_30px] opacity-40">
             <div className="p-5 bg-white/5 rounded-full mb-4 border border-white/10">
               <CheckCircle2 className="h-10 w-10 text-white/20" />
             </div>
             <h3 className="text-2xl font-black text-white/20 uppercase tracking-tighter italic">Setor Neutralizado</h3>
             <p className="text-[10px] text-white/10 uppercase tracking-[0.4em] mt-2 font-bold">Aguardando novos objetivos táticos</p>
          </div>
        )}
      </section>
    </div>
  )
}