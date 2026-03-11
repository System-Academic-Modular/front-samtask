'use client'

import { useState, useEffect, useCallback } from 'react'
import { Timer, ExternalLink, Play, Pause, RotateCcw, Globe, Zap, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { savePomodoroSession } from '@/lib/actions/pomodoro'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { TipoPomodoro } from '@/lib/types'

const QUICK_LINKS = [
  { name: 'GitHub', url: 'https://github.com', icon: Globe },
  { name: 'ChatGPT', url: 'https://chat.openai.com', icon: Zap },
  { name: 'Portal Anhanguera', url: 'https://www.anhanguera.com', icon: BookOpen },
]

export function FloatingTimer() {
  const [mounted, setMounted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isActive, setIsActive] = useState(false)
  const [mode, setMode] = useState<TipoPomodoro>('foco')
  const [customMinutes, setCustomMinutes] = useState(25) // Permite editar o tempo do foco

  // 1. Hidratação e Recuperação do Estado
  useEffect(() => {
    setMounted(true)
    const savedTarget = localStorage.getItem('pomodoro_target')
    const savedMode = localStorage.getItem('pomodoro_mode') as TipoPomodoro | null
    
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
        setTimeLeft(savedMode === 'foco' ? 25 * 60 : 5 * 60)
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
    
    if (mode === 'foco') {
      // Salva no banco com o tempo configurado
      await savePomodoroSession({
        duration_minutes: customMinutes, 
        type: 'foco'
      })
      toast.success('Sessão Neural Concluída! +XP', { 
        description: `${customMinutes} minutos de hiperfoco registrados.` 
      })
      
      // Auto-switch para pausa
      setMode('pausa_curta')
      setTimeLeft(5 * 60)
    } else {
      toast.info('Recuperação Finalizada!', { description: 'Sistemas prontos para nova imersão.' })
      setMode('foco')
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
        if (!isActive && mode === 'foco') {
            setTimeLeft(val * 60)
        }
    }
  }

  if (!mounted) return null

  return (
    // pointer-events-auto restaura o clique para o timer
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end pointer-events-auto">
      
      {/* Launcher de Links (Minimizado) */}
      {!isActive && (
        <Popover>
            <PopoverTrigger asChild>
            <Button size="icon" className="rounded-full h-10 w-10 bg-black/60 border border-white/10 backdrop-blur-xl hover:bg-brand-cyan/20 mb-1 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all hover:scale-110">
                <ExternalLink className="w-4 h-4 text-brand-cyan drop-shadow-md" />
            </Button>
            </PopoverTrigger>
            <PopoverContent side="left" className="w-48 bg-[#09090b]/95 border-white/10 p-2 backdrop-blur-xl rounded-2xl shadow-2xl">
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 pb-2 mb-2 border-b border-white/5">Atalhos Táticos</div>
                {QUICK_LINKS.map(link => (
                    <a key={link.name} href={link.url} target="_blank" className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-xl text-xs text-white/80 hover:text-white transition-colors">
                        <link.icon className="w-3.5 h-3.5 text-brand-cyan" /> {link.name}
                    </a>
                ))}
            </PopoverContent>
        </Popover>
      )}

      {/* Timer Principal (O "Widget") */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            size="icon" 
            className={cn(
              "rounded-full h-16 w-16 transition-all duration-500 border-2 shadow-2xl relative overflow-hidden group hover:scale-105",
              isActive 
                ? mode === 'foco' ? "border-brand-violet shadow-[0_0_30px_rgba(139,92,246,0.3)] bg-black" : "border-brand-emerald shadow-[0_0_30px_rgba(16,185,129,0.3)] bg-black"
                : "border-white/10 bg-black/80 backdrop-blur-md"
            )}
          >
            {/* Efeito Holográfico Interno */}
            {isActive && <div className={cn("absolute inset-0 opacity-20 pointer-events-none animate-pulse", mode === 'foco' ? "bg-brand-violet" : "bg-brand-emerald")} />}

            {/* Visual Circular Progress (SVG simples e elegante) */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                <circle cx="32" cy="32" r="28" fill="none" strokeWidth="2" stroke="rgba(255,255,255,0.05)" />
                <circle 
                    cx="32" cy="32" r="28" fill="none" strokeWidth="2.5" 
                    stroke={mode === 'foco' ? "var(--brand-violet)" : "var(--brand-emerald)"} 
                    strokeDasharray="175"
                    strokeDashoffset={175 - (175 * timeLeft / (mode === 'foco' ? customMinutes * 60 : 5 * 60))}
                    className="transition-all duration-1000 ease-linear"
                />
            </svg>
            
            <div className="flex flex-col items-center justify-center relative z-10">
                <span className={cn(
                  "text-[13px] font-black tabular-nums tracking-tighter leading-none mb-0.5 transition-colors",
                  isActive ? "text-white drop-shadow-md" : "text-white/70"
                )}>
                    {formatTime(timeLeft)}
                </span>
                <span className={cn(
                  "text-[7px] uppercase font-black tracking-widest",
                  isActive ? (mode === 'foco' ? "text-brand-violet" : "text-brand-emerald") : "text-muted-foreground group-hover:text-brand-cyan transition-colors"
                )}>
                    {isActive ? (mode === 'foco' ? 'Foco' : 'Pausa') : 'Start'}
                </span>
            </div>
          </Button>
        </PopoverTrigger>
        
        {/* Modal de Controle do Timer */}
        <PopoverContent side="left" sideOffset={20} className="w-[300px] bg-[#09090b]/95 border-white/10 backdrop-blur-2xl p-6 rounded-[32px] shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
          {/* Brilho de fundo no Modal */}
          <div className={cn(
            "absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[80px] opacity-20 pointer-events-none transition-colors duration-1000",
            mode === 'foco' ? "bg-brand-violet" : "bg-brand-emerald"
          )} />

          <div className="flex flex-col gap-6 relative z-10">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <span className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                    <Timer className={cn("w-4 h-4", mode === 'foco' ? "text-brand-violet" : "text-brand-emerald")} />
                    Timer Global
                </span>
                <Badge variant="outline" className={cn(
                  "text-[9px] font-black tracking-widest uppercase border transition-colors", 
                  mode === 'foco' ? "border-brand-violet/50 text-brand-violet bg-brand-violet/10" : "border-brand-emerald/50 text-brand-emerald bg-brand-emerald/10"
                )}>
                    {mode === 'foco' ? 'SESSÃO NEURAL' : 'RECUPERAÇÃO'}
                </Badge>
            </div>

            <div className="text-center py-2">
                <div className="text-7xl font-mono font-black text-white tracking-tighter tabular-nums drop-shadow-xl">
                    {formatTime(timeLeft)}
                </div>
            </div>

            {/* Inputs de Configuração (Só aparece se pausado e em modo foco) */}
            {!isActive && mode === 'foco' && (
                <div className="flex items-center justify-between bg-black/40 border border-white/5 p-3 rounded-2xl">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Duração (Minutos)</span>
                    <Input 
                        type="number" 
                        value={customMinutes} 
                        onChange={handleCustomTimeChange}
                        className="w-20 h-8 bg-white/5 border-white/10 text-center text-white font-bold font-mono focus-visible:ring-brand-violet/50" 
                    />
                </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button 
                size="lg" 
                className={cn(
                  "rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all h-12", 
                  isActive 
                    ? "bg-white/10 hover:bg-white/20 text-white" 
                    : mode === 'foco' 
                      ? "bg-brand-violet hover:bg-brand-violet/80 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-105"
                      : "bg-brand-emerald hover:bg-brand-emerald/80 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105"
                )}
                onClick={() => setIsActive(!isActive)}
              >
                {isActive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2 fill-current" />}
                {isActive ? 'PAUSAR' : 'INICIAR'}
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="rounded-2xl border-white/10 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white h-12"
                onClick={() => {
                  setIsActive(false)
                  localStorage.removeItem('pomodoro_target')
                  setTimeLeft(mode === 'foco' ? customMinutes * 60 : 5 * 60)
                }}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                ABORTAR
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}