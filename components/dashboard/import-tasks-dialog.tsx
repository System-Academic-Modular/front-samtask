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
import { ArrowRight, Check, Trash2, Loader2, Sparkles, UploadCloud, BrainCircuit } from 'lucide-react'
import { toast } from 'sonner'
import { Categoria } from '@/lib/types'

interface ImportTasksDialogProps {
  categories: Categoria[]
  trigger?: React.ReactNode
}

type DraftTask = {
  id: string
  titulo: string
  data_vencimento: string
  categoria_id: string
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
      titulo: line.replace(/^[-*•]\s*/, '').trim(), // Remove bullets se houver
      data_vencimento: '', 
      categoria_id: 'none'
    }))

    setDraftTasks(drafts)
    setStep('review')
  }

  // 2. O envio (Simulado no front-end por enquanto, mas preparado para o Server Action)
  const handleConfirmImport = () => {
    startTransition(async () => {
      // TODO: Conectar com o createTask em massa no lib/actions/tasks.ts
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast.success(`${draftTasks.length} Missões Injetadas! 🚀`, {
          description: 'A rede neural processou as informações com sucesso.'
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
          <Button variant="outline" className="gap-2 border-dashed border-white/20 hover:border-brand-cyan/50 hover:bg-brand-cyan/10 hover:text-brand-cyan transition-all">
            <UploadCloud className="w-4 h-4" /> Importar Dados
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl bg-[#09090b]/95 backdrop-blur-2xl border-white/10 p-0 overflow-hidden gap-0 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        
        {/* Luz Neon do Topo */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-cyan to-transparent opacity-50" />

        {/* Header Estiloso */}
        <div className="p-6 border-b border-white/5 bg-gradient-to-b from-white/[0.05] to-transparent relative z-10">
            <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-widest text-white">
                <div className="p-2 bg-brand-cyan/10 rounded-xl border border-brand-cyan/20">
                    <Sparkles className="w-5 h-5 text-brand-cyan animate-pulse" />
                </div>
                Extrator Neural
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2 text-xs uppercase tracking-wider font-medium">
                {step === 'input' 
                ? 'Cole as anotações do briefing ou reunião abaixo. O sistema irá converter o texto em objetos de missão.' 
                : 'Verifique a integridade dos dados extraídos. Calibre as categorias e prazos antes da injeção.'}
            </DialogDescription>
            </DialogHeader>
        </div>

        <div className="p-6 relative z-10 bg-black/40">
            {step === 'input' ? (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <Textarea 
                  placeholder="[ Terminal de Entrada ]&#10;> Cole aqui os dados brutos...&#10;> Cada quebra de linha será processada como uma nova entidade...&#10;> Ex: Desenvolver arquitetura do banco de dados"
                  className="min-h-[250px] bg-[#0c0c0e]/80 border-white/10 font-mono text-sm leading-relaxed resize-none focus-visible:ring-brand-cyan/50 p-5 text-white/90 placeholder:text-muted-foreground/30 rounded-xl shadow-inner"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                />
                <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-cyan flex items-center gap-2">
                        <BrainCircuit className="w-3 h-3" /> Processamento Linear
                    </span>
                    <Button 
                        onClick={handleProcessText} 
                        disabled={!rawText.trim()} 
                        className="bg-brand-cyan hover:bg-brand-cyan/80 text-black font-black uppercase tracking-widest text-[10px] h-10 px-6 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all hover:scale-105"
                    >
                        INICIAR EXTRAÇÃO <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </div>
            ) : (
            <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-500">
                {/* Cabeçalho da Tabela Visual */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-white/[0.02] rounded-t-xl border border-b-0 border-white/5">
                    <div className="col-span-6">TÍTULO DA MISSÃO</div>
                    <div className="col-span-3">PRAZO LIMITE</div>
                    <div className="col-span-3">SETOR / CATEGORIA</div>
                </div>

                <ScrollArea className="h-[350px] pr-4 -mr-4">
                    <div className="space-y-2 pb-4">
                        {draftTasks.map((task, idx) => (
                            <div 
                                key={task.id} 
                                className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start md:items-center p-3 rounded-xl border border-white/5 bg-[#0c0c0e]/80 hover:bg-white/[0.04] hover:border-white/10 transition-all group animate-in slide-in-from-bottom-4 duration-500 fill-mode-both shadow-sm"
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                
                                {/* Título */}
                                <div className="col-span-1 md:col-span-6 flex items-center gap-3 w-full pl-1">
                                    <div className="hidden md:flex w-5 h-5 rounded-md bg-brand-cyan/10 border border-brand-cyan/20 items-center justify-center shrink-0">
                                        <span className="text-[8px] font-black text-brand-cyan">{idx + 1}</span>
                                    </div>
                                    <Input 
                                        value={task.titulo} 
                                        onChange={(e) => updateDraft(task.id, 'titulo', e.target.value)}
                                        className="bg-white/5 md:bg-transparent border-white/10 md:border-transparent focus:bg-black/60 focus:border-brand-cyan/50 h-9 px-3 text-sm w-full font-medium text-white transition-all rounded-lg"
                                    />
                                </div>

                                <div className="col-span-1 md:col-span-6 flex items-center gap-3 w-full">
                                    {/* Data */}
                                    <div className="flex-1 md:col-span-3">
                                        <Input 
                                            type="date" 
                                            value={task.data_vencimento}
                                            onChange={(e) => updateDraft(task.id, 'data_vencimento', e.target.value)}
                                            className="h-9 bg-white/5 border-white/10 text-xs w-full text-white/70 focus:border-brand-cyan/50 focus:text-white transition-colors rounded-lg"
                                        />
                                    </div>
                                    
                                    {/* Categoria + Delete */}
                                    <div className="flex-1 md:col-span-3 flex items-center gap-2">
                                        <Select 
                                            value={task.categoria_id} 
                                            onValueChange={(val) => updateDraft(task.id, 'categoria_id', val)}
                                        >
                                            <SelectTrigger className="h-9 bg-white/5 border-white/10 text-[10px] font-bold uppercase tracking-wider w-full rounded-lg">
                                                <SelectValue placeholder="SETOR..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#18181b] border-white/10 text-white">
                                                <SelectItem value="none" className="text-muted-foreground">GERAL</SelectItem>
                                                {categories.map(cat => (
                                                    <SelectItem key={cat.id} value={cat.id}>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.cor, boxShadow: `0 0 5px ${cat.cor}80` }} />
                                                            {cat.nome}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="h-9 w-9 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 md:opacity-20 md:group-hover:opacity-100 transition-all shrink-0 rounded-lg" 
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
                
                <DialogFooter className="flex flex-col-reverse sm:flex-row justify-between items-center pt-4 border-t border-white/5 gap-4 sm:gap-0">
                    <Button variant="ghost" onClick={() => setStep('input')} disabled={isPending} className="w-full sm:w-auto text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white">
                        RECALIBRAR TEXTO
                    </Button>
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-cyan bg-brand-cyan/10 px-2 py-1 rounded-md border border-brand-cyan/20">
                            {draftTasks.length} {draftTasks.length === 1 ? 'OBJETO' : 'OBJETOS'}
                        </span>
                        <Button 
                          onClick={handleConfirmImport} 
                          disabled={isPending || draftTasks.length === 0} 
                          className="bg-brand-violet hover:bg-brand-violet/90 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] font-black uppercase tracking-widest text-[10px] h-10 px-6 rounded-xl transition-all hover:scale-105"
                        >
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                            {isPending ? 'INJETANDO...' : 'INJETAR NO RADAR'}
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