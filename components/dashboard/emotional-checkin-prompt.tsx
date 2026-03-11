'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { X, Sparkles, Loader2, Activity, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const moodOptions = [
  { value: 1, emoji: '🌧️', label: 'CRÍTICO', color: 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/30 ring-red-500/50' },
  { value: 2, emoji: '🌫️', label: 'BAIXO', color: 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border-orange-500/30 ring-orange-500/50' },
  { value: 3, emoji: '☕', label: 'ESTÁVEL', color: 'bg-slate-500/10 text-slate-300 hover:bg-slate-500/20 border-slate-500/30 ring-slate-500/50' },
  { value: 4, emoji: '✨', label: 'BOM', color: 'bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/20 border-brand-cyan/30 ring-brand-cyan/50' },
  { value: 5, emoji: '🚀', label: 'MÁXIMO', color: 'bg-brand-violet/10 text-brand-violet hover:bg-brand-violet/20 border-brand-violet/30 ring-brand-violet/50' },
]

const energyOptions = [
  { value: 1, emoji: '🪫', label: 'ESGOTADA', color: 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/30 ring-red-500/50' },
  { value: 2, emoji: '🔋', label: 'BAIXA', color: 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border-orange-500/30 ring-orange-500/50' },
  { value: 3, emoji: '⚖️', label: 'MÉDIA', color: 'bg-slate-500/10 text-slate-300 hover:bg-slate-500/20 border-slate-500/30 ring-slate-500/50' },
  { value: 4, emoji: '⚡', label: 'ALTA', color: 'bg-brand-emerald/10 text-brand-emerald hover:bg-brand-emerald/20 border-brand-emerald/30 ring-brand-emerald/50' },
  { value: 5, emoji: '🔥', label: 'SOBRECARGA', color: 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border-orange-500/30 ring-orange-500/50' },
]

export function EmotionalCheckinPrompt() {
  const [mood, setMood] = useState<number | null>(null)
  const [energy, setEnergy] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [isDismissed, setIsDismissed] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const supabase = createClient()

  if (isDismissed) return null

  function getEncouragementMessage(selectedMood: number, selectedEnergy: number): string {
    if (selectedMood <= 2 || selectedEnergy <= 2) {
      return 'Bateria baixa detectada. Foque em missões de carga mental leve hoje! 💙'
    }
    if (selectedMood >= 4 && selectedEnergy >= 4) {
      return 'Sistemas operando em capacidade máxima! Destrua os seus objetivos. 🔥'
    }
    return 'Níveis estabilizados. Mantenha a consistência no radar! 📡'
  }

  function handleSubmit() {
    if (!mood || !energy) {
      toast.error('Calibração Incompleta', { description: 'Selecione os parâmetros de humor e energia.' })
      return
    }

    startTransition(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('Conexão Neural perdida.')
        return
      }

      // TRADUZIDO: Salvando na nova tabela em português
      const { error } = await supabase
        .from('checkins_emocionais')
        .insert({
          usuario_id: user.id,
          humor: mood,
          energia: energy,
          nota: note.trim() || null,
        })

      if (error) {
        console.error(error)
        toast.error('Falha ao sincronizar scanner. Tente novamente.')
        return
      }

      toast.success('Scanner Sincronizado!', {
        description: getEncouragementMessage(mood, energy),
        icon: '🧠'
      })
      
      router.refresh()
      setIsDismissed(true) // Remove o card após preencher
    })
  }

  return (
    <Card className="border-brand-violet/30 bg-black/60 backdrop-blur-xl shadow-[0_0_30px_rgba(139,92,246,0.1)] overflow-hidden relative group transition-all duration-500">
      {/* Efeito Holográfico de Fundo */}
      <div className="absolute top-0 right-0 p-32 bg-brand-violet/10 rounded-full blur-[100px] pointer-events-none transition-all duration-700 group-hover:bg-brand-violet/20" />
      <div className="absolute inset-0 bg-gradient-to-br from-brand-violet/5 to-transparent pointer-events-none" />
      
      <CardHeader className="pb-4 border-b border-white/5 bg-white/[0.02] relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-violet animate-pulse" />
            Scanner Cognitivo
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/40 hover:text-white rounded-full hover:bg-white/10 hover:rotate-90 transition-all duration-300"
            onClick={() => setIsDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-widest mt-1">
          Calibre os seus níveis internos para otimizar a distribuição de carga mental.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-6 relative z-10">
        {/* Mood Selection */}
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-brand-cyan flex items-center gap-2">
            <Sparkles className="w-3 h-3" /> Estado Emocional
          </p>
          <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3">
            {moodOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMood(option.value)}
                className={cn(
                  'flex-1 min-w-[60px] flex flex-col items-center justify-center py-3 px-1 sm:px-3 rounded-xl border transition-all duration-300 relative overflow-hidden',
                  mood === option.value 
                    ? cn(option.color, 'ring-1 scale-[1.02] shadow-[0_0_15px_inherit]') 
                    : 'bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10 hover:border-white/20'
                )}
              >
                {mood === option.value && <div className="absolute inset-0 bg-white/5 animate-pulse pointer-events-none" />}
                <span className="text-xl sm:text-2xl mb-1.5 filter drop-shadow-md">{option.emoji}</span>
                <span className={cn("text-[8px] sm:text-[9px] font-black uppercase tracking-widest", mood === option.value ? 'opacity-100' : 'opacity-50')}>{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Energy Selection */}
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-brand-emerald flex items-center gap-2 mt-4">
            <Zap className="w-3 h-3" /> Nível de Bateria FÍSICA
          </p>
          <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3">
            {energyOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setEnergy(option.value)}
                className={cn(
                  'flex-1 min-w-[60px] flex flex-col items-center justify-center py-3 px-1 sm:px-3 rounded-xl border transition-all duration-300 relative overflow-hidden',
                  energy === option.value 
                    ? cn(option.color, 'ring-1 scale-[1.02] shadow-[0_0_15px_inherit]') 
                    : 'bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10 hover:border-white/20'
                )}
              >
                {energy === option.value && <div className="absolute inset-0 bg-white/5 animate-pulse pointer-events-none" />}
                <span className="text-xl sm:text-2xl mb-1.5 filter drop-shadow-md">{option.emoji}</span>
                <span className={cn("text-[8px] sm:text-[9px] font-black uppercase tracking-widest", energy === option.value ? 'opacity-100' : 'opacity-50')}>{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Note (Desliza suavemente quando ativada) */}
        {(mood || energy) && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500 ease-out pt-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Log Diário (Opcional)</p>
            <Textarea
              placeholder="[ Terminal ] Adicione o motivo da sua calibração atual..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="resize-none bg-black/40 border-white/10 focus-visible:ring-brand-violet/50 h-20 text-xs sm:text-sm text-white placeholder:text-muted-foreground/40 placeholder:font-mono rounded-xl"
            />
          </div>
        )}

        <div className="pt-4 border-t border-white/5">
            <Button 
              onClick={handleSubmit} 
              disabled={!mood || !energy || isPending}
              className={cn(
                "w-full font-black tracking-widest uppercase text-xs h-12 rounded-xl transition-all duration-300",
                (!mood || !energy) 
                  ? "bg-white/5 text-white/30" 
                  : "bg-brand-violet hover:bg-brand-violet/80 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] hover:scale-[1.02]"
              )}
            >
              {isPending ? (
                  <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> PROCESSANDO DADOS...
                  </>
              ) : (
                  'REGISTRAR CALIBRAÇÃO'
              )}
            </Button>
        </div>
      </CardContent>
    </Card>
  )
}