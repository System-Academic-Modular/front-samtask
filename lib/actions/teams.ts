'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Tipos para o formulário
export type TeamActionState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  fieldErrors?: {
    name?: string
    description?: string
    code?: string
  }
}

// Schemas de Validação
const createSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  description: z.string().optional(),
})

const joinSchema = z.object({
  code: z.string().length(6, 'O código deve ter exatos 6 caracteres.'),
})

// --- CRIAÇÃO DE TIME ---
export async function createTeam(prevState: TeamActionState, formData: FormData): Promise<TeamActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { status: 'error', message: 'Usuário não autenticado.' }

  const data = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
  }

  const validation = createSchema.safeParse(data)
  if (!validation.success) {
    return {
      status: 'error',
      fieldErrors: validation.error.flatten().fieldErrors as any
    }
  }

  // Gera um código aleatório (ex: X9K2P1)
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()

  // 1. Criar o time
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({
      name: data.name,
      description: data.description,
      owner_id: user.id,
      invite_code: inviteCode
    })
    .select()
    .single()

  if (teamError) {
    console.error('Erro ao criar time:', teamError)
    return { status: 'error', message: 'Erro ao criar equipe.' }
  }

  // 2. Adicionar o criador como Dono/Admin
  const { error: memberError } = await supabase
    .from('team_members')
    .insert({
      team_id: team.id,
      user_id: user.id,
      role: 'admin' // Mudado para 'admin' para bater com a lógica da UI (que checa role === 'admin')
    })

  if (memberError) {
    console.error('Erro ao adicionar membro:', memberError)
  }

  revalidatePath('/dashboard/teams')
  return { status: 'success', message: 'Equipe criada com sucesso!' }
}

// --- ENTRAR EM TIME ---
export async function joinTeam(prevState: TeamActionState, formData: FormData): Promise<TeamActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { status: 'error', message: 'Usuário não autenticado.' }

  const code = (formData.get('code') as string)?.toUpperCase().trim()
  
  const validation = joinSchema.safeParse({ code })

  if (!validation.success) {
    return { status: 'error', fieldErrors: { code: validation.error.flatten().fieldErrors.code?.[0] } }
  }

  // 1. Buscar time pelo código direto na tabela
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('id, name')
    .eq('invite_code', code)
    .single()

  if (teamError || !team) {
    return { status: 'error', message: 'Código inválido ou equipe não encontrada.' }
  }

  // 2. Verificar se já é membro
  const { data: existingMember } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', team.id)
    .eq('user_id', user.id)
    .single()

  if (existingMember) {
    return { status: 'error', message: 'Você já faz parte desta equipe.' }
  }

  // 3. Entrar no time
  const { error: joinError } = await supabase
    .from('team_members')
    .insert({
      team_id: team.id,
      user_id: user.id,
      role: 'member'
    })

  if (joinError) {
    return { status: 'error', message: 'Erro ao entrar na equipe.' }
  }

  revalidatePath('/dashboard/teams')
  return { status: 'success', message: `Bem-vindo à equipe ${team.name}!` }
}

// --- REGENERAR CÓDIGO (NOVO) ---
// Essa função não usa prevState pois é chamada via onClick, não form submit
export async function regenerateTeamCode(teamId: string) {
  const supabase = await createClient()
  
  // Verifica se o usuário é admin desse time antes de mudar
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  const { data: member } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .single()

  if (member?.role !== 'admin' && member?.role !== 'owner') {
    return { error: 'Apenas admins podem regenerar o código.' }
  }

  // Gera novo código
  const newCode = Math.random().toString(36).substring(2, 8).toUpperCase()

  const { error } = await supabase
    .from('teams')
    .update({ invite_code: newCode })
    .eq('id', teamId)

  if (error) return { error: 'Erro ao atualizar código' }
  
  revalidatePath('/dashboard/teams')
  return { success: true, newCode }
}