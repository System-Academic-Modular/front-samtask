'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { createTeam, joinTeam, type TeamActionState } from '@/lib/actions/teams'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Hash, Loader2, LogIn, Plus, Rocket, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner' // Importante para o feedback

type TeamsDialogProps = {
  trigger: React.ReactNode
}

type SubmitButtonProps = Omit<React.ComponentProps<typeof Button>, 'type'> & {
  icon?: React.ReactNode
}

const initialState: TeamActionState = { status: 'idle' }

function SubmitButton({
  className,
  icon,
  children,
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      className={cn("font-bold uppercase tracking-tighter rounded-xl h-11", className)}
      disabled={pending || disabled}
      {...props}
    >
      <span className="mr-2 inline-flex h-4 w-4 items-center justify-center">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      </span>
      {children}
    </Button>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mt-1 ml-1">{message}</p>
}

function FormError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs font-medium text-red-200 animate-in fade-in zoom-in-95">
      {message}
    </div>
  )
}

function TeamsDialogForms({ onSuccess }: { onSuccess: () => void }) {
  const router = useRouter()
  const [tab, setTab] = useState<'create' | 'join'>('create')
  const [createKey, setCreateKey] = useState(0)
  const [joinKey, setJoinKey] = useState(0)

  const [createState, createAction, isCreating] = useActionState(createTeam, initialState)
  const [joinState, joinAction, isJoining] = useActionState(joinTeam, initialState)
  const isBusy = isCreating || isJoining

  useEffect(() => {
    if (createState.status === 'success') {
      toast.success("Esquadrão fundado com sucesso! Bem-vindo, Comandante.")
      setCreateKey((k) => k + 1)
      onSuccess()
      router.refresh()
    }
  }, [createState.status, onSuccess, router])

  useEffect(() => {
    if (joinState.status === 'success') {
      toast.success("Sincronização completa. Você entrou no esquadrão.")
      setJoinKey((k) => k + 1)
      onSuccess()
      router.refresh()
    }
  }, [joinState.status, onSuccess, router])

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Centro de Comando</DialogTitle>
        <DialogDescription className="text-muted-foreground font-medium">
          Expanda sua rede ou conecte-se a uma unidade de elite.
        </DialogDescription>
      </DialogHeader>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as 'create' | 'join')}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 bg-white/5 p-1 rounded-xl mb-4 border border-white/5">
          <TabsTrigger value="create" disabled={isBusy} className="rounded-lg font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-brand-violet data-[state=active]:text-white transition-all">
            <Plus className="w-3 h-3 mr-2" /> Criar
          </TabsTrigger>
          <TabsTrigger value="join" disabled={isBusy} className="rounded-lg font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-brand-cyan data-[state=active]:text-black transition-all">
            <LogIn className="w-3 h-3 mr-2" /> Ingressar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4 focus-visible:outline-none">
          <form action={createAction} key={createKey} className="space-y-4">
            {createState.status === 'error' && <FormError message={createState.message} />}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-[10px] uppercase tracking-widest font-bold opacity-70 ml-1">Designação da Unidade</Label>
              <Input
                id="name"
                name="name"
                placeholder="Ex: ALPHA-STRIKE"
                className={cn(
                  'bg-black/40 border-white/10 h-12 rounded-xl focus:border-brand-violet/50 transition-all font-bold',
                  createState.fieldErrors?.name && 'border-red-500/50 focus-visible:ring-red-500/20'
                )}
                required
              />
              <FieldError message={createState.fieldErrors?.name} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-[10px] uppercase tracking-widest font-bold opacity-70 ml-1">Briefing da Missão</Label>
              <Input
                id="description"
                name="description"
                placeholder="Objetivos e metas da equipe..."
                className="bg-black/40 border-white/10 h-12 rounded-xl focus:border-brand-violet/50 font-medium"
              />
            </div>
            <SubmitButton className="w-full bg-brand-violet hover:bg-brand-violet/90 text-white shadow-lg shadow-brand-violet/20" icon={<Rocket className="h-4 w-4" />}>
              Fundar Esquadrão
            </SubmitButton>
          </form>
        </TabsContent>

        <TabsContent value="join" className="space-y-4 focus-visible:outline-none">
          <form action={joinAction} key={joinKey} className="space-y-4">
            {joinState.status === 'error' && <FormError message={joinState.message} />}
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-[10px] uppercase tracking-widest font-bold opacity-70 ml-1">Token de Acesso</Label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-cyan" />
                <Input
                  id="code"
                  name="code"
                  placeholder="X82K91"
                  className={cn(
                    'pl-11 bg-black/40 border-white/10 h-12 rounded-xl font-mono uppercase tracking-[0.4em] font-black focus:border-brand-cyan/50 focus:ring-brand-cyan/20',
                    joinState.fieldErrors?.code && 'border-red-500/50'
                  )}
                  required
                />
              </div>
              <FieldError message={joinState.fieldErrors?.code} />
            </div>
            <SubmitButton variant="secondary" className="w-full bg-brand-cyan hover:bg-brand-cyan/90 text-black shadow-lg shadow-brand-cyan/20" icon={<Users className="h-4 w-4" />}>
              Sincronizar Acesso
            </SubmitButton>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export function TeamsDialog({ trigger }: TeamsDialogProps) {
  const [open, setOpen] = useState(false)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    if (!open) {
      setTimeout(() => setNonce((v) => v + 1), 300) // Pequeno delay para esperar a animação de fecho
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-[#09090b]/95 backdrop-blur-2xl border-white/10 sm:max-w-[400px] rounded-[32px] shadow-2xl overflow-hidden p-8">
        {/* Glow de fundo no modal */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-violet/10 blur-[80px] pointer-events-none" />
        <TeamsDialogForms key={nonce} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}