'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, PieChart, Pie, CartesianGrid } from "recharts"
import { Brain, Zap, Target, TrendingUp, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Tarefa } from '@/lib/types'

interface PerformanceChartsProps {
  tasks: Tarefa[]
  sessions: any[] // sessoes_pomodoro do banco
}

export function PerformanceCharts({ tasks, sessions }: PerformanceChartsProps) {
  
  // 1. Processamento de Foco Semanal (Métrica de Intensidade)
  const weeklyData = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 })
    return Array.from({ length: 7 }).map((_, i) => {
      const date = addDays(start, i)
      const daySessions = sessions.filter(s => 
        s.completado_em && isSameDay(new Date(s.completado_em), date)
      )
      const totalMinutes = daySessions.reduce((acc, s) => acc + (s.duracao_minutos || 0), 0)
      
      return {
        day: format(date, 'eee', { locale: ptBR }).toUpperCase(),
        minutes: totalMinutes,
        fullDate: format(date, 'dd/MM'),
      }
    })
  }, [sessions])

  // 2. Telemetria Real
  const totalMinutes = sessions.reduce((acc, s) => acc + (s.duracao_minutos || 0), 0)
  const completedCount = tasks.filter(t => t.status === 'concluida').length
  const totalHours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60

  // 3. Mock Emocional (Ajustado para o Visual Tático)
  const dataEmotion = [
    { name: "Flow", value: 45, color: "#8b5cf6" },
    { name: "Produtivo", value: 30, color: "#06b6d4" },
    { name: "Stress", value: 15, color: "#f43f5e" },
    { name: "Distração", value: 10, color: "#f59e0b" },
  ]

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* Grid de Sensores de Performance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Volume de Foco", val: `${totalHours}h ${remainingMinutes}m`, icon: Activity, color: "text-brand-cyan", bg: "bg-brand-cyan/10" },
          { label: "Módulos Concluídos", val: completedCount.toString(), icon: Target, color: "text-emerald-400", bg: "bg-emerald-400/10" },
          { label: "Sessões Ativas", val: sessions.length.toString(), icon: Zap, color: "text-brand-violet", bg: "bg-brand-violet/10" },
          { label: "Status Operacional", val: completedCount > 0 ? 'NOMINAL' : 'INICIAL', icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-400/10" },
        ].map((stat, i) => (
          <Card key={i} className="bg-[#0c0c0e]/50 border-white/5 backdrop-blur-xl relative overflow-hidden group">
            <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500", stat.bg.replace('/10', '/5'))} />
            <CardContent className="p-6 flex items-center gap-4 relative z-10">
              <div className={cn("p-3 rounded-2xl border border-white/5 shadow-inner", stat.bg, stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">{stat.label}</p>
                <p className="text-2xl font-bold text-white tracking-tighter">{stat.val}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Intensidade (Barras) */}
        <Card className="lg:col-span-2 bg-[#0c0c0e]/50 border-white/5 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Zap className="w-24 h-24 text-brand-cyan" />
          </div>
          <CardHeader className="relative z-10">
            <CardTitle className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand-cyan animate-pulse" /> 
              Vetor de Foco Semanal
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[320px] pb-8 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 20, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} 
                  dy={10}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip 
                  cursor={{ fill: 'white', fillOpacity: 0.03 }}
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      return (
                        <div className="bg-[#09090b] border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md">
                          <p className="text-[10px] font-black uppercase text-brand-cyan mb-1">{payload[0].payload.fullDate}</p>
                          <p className="text-lg font-bold text-white leading-none">
                            {payload[0].value} <span className="text-xs font-normal text-muted-foreground">min</span>
                          </p>
                          <p className="text-[9px] text-muted-foreground uppercase mt-2 font-bold">Estado de Flow Detectado</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="minutes" radius={[4, 4, 4, 4]} barSize={32}>
                  {weeklyData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.minutes > 60 ? 'url(#cyanGradient)' : 'url(#violetGradient)'} 
                      className="transition-all duration-500 hover:opacity-100 opacity-80"
                    />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={1} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="violetGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={1} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Equilíbrio (Donut) */}
        <Card className="bg-[#0c0c0e]/50 border-white/5 backdrop-blur-xl relative overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
              <Brain className="w-4 h-4 text-brand-violet" /> 
              Biometria Emocional
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[320px] flex flex-col items-center justify-center relative z-10">
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Sincronia</p>
                <p className="text-3xl font-black text-white">92%</p>
             </div>
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataEmotion}
                  innerRadius={75}
                  outerRadius={95}
                  paddingAngle={10}
                  dataKey="value"
                  stroke="none"
                >
                  {dataEmotion.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      style={{ filter: `drop-shadow(0 0 8px ${entry.color}40)` }}
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      return (
                        <div className="bg-[#09090b] border border-white/10 p-2 rounded-lg shadow-xl">
                          <p className="text-[10px] font-black uppercase" style={{ color: payload[0].payload.color }}>
                            {payload[0].name}: {payload[0].value}%
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Legenda Customizada Tática */}
            <div className="grid grid-cols-2 gap-4 w-full mt-4">
               {dataEmotion.map((item, i) => (
                 <div key={i} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter">{item.name}</span>
                 </div>
               ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}