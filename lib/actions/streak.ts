'use server'

import { createClient } from '@/lib/supabase/server'

export async function getUserStreak() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return 0

  // Verifica a função RPC no banco
  const { data, error } = await supabase.rpc('calculate_streak', { 
    user_uuid: user.id 
  })

  if (error) {
    // Se der erro (função não existe ainda), retorna 0 silenciosamente
    console.error('Streak Error:', error.message)
    return 0
  }

  return data || 0
}