import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { SidebarProvider, SidebarMain } from '@/components/dashboard/sidebar-context'
import { TopHeader } from '@/components/dashboard/top-header'
import { ThemeProvider } from '@/components/theme-provider'
import { DynamicStyleProvider } from '@/components/dashboard/dynamic-style-provider'
import { TaskContextProvider } from '@/components/dashboard/task-context'
import { getTaskContextValue } from '@/lib/task-context'
import { getUserStreak } from '@/lib/actions/streak'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/auth/login')

  // TRADUÇÃO SUPREMA: Buscando dados nas tabelas em português
  const [
    { data: profile }, 
    { data: categories }, 
    { data: teamMemberships }, 
    initialTaskContextValue,
    userStreak
  ] = await Promise.all([
    supabase.from('perfis').select('*').eq('id', user.id).single(),
    supabase.from('categorias').select('*').eq('usuario_id', user.id),
    supabase
      .from('membros_equipe')
      .select('equipe:equipes(id, nome)')
      .eq('usuario_id', user.id),
    getTaskContextValue(),
    getUserStreak() // Função já pronta no seu sistema para pegar os dias de foco
  ])

  // Mapeamento defensivo para os Times
  const teams = (teamMemberships || [])
    .map((membership: any) => membership.equipe)
    .filter((team: any) => team && team.id && team.nome)
    .map((team: any) => ({ id: team.id as string, name: team.nome as string })) // Mantém name para compatibilidade com os componentes antigos de Teams

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark" // Travado no Dark Mode para a imersão Neon
      enableSystem={false}
      disableTransitionOnChange
    >
      {/* O motor visual agora lê 'tema_padrao' que criamos na tabela de perfis */}
      <DynamicStyleProvider colorVariable={profile?.tema_padrao || 'violet'} />

      <TaskContextProvider initialValue={initialTaskContextValue} teams={teams}>
        <SidebarProvider>
          <div className="min-h-screen bg-background text-foreground flex overflow-hidden transition-colors duration-300">
            
            <DashboardSidebar user={user} profile={profile} streak={userStreak} />

            <SidebarMain>
              <TopHeader user={user} profile={profile} categories={categories || []} />
              
              {/* O Coração da Nave */}
              <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <div className="max-w-7xl mx-auto h-full animate-in fade-in zoom-in-[0.99] duration-500">
                  {children}
                </div>
              </main>

            </SidebarMain>
          </div>
        </SidebarProvider>
      </TaskContextProvider>
    </ThemeProvider>
  )
}