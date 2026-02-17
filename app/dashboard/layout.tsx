import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { SidebarProvider } from '@/components/dashboard/sidebar-context'
import { TaskContextProvider } from '@/components/dashboard/task-context'
import { getTaskContextValue } from '@/lib/task-context'
import { FloatingTimer } from '@/components/dashboard/floating-timer' // Adicionado

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: teamRows } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)

  const teamIds = (teamRows || []).map((row) => row.team_id)
  
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
        <div className="min-h-screen bg-[#09090b] relative flex">
          {/* Sidebar */}
          <DashboardSidebar user={user} profile={profile} />

          {/* Conteúdo Principal */}
          <div className="flex-1 flex flex-col min-w-0 relative">
            <DashboardHeader user={user} profile={profile} />
            
            <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
              {children}
            </main>

            {/* O Timer Flutuante e Launcher aparecem sobre tudo no Dashboard */}
            <FloatingTimer />
          </div>
        </div>
      </SidebarProvider>
    </TaskContextProvider>
  )
}