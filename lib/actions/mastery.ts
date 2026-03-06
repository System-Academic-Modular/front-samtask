'use server'

import { createClient } from '@/lib/supabase/server'

export type MasteryStatus = {
  id: string
  category_id: string
  category_name: string
  category_color: string
  score: number
  state: 'learning' | 'mastered' | 'forgetting'
  last_study_date: string
}

export async function getMasteryStatus(): Promise<MasteryStatus[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []

  const { data, error } = await supabase
    .from('mastery_status')
    .select('*')
    .eq('user_id', user.id)
    .order('score', { ascending: false })

  if (error) {
    console.error('Erro ao buscar maestria:', error)
    return []
  }

  return data as MasteryStatus[]
}