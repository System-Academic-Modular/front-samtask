import { createClient } from '@/lib/supabase/server'
import { CalendarView } from '@/components/dashboard/calendar-view'
import { HeaderActions } from '@/components/dashboard/header-actions'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

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

  // MUDANÇA: h-full em vez de cálculo fixo, e flex-col para estruturar
  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Calendário</h1>
          <p className="text-muted-foreground">
            Visão panorâmica dos seus prazos.
          </p>
        </div>
        <HeaderActions categories={categories} />
      </div>

      {/* Container do Calendário: flex-1 para ocupar o resto e min-h-0 para permitir scroll interno */}
      <div className="flex-1 min-h-0 bg-[#121214]/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm shadow-2xl">
        <CalendarView tasks={tasks} categories={categories} />
      </div>
    </div>
  )
}