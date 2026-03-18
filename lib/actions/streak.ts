'use server'

import { createClient } from '@/lib/supabase/server'

function computeDailyStreak(sessionDates: string[]) {
  if (!sessionDates.length) return 0

  const days = new Set(
    sessionDates.map((value) => {
      const d = new Date(value)
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    }),
  )

  let cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  if (!days.has(cursor.getTime())) {
    cursor.setDate(cursor.getDate() - 1)
  }

  let streak = 0
  while (days.has(cursor.getTime())) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

export async function getUserStreak() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return 0

  const rpcResponse = await supabase.rpc('calculate_streak', {
    user_uuid: user.id,
  })

  if (!rpcResponse.error) {
    return rpcResponse.data || 0
  }

  // Fallback: calcula streak direto pela tabela em português
  const { data: sessions } = await supabase
    .from('sessoes_pomodoro')
    .select('concluido_em')
    .eq('usuario_id', user.id)
    .eq('tipo', 'foco')
    .order('concluido_em', { ascending: false })
    .limit(180)

  return computeDailyStreak((sessions || []).map((item) => item.concluido_em))
}
