import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TeamsClient, type EquipaComPermissao } from '@/components/dashboard/teams-client'

export default async function TeamsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Ajustado para as tabelas reais: team_members e teams
  const { data: members, error: membersError } = await supabase
    .from('team_members')
    .select(`
      role,
      team:teams (
        id,
        name,
        description,
        owner_id,
        invite_code
      )
    `)
    .eq('user_id', user.id)

  const minhasEquipes = (members ?? [])
    .map((member: any) => {
      const equipaData = member.team
      if (!equipaData) return null
      
      return {
        ...equipaData,
        role: member.role, // 'owner', 'admin' ou 'member'
      } as EquipaComPermissao
    })
    .filter((equipa): equipa is EquipaComPermissao => equipa !== null)

  // Ordenação: Líderes (owner) primeiro, depois Admins, depois Membros
  const roleOrder = { owner: 0, admin: 1, member: 2 }
  minhasEquipes.sort((a, b) => {
    return roleOrder[a.role] - roleOrder[b.role] || a.name.localeCompare(b.name)
  })

  const total = minhasEquipes.length
  const liderando = minhasEquipes.filter((equipa) => equipa.role === 'owner').length
  const participando = total - liderando

  return (
    <>
      {membersError && (
        <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200 backdrop-blur-md">
          Falha de comunicação com a base de dados central. Não foi possível carregar os esquadrões.
        </div>
      )}
      
      <TeamsClient 
        minhasEquipes={minhasEquipes} 
        stats={{ total, liderando, participando }} 
      />
    </>
  )
}