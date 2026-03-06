'use client'

import { useMemo, useState, useTransition } from 'react'
import confetti from 'canvas-confetti'
import {
  Brain,
  Calendar,
  GripVertical,
  Kanban,
  MoreHorizontal,
  Pencil,
  Play,
  Target,
  Trash2,
  RefreshCw,
  Zap
} from 'lucide-react'
import { toast } from 'sonner'
import { deleteTask, updateTask } from '@/lib/actions/tasks'
import { QuickAddTask } from '@/components/dashboard/quick-add-task'
import { TaskEditDialog } from '@/components/dashboard/task-edit-dialog'
import { ZenMode } from '@/components/dashboard/zen-mode'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Category, Task, TaskStatus, TeamMember } from '@/lib/types'

interface KanbanViewProps {
  tasks: Task[]
  categories: Category[]
  selectedTeamId?: string | null
  teamMembers?: TeamMember[]
}

// 1. Nova Coluna 'review' inserida no fluxo
const columns: { id: TaskStatus; title: string; className: string; icon: React.ReactNode }[] = [
  { id: 'todo', title: 'A Fazer', className: 'border-slate-500/20 bg-slate-500/5', icon: <Target className="w-4 h-4 text-slate-400" /> },
  { id: 'in_progress', title: 'Em Foco', className: 'border-brand-violet/30 bg-brand-violet/10', icon: <Zap className="w-4 h-4 text-brand-violet animate-pulse" /> },
  { id: 'review', title: 'Em Revisão', className: 'border-emerald-500/30 bg-emerald-500/5', icon: <RefreshCw className="w-4 h-4 text-emerald-400" /> },
  { id: 'done', title: 'Concluídas', className: 'border-white/10 bg-white/5 opacity-80', icon: <Target className="w-4 h-4 text-white/50" /> },
]

const priorityOrder: Record<Task['priority'], number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
}

function priorityDot(priority: Task['priority']) {
  if (priority === 'urgent') return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)] animate-pulse'
  if (priority === 'high') return 'bg-orange-400'
  if (priority === 'medium') return 'bg-amber-300'
  return 'bg-slate-400'
}

export function KanbanView({
  tasks,
  categories,
  selectedTeamId,
  teamMembers = [],
}: KanbanViewProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [zenTask, setZenTask] = useState<Task | null>(null)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [isPending, startTransition] = useTransition()

  const memberByUserId = useMemo(
    () => new Map(teamMembers.map((member) => [member.user_id, member])),
    [teamMembers],
  )

  const tasksByColumn = useMemo(() => {
    // 2. Estado expandido para abraçar a nova tipagem
    const groups: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      review: [],
      done: [],
    }

    // Inicialização segura caso venha algum status alienígena do banco
    for (const task of tasks) {
      if (groups[task.status]) {
         groups[task.status].push(task)
      } else {
         groups.todo.push(task) // Fallback para tarefas órfãs
      }
    }

    for (const columnKey of Object.keys(groups) as TaskStatus[]) {
      groups[columnKey].sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
        if (priorityDiff !== 0) return priorityDiff
        return (a.position ?? 0) - (b.position ?? 0)
      })
    }

    return groups
  }, [tasks])

  function handleDrop(newStatus: TaskStatus) {
    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null)
      return
    }

    startTransition(async () => {
      const result = await updateTask(draggedTask.id, { status: newStatus })
      if (result.error) {
        toast.error('Erro ao mover tarefa', { description: result.error })
      } else if (newStatus === 'done') {
        confetti({
          particleCount: 55,
          spread: 60,
          origin: { y: 0.8 },
          colors: [draggedTask.category?.color || '#8b5cf6', '#38bdf8', '#4f46e5'],
        })
        toast.success('Missão concluída! Módulo Neural fixado.')
      } else if (newStatus === 'review') {
        toast.success('Modo de Retenção Espaçada ativado.')
      } else {
        toast.success('Tarefa re-alocada.')
      }
      setDraggedTask(null)
    })
  }

  function onDeleteTask(taskId: string) {
    startTransition(async () => {
      const result = await deleteTask(taskId)
      if (result.error) {
        toast.error('Erro ao excluir tarefa', { description: result.error })
        return
      }
      toast.success('Missão abortada e excluída.')
    })
  }

  // 3. O Componente Visual da Bateria de Carga
  const renderCognitiveBattery = (load: number) => (
    <div className="flex items-center gap-0.5" title={`Carga Mental: Nível ${load}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div 
          key={i} 
          className={cn(
            "w-1.5 h-2 rounded-[1px]",
            i < load ? "bg-sky-400 shadow-[0_0_5px_rgba(56,189,248,0.5)]" : "bg-white/10"
          )}
        />
      ))}
    </div>
  )

  return (
    <div className="flex h-full min-h-0 flex-col space-y-6 relative">
      {/* Glow de Fundo do Dashboard */}
      <div className="absolute top-0 left-1/4 w-[50vw] h-[50vw] bg-brand-violet/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between relative z-10">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black uppercase tracking-tighter text-white">
            <Kanban className="h-6 w-6 text-brand-violet" />
            Fluxo Tático
          </h1>
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mt-1">
            {selectedTeamId
              ? 'Protocolo de Equipe Sincronizado.'
              : 'Arraste os módulos para manter o pipeline de execução limpo.'}
          </p>
        </div>
      </div>

      <div className="relative z-10">
         <QuickAddTask
           categories={categories}
           selectedTeamId={selectedTeamId}
           teamMembers={teamMembers}
         />
      </div>

      <div className="flex min-h-0 flex-1 gap-5 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent custom-scrollbar relative z-10">
        {columns.map((column) => (
          <div
            key={column.id}
            className={cn(
              'flex min-h-[520px] w-[320px] shrink-0 snap-center flex-col rounded-[24px] border p-4 backdrop-blur-md transition-colors',
              column.className,
              draggedTask && draggedTask.status !== column.id && "border-dashed border-white/20"
            )}
            onDragOver={(event) => {
              event.preventDefault()
              event.dataTransfer.dropEffect = 'move'
            }}
            onDrop={(event) => {
              event.preventDefault()
              handleDrop(column.id)
            }}
          >
            <div className="mb-5 flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2 text-white/90">
                {column.icon} {column.title}
              </h3>
              <Badge variant="outline" className="border-white/10 bg-black/40 text-[10px] font-mono shadow-inner">
                {tasksByColumn[column.id].length}
              </Badge>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
              {tasksByColumn[column.id].map((task) => {
                const assignee = task.assignee_id ? memberByUserId.get(task.assignee_id) : null
                const assigneeName = assignee?.profile?.full_name || task.assignee?.full_name || 'Sem responsável'
                const initials = assigneeName.split(' ').map((c) => c.charAt(0)).join('').slice(0, 2).toUpperCase()
                const isOverdue = !!task.due_date && new Date(task.due_date).getTime() < Date.now() && task.status !== 'done'
                const isReviewTask = task.status === 'review' || task.title.toLowerCase().includes('revisão')

                return (
                  <article
                    key={task.id}
                    draggable
                    onDragStart={(event) => {
                      setDraggedTask(task)
                      event.dataTransfer.effectAllowed = 'move'
                    }}
                    className={cn(
                      'group relative rounded-2xl border bg-black/40 p-4 shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-grab active:cursor-grabbing',
                      isReviewTask 
                        ? 'border-emerald-500/30 hover:border-emerald-500/60 hover:shadow-[0_5px_20px_rgba(16,185,129,0.15)] bg-emerald-500/[0.02]' 
                        : 'border-white/10 hover:border-white/30 hover:shadow-[0_5px_20px_rgba(139,92,246,0.1)]',
                      isPending && draggedTask?.id === task.id && 'scale-95 opacity-40',
                      task.status === 'done' && 'grayscale-[0.5] opacity-60 hover:grayscale-0 hover:opacity-100'
                    )}
                    style={{ '--hover-glow': task.category?.color || 'var(--brand-violet)' } as React.CSSProperties}
                  >
                    {/* Efeito Sidebar Hover Dynamic Color */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-500 bg-transparent group-hover:bg-[var(--hover-glow)]" />

                    <div className="mb-3 flex items-start justify-between gap-2 pl-1">
                      {task.category ? (
                        <span 
                          className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded-full border border-white/5" 
                          style={{ color: task.category.color }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: task.category.color }} />
                          {task.category.name}
                        </span>
                      ) : (
                        <span className="text-[9px] uppercase tracking-widest text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">Sistema</span>
                      )}

                      <div className="flex items-center gap-1 opacity-0 transition-opacity md:group-hover:opacity-100">
                        {task.status !== 'done' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full text-brand-violet hover:bg-brand-violet/20 hover:text-white"
                            onClick={(event) => {
                              event.stopPropagation()
                              setZenTask(task)
                            }}
                          >
                            <Play className="h-3 w-3 fill-current ml-0.5" />
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-muted-foreground hover:bg-white/10 hover:text-white">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-white/10 bg-[#0c0c0e] shadow-2xl">
                            <DropdownMenuItem onClick={() => setEditingTask(task)} className="focus:bg-white/10 cursor-pointer">
                              <Pencil className="mr-2 h-4 w-4 text-brand-cyan" /> Editar Módulo
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem onClick={() => onDeleteTask(task.id)} className="text-red-400 focus:bg-red-500/10 focus:text-red-300 cursor-pointer">
                              <Trash2 className="mr-2 h-4 w-4" /> Abortar (Excluir)
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <h4 className={cn(
                      'pl-1 line-clamp-2 pr-2 text-sm font-bold text-white/90 group-hover:text-white transition-colors',
                      task.status === 'done' && 'line-through text-white/40'
                    )}>
                      {task.title}
                    </h4>

                    {/* Bateria de Carga e Infos */}
                    <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 pl-1">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Brain className="w-3 h-3 text-sky-400" />
                          {renderCognitiveBattery(task.cognitive_load)}
                        </div>
                        <span className={cn('h-1.5 w-1.5 rounded-full', priorityDot(task.priority))} title={`Prioridade: ${task.priority}`} />
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        {task.due_date && (
                          <span className={cn(
                            'inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest',
                            isOverdue ? 'text-rose-400 animate-pulse' : 'text-muted-foreground'
                          )}>
                            <Calendar className="h-3 w-3" />
                            {new Date(task.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        )}
                        
                        {task.assignee_id && (
                          <Avatar className="h-6 w-6 border border-white/10 ring-1 ring-transparent group-hover:ring-brand-violet/50 transition-all shadow-md" title={assigneeName}>
                            <AvatarImage src={assignee?.profile?.avatar_url || task.assignee?.avatar_url || ''} />
                            <AvatarFallback className="bg-brand-violet/20 text-[9px] font-black text-brand-violet">
                              {initials || 'US'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}

              {tasksByColumn[column.id].length === 0 && (
                <div className="flex h-32 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/5 bg-black/10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 transition-colors hover:border-white/10 hover:text-muted-foreground">
                  <GripVertical className="mb-2 h-5 w-5 opacity-30" />
                  Drop Zone
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <TaskEditDialog
        task={editingTask}
        categories={categories}
        teamMembers={teamMembers}
        open={Boolean(editingTask)}
        onOpenChange={(open) => !open && setEditingTask(null)}
      />

      <ZenMode isOpen={Boolean(zenTask)} onClose={() => setZenTask(null)} taskTitle={zenTask?.title} />
    </div>
  )
}