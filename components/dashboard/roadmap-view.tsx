'use client'

import { useState } from 'react'
import { Task, Category } from '@/lib/types'
import { cn } from '@/lib/utils'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface RoadmapViewProps {
  tasks: Task[]
  categories: Category[]
}

export function RoadmapView({ tasks, categories }: RoadmapViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  // Navegação de Mês
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

  // Gerar dias do mês atual
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Largura da célula do dia (px) - Fixo para garantir alinhamento
  const CELL_WIDTH = 48 
  const SIDEBAR_WIDTH = 180 // Diminuido um pouco para dar mais espaço no mobile

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] bg-card/30 border border-white/5 rounded-xl overflow-hidden backdrop-blur-sm shadow-2xl">
      
      {/* Header do Roadmap */}
      <div className="flex items-center justify-between p-3 md:p-4 border-b border-white/5 bg-[#121214]/80 backdrop-blur-sm z-50">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="p-2 bg-brand-violet/10 rounded-lg border border-brand-violet/20 hidden sm:block">
            <Calendar className="w-4 h-4 md:w-5 md:h-5 text-brand-violet" />
          </div>
          <h2 className="text-base md:text-lg font-semibold capitalize text-white">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h2>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8 hover:bg-brand-violet/20 hover:text-brand-violet border-white/10">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8 hover:bg-brand-violet/20 hover:text-brand-violet border-white/10">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid do Roadmap (Scrollável X e Y) */}
      <div className="flex-1 overflow-auto relative scrollbar-thin scrollbar-thumb-white/10">
        {/* Container com largura dinâmica baseada nos dias */}
        <div style={{ minWidth: `${SIDEBAR_WIDTH + (daysInMonth.length * CELL_WIDTH)}px` }}>
          
          {/* Cabeçalho dos Dias (Eixo X) - Fixo no topo */}
          <div className="grid border-b border-white/5 sticky top-0 bg-[#121214]/95 z-40 backdrop-blur-md shadow-sm"
               style={{ gridTemplateColumns: `${SIDEBAR_WIDTH}px repeat(${daysInMonth.length}, ${CELL_WIDTH}px)` }}>
            
            <div className="p-3 md:p-4 text-[10px] md:text-xs font-medium text-muted-foreground border-r border-white/5 uppercase tracking-widest flex items-center bg-[#121214]/95 sticky left-0 z-50 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
              Projetos / Tags
            </div>

            {daysInMonth.map((day) => (
              <div 
                key={day.toISOString()} 
                className={cn(
                  "flex flex-col items-center justify-center py-2 md:py-3 border-r border-white/5",
                  isToday(day) && "bg-brand-violet/10"
                )}
              >
                <span className={cn("text-[8px] md:text-[10px] font-bold", isToday(day) ? "text-brand-violet" : "text-muted-foreground")}>
                  {format(day, 'EEE', { locale: ptBR }).slice(0, 3)}
                </span>
                <span className={cn(
                  "text-xs md:text-sm font-bold mt-1 w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full",
                  isToday(day) ? "bg-brand-violet text-white shadow-neon-violet" : "text-foreground"
                )}>
                  {format(day, 'd')}
                </span>
              </div>
            ))}
          </div>

          {/* Linhas de Categorias (Eixo Y) */}
          <div className="divide-y divide-white/5">
            {categories.map((category) => {
              // 1. Filtrar tarefas desta categoria no mês
              const categoryTasks = tasks.filter(t => {
                if (!t.due_date) return false;
                const tDate = new Date(t.due_date);
                return (
                  (t.category_id === category.id || t.category?.id === category.id) &&
                  tDate.getMonth() === currentDate.getMonth() &&
                  tDate.getFullYear() === currentDate.getFullYear()
                );
              });

              if (categoryTasks.length === 0) return null

              // 2. Lógica de "Swimlanes"
              const tasksByDay: Record<string, Task[]> = {};
              categoryTasks.forEach(t => {
                  if (!t.due_date) return;
                  const dayKey = format(new Date(t.due_date), 'yyyy-MM-dd');
                  if (!tasksByDay[dayKey]) tasksByDay[dayKey] = [];
                  tasksByDay[dayKey].push(t);
              });
              
              const maxTasksInADay = Math.max(...Object.values(tasksByDay).map(arr => arr.length), 1);
              // Calcula a altura da linha baseado no dia com mais tarefas
              const rowHeight = Math.max(60, maxTasksInADay * 40 + 20); 

              return (
                <div key={category.id} 
                     className="grid group hover:bg-white/[0.02] transition-colors relative"
                     style={{ gridTemplateColumns: `${SIDEBAR_WIDTH}px repeat(${daysInMonth.length}, ${CELL_WIDTH}px)`, height: `${rowHeight}px` }}>
                  
                  {/* Nome da Categoria (Coluna Esquerda Fixa) */}
                  <div className="p-3 border-r border-b border-white/5 flex flex-col justify-center gap-1 sticky left-0 bg-[#121214]/95 z-30 backdrop-blur-md shadow-[2px_0_5px_rgba(0,0,0,0.5)] md:bg-card/90">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full shadow-[0_0_8px] shadow-current shrink-0" style={{ color: category.color }} />
                        <span className="font-medium text-xs md:text-sm truncate w-full" title={category.name}>{category.name}</span>
                    </div>
                    <Badge variant="outline" className="w-fit text-[9px] md:text-[10px] border-white/10 text-muted-foreground h-4 md:h-5 px-1 md:px-2">
                      {categoryTasks.length} {categoryTasks.length === 1 ? 'item' : 'itens'}
                    </Badge>
                  </div>

                  {/* Células de Fundo (Grid) */}
                  {/* Fragmento extra para envolver o map e manter a grid correta */}
                  <>
                      {daysInMonth.map((day) => (
                          <div key={day.toISOString()} className={cn("border-r border-white/5 h-full", isToday(day) && "bg-brand-violet/5")} />
                      ))}
                  </>

                  {/* Renderização das Tarefas (Absolutas por cima do grid) */}
                  {Object.entries(tasksByDay).map(([dayKey, dayTasks]) => {
                      const taskDate = new Date(dayKey + 'T00:00:00'); 
                      const dayIndex = differenceInDays(taskDate, monthStart);
                      
                      if (dayIndex < 0 || dayIndex >= daysInMonth.length) return null;

                      return dayTasks.map((task, index) => (
                        <TooltipProvider key={task.id}>
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <div
                                  className="absolute h-8 rounded-md border flex items-center justify-center px-1 cursor-pointer hover:brightness-125 hover:scale-105 hover:z-20 transition-all z-10"
                                  style={{
                                    left: `${SIDEBAR_WIDTH + (dayIndex * CELL_WIDTH) + 2}px`, 
                                    // MUDANÇA PRINCIPAL: Largura fixa em apenas 1 dia (Milestone)
                                    width: `${CELL_WIDTH - 4}px`, 
                                    top: `${10 + (index * 35)}px`, 
                                    backgroundColor: `${category.color}15`,
                                    borderColor: `${category.color}60`,
                                    boxShadow: `0 0 10px ${category.color}10`
                                  }}
                                >
                                  {/* MUDANÇA: Mostra só até 3 letras no quadradinho */}
                                  <span className="text-[10px] font-bold text-white drop-shadow-md select-none">
                                    {task.title.substring(0, 3)}
                                  </span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-slate-900 border-slate-700 text-white z-50">
                                <p className="font-bold">{task.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: category.color }} />
                                    <p className="text-xs text-slate-400">Entrega: {format(taskDate, 'dd/MM')}</p>
                                </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ));
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}