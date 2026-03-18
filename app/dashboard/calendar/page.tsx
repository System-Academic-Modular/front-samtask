import { createClient } from '@/lib/supabase/server'
import { CalendarView } from '@/components/dashboard/calendar-view'
import { HeaderActions } from '@/components/dashboard/header-actions'
import { CalendarDays, Sparkles } from 'lucide-react'
import type { Task, Category } from '@/lib/types'
import { normalizeCategory, normalizeTask } from '@/lib/normalizers'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const [tasksResult, categoriesResult] = await Promise.all([
    supabase
      .from('tarefas')
      .select('*, categoria:categorias(*)')
      .eq('usuario_id', user.id)
      .neq('status', 'concluida')
      .not('data_vencimento', 'is', null)
      .order('data_vencimento', { ascending: true }),
    supabase
      .from('categorias')
      .select('*')
      .eq('usuario_id', user.id)
      .order('nome', { ascending: true }),
  ])

  const tasks = (tasksResult.data || []).map(normalizeTask) as Task[]
  const categories = (categoriesResult.data || []).map(normalizeCategory) as Category[]

  return (
    <div className="flex flex-col h-full space-y-8 relative animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="absolute -top-24 right-0 w-[500px] h-[500px] bg-brand-cyan/10 blur-[120px] rounded-full pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-0 -left-24 w-[300px] h-[300px] bg-brand-violet/5 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0 relative z-10 px-1">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-cyan/10 rounded-lg border border-brand-cyan/20">
              <CalendarDays className="h-6 w-6 text-brand-cyan" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter italic text-white leading-none">
              Cronograma Tatico
            </h1>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">
            <Sparkles className="w-3 h-3 text-brand-cyan/50" />
            <span>Sincronizacao de prazos e carga cognitiva</span>
          </div>
        </div>

        <div className="bg-card/40 p-1 rounded-2xl border border-white/5 backdrop-blur-md">
          <HeaderActions categories={categories} />
        </div>
      </div>

      <div className="flex-1 min-h-[600px] relative z-10 bg-card/20 border border-white/5 rounded-[32px] overflow-hidden backdrop-blur-sm shadow-2xl">
        <div className="absolute inset-0 bg-cyber-grid opacity-[0.03] pointer-events-none" />
        <CalendarView tasks={tasks} categories={categories} />
      </div>

      <div className="flex justify-center text-[9px] font-black uppercase tracking-[0.4em] text-white/20 pb-4">
        Deep Work Engine • Tactical Calendar v2.0
      </div>
    </div>
  )
}
