'use client'

import React, { useState, useTransition } from 'react'
import type { Categoria, CargaMental, PrioridadeTarefa, MembroEquipe } from '@/lib/types'
import { createTask } from '@/lib/actions/tasks'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Plus, CalendarIcon, Flag, Loader2, UserRound, Brain } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface QuickAddTaskProps {
  categories: Categoria[]
  parentId?: string
  selectedTeamId?: string | null
  teamMembers?: MembroEquipe[]
}

export function QuickAddTask({ categories, parentId, selectedTeamId, teamMembers = [] }: QuickAddTaskProps) {
  const [titulo, setTitulo] = useState('')
  const [prioridade, setPrioridade] = useState<PrioridadeTarefa>('media')
  const [categoriaId, setCategoriaId] = useState<string>('none')
  const [atribuidoA, setAtribuidoA] = useState<string>('none')
  const [cargaMental, setCargaMental] = useState<CargaMental>(3)
  const [dataVencimento, setDataVencimento] = useState<Date | undefined>()
  const [showOptions, setShowOptions] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!titulo.trim()) return

    startTransition(async () => {
      const result = await createTask({
        titulo: titulo.trim(),
        prioridade,
        categoria_id: categoriaId === 'none' ? undefined : categoriaId,
        data_vencimento: dataVencimento?.toISOString(),
        tarefa_pai_id: parentId,
        equipe_id: selectedTeamId || undefined,
        atribuido_a: atribuidoA === 'none' ? undefined : atribuidoA,
        carga_mental: cargaMental,
      })

      if (result.error) {
        toast.error('Erro ao adicionar', {
          description: result.error,
        })
        return
      }

      toast.success('Missão injetada no radar!')
      setTitulo('')
      setPrioridade('media')
      setCategoriaId('none')
      setAtribuidoA('none')
      setCargaMental(3)
      setDataVencimento(undefined)
      setShowOptions(false)
    })
  }

  return (
    <Card className="bg-black/40 border-white/10 backdrop-blur-md overflow-hidden transition-all duration-300 focus-within:border-brand-violet/50 focus-within:shadow-[0_0_20px_rgba(139,92,246,0.1)]">
      <CardContent className="p-3">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <Input
                placeholder="[ Terminal ] Adicione uma nova missão ao sistema..."
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                onFocus={() => setShowOptions(true)}
                disabled={isPending}
                className="bg-transparent border-none text-white focus-visible:ring-0 px-2 text-base placeholder:text-muted-foreground/50 placeholder:font-mono"
              />
            </div>
            <Button 
              type="submit" 
              size="sm" 
              disabled={!titulo.trim() || isPending}
              className="bg-brand-violet hover:bg-brand-violet/80 text-white font-black tracking-widest uppercase text-[10px] h-9 px-4 rounded-lg shadow-[0_0_10px_rgba(139,92,246,0.2)] transition-all hover:scale-105"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
              <span className="hidden sm:inline">INJETAR</span>
            </Button>
          </div>

          {showOptions && (
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
              <Select value={prioridade} onValueChange={(v) => setPrioridade(v as PrioridadeTarefa)}>
                <SelectTrigger className="w-[120px] h-8 bg-white/5 border-white/10 text-[10px] uppercase font-bold tracking-wider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#18181b] border-white/10 text-white">
                  <SelectItem value="baixa"><div className="flex items-center"><Flag className="w-3 h-3 mr-2 text-blue-400" /> BAIXA</div></SelectItem>
                  <SelectItem value="media"><div className="flex items-center"><Flag className="w-3 h-3 mr-2 text-brand-cyan" /> MÉDIA</div></SelectItem>
                  <SelectItem value="alta"><div className="flex items-center"><Flag className="w-3 h-3 mr-2 text-orange-400" /> ALTA</div></SelectItem>
                  <SelectItem value="urgente"><div className="flex items-center"><Flag className="w-3 h-3 mr-2 text-red-500 animate-pulse" /> URGENTE</div></SelectItem>
                </SelectContent>
              </Select>

              {categories.length > 0 && (
                <Select value={categoriaId} onValueChange={setCategoriaId}>
                  <SelectTrigger className="w-[140px] h-8 bg-white/5 border-white/10 text-[10px] uppercase font-bold tracking-wider">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#18181b] border-white/10 text-white">
                    <SelectItem value="none">SEM CATEGORIA</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.cor, boxShadow: `0 0 5px ${cat.cor}80` }} />
                          {cat.nome}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {!!selectedTeamId && (
                <Select value={atribuidoA} onValueChange={setAtribuidoA}>
                  <SelectTrigger className="w-[140px] h-8 bg-white/5 border-white/10 text-[10px] uppercase font-bold tracking-wider">
                    <UserRound className="w-3 h-3 mr-1 text-muted-foreground" />
                    <SelectValue placeholder="Responsável" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#18181b] border-white/10 text-white">
                    <SelectItem value="none">SEM RESPONSÁVEL</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.usuario_id} value={member.usuario_id}>
                        {member.perfil?.nome_completo || 'Membro da equipe'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn('h-8 bg-white/5 border-white/10 text-[10px] uppercase font-bold tracking-wider', !dataVencimento && 'text-muted-foreground hover:text-white')}
                  >
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {dataVencimento ? format(dataVencimento, 'dd MMM yyyy', { locale: ptBR }) : 'PRAZO'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#18181b] border-white/10" align="start">
                  <Calendar
                    mode="single"
                    selected={dataVencimento}
                    onSelect={setDataVencimento}
                    initialFocus
                    locale={ptBR}
                    className="text-white"
                  />
                </PopoverContent>
              </Popover>

              <Select
                value={String(cargaMental)}
                onValueChange={(value) => setCargaMental(Number(value) as CargaMental)}
              >
                <SelectTrigger className="w-[140px] h-8 bg-white/5 border-white/10 text-[10px] uppercase font-bold tracking-wider">
                  <Brain className="w-3 h-3 mr-2 text-sky-400" />
                  <SelectValue placeholder="Carga mental" />
                </SelectTrigger>
                <SelectContent className="bg-[#18181b] border-white/10 text-white">
                  <SelectItem value="1">1 - LEVE</SelectItem>
                  <SelectItem value="2">2 - BAIXA</SelectItem>
                  <SelectItem value="3">3 - MODERADA</SelectItem>
                  <SelectItem value="4">4 - ALTA</SelectItem>
                  <SelectItem value="5">5 - INTENSA</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}