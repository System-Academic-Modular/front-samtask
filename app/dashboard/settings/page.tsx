import { createClient } from '@/lib/supabase/server'
import { SettingsView } from '@/components/dashboard/settings-view'
import { getIntegrationsStatus } from '@/lib/actions/settings'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // NOVO: Busca as categorias do usuário
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  const integrations = await getIntegrationsStatus()

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-white">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie seu perfil, preferências e conexões do sistema.
        </p>
      </div>

      <SettingsView 
        user={user} 
        profile={profile} 
        integrations={integrations} 
        categories={categories || []} // Passando as categorias
      />
    </div>
  )
}