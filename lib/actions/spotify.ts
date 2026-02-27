'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveSpotifyTokens(accessToken: string, refreshToken: string, expiresIn: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  const { error } = await supabase
    .from('integrations')
    .upsert({
      user_id: user.id,
      provider: 'spotify',
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
    })

  revalidatePath('/dashboard/settings')
  return { success: true }
}