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

  // 1. Criar o time
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({
      name: data.name,
      description: data.description,
      owner_id: user.id
    })
    .select()
    .single()

  if (teamError) {
    console.error('Erro ao criar time:', teamError)
    return { status: 'error', message: 'Erro ao criar equipe.' }
  }

  // 2. Adicionar o criador como Dono
  const { error: memberError } = await supabase
    .from('team_members')
    .insert({
      team_id: team.id,
      user_id: user.id,
      role: 'owner'
    })

  if (memberError) {
    console.error('Erro ao adicionar membro:', memberError)
    // Nota: O time foi criado, mas o vínculo falhou. Idealmente trataríamos isso.
  }

  revalidatePath('/dashboard/teams')
  return { status: 'success', message: 'Equipe criada com sucesso!' }
}

export async function joinTeam(prevState: TeamActionState, formData: FormData): Promise<TeamActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { status: 'error', message: 'Usuário não autenticado.' }

  const code = formData.get('code') as string
  const validation = joinSchema.safeParse({ code })

  if (!validation.success) {
    return { status: 'error', fieldErrors: { code: validation.error.flatten().fieldErrors.code?.[0] } }
  }

  // 1. Buscar time pelo código (usando RPC seguro se tiver, ou select direto)
  // Assumindo que criamos a função 'get_team_by_code' no banco anteriormente.
  // Se não, use um select normal (mas o RLS pode impedir a visualização).
  const { data: team, error: teamError } = await supabase
    .rpc('get_team_by_code', { code_input: code })

  // O retorno do RPC pode variar, vamos garantir
  const foundTeam = Array.isArray(team) ? team[0] : team

  if (teamError || !foundTeam) {
    return { status: 'error', message: 'Código inválido ou equipe não encontrada.' }
  }

  // 2. Entrar no time
  const { error: joinError } = await supabase
    .from('team_members')
    .insert({
      team_id: foundTeam.id,
      user_id: user.id,
      role: 'member'
    })

  if (joinError) {
    if (joinError.code === '23505') return { status: 'error', message: 'Você já faz parte desta equipe.' }
    return { status: 'error', message: 'Erro ao entrar na equipe.' }
  }

  revalidatePath('/dashboard/teams')
  return { status: 'success', message: `Bem-vindo à equipe ${foundTeam.name}!` }
}