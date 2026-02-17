'use client'

import { useState, useEffect, useCallback } from 'react'
import { Timer, ExternalLink, Play, Pause, RotateCcw, Coffee, Zap, Globe, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { savePomodoroSession } from '@/lib/actions/pomodoro'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

const QUICK_LINKS = [
  { name: 'GitHub', url: 'https://github.com', icon: Globe },
  { name: 'ChatGPT', url: 'https://chat.openai.com', icon: Zap },
  { name: 'Portal Anhanguera', url: 'https://www.anhanguera.com', icon: BookOpen },
  { name: 'Notion', url: 'https://notion.so', icon: ExternalLink },
]

export function FloatingTimer() {
  const [mounted, setMounted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isActive, setIsActive] = useState(false)
  const [mode, setMode] = useState<'work' | 'break'>('work')

  // 1. CORREÇÃO DE HIDRATAÇÃO
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleFinished = useCallback(async () => {
    setIsActive(false)
    const duration = mode === 'work' ? 25 : 5
    
    if (mode === 'work') {
      await savePomodoroSession({
        duration_minutes: duration,
        type: 'work'
      })
      toast.success('Missão Cumprida!', {
        description: 'Sessão de foco salva. Seu XP foi creditado!',
        icon: <Zap className="w-4 h-4 text-brand-violet" />
      })
    }
    
    const nextMode = mode === 'work' ? 'break' : 'work'
    setMode(nextMode)
    setTimeLeft(nextMode === 'work' ? 25 * 60 : 5 * 60)
  }, [mode])

  // 2. LÓGICA DO TIMER
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
    } else if (timeLeft === 0) {
      handleFinished()
    }
    return () => clearInterval(interval)
  }, [isActive, timeLeft, handleFinished])

  // 3. ATALHOS DE TECLADO (Alt + P para Play/Pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'p') {
        setIsActive(prev => !prev)
        toast(isActive ? "Timer Pausado" : "Timer Iniciado", { duration: 1000 })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isActive])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  // Previne erro de hidratação (não renderiza no servidor)
  if (!mounted) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end">
      
      {/* Launcher de Links */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            size="icon" 
            className="rounded-full h-10 w-10 bg-black/40 border border-white/10 backdrop-blur-md hover:border-brand-cyan/50 hover:bg-brand-cyan/10 transition-all group"
          >
            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-brand-cyan transition-colors" />
          </Button>
        </PopoverTrigger>
        <PopoverContent side="left" className="w-52 bg-[#09090b]/95 border-white/10 backdrop-blur-xl shadow-2xl p-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold px-3 py-2">Quick Access</p>
          <div className="grid grid-cols-1 gap-1">
            {QUICK_LINKS.map(link => (
              <a 
                key={link.name} 
                href={link.url} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-3 px-3 py-2 text-xs text-white hover:bg-white/5 rounded-lg transition-all group"
              >
                <link.icon className="w-4 h-4 text-brand-cyan group-hover:scale-110 transition-transform" />
                {link.name}
              </a>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Timer Principal */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            size="icon" 
            className={cn(
              "rounded-full h-14 w-14 transition-all duration-500 border-2 shadow-2xl relative overflow-hidden",
              isActive 
                ? "border-brand-violet shadow-[0_0_20px_rgba(139,92,246,0.3)]" 
                : "border-white/10 bg-black/40 shadow-lg"
            )}
          >
            {/* Overlay de Progresso Visual */}
            {isActive && (
                <div 
                    className="absolute bottom-0 left-0 w-full bg-brand-violet/10 transition-all duration-1000" 
                    style={{ height: `${(timeLeft / (mode === 'work' ? 1500 : 300)) * 100}%` }}
                />
            )}
            
            <div className="relative z-10 flex items-center justify-center">
              {mode === 'work' ? (
                  <Timer className={cn("w-6 h-6", isActive ? "text-brand-violet" : "text-white")} />
              ) : (
                  <Coffee className="w-6 h-6 text-brand-cyan" />
              )}
              {isActive && (
                <span className="absolute -top-6 -right-2 bg-brand-violet text-[10px] px-2 py-0.5 rounded-full font-black animate-in zoom-in">
                  {formatTime(timeLeft)}
                </span>
              )}
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent side="left" className="w-64 p-5 bg-[#09090b]/98 border-white/10 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[2rem]">
          <div className="text-center space-y-5">
            <div className="flex justify-center">
              <Badge 
                variant="outline" 
                className={cn(
                    "px-3 py-1 border-brand-violet/30 text-brand-violet bg-brand-violet/5",
                    mode === 'break' && "border-brand-cyan/30 text-brand-cyan bg-brand-cyan/5"
                )}
              >
                {mode === 'work' ? <Zap className="w-3 h-3 mr-2" /> : <Coffee className="w-3 h-3 mr-2" />}
                {mode === 'work' ? 'MODO FOCO' : 'PAUSA ATIVA'}
              </Badge>
            </div>

            <div className="text-6xl font-black text-white font-mono tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              {formatTime(timeLeft)}
            </div>

            <div className="flex justify-center gap-3">
              <Button 
                size="icon" 
                className={cn(
                    "rounded-full h-12 w-12 transition-all",
                    isActive ? "bg-white/10 text-white" : "bg-brand-violet text-white shadow-neon-violet"
                )}
                onClick={() => setIsActive(!isActive)}
              >
                {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              </Button>
              
              <Button 
                size="icon" 
                variant="ghost" 
                className="rounded-full h-12 w-12 text-muted-foreground hover:bg-white/5"
                onClick={() => {
                  setIsActive(false)
                  setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60)
                }}
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}