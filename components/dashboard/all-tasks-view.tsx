'use client'

import { useState } from 'react'
import type { Tarefa, Categoria, StatusTarefa, PrioridadeTarefa } from '@/lib/types'
import { TaskList } from './task-list'
import { QuickAddTask } from './quick-add-task'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Search, ListTodo, X, Circle, RefreshCw, Flag } from 'lucide-react'

interface AllTasksViewProps {
  tasks: Tarefa[]
  categories: Categoria[]
}

export function AllTasksView({ tasks, categories }: AllTasksViewProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const filteredTasks = tasks.filter((task) => {
    if (search && !task.titulo.toLowerCase().includes(search.toLowerCase())) {
      return false
    }
    if (statusFilter !== 'all' && task.status !== statusFilter) {
      return false
    }
    if (priorityFilter !== 'all' && task.prioridade !== priorityFilter) {
      return false
    }
    if (categoryFilter !== 'all' && task.categoria_id !== categoryFilter) {
      return false
    }
    return true
  })

  const hasFilters = search || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all'

  function clearFilters() {
    setSearch('')
    setStatusFilter('all')
    setPriorityFilter('all')
    setCategoryFilter('all')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-widest flex items-center gap-3">
            <ListTodo className="w-6 h-6 text-brand-violet" />
            Todas as Missões
          </h1>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground mt-1">
            {tasks.length} {tasks.length === 1 ? 'registro encontrado' : 'registros encontrados'} no sistema
          </p>
        </div>
      </div>

      {/* Filters HUD */}
      <Card className="bg-black/40 border-white/10 backdrop-blur-md">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título ou descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-black/40 border-white/10 text-white focus-visible:ring-brand-violet/50 h-10"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-black/40 border-white/10 h-10 text-[11px] uppercase tracking-wider font-bold">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-[#18181b] border-white/10 text-white">
                  <SelectItem value="all">TODOS OS STATUS</SelectItem>
                  <SelectItem value="pendente"><div className="flex items-center"><Circle className="w-3 h-3 mr-2 text-slate-400" /> A FAZER</div></SelectItem>
                  <SelectItem value="em_progresso"><div className="flex items-center"><Circle className="w-3 h-3 mr-2 text-brand-violet fill-brand-violet/20" /> EM FOCO</div></SelectItem>
                  <SelectItem value="revisao"><div className="flex items-center"><RefreshCw className="w-3 h-3 mr-2 text-brand-emerald" /> REVISÃO</div></SelectItem>
                  <SelectItem value="concluida"><div className="flex items-center"><Circle className="w-3 h-3 mr-2 text-brand-emerald fill-brand-emerald" /> CONCLUÍDA</div></SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[140px] bg-black/40 border-white/10 h-10 text-[11px] uppercase tracking-wider font-bold">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent className="bg-[#18181b] border-white/10 text-white">
                  <SelectItem value="all">QUALQUER UMA</SelectItem>
                  <SelectItem value="baixa"><div className="flex items-center"><Flag className="w-3 h-3 mr-2 text-blue-400" /> BAIXA</div></SelectItem>
                  <SelectItem value="media"><div className="flex items-center"><Flag className="w-3 h-3 mr-2 text-brand-cyan" /> MÉDIA</div></SelectItem>
                  <SelectItem value="alta"><div className="flex items-center"><Flag className="w-3 h-3 mr-2 text-orange-400" /> ALTA</div></SelectItem>
                  <SelectItem value="urgente"><div className="flex items-center"><Flag className="w-3 h-3 mr-2 text-red-500" /> URGENTE</div></SelectItem>
                </SelectContent>
              </Select>

              {categories.length > 0 && (
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[150px] bg-black/40 border-white/10 h-10 text-[11px] uppercase tracking-wider font-bold">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#18181b] border-white/10 text-white">
                    <SelectItem value="all">TODAS CATEGORIAS</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: cat.cor, boxShadow: `0 0 8px ${cat.cor}80` }}
                          />
                          {cat.nome}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10 text-[10px] uppercase tracking-widest text-red-400 hover:text-red-300 hover:bg-red-400/10">
                  <X className="h-4 w-4 mr-1" />
                  LIMPAR FILTROS
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Add (Precisaremos traduzir este componente também se ele passar nomes em inglês) */}
      <QuickAddTask categories={categories} />

      {/* Task List */}
      {filteredTasks.length > 0 ? (
        <TaskList tasks={filteredTasks} categories={categories} />
      ) : (
        <Card className="border-dashed border-white/10 bg-black/20">
          <CardContent className="py-16 text-center flex flex-col items-center">
            <ListTodo className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-black uppercase tracking-tighter text-white/90 mb-2">
              {hasFilters ? 'Radar sem ocorrências' : 'Sessão Limpa'}
            </h3>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground max-w-sm">
              {hasFilters 
                ? 'Nenhuma missão corresponde aos filtros de busca atuais.' 
                : 'Você não possui tarefas registradas. Adicione um novo objetivo acima.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}