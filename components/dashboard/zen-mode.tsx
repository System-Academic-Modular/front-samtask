'use client'

import { useState, useEffect } from 'react'
import { Play, Pause, RotateCcw, X, Minimize2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import confetti from 'canvas-confetti'

interface ZenModeProps {
  isOpen: boolean
  onClose: () => void
  taskTitle?: string
}

export function ZenMode({ isOpen, onClose, taskTitle = "Foco Profundo" }: ZenModeProps) {
  // Configuração do Timer (25 minutos = 1500 segundos)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)

  // Lógica do Cronômetro
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false)
      // Dispara confetes quando o pomodoro acaba!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#06b6d4', '#10b981']
      })
    }

    return () => clearInterval(interval)
  }, [isRunning, timeLeft])

  // Formatação do tempo (MM:SS)
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  const toggleTimer = () => setIsRunning(!isRunning)
  
  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(25 * 60)
  }

  const handleClose = () => {
    setIsRunning(false)
    onClose()
  }

  // Se não estiver aberto, não renderiza nada
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#09090b] text-white overflow-hidden animate-in fade-in duration-500">
      
      {/* Efeito de Fundo Neon (Respiração) */}
      <div className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-brand-violet/10 rounded-full blur-[120px] pointer-events-none transition-all duration-1000",
          isRunning ? "scale-110 opacity-70 animate-pulse" : "scale-100 opacity-30"
      )} />

      {/* Botão de Fechar (Canto superior direito) */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleClose}
        className="absolute top-6 right-6 text-white/50 hover:text-white hover:bg-white/10 rounded-full w-12 h-12"
      >
        <Minimize2 className="w-6 h-6" />
      </Button>

      {/* Conteúdo Principal */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-4xl px-4 text-center">
        
        {/* Identificação da Tarefa */}
        <div className="flex items-center gap-2 mb-8 px-6 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-brand-cyan" />
            <span className="text-sm md:text-base font-medium text-white/80">{taskTitle}</span>
        </div>

        {/* Cronômetro Gigante */}
        <div 
            className="text-[25vw] sm:text-[200px] font-bold tracking-tighter leading-none mb-12 tabular-nums"
            style={{ textShadow: '0 0 40px rgba(255,255,255,0.1)' }}
        >
            {timeString}
        </div>

        {/* Controles do Timer */}
        <div className="flex items-center gap-6">
            <Button 
                variant="outline" 
                size="icon" 
                onClick={resetTimer}
                className="w-14 h-14 rounded-full border-white/10 bg-transparent hover:bg-white/10 text-white/70 hover:text-white transition-all"
            >
                <RotateCcw className="w-6 h-6" />
            </Button>

            <Button 
                size="icon" 
                onClick={toggleTimer}
                className={cn(
                    "w-24 h-24 rounded-full shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:scale-105 transition-all",
                    isRunning ? "bg-white text-black hover:bg-white/90" : "bg-brand-violet text-white hover:bg-brand-violet/90"
                )}
            >
                {isRunning ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-2" />}
            </Button>
            
            <div className="w-14 h-14" /> {/* Espaçador invisível para centralizar o Play perfeito */}
        </div>

      </div>

      {/* Dica de rodapé */}
      <div className="absolute bottom-10 text-white/30 text-xs font-medium tracking-widest uppercase">
          Modo Deep Work Ativo
      </div>
    </div>
  )
}