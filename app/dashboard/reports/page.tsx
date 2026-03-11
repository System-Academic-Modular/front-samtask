import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ReportsView } from '@/components/dashboard/reports-view'
import { BarChart3, TrendingUp } from 'lucide-react'
import type { Tarefa, Categoria, PomodoroSession } from '@/lib/types'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // 1. Definição do intervalo temporal (Últimos 7 dias)
  const seteDiasAtras = new Date()
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)
  seteDiasAtras.setHours(0, 0, 0, 0)

  // 2. Busca Paralela de Dados (Performance de Elite)
  const [tasksRes, sessionsRes, categoriesRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('*, category:categories(*)')
      .eq('user_id', user.id),
    
    supabase
      .from('sessoes_pomodoro')
      .select('*')
      .eq('user_id', user.id)
      .gte('completed_at', seteDiasAtras.toISOString())
      .order('completed_at', { ascending: true }),

    supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
  ])

  // 3. Casting e Preparação
  const tasks = (tasksRes.data || []) as Tarefa[]
  const sessions = (sessionsRes.data || []) as PomodoroSession[]
  const categories = (categoriesRes.data || []) as Categoria[]

  return (
    <div className="h-full flex flex-col space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Background FX - Atmosfera de Data Analytics */}
      <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-brand-cyan/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      
      {/* Header de Insights */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-cyan/10 rounded-xl border border-brand-cyan/20 shadow-neon-cyan/10">
              <BarChart3 className="h-6 w-6 text-brand-cyan" />
            </div>
            <h1 className="text-3xl font-[1000] italic uppercase tracking-tighter text-white">
              Análise de Performance
            </h1>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">
            <TrendingUp className="w-3 h-3 text-brand-cyan" />
            <span>Métricas de rendimento e carga cognitiva</span>
          </div>
        </div>

        {/* Resumo Rápido no Header */}
        <div className="hidden lg:flex gap-8 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
          <div className="text-center">
            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Sessões (7d)</p>
            <p className="text-xl font-black text-white">{sessions.length}</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Tasks Ativas</p>
            <p className="text-xl font-black text-brand-cyan">
              {tasks.filter(t => t.status !== 'concluida').length}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content: O ReportsView lidará com a lógica de agregação dos gráficos */}
      <main className="flex-1 relative z-10">
        <ReportsView
          tasks={tasks}
          sessions={sessions}
          categories={categories}
        />
      </main>

      {/* Footer de Auditoria */}
      <footer className="flex justify-between items-center px-4 text-[9px] font-black uppercase tracking-[0.5em] text-white/10">
        <span>Analytics Engine v5.2</span>
        <span>Sincronizado via Neural Link</span>
      </footer>
    </div>
  )
}