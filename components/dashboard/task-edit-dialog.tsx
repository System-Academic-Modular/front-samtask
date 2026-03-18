'use client'

import React, { useState, useEffect, useTransition } from 'react'
import type {
  Tarefa,
  Categoria,
  PrioridadeTarefa,
  StatusTarefa,
  MembroEquipe,
  CargaMental,
} from '@/lib/types'
import { updateTask, createTask } from '@/lib/actions/tasks'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon, Loader2, Flag, Circle, Clock, Brain, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface TaskEditDialogProps {
  task?: Tarefa | null
  categories?: Categoria[]
  teamMembers?: MembroEquipe[]
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultParentId?: string | null
}

export function TaskEditDialog({ 
  task = null, 
  categories = [], 
  teamMembers = [], 
  open, 
  onOpenChange,
  defaultParentId = null
}: TaskEditDialogProps) {
  
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [status, setStatus] = useState<StatusTarefa>('pendente')
  const [prioridade, setPrioridade] = useState<PrioridadeTarefa>('media')
  const [categoriaId, setCategoriaId] = useState<string>('none')
  const [atribuidoA, setAtribuidoA] = useState<string>('none')
  const [dataVencimento, setDataVencimento] = useState<Date | undefined>()
  const [minutosEstimados, setMinutosEstimados] = useState<string>('')
  const [cargaMental, setCargaMental] = useState<CargaMental>(3)
  const [tarefaPaiId, setTarefaPaiId] = useState<string | null>(defaultParentId)

  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (open) {
      if (task) {
        setTitulo(task.titulo || '')
        setDescricao(task.descricao || '')
        setStatus(task.status || 'pendente')
        setPrioridade(task.prioridade || 'media')
        setCategoriaId(task.categoria_id || 'none')
        setAtribuidoA(task.atribuido_a || 'none')
        setDataVencimento(task.data_vencimento ? new Date(task.data_vencimento) : undefined)
        setMinutosEstimados(task.minutos_estimados?.toString() || '')
        setCargaMental((task.carga_mental || 3) as CargaMental)
        setTarefaPaiId(task.tarefa_pai_id || null)
      } else {
        setTitulo('')
        setDescricao('')
        setStatus('pendente')
        setPrioridade('media')
        setCategoriaId('none')
        setAtribuidoA('none')
        setDataVencimento(undefined)
        setMinutosEstimados('')
        setCargaMental(3)
        setTarefaPaiId(defaultParentId)
      }
    }
  }, [task, open, defaultParentId])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!titulo.trim()) {
      toast.error('O título da tarefa é obrigatório.')
      return
    }

    startTransition(async () => {
      // O Payload de segurança para a Base de Dados em PT
      const payload: Partial<Tarefa> = {
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        status: status,
        prioridade: prioridade,
        tarefa_pai_id: tarefaPaiId,
        categoria_id: categoriaId === 'none' ? null : categoriaId,
        atribuido_a: atribuidoA === 'none' ? null : atribuidoA,
        data_vencimento: dataVencimento?.toISOString() || null,
        minutos_estimados: minutosEstimados ? parseInt(minutosEstimados) : null,
        carga_mental: cargaMental,
      }

      try {
        let result
        if (task) {
          result = await updateTask(task.id, payload)
        } else {
          result = await createTask(payload)
        }

        if (result?.error) {
          toast.error('Erro ao salvar', { description: result.error })
          return
        }

        toast.success(task ? 'Tarefa atualizada!' : 'Tarefa criada com sucesso!')
        onOpenChange(false)
      } catch (error) {
        toast.error('Erro inesperado ao salvar tarefa.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-[#09090b]/95 backdrop-blur-xl border-white/10 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            {task ? 'Editar Tarefa' : 'Nova Tarefa'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Input 
                id="titulo" 
                value={titulo} 
                onChange={(e) => setTitulo(e.target.value)} 
                placeholder="O que precisa ser feito?" 
                className="bg-transparent border-none text-lg md:text-xl font-semibold px-0 focus-visible:ring-0 placeholder:text-muted-foreground/50 h-auto"
                required 
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Textarea 
                id="descricao" 
                value={descricao} 
                onChange={(e) => setDescricao(e.target.value)} 
                placeholder="Adicione detalhes, links ou notas importantes..." 
                className="bg-white/5 border-white/5 focus-visible:ring-brand-violet/50 resize-none"
                rows={3} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as StatusTarefa)}>
                <SelectTrigger className="bg-black/40 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#18181b] border-white/10 text-white">
                  <SelectItem value="pendente"><div className="flex items-center"><Circle className="w-3 h-3 mr-2 text-slate-400" /> A Fazer</div></SelectItem>
                  <SelectItem value="em_progresso"><div className="flex items-center"><Circle className="w-3 h-3 mr-2 text-brand-violet fill-brand-violet/20" /> Em Foco</div></SelectItem>
                  <SelectItem value="revisao"><div className="flex items-center"><RefreshCw className="w-3 h-3 mr-2 text-brand-emerald" /> Revisao</div></SelectItem>
                  <SelectItem value="concluida"><div className="flex items-center"><Circle className="w-3 h-3 mr-2 text-brand-emerald fill-brand-emerald" /> Concluída</div></SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Prioridade</Label>
              <Select value={prioridade} onValueChange={(v) => setPrioridade(v as PrioridadeTarefa)}>
                <SelectTrigger className="bg-black/40 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#18181b] border-white/10 text-white">
                  <SelectItem value="baixa"><div className="flex items-center"><Flag className="w-3 h-3 mr-2 text-blue-400" /> Baixa</div></SelectItem>
                  <SelectItem value="media"><div className="flex items-center"><Flag className="w-3 h-3 mr-2 text-brand-cyan" /> Média</div></SelectItem>
                  <SelectItem value="alta"><div className="flex items-center"><Flag className="w-3 h-3 mr-2 text-orange-400" /> Alta</div></SelectItem>
                  <SelectItem value="urgente"><div className="flex items-center"><Flag className="w-3 h-3 mr-2 text-red-500" /> Urgente</div></SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Categoria</Label>
              <Select value={categoriaId} onValueChange={setCategoriaId}>
                <SelectTrigger className="bg-black/40 border-white/10">
                  <SelectValue placeholder="Sem categoria" />
                </SelectTrigger>
                <SelectContent className="bg-[#18181b] border-white/10 text-white">
                  <SelectItem value="none" className="text-muted-foreground">Sem categoria</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.cor, boxShadow: `0 0 8px ${cat.cor}80` }} />
                        {cat.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Responsável</Label>
              <Select value={atribuidoA} onValueChange={setAtribuidoA}>
                <SelectTrigger className="bg-black/40 border-white/10">
                  <SelectValue placeholder="Atribuir a..." />
                </SelectTrigger>
                <SelectContent className="bg-[#18181b] border-white/10 text-white">
                  <SelectItem value="none" className="text-muted-foreground">Sem responsável</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.usuario_id} value={member.usuario_id}>
                      {member.perfil?.nome_completo || 'Membro da equipe'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/[0.02] p-4 rounded-xl border border-white/5">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Data de Entrega</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn('w-full justify-start text-left font-normal bg-black/40 border-white/10 hover:bg-white/10', !dataVencimento && 'text-muted-foreground')}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataVencimento ? format(dataVencimento, 'dd MMM yyyy', { locale: ptBR }) : 'Definir prazo'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-white/10 bg-[#18181b]" align="start">
                  <Calendar 
                    mode="single" 
                    selected={dataVencimento} 
                    onSelect={setDataVencimento} 
                    initialFocus 
                    locale={ptBR}
                    className="bg-[#18181b] text-white" 
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Estimativa (Min)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={minutosEstimados}
                  onChange={(e) => setMinutosEstimados(e.target.value)}
                  placeholder="Ex: 30"
                  min="1"
                  className="bg-black/40 border-white/10 pl-9 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Carga Cognitiva</Label>
              <Select
                value={String(cargaMental)}
                onValueChange={(value) => setCargaMental(Number(value) as CargaMental)}
              >
                <SelectTrigger className="bg-black/40 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#18181b] border-white/10 text-white">
                  <SelectItem value="1">
                    <div className="flex items-center">
                      <Brain className="w-3 h-3 mr-2 text-sky-300" /> 1 - Leve
                    </div>
                  </SelectItem>
                  <SelectItem value="2">2 - Baixa</SelectItem>
                  <SelectItem value="3">3 - Moderada</SelectItem>
                  <SelectItem value="4">4 - Alta</SelectItem>
                  <SelectItem value="5">5 - Intensa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="hover:bg-white/5 text-white">
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="bg-brand-violet hover:bg-brand-violet/90 text-white min-w-[120px] shadow-[0_0_15px_rgba(139,92,246,0.2)]">
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {task ? 'Guardar' : 'Criar Tarefa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
