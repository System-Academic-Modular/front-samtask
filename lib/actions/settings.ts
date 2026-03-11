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
    .from('perfis') // ATUALIZADO
    .update({ 
        nome_completo: fullName, // ATUALIZADO
        atualizado_em: new Date().toISOString() // ATUALIZADO
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
    .from('integracoes') // ATUALIZADO
    .select('provedor, criado_em') // ATUALIZADO
    .eq('usuario_id', user.id) // ATUALIZADO

  // Mapear de volta para o padrão que a UI espera em inglês para não quebrar a tela de Settings agora
  return (data || []).map(int => ({
    provider: int.provedor,
    created_at: int.criado_em
  }))
}

// --- 3. Desconectar Integração ---
export async function disconnectIntegration(provider: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Não autorizado' }

  const { error } = await supabase
    .from('integracoes') // ATUALIZADO
    .delete()
    .eq('usuario_id', user.id) // ATUALIZADO
    .eq('provedor', provider) // ATUALIZADO

  if (error) return { error: 'Erro ao desconectar.' }

  revalidatePath('/dashboard/settings')
  return { success: 'Desconectado com sucesso.' }
}