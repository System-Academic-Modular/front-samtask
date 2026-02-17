'use client'

import { useTransition } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Menu, Bell, Search, User as UserIcon, LogOut, CheckCircle, Briefcase, ChevronDown, Users } from 'lucide-react'
import { useSidebar } from '@/components/dashboard/sidebar-context'
import { useTaskContext } from '@/components/dashboard/task-context'
import { setTaskContext } from '@/lib/actions/task-context-action' // Vamos criar essa action já já
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface DashboardHeaderProps {
  user: User
  profile: Profile | null
}

export function DashboardHeader({ user, profile }: DashboardHeaderProps) {
  const { toggle } = useSidebar()
  const taskContext = useTaskContext()
  const { type, teams } = taskContext
  const teamId = taskContext.type === 'team' ? taskContext.teamId : undefined
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  // Função para trocar o contexto (Pessoal <-> Equipe)
  function handleContextChange(newType: 'personal' | 'team', newTeamId?: string) {
    if (type === newType && teamId === newTeamId) return

    startTransition(async () => {
      const contextValue = newType === 'personal' ? 'personal' : `team:${newTeamId}`
      // Chama a server action para salvar o cookie e atualizar a tela
      await setTaskContext(contextValue)
      toast.success(newType === 'personal' ? 'Visualizando espaço pessoal' : 'Contexto de equipe carregado')
      router.refresh()
    })
  }

  // Encontrar a equipe atual selecionada
  const currentTeam = type === 'team' ? teams.find(t => t.id === teamId) : null

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/5 bg-[#09090b]/80 px-4 backdrop-blur-xl md:px-6 shadow-sm">
      
      {/* Botão Menu Mobile */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggle}
        className="lg:hidden text-muted-foreground hover:text-white"
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle sidebar</span>
      </Button>

      {/* SELETOR DE CONTEXTO (Workspace) */}
      <div className="flex-1 flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className={cn(
                "flex items-center gap-2 px-3 py-2 h-auto border transition-all hover:bg-white/5",
                type === 'personal' 
                  ? "border-brand-cyan/20 bg-brand-cyan/5 text-brand-cyan hover:border-brand-cyan/40" 
                  : "border-brand-violet/20 bg-brand-violet/5 text-brand-violet hover:border-brand-violet/40"
              )}
              disabled={isPending}
            >
              {type === 'personal' ? (
                <Briefcase className="h-4 w-4" />
              ) : (
                <Users className="h-4 w-4" />
              )}
              <span className="font-semibold text-sm tracking-wide hidden sm:inline-block">
                {type === 'personal' ? 'Espaço Pessoal' : currentTeam?.name || 'Carregando Equipe...'}
              </span>
              <ChevronDown className="h-3 w-3 opacity-50 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-[#18181b] border-white/10 shadow-2xl">
            <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-widest px-3 py-2">
              Seu Espaço
            </DropdownMenuLabel>
            <DropdownMenuItem 
              onClick={() => handleContextChange('personal')}
              className={cn("cursor-pointer py-2.5", type === 'personal' && "bg-white/5")}
            >
              <Briefcase className="mr-2 h-4 w-4 text-brand-cyan" />
              <span className={cn("font-medium", type === 'personal' ? "text-brand-cyan" : "text-white")}>
                Pessoal
              </span>
              {type === 'personal' && <CheckCircle className="ml-auto h-4 w-4 text-brand-cyan" />}
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="bg-white/10" />
            
            <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-widest px-3 py-2">
              Seus Esquadrões
            </DropdownMenuLabel>
            {teams.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">Nenhuma equipe ainda.</div>
            ) : (
              teams.map((team) => (
                <DropdownMenuItem
                  key={team.id}
                  onClick={() => handleContextChange('team', team.id)}
                  className={cn("cursor-pointer py-2.5", type === 'team' && teamId === team.id && "bg-white/5")}
                >
                  <Users className="mr-2 h-4 w-4 text-brand-violet" />
                  <span className={cn("font-medium line-clamp-1", type === 'team' && teamId === team.id ? "text-brand-violet" : "text-white")}>
                    {team.name}
                  </span>
                  {type === 'team' && teamId === team.id && <CheckCircle className="ml-auto h-4 w-4 text-brand-violet" />}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Lado Direito do Header */}
      <div className="flex items-center gap-2 md:gap-4">
        <form className="hidden md:flex">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Buscar tarefas..."
              className="w-full bg-[#121214] border border-white/10 rounded-full pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-violet/50 focus:border-transparent transition-all"
            />
          </div>
        </form>

        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white hover:bg-white/5 rounded-full relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-red rounded-full shadow-neon-red animate-pulse" />
          <span className="sr-only">Notificações</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full ring-2 ring-transparent hover:ring-brand-violet/50 transition-all">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'Usuário'} />
                <AvatarFallback className="bg-brand-violet/20 text-brand-violet font-bold">
                  {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-[#18181b] border-white/10">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-white">{profile?.full_name || 'Usuário'}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem onClick={() => router.push('/dashboard/settings')} className="cursor-pointer text-white focus:bg-white/10">
              <UserIcon className="mr-2 h-4 w-4" /> Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem onClick={handleSignOut} className="text-brand-red focus:bg-brand-red/10 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
