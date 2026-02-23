import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsView } from '@/components/dashboard/settings-view' // Usando a View que consolidamos
import type { Categoria, UsuarioProfile } from '@/lib/types'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Melhoria de Performance: Dispara todas as buscas simultaneamente
  const [profileResponse, categoriesResponse, integrationsResponse] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
    
    supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true }),

    supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
  ])

  // Tratamento básico de erro ou dados nulos
  const profile = profileResponse.data as UsuarioProfile
  const categories = (categoriesResponse.data || []) as Categoria[]
  const integrations = integrationsResponse.data || []

  return (
    <SettingsView 
      user={user}
      profile={profile} 
      initialCategories={categories}
      integrations={integrations}
    />
  )
}