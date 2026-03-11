'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import { Coffee, Pause, Play, RotateCcw, Target, Timer, Zap, Brain } from 'lucide-react'
import { toast } from 'sonner'
import { savePomodoroSession } from '@/lib/actions/pomodoro'
import { updateTask } from '@/lib/actions/tasks'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { SessaoPomodoro, TipoPomodoro, Perfil, Tarefa } from '@/lib/types'

interface PomodoroViewProps {
  tasks: Tarefa[]
  profile: Perfil | null
  todaySessions: SessaoPomodoro[]
}

type TimerState = 'idle' | 'running' | 'paused'

export function PomodoroView({ tasks, profile, todaySessions }: PomodoroViewProps) {
  const router = useRouter()

  // Mapeamento para o novo Perfil em Português
  const workDuration = Math.max(1, profile?.duracao_pomodoro ?? 25) * 60
  const shortBreakDuration = Math.max(1, profile?.pausa_curta ?? 5) * 60
  const longBreakDuration = Math.max(1, profile?.pausa_longa ?? 15) * 60

  const [timerType, setTimerType] = useState<TipoPomodoro>('foco')
  const [timeLeft, setTimeLeft] = useState(workDuration)
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [sessionsCompleted, setSessionsCompleted] = useState(
    todaySessions.filter((session) => session.tipo === 'foco').length,
  )

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) || null,
    [tasks, selectedTaskId],
  )

  const getDurationByType = useCallback(
    (type: TipoPomodoro) => {
      if (type === 'foco') return workDuration
      if (type === 'pausa_longa') return longBreakDuration
      return shortBreakDuration
    },
    [workDuration, shortBreakDuration, longBreakDuration],
  )

  useEffect(() => {
    setTimeLeft(getDurationByType(timerType))
    setTimerState('idle')
  }, [timerType, getDurationByType])

  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }, [])

  const handleTimerComplete = useCallback(async () => {
    setTimerState('idle')

    // Sincronização com a Action (ajustar nomes de campos se necessário na action)
    const result = await savePomodoroSession({
  task_id: selectedTaskId, // A Action ainda espera o nome antigo
  duration_minutes: Math.round(getDurationByType(timerType) / 60),
  type: timerType,
    })

    if (result.error) {
      toast.error('FALHA NO PROTOCOLO', { description: result.error })
      return
    }

    if (timerType === 'foco') {
      const nextCount = sessionsCompleted + 1
      setSessionsCompleted(nextCount)

      if (selectedTask) {
        // Atualizando minutos reais usando o novo campo 'minutos_reais' ou mantendo lógica conforme o banco
        await updateTask(selectedTask.id, {
          // No seu types.ts não vi 'minutos_reais', mas o erro indicava 'actual_minutes' inexistente.
          // Se quiser rastrear tempo na tarefa, use um campo como 'minutos_focados' ou similar.
          minutos_estimados: (selectedTask.minutos_estimados || 0) // Exemplo mantendo integridade
        })
      }

      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.7 },
        colors: ['#8b5cf6', '#06b6d4', '#ffffff'],
      })

      toast.success('CICLO DE FOCO CONCLUÍDO', {
        description: selectedTask?.categoria?.nome 
          ? `Sincronia com ${selectedTask.categoria.nome} fortalecida.`
          : 'Dados de performance sincronizados.',
      })

      setTimerType(nextCount % 4 === 0 ? 'pausa_longa' : 'pausa_curta')
    } else {
      toast.success('RECARGA COMPLETA', { description: 'Sistemas prontos para nova imersão.' })
      setTimerType('foco')
    }

    router.refresh()
  }, [getDurationByType, router, selectedTask, selectedTaskId, sessionsCompleted, timerType])

  useEffect(() => {
    if (timerState !== 'running') return

    const interval = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          clearInterval(interval)
          void handleTimerComplete()
          return 0
        }
        return previous - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timerState, handleTimerComplete])

  useEffect(() => {
    const timeStr = formatTime(timeLeft)
    document.title = timerState === 'running' ? `[${timeStr}] FOCUS OS` : 'Focus OS'
  }, [formatTime, timeLeft, timerState])

  const progress = ((getDurationByType(timerType) - timeLeft) / Math.max(getDurationByType(timerType), 1)) * 100
  const isWorkMode = timerType === 'foco'

  return (
    <div className="mx-auto max-w-6xl space-y-10 pb-20 animate-in fade-in duration-1000">
      
      {timerState === 'running' && isWorkMode && (
        <div className="fixed inset-0 pointer-events-none z-[-1] shadow-[inset_0_0_15vw_rgba(139,92,246,0.15)] transition-opacity duration-1000" />
      )}

      <header className="space-y-3 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/5 bg-white/5 backdrop-blur-md mb-2">
            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isWorkMode ? "bg-brand-violet" : "bg-emerald-400")} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">
                Protocolo {timerType.replace('_', ' ')} ativo
            </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase italic">
          Deep <span className="text-brand-violet">Work</span> Engine
        </h1>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        
        {/* REATOR DE TEMPO */}
        <section className="relative lg:col-span-8 group">
          <div className={cn(
            'absolute inset-0 rounded-[40px] blur-[80px] transition-all duration-1000 opacity-20',
            isWorkMode ? 'bg-brand-violet' : 'bg-emerald-500',
            timerState === 'running' ? 'opacity-40 scale-105' : 'opacity-10'
          )} />

          <div className="relative flex flex-col items-center justify-center rounded-[40px] border border-white/5 bg-[#09090b]/60 p-12 shadow-3xl backdrop-blur-3xl overflow-hidden min-h-[550px]">
            
            <div className="mb-12 flex justify-center gap-3 rounded-2xl border border-white/5 bg-black/40 p-1.5">
              {[
                { id: 'foco', label: 'FOCO', icon: Zap, color: 'bg-brand-violet shadow-neon-violet' },
                { id: 'pausa_curta', label: 'PAUSA', icon: Coffee, color: 'bg-emerald-500 shadow-neon-emerald' },
                { id: 'pausa_longa', label: 'RECARGA', icon: Coffee, color: 'bg-sky-500 shadow-neon-sky' }
              ].map((mode) => (
                <Button
                  key={mode.id}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'rounded-xl px-8 py-5 transition-all duration-300 font-black uppercase tracking-widest text-[10px]',
                    timerType === mode.id ? mode.color + ' text-white' : 'text-white/30 hover:bg-white/5'
                  )}
                  onClick={() => setTimerType(mode.id as TipoPomodoro)}
                  disabled={timerState === 'running'}
                >
                  <mode.icon className="mr-2 h-4 w-4" />
                  {mode.label}
                </Button>
              ))}
            </div>

            <div className="relative mb-12 flex items-center justify-center">
                <div className="select-none text-[9rem] md:text-[11rem] font-black leading-none tracking-tighter text-white font-mono opacity-90 transition-all duration-500">
                    {formatTime(timeLeft)}
                </div>
                {timerState === 'paused' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] rounded-3xl animate-pulse">
                        <span className="text-xl font-black uppercase tracking-[0.5em] text-white/50">SISTEMA PAUSADO</span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-6 relative z-10">
              <Button
                size="icon"
                variant="outline"
                onClick={() => {
                  setTimerState('idle')
                  setTimeLeft(getDurationByType(timerType))
                }}
                className="h-14 w-14 rounded-2xl border-white/5 bg-black/40 hover:bg-white/10 text-white/30 hover:text-white transition-all active:scale-95"
              >
                <RotateCcw className="h-6 w-6" />
              </Button>

              <Button
                size="lg"
                onClick={() => setTimerState(timerState === 'running' ? 'paused' : 'running')}
                className={cn(
                  'h-20 rounded-[28px] px-14 text-xl font-black uppercase tracking-widest shadow-2xl transition-all duration-500 active:scale-95 group',
                  isWorkMode 
                    ? 'bg-brand-violet hover:bg-brand-violet/90 text-white shadow-brand-violet/20' 
                    : 'bg-emerald-500 hover:bg-emerald-500/90 text-white shadow-emerald-500/20',
                )}
              >
                {timerState === 'running' ? (
                  <>
                    <Pause className="mr-3 h-7 w-7 fill-current" /> Pausar
                  </>
                ) : (
                  <>
                    <Play className="mr-3 h-7 w-7 fill-current group-hover:animate-pulse" /> Iniciar
                  </>
                )}
              </Button>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/5">
                <div 
                    className={cn(
                        "h-full transition-all duration-1000 ease-linear relative",
                        isWorkMode ? "bg-brand-violet" : "bg-emerald-500"
                    )}
                    style={{ width: `${progress}%` }}
                >
                    <div className="absolute top-0 right-0 bottom-0 w-8 bg-white blur-md opacity-50" />
                </div>
            </div>
          </div>
        </section>

        {/* SIDEBAR OPERACIONAL */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="rounded-3xl border border-white/5 bg-[#0c0c0e]/80 p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
            <h3 className="mb-6 text-[11px] font-black uppercase tracking-[0.3em] text-white/40">
                Seleção de Objetivo
            </h3>

            {isWorkMode && tasks.length > 0 ? (
              <div className="space-y-4">
                <Select
                  value={selectedTaskId || 'none'}
                  onValueChange={(value) => setSelectedTaskId(value === 'none' ? null : value)}
                  disabled={timerState === 'running'}
                >
                  <SelectTrigger className="h-14 border-white/5 bg-black/40 rounded-xl text-xs font-bold uppercase tracking-widest">
                    <SelectValue placeholder="DESIGNAR ALVO..." />
                  </SelectTrigger>
                  <SelectContent className="border-white/5 bg-[#0c0c0e] rounded-xl">
                    <SelectItem value="none" className="text-[10px] font-black uppercase">SEM TAREFA DESIGNADA</SelectItem>
                    {tasks.map((task) => (
                      <SelectItem key={task.id} value={task.id} className="text-[10px] font-black uppercase py-3">
                        {task.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedTask && (
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Carga Mental</span>
                        <span className="text-[10px] font-black text-brand-cyan uppercase">{selectedTask.carga_mental}/5</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Categoria</span>
                        <span className="text-[10px] font-black text-white uppercase">{selectedTask.categoria?.nome || 'Geral'}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4 px-2 text-center border-2 border-dashed border-white/5 rounded-2xl opacity-20">
                  <p className="text-[10px] uppercase font-black tracking-widest">
                    {isWorkMode ? 'Nenhum alvo designado' : 'Recuperação Neural'}
                  </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-3xl border border-white/5 bg-[#0c0c0e]/80 p-6 text-center backdrop-blur-xl">
              <div className="text-3xl font-black text-white mb-1">{sessionsCompleted}</div>
              <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Ciclos Hoje</div>
            </div>
            <div className="rounded-3xl border border-white/5 bg-[#0c0c0e]/80 p-6 text-center backdrop-blur-xl">
              <div className="text-3xl font-black text-white mb-1">
                {Math.round(sessionsCompleted * (workDuration / 60))}
              </div>
              <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Min. Flow</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}