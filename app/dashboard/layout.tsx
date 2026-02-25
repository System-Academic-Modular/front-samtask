import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { SidebarProvider, SidebarMain } from '@/components/dashboard/sidebar-context'
import { TopHeader } from '@/components/dashboard/top-header'
import { ThemeProvider } from '@/components/theme-provider'
import { DynamicStyleProvider } from '@/components/dashboard/dynamic-style-provider'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: categorias }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('CATEGORIAS').select('*').eq('KEY_LOGIN', user.id),
  ])

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={profile?.theme_mode || "dark"}
      enableSystem
      disableTransitionOnChange
    >
      <DynamicStyleProvider colorVariable={profile?.theme_color || 'violet'} />
      
      <SidebarProvider>
        <div className="min-h-screen bg-background text-foreground flex overflow-hidden transition-colors duration-300">
          <DashboardSidebar user={user} profile={profile} streak={0} />
          
          <SidebarMain>
            <TopHeader user={user} profile={profile} categories={categorias || []} />
            <main className="flex-1 overflow-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <div className="max-w-7xl mx-auto h-full">
                {children}
              </div>
            </main>
          </SidebarMain>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  )
}