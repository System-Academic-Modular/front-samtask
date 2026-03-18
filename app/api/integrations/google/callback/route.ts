import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=google_auth_failed`)
  }

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/login`)
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`
    )

    // Troca o código pelos tokens
    const { tokens } = await oauth2Client.getToken(code)

    const nowIso = new Date().toISOString()

    const savePt = await supabase
      .from('integracoes')
      .upsert(
        {
          usuario_id: user.id,
          provedor: 'google_calendar',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expira_em: tokens.expiry_date,
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
            provider: 'google_calendar',
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: tokens.expiry_date,
            updated_at: nowIso,
          },
          { onConflict: 'user_id,provider' },
        )

      if (saveEn.error) {
        console.error('Erro ao salvar tokens:', saveEn.error)
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=db_save_failed`)
      }
    }

    // Sucesso! Volta pro dashboard com flag de sucesso
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=google_connected`)

  } catch (err) {
    console.error('Erro na troca de tokens:', err)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=token_exchange_failed`)
  }
}
