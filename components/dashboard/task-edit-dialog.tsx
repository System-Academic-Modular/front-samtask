'use client'

import React, { useState, useEffect, useTransition } from 'react'
import type { Tarefa, Categoria, PrioridadeTarefa, StatusTarefa, MembroTime } from '@/lib/types'
import { updateTask, createTask } from '@/lib/actions/tasks'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon, Loader2, Flag, Circle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface TaskEditDialogProps {
  task?: Tarefa | null
  categories?: Categoria[]
  teamMembers?: MembroTime[]
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
  
  // Estados em português seguindo o novo padrão do BD
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [status, setStatus] = useState<StatusTarefa>('TODO')
  const [prioridade, setPrioridade] = useState<PrioridadeTarefa>('MEDIA')
  const [keyCategoria, setKeyCategoria] = useState<string>('none')
  const [keyResponsavel, setKeyResponsavel] = useState<string>('none')
  const [dataVencimento, setDataVencimento] = useState<Date | undefined>()
  const [minutosEstimados, setMinutosEstimados] = useState<string>('')
  const [keyTarefaPai, setKeyTarefaPai] = useState<string | null>(defaultParentId)

  const [isPending, startTransition] = useTransition()

  // Reseta ou popula o formulário quando abre
  useEffect(() => {
    if (open) {
      if (task) {
        setTitulo(task.TITULO || '')
        setDescricao(task.DESCRICAO || '')
        setStatus(task.STATUS || 'TODO')
        setPrioridade(task.PRIORIDADE || 'MEDIA')
        setKeyCategoria(task.KEY_CATEGORIA || 'none')
        setKeyResponsavel(task.KEY_RESPONSAVEL || 'none')
        setDataVencimento(task.DATA_VENCIMENTO ? new Date(task.DATA_VENCIMENTO) : undefined)
        setMinutosEstimados(task.MINUTOS_ESTIMADOS?.toString() || '')
        setKeyTarefaPai(task.KEY_TAREFA_PAI || null)
      } else {
        setTitulo('')
        setDescricao('')
        setStatus('TODO')
        setPrioridade('MEDIA')
        setKeyCategoria('none')
        setKeyResponsavel('none')
        setDataVencimento(undefined)
        setMinutosEstimados('')
        setKeyTarefaPai(defaultParentId)
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
      // Payload exatamente como o novo Back-end espera
      const payload = {
        TITULO: titulo.trim(),
        DESCRICAO: descricao.trim() || null,
        STATUS: status,
        PRIORIDADE: prioridade,
        KEY_TAREFA_PAI: keyTarefaPai,
        KEY_CATEGORIA: keyCategoria === 'none' ? null : keyCategoria,
        KEY_RESPONSAVEL: keyResponsavel === 'none' ? null : keyResponsavel,
        DATA_VENCIMENTO: dataVencimento?.toISOString() || null,
        MINUTOS_ESTIMADOS: minutosEstimados ? parseInt(minutosEstimados) : null,
      }

      try {
        let result
        if (task) {
          result = await updateTask(task.KEY_TAREFA, payload)
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
          
          {/* BLOCO 1: O Que? */}
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

          {/* BLOCO 2: Classificação e Organização */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as StatusTarefa)}>
                <SelectTrigger className="bg-black/40 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#18181b] border-white/10">
                  <SelectItem value="TODO"><div className="flex items-center"><Circle className="w-3 h-3 mr-2 text-slate-400" /> A Fazer</div></SelectItem>
                  <SelectItem value="EM_ANDAMENTO"><div className="flex items-center"><Circle className="w-3 h-3 mr-2 text-brand-violet fill-brand-violet/20" /> Em Foco</div></SelectItem>
                  <SelectItem value="CONCLUIDO"><div className="flex items-center"><Circle className="w-3 h-3 mr-2 text-brand-emerald fill-brand-emerald" /> Concluída</div></SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Prioridade</Label>
              <Select value={prioridade} onValueChange={(v) => setPrioridade(v as PrioridadeTarefa)}>
                <SelectTrigger className="bg-black/40 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#18181b] border-white/10">
                  <SelectItem value="BAIXA"><div className="flex items-center"><Flag className="w-3 h-3 mr-2 text-blue-400" /> Baixa</div></SelectItem>
                  <SelectItem value="MEDIA"><div className="flex items-center"><Flag className="w-3 h-3 mr-2 text-brand-cyan" /> Média</div></SelectItem>
                  <SelectItem value="ALTA"><div className="flex items-center"><Flag className="w-3 h-3 mr-2 text-orange-400" /> Alta</div></SelectItem>
                  <SelectItem value="URGENTE"><div className="flex items-center"><Flag className="w-3 h-3 mr-2 text-red-500" /> Urgente</div></SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Categoria</Label>
              <Select value={keyCategoria} onValueChange={setKeyCategoria}>
                <SelectTrigger className="bg-black/40 border-white/10">
                  <SelectValue placeholder="Sem categoria" />
                </SelectTrigger>
                <SelectContent className="bg-[#18181b] border-white/10">
                  <SelectItem value="none" className="text-muted-foreground">Sem categoria</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.KEY_CATEGORIA} value={cat.KEY_CATEGORIA}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.COR, boxShadow: `0 0 8px ${cat.COR}80` }} />
                        {cat.NOME}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {teamMembers.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Responsável</Label>
                <Select value={keyResponsavel} onValueChange={setKeyResponsavel}>
                  <SelectTrigger className="bg-black/40 border-white/10">
                    <SelectValue placeholder="Atribuir a..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#18181b] border-white/10">
                    <SelectItem value="none" className="text-muted-foreground">Sem responsável</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.KEY_LOGIN} value={member.KEY_LOGIN}>
                        {member.PERFIL?.NOME || 'Membro da equipe'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* BLOCO 3: Prazos e Tempo */}
          <div className="grid grid-cols-2 gap-4 bg-white/[0.02] p-4 rounded-xl border border-white/5">
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
                  className="bg-black/40 border-white/10 pl-9"
                />
              </div>
            </div>
          </div>

          {/* RODAPÉ E BOTÕES */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="hover:bg-white/5">
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