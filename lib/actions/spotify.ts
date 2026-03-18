'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function saveSpotifyTokens(
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Nao autorizado' }

  const expiresAt = Date.now() + expiresIn * 1000
  const nowIso = new Date().toISOString()

  const savePt = await supabase
    .from('integracoes')
    .upsert(
      {
        usuario_id: user.id,
        provedor: 'spotify',
        access_token: accessToken,
        refresh_token: refreshToken,
        expira_em: expiresAt,
        atualizado_em: nowIso,
      },
      { onConflict: 'usuario_id,provedor' },
    )

  if (savePt.error) {
    const saveEn = await supabase
      .from('integrations')
      .upsert(
        {
          user_id: user.id,
          provider: 'spotify',
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt,
          updated_at: nowIso,
        },
        { onConflict: 'user_id,provider' },
      )

    if (saveEn.error) return { error: saveEn.error.message }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function getActiveSpotifyToken() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autorizado' }

  const ptResult = await supabase
    .from('integracoes')
    .select('access_token')
    .eq('usuario_id', user.id)
    .eq('provedor', 'spotify')
    .maybeSingle()

  if (!ptResult.error && ptResult.data?.access_token) {
    return { token: ptResult.data.access_token }
  }

  const enResult = await supabase
    .from('integrations')
    .select('access_token')
    .eq('user_id', user.id)
    .eq('provider', 'spotify')
    .maybeSingle()

  if (enResult.error || !enResult.data?.access_token) {
    return { error: 'Spotify nao conectado' }
  }

  return { token: enResult.data.access_token }
}
