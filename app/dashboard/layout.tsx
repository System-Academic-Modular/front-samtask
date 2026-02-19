import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { SidebarProvider } from '@/components/dashboard/sidebar-context'
import { MobileHeader } from '@/components/dashboard/mobile-header' // <-- TEM QUE IMPORTAR AQUI
import { differenceInDays, startOfDay, subDays } from 'date-fns'

// Função do Streak...
async function calculateRealStreak(supabase: any, userId: string) {
  const { data: sessions } = await supabase.from('focus_sessions').select('completed_at').eq('user_id', userId).order('completed_at', { ascending: false }).limit(30)
  if (!sessions || sessions.length === 0) return 0
  let streak = 0
  let currentDate = startOfDay(new Date()) 
  let hasSessionToday = false
  const uniqueTimes = Array.from<number>(new Set(sessions.map((s: any) => startOfDay(new Date(s.completed_at)).getTime())))
  const uniqueDates = uniqueTimes.map((time) => new Date(time))
  if (uniqueDates.length > 0 && uniqueDates[0].getTime() === currentDate.getTime()) {
    hasSessionToday = true
    streak = 1
    uniqueDates.shift()
  }
  let checkDate = subDays(currentDate, 1)
  for (const date of uniqueDates) {
    if (date.getTime() === checkDate.getTime()) {
      streak++
      checkDate = subDays(checkDate, 1)
    } else {
      break
    }
  }
  return streak
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const currentStreak = await calculateRealStreak(supabase, user.id)

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#09090b] text-white flex overflow-hidden">
        
        {/* A Sidebar fica recolhida escondida no mobile */}
        <DashboardSidebar user={user} profile={profile} streak={currentStreak} />
        
        <main className="flex-1 flex flex-col min-w-0 h-[100dvh]">
          
          {/* AQUI ENTRA O HEADER MOBILE (Fora da Sidebar!) */}
          <MobileHeader /> 
          
          <div className="flex-1 overflow-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            <div className="max-w-7xl mx-auto h-full">
              {children}
            </div>
          </div>

        </main>
      </div>
    </SidebarProvider>
  )
}