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

  if (error || !data) {
    return []
  }

  return data.map((item: any) => ({
    id: item.id,
    category_id: item.category_id,
    category_name: item.category_name || item.categoria_nome || 'Geral',
    category_color: item.category_color || item.categoria_cor || '#8b5cf6',
    score: Number(item.score ?? item.pontuacao ?? 0),
    state:
      Number(item.score ?? item.pontuacao ?? 0) >= 80
        ? 'mastered'
        : Number(item.score ?? item.pontuacao ?? 0) <= 40
          ? 'forgetting'
          : 'learning',
    last_study_date: item.last_study_date || item.last_session_at || item.data_ultimo_estudo || '',
  })) as MasteryStatus[]
}
