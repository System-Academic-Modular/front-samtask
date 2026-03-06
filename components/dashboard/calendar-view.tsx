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
import { ChevronLeft, ChevronRight, Clock, AlertCircle, Calendar as CalendarIcon, Brain, RefreshCw, Zap, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { Task, Category } from '@/lib/types'
import { TaskEditDialog } from '@/components/dashboard/task-edit-dialog'

interface CalendarViewProps {
  tasks: Task[]
  categories: Category[]
}

export function CalendarView({ tasks, categories }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })

  const selectedDayTasks = tasks.filter(task => 
    task.due_date && isSameDay(parseISO(task.due_date), selectedDate)
  )

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const goToToday = () => {
    const today = new Date()
    setCurrentMonth(today)
    setSelectedDate(today)
  }

  const getTasksForDay = (date: Date) => {
    return tasks.filter(task => task.due_date && isSameDay(parseISO(task.due_date), date))
  }

  const renderCognitiveBattery = (load: number) => (
    <div className="flex items-center gap-[2px]" title={`Carga Mental: Nível ${load}`}>
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
    <div className="flex flex-col lg:flex-row h-full w-full bg-black/40 backdrop-blur-xl rounded-[24px] border border-white/10 overflow-hidden shadow-2xl">
      
      {/* --- ÁREA PRINCIPAL: GRADE DO CALENDÁRIO --- */}
      <div className="flex-1 flex flex-col min-w-0 lg:border-r border-white/10">
        
        {/* Header HUD do Calendário */}
        <div className="flex-none flex items-center justify-between p-4 sm:p-5 border-b border-white/5 bg-white/[0.02]">
          <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-[0.2em]">
            {format(currentMonth, 'MMMM / yyyy', { locale: ptBR })}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8 bg-black/50 border-white/10 hover:bg-white/10 hover:border-white/20 text-white">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday} className="h-8 px-4 text-[10px] font-bold uppercase tracking-widest bg-black/50 border-white/10 hover:bg-brand-cyan/20 hover:text-brand-cyan hover:border-brand-cyan/50 transition-all text-white">
              Hoje
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8 bg-black/50 border-white/10 hover:bg-white/10 hover:border-white/20 text-white">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Dias da Semana */}
        <div className="flex-none grid grid-cols-7 border-b border-white/5 bg-black/20">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="py-3 text-center text-[10px] font-black text-white/40 uppercase tracking-widest">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.charAt(0)}</span>
            </div>
          ))}
        </div>

        {/* Grade de Dias */}
        <div className="flex-1 grid grid-cols-7 auto-rows-fr bg-[#09090b]/50">
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
                  "aspect-square lg:aspect-auto lg:min-h-[100px]", 
                  !isCurrentMonth && "bg-black/40 text-muted-foreground/30",
                  isSelected && "bg-brand-cyan/5 ring-1 ring-inset ring-brand-cyan/50",
                  !isSelected && "hover:bg-white/[0.02]"
                )}
              >
                {/* Indicador do Dia */}
                <div className="flex justify-between items-start">
                  <div className={cn(
                    "text-[10px] sm:text-xs font-bold w-6 h-6 flex items-center justify-center rounded-md mb-1 transition-all",
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
                    const isReview = task.status === 'review' || task.title.toLowerCase().includes('revisão')
                    return (
                      <div 
                        key={task.id} 
                        className={cn(
                          "flex items-center gap-1.5 text-[9px] font-semibold truncate px-1.5 py-1 rounded-[4px] border transition-colors",
                          isReview 
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-100 hover:bg-emerald-500/20 hover:border-emerald-500/40" 
                            : "bg-white/5 border-white/5 text-white/70 hover:bg-brand-cyan/20 hover:border-brand-cyan/30 hover:text-white"
                        )}
                      >
                        <div 
                          className="w-1.5 h-1.5 rounded-full shrink-0" 
                          style={{ backgroundColor: task.category?.color || (isReview ? '#10b981' : '#8b5cf6') }} 
                        />
                        <span className="truncate">{task.title}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Área de Tarefas (Mobile) */}
                <div className="flex lg:hidden flex-wrap gap-1 justify-center items-start mt-1">
                  {dayTasks.slice(0, 4).map(t => {
                    const isReview = t.status === 'review' || t.title.toLowerCase().includes('revisão')
                    return (
                      <div 
                        key={t.id} 
                        className={cn(
                          "w-1.5 h-1.5 rounded-full shadow-sm", 
                          t.priority === 'urgent' ? 'bg-rose-500' : 
                          isReview ? 'bg-emerald-400' : 'bg-brand-cyan'
                        )} 
                        style={{ backgroundColor: t.category?.color }}
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

      {/* --- SIDEBAR LATERAL: BRIEFING DIÁRIO --- */}
      <div className="w-full lg:w-[340px] flex flex-col bg-[#0c0c0e]/90 shrink-0 min-h-[300px] lg:min-h-0 relative">
        <div className="p-5 border-b border-white/5 flex-none sticky top-0 bg-[#0c0c0e] z-10 shadow-lg">
          <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-brand-cyan" /> Briefing Diário
          </h3>
          <p className="text-[10px] text-brand-cyan/70 font-mono uppercase">
            {format(selectedDate, "dd MMM yyyy", { locale: ptBR })} // {selectedDayTasks.length} {selectedDayTasks.length === 1 ? 'Missão' : 'Missões'}
          </p>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3 pb-8 lg:pb-0">
            {selectedDayTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                      <CalendarIcon className="w-5 h-5 text-white/20" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-white/40">Radar Limpo</span>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">Nenhuma missão alocada.</span>
                </div>
            ) : (
                selectedDayTasks.map(task => {
                  const isReview = task.status === 'review' || task.title.toLowerCase().includes('revisão')

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
                        {task.priority === 'urgent' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500 animate-pulse" />}

                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {task.category && (
                                  <span 
                                    className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded-full border border-white/5" 
                                    style={{ color: task.category.color }}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: task.category.color }} />
                                    {task.category.name}
                                  </span>
                              )}
                              {isReview && (
                                <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                  <RefreshCw className="w-2.5 h-2.5" /> Revisão
                                </span>
                              )}
                            </div>
                        </div>

                        <h4 className="text-sm font-bold text-white/90 mb-3 group-hover:text-white transition-colors">
                          {task.title}
                        </h4>
                        
                        <div className="flex items-center justify-between border-t border-white/5 pt-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Brain className="w-3 h-3 text-sky-400" />
                              {renderCognitiveBattery(task.cognitive_load || 3)}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {task.estimated_minutes && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    <Clock className="w-3 h-3" /> {task.estimated_minutes}m
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