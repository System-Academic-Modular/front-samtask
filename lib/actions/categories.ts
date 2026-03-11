'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { CreateCategoryInput, UpdateCategoryInput } from '@/lib/types'

export async function createCategory(input: CreateCategoryInput) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) return { error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('categorias')
    .insert({
      usuario_id: user.id,
      nome: input.nome, 
      cor: input.cor,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard', 'layout')
  return { data }
}

export async function updateCategory(categoryId: string, input: UpdateCategoryInput) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) return { error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('categorias')
    .update({
      nome: input.nome,
      cor: input.cor,
    })
    .eq('id', categoryId)
    .eq('usuario_id', user.id)
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard', 'layout')
  return { data }
}

export async function deleteCategory(categoryId: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) return { error: 'Não autenticado' }

  // Primeiro, remove a referência da categoria em todas as tarefas
  await supabase
    .from('tarefas')
    .update({ categoria_id: null })
    .eq('categoria_id', categoryId)
    .eq('usuario_id', user.id)

  const { error } = await supabase
    .from('categorias')
    .delete()
    .eq('id', categoryId)
    .eq('usuario_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard', 'layout')
  return { success: true }
}