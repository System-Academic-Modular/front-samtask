import { createClient } from '@/lib/supabase/server'
import { CalendarView } from '@/components/dashboard/calendar-view'
import { HeaderActions } from '@/components/dashboard/header-actions'
import { CalendarDays } from 'lucide-react'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Busca tarefas pendentes e categorias (A Fazer, Em Foco, Em Revisão)
  const [tasksResult, categoriesResult] = await Promise.all([
    supabase.from('tasks')
      .select('*, category:categories(*)')
      .eq('user_id', user.id)
      .neq('status', 'done')
      .not('due_date', 'is', null)
      .order('due_date', { ascending: true }),
    
    supabase.from('categories').select('*').eq('user_id', user.id)
  ])

  const tasks = tasksResult.data || []
  const categories = categoriesResult.data || []

  return (
    <div className="flex flex-col h-full space-y-6 relative animate-in fade-in duration-500">
      {/* Glow de Fundo do Dashboard */}
      <div className="absolute top-0 right-1/4 w-[40vw] h-[40vw] bg-brand-cyan/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Header Tático */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 relative z-10">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black uppercase tracking-tighter text-white">
            <CalendarDays className="h-6 w-6 text-brand-cyan" />
            Cronograma Tático
          </h1>
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mt-1">
            Visão panorâmica de prazos e janelas de revisão.
          </p>
        </div>
        <HeaderActions categories={categories} />
      </div>

      {/* Container Principal */}
      <div className="flex-1 min-h-0 relative z-10 shadow-2xl">
        <CalendarView tasks={tasks} categories={categories} />
      </div>
    </div>
  )
}