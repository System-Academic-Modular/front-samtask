'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Task, TaskPriority, TaskStatus } from '@/lib/types'

// ----------------------------------------------------------------------
// CONSTANTES E CONFIGURAÇÕES TÁTICAS
// ----------------------------------------------------------------------

const TASK_SELECT = `
  *,
  category:categories(id, name, color),
  assignee:profiles!assignee_id(id, full_name, avatar_url)
`

// Algoritmo de Repetição Espaçada Padrão (Dias)
const REVIEW_INTERVALS = [7, 30] as const

// Multiplicadores de Gamificação
const PRIORITY_MULTIPLIER: Record<TaskPriority, number> = {
  low: 1.0,
  medium: 1.2,
  high: 1.5,
  urgent: 2.0,
}

// ----------------------------------------------------------------------
// FUNÇÕES AUXILIARES (HELPERS)
// ----------------------------------------------------------------------

function normalizePriority(priority?: TaskPriority | null): TaskPriority {
  if (!priority) return 'medium'
  return priority === 'urgent' ? 'high' : priority
}

function getBaseTitle(title: string) {
  // Limpa prefixos de revisões anteriores para não acumular "Revisão · Revisão · Título"
  return title.replace(/^(Revisão Espaçada · |Revisão Rápida · |Revisao Rapida · )+/, '')
}

// ----------------------------------------------------------------------
// MOTOR DE GAMIFICAÇÃO (DISTRIBUIÇÃO DE XP)
// ----------------------------------------------------------------------

async function awardTaskXP(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  cognitiveLoad: number,
  priority: TaskPriority
) {
  // Cálculo: Base (10) * Carga Mental (1 a 5) * Multiplicador de Prioridade
  const baseXP = 10
  const earnedXP = Math.round(baseXP * cognitiveLoad * PRIORITY_MULTIPLIER[priority])

  // Puxa o perfil atual
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, xp, current_level')
    .eq('id', userId)
    .single()

  if (!profile) return

  const currentXP = profile.xp || 0
  let currentLevel = profile.current_level || 1
  const newXP = currentXP + earnedXP

  // Lógica de Level Up (Exemplo: 100 XP para o Nível 2, 300 para Nível 3, etc)
  const xpForNextLevel = currentLevel * 100
  if (newXP >= xpForNextLevel) {
    currentLevel += 1
  }

  // Salva no banco
  await supabase
    .from('profiles')
    .update({ xp: newXP, current_level: currentLevel })
    .eq('id', userId)
}

// ----------------------------------------------------------------------
// ALGORITMO DE REPETIÇÃO ESPAÇADA
// ----------------------------------------------------------------------

async function hasReviewTaskForInterval(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  title: string,
  dueDateISO: string,
  teamId?: string | null
) {
  const start = new Date(dueDateISO)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  let query = supabase
    .from('tasks')
    .select('id')
    .eq('user_id', userId)
    .eq('title', title)
    .gte('due_date', start.toISOString())
    .lt('due_date', end.toISOString())
    .limit(1)

  if (teamId) query = query.eq('team_id', teamId)
  else query = query.is('team_id', null)

  const { data } = await query
  return Boolean(data && data.length > 0)
}

async function createSpacedReviewTasks(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sourceTask: Task,
  completedAtISO: string
) {
  const baseTitle = getBaseTitle(sourceTask.title)
  const reviewTitle = `Revisão Espaçada · ${baseTitle}`

  for (const intervalDays of REVIEW_INTERVALS) {
    const dueDate = new Date(completedAtISO)
    dueDate.setDate(dueDate.getDate() + intervalDays)

    const alreadyExists = await hasReviewTaskForInterval(
      supabase,
      sourceTask.user_id,
      reviewTitle,
      dueDate.toISOString(),
      sourceTask.team_id
    )

    if (alreadyExists) continue

    // Insere direto na nova coluna 'review' com carga mental e tempo reduzidos
    const { error } = await supabase.from('tasks').insert({
      user_id: sourceTask.user_id,
      team_id: sourceTask.team_id ?? null,
      category_id: sourceTask.category_id ?? null,
      title: reviewTitle,
      description: sourceTask.description
        ? `Revisão programada pelo sistema (${intervalDays} dias pós-estudo).\n\nOriginal: ${sourceTask.description}`
        : `Revisão programada pelo sistema (${intervalDays} dias pós-estudo).`,
      status: 'review', // <--- AGORA VAI PARA A COLUNA NOVA DO KANBAN
      priority: normalizePriority(sourceTask.priority),
      due_date: dueDate.toISOString(),
      estimated_minutes: Math.max(5, Math.floor((sourceTask.estimated_minutes ?? 20) / 2)), // Revisa na metade do tempo
      is_recurring: false,
      cognitive_load: Math.max(1, (sourceTask.cognitive_load ?? 3) - 1), // Revisa gasta menos bateria
    })

    if (error) {
      console.error('[Sistema Neural] Falha ao injetar revisão no banco:', error.message)
    }
  }
}

// ----------------------------------------------------------------------
// EXPORTAÇÕES: CRUD PRINCIPAL (SERVER ACTIONS)
// ----------------------------------------------------------------------

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

  if (!user) return { error: 'Acesso negado aos satélites.', data: [] as Task[] }

  let query = supabase.from('tasks').select(TASK_SELECT).is('parent_id', null)

  if (filters?.team_id) query = query.eq('team_id', filters.team_id)
  else query = query.eq('user_id', user.id).is('team_id', null)

  if (filters?.status?.length) query = query.in('status', filters.status)
  if (filters?.priority?.length) query = query.in('priority', filters.priority)
  if (filters?.category_id) query = query.eq('category_id', filters.category_id)
  if (filters?.search) query = query.ilike('title', `%${filters.search}%`)

  if (filters?.is_today) {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    query = query.gte('due_date', start.toISOString()).lt('due_date', end.toISOString())
  }

  const { data, error } = await query
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return { error: error.message, data: [] as Task[] }
  return { data: (data || []) as Task[] }
}

export async function createTask(data: Partial<Task>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Link Neural perdido. Faça login novamente.' }

  const payload = {
    ...data,
    user_id: user.id,
    cognitive_load: data.cognitive_load || 3, // Padrão seguro
  }

  const { data: task, error } = await supabase.from('tasks').insert(payload).select(TASK_SELECT).single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard', 'layout')
  return { data: task as Task }
}

export async function updateTask(id: string, data: Partial<Task>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Link Neural perdido.' }

  // Busca a tarefa antes de atualizar para comparar estados
  const { data: currentTask, error: currentTaskError } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single()

  if (currentTaskError || !currentTask) return { error: 'Módulo não encontrado no setor.' }

  const updateData: Record<string, unknown> = {
    ...data,
    updated_at: new Date().toISOString(),
  }

  // Regra de Conclusão: Se mudou para DONE agora
  const isJustCompleted = data.status === 'done' && currentTask.status !== 'done'
  
  if (isJustCompleted) {
    updateData.completed_at = new Date().toISOString()
  } else if (data.status && data.status !== 'done') {
    updateData.completed_at = null
  }

  const { data: updatedTask, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', id)
    .select(TASK_SELECT)
    .single()

  if (error) return { error: error.message }

  // Gatilhos Pós-Conclusão (XP e Revisões)
  if (isJustCompleted) {
    // 1. Injeta XP na conta do usuário
    await awardTaskXP(
      supabase, 
      currentTask.user_id, 
      currentTask.cognitive_load || 3, 
      currentTask.priority || 'medium'
    )

    // 2. Prepara as sementes de revisão para o futuro
    await createSpacedReviewTasks(
      supabase, 
      currentTask as Task, 
      (updatedTask.completed_at as string) || new Date().toISOString()
    )
  }

  revalidatePath('/dashboard', 'layout')
  return { data: updatedTask as Task }
}

export async function deleteTask(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Link Neural perdido.' }

  const { error } = await supabase.from('tasks').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard', 'layout')
  return { success: true }
}