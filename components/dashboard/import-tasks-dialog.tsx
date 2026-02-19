'use client'

import { useState, useTransition } from 'react'
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowRight, Check, Trash2, Loader2, Sparkles, UploadCloud } from 'lucide-react'
import { toast } from 'sonner'
import { Category } from '@/lib/types'

interface ImportTasksDialogProps {
  categories: Category[]
  trigger?: React.ReactNode
}

type DraftTask = {
  id: string
  title: string
  dueDate: string
  categoryId: string
}

export function ImportTasksDialog({ categories, trigger }: ImportTasksDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'input' | 'review'>('input')
  const [rawText, setRawText] = useState('')
  const [draftTasks, setDraftTasks] = useState<DraftTask[]>([])
  const [isPending, startTransition] = useTransition()

  // 1. A Mágica do Front: Transformar texto bruto em objetos
  const handleProcessText = () => {
    if (!rawText.trim()) return

    // Quebra o texto por linhas (ignora linhas vazias)
    const lines = rawText.split(/\n+/).filter(line => line.trim().length > 0)
    
    const drafts: DraftTask[] = lines.map((line, index) => ({
      id: `draft-${index}-${Date.now()}`,
      title: line.replace(/^[-*•]\s*/, '').trim(), // Remove bullets se houver
      dueDate: '', 
      categoryId: 'none'
    }))

    setDraftTasks(drafts)
    setStep('review')
  }

  // 2. O envio (Simulado no front-end por enquanto)
  const handleConfirmImport = () => {
    startTransition(async () => {
      // Como estamos focados no Front-end agora, vamos simular o delay do Back-end
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast.success(`${draftTasks.length} tarefas processadas com sucesso! 🚀`, {
          description: 'O Back-end salvaria isso no banco agora.'
      })
      setOpen(false)
      
      // Reset do estado após fechar
      setTimeout(() => {
          setStep('input')
          setRawText('')
          setDraftTasks([])
      }, 300)
    })
  }

  const removeDraft = (id: string) => {
    setDraftTasks(prev => prev.filter(t => t.id !== id))
  }

  const updateDraft = (id: string, field: keyof DraftTask, value: string) => {
    setDraftTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2 border-dashed border-white/20">
            <UploadCloud className="w-4 h-4" /> Importar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl bg-[#121214] border-white/10 p-0 overflow-hidden gap-0">
        
        {/* Header Estiloso */}
        <div className="p-6 border-b border-white/5 bg-white/[0.02]">
            <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-cyan" />
                Importação Inteligente
            </DialogTitle>
            <DialogDescription>
                {step === 'input' 
                ? 'Cole as anotações da reunião abaixo. Cada linha vai virar uma tarefa.' 
                : 'Revise os detalhes, ajuste datas e categorias antes de confirmar.'}
            </DialogDescription>
            </DialogHeader>
        </div>

        <div className="p-6">
            {step === 'input' ? (
            <div className="space-y-4">
                <Textarea 
                  placeholder="Exemplo:&#10;Criar wireframes da tela inicial&#10;Validar cores com o cliente&#10;Comprar café para o escritório"
                  className="min-h-[250px] bg-black/40 border-white/10 font-mono text-sm leading-relaxed resize-none focus-visible:ring-brand-cyan/50 p-4"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                />
                <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Dica: Quebras de linha separam as tarefas.</span>
                    <Button onClick={handleProcessText} disabled={!rawText.trim()} className="bg-brand-cyan text-black hover:bg-brand-cyan/90 font-semibold shadow-neon-cyan">
                        Processar Lista <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </div>
            ) : (
            <div className="space-y-4">
                {/* Cabeçalho da Tabela Visual */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <div className="col-span-6">Tarefa</div>
                    <div className="col-span-3">Data Prevista</div>
                    <div className="col-span-3">Categoria</div>
                </div>

                <ScrollArea className="h-[300px] pr-4 -mr-4">
                    <div className="space-y-3 md:space-y-2">
                        {draftTasks.map((task, idx) => (
                            <div 
                                key={task.id} 
                                className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start md:items-center p-3 md:p-2 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors group animate-in slide-in-from-bottom-2 duration-300"
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                
                                {/* Título */}
                                <div className="col-span-1 md:col-span-6 flex items-center gap-2 w-full">
                                    <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-brand-cyan shrink-0" />
                                    <Input 
                                        value={task.title} 
                                        onChange={(e) => updateDraft(task.id, 'title', e.target.value)}
                                        className="bg-black/20 md:bg-transparent border-white/10 md:border-transparent focus:bg-black/40 focus:border-white/20 h-9 md:h-8 px-3 md:px-2 text-sm w-full"
                                    />
                                </div>

                                <div className="col-span-1 md:col-span-6 flex items-center gap-2 w-full">
                                    {/* Data */}
                                    <div className="flex-1 md:col-span-3">
                                        <Input 
                                            type="date" 
                                            value={task.dueDate}
                                            onChange={(e) => updateDraft(task.id, 'dueDate', e.target.value)}
                                            className="h-9 md:h-8 bg-black/20 border-white/10 text-xs w-full text-muted-foreground"
                                        />
                                    </div>
                                    
                                    {/* Categoria + Delete */}
                                    <div className="flex-1 md:col-span-3 flex items-center gap-2">
                                        <Select 
                                            value={task.categoryId} 
                                            onValueChange={(val) => updateDraft(task.id, 'categoryId', val)}
                                        >
                                            <SelectTrigger className="h-9 md:h-8 bg-black/20 border-white/10 text-xs w-full">
                                                <SelectValue placeholder="Cat..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#1c1c1f] border-white/10">
                                                <SelectItem value="none">Geral</SelectItem>
                                                {categories.map(cat => (
                                                    <SelectItem key={cat.id} value={cat.id}>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                                            {cat.name}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="h-9 w-9 md:h-8 md:w-8 text-muted-foreground hover:text-red-400 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0 bg-black/20 md:bg-transparent border border-white/5 md:border-transparent" 
                                            onClick={() => removeDraft(task.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                
                <DialogFooter className="flex flex-col-reverse sm:flex-row justify-between items-center pt-4 border-t border-white/5 gap-4 sm:gap-0 mt-4">
                    <Button variant="ghost" onClick={() => setStep('input')} disabled={isPending} className="w-full sm:w-auto">
                        Voltar e Editar
                    </Button>
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <span className="text-xs text-muted-foreground font-medium">
                            {draftTasks.length} itens prontos
                        </span>
                        <Button onClick={handleConfirmImport} disabled={isPending || draftTasks.length === 0} className="bg-brand-violet hover:bg-brand-violet/90 text-white shadow-neon-violet">
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                            {isPending ? 'Enviando...' : 'Confirmar Importação'}
                        </Button>
                    </div>
                </DialogFooter>
            </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  )
}