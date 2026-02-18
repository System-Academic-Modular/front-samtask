'use client'

import React, { useState, useEffect, useTransition } from 'react'
import type { Task, Category, TaskPriority, TaskStatus, TeamMember } from '@/lib/types'
import { updateTask, createTask } from '@/lib/actions/tasks' // Certifique-se de ter createTask
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { CalendarIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

// Interface flexível para aceitar nulos (Modo Criação)
interface TaskEditDialogProps {
  task?: Task | null
  categories?: Category[]
  teamMembers?: TeamMember[]
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
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [categoryId, setCategoryId] = useState<string>('none')
  const [assigneeId, setAssigneeId] = useState<string>('none')
  const [dueDate, setDueDate] = useState<Date | undefined>()
  const [estimatedMinutes, setEstimatedMinutes] = useState<string>('')
  const [isPending, startTransition] = useTransition()
  const [parentId, setParentId] = useState<string | null>(defaultParentId)

  // Reseta ou popula o formulário quando abre
  useEffect(() => {
    if (open) {
      if (task) {
        // Modo Edição
        setTitle(task.title)
        setDescription(task.description || '')
        setStatus(task.status)
        setPriority(task.priority)
        setCategoryId(task.category_id || 'none')
        setAssigneeId(task.assignee_id || 'none')
        setDueDate(task.due_date ? new Date(task.due_date) : undefined)
        setEstimatedMinutes(task.estimated_minutes?.toString() || '')
        setParentId(task.parent_id || null)
      } else {
        // Modo Criação (Limpar campos)
        setTitle('')
        setDescription('')
        setStatus('todo')
        setPriority('medium')
        setCategoryId('none')
        setAssigneeId('none')
        setDueDate(undefined)
        setEstimatedMinutes('')
        setParentId(defaultParentId)
      }
    }
  }, [task, open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!title.trim()) return

    startTransition(async () => {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        parent_id: parentId,
        category_id: categoryId === 'none' ? null : categoryId,
        assignee_id: assigneeId === 'none' ? null : assigneeId,
        due_date: dueDate?.toISOString() || null,
        estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
      }

      try {
        let result
        
        if (task) {
          // Atualizar existente
          result = await updateTask(task.id, payload)
        } else {
          // Criar nova (Você precisa garantir que essa função exista em @/lib/actions/tasks)
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{task ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="O que precisa ser feito?" 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea 
              id="description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Detalhes adicionais..." 
              rows={3} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">A Fazer</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="done">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sem categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem categoria</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estimativa (min)</Label>
              <Input
                type="number"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                placeholder="Ex: 30"
                min="1"
              />
            </div>
          </div>

          {teamMembers.length > 0 && (
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sem responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem responsável</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.profile?.full_name || 'Membro da equipe'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Data de Entrega</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn('w-full justify-start text-left font-normal', !dueDate && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, 'PPP', { locale: ptBR }) : 'Selecionar data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar 
                    mode="single" 
                    selected={dueDate} 
                    onSelect={setDueDate} 
                    initialFocus 
                    locale={ptBR} 
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="bg-brand-violet hover:bg-brand-violet/90">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {task ? 'Salvar Alterações' : 'Criar Tarefa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}