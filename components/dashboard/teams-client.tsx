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
import type { Time } from '@/lib/types' // Importando a tipagem correta em PT-BR

// Criamos um tipo local que junta a Equipa com a permissão do utilizador
export type EquipaComPermissao = Time & { SUPER_ADMIN: boolean }

// Configuração visual das permissões
const roleConfig = {
  admin: { label: 'Líder / Admin', className: 'border-brand-amber/50 text-brand-amber bg-brand-amber/10', Icon: Crown },
  membro: { label: 'Membro', className: 'border-white/20 text-white/80 bg-white/5', Icon: User },
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
      toast.info(`A tentar entrar com o código: ${inviteCode} (Em breve!)`)
      setInviteCode('')
    }, 1500)
  }

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    toast.success('Código copiado para a área de transferência!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-brand-violet to-brand-cyan bg-clip-text text-transparent inline-block">
            Esquadrões
          </h1>
          <p className="text-muted-foreground">
            Efetue a gestão das suas equipas e colabore em projetos de alto nível.
          </p>
        </div>

        <TeamsDialog
          trigger={
            <Button className="bg-brand-violet hover:bg-brand-violet/90 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all">
              <Plus className="w-4 h-4 mr-2" /> Nova Equipa
            </Button>
          }
        />
      </div>

      {/* ÁREA DE CONVITE */}
      <div className="relative group rounded-3xl p-[1px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-cyan via-brand-violet to-brand-cyan opacity-40 group-hover:opacity-70 blur-xl transition-opacity duration-700 bg-[length:200%_auto] animate-gradient-x" />
        
        <div className="relative bg-[#09090b]/90 backdrop-blur-2xl border border-white/10 rounded-[23px] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 z-10">
          <div className="flex items-center gap-5 w-full md:w-auto">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-cyan/20 to-brand-violet/20 flex items-center justify-center border border-white/5 shrink-0 shadow-inner">
              <Key className="w-7 h-7 text-brand-cyan" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white tracking-tight">Portal de Acesso</h3>
              <p className="text-sm text-brand-cyan/80 font-medium">Insira o código de 6 dígitos para ingressar num esquadrão.</p>
            </div>
          </div>

          <div className="flex w-full md:w-auto items-center gap-3">
            <div className="relative w-full md:w-48">
              <Input 
                placeholder="EX: ABC123" 
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-full h-12 bg-black/50 border-white/10 text-white uppercase tracking-[0.3em] text-center font-mono font-bold text-lg focus-visible:ring-brand-cyan focus-visible:border-brand-cyan transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-sm"
              />
              {inviteCode.length === 6 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-brand-emerald shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
              )}
            </div>
            <Button 
              onClick={handleJoinTeam}
              disabled={inviteCode.length < 6 || isJoining}
              className="h-12 px-6 bg-brand-cyan hover:bg-brand-cyan/90 text-black font-bold shrink-0 transition-all disabled:opacity-50"
            >
              {isJoining ? 'A verificar...' : <><ArrowRight className="w-5 h-5 mr-2" /> Entrar</>}
            </Button>
          </div>
        </div>
      </div>

      {/* RESUMO STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-card/40 p-5 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors" />
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Total</p>
          <p className="text-3xl font-bold text-white">{stats.total}</p>
          <p className="text-xs text-muted-foreground mt-1">Esquadrões ativos</p>
        </div>
        <div className="rounded-2xl border border-brand-amber/20 bg-brand-amber/5 p-5 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-brand-amber/10 rounded-full blur-2xl group-hover:bg-brand-amber/20 transition-colors" />
          <p className="text-xs uppercase tracking-wider text-brand-amber/70 font-semibold mb-1">Lidera</p>
          <p className="text-3xl font-bold text-brand-amber">{stats.liderando}</p>
          <p className="text-xs text-brand-amber/50 mt-1">Projetos com você no comando</p>
        </div>
        <div className="rounded-2xl border border-brand-cyan/20 bg-brand-cyan/5 p-5 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-brand-cyan/10 rounded-full blur-2xl group-hover:bg-brand-cyan/20 transition-colors" />
          <p className="text-xs uppercase tracking-wider text-brand-cyan/70 font-semibold mb-1">Participa</p>
          <p className="text-3xl font-bold text-brand-cyan">{stats.participando}</p>
          <p className="text-xs text-brand-cyan/50 mt-1">Times onde você contribui</p>
        </div>
      </div>

      {/* GRID DE EQUIPAS */}
      {minhasEquipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {minhasEquipes.map((equipa) => {
            const roleMeta = equipa.SUPER_ADMIN ? roleConfig.admin : roleConfig.membro
            const isCopied = copiedId === equipa.KEY_TIME

            return (
              <Card key={equipa.KEY_TIME} className="bg-card/40 border-white/10 backdrop-blur-sm hover:border-brand-violet/50 transition-all group overflow-hidden relative flex flex-col">
                <div className="absolute -top-12 -right-12 p-3 opacity-[0.03] group-hover:opacity-10 transition-opacity pointer-events-none">
                  <Users className="w-40 h-40 text-brand-violet" />
                </div>

                <CardHeader className="space-y-3 z-10">
                  <div className="flex justify-between items-start gap-3">
                    <CardTitle className="text-xl text-white font-bold leading-tight">
                      {equipa.NOME}
                    </CardTitle>
                    <Badge variant="outline" className={cn("shrink-0 uppercase tracking-wider text-[10px] font-bold px-2 py-0.5", roleMeta.className)}>
                      <roleMeta.Icon className="w-3 h-3 mr-1.5" /> {roleMeta.label}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2 text-sm leading-relaxed">
                    {equipa.DESCRICAO || 'Sem descrição definida.'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 z-10">
                  <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                        <Hash className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Código</p>
                        <p className="font-mono text-white text-sm font-bold tracking-widest leading-none">{equipa.CODIGO_CONVITE}</p>
                      </div>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleCopyCode(equipa.CODIGO_CONVITE, equipa.KEY_TIME)}
                      className={cn("h-8 w-8 transition-colors", isCopied ? "text-brand-emerald bg-brand-emerald/10 hover:bg-brand-emerald/20 hover:text-brand-emerald" : "text-muted-foreground hover:text-white hover:bg-white/10")}
                    >
                      {isCopied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardContent>

                <CardFooter className="pt-2 z-10 border-t border-white/5 mt-auto">
                  <Button variant="ghost" className="w-full text-brand-violet hover:bg-brand-violet/10 hover:text-brand-violet transition-colors">
                    Aceder ao QG <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/5 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-brand-violet/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Users className="w-16 h-16 mx-auto mb-4 text-brand-violet/50 group-hover:text-brand-violet transition-colors group-hover:scale-110 duration-500" />
          <h3 className="text-xl font-bold text-white mb-2 relative z-10">Ainda está a solo</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto relative z-10">
            Crie um esquadrão para liderar o seu próprio projeto ou use um código de acesso acima para colaborar.
          </p>
          <div className="relative z-10">
            <TeamsDialog trigger={<Button className="bg-brand-violet hover:bg-brand-violet/90 text-white shadow-lg"><Plus className="w-4 h-4 mr-2" /> Iniciar o meu Esquadrão</Button>} />
          </div>
        </div>
      )}
    </div>
  )
}