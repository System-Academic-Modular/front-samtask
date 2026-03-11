'use client'

import { useState, useEffect, useCallback } from 'react'
import { SkipBack, SkipForward, Play, Pause, Music2, Loader2, Radio } from 'lucide-react'
import { getActiveSpotifyToken } from '@/lib/actions/spotify'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

// 1. Exportando o tipo para o ZenMode não quebrar
export type SpotifyPreset = 'focus' | 'lofi' | 'brown-noise' | 'guided-breathing'

interface SpotifyTrack {
  name: string
  artists: { name: string }[]
  album: { images: { url: string }[] }
}

// 2. Props agora aceitam o preset opcional
interface SpotifyPlayerProps {
  preset?: SpotifyPreset
}

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1/me/player'

const PLAYLISTS: Record<SpotifyPreset, string> = {
  'focus': 'spotify:playlist:37i9dQZF1DWZeKwsYwPXYm',
  'lofi': 'spotify:playlist:37i9dQZF1DWWQRwovXQM9n',
  'brown-noise': 'spotify:playlist:37i9dQZF1DX4YAnS9vXvfs',
  'guided-breathing': 'spotify:playlist:37i9dQZF1DX09O8R_T83uE'
}

export function SpotifyPlayer({ preset }: SpotifyPlayerProps) {
  const [token, setToken] = useState<string | null>(null)
  const [track, setTrack] = useState<SpotifyTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    getActiveSpotifyToken().then((res) => {
      if (res.token) {
        setToken(res.token)
        setIsConnected(true)
      } else {
        setIsConnected(false)
      }
      setIsInitializing(false)
    })
  }, [])

  const fetchCurrentTrack = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch(`${SPOTIFY_API_BASE}/currently-playing`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (res.status === 200) {
        const data = await res.json()
        setTrack(data.item)
        setIsPlaying(data.is_playing)
      } else if (res.status === 204) {
        setTrack(null)
        setIsPlaying(false)
      }
    } catch (e) {
      console.error("Erro ao buscar música:", e)
    }
  }, [token])

  // 3. Efeito para trocar de playlist quando o preset mudar (ex: Botão Pânico)
  useEffect(() => {
    if (preset && token && isConnected) {
      playUri(PLAYLISTS[preset])
    }
  }, [preset, token, isConnected])

  const playUri = async (uri: string) => {
    if (!token) return
    try {
      await fetch(`${SPOTIFY_API_BASE}/play`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ context_uri: uri })
      })
      setTimeout(fetchCurrentTrack, 500)
    } catch (e) {
      toast.error("Erro ao trocar frequência")
    }
  }

  useEffect(() => {
    if (!token) return
    fetchCurrentTrack()
    const interval = setInterval(fetchCurrentTrack, 5000)
    return () => clearInterval(interval)
  }, [fetchCurrentTrack, token])

  const handlePlayback = async (action: 'play' | 'pause' | 'next' | 'previous') => {
    if (!token) return
    try {
      const endpointMap = {
        play: '/play',
        pause: '/pause',
        next: '/next',
        previous: '/previous'
      }

      const method = action === 'next' || action === 'previous' ? 'POST' : 'PUT'
      const res = await fetch(`${SPOTIFY_API_BASE}${endpointMap[action]}`, {
        method,
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (res.status === 403) {
        toast.error("Controle requer Spotify Premium")
        return
      }

      if (action === 'play') setIsPlaying(true)
      if (action === 'pause') setIsPlaying(false)
      
      setTimeout(fetchCurrentTrack, 600)
    } catch (e) {
      toast.error("Falha na sincronização")
    }
  }

  // ... (Renders de Loading e Disconnected permanecem os mesmos que você enviou)
  if (isInitializing) return <div className="h-[88px] flex items-center justify-center bg-black/20 rounded-[24px]"><Loader2 className="animate-spin text-brand-violet" /></div>
  
  if (isConnected === false) {
     return (
       <div className="glass-panel border-white/5 p-4 rounded-[24px] flex items-center justify-between bg-black/40 backdrop-blur-xl w-full">
         <div className="flex items-center gap-3">
           <Music2 className="w-5 h-5 text-brand-violet/40" />
           <span className="text-xs font-bold text-white/60 italic">Sincronização Offline</span>
         </div>
         <Button 
           size="sm" 
           className="h-8 text-[10px] font-black uppercase bg-brand-violet/10 text-brand-violet border border-brand-violet/20"
           onClick={() => window.location.href = '/api/integrations/spotify/connect'}
         >
           Link Neural
         </Button>
       </div>
     )
  }

  // Render principal quando não há track tocando
  if (!track) {
    return (
      <div className="glass-panel border-white/5 p-4 rounded-[24px] flex items-center gap-4 bg-black/40 backdrop-blur-xl w-full">
        <Radio className="w-5 h-5 text-brand-violet animate-pulse" />
        <div className="flex-1">
          <h4 className="text-sm font-bold text-white/40">Silêncio Absoluto</h4>
          <p className="text-[9px] text-white/20 uppercase tracking-widest">Aguardando sinal do player...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-panel border-white/10 p-3 md:p-4 rounded-[24px] flex items-center gap-4 hover:border-brand-violet/30 transition-all group shadow-2xl bg-[#0c0c0e]/80 backdrop-blur-xl w-full">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10">
        <img 
          src={track.album.images[0]?.url} 
          className={cn("h-full w-full object-cover transition-all duration-700", isPlaying ? "scale-110" : "grayscale")}
          alt="Cover"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold truncate text-white">
          {track.name}
        </h4>
        <p className="text-[10px] text-brand-violet font-black uppercase tracking-widest truncate">
          {track.artists.map(a => a.name).join(', ')}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <SkipBack className="w-4 h-4 text-white/20 hover:text-white cursor-pointer" onClick={() => handlePlayback('previous')} />
        <div 
          onClick={() => handlePlayback(isPlaying ? 'pause' : 'play')}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all",
            isPlaying ? "bg-brand-violet shadow-[0_0_15px_rgba(139,92,246,0.5)]" : "bg-white/10"
          )}
        >
          {isPlaying ? <Pause className="w-4 h-4 text-white fill-current" /> : <Play className="w-4 h-4 text-white fill-current ml-0.5" />}
        </div>
        <SkipForward className="w-4 h-4 text-white/20 hover:text-white cursor-pointer" onClick={() => handlePlayback('next')} />
      </div>

      <style jsx>{`
        @keyframes audio-bar {
          0%, 100% { height: 30%; }
          50% { height: 100%; }
        }
      `}</style>
    </div>
  )
}