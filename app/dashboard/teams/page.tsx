import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TeamsClient, type EquipaComPermissao } from '@/components/dashboard/teams-client'

export default async function TeamsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: members, error: membersError } = await supabase
    .from('membros_equipe')
    .select(`
      papel,
      equipe:equipes (
        id,
        nome,
        descricao,
        dono_id,
        codigo_convite
      )
    `)
    .eq('usuario_id', user.id)

  const minhasEquipes = (members ?? [])
    .map((member: any) => {
      const equipaData = member.equipe
      if (!equipaData) return null

      const role =
        member.papel === 'owner' || member.papel === 'dono'
          ? 'owner'
          : member.papel === 'admin'
            ? 'admin'
            : 'member'
      
      return {
        ...equipaData,
        role,
      } as EquipaComPermissao
    })
    .filter((equipa): equipa is EquipaComPermissao => equipa !== null)

  const roleOrder = { owner: 0, admin: 1, member: 2 }
  minhasEquipes.sort((a, b) => {
    return roleOrder[a.role] - roleOrder[b.role] || a.nome.localeCompare(b.nome)
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
