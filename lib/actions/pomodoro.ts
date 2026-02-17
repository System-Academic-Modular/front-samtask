'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function savePomodoroSession(data: {
  task_id?: string | null
  duration_minutes: number
  type: 'work' | 'short_break' | 'long_break'
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Não autorizado' }

  const { data: session, error } = await supabase
    .from('pomodoro_sessions')
    .insert({
      user_id: user.id,
      task_id: data.task_id,
      duration_minutes: data.duration_minutes,
      type: data.type,
      completed_at: new Date().toISOString()
    })
    .select()
    .single()

  revalidatePath('/dashboard/reports')
  return { data: session, error }
}