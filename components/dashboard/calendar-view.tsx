'use client'

import { useState } from 'react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday,
  parseISO
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, Brain, RefreshCw, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { Tarefa, Categoria } from '@/lib/types'
import { TaskEditDialog } from '@/components/dashboard/task-edit-dialog'

interface CalendarViewProps {
  tasks: Tarefa[]
  categories: Categoria[]
}

export function CalendarView({ tasks, categories }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [editingTask, setEditingTask] = useState<Tarefa | null>(null)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })

  const selectedDayTasks = tasks.filter(task => 
    task.data_vencimento && isSameDay(parseISO(task.data_vencimento), selectedDate)
  )

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const goToToday = () => {
    const today = new Date()
    setCurrentMonth(today)
    setSelectedDate(today)
  }

  const getTasksForDay = (date: Date) => {
    return tasks.filter(task => task.data_vencimento && isSameDay(parseISO(task.data_vencimento), date))
  }

  const renderCognitiveBattery = (load: number = 3) => (
    <div className="flex items-center gap-[2px]" title={`Carga Mental: Nível ${load}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div 
          key={i} 
          className={cn(
            "w-1.5 h-2.5 rounded-[1px] transition-all duration-300",
            i < load ? "bg-sky-400 shadow-[0_0_5px_rgba(56,189,248,0.5)]" : "bg-white/10"
          )}
        />
      ))}
    </div>
  )

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-black/40 backdrop-blur-xl rounded-[24px] border border-white/10 overflow-hidden shadow-2xl">
      
      {/* --- ÁREA PRINCIPAL: GRADE DO CALENDÁRIO --- */}
      <div className="flex-1 flex flex-col min-w-0 lg:border-r border-white/10 relative h-full">
        
        {/* Glow de Fundo Holográfico */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30vw] h-[30vw] bg-brand-cyan/5 blur-[120px] rounded-full pointer-events-none" />

        {/* Header HUD do Calendário */}
        <div className="flex-none flex items-center justify-between p-4 sm:p-5 border-b border-white/5 bg-white/[0.02] relative z-10">
          <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
            <CalendarIcon className="w-5 h-5 text-brand-cyan" />
            {format(currentMonth, 'MMMM / yyyy', { locale: ptBR })}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8 bg-black/50 border-white/10 hover:bg-white/10 hover:border-white/20 text-white transition-all">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday} className="h-8 px-4 text-[10px] font-black uppercase tracking-widest bg-black/50 border-white/10 hover:bg-brand-cyan/20 hover:text-brand-cyan hover:border-brand-cyan/50 transition-all text-white shadow-[0_0_10px_rgba(6,182,212,0.1)] hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              HOJE
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8 bg-black/50 border-white/10 hover:bg-white/10 hover:border-white/20 text-white transition-all">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Dias da Semana */}
        <div className="flex-none grid grid-cols-7 border-b border-white/5 bg-black/40 relative z-10">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="py-3 text-center text-[10px] font-black text-white/40 uppercase tracking-widest">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.charAt(0)}</span>
            </div>
          ))}
        </div>

        {/* Grade de Dias (AGORA COM SCROLL INTERNO) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 bg-[#09090b]/40">
          <div className="grid grid-cols-7 auto-rows-[minmax(80px,1fr)] sm:auto-rows-[minmax(120px,1fr)] min-h-full">
            {calendarDays.map((day) => {
              const dayTasks = getTasksForDay(day)
              const isSelected = isSameDay(day, selectedDate)
              const isCurrentMonth = isSameMonth(day, currentMonth)
              const today = isToday(day)

              return (
                <div 
                  key={day.toString()} 
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "relative p-1.5 sm:p-2 border-b border-r border-white/5 transition-all cursor-pointer flex flex-col group",
                    !isCurrentMonth && "bg-black/60 text-muted-foreground/30",
                    isSelected && "bg-brand-cyan/5 ring-1 ring-inset ring-brand-cyan/50 shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]",
                    !isSelected && "hover:bg-white/[0.03]"
                  )}
                >
                  {/* Indicador do Dia */}
                  <div className="flex justify-between items-start flex-none">
                    <div className={cn(
                      "text-[10px] sm:text-xs font-black w-6 h-6 flex items-center justify-center rounded-md mb-1 transition-all",
                      today ? "bg-brand-cyan text-black shadow-[0_0_15px_rgba(6,182,212,0.6)]" : "text-muted-foreground",
                      isSelected && !today && "text-white bg-white/10",
                      !isSelected && !today && "group-hover:text-white"
                    )}>
                      {format(day, 'd')}
                    </div>
                  </div>

                  {/* Área de Tarefas (Desktop) */}
                  <div className="hidden lg:flex flex-col gap-1 w-full flex-1 overflow-y-auto custom-scrollbar pr-1 mt-1">
                    {dayTasks.map(task => {
                      const isReview = task.status === 'revisao' || task.titulo.toLowerCase().includes('revisão')
                      return (
                        <div 
                          key={task.id} 
                          className={cn(
                            "flex items-center gap-1.5 text-[9px] font-bold tracking-wide truncate px-1.5 py-1 rounded-[4px] border transition-colors",
                            isReview 
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/40" 
                              : "bg-white/5 border-white/5 text-white/70 hover:bg-brand-cyan/20 hover:border-brand-cyan/30 hover:text-white"
                          )}
                        >
                          <div 
                            className="w-1.5 h-1.5 rounded-full shrink-0" 
                            style={{ backgroundColor: task.categoria?.cor || (isReview ? '#10b981' : '#8b5cf6') }} 
                          />
                          <span className="truncate">{task.titulo}</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Área de Tarefas (Mobile) */}
                  <div className="flex lg:hidden flex-wrap gap-1 justify-center items-start mt-1 flex-1 content-start">
                    {dayTasks.slice(0, 4).map(t => {
                      const isReview = t.status === 'revisao' || t.titulo.toLowerCase().includes('revisão')
                      return (
                        <div 
                          key={t.id} 
                          className={cn(
                            "w-1.5 h-1.5 rounded-full shadow-sm", 
                            t.prioridade === 'urgente' ? 'bg-rose-500 animate-pulse' : 
                            isReview ? 'bg-emerald-400' : 'bg-brand-cyan'
                          )} 
                          style={{ backgroundColor: t.categoria?.cor }}
                        />
                      )
                    })}
                    {dayTasks.length > 4 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* --- SIDEBAR LATERAL: BRIEFING DIÁRIO --- */}
      <div className="w-full lg:w-[360px] flex flex-col bg-[#0c0c0e]/95 shrink-0 min-h-[300px] lg:min-h-0 relative border-l border-white/5">
        <div className="p-5 border-b border-white/5 flex-none sticky top-0 bg-[#0c0c0e] z-10 shadow-lg">
          <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-brand-cyan" /> Briefing Diário
          </h3>
          <p className="text-[10px] text-brand-cyan/70 font-mono uppercase tracking-widest mt-2 bg-brand-cyan/10 px-2 py-1 rounded-md inline-block border border-brand-cyan/20">
            {format(selectedDate, "dd MMM yyyy", { locale: ptBR })} <span className="mx-1 text-white/30">|</span> {selectedDayTasks.length} {selectedDayTasks.length === 1 ? 'Missão' : 'Missões'}
          </p>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3 pb-8 lg:pb-0">
            {selectedDayTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                      <CalendarIcon className="w-5 h-5 text-white/20" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-white/40 mb-1">Radar Limpo</span>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-widest">Nenhuma missão alocada para hoje.</span>
                </div>
            ) : (
                selectedDayTasks.map(task => {
                  const isReview = task.status === 'revisao' || task.titulo.toLowerCase().includes('revisão')

                  return (
                    <div 
                        key={task.id} 
                        onClick={() => setEditingTask(task)}
                        className={cn(
                          "relative p-4 rounded-2xl border bg-black/40 hover:-translate-y-0.5 transition-all cursor-pointer group overflow-hidden",
                          isReview 
                            ? "border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/5" 
                            : "border-white/5 hover:border-brand-cyan/40 hover:bg-brand-cyan/5 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                        )}
                    >
                        {/* Indicador de Prioridade Urgente lateral */}
                        {task.prioridade === 'urgente' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500 animate-pulse" />}

                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {task.categoria && (
                                  <span 
                                    className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded-md border border-white/5" 
                                    style={{ color: task.categoria.cor }}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full shadow-sm" style={{ backgroundColor: task.categoria.cor, boxShadow: `0 0 5px ${task.categoria.cor}` }} />
                                    {task.categoria.nome}
                                  </span>
                              )}
                              {isReview && (
                                <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                  <RefreshCw className="w-2.5 h-2.5" /> Revisão
                                </span>
                              )}
                            </div>
                        </div>

                        <h4 className="text-sm font-bold text-white/90 mb-3 group-hover:text-white transition-colors">
                          {task.titulo}
                        </h4>
                        
                        <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-auto">
                          <div className="flex items-center gap-2">
                            <Brain className="w-3 h-3 text-sky-400" />
                            {renderCognitiveBattery(task.carga_mental)}
                          </div>

                          <div className="flex items-center gap-2">
                            {task.minutos_estimados && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">
                                    <Clock className="w-3 h-3 text-brand-cyan" /> {task.minutos_estimados}m
                                </span>
                            )}
                          </div>
                        </div>
                    </div>
                  )
                })
            )}
          </div>
        </ScrollArea>
      </div>

      <TaskEditDialog 
        open={!!editingTask} 
        onOpenChange={(open) => !open && setEditingTask(null)}
        task={editingTask}
        categories={categories}
      />
    </div>
  )
}