'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Task, TaskStatus, TaskPriority } from '@/lib/types'

export async function createTask(data: {
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  due_date?: string
  estimated_minutes?: number
  category_id?: string
  parent_id?: string
  team_id?: string
  assignee_id?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      title: data.title,
      description: data.description || null,
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      due_date: data.due_date || null,
      estimated_minutes: data.estimated_minutes || null,
      category_id: data.category_id || null,
      parent_id: data.parent_id || null,
      team_id: data.team_id || null,
      assignee_id: data.assignee_id || null,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard', 'layout')
  return { data: task }
}

export async function updateTask(id: string, data: Partial<{
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  estimated_minutes: number | null
  actual_minutes: number
  category_id: string | null
  assignee_id: string | null
  position: number
  completed_at: string | null
}>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  if (data.status === 'done' && !data.completed_at) {
    data.completed_at = new Date().toISOString()
  } else if (data.status && data.status !== 'done') {
    data.completed_at = null
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard', 'layout')
  return { data: task }
}

export async function deleteTask(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard', 'layout')
  return { success: true }
}

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

  if (!user) {
    return { error: 'Unauthorized', data: [] }
  }

  let query = supabase
    .from('tasks')
    .select(`
      *,
      category:categories(*),
      subtasks:tasks!parent_id(*)
    `)
    .is('parent_id', null)
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })

  if (filters?.team_id) {
    query = query.eq('team_id', filters.team_id)
  } else {
    query = query.eq('user_id', user.id)
  }

  if (filters?.status && filters.status.length > 0) {
    query = query.in('status', filters.status)
  }

  if (filters?.priority && filters.priority.length > 0) {
    query = query.in('priority', filters.priority)
  }

  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id)
  }

  if (filters?.is_today) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    query = query
      .gte('due_date', today.toISOString())
      .lt('due_date', tomorrow.toISOString())
  }

  if (filters?.search) {
    query = query.ilike('title', `%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) {
    return { error: error.message, data: [] }
  }

  return { data: data as Task[] }
}

export async function getTasksForToday() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized', data: [] }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('user_id', user.id)
    .is('parent_id', null)
    .or(`due_date.gte.${today.toISOString()},due_date.lt.${tomorrow.toISOString()},and(status.neq.done,due_date.is.null)`)
    .order('status', { ascending: true })
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message, data: [] }
  }

  return { data: data as Task[] }
}
