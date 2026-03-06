'use client'

import { useState, useEffect, useCallback } from 'react'
import { SkipBack, SkipForward, Play, Pause, Music2, AlertCircle, Loader2, Radio } from 'lucide-react'
import { getActiveSpotifyToken } from '@/lib/actions/spotify'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function SpotifyPlayer() {
  const [token, setToken] = useState<string | null>(null)
  const [track, setTrack] = useState<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [isInitializing, setIsInitializing] = useState(true) // Novo estado para evitar "piscadas" na UI

  // Busca o token no banco ao carregar
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

  // Função para buscar o que está a tocar agora (URLs Corrigidas!)
  const fetchCurrentTrack = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.status === 200) {
        const data = await res.json()
        setTrack(data.item)
        setIsPlaying(data.is_playing)
      } else if (res.status === 204) {
        // 204: Spotify aberto, mas nada tocando
        setTrack(null)
        setIsPlaying(false)
      }
    } catch (e) {
      console.error("Erro ao buscar música:", e)
    }
  }, [token])

  // Polling: Atualiza o player a cada 5 segundos
  useEffect(() => {
    fetchCurrentTrack()
    const interval = setInterval(fetchCurrentTrack, 5000)
    return () => clearInterval(interval)
  }, [fetchCurrentTrack])

  // Controles do Player (URLs Corrigidas!)
  const handlePlayback = async (action: 'play' | 'pause' | 'next' | 'previous') => {
    if (!token) return
    try {
      const method = action === 'next' || action === 'previous' ? 'POST' : 'PUT'
      const res = await fetch(`https://api.spotify.com/v1/me/player/${action}`, {
        method,
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (res.status === 403) {
        toast.error("Controle requer conta Spotify Premium")
        return
      }
      
      // Atualiza a interface rapidamente (Optimistic UI)
      if (action === 'play') setIsPlaying(true)
      if (action === 'pause') setIsPlaying(false)
      setTimeout(fetchCurrentTrack, 500) // Força update real após a ação
    } catch (e) {
      toast.error("Falha na comunicação com a nave mãe (Spotify)")
    }
  }

  // ESTADO 0: Carregando Módulo (Evita UI piscando)
  if (isInitializing) {
    return (
      <div className="glass-panel border-white/5 p-4 rounded-[24px] flex items-center justify-center gap-3 bg-black/20 backdrop-blur-xl h-[88px]">
        <Loader2 className="w-5 h-5 text-brand-violet animate-spin" />
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Iniciando Áudio...</span>
      </div>
    )
  }

  // ESTADO 1: Não Conectado
  if (isConnected === false) {
    return (
      <div className="glass-panel border-white/5 p-4 rounded-[24px] flex items-center justify-between gap-4 bg-black/40 backdrop-blur-xl hover:border-white/10 transition-all group">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-violet/5 flex items-center justify-center border border-brand-violet/10 group-hover:bg-brand-violet/10 transition-colors">
            <Music2 className="w-4 h-4 text-brand-violet/50 group-hover:text-brand-violet" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white/80">Link Neural Desativado</h4>
            <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] mt-0.5">Spotify Offline</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-[10px] font-black uppercase tracking-widest bg-white/5 text-white/70 border-white/10 hover:bg-brand-violet hover:text-white hover:border-brand-violet transition-all shadow-sm"
          onClick={() => window.location.href = '/api/integrations/spotify/connect'}
        >
          Conectar
        </Button>
      </div>
    )
  }

  // ESTADO 2: Conectado, mas nada a tocar
  if (!track) {
    return (
      <div className="glass-panel border-white/5 p-4 rounded-[24px] flex items-center gap-4 bg-black/40 backdrop-blur-xl group hover:border-white/10 transition-all relative overflow-hidden">
        {/* Efeito radar de fundo */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,var(--brand-violet)_0,transparent_30%)] opacity-0 group-hover:opacity-10 transition-opacity duration-1000 pointer-events-none" />
        
        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0 group-hover:border-brand-violet/30 transition-all shadow-inner">
          <Radio className="w-5 h-5 text-white/20 group-hover:text-brand-violet animate-pulse" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-white/60">Aguardando Frequência</h4>
          <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] mt-0.5">Dê play no Spotify para sincronizar</p>
        </div>
      </div>
    )
  }

  // ESTADO 3: A Tocar (High Performance UI)
  return (
    <div className="glass-panel border-white/10 p-3 md:p-4 rounded-[24px] flex items-center gap-4 hover:border-brand-violet/30 transition-all group shadow-2xl bg-[#0c0c0e]/80 backdrop-blur-xl">
      {/* Capa do Álbum com Glow Dinâmico */}
      <div className="relative h-12 w-12 md:h-14 md:w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 group-hover:border-brand-violet/50 transition-colors shadow-lg">
        <img 
          src={track.album.images[0]?.url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=100"} 
          className={cn("h-full w-full object-cover transition-transform duration-700", isPlaying ? "scale-105" : "scale-100 grayscale-[0.5]")}
          alt="Capa"
        />
        {isPlaying && <div className="absolute inset-0 bg-brand-violet/20 animate-pulse pointer-events-none mix-blend-overlay" />}
      </div>
      
      {/* Info da Música e Visualizador */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <h4 className={cn("text-sm font-bold truncate transition-colors", isPlaying ? "text-white text-neon" : "text-white/70")}>
            {track.name}
          </h4>
          
          {/* Mini Equalizador (Aparece apenas quando tocando) */}
          {isPlaying && (
            <div className="flex items-end gap-[2px] h-3 pb-0.5 shrink-0">
              <div className="w-[2px] h-[60%] bg-brand-violet animate-[bounce_1s_infinite_ease-in-out]" />
              <div className="w-[2px] h-[100%] bg-brand-violet animate-[bounce_0.8s_infinite_ease-in-out]" style={{ animationDelay: '0.2s' }} />
              <div className="w-[2px] h-[40%] bg-brand-violet animate-[bounce_1.2s_infinite_ease-in-out]" style={{ animationDelay: '0.4s' }} />
            </div>
          )}
        </div>
        
        <p className="text-[10px] text-brand-violet/80 uppercase font-black tracking-widest mt-0.5 truncate">
          {track.artists.map((a: any) => a.name).join(', ')}
        </p>
      </div>

      {/* Controles de Playback Táticos */}
      <div className="flex items-center gap-2 md:gap-3 pr-2">
        <SkipBack 
          className="w-4 h-4 md:w-5 md:h-5 text-white/30 hover:text-white transition-colors cursor-pointer active:scale-90" 
          onClick={() => handlePlayback('previous')}
        />
        
        <div 
          onClick={() => handlePlayback(isPlaying ? 'pause' : 'play')}
          className={cn(
            "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95",
            isPlaying 
              ? "bg-brand-violet shadow-[0_0_15px_rgba(139,92,246,0.5)] hover:scale-105 hover:shadow-[0_0_25px_rgba(139,92,246,0.7)]" 
              : "bg-white/5 border border-white/10 hover:bg-white/20"
          )}
        >
          {isPlaying 
            ? <Pause className="w-4 h-4 text-white fill-current" /> 
            : <Play className="w-4 h-4 text-white fill-current ml-1" />
          }
        </div>
        
        <SkipForward 
          className="w-4 h-4 md:w-5 md:h-5 text-white/30 hover:text-white transition-colors cursor-pointer active:scale-90" 
          onClick={() => handlePlayback('next')}
        />
      </div>
    </div>
  )
}