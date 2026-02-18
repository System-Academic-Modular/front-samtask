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
import { ChevronLeft, ChevronRight, Clock, AlertCircle, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* --- ÁREA PRINCIPAL: CALENDÁRIO --- */}
      {/* min-h-0 é essencial para o flexbox permitir que o filho scrolle */}
      <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-white/10 min-h-0">
        
        {/* Header (Fixo) */}
        <div className="flex-none flex items-center justify-between p-4 border-b border-white/10 bg-[#121214]/80 backdrop-blur-sm z-10">
          <h2 className="text-lg font-semibold text-white capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday} className="text-xs">
              Hoje
            </Button>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Dias da Semana (Fixo) */}
        <div className="flex-none grid grid-cols-7 border-b border-white/10 bg-white/5">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Grade de Dias (Scrollável) */}
        {/* MUDANÇA: overflow-y-auto e min-h-[120px] nas células */}
        <div className="flex-1 grid grid-cols-7 auto-rows-fr bg-[#09090b] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
          {calendarDays.map((day, dayIdx) => {
            const dayTasks = getTasksForDay(day)
            const isSelected = isSameDay(day, selectedDate)
            const isCurrentMonth = isSameMonth(day, currentMonth)

            return (
              <div 
                key={day.toString()} 
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "relative p-2 border-b border-r border-white/5 transition-colors cursor-pointer",
                  "min-h-[100px] lg:min-h-0", // Mobile: altura fixa / Desktop: fr (se couber)
                  !isCurrentMonth && "bg-[#121214]/50 text-muted-foreground/50",
                  isSelected && "bg-brand-violet/5 inset-shadow-violet",
                  "hover:bg-white/5"
                )}
              >
                <div className={cn(
                  "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1",
                  isToday(day) ? "bg-brand-violet text-white shadow-neon-violet" : "text-muted-foreground",
                  isSelected && !isToday(day) && "text-white bg-white/10"
                )}>
                  {format(day, 'd')}
                </div>

                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map(task => (
                    <div key={task.id} className="hidden lg:block text-[10px] truncate px-1 rounded-sm bg-white/5 border border-white/5 text-muted-foreground hover:text-white hover:bg-brand-violet/20 transition-colors">
                       {task.title}
                    </div>
                  ))}
                  
                  {/* Bolinhas para Mobile */}
                  <div className="flex lg:hidden gap-1 flex-wrap content-start">
                      {dayTasks.map(t => (
                          <div key={t.id} className={cn("w-1.5 h-1.5 rounded-full", t.priority === 'urgent' ? 'bg-red-500' : 'bg-brand-violet')} />
                      ))}
                  </div>

                  {dayTasks.length > 3 && (
                    <span className="hidden lg:block text-[9px] text-muted-foreground pl-1">
                      + {dayTasks.length - 3} mais
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* --- SIDEBAR LATERAL: DETALHES --- */}
      <div className="w-full lg:w-80 flex flex-col bg-[#121214]/30 h-64 lg:h-full border-t lg:border-t-0">
        <div className="p-4 border-b border-white/10 flex-none">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-brand-violet" />
            {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedDayTasks.length} {selectedDayTasks.length === 1 ? 'tarefa' : 'tarefas'} para este dia
          </p>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {selectedDayTasks.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm border-2 border-dashed border-white/5 rounded-xl">
                    Nada agendado.
                    <br />
                    <span className="text-xs opacity-50">Dia livre!</span>
                </div>
            ) : (
                selectedDayTasks.map(task => (
                    <div 
                        key={task.id} 
                        onClick={() => setEditingTask(task)}
                        className="p-3 rounded-lg border border-white/5 bg-[#18181b] hover:border-brand-violet/50 transition-colors cursor-pointer group"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded", task.priority === 'urgent' ? "bg-red-500/20 text-red-400" : "bg-white/10 text-muted-foreground")}>
                                {task.priority === 'urgent' ? 'URGENTE' : 'Normal'}
                            </span>
                            {task.category && (
                                <span className="text-[10px]" style={{ color: task.category.color }}>
                                    {task.category.name}
                                </span>
                            )}
                        </div>
                        <h4 className="text-sm font-medium text-white mb-1 group-hover:text-brand-violet transition-colors">{task.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {task.estimated_minutes && (
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {task.estimated_minutes}m</span>
                            )}
                        </div>
                    </div>
                ))
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