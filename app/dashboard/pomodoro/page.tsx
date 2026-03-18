import { createClient } from '@/lib/supabase/server'
import { PomodoroView } from '@/components/dashboard/pomodoro-view'
import type { Task, Profile, PomodoroSession } from '@/lib/types'
import { normalizePomodoroSession, normalizeProfile, normalizeTask } from '@/lib/normalizers'

export default async function PomodoroPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const tasksQuery = supabase
    .from('tarefas')
    .select(`
      *,
      categoria:categorias(*)
    `)
    .eq('usuario_id', user.id)
    .neq('status', 'concluida')
    .is('tarefa_pai_id', null)
    .order('carga_mental', { ascending: false })
    .order('criado_em', { ascending: false })

  const profileQuery = supabase
    .from('perfis')
    .select('*')
    .eq('id', user.id)
    .single()

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  
  const sessionsQuery = supabase
    .from('sessoes_pomodoro')
    .select('*')
    .eq('usuario_id', user.id)
    .gte('concluido_em', hoje.toISOString())
    .order('concluido_em', { ascending: false })

  const [tasksRes, profileRes, sessionsRes] = await Promise.all([
    tasksQuery,
    profileQuery,
    sessionsQuery
  ])

  const tasks = (tasksRes.data || []).map(normalizeTask) as Task[]
  const profile = (profileRes.data ? normalizeProfile(profileRes.data) : null) as Profile | null
  const todaySessions = (sessionsRes.data || []).map(normalizePomodoroSession) as PomodoroSession[]

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
