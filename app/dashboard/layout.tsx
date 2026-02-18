import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { SidebarProvider } from '@/components/dashboard/sidebar-context'
import { TaskContextProvider } from '@/components/dashboard/task-context'
import { getTaskContextValue } from '@/lib/task-context'
import { FloatingTimer } from '@/components/dashboard/floating-timer'
import { getUserStreak } from '@/lib/actions/streak' // Vamos criar essa action no passo 3

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // 1. Buscas em Paralelo para Performance (Profile + Teams + Streak)
  const [profileResult, teamRowsResult, streakResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('team_members').select('team_id').eq('user_id', user.id),
    getUserStreak() // <--- Nova action de Streak
  ])

  const profile = profileResult.data
  const teamRows = teamRowsResult.data || []
  const currentStreak = streakResult || 0

  const teamIds = teamRows.map((row) => row.team_id)
  const { data: teamsData } = teamIds.length
    ? await supabase.from('teams').select('id,name').in('id', teamIds)
    : { data: [] }

  const taskContextValue = await getTaskContextValue()
  
  const teamOptions = (teamsData || []).map((team) => ({
    id: team.id,
    name: team.name,
  }))

  return (
    <TaskContextProvider initialValue={taskContextValue} teams={teamOptions}>
      <SidebarProvider>
        <div className="flex h-screen overflow-hidden bg-[#09090b] relative">
          {/* Passamos o streak calculado para a Sidebar */}
          <DashboardSidebar user={user} profile={profile} streak={currentStreak} />

          <div className="flex-1 flex flex-col min-w-0 relative">
            <DashboardHeader user={user} profile={profile} />
            
            {/* CORREÇÃO DE INTERAÇÃO: Scroll fica aqui, com padding embaixo */}
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-32 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {children}
            </main>

            {/* Timer flutuante com pointer-events controlado */}
            <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
                <FloatingTimer />
            </div>
          </div>
        </div>
      </SidebarProvider>
    </TaskContextProvider>
  )
}