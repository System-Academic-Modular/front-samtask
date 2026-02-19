'use client'

import { useState, useTransition } from 'react'
import { format, isToday, isTomorrow, isPast, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  Clock, 
  MoreHorizontal, 
  Calendar as CalendarIcon, 
  AlertCircle, 
  CheckCircle2, 
  Circle, 
  ArrowRight,
  Loader2
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import { cn } from '@/lib/utils'
import type { Task, Category } from '@/lib/types'
import { TaskEditDialog } from '@/components/dashboard/task-edit-dialog'
import { updateTask } from '@/lib/actions/tasks' // Importe a action!

interface TimelineViewProps {
  tasks: Task[]
  categories?: Category[]
}

export function TimelineView({ tasks, categories = [] }: TimelineViewProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isPending, startTransition] = useTransition()
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Função para Marcar como Concluída Rápido
  const handleQuickComplete = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation() // Não abre o modal
    if (task.status === 'done' || isPending) return

    setProcessingId(task.id)
    startTransition(async () => {
      const result = await updateTask(task.id, { status: 'done' })
      if (result.error) {
        toast.error('Erro ao concluir tarefa')
      } else {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#0ea5e9', '#10b981', '#f59e0b'],
        })
        toast.success('Tarefa concluída! Boa 🚀')
      }
      setProcessingId(null)
    })
  }

  // Helper para Status Visual
  const getTaskStatusConfig = (task: Task) => {
    if (task.status === 'done') {
      return {
        icon: CheckCircle2,
        colorClass: "text-brand-emerald",
        bgClass: "bg-brand-emerald/10",
        borderClass: "border-brand-emerald/20 ring-brand-emerald/20"
      }
    }
    if (task.priority === 'urgent') {
      return {
        icon: AlertCircle,
        colorClass: "text-brand-rose",
        bgClass: "bg-brand-rose/10",
        borderClass: "border-brand-rose/20 ring-brand-rose/20"
      }
    }
    if (task.status === 'in_progress') {
      return {
        icon: Clock,
        colorClass: "text-brand-violet",
        bgClass: "bg-brand-violet/10",
        borderClass: "border-brand-violet/20 ring-brand-violet/20"
      }
    }
    return {
      icon: Circle,
      colorClass: "text-muted-foreground",
      bgClass: "bg-white/5",
      borderClass: "border-white/10 ring-white/10"
    }
  }

  // Helper para Data "Humana"
  const getHumanDate = (dateString: string | null) => {
    if (!dateString) return 'Sem data'
    const date = new Date(dateString)
    if (isToday(date)) return 'Hoje'
    if (isTomorrow(date)) return 'Amanhã'
    if (isPast(startOfDay(date))) return 'Atrasado'
    return format(date, "dd MMM", { locale: ptBR })
  }

  return (
    <div className="space-y-0 relative py-4">
      {/* Linha vertical contínua de fundo (a "trilha") */}
      <div className="absolute left-[19px] top-6 bottom-4 w-px bg-gradient-to-b from-white/10 via-white/10 to-transparent -z-10" />

      {tasks.map((task, index) => {
        const config = getTaskStatusConfig(task)
        const StatusIcon = config.icon
        const isProcessing = processingId === task.id
        const isTaskLate = task.due_date && isPast(startOfDay(new Date(task.due_date))) && task.status !== 'done'

        return (
          <div 
            key={task.id} 
            className="group relative flex gap-4 md:gap-6 pb-6 last:pb-0 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
            style={{ animationDelay: `${index * 100}ms` }} // Efeito cascata lindo
          >
            
            {/* Coluna do Ícone (Timeline Node) */}
            <div className="flex flex-col items-center mt-1 shrink-0">
              <button 
                onClick={(e) => handleQuickComplete(e, task)}
                disabled={task.status === 'done' || isPending}
                className={cn(
                  "relative flex items-center justify-center w-10 h-10 rounded-full border bg-[#09090b] transition-all duration-300 z-10",
                  config.colorClass,
                  config.borderClass,
                  task.status !== 'done' ? "hover:scale-110 hover:shadow-lg cursor-pointer ring-4 ring-transparent hover:ring-current/20" : "cursor-default"
                )}
                title={task.status === 'done' ? 'Concluída' : 'Marcar como concluída'}
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  // Se passar o mouse e não estiver concluída, mostra o Check
                  <div className="relative flex items-center justify-center w-full h-full">
                     <StatusIcon className={cn("w-5 h-5 transition-opacity duration-200", task.status !== 'done' && "group-hover/node:opacity-0")} />
                     {task.status !== 'done' && (
                        <CheckCircle2 className="w-5 h-5 absolute opacity-0 transition-opacity duration-200 group-hover/node:opacity-100" />
                     )}
                  </div>
                )}
              </button>
            </div>

            {/* O Card de Conteúdo */}
            <div 
              className={cn(
                "flex-1 rounded-2xl border bg-black/20 backdrop-blur-sm p-4 md:p-5 transition-all duration-300",
                "hover:bg-white/[0.02] hover:border-white/20 hover:shadow-xl cursor-pointer",
                "group-hover:translate-x-1 group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]",
                task.status === 'done' && "opacity-60 hover:opacity-100 grayscale hover:grayscale-0",
                config.borderClass
              )}
              onClick={() => setEditingTask(task)}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                
                {/* Lado Esquerdo: Info */}
                <div className="space-y-3 w-full">
                  
                  {/* Tags e Data */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {task.category && (
                      <Badge variant="outline" style={{ borderColor: task.category.color, color: task.category.color }} className="bg-transparent font-medium shadow-sm">
                        {task.category.name}
                      </Badge>
                    )}
                    
                    <span className={cn(
                        "flex items-center gap-1 font-medium px-2 py-0.5 rounded-full border", 
                        isTaskLate ? "text-brand-rose bg-brand-rose/10 border-brand-rose/20" : 
                        task.status === 'done' ? "text-muted-foreground border-transparent" :
                        "text-white/70 bg-white/5 border-white/10"
                    )}>
                      <CalendarIcon className="w-3 h-3" />
                      {getHumanDate(task.due_date)}
                    </span>
                    
                    {task.priority === 'urgent' && task.status !== 'done' && (
                      <span className="flex items-center gap-1 text-xs text-brand-rose font-bold animate-pulse">
                          <AlertCircle className="w-3 h-3" /> Urgente
                      </span>
                    )}
                  </div>

                  {/* Título e Desc */}
                  <div>
                    <h3 className={cn(
                        "text-base md:text-lg font-semibold text-white/90 leading-tight", 
                        task.status === 'done' && "line-through text-muted-foreground"
                    )}>
                      {task.title}
                    </h3>
                    {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                        {task.description}
                        </p>
                    )}
                  </div>

                  {/* Footer (Mobile Friendly) */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    {task.estimated_minutes ? (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                            <Clock className="w-3 h-3 text-brand-cyan" />
                            {task.estimated_minutes} min
                        </div>
                    ) : (
                       <div /> // Spacer
                    )}

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-violet text-xs flex items-center gap-1 font-medium bg-brand-violet/10 px-2 py-1 rounded-full">
                        Detalhes <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>

                {/* Menu de Ações (Desktop direita, Mobile topo-direita flutuante) */}
                <div className="absolute right-4 top-4 md:relative md:right-0 md:top-0" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white rounded-full hover:bg-white/10">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#18181b] border-white/10 shadow-2xl">
                            <DropdownMenuItem onClick={() => setEditingTask(task)} className="cursor-pointer">
                                Editar Tarefa
                            </DropdownMenuItem>
                            {/* Futuro: Adicionar Excluir aqui */}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

              </div>
            </div>
          </div>
        )
      })}

      <TaskEditDialog 
        open={!!editingTask} 
        onOpenChange={(open) => !open && setEditingTask(null)}
        task={editingTask}
        categories={categories}
      />
    </div>
  )
}