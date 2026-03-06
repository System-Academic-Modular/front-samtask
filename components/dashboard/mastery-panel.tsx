'use client'

import { Brain, AlertTriangle, ShieldCheck, TrendingUp, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { MasteryStatus } from '@/lib/actions/mastery'

interface MasteryPanelProps {
  masteryData: MasteryStatus[]
}

// Mock de fallback caso o aluno ainda não tenha dados reais no banco
const MOCK_DATA: MasteryStatus[] = [
  { id: '1', category_id: 'c1', category_name: 'Matemática', category_color: '#3b82f6', score: 85, state: 'learning', last_study_date: new Date().toISOString() },
  { id: '2', category_id: 'c2', category_name: 'História', category_color: '#eab308', score: 100, state: 'mastered', last_study_date: new Date(Date.now() - 86400000).toISOString() },
  { id: '3', category_id: 'c3', category_name: 'Biologia', category_color: '#22c55e', score: 45, state: 'forgetting', last_study_date: new Date(Date.now() - 4 * 86400000).toISOString() },
]

export function MasteryPanel({ masteryData }: MasteryPanelProps) {
  const data = masteryData && masteryData.length > 0 ? masteryData : MOCK_DATA

  return (
    <Card className="glass-panel border-white/5 relative overflow-hidden">
      {/* Glow de fundo */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-violet/10 blur-[80px] rounded-full pointer-events-none" />

      <CardHeader className="pb-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-violet/10 rounded-xl border border-brand-violet/20">
              <Brain className="w-5 h-5 text-brand-violet" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Mapa de Retenção
              </CardTitle>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mt-0.5">Sincronização Neural</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="flex flex-col divide-y divide-white/5">
          {data.map((item) => {
            const isForgetting = item.state === 'forgetting'
            const isMastered = item.state === 'mastered'
            
            // Limitando o visual da barra a 100%
            const progressValue = Math.min(item.score, 100)

            return (
              <div 
                key={item.id} 
                className={cn(
                  "p-5 transition-all duration-500 hover:bg-white/[0.02] group relative",
                  isForgetting && "bg-red-500/[0.03] hover:bg-red-500/[0.05]"
                )}
              >
                {/* Indicador lateral de perigo */}
                {isForgetting && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                )}

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className={cn(
                        "w-3 h-3 rounded-full shadow-sm",
                        isForgetting ? "animate-ping bg-red-500" : ""
                      )}
                      style={{ backgroundColor: !isForgetting ? item.category_color : undefined }}
                    />
                    <h4 className={cn("font-bold text-sm", isForgetting ? "text-red-400" : "text-white/90")}>
                      {item.category_name}
                    </h4>
                  </div>
                  
                  {/* Badges de Status */}
                  <div className="flex items-center gap-2">
                    {isForgetting ? (
                      <span className="flex items-center gap-1 text-[10px] uppercase font-black text-red-500 bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20">
                        <AlertTriangle className="w-3 h-3" /> Risco de Esquecimento
                      </span>
                    ) : isMastered ? (
                      <span className="flex items-center gap-1 text-[10px] uppercase font-black text-brand-cyan bg-brand-cyan/10 px-2 py-1 rounded-md border border-brand-cyan/20">
                        <ShieldCheck className="w-3 h-3" /> Dominado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] uppercase font-black text-white/50">
                        <TrendingUp className="w-3 h-3" /> Em Progresso
                      </span>
                    )}
                  </div>
                </div>

                {/* Barra de Progresso Customizada */}
                <div className="relative h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className={cn(
                      "absolute top-0 left-0 h-full transition-all duration-1000 ease-out",
                      isForgetting ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" : "bg-brand-violet shadow-[0_0_10px_var(--brand-glow)]"
                    )}
                    style={{ width: `${progressValue}%` }}
                  />
                </div>

                <div className="flex justify-between items-center mt-3 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  <span>Score: {item.score.toFixed(0)} XP</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 
                    Último estudo: {formatDistanceToNow(new Date(item.last_study_date), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}