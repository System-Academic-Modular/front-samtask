'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  Clock, 
  MoreHorizontal, 
  Calendar as CalendarIcon, 
  AlertCircle, 
  CheckCircle2, 
  Circle, 
  ArrowRight
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Task, Category } from '@/lib/types'
import { TaskEditDialog } from '@/components/dashboard/task-edit-dialog'

interface TimelineViewProps {
  tasks: Task[]
  categories?: Category[]
}

export function TimelineView({ tasks, categories = [] }: TimelineViewProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  // Função auxiliar para decidir o ícone e a cor da linha lateral
  const getTaskStatusConfig = (task: Task) => {
    if (task.status === 'done') {
      return {
        icon: CheckCircle2,
        colorClass: "text-green-500",
        bgClass: "bg-green-500/10",
        borderClass: "border-green-500/20"
      }
    }
    if (task.priority === 'urgent') {
      return {
        icon: AlertCircle,
        colorClass: "text-red-500",
        bgClass: "bg-red-500/10",
        borderClass: "border-red-500/20"
      }
    }
    if (task.status === 'in_progress') {
      return {
        icon: Clock,
        colorClass: "text-brand-violet",
        bgClass: "bg-brand-violet/10",
        borderClass: "border-brand-violet/20"
      }
    }
    return {
      icon: Circle,
      colorClass: "text-muted-foreground",
      bgClass: "bg-white/5",
      borderClass: "border-white/10"
    }
  }

  return (
    <div className="space-y-0 relative">
      {/* Linha vertical contínua de fundo (a "trilha") */}
      <div className="absolute left-[19px] top-4 bottom-4 w-px bg-white/10 -z-10" />

      {tasks.map((task) => {
        const config = getTaskStatusConfig(task)
        const StatusIcon = config.icon

        return (
          <div key={task.id} className="group relative flex gap-4 pb-8 last:pb-0">
            
            {/* Coluna do Ícone (Timeline Node) */}
            <div className="flex flex-col items-center mt-1">
              <div className={cn(
                "relative flex items-center justify-center w-10 h-10 rounded-full border bg-[#09090b] transition-all duration-300 z-10",
                config.colorClass,
                config.borderClass,
                "group-hover:scale-110 group-hover:shadow-lg"
              )}>
                <StatusIcon className="w-5 h-5" />
              </div>
            </div>

            {/* O Card de Conteúdo */}
            <div 
              className={cn(
                "flex-1 rounded-2xl border bg-[#121214]/50 p-4 transition-all duration-200",
                "hover:bg-[#121214] hover:border-white/20 hover:shadow-md cursor-pointer",
                "group-hover:translate-x-1", // Pequeno movimento para a direita no hover
                config.borderClass
              )}
              onClick={() => setEditingTask(task)} // Clicar no card inteiro abre a edição
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2 w-full">
                  
                  {/* Cabeçalho do Card: Categoria e Data */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                        {task.category ? (
                            <Badge variant="outline" style={{ borderColor: task.category.color, color: task.category.color }} className="bg-transparent font-medium">
                                {task.category.name}
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="border-white/10 text-muted-foreground bg-transparent">
                                Geral
                            </Badge>
                        )}
                        <span className="text-muted-foreground">•</span>
                        <span className={cn("flex items-center gap-1", task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done' ? "text-red-400" : "text-muted-foreground")}>
                            <CalendarIcon className="w-3 h-3" />
                            {task.due_date ? format(new Date(task.due_date), "dd MMM", { locale: ptBR }) : 'Sem data'}
                        </span>
                    </div>

                    {/* Botão de Ações (Menu) */}
                    <div onClick={(e) => e.stopPropagation()}> {/* Impede abrir o modal ao clicar no menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-white -mr-2">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#18181b] border-white/10">
                                <DropdownMenuItem onClick={() => setEditingTask(task)}>
                                    Editar Tarefa
                                </DropdownMenuItem>
                                {/* Futuro: Adicionar 'Excluir' aqui */}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                  </div>

                  {/* Título e Descrição */}
                  <div>
                    <h3 className={cn(
                        "text-base font-semibold text-white leading-tight flex items-center gap-2", 
                        task.status === 'done' && "line-through text-muted-foreground"
                    )}>
                      {task.title}
                    </h3>
                    {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {task.description}
                        </p>
                    )}
                  </div>

                  {/* Footer do Card: Estimativa e Prioridade */}
                  <div className="flex items-center gap-3 pt-1">
                     {task.estimated_minutes && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-md">
                            <Clock className="w-3 h-3" />
                            {task.estimated_minutes} min
                        </div>
                     )}
                     
                     {task.priority === 'urgent' && task.status !== 'done' && (
                         <div className="flex items-center gap-1 text-xs text-red-400 font-medium bg-red-500/10 px-2 py-1 rounded-md">
                             <AlertCircle className="w-3 h-3" />
                             Urgente
                         </div>
                     )}

                     {/* Seta indicativa de ação (aparece no hover) */}
                     <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-brand-violet text-xs flex items-center gap-1 font-medium">
                        Ver detalhes <ArrowRight className="w-3 h-3" />
                     </div>
                  </div>

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