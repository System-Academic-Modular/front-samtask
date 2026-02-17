'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Task, TaskStatus, TaskPriority } from '@/lib/types'

// String de seleção padronizada para trazer categorias e responsáveis
const TASK_SELECT = `
  *,
  category:categories(id, name, color),
  assignee:profiles!assignee_id(full_name, avatar_url)
`

export async function getTasks(filters?: {
  status?: TaskStatus[]
  priority?: TaskPriority[]
  category_id?: string
  is_today?: boolean
  search?: string
  team_id?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized', data: [] }

  let query = supabase.from('tasks').select(TASK_SELECT).is('parent_id', null)

  // Lógica de Contexto: Se tiver team_id, busca do time. Se não, busca pessoal (sem time).
  if (filters?.team_id) {
    query = query.eq('team_id', filters.team_id)
  } else {
    query = query.eq('user_id', user.id).is('team_id', null)
  }

  // Filtros Adicionais
  if (filters?.status?.length) query = query.in('status', filters.status)
  if (filters?.priority?.length) query = query.in('priority', filters.priority)
  if (filters?.category_id) query = query.eq('category_id', filters.category_id)
  if (filters?.search) query = query.ilike('title', `%${filters.search}%`)

  if (filters?.is_today) {
    const today = new Date().toISOString().split('T')[0]
    query = query.eq('due_date', today)
  }

  const { data, error } = await query
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return { error: error.message, data: [] }
  return { data: data as Task[] }
}

export async function createTask(data: Partial<Task>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      ...data,
      user_id: user.id,
    })
    .select(TASK_SELECT)
    .single()

  if (error) return { error: error.message }
  
  revalidatePath('/dashboard', 'layout')
  return { data: task as Task }
}

export async function updateTask(id: string, data: Partial<Task>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  // Lógica de conclusão automática
  const updateData: any = { ...data, updated_at: new Date().toISOString() }
  
  if (data.status === 'done') {
    updateData.completed_at = new Date().toISOString()
  } else if (data.status && (data.status as string) !== 'done') {
    // Usamos 'as string' para evitar o erro de sobreposição do TS
    updateData.completed_at = null
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', id)
    .select(TASK_SELECT)
    .single()

  if (error) return { error: error.message }
  
  revalidatePath('/dashboard', 'layout')
  return { data: task as Task }
}

export async function deleteTask(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('tasks').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard', 'layout')
  return { success: true }
}