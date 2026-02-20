'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, Zap, LogOut, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { useSidebar } from '@/components/dashboard/sidebar-context'
import { HeaderActions } from '@/components/dashboard/header-actions'
import { createClient } from '@/lib/supabase/client'

export function TopHeader({ user, profile, categories }: any) {
  const { toggle } = useSidebar()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <header className="flex items-center justify-between p-4 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-40 h-16 shrink-0">
      
      {/* Lado Esquerdo: Menu Burger e Logo (Mobile) */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggle} 
          className="text-muted-foreground hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-md transition-all"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Logo que só aparece no mobile, pois no desktop já tem na sidebar */}
        <div className="md:hidden flex items-center gap-2">
          <Zap className="w-5 h-5 text-brand-violet" />
          <span className="font-bold text-white tracking-tight">Focus OS</span>
        </div>
      </div>

      {/* Lado Direito: Ações (Sino, Zen) e Menu do Usuário */}
      <div className="flex items-center gap-2 md:gap-4">
        
        {/* Aqui entram as Notificações, Modo Zen e Importação Mágica em TODAS as telas! */}
        <HeaderActions categories={categories} />

        <div className="h-6 w-px bg-white/10 mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full border border-white/10 hover:border-brand-violet/50 transition-colors p-0">
              <Avatar className="h-9 w-9">
                <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
                <AvatarFallback className="bg-brand-violet text-white text-xs font-semibold">
                  {profile?.full_name?.substring(0, 2).toUpperCase() || 'US'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-[#121214] border-white/10 shadow-2xl mt-2" align="end" forceMount>
            <div className="flex items-center justify-start gap-2 p-3">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium text-sm text-white">{profile?.full_name || 'Usuário'}</p>
                <p className="w-[200px] truncate text-xs text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem asChild className="cursor-pointer focus:bg-white/10 focus:text-white">
              <Link href="/dashboard/settings" className="flex items-center w-full">
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem 
              onClick={handleLogout} 
              className="cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-400"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair da conta</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  )
}