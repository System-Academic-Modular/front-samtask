import { createClient } from '@/lib/supabase/server'
import { ProjectTree } from '@/components/dashboard/project-tree'
import { HeaderActions } from '@/components/dashboard/header-actions'
import { Layers } from 'lucide-react'
import type { Task, Category } from '@/lib/types'
import { normalizeCategory, normalizeTask } from '@/lib/normalizers'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const [tasksResult, categoriesResult] = await Promise.all([
    supabase
      .from('tarefas')
      .select('*, categoria:categorias(*)')
      .eq('usuario_id', user.id)
      .neq('status', 'concluida')
      .order('criado_em', { ascending: true }),
    supabase
      .from('categorias')
      .select('*')
      .eq('usuario_id', user.id)
      .order('nome', { ascending: true }),
  ])

  const tasks = (tasksResult.data || []).map(normalizeTask) as Task[]
  const categories = (categoriesResult.data || []).map(normalizeCategory) as Category[]

  return (
    <div className="h-full flex flex-col space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-violet/5 blur-[150px] rounded-full pointer-events-none -z-10" />

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 relative z-10 px-1">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-[1000] italic uppercase tracking-tighter text-white">
            <Layers className="h-7 w-7 text-brand-violet" />
            Arquitetura de Projetos
          </h1>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground mt-1 ml-1">
            Mapeamento de dependencias e quebra de objetivos complexos.
          </p>
        </div>
        <div className="bg-card/30 p-1 rounded-2xl border border-white/5 backdrop-blur-md">
          <HeaderActions categories={categories} />
        </div>
      </header>

      <div className="flex-1 min-h-0 relative z-10 bg-[#0c0c0e]/50 border border-white/5 rounded-[32px] overflow-hidden backdrop-blur-xl shadow-2xl flex flex-col">
        <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <ProjectTree tasks={tasks} categories={categories} />
        </div>
      </div>

      <div className="flex justify-between items-center px-4 text-[8px] font-black uppercase tracking-[0.5em] text-white/10">
        <span>Hierarchy Engine v4.0</span>
        <span>FocusOS Tactical System</span>
      </div>
    </div>
  )
}
