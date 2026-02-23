import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { SidebarProvider, SidebarMain } from '@/components/dashboard/sidebar-context'
import { TopHeader } from '@/components/dashboard/top-header'
import { startOfDay, subDays } from 'date-fns'
import { ThemeProvider } from '@/components/theme-provider'
import { DynamicStyleProvider } from '@/components/dashboard/dynamic-style-provider'

async function calculateRealStreak(supabase: any, userKey: string) {
  const { data: sessions } = await supabase
    .from('SESSOES_FOCO')
    .select('DATA_CONCLUSAO')
    .eq('KEY_LOGIN', userKey)
    .order('DATA_CONCLUSAO', { ascending: false })
    .limit(30)

  if (!sessions || sessions.length === 0) return 0

  let streak = 0
  let currentDate = startOfDay(new Date()) 
  const uniqueTimes = Array.from<number>(
    new Set(sessions.map((s: any) => startOfDay(new Date(s.DATA_CONCLUSAO)).getTime()))
  )
  const uniqueDates = uniqueTimes.map((time) => new Date(time))

  if (uniqueDates.length > 0 && uniqueDates[0].getTime() === currentDate.getTime()) {
    streak = 1
    uniqueDates.shift()
  }

  let checkDate = subDays(currentDate, 1)
  for (const date of uniqueDates) {
    if (date.getTime() === checkDate.getTime()) { 
      streak++
      checkDate = subDays(checkDate, 1) 
    } else { break }
  }
  return streak
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { redirect('/auth/login') }

  const [
    { data: profile },
    { data: categorias },
    currentStreak
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('CATEGORIAS').select('*').eq('KEY_LOGIN', user.id),
    calculateRealStreak(supabase, user.id)
  ])

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={profile?.theme_mode || "dark"} // Lê o tema do banco
      enableSystem
      disableTransitionOnChange
    >
      {/* Injeta a cor neon salva no banco (ex: 'cyan', 'rose') */}
      <DynamicStyleProvider colorVariable={profile?.theme_color || 'violet'} />
      
      <SidebarProvider>
        {/* Removido bg-[#09090b] fixo para permitir que o ThemeProvider controle o fundo */}
        <div className="min-h-screen bg-background text-foreground flex overflow-hidden transition-colors duration-300">
          
          <DashboardSidebar user={user} profile={profile} streak={currentStreak} />
          
          <SidebarMain>
            <TopHeader user={user} profile={profile} categories={categorias || []} />
            
            <div className="flex-1 overflow-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <div className="max-w-7xl mx-auto h-full">
                {children}
              </div>
            </div>
          </SidebarMain>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  )
}