'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { X, Sparkles, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const moodOptions = [
  { value: 1, emoji: '🌧️', label: 'Péssimo', color: 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20' },
  { value: 2, emoji: '🌫️', label: 'Desanimado', color: 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border-orange-500/20' },
  { value: 3, emoji: '☕', label: 'Neutro', color: 'bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 border-slate-500/20' },
  { value: 4, emoji: '✨', label: 'Bem', color: 'bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/20 border-brand-cyan/20' },
  { value: 5, emoji: '🚀', label: 'Incrível', color: 'bg-brand-violet/10 text-brand-violet hover:bg-brand-violet/20 border-brand-violet/20' },
]

const energyOptions = [
  { value: 1, emoji: '🪫', label: 'Esgotado', color: 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20' },
  { value: 2, emoji: '🔋', label: 'Baixa', color: 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border-orange-500/20' },
  { value: 3, emoji: '⚖️', label: 'Média', color: 'bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 border-slate-500/20' },
  { value: 4, emoji: '⚡', label: 'Alta', color: 'bg-brand-emerald/10 text-brand-emerald hover:bg-brand-emerald/20 border-brand-emerald/20' },
  { value: 5, emoji: '🔥', label: 'Máxima', color: 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border-orange-500/20' },
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
      return 'Foque em tarefas pequenas e fáceis hoje. Pegue leve com você mesmo! 💙'
    }
    if (selectedMood >= 4 && selectedEnergy >= 4) {
      return 'Você está imparável! Ótimo dia para atacar aquela tarefa complexa. 🔥'
    }
    return 'Um passo de cada vez. Mantenha o ritmo constante! 🏃‍♂️'
  }

  function handleSubmit() {
    if (!mood || !energy) {
      toast.error('Selecione seu humor e nível de energia para continuar.')
      return
    }

    startTransition(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('Usuário não autenticado')
        return
      }

      const { error } = await supabase
        .from('emotional_checkins')
        .insert({
          user_id: user.id,
          mood,
          energy,
          note: note.trim() || null,
        })

      if (error) {
        console.error(error)
        toast.error('Erro ao salvar check-in. Tente novamente.')
        return
      }

      toast.success('Check-in registrado!', {
        description: getEncouragementMessage(mood, energy),
        icon: '📝'
      })
      
      router.refresh()
    })
  }

  return (
    <Card className="border-brand-violet/20 bg-gradient-to-br from-brand-violet/5 to-transparent backdrop-blur-md shadow-[0_0_30px_rgba(139,92,246,0.05)] overflow-hidden relative">
      <div className="absolute top-0 right-0 p-32 bg-brand-violet/10 rounded-full blur-[100px] pointer-events-none" />
      
      <CardHeader className="pb-4 border-b border-white/5 bg-black/10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-violet" />
            Check-in Diário
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-white rounded-full hover:bg-white/10"
            onClick={() => setIsDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Saber como você está ajuda a planejar melhor o seu foco.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-6">
        {/* Mood Selection */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-white/80">Humor</p>
          <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3">
            {moodOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMood(option.value)}
                className={cn(
                  'flex-1 min-w-[60px] flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200',
                  mood === option.value 
                    ? cn(option.color, 'ring-2 ring-offset-2 ring-offset-[#121214] scale-105 shadow-lg') 
                    : 'bg-black/20 border-white/5 text-muted-foreground hover:bg-white/5 hover:border-white/10'
                )}
              >
                <span className="text-2xl mb-1 filter drop-shadow-sm">{option.emoji}</span>
                <span className={cn("text-[10px] font-medium", mood === option.value ? 'opacity-100' : 'opacity-70')}>{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Energy Selection */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-white/80">Energia (Disposição Física)</p>
          <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3">
            {energyOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setEnergy(option.value)}
                className={cn(
                  'flex-1 min-w-[60px] flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200',
                  energy === option.value 
                    ? cn(option.color, 'ring-2 ring-offset-2 ring-offset-[#121214] scale-105 shadow-lg') 
                    : 'bg-black/20 border-white/5 text-muted-foreground hover:bg-white/5 hover:border-white/10'
                )}
              >
                <span className="text-2xl mb-1 filter drop-shadow-sm">{option.emoji}</span>
                <span className={cn("text-[10px] font-medium", energy === option.value ? 'opacity-100' : 'opacity-70')}>{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Note (Oculta até o usuário começar a preencher o básico para não assustar) */}
        {(mood || energy) && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="text-sm font-semibold text-white/80">Anotação Rápida (Opcional)</p>
            <Textarea
              placeholder="Ex: Dormi pouco hoje, ou animado pro novo projeto..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="resize-none bg-black/20 border-white/10 focus-visible:ring-brand-violet/50 h-20 text-sm"
            />
          </div>
        )}

        <div className="pt-2">
            <Button 
              onClick={handleSubmit} 
              disabled={!mood || !energy || isPending}
              className="w-full bg-brand-violet hover:bg-brand-violet/90 text-white font-medium shadow-neon-violet h-11 transition-all"
            >
              {isPending ? (
                  <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...
                  </>
              ) : (
                  'Registrar Check-in'
              )}
            </Button>
        </div>
      </CardContent>
    </Card>
  )
}