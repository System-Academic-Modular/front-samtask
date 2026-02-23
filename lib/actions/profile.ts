'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(data: {
  full_name?: string;
  theme_color?: string;
  theme_mode?: string;
  daily_goal?: number;
  pomodoro_duration?: number;
  short_break?: number;
  long_break?: number;
}) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Sessão expirada. Faça login novamente.' }
  }

  // Remove campos undefined para não sobrescrever o banco com nulo
  const updateData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  )

  const { error } = await supabase
    .from('profiles')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (error) {
    console.error('Erro ao atualizar perfil:', error)
    return { error: 'Não foi possível salvar as alterações.' }
  }

  revalidatePath('/dashboard/settings')
  return { success: 'Configurações salvas com sucesso!' }
}