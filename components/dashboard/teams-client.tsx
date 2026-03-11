'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TeamsDialog } from '@/components/dashboard/teams-dialog'
import { useTaskContext } from '@/components/dashboard/task-context' // Importando nosso contexto!
import { Users, Plus, Hash, Crown, Shield, User, Key, ArrowRight, Copy, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Team } from '@/lib/types' 

export type EquipaComPermissao = Team & { role: 'owner' | 'admin' | 'member' }

const roleConfig = {
  owner: { label: 'Líder / Criador', className: 'border-amber-500/50 text-amber-500 bg-amber-500/10', Icon: Crown },
  admin: { label: 'Administrador', className: 'border-cyan-500/50 text-cyan-500 bg-cyan-500/10', Icon: Shield },
  member: { label: 'Membro', className: 'border-white/20 text-white/80 bg-white/5', Icon: User },
}

interface TeamsClientProps {
  minhasEquipes: EquipaComPermissao[]
  stats: { total: number; liderando: number; participando: number }
}

export function TeamsClient({ minhasEquipes, stats }: TeamsClientProps) {
  const router = useRouter()
  const { setValue, isPending: contextPending } = useTaskContext()
  const [inviteCode, setInviteCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [loadingTeamId, setLoadingTeamId] = useState<string | null>(null)

  const handleJoinTeam = () => {
    setIsJoining(true)
    setTimeout(() => {
      setIsJoining(false)
      toast.info(`Encriptação em curso: código ${inviteCode} enviado para validação.`)
      setInviteCode('')
    }, 1500)
  }

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    toast.success('Código de convite copiado!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleAccessTeam = (teamId: string) => {
    setLoadingTeamId(teamId)
    // Muda o contexto global do app para este time
    setValue(`team:${teamId}`)
    router.push('/dashboard')
    toast.success("Sincronizando com o QG da Equipe...")
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-brand-violet to-brand-cyan bg-clip-text text-transparent inline-block uppercase">
            Esquadrões
          </h1>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest opacity-70">
            Comunicação e coordenação tática.
          </p>
        </div>
        <TeamsDialog
          trigger={
            <Button className="bg-brand-violet hover:bg-brand-violet/90 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] rounded-xl font-bold transition-all hover:scale-105">
              <Plus className="w-4 h-4 mr-2" /> Nova Equipe
            </Button>
          }
        />
      </div>

      {/* Portal de Acesso (Hero Section) */}
      <div className="relative group rounded-[32px] p-[1px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-cyan via-brand-violet to-brand-cyan opacity-20 blur-2xl group-hover:opacity-40 transition-opacity duration-500" />
        <div className="relative bg-[#09090b]/80 backdrop-blur-3xl border border-white/10 rounded-[31px] p-6 md:p-10 flex flex-col lg:flex-row items-center justify-between gap-8 z-10">
          <div className="flex items-center gap-6 w-full lg:w-auto">
            <div className="w-16 h-16 rounded-2xl bg-brand-cyan/10 flex items-center justify-center border border-brand-cyan/20 shrink-0 shadow-[inset_0_0_20px_rgba(34,211,238,0.1)]">
              <Key className="w-8 h-8 text-brand-cyan animate-pulse" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight leading-none mb-2">Portal de Acesso</h3>
              <p className="text-sm text-brand-cyan/60 font-medium">Insira o token de 6 dígitos para descriptografar o acesso.</p>
            </div>
          </div>
          <div className="flex w-full lg:w-auto items-center gap-4">
            <Input 
              placeholder="TOKEN" 
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-full lg:w-56 h-14 bg-black/40 border-white/10 text-brand-cyan uppercase tracking-[0.5em] text-center font-mono font-black text-xl focus:border-brand-cyan/50 focus:ring-brand-cyan/20 rounded-2xl"
            />
            <Button 
              onClick={handleJoinTeam} 
              disabled={inviteCode.length < 6 || isJoining} 
              className="h-14 px-8 bg-brand-cyan hover:bg-brand-cyan/90 text-black font-black uppercase tracking-tighter rounded-2xl transition-all shadow-lg active:scale-95"
            >
              {isJoining ? <Loader2 className="animate-spin" /> : 'Sincronizar'}
            </Button>
          </div>
        </div>
      </div>

      {/* Grid de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Total de Operações', val: stats.total, color: 'text-white' },
          { label: 'Liderança Ativa', val: stats.liderando, color: 'text-amber-500' },
          { label: 'Agente em Campo', val: stats.participando, color: 'text-cyan-500' }
        ].map((s, i) => (
          <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-50 mb-1">{s.label}</p>
            <p className={cn("text-3xl font-black", s.color)}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Lista de Esquadrões */}
      {minhasEquipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {minhasEquipes.map((equipa) => {
            const roleMeta = roleConfig[equipa.role] || roleConfig.member
            const isCopied = copiedId === equipa.id
            const isLoading = loadingTeamId === equipa.id || (contextPending && loadingTeamId === equipa.id)

            return (
              <Card key={equipa.id} className="bg-[#0c0c0e]/50 border-white/5 backdrop-blur-md hover:border-brand-violet/40 transition-all group relative flex flex-col rounded-[24px] shadow-2xl">
                <CardHeader className="space-y-4">
                  <div className="flex justify-between items-start gap-3">
                    <CardTitle className="text-xl text-white font-black tracking-tight group-hover:text-brand-violet transition-colors">
                      {equipa.nome}
                    </CardTitle>
                    <Badge variant="outline" className={cn("shrink-0 uppercase tracking-tighter text-[9px] font-black px-2 py-1 rounded-lg border-none shadow-sm", roleMeta.className)}>
                      <roleMeta.Icon className="w-3 h-3 mr-1" /> {roleMeta.label}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2 text-xs font-medium text-muted-foreground/80 leading-relaxed">
                    {equipa.descricao || 'Nenhum briefing disponível para este esquadrão.'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5 group-hover:border-white/10 transition-all">
                    <div className="flex items-center gap-3">
                      <Hash className="w-4 h-4 text-brand-violet opacity-50" />
                      <span className="font-mono text-white/90 text-sm font-bold tracking-widest">{equipa.codigo_convite}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleCopyCode(equipa.codigo_convite, equipa.id)} 
                      className={cn("h-9 w-9 rounded-xl hover:bg-white/5", isCopied && "text-emerald-500 bg-emerald-500/10")}
                    >
                      {isCopied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardContent>

                <CardFooter className="p-3">
                  <Button 
                    disabled={isLoading}
                    onClick={() => handleAccessTeam(equipa.id)}
                    className="w-full bg-white/5 hover:bg-brand-violet/20 text-white font-bold rounded-xl h-12 transition-all border border-white/5 hover:border-brand-violet/30"
                  >
                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : 'Acessar QG'}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 border border-dashed border-white/10 rounded-[40px] bg-white/[0.01]">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
            <Users className="w-10 h-10 text-brand-violet/30" />
          </div>
          <h3 className="text-2xl font-black text-white mb-2">Sem Esquadrões Ativos</h3>
          <p className="text-muted-foreground mb-8 text-center max-w-sm font-medium">
            Sua jornada solo é produtiva, mas a colaboração acelera a evolução.
          </p>
          <TeamsDialog trigger={
            <Button className="bg-brand-violet hover:bg-brand-violet/90 px-8 h-12 rounded-xl font-black uppercase tracking-tight">
              <Plus className="w-5 h-5 mr-2" /> Iniciar Recrutamento
            </Button>
          } />
        </div>
      )}
    </div>
  )
}