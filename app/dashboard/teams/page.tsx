import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TeamsClient, type EquipaComPermissao } from '@/components/dashboard/teams-client'

export default async function TeamsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // A buscar na nova tabela LOGIN_TIME e a fazer join com TIMES
  const { data: membros, error: membersError } = await supabase
    .from('LOGIN_TIME')
    .select(`
      SUPER_ADMIN,
      TIME:TIMES (
        KEY_TIME,
        NOME,
        DESCRICAO,
        KEY_LOGIN,
        CODIGO_CONVITE
      )
    `)
    .eq('KEY_LOGIN', user.id)

  const minhasEquipes = (membros ?? [])
    .map((membro: any) => {
      // Como o Supabase devolve as relações, tratamos caso seja array ou objeto
      const equipaData = Array.isArray(membro.TIME) ? membro.TIME[0] : membro.TIME
      if (!equipaData) return null
      
      return {
        ...equipaData,
        SUPER_ADMIN: membro.SUPER_ADMIN,
      } as EquipaComPermissao
    })
    .filter((equipa): equipa is EquipaComPermissao => equipa !== null)

  // Ordenar: Super Admins primeiro, depois ordem alfabética
  minhasEquipes.sort((a, b) => {
    if (a.SUPER_ADMIN && !b.SUPER_ADMIN) return -1
    if (!a.SUPER_ADMIN && b.SUPER_ADMIN) return 1
    return a.NOME.localeCompare(b.NOME)
  })

  const total = minhasEquipes.length
  const liderando = minhasEquipes.filter((equipa) => equipa.SUPER_ADMIN).length
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