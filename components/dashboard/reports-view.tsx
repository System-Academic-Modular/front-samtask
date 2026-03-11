'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, Tooltip, Cell, PieChart, Pie, YAxis, CartesianGrid } from "recharts"
import { Brain, Zap, Target, TrendingUp, Calendar as CalendarIcon, Download, Clock, CheckCircle2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import type { Tarefa, Categoria, SessaoPomodoro } from '@/lib/types'
import { cn } from "@/lib/utils"
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ReportsViewProps {
  tasks: Tarefa[]
  sessions: SessaoPomodoro[] // Corrigido de PomodoroSession
  categories: Categoria[]
}

export function ReportsView({ tasks, sessions, categories }: ReportsViewProps) {
  
  // Cálculo do Foco Semanal (Telemetria de 7 dias)
  const weeklyFocusData = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 })
    return Array.from({ length: 7 }).map((_, i) => {
      const date = addDays(start, i)
      // Tradução: created_at -> concluido_em | type: work -> foco
      const daySessions = sessions.filter(s => 
        s.concluido_em && isSameDay(parseISO(s.concluido_em), date) && s.tipo === 'foco'
      )
      // Tradução: duration_minutes -> duracao_minutos
      const totalMinutes = daySessions.reduce((acc, s) => acc + (s.duracao_minutos || 0), 0)
      
      return {
        day: format(date, 'eee', { locale: ptBR }).toUpperCase(),
        minutes: totalMinutes,
        fullDate: format(date, 'dd/MM'),
        isToday: isSameDay(new Date(), date)
      }
    })
  }, [sessions])

  // Distribuição por Categoria
  const categoryDistribution = useMemo(() => {
    return categories.map(cat => {
      const taskCount = tasks.filter(t => t.categoria_id === cat.id).length
      return {
        name: cat.nome.toUpperCase(),
        value: taskCount,
        color: cat.cor
      }
    }).filter(c => c.value > 0)
  }, [tasks, categories])

  // Stats Rápidas
  const totalMinutes = sessions
    .filter(s => s.tipo === 'foco')
    .reduce((acc, s) => acc + (s.duracao_minutos || 0), 0)
  
  // Tradução: status: done -> concluida
  const completedTasks = tasks.filter(t => t.status === 'concluida').length
  const totalHours = Math.floor(totalMinutes / 60)
  const focusScore = Math.min(100, Math.round((totalMinutes / (40 * 60)) * 100))

  return (
    <div className="p-6 lg:p-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* Header Tático */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-brand-violet font-black text-[10px] tracking-[0.3em] uppercase">
            <TrendingUp className="w-3 h-3" /> Status de Performance
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
            Intelligence <span className="text-brand-cyan">Center</span>
          </h1>
          <p className="text-sm text-muted-foreground font-medium">Análise de Deep Work e expansão de maestria.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-12 bg-white/5 border-white/10 text-white font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-white/10 transition-all">
            <CalendarIcon className="w-4 h-4 mr-2 text-brand-cyan" /> Ciclo Atual
          </Button>
          <Button className="h-12 bg-brand-violet hover:bg-brand-violet/90 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-neon-violet transition-all active:scale-95">
            <Download className="w-4 h-4 mr-2" /> Exportar Dados
          </Button>
        </div>
      </div>

      {/* Grid de Sensores Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Tempo Total" val={`${totalHours}h ${totalMinutes % 60}m`} icon={Clock} color="text-brand-cyan" sub="Tempo em Deep Work" />
        <StatCard label="Objetivos" val={completedTasks.toString()} icon={CheckCircle2} color="text-brand-emerald" sub="Alvos Neutralizados" />
        <StatCard label="Focus Score" val={`${focusScore}%`} icon={Zap} color="text-brand-violet" sub="Eficiência Operacional" />
        <StatCard label="Sessões" val={sessions.length.toString()} icon={Target} color="text-brand-rose" sub="Ciclos Registrados" />
      </div>

      <Tabs defaultValue="visao-geral" className="space-y-8">
        <TabsList className="bg-black/40 border border-white/5 p-1 rounded-2xl">
          <TabsTrigger value="visao-geral" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px]">Visão de Campo</TabsTrigger>
          <TabsTrigger value="distribuicao" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px]">Arquitetura</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="animate-in fade-in zoom-in-95 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Gráfico de Barras: Atividade Diária */}
            <Card className="lg:col-span-2 bg-[#0c0c0e]/60 border-white/5 backdrop-blur-xl rounded-[32px] overflow-hidden shadow-2xl">
              <CardHeader className="border-b border-white/5 pb-6">
                <CardTitle className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-brand-cyan" /> Telemetria de Foco Diário
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[400px] pt-8 px-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyFocusData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#ffffff30', fontSize: 10, fontWeight: 900 }} 
                      dy={10}
                    />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      content={({ active, payload }) => {
                        if (active && payload?.length) {
                          return (
                            <div className="bg-[#09090b] border border-white/10 p-4 rounded-2xl shadow-3xl backdrop-blur-xl">
                              <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1">{payload[0].payload.fullDate}</p>
                              <p className="text-xl font-black text-brand-cyan">{payload[0].value} <span className="text-[10px] text-white/50">MIN</span></p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar dataKey="minutes" radius={[8, 8, 8, 8]} barSize={40}>
                      {weeklyFocusData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.isToday ? '#8b5cf6' : '#06b6d4'} 
                          fillOpacity={entry.minutes > 0 ? 0.8 : 0.1} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Pizza: Matriz */}
            <Card className="bg-[#0c0c0e]/60 border-white/5 backdrop-blur-xl rounded-[32px] overflow-hidden shadow-2xl">
              <CardHeader className="border-b border-white/5 pb-6">
                <CardTitle className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-2">
                  <Brain className="w-4 h-4 text-brand-violet" /> Matriz de Categorias
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[400px] flex flex-col items-center justify-center relative">
                {categoryDistribution.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryDistribution}
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={10}
                          dataKey="value"
                          stroke="none"
                        >
                          {categoryDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                            content={({ active, payload }) => {
                                if (active && payload?.length) {
                                  return (
                                    <div className="bg-[#09090b] border border-white/10 p-3 rounded-xl shadow-2xl">
                                      <p className="text-[10px] font-black text-white uppercase tracking-wider">{payload[0].name}</p>
                                      <p className="text-lg font-black" style={{ color: payload[0].payload.color }}>{payload[0].value} TAREFAS</p>
                                    </div>
                                  )
                                }
                                return null
                            }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Total</span>
                        <span className="text-4xl font-black text-white italic">{tasks.length}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center space-y-4 opacity-20">
                    <Target className="w-12 h-12 mx-auto" />
                    <p className="text-[10px] uppercase font-black tracking-widest">Aguardando dados</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatCard({ label, val, icon: Icon, color, sub }: any) {
  return (
    <Card className="bg-[#0c0c0e]/40 border-white/5 backdrop-blur-xl rounded-3xl overflow-hidden group hover:border-white/10 transition-all duration-500">
      <CardContent className="p-8 flex items-center gap-6 relative">
        <div className={cn("p-4 rounded-2xl bg-white/5 transition-all duration-500 group-hover:scale-110 group-hover:bg-white/10", color)}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-[10px] text-white/30 uppercase font-black tracking-[0.2em] mb-1">{label}</p>
          <p className="text-3xl font-black text-white tracking-tighter italic">{val}</p>
          <p className="text-[9px] text-white/20 uppercase font-bold mt-1">{sub}</p>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </CardContent>
    </Card>
  )
}