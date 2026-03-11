'use client'

import { useState } from 'react'
import { Tarefa, Categoria } from '@/lib/types'
import { cn } from '@/lib/utils'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths, 
  isToday, 
  differenceInDays 
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar, Target, Layers, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface RoadmapViewProps {
  tasks: Tarefa[]
  categories: Categoria[]
}

export function RoadmapView({ tasks, categories }: RoadmapViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const CELL_WIDTH = 52 
  const SIDEBAR_WIDTH = 220

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] bg-[#070708] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in duration-700">
      
      {/* Header HUD */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-[#0c0c0e]/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-6">
          <div className="p-3 bg-brand-violet/10 rounded-2xl border border-brand-violet/20 hidden sm:block shadow-neon-violet/10">
            <Calendar className="w-5 h-5 text-brand-violet" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-black text-brand-violet uppercase tracking-[0.3em]">Cronograma de Missões</p>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </h2>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5">
          <Button variant="ghost" size="icon" onClick={prevMonth} className="h-10 w-10 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="w-[1px] h-4 bg-white/10 mx-1" />
          <Button variant="ghost" size="icon" onClick={nextMonth} className="h-10 w-10 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Grid Operacional */}
      <div className="flex-1 overflow-auto relative scrollbar-thin scrollbar-thumb-brand-violet/20 scrollbar-track-transparent">
        <div style={{ minWidth: `${SIDEBAR_WIDTH + (daysInMonth.length * CELL_WIDTH)}px` }}>
          
          {/* Eixo X: Dias do Mês */}
          <div className="grid sticky top-0 bg-[#0c0c0e]/95 z-40 backdrop-blur-md"
               style={{ gridTemplateColumns: `${SIDEBAR_WIDTH}px repeat(${daysInMonth.length}, ${CELL_WIDTH}px)` }}>
            
            <div className="p-6 text-[10px] font-black text-white/20 border-r border-b border-white/5 uppercase tracking-[0.2em] flex items-center bg-[#0c0c0e] sticky left-0 z-50">
              Setores / Alvos
            </div>

            {daysInMonth.map((day) => (
              <div 
                key={day.toISOString()} 
                className={cn(
                  "flex flex-col items-center justify-center py-4 border-r border-b border-white/5 transition-colors",
                  isToday(day) && "bg-brand-violet/5"
                )}
              >
                <span className={cn("text-[9px] font-black uppercase tracking-widest", isToday(day) ? "text-brand-violet" : "text-white/20")}>
                  {format(day, 'EEE', { locale: ptBR }).slice(0, 3)}
                </span>
                <span className={cn(
                  "text-xs font-black mt-2 w-8 h-8 flex items-center justify-center rounded-xl transition-all",
                  isToday(day) ? "bg-brand-violet text-white shadow-neon-violet scale-110" : "text-white/60 group-hover:text-white"
                )}>
                  {format(day, 'd')}
                </span>
              </div>
            ))}
          </div>

          {/* Eixo Y: Categorias e Tarefas */}
          <div className="bg-transparent">
            {categories.map((category) => {
              const categoryTasks = tasks.filter(t => {
                if (!t.data_vencimento) return false;
                const tDate = new Date(t.data_vencimento);
                // Ajuste: category_id -> categoria_id
                return (
                  t.categoria_id === category.id &&
                  tDate.getMonth() === currentDate.getMonth() &&
                  tDate.getFullYear() === currentDate.getFullYear()
                );
              });

              if (categoryTasks.length === 0) return null;

              const tasksByDay: Record<string, Tarefa[]> = {};
              categoryTasks.forEach(t => {
                  if (!t.data_vencimento) return;
                  const dayKey = format(new Date(t.data_vencimento), 'yyyy-MM-dd');
                  if (!tasksByDay[dayKey]) tasksByDay[dayKey] = [];
                  tasksByDay[dayKey].push(t);
              });
              
              const maxTasksInADay = Math.max(...Object.values(tasksByDay).map(arr => arr.length), 1);
              const rowHeight = Math.max(80, maxTasksInADay * 45 + 30); 

              return (
                <div key={category.id} 
                     className="grid relative group transition-colors border-b border-white/5"
                     style={{ 
                       gridTemplateColumns: `${SIDEBAR_WIDTH}px repeat(${daysInMonth.length}, ${CELL_WIDTH}px)`, 
                       height: `${rowHeight}px` 
                     }}>
                  
                  {/* Nome da Categoria (Fixa) */}
                  <div className="p-6 border-r border-white/5 flex flex-col justify-center gap-2 sticky left-0 bg-[#0c0c0e]/95 z-30 backdrop-blur-xl group-hover:bg-[#121214] transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-6 rounded-full" style={{ backgroundColor: category.cor, boxShadow: `0 0 15px ${category.cor}40` }} />
                        <span className="font-black text-xs uppercase tracking-tighter text-white truncate w-full">{category.nome}</span>
                    </div>
                    <div className="flex items-center gap-2 opacity-40">
                      <Layers className="w-3 h-3" />
                      <span className="text-[9px] font-bold uppercase tracking-widest">{categoryTasks.length} NODES</span>
                    </div>
                  </div>

                  {/* Grid Background Cells */}
                  {daysInMonth.map((day) => (
                      <div key={day.toISOString()} className={cn("border-r border-white/[0.02] h-full", isToday(day) && "bg-brand-violet/[0.02]")} />
                  ))}

                  {/* Tarefas (Milestones) */}
                  {Object.entries(tasksByDay).map(([dayKey, dayTasks]) => {
                      const taskDate = new Date(dayKey + 'T00:00:00'); 
                      const dayIndex = differenceInDays(taskDate, monthStart);
                      
                      if (dayIndex < 0 || dayIndex >= daysInMonth.length) return null;

                      return dayTasks.map((task, index) => (
                        <TooltipProvider key={task.id}>
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <div
                                  className={cn(
                                    "absolute h-9 rounded-xl border-2 flex items-center justify-center px-1 cursor-pointer transition-all z-10",
                                    // Ajuste: status === 'done' -> 'concluida'
                                    task.status === 'concluida' ? "opacity-30 grayscale" : "hover:scale-110 hover:z-20 shadow-lg"
                                  )}
                                  style={{
                                    left: `${SIDEBAR_WIDTH + (dayIndex * CELL_WIDTH) + 6}px`, 
                                    width: `${CELL_WIDTH - 12}px`, 
                                    top: `${20 + (index * 42)}px`, 
                                    backgroundColor: `${category.cor}20`,
                                    borderColor: `${category.cor}40`,
                                    boxShadow: task.status === 'concluida' ? 'none' : `0 4px 15px -5px ${category.cor}60`
                                  }}
                                >
                                  <span className="text-[10px] font-black text-white italic truncate px-1">
                                    {task.titulo.substring(0, 2).toUpperCase()}
                                  </span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-[#0c0c0e] border-white/10 p-4 rounded-2xl shadow-3xl text-white min-w-[200px] z-[100]">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-[9px] font-black text-brand-violet uppercase tracking-widest">
                                    <Target className="w-3 h-3" /> Alvo de Entrega
                                  </div>
                                  <p className="font-black text-sm leading-tight italic">{task.titulo}</p>
                                  <div className="pt-2 flex items-center justify-between border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: category.cor }} />
                                      <span className="text-[9px] font-bold text-white/40 uppercase">{category.nome}</span>
                                    </div>
                                    <span className="text-[9px] font-black text-brand-cyan">{format(taskDate, 'dd MMM')}</span>
                                  </div>
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
      
      {/* Footer Info HUD */}
      <div className="px-8 py-4 bg-[#0c0c0e]/90 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-violet shadow-neon-violet" />
            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Hoje</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white/10" />
            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Alvos Ativos</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-white/20">
          <Info className="w-3 h-3" />
          <span className="text-[9px] font-bold uppercase tracking-widest">Scroll horizontal ativo</span>
        </div>
      </div>
    </div>
  )
}