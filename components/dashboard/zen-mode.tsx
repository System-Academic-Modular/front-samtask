'use client'

import { useState, useEffect, useCallback } from 'react'
import { Play, Pause, RotateCcw, Minimize2, Sparkles, Zap, Music2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import confetti from 'canvas-confetti'
import { SpotifyPlayer } from './spotify-player'
import { PlaylistModal } from './playlist-modal'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'

interface ZenModeProps {
  isOpen: boolean
  onClose: () => void
  taskTitle?: string
}

export function ZenMode({ isOpen, onClose, taskTitle = "Foco Profundo" }: ZenModeProps) {
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // --- LÓGICA DO TIMER ---
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000)
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false)
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#06b6d4', '#10b981']
      })
      toast.success("Sessão finalizada! Bom trabalho.")
    }
    return () => clearInterval(interval)
  }, [isRunning, timeLeft])

  // --- ATALHOS DE TECLADO ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      
      // Evita disparar atalhos se o usuário estiver digitando em algum input (ex: busca de playlist)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          setIsRunning(prev => !prev)
          break
        case 'KeyR':
          setIsRunning(false)
          setTimeLeft(25 * 60)
          toast.info("Timer reiniciado")
          break
        case 'KeyM':
          setIsPlaylistOpen(prev => !prev)
          break
        case 'Escape':
          if (isPlaylistOpen) {
            setIsPlaylistOpen(false)
          } else {
            onClose()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isPlaylistOpen, onClose])

  const timeString = `${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`

  if (!isOpen || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-[#050505] text-white flex flex-col items-center justify-center overflow-hidden animate-in fade-in duration-1000 h-[100dvh]">
      
      {/* AURORA DINÂMICA */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-brand-violet/10 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-brand-cyan/10 blur-[120px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      <div className="absolute inset-0 bg-cyber-grid opacity-[0.07]" />

      {/* HEADER TÁTICO */}
      <div className="absolute top-6 md:top-10 left-6 md:left-10 right-6 md:right-10 flex justify-between items-center z-50">
        <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl">
          <Zap className="w-3 h-3 text-brand-violet fill-current animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">Protocolo_Zen</span>
        </div>
        
        <Button 
          variant="ghost" 
          onClick={onClose}
          className="text-white/20 hover:text-white hover:bg-white/5 group transition-all"
        >
          <Minimize2 className="w-5 h-5 mr-2 group-hover:scale-110" />
          <span className="hidden md:inline text-xs uppercase tracking-widest font-bold">Esc Sair</span>
        </Button>
      </div>

      {/* CONTEÚDO CENTRAL */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-5xl px-6 text-center">
        
        <div className="flex items-center gap-2 mb-6 md:mb-10 px-6 py-2 rounded-full border border-brand-violet/20 bg-gradient-to-r from-brand-violet/10 to-transparent backdrop-blur-xl">
            <Sparkles className="w-4 h-4 text-brand-cyan" />
            <span className="text-xs md:text-sm font-bold tracking-[0.2em] uppercase text-white/90">{taskTitle}</span>
        </div>

        <h1 
          className="text-[28vw] md:text-[200px] font-black tracking-tighter leading-none mb-8 md:mb-12 tabular-nums text-neon select-none"
          style={{ 
            textShadow: isRunning ? '0 0 60px var(--brand-violet)' : '0 0 20px rgba(255,255,255,0.05)',
            color: isRunning ? 'white' : 'rgba(255,255,255,0.15)'
          }}
        >
            {timeString}
        </h1>

        <div className="flex items-center gap-6 md:gap-10 mb-12 md:mb-16">
            <Button 
                variant="outline" 
                size="icon" 
                onClick={() => { setIsRunning(false); setTimeLeft(25 * 60); }}
                className="w-14 h-14 md:w-16 md:h-16 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 text-white/40 hover:text-brand-violet transition-all active:scale-90"
                title="Reiniciar (R)"
            >
                <RotateCcw className="w-6 h-6" />
            </Button>

            <Button 
                onClick={() => setIsRunning(!isRunning)}
                className={cn(
                    "w-24 h-24 md:w-28 md:h-28 rounded-[32px] transition-all duration-500 shadow-2xl active:scale-95",
                    isRunning 
                      ? "bg-white text-black" 
                      : "bg-brand-violet text-white shadow-[0_0_40px_var(--brand-glow)]"
                )}
                title="Play/Pause (Espaço)"
            >
                {isRunning ? <Pause className="w-10 h-10 md:w-12 md:h-12 fill-current" /> : <Play className="w-10 h-10 md:w-12 md:h-12 ml-2 fill-current" />}
            </Button>

            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setIsPlaylistOpen(true)}
              className="w-14 h-14 md:w-16 md:h-16 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 text-white/40 hover:text-brand-cyan transition-all active:scale-90"
              title="Músicas (M)"
            >
                <Music2 className="w-6 h-6" />
            </Button>
        </div>

        <div className="w-full max-w-sm animate-in slide-in-from-bottom-8 duration-1000 px-4">
           <SpotifyPlayer />
        </div>
      </div>

      <PlaylistModal isOpen={isPlaylistOpen} onClose={() => setIsPlaylistOpen(false)} />

      {/* RODAPÉ COM DICAS DE ATALHOS */}
      <div className="hidden sm:flex absolute bottom-10 w-full px-12 justify-between items-end opacity-20 text-[10px] font-black uppercase tracking-[0.5em]">
        <div className="flex flex-col gap-2 text-left">
          <span>[ESPAÇO] PLAY/PAUSE</span>
          <span>[R] REINICIAR TIMER</span>
          <span>[M] SELECIONAR MÚSICA</span>
        </div>
        <div className="text-right flex flex-col gap-1">
          <span>ARTHUR_OS v2.6</span>
          <span>NEURAL_LINK: ESTÁVEL</span>
        </div>
      </div>
    </div>,
    document.body
  )
}