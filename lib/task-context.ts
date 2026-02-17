import 'server-only'

import { cookies } from 'next/headers'
import {
  TASK_CONTEXT_COOKIE,
  normalizeTaskContextValue,
  parseTaskContext,
  type TaskContext,
  type TaskContextValue,
} from '@/lib/task-context-shared'

// Agora é assíncrona (async) e retorna uma Promise
export async function getTaskContextValue(): Promise<TaskContextValue> {
  const cookieStore = await cookies() // AWAIT é obrigatório aqui
  const value = cookieStore.get(TASK_CONTEXT_COOKIE)?.value
  return normalizeTaskContextValue(value)
}

// Agora é assíncrona (async) e retorna uma Promise
export async function getTaskContext(): Promise<TaskContext> {
  const cookieStore = await cookies() // AWAIT é obrigatório aqui
  const value = cookieStore.get(TASK_CONTEXT_COOKIE)?.value
  return parseTaskContext(value)
}