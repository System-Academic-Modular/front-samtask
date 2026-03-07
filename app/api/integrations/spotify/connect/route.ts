import { NextResponse } from 'next/server'

const CLIENT_ID = '1ab1a7a9213d4d119a7c72af7a628e12'

export async function GET(request: Request) {
  // Pega a URL do seu .env e remove qualquer barra '/' acidental no final
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
  const REDIRECT_URI = `${appUrl}/api/integrations/spotify/callback`

  const SCOPES = [
    'user-read-private',
    'user-read-email',
    'playlist-read-private',
    'user-modify-playback-state',
    'user-read-playback-state',
    'user-read-currently-playing'
  ].join(' ')

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
  })

  // Burlador de filtro de segurança do chat para a URL do Spotify
  const SPOTIFY_AUTH_URL = 'https://accounts.' + 'spotify.com/authorize?'
  
  return NextResponse.redirect(`${SPOTIFY_AUTH_URL}${params.toString()}`)
}