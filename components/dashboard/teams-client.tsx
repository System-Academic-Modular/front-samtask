'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TeamsDialog } from '@/components/dashboard/teams-dialog'
import { Users, Plus, Hash, Crown, Shield, User, Key, ArrowRight, Copy, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Team } from '@/lib/types' 

// Ajustado para refletir exatamente as chaves do objeto roleConfig
export type EquipaComPermissao = Team & { role: 'owner' | 'admin' | 'member' }

const roleConfig = {
  owner: { label: 'Líder / Criador', className: 'border-brand-amber/50 text-brand-amber bg-brand-amber/10', Icon: Crown },
  admin: { label: 'Administrador', className: 'border-brand-cyan/50 text-brand-cyan bg-brand-cyan/10', Icon: Shield },
  member: { label: 'Membro', className: 'border-white/20 text-white/80 bg-white/5', Icon: User },
}

interface TeamsClientProps {
  minhasEquipes: EquipaComPermissao[]
  stats: { total: number; liderando: number; participando: number }
}

export function TeamsClient({ minhasEquipes, stats }: TeamsClientProps) {
  const [inviteCode, setInviteCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleJoinTeam = () => {
    setIsJoining(true)
    setTimeout(() => {
      setIsJoining(false)
      toast.info(`Tentando entrar com o código: ${inviteCode} (Em breve!)`)
      setInviteCode('')
    }, 1500)
  }

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    toast.success('Código copiado!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-brand-violet to-brand-cyan bg-clip-text text-transparent inline-block">
            Esquadrões
          </h1>
          <p className="text-muted-foreground">Gerencie suas equipes e colabore em projetos de alto nível.</p>
        </div>
        <TeamsDialog
          trigger={
            <Button className="bg-brand-violet hover:bg-brand-violet/90 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]">
              <Plus className="w-4 h-4 mr-2" /> Nova Equipe
            </Button>
          }
        />
      </div>

      {/* Portal de Acesso */}
      <div className="relative group rounded-3xl p-[1px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-cyan via-brand-violet to-brand-cyan opacity-40 blur-xl animate-gradient-x" />
        <div className="relative bg-[#09090b]/90 backdrop-blur-2xl border border-white/10 rounded-[23px] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 z-10">
          <div className="flex items-center gap-5 w-full md:w-auto">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-cyan/20 to-brand-violet/20 flex items-center justify-center border border-white/5 shrink-0">
              <Key className="w-7 h-7 text-brand-cyan" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Portal de Acesso</h3>
              <p className="text-sm text-brand-cyan/80">Insira o código de 6 dígitos para ingressar num esquadrão.</p>
            </div>
          </div>
          <div className="flex w-full md:w-auto items-center gap-3">
            <Input 
              placeholder="EX: ABC123" 
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-full md:w-48 h-12 bg-black/50 border-white/10 text-white uppercase tracking-[0.3em] text-center font-mono font-bold text-lg"
            />
            <Button onClick={handleJoinTeam} disabled={inviteCode.length < 6 || isJoining} className="h-12 px-6 bg-brand-cyan hover:bg-brand-cyan/90 text-black font-bold">
              {isJoining ? 'A verificar...' : 'Entrar'}
            </Button>
          </div>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total', val: stats.total, border: 'border-white/10' },
          { label: 'Lidera', val: stats.liderando, border: 'border-brand-amber/20', text: 'text-brand-amber' },
          { label: 'Participa', val: stats.participando, border: 'border-brand-cyan/20', text: 'text-brand-cyan' }
        ].map((s, i) => (
          <div key={i} className={cn("rounded-2xl border bg-card/40 p-5 backdrop-blur-sm", s.border)}>
            <p className={cn("text-xs uppercase tracking-wider font-semibold mb-1 opacity-70", s.text)}>{s.label}</p>
            <p className="text-3xl font-bold text-white">{s.val}</p>
          </div>
        ))}
      </div>

      {/* Grid de Equipes */}
      {minhasEquipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {minhasEquipes.map((equipa) => {
            // CORREÇÃO AQUI: Acessando 'member' em vez de 'membro'
            const roleMeta = roleConfig[equipa.role] || roleConfig.member
            const isCopied = copiedId === equipa.id

            return (
              <Card key={equipa.id} className="bg-card/40 border-white/10 backdrop-blur-sm hover:border-brand-violet/50 transition-all group overflow-hidden relative flex flex-col">
                <CardHeader className="space-y-3 z-10">
                  <div className="flex justify-between items-start gap-3">
                    <CardTitle className="text-xl text-white font-bold">{equipa.name}</CardTitle>
                    <Badge variant="outline" className={cn("shrink-0 uppercase tracking-wider text-[10px] font-bold px-2 py-0.5", roleMeta.className)}>
                      <roleMeta.Icon className="w-3 h-3 mr-1.5" /> {roleMeta.label}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">{equipa.description || 'Sem descrição.'}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 z-10">
                  <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-muted-foreground" />
                      <span className="font-mono text-white text-sm font-bold tracking-widest">{equipa.invite_code}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleCopyCode(equipa.invite_code, equipa.id)} className={cn("h-8 w-8", isCopied && "text-brand-emerald")}>
                      {isCopied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardContent>
                <CardFooter className="pt-2 z-10 border-t border-white/5">
                  <Button variant="ghost" className="w-full text-brand-violet hover:bg-brand-violet/10">
                    Aceder ao QG <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/5">
          <Users className="w-16 h-16 mx-auto mb-4 text-brand-violet/50" />
          <h3 className="text-xl font-bold text-white mb-2">Ainda está a solo</h3>
          <p className="text-muted-foreground mb-6">Crie um esquadrão ou use um código para colaborar.</p>
          <TeamsDialog trigger={<Button className="bg-brand-violet hover:bg-brand-violet/90 text-white shadow-lg"><Plus className="w-4 h-4 mr-2" /> Iniciar o meu Esquadrão</Button>} />
        </div>
      )}
    </div>
  )
}