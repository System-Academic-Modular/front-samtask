import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { saveSpotifyTokens } from '@/lib/actions/spotify'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (!code) return NextResponse.redirect('/dashboard/settings?error=spotify_denied')

  // Troca o CODE pelo ACCESS_TOKEN
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(
        '1ab1a7a9213d4d119a7c72af7a628e12' + ':' + process.env.SPOTIFY_CLIENT_SECRET
      ).toString('base64'),
    },
    body: new URLSearchParams({
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/spotify/callback`,
      grant_type: 'authorization_code',
    }),
  })

  const data = await response.json()

  if (data.access_token) {
    await saveSpotifyTokens(data.access_token, data.refresh_token, data.expires_in)
    return NextResponse.redirect('/dashboard/settings?success=spotify_connected')
  }

  return NextResponse.redirect('/dashboard/settings?error=token_exchange_failed')
}