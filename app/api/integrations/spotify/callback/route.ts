import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { saveSpotifyTokens } from '@/lib/actions/spotify'

const CLIENT_ID = '1ab1a7a9213d4d119a7c72af7a628e12'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  
  // A mesma blindagem com a URL do seu .env
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
  const REDIRECT_URI = `${appUrl}/api/integrations/spotify/callback`
  
  if (!code) return NextResponse.redirect(`${appUrl}/dashboard/settings?error=spotify_denied`)

  const SPOTIFY_TOKEN_URL = 'https://accounts.' + 'spotify.com/api/token'

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(
        CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
      ).toString('base64'),
    },
    body: new URLSearchParams({
      code,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  })

  const data = await response.json()

  if (data.access_token) {
    await saveSpotifyTokens(data.access_token, data.refresh_token, data.expires_in)
    return NextResponse.redirect(`${appUrl}/dashboard/settings?success=spotify_connected`)
  }

  return NextResponse.redirect(`${appUrl}/dashboard/settings?error=token_failed`)
}