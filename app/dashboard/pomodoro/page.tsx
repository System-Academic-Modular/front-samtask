import { createClient } from '@/lib/supabase/server'
import { PomodoroView } from '@/components/dashboard/pomodoro-view'
import type { Task, Profile, PomodoroSession } from '@/lib/types'

export default async function PomodoroPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // 1. Busca tarefas pendentes para o seletor de foco
  // Ajustado: status 'done' -> 'concluida'
  const tasksQuery = supabase
    .from('tasks')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('user_id', user.id)
    .neq('status', 'concluida') 
    .is('parent_id', null)
    .order('carga_mental', { ascending: false }) // Prioriza tarefas mais desafiadoras
    .order('created_at', { ascending: false })

  // 2. Busca perfil (configurações de timer como tempo de foco/pausa)
  const profileQuery = supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // 3. Busca sessões do dia para o contador de produtividade
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  
  const sessionsQuery = supabase
    .from('sessoes_pomodoro')
    .select('*')
    .eq('user_id', user.id)
    .gte('completed_at', hoje.toISOString())
    .order('completed_at', { ascending: false })

  // Execução paralela para performance máxima
  const [tasksRes, profileRes, sessionsRes] = await Promise.all([
    tasksQuery,
    profileQuery,
    sessionsQuery
  ])

  // Casting de tipos para garantir que o componente receba exatamente o que espera
  const tasks = (tasksRes.data || []) as Task[]
  const profile = profileRes.data as Profile
  const todaySessions = (sessionsRes.data || []) as PomodoroSession[]

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Background Decor - Efeito de pulso lento para foco */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-violet/5 blur-[120px] rounded-full pointer-events-none -z-10 animate-pulse" />

      <PomodoroView 
        tasks={tasks} 
        profile={profile}
        todaySessions={todaySessions}
      />

      <footer className="flex justify-center items-center gap-6 py-4 opacity-20 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.5em] text-white">
          <span className="w-2 h-[1px] bg-brand-violet" />
          Neural Engine • Deep Work Protocol
          <span className="w-2 h-[1px] bg-brand-violet" />
        </div>
      </footer>
    </div>
  )
}