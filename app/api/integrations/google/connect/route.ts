import { google } from 'googleapis'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Configura o cliente OAuth2
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`
  )

  // Gera a URL de consentimento
  const scopes = [
    'https://www.googleapis.com/auth/calendar', // Acesso total à agenda
    'https://www.googleapis.com/auth/userinfo.email' // Para confirmar quem é
  ]

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Importante para receber o refresh_token
    scope: scopes,
    prompt: 'consent', // Força pedir consentimento para garantir o refresh_token
    state: user.id // Passamos o ID do usuário para segurança extra (opcional)
  })

  return redirect(url)
}