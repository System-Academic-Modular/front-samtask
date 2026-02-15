import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { SidebarProvider } from '@/components/dashboard/sidebar-context'
import type { Team } from '@/lib/types'

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

  const teams = (teamsData || []) as Team[]

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background relative">
        <DashboardSidebar user={user} profile={profile} />

        <div className="w-full transition-all duration-300">
          <DashboardHeader user={user} profile={profile} teams={teams} />
          <main className="p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
