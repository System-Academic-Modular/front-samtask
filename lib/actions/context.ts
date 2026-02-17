'use server'

import { cookies } from 'next/headers'
import {
  TASK_CONTEXT_COOKIE,
  normalizeTaskContextValue,
  type TaskContextValue,
} from '@/lib/task-context-shared'

export async function setTaskContext(nextValue: TaskContextValue | string) {
  const value = normalizeTaskContextValue(
    typeof nextValue === 'string' ? nextValue : 'personal',
  )

  // CORREÇÃO: Adicionado 'await' antes de cookies()
  const cookieStore = await cookies()
  
  cookieStore.set(TASK_CONTEXT_COOKIE, value, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  })

  return { value }
}