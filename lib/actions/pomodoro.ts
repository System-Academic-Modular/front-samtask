'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { TipoPomodoro } from '@/lib/types'

export async function savePomodoroSession(data: {
  task_id?: string | null
  duration_minutes: number
  type: TipoPomodoro
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Não autorizado' }

  const { data: session, error } = await supabase
    .from('sessoes_pomodoro') // ATUALIZADO (Precisa garantir que esta tabela exista no banco em PT)
    .insert({
      usuario_id: user.id, // ATUALIZADO
      tarefa_id: data.task_id ?? null, // ATUALIZADO
      duracao_minutos: data.duration_minutes, // ATUALIZADO
      tipo: data.type,
      concluido_em: new Date().toISOString(), // ATUALIZADO
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard/reports')
  revalidatePath('/dashboard/pomodoro')

  return { data: session, error: null as null }
}