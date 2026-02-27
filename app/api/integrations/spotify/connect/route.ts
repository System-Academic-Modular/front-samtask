import { NextResponse } from 'next/server'

const CLIENT_ID = '1ab1a7a9213d4d119a7c72af7a628e12' // Seu ID
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/spotify/callback`
const SCOPES = [
  'user-read-private',
  'user-read-email',
  'playlist-read-private',
  'user-modify-playback-state',
  'user-read-playback-state',
  'user-read-currently-playing'
].join(' ')

export async function GET() {
  const spotifyUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${CLIENT_ID}&scope=${encodeURIComponent(SCOPES)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`
  
  return NextResponse.redirect(spotifyUrl)
}