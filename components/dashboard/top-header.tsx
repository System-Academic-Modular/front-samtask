'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import type { Perfil } from '@/lib/types'
import { Menu, LogOut, Settings, CheckCircle, Briefcase, ChevronDown, Users, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel 
} from '@/components/ui/dropdown-menu'
import { useSidebar } from '@/components/dashboard/sidebar-context'
import { useTaskContext } from '@/components/dashboard/task-context'
import { setTaskContext } from '@/lib/actions/task-context-action'
import { HeaderActions } from '@/components/dashboard/header-actions'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface TopHeaderProps {
  user: User
  profile: Perfil | null
  categories: any[]
}

export function TopHeader({ user, profile, categories }: TopHeaderProps) {
  const { toggle } = useSidebar()
  const taskContext = useTaskContext()
  const { type, teams } = taskContext
  const teamId = taskContext.type === 'team' ? taskContext.teamId : undefined
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  function handleContextChange(newType: 'personal' | 'team', newTeamId?: string) {
    if (type === newType && teamId === newTeamId) return

    startTransition(async () => {
      const contextValue = newType === 'personal' ? 'personal' : `team:${newTeamId}`
      await setTaskContext(contextValue)
      toast.success(newType === 'personal' ? 'Desconectado da Rede' : 'Sincronizado com o Esquadrão', {
        description: newType === 'personal' ? 'Você está agora no seu cockpit pessoal.' : 'Sistemas partilhados ativos.',
      })
      router.refresh()
    })
  }

  const currentTeam = type === 'team' ? teams.find(t => t.id === teamId) : null

  if (!mounted) {
    return <header className="sticky top-0 z-30 flex h-[72px] items-center border-b border-white/5 bg-[#09090b]/60 px-4 backdrop-blur-2xl" />
  }

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-4 border-b border-white/5 bg-[#09090b]/60 px-4 backdrop-blur-2xl md:px-6 shadow-[0_4_30px_rgba(0,0,0,0.1)] transition-all">
      
      {/* Luz Neon de Fundo (Exclusiva do Header) */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-violet/5 to-transparent pointer-events-none" />
      
      {/* Lado Esquerdo: Menu Burger e Seletor de Contexto */}
      <div className="flex items-center gap-4 relative z-10">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggle} 
          className="lg:hidden text-white/50 hover:text-white hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl transition-all h-10 w-10 shrink-0"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* SELETOR DE REDE (Workspace) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className={cn(
                "flex items-center gap-2 px-3 py-2 h-10 border transition-all duration-300 rounded-xl focus-visible:ring-0 max-w-[150px] sm:max-w-xs overflow-hidden",
                type === 'personal' 
                  ? "border-white/5 bg-black/40 text-white/80 hover:text-white hover:bg-white/5 hover:border-white/20" 
                  : "border-brand-violet/30 bg-brand-violet/10 text-brand-violet shadow-[0_0_15px_rgba(139,92,246,0.1)] hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]"
              )}
              disabled={isPending}
            >
              {type === 'personal' ? (
                <Briefcase className="h-4 w-4 shrink-0 text-brand-cyan" />
              ) : (
                <Users className="h-4 w-4 shrink-0" />
              )}
              <span className="font-black text-[10px] sm:text-[11px] uppercase tracking-widest truncate hidden xs:inline-block">
                {type === 'personal' ? 'COCKPIT PESSOAL' : currentTeam?.name || 'CARREGANDO...'}
              </span>
              <ChevronDown className="h-3 w-3 opacity-50 shrink-0 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 bg-[#0c0c0e]/95 backdrop-blur-xl border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] rounded-2xl p-2 z-[60]">
            <DropdownMenuLabel className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] px-3 py-2 flex items-center gap-2">
              <Activity className="w-3 h-3 text-brand-cyan" /> Rede Local
            </DropdownMenuLabel>
            <DropdownMenuItem 
              onClick={() => handleContextChange('personal')}
              className={cn("cursor-pointer py-3 rounded-xl transition-all", type === 'personal' ? "bg-white/5" : "hover:bg-white/[0.02]")}
            >
              <Briefcase className="mr-3 h-4 w-4 text-brand-cyan" />
              <div className="flex flex-col flex-1">
                <span className={cn("text-[11px] font-black uppercase tracking-widest", type === 'personal' ? "text-brand-cyan" : "text-white/80")}>
                  Cockpit Pessoal
                </span>
              </div>
              {type === 'personal' && <CheckCircle className="ml-auto h-4 w-4 text-brand-cyan" />}
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="bg-white/5 my-2" />
            
            <DropdownMenuLabel className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] px-3 py-2 flex items-center gap-2">
              <Users className="w-3 h-3 text-brand-violet" /> Esquadrões
            </DropdownMenuLabel>
            {teams.length === 0 ? (
              <div className="px-3 py-3 text-[10px] text-muted-foreground uppercase tracking-widest text-center border border-dashed border-white/5 rounded-xl m-1">
                NENHUMA REDE ENCONTRADA.
              </div>
            ) : (
              teams.map((team) => (
                <DropdownMenuItem
                  key={team.id}
                  onClick={() => handleContextChange('team', team.id)}
                  className={cn("cursor-pointer py-3 rounded-xl mb-1 transition-all", type === 'team' && teamId === team.id ? "bg-brand-violet/10 border border-brand-violet/20" : "hover:bg-white/[0.02]")}
                >
                  <Users className="mr-3 h-4 w-4 text-brand-violet" />
                  <div className="flex flex-col flex-1">
                    <span className={cn("text-[11px] font-black uppercase tracking-widest line-clamp-1", type === 'team' && teamId === team.id ? "text-brand-violet" : "text-white/80")}>
                      {team.name}
                    </span>
                  </div>
                  {type === 'team' && teamId === team.id && <CheckCircle className="ml-auto h-4 w-4 text-brand-violet" />}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Lado Direito: Ações (Sino, Zen) e Menu do Usuário */}
      <div className="flex items-center gap-2 md:gap-4 relative z-10 shrink-0">
        
        {/* Renderiza o Botão Modo Zen, Importação e Notificações */}
        <HeaderActions categories={categories} />

        <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />

        {/* Menu do Avatar (Operador) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 ring-2 ring-transparent hover:ring-brand-violet/50 hover:bg-brand-violet/10 transition-all p-0 overflow-hidden group">
              <Avatar className="h-8 w-8 rounded-lg transition-transform duration-300 group-hover:scale-110">
                <AvatarImage src={profile?.avatar_url || ''} alt={profile?.nome_completo || 'Operador'} />
                <AvatarFallback className="bg-brand-violet/20 text-brand-violet font-black text-[10px]">
                  {profile?.nome_completo ? profile.nome_completo.charAt(0).toUpperCase() : 'OP'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 bg-[#0c0c0e]/95 border-white/10 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-2xl p-2 mt-2 z-[60]" align="end" forceMount>
            <DropdownMenuLabel className="font-normal p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 rounded-lg">
                  <AvatarImage src={profile?.avatar_url || ''} alt={profile?.nome_completo || 'Operador'} />
                  <AvatarFallback className="bg-brand-violet/20 text-brand-violet font-black text-xs">
                    {profile?.nome_completo ? profile.nome_completo.charAt(0).toUpperCase() : 'OP'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-1 overflow-hidden">
                  <p className="text-xs font-black text-white uppercase tracking-widest truncate">{profile?.nome_completo || 'Operador Desconhecido'}</p>
                  <p className="text-[9px] text-brand-cyan font-mono truncate">{user?.email}</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem asChild className="cursor-pointer py-3 rounded-xl text-white/70 hover:text-white focus:bg-white/5 transition-colors group/item">
              <Link href="/dashboard/settings" className="flex items-center w-full">
                <Settings className="mr-3 h-4 w-4 text-muted-foreground group-hover/item:text-brand-cyan transition-colors" />
                <span className="text-[10px] font-black uppercase tracking-widest">Ajustes do Operador</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem 
              onClick={handleLogout} 
              className="text-red-400 focus:text-red-400 focus:bg-red-400/10 cursor-pointer py-3 rounded-xl transition-colors group/logout"
            >
              <LogOut className="mr-3 h-4 w-4 group-hover/logout:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Desconectar Link Neural</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  )
}