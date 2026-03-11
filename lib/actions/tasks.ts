'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Tarefa, PrioridadeTarefa, StatusTarefa } from '@/lib/types'

// ----------------------------------------------------------------------
// CONSTANTES E CONFIGURAÇÕES TÁTICAS
// ----------------------------------------------------------------------

const TASK_SELECT = `
  *,
  categoria:categorias(id, nome, cor),
  atribuido:perfis!atribuido_a(id, nome_completo, avatar_url)
`

// Algoritmo de Repetição Espaçada Padrão (Dias)
const REVIEW_INTERVALS = [7, 30] as const

// Multiplicadores de Gamificação
const PRIORITY_MULTIPLIER: Record<PrioridadeTarefa, number> = {
  baixa: 1.0,
  media: 1.2,
  alta: 1.5,
  urgente: 2.0,
}

// ----------------------------------------------------------------------
// FUNÇÕES AUXILIARES (HELPERS)
// ----------------------------------------------------------------------

function normalizePriority(priority?: PrioridadeTarefa | null): PrioridadeTarefa {
  if (!priority) return 'media'
  return priority === 'urgente' ? 'alta' : priority
}

function getBaseTitle(title: string) {
  // Limpa prefixos de revisões anteriores para não acumular
  return title.replace(/^(Revisão Espaçada · |Revisão Rápida · |Revisao Rapida · )+/, '')
}

// ----------------------------------------------------------------------
// MOTOR DE GAMIFICAÇÃO (DISTRIBUIÇÃO DE XP)
// ----------------------------------------------------------------------

async function awardTaskXP(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  cognitiveLoad: number,
  priority: PrioridadeTarefa
) {
  // Cálculo: Base (10) * Carga Mental (1 a 5) * Multiplicador de Prioridade
  const baseXP = 10
  const earnedXP = Math.round(baseXP * cognitiveLoad * PRIORITY_MULTIPLIER[priority])

  // Puxa o perfil atual
  const { data: profile } = await supabase
    .from('perfis')
    .select('id, xp, nivel_atual')
    .eq('id', userId)
    .single()

  if (!profile) return

  const currentXP = profile.xp || 0
  let currentLevel = profile.nivel_atual || 1
  const newXP = currentXP + earnedXP

  // Lógica de Level Up (Exemplo: 100 XP para o Nível 2, 300 para Nível 3, etc)
  const xpForNextLevel = currentLevel * 100
  if (newXP >= xpForNextLevel) {
    currentLevel += 1
  }

  // Salva no banco
  await supabase
    .from('perfis')
    .update({ xp: newXP, nivel_atual: currentLevel })
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
    .from('tarefas')
    .select('id')
    .eq('usuario_id', userId)
    .eq('titulo', title)
    .gte('data_vencimento', start.toISOString())
    .lt('data_vencimento', end.toISOString())
    .limit(1)

  if (teamId) query = query.eq('equipe_id', teamId)
  else query = query.is('equipe_id', null)

  const { data } = await query
  return Boolean(data && data.length > 0)
}

async function createSpacedReviewTasks(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sourceTask: Tarefa,
  completedAtISO: string
) {
  const baseTitle = getBaseTitle(sourceTask.titulo)
  const reviewTitle = `Revisão Espaçada · ${baseTitle}`

  for (const intervalDays of REVIEW_INTERVALS) {
    const dueDate = new Date(completedAtISO)
    dueDate.setDate(dueDate.getDate() + intervalDays)

    const alreadyExists = await hasReviewTaskForInterval(
      supabase,
      sourceTask.usuario_id,
      reviewTitle,
      dueDate.toISOString(),
      sourceTask.equipe_id
    )

    if (alreadyExists) continue

    // Insere direto na nova coluna 'revisao' com carga mental e tempo reduzidos
    const { error } = await supabase.from('tarefas').insert({
      usuario_id: sourceTask.usuario_id,
      equipe_id: sourceTask.equipe_id ?? null,
      categoria_id: sourceTask.categoria_id ?? null,
      titulo: reviewTitle,
      descricao: sourceTask.descricao
        ? `Revisão programada pelo sistema (${intervalDays} dias pós-estudo).\n\nOriginal: ${sourceTask.descricao}`
        : `Revisão programada pelo sistema (${intervalDays} dias pós-estudo).`,
      status: 'revisao', 
      prioridade: normalizePriority(sourceTask.prioridade),
      data_vencimento: dueDate.toISOString(),
      minutos_estimados: Math.max(5, Math.floor((sourceTask.minutos_estimados ?? 20) / 2)),
      carga_mental: Math.max(1, (sourceTask.carga_mental ?? 3) - 1),
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
  status?: StatusTarefa[]
  priority?: PrioridadeTarefa[]
  category_id?: string
  is_today?: boolean
  search?: string
  team_id?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Acesso negado aos satélites.', data: [] as Tarefa[] }

  let query = supabase.from('tarefas').select(TASK_SELECT).is('tarefa_pai_id', null)

  if (filters?.team_id) query = query.eq('equipe_id', filters.team_id)
  else query = query.eq('usuario_id', user.id).is('equipe_id', null)

  if (filters?.status?.length) query = query.in('status', filters.status)
  if (filters?.priority?.length) query = query.in('prioridade', filters.priority)
  if (filters?.category_id) query = query.eq('categoria_id', filters.category_id)
  if (filters?.search) query = query.ilike('titulo', `%${filters.search}%`)

  if (filters?.is_today) {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    query = query.gte('data_vencimento', start.toISOString()).lt('data_vencimento', end.toISOString())
  }

  const { data, error } = await query
    .order('criado_em', { ascending: false })

  if (error) return { error: error.message, data: [] as Tarefa[] }
  return { data: (data || []) as Tarefa[] }
}

export async function createTask(data: Partial<Tarefa>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Link Neural perdido. Faça login novamente.' }

  const payload = {
    ...data,
    usuario_id: user.id,
    carga_mental: data.carga_mental || 3, // Padrão seguro
  }

  const { data: task, error } = await supabase.from('tarefas').insert(payload).select(TASK_SELECT).single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard', 'layout')
  return { data: task as Tarefa }
}

export async function updateTask(id: string, data: Partial<Tarefa>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Link Neural perdido.' }

  // Busca a tarefa antes de atualizar para comparar estados
  const { data: currentTask, error: currentTaskError } = await supabase
    .from('tarefas')
    .select('*')
    .eq('id', id)
    .single()

  if (currentTaskError || !currentTask) return { error: 'Módulo não encontrado no setor.' }

  const updateData: Record<string, unknown> = {
    ...data,
    atualizado_em: new Date().toISOString(),
  }

  // Regra de Conclusão: Se mudou para CONCLUÍDA agora
  const isJustCompleted = data.status === 'concluida' && currentTask.status !== 'concluida'
  
  if (isJustCompleted) {
    updateData.data_conclusao = new Date().toISOString()
  } else if (data.status && data.status !== 'concluida') {
    updateData.data_conclusao = null
  }

  const { data: updatedTask, error } = await supabase
    .from('tarefas')
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
      currentTask.usuario_id, 
      currentTask.carga_mental || 3, 
      currentTask.prioridade || 'media'
    )

    // 2. Prepara as sementes de revisão para o futuro
    await createSpacedReviewTasks(
      supabase, 
      currentTask as Tarefa, 
      (updatedTask.data_conclusao as string) || new Date().toISOString()
    )
  }

  revalidatePath('/dashboard', 'layout')
  return { data: updatedTask as Tarefa }
}

export async function deleteTask(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Link Neural perdido.' }

  const { error } = await supabase.from('tarefas').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard', 'layout')
  return { success: true }
}