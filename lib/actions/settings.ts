'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// --- 1. Atualizar Perfil ---
export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Não autorizado' }

  const fullName = formData.get('fullName') as string
  
  // Atualiza a tabela profiles
  const { error } = await supabase
    .from('profiles')
    .update({ 
        full_name: fullName,
        updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (error) return { error: 'Erro ao atualizar perfil' }

  revalidatePath('/dashboard/settings')
  return { success: 'Perfil atualizado com sucesso!' }
}

// --- 2. Buscar Status das Integrações ---
export async function getIntegrationsStatus() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data } = await supabase
    .from('integrations')
    .select('provider, created_at')
    .eq('user_id', user.id)

  return data || []
}

// --- 3. Desconectar Integração ---
export async function disconnectIntegration(provider: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Não autorizado' }

  const { error } = await supabase
    .from('integrations')
    .delete()
    .eq('user_id', user.id)
    .eq('provider', provider)

  if (error) return { error: 'Erro ao desconectar.' }

  revalidatePath('/dashboard/settings')
  return { success: 'Desconectado com sucesso.' }
}