'use client'

import { Brain, AlertTriangle, ShieldCheck, TrendingUp, Clock, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { MaestriaCategoria } from '@/lib/types'

interface MasteryPanelProps {
  masteryData: MaestriaCategoria[]
}

const MOCK_DATA: MaestriaCategoria[] = [
  { id: '1', categoria_id: 'c1', categoria_nome: 'Engenharia de Prompt', categoria_cor: '#06b6d4', pontuacao: 85, estado: 'aprendendo', data_ultimo_estudo: new Date().toISOString() },
  { id: '2', categoria_id: 'c2', categoria_nome: 'Arquitetura Next.js', categoria_cor: '#8b5cf6', pontuacao: 100, estado: 'dominado', data_ultimo_estudo: new Date(Date.now() - 86400000).toISOString() },
  { id: '3', categoria_id: 'c3', categoria_nome: 'Segurança de Dados', categoria_cor: '#10b981', pontuacao: 42, estado: 'esquecendo', data_ultimo_estudo: new Date(Date.now() - 5 * 86400000).toISOString() },
]

export function MasteryPanel({ masteryData }: MasteryPanelProps) {
  // Garante que temos dados para renderizar
  const data = masteryData && masteryData.length > 0 ? masteryData : MOCK_DATA

  return (
    <Card className="bg-[#09090b]/80 backdrop-blur-xl border-white/5 relative overflow-hidden shadow-2xl rounded-[24px]">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-violet/10 blur-[100px] rounded-full pointer-events-none" />

      <CardHeader className="pb-4 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
                <div className="absolute inset-0 bg-brand-violet/20 blur-md rounded-xl animate-pulse" />
                <div className="relative p-2.5 bg-[#121214] rounded-xl border border-brand-violet/30 shadow-neon-violet">
                    <Brain className="w-5 h-5 text-brand-violet" />
                </div>
            </div>
            <div>
              <CardTitle className="text-md font-black uppercase tracking-[0.2em] text-white">
                Mapa de Retenção
              </CardTitle>
              <p className="text-[10px] text-brand-cyan font-black uppercase tracking-widest opacity-70 mt-0.5">Sincronização Neural Ativa</p>
            </div>
          </div>
          <Zap className="w-4 h-4 text-brand-cyan opacity-20" />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="flex flex-col divide-y divide-white/5">
          {data.map((item) => {
            const isForgetting = item.estado === 'esquecendo'
            const isMastered = item.estado === 'dominado'
            const progressValue = Math.min(item.pontuacao, 100)

            return (
              <div 
                key={item.id} 
                className={cn(
                  "p-5 transition-all duration-500 hover:bg-white/[0.04] group relative overflow-hidden",
                  isForgetting && "bg-red-500/[0.02] hover:bg-red-500/[0.05]"
                )}
              >
                <div 
                    className={cn(
                        "absolute left-0 top-2 bottom-2 w-[2px] rounded-full transition-all duration-500",
                        isForgetting ? "bg-red-500 shadow-[0_0_10px_#ef4444]" : "bg-transparent group-hover:bg-brand-cyan/40"
                    )} 
                />

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className={cn(
                        "w-2.5 h-2.5 rounded-full relative",
                        isForgetting ? "bg-red-500" : ""
                      )}
                      style={{ 
                        backgroundColor: !isForgetting ? item.categoria_cor : undefined,
                        boxShadow: `0 0 10px ${!isForgetting ? item.categoria_cor : '#ef4444'}80`
                      }}
                    >
                        {isForgetting && <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />}
                    </div>
                    <h4 className={cn(
                        "font-black text-[11px] uppercase tracking-widest", 
                        isForgetting ? "text-red-400" : "text-white/90"
                    )}>
                      {item.categoria_nome}
                    </h4>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isForgetting ? (
                      <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-tighter text-red-500 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20 animate-pulse">
                        <AlertTriangle className="w-3 h-3" /> RISCO DE PERDA
                      </span>
                    ) : isMastered ? (
                      <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-tighter text-brand-cyan bg-brand-cyan/10 px-2.5 py-1 rounded-lg border border-brand-cyan/20">
                        <ShieldCheck className="w-3 h-3" /> NÍVEL MÁXIMO
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-tighter text-white/40 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 group-hover:text-white/60 group-hover:border-white/20 transition-all">
                        <TrendingUp className="w-3 h-3" /> EVOLUINDO
                      </span>
                    )}
                  </div>
                </div>

                <div className="relative h-1.5 w-full bg-black/60 rounded-full overflow-hidden border border-white/5 shadow-inner">
                  <div 
                    className={cn(
                      "absolute top-0 left-0 h-full transition-all duration-1000 ease-out rounded-full",
                      isForgetting ? "bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_15px_rgba(239,68,68,0.6)]" : "bg-gradient-to-r from-brand-violet to-brand-cyan shadow-[0_0_15px_rgba(139,92,246,0.4)]"
                    )}
                    style={{ width: `${progressValue}%` }}
                  />
                  <div className="absolute inset-0 w-full h-full bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.05)_50%,transparent_100%)] animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                </div>

                <div className="flex justify-between items-center mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-white/30 tracking-tighter">ESTADO:</span>
                    <span className="text-[10px] font-black text-white/70 uppercase">{progressValue}% XP</span>
                  </div>
                  <span className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-bold uppercase tracking-widest bg-white/[0.03] px-2 py-0.5 rounded-md border border-white/5">
                    <Clock className="w-3 h-3" /> 
                    {formatDistanceToNow(new Date(item.data_ultimo_estudo), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>

      <div className="p-4 bg-white/[0.02] border-t border-white/5 flex justify-center">
         <button className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-brand-cyan transition-colors">
            Acessar Deep Learning Center →
         </button>
      </div>
    </Card>
  )
}