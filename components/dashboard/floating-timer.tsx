'use client'

import { useState, useEffect, useCallback } from 'react'
import { Timer, ExternalLink, Play, Pause, RotateCcw, Coffee, Zap, Globe, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { savePomodoroSession } from '@/lib/actions/pomodoro'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

const QUICK_LINKS = [
  { name: 'GitHub', url: 'https://github.com', icon: Globe },
  { name: 'ChatGPT', url: 'https://chat.openai.com', icon: Zap },
  { name: 'Portal Anhanguera', url: 'https://www.anhanguera.com', icon: BookOpen },
]

export function FloatingTimer() {
  const [mounted, setMounted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isActive, setIsActive] = useState(false)
  const [mode, setMode] = useState<'work' | 'break'>('work')
  const [customMinutes, setCustomMinutes] = useState(25) // Permite editar o tempo

  // 1. Hidratação e Recuperação do Estado
  useEffect(() => {
    setMounted(true)
    const savedTarget = localStorage.getItem('pomodoro_target')
    const savedMode = localStorage.getItem('pomodoro_mode') as 'work' | 'break' | null
    
    if (savedTarget && savedMode) {
      const targetTime = parseInt(savedTarget, 10)
      const now = Date.now()
      const diff = Math.ceil((targetTime - now) / 1000)

      if (diff > 0) {
        setTimeLeft(diff)
        setMode(savedMode)
        setIsActive(true)
      } else {
        // Se o tempo acabou enquanto estava fora
        localStorage.removeItem('pomodoro_target')
        localStorage.removeItem('pomodoro_mode')
        setTimeLeft(savedMode === 'work' ? 25 * 60 : 5 * 60)
      }
    }
  }, [])

  // 2. Salvar target no localStorage
  useEffect(() => {
    if (!isActive) {
      localStorage.removeItem('pomodoro_target')
      return
    }

    if (!localStorage.getItem('pomodoro_target')) {
        const targetTime = Date.now() + timeLeft * 1000
        localStorage.setItem('pomodoro_target', targetTime.toString())
        localStorage.setItem('pomodoro_mode', mode)
    }
  }, [isActive, mode, timeLeft])

  const handleFinished = useCallback(async () => {
    setIsActive(false)
    localStorage.removeItem('pomodoro_target')
    
    if (mode === 'work') {
      // Salva no banco com o tempo configurado (não fixo em 25)
      await savePomodoroSession({
        duration_minutes: customMinutes, 
        type: 'work'
      })
      toast.success('Foco concluído! +XP', { 
        description: `${customMinutes} minutos registrados.` 
      })
      
      // Auto-switch para pausa
      setMode('break')
      setTimeLeft(5 * 60)
    } else {
      toast.info('Pausa finalizada! Bora voltar?')
      setMode('work')
      setTimeLeft(customMinutes * 60)
    }
  }, [mode, customMinutes])

  // 3. O Loop do Timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
           if (prev <= 1) {
             handleFinished()
             return 0
           }
           return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isActive, timeLeft, handleFinished])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value)
    if (val > 0 && val <= 180) {
        setCustomMinutes(val)
        if (!isActive && mode === 'work') {
            setTimeLeft(val * 60)
        }
    }
  }

  if (!mounted) return null

  return (
    // pointer-events-auto restaura o clique para o timer
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end pointer-events-auto">
      
      {/* Launcher de Links */}
      {!isActive && (
        <Popover>
            <PopoverTrigger asChild>
            <Button size="icon" className="rounded-full h-10 w-10 bg-black/40 border border-white/10 backdrop-blur-md hover:bg-brand-cyan/20 mb-2">
                <ExternalLink className="w-4 h-4 text-brand-cyan" />
            </Button>
            </PopoverTrigger>
            <PopoverContent side="left" className="w-48 bg-[#18181b] border-white/10 p-1">
                {QUICK_LINKS.map(link => (
                    <a key={link.name} href={link.url} target="_blank" className="flex items-center gap-2 p-2 hover:bg-white/5 rounded text-xs text-white">
                        <link.icon className="w-3 h-3" /> {link.name}
                    </a>
                ))}
            </PopoverContent>
        </Popover>
      )}

      {/* Timer Principal */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            size="icon" 
            className={cn(
              "rounded-full h-16 w-16 transition-all border-2 shadow-2xl relative",
              isActive ? "border-brand-violet shadow-neon-violet bg-black" : "border-white/10 bg-black/60"
            )}
          >
            {/* Visual Circular Progress (SVG simples) */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                <circle cx="32" cy="32" r="28" fill="none" strokeWidth="2" stroke="#2a2a2a" />
                <circle 
                    cx="32" cy="32" r="28" fill="none" strokeWidth="2" stroke="#8b5cf6" 
                    strokeDasharray="175"
                    strokeDashoffset={175 - (175 * timeLeft / (mode === 'work' ? customMinutes * 60 : 300))}
                    className="transition-all duration-1000 ease-linear"
                />
            </svg>
            
            <div className="flex flex-col items-center justify-center relative z-10">
                <span className="text-xs font-bold text-white tabular-nums leading-none mb-0.5">
                    {formatTime(timeLeft)}
                </span>
                <span className="text-[7px] uppercase text-muted-foreground font-bold tracking-wider">
                    {isActive ? (mode === 'work' ? 'Foco' : 'Pausa') : 'Start'}
                </span>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent side="left" className="w-72 bg-[#09090b]/95 border-white/10 backdrop-blur-xl p-6 rounded-3xl mr-4 shadow-2xl">
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <span className="text-sm font-semibold text-white flex items-center gap-2">
                    <Timer className="w-4 h-4 text-brand-violet" />
                    Focus OS
                </span>
                <Badge variant="outline" className={cn("text-[10px]", mode === 'work' ? "border-brand-violet text-brand-violet" : "border-brand-cyan text-brand-cyan")}>
                    {mode === 'work' ? 'WORK MODE' : 'BREAK TIME'}
                </Badge>
            </div>

            <div className="text-center">
                <div className="text-7xl font-mono font-black text-white tracking-tighter tabular-nums">
                    {formatTime(timeLeft)}
                </div>
            </div>

            {/* Inputs de Configuração (Só aparece se pausado e em modo work) */}
            {!isActive && mode === 'work' && (
                <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl">
                    <span className="text-xs text-muted-foreground">Duração (min):</span>
                    <Input 
                        type="number" 
                        value={customMinutes} 
                        onChange={handleCustomTimeChange}
                        className="w-20 h-8 bg-black/40 border-white/10 text-center text-white text-sm" 
                    />
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button 
                size="lg" 
                className={cn("rounded-xl font-bold transition-all", isActive ? "bg-white/10 hover:bg-white/20" : "bg-brand-violet hover:bg-brand-violet/80 shadow-neon-violet")}
                onClick={() => setIsActive(!isActive)}
              >
                {isActive ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2 fill-current" />}
                {isActive ? 'Pausar' : 'Iniciar'}
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="rounded-xl border-white/10 hover:bg-white/5"
                onClick={() => {
                  setIsActive(false)
                  localStorage.removeItem('pomodoro_target')
                  setTimeLeft(mode === 'work' ? customMinutes * 60 : 5 * 60)
                }}
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Resetar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}