'use client'

import { useState } from 'react'
import type { Task, Category } from '@/lib/types'
import { TaskList } from './task-list'
import { QuickAddTask } from './quick-add-task'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Sun, Target, CheckCircle2, Clock, Sparkles } from 'lucide-react'
import { getEffortProgress } from '@/lib/effort'
import { cn } from '@/lib/utils'

interface TodayViewProps {
  tasks: Task[]
  categories: Category[]
  completedToday: number
  dailyGoal: number
}

export function TodayView({ tasks, categories, completedToday, dailyGoal }: TodayViewProps) {
  // Ajuste para os tipos em português
  const esforço = getEffortProgress(tasks)
  const progresso = esforço.totalEffort > 0 
    ? esforço.percentage 
    : Math.min((completedToday / dailyGoal) * 100, 100)

  const tarefasPendentes = tasks.filter(t => t.status !== 'concluida')
  const tarefasConcluidas = tasks.filter(t => t.status === 'concluida')

  const hoje = new Date()
  const dataFormatada = hoje.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header com Saudação */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-cyan/10 rounded-xl">
            <Sun className="w-6 h-6 text-brand-cyan" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic text-white">
            Hoje
          </h1>
        </div>
        <p className="text-muted-foreground font-medium text-sm pl-11">
          {dataFormatada}
        </p>
      </div>

      {/* Grid de Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Meta de Esforço Mental */}
        <Card className="bg-card/40 border-white/5 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Target className="w-20 h-20 rotate-12" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              Progresso de Carga
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">{esforço.completedEffort}</span>
                <span className="text-muted-foreground font-bold">/ {esforço.totalEffort || dailyGoal}</span>
              </div>
              <Progress 
                value={progresso} 
                className="h-2 bg-white/5" 
                // @ts-ignore - custom color logic
                indicatorClassName={cn(
                  progresso >= 100 ? "bg-emerald-500" : "bg-brand-cyan"
                )}
              />
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                Esforço cognitivo acumulado
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card Pendentes */}
        <Card className="bg-card/40 border-white/5 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 flex items-center gap-2">
              Foco Necessário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-black text-white">{tarefasPendentes.length}</div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">
                  Tarefas em aberto
                </p>
              </div>
              <Clock className="w-8 h-8 text-white/5" />
            </div>
          </CardContent>
        </Card>

        {/* Card Concluídas */}
        <Card className="bg-card/40 border-white/5 backdrop-blur-sm border-b-emerald-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 flex items-center gap-2">
              Maestria do Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-black text-emerald-400">{tarefasConcluidas.length}</div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">
                  Missões finalizadas
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-500/10" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Input de Adição Rápida com Glassmorphism */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-violet/20 to-brand-cyan/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
        <div className="relative">
          <QuickAddTask categories={categories} />
        </div>
      </div>

      {/* Listas de Tarefas */}
      <div className="space-y-10">
        {tarefasPendentes.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Sparkles className="w-4 h-4 text-brand-cyan" />
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white/70">
                Pipeline de Execução ({tarefasPendentes.length})
              </h2>
            </div>
            <TaskList tasks={tarefasPendentes} categories={categories} />
          </div>
        )}

        {tarefasConcluidas.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground px-1">
              Histórico de Hoje ({tarefasConcluidas.length})
            </h2>
            <div className="opacity-60 grayscale-[0.3] transition-all hover:grayscale-0 hover:opacity-100">
              <TaskList tasks={tarefasConcluidas} categories={categories} showCompleted />
            </div>
          </div>
        )}

        {/* Estado Vazio Refinado */}
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
            <div className="relative mb-4">
              <Sun className="w-16 h-16 text-white/5" />
              <Sparkles className="w-6 h-6 text-brand-cyan absolute -top-2 -right-2 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Quadro limpo para novas vitórias
            </h3>
            <p className="text-muted-foreground text-sm max-w-[280px] text-center mt-2">
              Sua lista de hoje está vazia. Que tal planejar seu próximo grande passo?
            </p>
          </div>
        )}
      </div>
    </div>
  )
}