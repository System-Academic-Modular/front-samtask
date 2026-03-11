'use client'

import { useTransition } from 'react'
import type { Tarefa } from '@/lib/types'
import { updateTask, deleteTask } from '@/lib/actions/tasks'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2, Clock, Calendar, Brain, RefreshCw, Zap, Play } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import confetti from 'canvas-confetti'

interface TaskItemProps {
  task: Tarefa
  onEdit: () => void
  showCompleted?: boolean
}

const priorityColors = {
  baixa: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  media: 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20',
  alta: 'bg-brand-amber/10 text-brand-amber border-brand-amber/20',
  urgente: 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse',
}

const priorityLabels = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
}

export function TaskItem({ task, onEdit, showCompleted }: TaskItemProps) {
  const [isPending, startTransition] = useTransition()
  
  const isCompleted = task.status === 'concluida'
  
  // 1. Scanner de Revisão
  const isReview = task.titulo.toLowerCase().includes('revisão') || task.titulo.toLowerCase().includes('review')

  function handleToggleComplete() {
    startTransition(async () => {
      const newStatus = isCompleted ? 'pendente' : 'concluida'
      const result = await updateTask(task.id, { status: newStatus })
      
      if (result.error) {
        toast.error('Erro ao atualizar tarefa')
        return
      }

      if (newStatus === 'concluida') {
        confetti({
          particleCount: 40,
          spread: 70,
          origin: { y: 0.8 },
          colors: [task.categoria?.cor || '#8b5cf6', '#06b6d4', '#10b981'],
        })
        toast.success(isReview ? 'Revisão concluída!' : 'Missão cumprida!', {
          description: isReview ? 'Conhecimento fixado com sucesso.' : 'Ótimo trabalho! Foco no próximo objetivo.',
        })
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTask(task.id)
      if (result.error) {
        toast.error('Erro ao excluir tarefa')
        return
      }
      toast.success('Tarefa excluída')
    })
  }

  const dueDate = task.data_vencimento ? new Date(task.data_vencimento) : null
  const isOverdue = dueDate && dueDate < new Date() && !isCompleted

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
  }

  // 2. Bateria de Carga Mental
  const renderCognitiveLoad = (load: number = 1) => {
    return (
      <div className="flex items-center gap-0.5" title={`Carga Mental: Nível ${load}`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div 
            key={i} 
            className={cn(
              "w-1.5 h-2.5 rounded-[1px] transition-all",
              i < load 
                ? isReview ? "bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.5)]" : "bg-sky-400 shadow-[0_0_5px_rgba(56,189,248,0.5)]" 
                : "bg-white/10"
            )}
          />
        ))}
      </div>
    )
  }

  return (
    <Card 
      className={cn(
        'transition-all duration-300 group relative overflow-hidden',
        isPending && 'opacity-50 pointer-events-none scale-[0.98]',
        isCompleted ? 'bg-white/[0.02] grayscale-[0.5] hover:grayscale-0 border-white/5' :
        isReview 
          ? "bg-emerald-500/[0.02] border border-dashed border-emerald-500/30 hover:border-emerald-500/60 hover:shadow-[0_0_20px_rgba(52,211,153,0.1)]" 
          : "bg-card/40 border-white/5 hover:border-white/20 hover:bg-white/[0.03] backdrop-blur-sm"
      )}
      style={{
        '--hover-glow': task.categoria?.cor || 'var(--brand-violet)'
      } as React.CSSProperties}
    >
      
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1 transition-all",
        isCompleted ? "bg-brand-emerald" : "bg-transparent group-hover:bg-[var(--hover-glow)]"
      )} />

      {isReview && !isCompleted && (
        <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-bl-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border-b border-l border-emerald-500/20 backdrop-blur-md">
          <RefreshCw className="w-3 h-3 animate-spin-slow" /> Revisão
        </div>
      )}

      <CardContent className={cn("p-4 pl-5", isReview && "pt-6")}>
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-2 mt-1 relative z-10">
            <Checkbox
              checked={isCompleted}
              onCheckedChange={handleToggleComplete}
              className={cn(
                "h-5 w-5 border-white/20 transition-all rounded-md data-[state=checked]:bg-brand-emerald data-[state=checked]:border-brand-emerald",
                !isCompleted && (isReview ? "hover:border-emerald-500/50 hover:bg-emerald-500/10" : "hover:border-brand-violet/50 hover:bg-brand-violet/10")
              )}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-1">
                <h3 className={cn(
                  'font-semibold text-base transition-all duration-300',
                  isCompleted ? 'text-muted-foreground line-through' : 'text-white/90 group-hover:text-white transition-colors'
                )}>
                  {task.titulo}
                </h3>
                
                {task.descricao && (
                  <p className={cn(
                    'text-sm text-muted-foreground line-clamp-2 leading-relaxed transition-opacity mt-1',
                    isCompleted && 'opacity-50'
                  )}>
                    {task.descricao}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <Badge variant="outline" className={cn("text-[9px] font-bold uppercase tracking-wider h-5", priorityColors[task.prioridade])}>
                    {priorityLabels[task.prioridade]}
                  </Badge>

                  {task.categoria && (
                    <Badge 
                      variant="outline"
                      className="text-[10px] h-5 bg-black/20 backdrop-blur-sm transition-colors group-hover:bg-white/5"
                      style={{ borderColor: `${task.categoria.cor}40`, color: task.categoria.cor }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: task.categoria.cor }} />
                      {task.categoria.nome}
                    </Badge>
                  )}

                  {dueDate && (
                    <span className={cn(
                      'text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 px-2 py-0.5 rounded-md border',
                      isOverdue ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-white/5 text-muted-foreground border-white/5'
                    )}>
                      <Calendar className="w-3 h-3" />
                      {format(dueDate, "dd MMM", { locale: ptBR })}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 relative z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#121214] border-white/10 shadow-2xl">
                    <DropdownMenuItem onClick={onEdit} className="cursor-pointer focus:bg-white/5 focus:text-white">
                      <Pencil className="mr-2 h-4 w-4 text-brand-cyan" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/5" />
                    <DropdownMenuItem onClick={handleDelete} className="text-red-400 focus:text-red-400 focus:bg-red-400/10 cursor-pointer">
                      <Trash2 className="mr-2 h-4 w-4" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {task.atribuido && (
                  <div className="flex items-center gap-2 mt-2 group/assignee cursor-pointer" title={`Responsável: ${task.atribuido.nome_completo}`}>
                    <Avatar className="h-6 w-6 border border-white/10 ring-2 ring-transparent group-hover/assignee:ring-brand-violet/30 transition-all shadow-sm">
                      <AvatarImage src={task.atribuido.avatar_url || ''} />
                      <AvatarFallback className="text-[9px] bg-brand-violet/20 text-brand-violet font-bold">
                        {getInitials(task.atribuido.nome_completo)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
              <div className="flex items-center gap-2">
                <Zap className={cn("w-3.5 h-3.5", isReview ? "text-emerald-500" : "text-sky-400")} />
                {renderCognitiveLoad(task.carga_mental)}
                <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest ml-1 hidden sm:inline">
                  {isReview ? 'Carga Leve' : `Nível ${task.carga_mental || 1}`}
                </span>
              </div>

              {!isCompleted && (
                <div className="flex items-center gap-2">
                  {task.minutos_estimados && (
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                      <Clock className="w-3 h-3 text-brand-cyan" /> {task.minutos_estimados}m
                    </span>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn(
                      "h-7 text-[9px] font-black uppercase tracking-widest gap-1 border transition-all",
                      isReview 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500 hover:text-black hover:shadow-[0_0_15px_rgba(52,211,153,0.4)]" 
                        : "bg-white/5 text-white/70 border-white/10 hover:bg-[var(--hover-glow)] hover:text-white hover:border-transparent hover:shadow-[0_0_15px_var(--hover-glow)]"
                    )}
                  >
                    <Play className="w-3 h-3 fill-current" /> INICIAR
                  </Button>
                </div>
              )}
            </div>

          </div>
        </div>
      </CardContent>
    </Card>
  )
}