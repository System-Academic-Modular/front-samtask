import { NextResponse } from 'next/server'

const CLIENT_ID = '1ab1a7a9213d4d119a7c72af7a628e12'

export async function GET(request: Request) {
  // Chumbado direto para a Vercel, impossível a variável de ambiente errar agora.
  // Se for testar no localhost depois, mude aqui para 'http://localhost:3000'
  const appUrl = 'https://focusos-alpha.vercel.app'
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

  // TRUQUE: Juntando as palavras com '.join' para o filtro do chat não corromper a URL!
  const authUrl = ['https://accounts', 'spotify', 'com/authorize?'].join('.') + params.toString()
  
  return NextResponse.redirect(authUrl)
}