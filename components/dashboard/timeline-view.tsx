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
  Loader2,
  Target
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
import type { Tarefa, Categoria } from '@/lib/types'
import { TaskEditDialog } from '@/components/dashboard/task-edit-dialog'
import { updateTask } from '@/lib/actions/tasks'
import { ZenMode } from '@/components/dashboard/zen-mode'

interface TimelineViewProps {
  tasks: Tarefa[] // Usando a interface atualizada Tarefa
  categories?: Categoria[]
}

export function TimelineView({ tasks, categories = [] }: TimelineViewProps) {
  const [editingTask, setEditingTask] = useState<Tarefa | null>(null)
  const [zenTask, setZenTask] = useState<Tarefa | null>(null)
  const [isPending, startTransition] = useTransition()
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Função para Marcar como Concluída Rápido
  const handleQuickComplete = (e: React.MouseEvent, task: Tarefa) => {
    e.stopPropagation() 
    if (task.STATUS === 'CONCLUIDO' || isPending) return

    setProcessingId(task.KEY_TAREFA)
    startTransition(async () => {
      // Nota: o updateTask no back-end precisará ser atualizado para receber o padrão novo
      const result = await updateTask(task.KEY_TAREFA, { STATUS: 'CONCLUIDO' })
      if (result.error) {
        toast.error('Erro ao concluir tarefa')
      } else {
        confetti({
          particleCount: 50, spread: 60, origin: { y: 0.8 },
          colors: ['#0ea5e9', '#10b981', '#f59e0b'],
        })
        toast.success('Tarefa concluída! Boa 🚀')
      }
      setProcessingId(null)
    })
  }

  // Helper para Status Visual
  const getTaskStatusConfig = (task: Tarefa) => {
    if (task.STATUS === 'CONCLUIDO') {
      return { icon: CheckCircle2, colorClass: "text-brand-emerald", bgClass: "bg-brand-emerald/10", borderClass: "border-brand-emerald/20 ring-brand-emerald/20" }
    }
    if (task.PRIORIDADE === 'URGENTE') {
      return { icon: AlertCircle, colorClass: "text-brand-rose", bgClass: "bg-brand-rose/10", borderClass: "border-brand-rose/20 ring-brand-rose/20" }
    }
    if (task.STATUS === 'EM_ANDAMENTO') {
      return { icon: Clock, colorClass: "text-brand-violet", bgClass: "bg-brand-violet/10", borderClass: "border-brand-violet/20 ring-brand-violet/20" }
    }
    return { icon: Circle, colorClass: "text-muted-foreground", bgClass: "bg-white/5", borderClass: "border-white/10 ring-white/10" }
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
      <div className="absolute left-[19px] top-6 bottom-4 w-px bg-gradient-to-b from-white/10 via-white/10 to-transparent -z-10" />

      {tasks.map((task, index) => {
        const config = getTaskStatusConfig(task)
        const StatusIcon = config.icon
        const isProcessing = processingId === task.KEY_TAREFA
        const isTaskLate = task.DATA_VENCIMENTO && isPast(startOfDay(new Date(task.DATA_VENCIMENTO))) && task.STATUS !== 'CONCLUIDO'

        return (
          <div 
            key={task.KEY_TAREFA} 
            className="group relative flex gap-4 md:gap-6 pb-6 last:pb-0 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
            style={{ animationDelay: `${index * 100}ms` }} 
          >
            
            <div className="flex flex-col items-center mt-1 shrink-0">
              <button 
                onClick={(e) => handleQuickComplete(e, task)}
                disabled={task.STATUS === 'CONCLUIDO' || isPending}
                className={cn(
                  "relative flex items-center justify-center w-10 h-10 rounded-full border bg-[#09090b] transition-all duration-300 z-10",
                  config.colorClass, config.borderClass,
                  task.STATUS !== 'CONCLUIDO' ? "hover:scale-110 hover:shadow-lg cursor-pointer ring-4 ring-transparent hover:ring-current/20" : "cursor-default"
                )}
                title={task.STATUS === 'CONCLUIDO' ? 'Concluída' : 'Marcar como concluída'}
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <div className="relative flex items-center justify-center w-full h-full">
                     <StatusIcon className={cn("w-5 h-5 transition-opacity duration-200", task.STATUS !== 'CONCLUIDO' && "group-hover/node:opacity-0")} />
                     {task.STATUS !== 'CONCLUIDO' && (
                        <CheckCircle2 className="w-5 h-5 absolute opacity-0 transition-opacity duration-200 group-hover/node:opacity-100" />
                     )}
                  </div>
                )}
              </button>
            </div>

            <div 
              className={cn(
                "flex-1 rounded-2xl border bg-black/20 backdrop-blur-sm p-4 md:p-5 transition-all duration-300",
                "hover:bg-white/[0.02] hover:border-white/20 hover:shadow-xl cursor-pointer",
                "group-hover:translate-x-1 group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]",
                task.STATUS === 'CONCLUIDO' && "opacity-60 hover:opacity-100 grayscale hover:grayscale-0",
                config.borderClass
              )}
              onClick={() => setEditingTask(task)}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                
                <div className="space-y-3 w-full">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {task.CATEGORIA && (
                      <Badge variant="outline" style={{ borderColor: task.CATEGORIA.COR, color: task.CATEGORIA.COR }} className="bg-transparent font-medium shadow-sm">
                        {task.CATEGORIA.NOME}
                      </Badge>
                    )}
                    
                    <span className={cn(
                        "flex items-center gap-1 font-medium px-2 py-0.5 rounded-full border", 
                        isTaskLate ? "text-brand-rose bg-brand-rose/10 border-brand-rose/20" : 
                        task.STATUS === 'CONCLUIDO' ? "text-muted-foreground border-transparent" :
                        "text-white/70 bg-white/5 border-white/10"
                    )}>
                      <CalendarIcon className="w-3 h-3" />
                      {getHumanDate(task.DATA_VENCIMENTO)}
                    </span>
                    
                    {task.PRIORIDADE === 'URGENTE' && task.STATUS !== 'CONCLUIDO' && (
                      <span className="flex items-center gap-1 text-xs text-brand-rose font-bold animate-pulse">
                          <AlertCircle className="w-3 h-3" /> Urgente
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className={cn("text-base md:text-lg font-semibold text-white/90 leading-tight pr-12", task.STATUS === 'CONCLUIDO' && "line-through text-muted-foreground")}>
                      {task.TITULO}
                    </h3>
                    {task.DESCRICAO && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                        {task.DESCRICAO}
                        </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    {task.MINUTOS_ESTIMADOS ? (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                            <Clock className="w-3 h-3 text-brand-cyan" />
                            {task.MINUTOS_ESTIMADOS} min
                        </div>
                    ) : <div />}

                    <div className="flex items-center gap-2">
                        {task.STATUS !== 'CONCLUIDO' && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="opacity-0 group-hover:opacity-100 transition-all h-7 px-3 text-xs text-brand-cyan hover:text-brand-cyan hover:bg-brand-cyan/20 border border-transparent hover:border-brand-cyan/20 rounded-full"
                                onClick={(e) => { e.stopPropagation(); setZenTask(task); }}
                            >
                                <Target className="w-3 h-3 mr-1.5" /> Focar
                            </Button>
                        )}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-violet text-xs flex items-center gap-1 font-medium bg-brand-violet/10 px-2 py-1 rounded-full">
                            Detalhes <ArrowRight className="w-3 h-3" />
                        </div>
                    </div>
                  </div>
                </div>

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
        task={editingTask as any} // Cast temporário até o TaskEditDialog ser refatorado
        categories={categories as any}
      />

      <ZenMode 
        isOpen={!!zenTask} 
        onClose={() => setZenTask(null)} 
        taskTitle={zenTask?.TITULO}
      />
    </div>
  )
}