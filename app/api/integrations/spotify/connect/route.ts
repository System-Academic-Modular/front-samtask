import { NextResponse } from 'next/server'

const CLIENT_ID = '1ab1a7a9213d4d119a7c72af7a628e12'

export async function GET(request: Request) {
  // BLINDAGEM: Se estiver na Vercel usa HTTPS, se estiver no PC usa HTTP.
  const isProd = process.env.NODE_ENV === 'production'
  const REDIRECT_URI = isProd 
    ? `https://${process.env.VERCEL_URL || 'https://focusos-alpha.vercel.app/'}/api/integrations/spotify/callback`
    : 'https://localhost:3000/api/integrations/spotify/callback'

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

  return NextResponse.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`)
}