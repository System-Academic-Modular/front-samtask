'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// Mapeamento exato para as colunas da nossa nova tabela 'perfis'
type SupportedProfileFields = {
  nome_completo?: string
  meta_diaria?: number
  duracao_pomodoro?: number
  tema_padrao?: string
}

export async function updateProfile(data: SupportedProfileFields) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Conexão Neural expirada. Faça login novamente.' }
  }

  // Filtra apenas os campos que realmente existem no nosso novo banco
  const allowedEntries = Object.entries(data).filter(
    ([key, value]) =>
      ['nome_completo', 'meta_diaria', 'duracao_pomodoro', 'tema_padrao'].includes(key) &&
      value !== undefined,
  )

  const updateData = Object.fromEntries(allowedEntries)

  // Dispara a atualização para a tabela 'perfis'
  const { error } = await supabase
    .from('perfis')
    .update({
      ...updateData,
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    console.error('[Erro Sistema] Falha ao atualizar perfil:', error)
    return { error: 'Não foi possível salvar as configurações do Operador.' }
  }

  // Atualiza o cache da tela de configurações
  revalidatePath('/dashboard/settings')
  return { success: 'Configurações táticas salvas com sucesso!' }
}