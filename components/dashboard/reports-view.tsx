'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, Tooltip, Cell, PieChart, Pie } from "recharts"
import { Brain, Zap, Target, TrendingUp, Calendar as CalendarIcon, Download } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import type { Tarefa, Categoria } from '@/lib/types'
import { cn } from "@/lib/utils"
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ReportsViewProps {
  tasks: Tarefa[]
  sessions: any[]
  categories: Categoria[]
}

export function ReportsView({ tasks, sessions, categories }: ReportsViewProps) {
  
  // Cálculo do Foco Semanal
  const weeklyFocusData = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 })
    return Array.from({ length: 7 }).map((_, i) => {
      const date = addDays(start, i)
      const daySessions = sessions.filter(s => 
        s.completed_at && isSameDay(parseISO(s.completed_at), date)
      )
      const totalMinutes = daySessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0)
      
      return {
        day: format(date, 'eee', { locale: ptBR }),
        minutes: totalMinutes,
        fullDate: format(date, 'dd/MM')
      }
    })
  }, [sessions])

  // Distribuição por Categoria
  const categoryDistribution = useMemo(() => {
    return categories.map(cat => {
      const taskCount = tasks.filter(t => t.category_id === cat.id).length
      return {
        name: cat.name,
        value: taskCount,
        color: cat.color
      }
    }).filter(c => c.value > 0)
  }, [tasks, categories])

  // Stats Rápidas
  const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0)
  const completedTasks = tasks.filter(t => t.status === 'done').length
  const totalHours = Math.floor(totalMinutes / 60)

  return (
    <div className="p-6 lg:p-10 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Analytics de Performance</h1>
          <p className="text-muted-foreground">Dados reais sincronizados com seu Supabase.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-white/5 border-white/10 text-white">
            <CalendarIcon className="w-4 h-4 mr-2" /> Últimos 7 dias
          </Button>
          <Button className="bg-brand-violet hover:bg-brand-violet/90 text-white">
            <Download className="w-4 h-4 mr-2" /> Exportar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Tempo de Foco" val={`${totalHours}h ${totalMinutes % 60}m`} icon={Zap} color="text-brand-cyan" />
        <StatCard label="Concluídas" val={completedTasks.toString()} icon={Target} color="text-brand-emerald" />
        <StatCard label="Categorias" val={categories.length.toString()} icon={Brain} color="text-brand-violet" />
        <StatCard label="Sessões" val={sessions.length.toString()} icon={TrendingUp} color="text-brand-rose" />
      </div>

      <Tabs defaultValue="visao-geral" className="space-y-6">
        <TabsList className="bg-black/20 border border-white/5 p-1">
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="distribuicao">Distribuição</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 bg-card/40 border-white/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Zap className="w-4 h-4 text-brand-cyan" /> Minutos de Foco por Dia
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[350px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyFocusData}>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      content={({ active, payload }) => {
                        if (active && payload?.length) {
                          return (
                            <div className="bg-[#18181b] border border-white/10 p-3 rounded-xl shadow-2xl">
                              <p className="text-white font-bold">{payload[0].value} min</p>
                              <p className="text-[10px] text-muted-foreground uppercase">{payload[0].payload.fullDate}</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
                      {weeklyFocusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.minutes > 60 ? '#06b6d4' : '#8b5cf6'} fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card/40 border-white/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Target className="w-4 h-4 text-brand-violet" /> Tarefas por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[350px] flex items-center justify-center">
                {categoryDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryDistribution}
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={8}
                        dataKey="value"
                      >
                        {categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-muted-foreground">Sem dados suficientes</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatCard({ label, val, icon: Icon, color }: any) {
  return (
    <Card className="bg-card/40 border-white/5 backdrop-blur-md overflow-hidden group">
      <CardContent className="p-6 flex items-center gap-4 relative">
        <div className={cn("p-3 rounded-2xl bg-white/5 transition-colors group-hover:bg-white/10", color)}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-white tracking-tight">{val}</p>
        </div>
      </CardContent>
    </Card>
  )
}