'use client'

import { useState } from 'react'
import type { Tarefa, Categoria } from '@/lib/types'
import { TaskItem } from './task-item'
import { TaskEditDialog } from './task-edit-dialog'
import { Target, CheckCircle2 } from 'lucide-react'

interface TaskListProps {
  tasks: Tarefa[]
  categories: Categoria[]
  showCompleted?: boolean
}

export function TaskList({ tasks, categories, showCompleted }: TaskListProps) {
  const [editingTask, setEditingTask] = useState<Tarefa | null>(null)

  if (tasks.length === 0) {
    return (
      <div className="relative flex flex-col items-center justify-center py-20 px-4 border border-dashed border-white/10 rounded-[32px] bg-black/20 text-center backdrop-blur-md overflow-hidden group transition-all duration-500 hover:border-white/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--brand-violet)_0,transparent_60%)] opacity-0 group-hover:opacity-5 transition-opacity duration-1000 pointer-events-none" />
        
        <div className="relative w-20 h-20 bg-white/[0.02] border border-white/5 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.02)] group-hover:shadow-[0_0_30px_var(--brand-glow)] transition-all duration-700">
          {showCompleted ? (
            <CheckCircle2 className="w-10 h-10 text-muted-foreground/40 group-hover:text-emerald-400/80 transition-colors duration-500" />
          ) : (
            <Target className="w-10 h-10 text-muted-foreground/40 group-hover:text-brand-violet/80 transition-colors duration-500" />
          )}
        </div>
        
        <h3 className="text-xl font-black uppercase tracking-tighter text-white/90 mb-2">
          {showCompleted ? 'Sem Conquistas Registradas' : 'Radar Limpo'}
        </h3>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground max-w-sm font-medium leading-relaxed">
          {showCompleted 
            ? "O seu histórico de missões concluídas está vazio. Execute tarefas para preencher este relatório." 
            : "Nenhuma missão ativa no momento. Adicione novos objetivos ao seu cronograma para iniciar o foco."}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {tasks.map((task, index) => (
          <div 
            key={task.id}
            className="animate-in slide-in-from-bottom-4 fade-in duration-500 fill-mode-both"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <TaskItem
              task={task}
              onEdit={() => setEditingTask(task)}
              showCompleted={showCompleted}
            />
          </div>
        ))}
      </div>

      <TaskEditDialog
        task={editingTask}
        categories={categories}
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
      />
    </>
  )
}