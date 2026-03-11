'use client'

import { useMemo, useState, useTransition } from 'react'
import { format, isPast, isToday, isTomorrow, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  AlertCircle,
  Brain,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  MoreHorizontal,
  Target,
  Zap,
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { toast } from 'sonner'
import { updateTask } from '@/lib/actions/tasks'
import { TaskEditDialog } from '@/components/dashboard/task-edit-dialog'
import { ZenMode } from '@/components/dashboard/zen-mode'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Category, Task, StatusTarefa } from '@/lib/types'

interface TimelineViewProps {
  tasks: Task[]
  categories?: Category[]
}

// Mapeamento visual baseado no seu StatusTarefa literal
const ESTILOS_STATUS = {
  concluida: { icon: CheckCircle2, cor: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  urgente: { icon: AlertCircle, cor: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' }, // fallback para prioridade
  em_progresso: { icon: Zap, cor: 'text-brand-cyan', bg: 'bg-brand-cyan/10', border: 'border-brand-cyan/20' },
  pendente: { icon: Circle, cor: 'text-muted-foreground', bg: 'bg-white/5', border: 'border-white/10' },
  revisao: { icon: Clock, cor: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
}

export function TimelineView({ tasks, categories = [] }: TimelineViewProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [zenTask, setZenTask] = useState<Task | null>(null)
  const [isPending, startTransition] = useTransition()
  const [idsOtimistas, setIdsOtimistas] = useState<string[]>([])

  const tarefasOrdenadas = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const aConcluida = a.status === 'concluida' || idsOtimistas.includes(a.id)
      const bConcluida = b.status === 'concluida' || idsOtimistas.includes(b.id)
      
      if (aConcluida !== bConcluida) return aConcluida ? 1 : -1
      
      const aData = a.data_vencimento ? new Date(a.data_vencimento).getTime() : Infinity
      const bData = b.data_vencimento ? new Date(b.data_vencimento).getTime() : Infinity
      return aData - bData
    })
  }, [tasks, idsOtimistas])

  const concluirTarefa = (e: React.MouseEvent, tarefa: Task) => {
    e.stopPropagation()
    if (tarefa.status === 'concluida' || isPending) return

    setIdsOtimistas(prev => [...prev, tarefa.id])
    
    startTransition(async () => {
      // Usando o literal 'concluida' conforme seu types.ts
      const result = await updateTask(tarefa.id, { status: 'concluida' as StatusTarefa })
      
      if (result?.error) {
        setIdsOtimistas(prev => prev.filter(id => id !== tarefa.id))
        toast.error('Erro na sincronização', { description: result.error })
      } else {
        confetti({
          particleCount: 40,
          spread: 70,
          origin: { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight },
          colors: ['#8B5CF6', '#22D3EE']
        })
        toast.success('Missão cumprida!')
      }
    })
  }

  return (
    <div className="relative space-y-3 pb-20">
      {/* Linha guia da Timeline */}
      <div className="absolute left-9 top-4 bottom-4 w-px bg-gradient-to-b from-brand-violet/30 via-white/5 to-transparent" />

      {tarefasOrdenadas.map((tarefa, index) => {
        const concluida = tarefa.status === 'concluida' || idsOtimistas.includes(tarefa.id)
        
        // Define o estilo visual baseado no status ou prioridade
        let estilo = ESTILOS_STATUS.pendente
        if (concluida) estilo = ESTILOS_STATUS.concluida
        else if (tarefa.prioridade === 'urgente') estilo = ESTILOS_STATUS.urgente
        else if (tarefa.status === 'em_progresso') estilo = ESTILOS_STATUS.em_progresso
        else if (tarefa.status === 'revisao') estilo = ESTILOS_STATUS.revisao

        const IconeStatus = estilo.icon
        const atrasada = tarefa.data_vencimento && isPast(startOfDay(new Date(tarefa.data_vencimento))) && !concluida

        return (
          <div
            key={tarefa.id}
            onClick={() => setEditingTask(tarefa)}
            className={cn(
              "group relative flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300 cursor-pointer",
              estilo.border,
              concluida ? "opacity-50 grayscale-[0.8] bg-white/[0.02]" : "bg-card/40 backdrop-blur-md hover:bg-card/60"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Botão de Status (Checkbox) */}
            <button
              onClick={(e) => concluirTarefa(e, tarefa)}
              disabled={concluida || isPending}
              className={cn(
                "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all shadow-lg",
                estilo.bg, estilo.cor, estilo.border,
                !concluida && "hover:scale-110 active:scale-95"
              )}
            >
              {isPending && idsOtimistas.includes(tarefa.id) ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <IconeStatus className={cn("h-5 w-5", concluida && "fill-current")} />
              )}
            </button>

            {/* Conteúdo da Tarefa */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {tarefa.categoria && (
                  <span 
                    className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border"
                    style={{ 
                      color: tarefa.categoria.cor, 
                      borderColor: `${tarefa.categoria.cor}40`, 
                      backgroundColor: `${tarefa.categoria.cor}10` 
                    }}
                  >
                    {tarefa.categoria.nome}
                  </span>
                )}
                
                {tarefa.data_vencimento && (
                  <span className={cn(
                    "flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider",
                    atrasada ? "text-rose-400" : "text-muted-foreground"
                  )}>
                    <CalendarIcon className="h-3 w-3" />
                    {isToday(new Date(tarefa.data_vencimento)) ? "Hoje" : 
                     isTomorrow(new Date(tarefa.data_vencimento)) ? "Amanhã" :
                     format(new Date(tarefa.data_vencimento), "dd 'de' MMM", { locale: ptBR })}
                  </span>
                )}
              </div>

              <h3 className={cn(
                "text-base font-bold tracking-tight",
                concluida && "line-through text-muted-foreground"
              )}>
                {tarefa.titulo}
              </h3>

              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-cyan-400/80 bg-cyan-400/5 px-2 py-0.5 rounded-full border border-cyan-400/10">
                  <Brain className="h-3 w-3" />
                  <span>Carga {tarefa.carga_mental}</span>
                </div>
                
                {tarefa.minutos_estimados && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{tarefa.minutos_estimados}m</span>
                  </div>
                )}
              </div>
            </div>

            {/* Ações Laterais */}
            <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-brand-cyan/10 hover:text-brand-cyan"
                onClick={(e) => { e.stopPropagation(); setZenTask(tarefa); }}
              >
                <Target className="h-4 w-4" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => e.stopPropagation()}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-[#0c0c0e] border-white/10">
                  <DropdownMenuItem onClick={() => setEditingTask(tarefa)}>Editar</DropdownMenuItem>
                  <DropdownMenuItem className="text-rose-400">Excluir</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )
      })}

      <TaskEditDialog
        open={!!editingTask}
        onOpenChange={(o) => !o && setEditingTask(null)}
        task={editingTask}
        categories={categories}
      />

      <ZenMode
        isOpen={!!zenTask}
        onClose={() => setZenTask(null)}
        task={zenTask}
      />
    </div>
  )
}