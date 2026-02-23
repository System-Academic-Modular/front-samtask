'use client'

import { useState } from 'react'
import type { Tarefa, Categoria } from '@/lib/types'
import { TaskItem } from './task-item'
import { TaskEditDialog } from './task-edit-dialog'
import { ListTodo } from 'lucide-react'

interface TaskListProps {
  tasks: Tarefa[]
  categories: Categoria[]
  showCompleted?: boolean
}

export function TaskList({ tasks, categories, showCompleted }: TaskListProps) {
  const [editingTask, setEditingTask] = useState<Tarefa | null>(null)

  // Empty State elegante
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-white/10 rounded-3xl bg-white/5 text-center backdrop-blur-sm animate-in fade-in duration-500">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
          <ListTodo className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Nenhuma tarefa encontrada</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {showCompleted 
            ? "O seu histórico de conquistas está vazio. Conclua tarefas para vê-las aqui!" 
            : "Tudo limpo por aqui! Adicione novas tarefas para começar a focar."}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {tasks.map((task, index) => (
          <div 
            key={task.id} // Alterado de KEY_TAREFA para id (coluna real do banco)
            className="animate-in slide-in-from-bottom-4 fade-in duration-500 fill-mode-both"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <TaskItem
              task={task} // Removido o 'as any' pois agora os tipos batem
              onEdit={() => setEditingTask(task)}
              showCompleted={showCompleted}
            />
          </div>
        ))}
      </div>

      <TaskEditDialog
        task={editingTask} // Removido o 'as any'
        categories={categories}
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
      />
    </>
  )
}