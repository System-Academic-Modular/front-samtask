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
    // Removido h-full fixo que causava bug no mobile. Usando min-h-full e flex-col.
    <div className="flex flex-col lg:flex-row min-h-full w-full bg-[#09090b] rounded-xl border border-white/10 overflow-hidden">
      
      {/* --- ÁREA PRINCIPAL: CALENDÁRIO --- */}
      <div className="flex-1 flex flex-col min-w-0 border-b lg:border-b-0 lg:border-r border-white/10">
        
        {/* Header (Fixo) */}
        <div className="flex-none flex items-center justify-between p-3 sm:p-4 border-b border-white/10 bg-[#121214]/80 backdrop-blur-sm z-10">
          <h2 className="text-base sm:text-lg font-semibold text-white capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 sm:h-10 sm:w-10">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday} className="text-xs h-8 sm:h-9">
              Hoje
            </Button>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 sm:h-10 sm:w-10">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Dias da Semana */}
        <div className="flex-none grid grid-cols-7 border-b border-white/10 bg-white/5">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="py-2 text-center text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
              {/* No mobile mostra só a primeira letra se ficar muito apertado */}
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.charAt(0)}</span>
            </div>
          ))}
        </div>

        {/* Grade de Dias */}
        <div className="flex-1 grid grid-cols-7 auto-rows-fr bg-[#09090b]">
          {calendarDays.map((day) => {
            const dayTasks = getTasksForDay(day)
            const isSelected = isSameDay(day, selectedDate)
            const isCurrentMonth = isSameMonth(day, currentMonth)

            return (
              <div 
                key={day.toString()} 
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "relative p-1 sm:p-2 border-b border-r border-white/5 transition-colors cursor-pointer flex flex-col",
                  // MUDANÇA: Quadrado perfeito no mobile, altura livre no desktop
                  "aspect-square lg:aspect-auto lg:min-h-[100px]", 
                  !isCurrentMonth && "bg-[#121214]/50 text-muted-foreground/50",
                  isSelected && "bg-brand-violet/10 inset-shadow-violet ring-1 ring-inset ring-brand-violet/50",
                  "hover:bg-white/5"
                )}
              >
                {/* Número do Dia */}
                <div className={cn(
                  "text-[10px] sm:text-xs font-medium w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full mb-1",
                  isToday(day) ? "bg-brand-violet text-white shadow-neon-violet" : "text-muted-foreground",
                  isSelected && !isToday(day) && "text-white bg-white/10"
                )}>
                  {format(day, 'd')}
                </div>

                {/* Área de Tarefas */}
                <div className="flex-1 overflow-hidden w-full">
                  {/* Visualização Desktop: Mostra os títulos das tarefas */}
                  <div className="hidden lg:flex flex-col gap-1 w-full">
                      {dayTasks.slice(0, 3).map(task => (
                        <div key={task.id} className="text-[10px] truncate px-1.5 py-0.5 rounded-sm bg-white/5 border border-white/5 text-muted-foreground hover:text-white hover:bg-brand-violet/20 transition-colors">
                          {task.title}
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <span className="text-[9px] text-muted-foreground pl-1 font-medium">
                          + {dayTasks.length - 3}
                        </span>
                      )}
                  </div>

                  {/* Visualização Mobile: Mostra apenas bolinhas coloridas centralizadas */}
                  <div className="flex lg:hidden flex-wrap gap-0.5 sm:gap-1 justify-center items-start mt-0.5">
                      {dayTasks.slice(0, 4).map(t => (
                          <div 
                            key={t.id} 
                            className={cn(
                                "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full", 
                                t.priority === 'urgent' ? 'bg-red-500' : 'bg-brand-violet'
                            )} 
                          />
                      ))}
                      {dayTasks.length > 4 && (
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white/30" />
                      )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* --- SIDEBAR LATERAL / BOTTOM SHEET (MOBILE) --- */}
      <div className="w-full lg:w-80 flex flex-col bg-[#121214]/80 backdrop-blur-md lg:border-l border-white/10 shrink-0 min-h-[300px] lg:min-h-0">
        <div className="p-4 border-b border-white/10 flex-none sticky top-0 bg-[#121214] z-10">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-brand-violet" />
            {format(selectedDate, "EEEE, d 'de' MMM", { locale: ptBR })}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedDayTasks.length} {selectedDayTasks.length === 1 ? 'tarefa agendada' : 'tarefas agendadas'}
          </p>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3 pb-8 lg:pb-0">
            {selectedDayTasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm border-2 border-dashed border-white/5 rounded-xl bg-black/20">
                    <CalendarIcon className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    Nada agendado.
                    <br />
                    <span className="text-xs opacity-50">Aproveite seu dia!</span>
                </div>
            ) : (
                selectedDayTasks.map(task => (
                    <div 
                        key={task.id} 
                        onClick={() => setEditingTask(task)}
                        className="p-3 rounded-lg border border-white/5 bg-black/40 hover:bg-[#18181b] hover:border-brand-violet/50 transition-all cursor-pointer group"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <span className={cn(
                                "text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide", 
                                task.priority === 'urgent' ? "bg-red-500/20 text-red-400" : "bg-white/10 text-muted-foreground"
                            )}>
                                {task.priority === 'urgent' ? 'URGENTE' : 'NORMAL'}
                            </span>
                            {task.category && (
                                <span className="text-[10px] font-medium px-2 border rounded-full border-white/10 bg-black" style={{ color: task.category.color }}>
                                    {task.category.name}
                                </span>
                            )}
                        </div>
                        <h4 className="text-sm font-medium text-white/90 mb-2 group-hover:text-brand-violet transition-colors leading-tight">{task.title}</h4>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {task.estimated_minutes && (
                                <span className="flex items-center gap-1 bg-white/5 px-1.5 rounded">
                                    <Clock className="w-3 h-3" /> {task.estimated_minutes}m
                                </span>
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