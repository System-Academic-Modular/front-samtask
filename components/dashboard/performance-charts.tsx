'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from "recharts"
import { Brain, Zap, Target, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Task } from '@/lib/types'

interface PerformanceChartsProps {
  tasks: Task[]
  sessions: any[] // pomodoro_sessions do banco
}

export function PerformanceCharts({ tasks, sessions }: PerformanceChartsProps) {
  
  // 1. Processamento do gráfico de Barras (Foco Semanal Real)
  const weeklyData = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 })
    return Array.from({ length: 7 }).map((_, i) => {
      const date = addDays(start, i)
      const daySessions = sessions.filter(s => 
        s.completed_at && isSameDay(new Date(s.completed_at), date)
      )
      const totalMinutes = daySessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0)
      
      return {
        day: format(date, 'eee', { locale: ptBR }),
        minutes: totalMinutes,
      }
    })
  }, [sessions])

  // 2. Estatísticas calculadas
  const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0)
  const completedCount = tasks.filter(t => t.status === 'done').length
  const totalHours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60

  // 3. Mock Emocional (A ser conectado quando houver checkins no banco)
  const dataEmotion = [
    { name: "Focado", value: 40, color: "#8b5cf6" },
    { name: "Produtivo", value: 30, color: "#06b6d4" },
    { name: "Cansado", value: 20, color: "#f43f5e" },
    { name: "Ansioso", value: 10, color: "#f59e0b" },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Cards de Stats Reais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Foco Semanal", val: `${totalHours}h ${remainingMinutes}m`, icon: Zap, color: "text-brand-cyan" },
          { label: "Tarefas Concluídas", val: completedCount.toString(), icon: Target, color: "text-brand-emerald" },
          { label: "Sessões Foco", val: sessions.length.toString(), icon: Brain, color: "text-brand-violet" },
          { label: "Eficiência", val: `${completedCount > 0 ? 'Alta' : 'Pendente'}`, icon: TrendingUp, color: "text-brand-rose" },
        ].map((stat, i) => (
          <Card key={i} className="bg-card/40 border-white/5 backdrop-blur-md">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={cn("p-3 rounded-2xl bg-white/5", stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.val}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Foco Real vindo do Banco */}
        <Card className="lg:col-span-2 bg-card/40 border-white/5 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-brand-cyan" /> Intensidade de Foco (Minutos)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      return (
                        <div className="bg-[#18181b] border border-white/10 p-2 rounded-lg shadow-xl text-xs text-white">
                          {payload[0].value} minutos de flow
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
                  {weeklyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.minutes > 60 ? '#06b6d4' : '#8b5cf6'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico Emocional */}
        <Card className="bg-card/40 border-white/5 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-brand-violet" /> Equilíbrio Mental
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataEmotion}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {dataEmotion.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}