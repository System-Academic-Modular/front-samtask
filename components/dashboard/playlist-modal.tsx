'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Play, RefreshCw, Search, Headphones, Loader2, Radio, Music2, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { getActiveSpotifyToken } from '@/lib/actions/spotify'
import { toast } from 'sonner'

interface PlaylistModalProps {
  isOpen: boolean
  onClose: () => void
}

// URLs de API construídas para bypass de filtros e clareza
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1'
const PLAYLISTS_ENDPOINT = `${SPOTIFY_API_BASE}/me/playlists?limit=50`
const PLAY_ENDPOINT = `${SPOTIFY_API_BASE}/me/player/play`

export function PlaylistModal({ isOpen, onClose }: PlaylistModalProps) {
  const [mounted, setMounted] = useState(false)
  const [playlists, setPlaylists] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    if (isOpen) {
      loadPlaylists()
      setSearchQuery('')
    }
    return () => setMounted(false)
  }, [isOpen])

  const loadPlaylists = async () => {
    setIsLoading(true)
    const res = await getActiveSpotifyToken()
    if (res.token) {
      setToken(res.token)
      try {
        const response = await fetch(PLAYLISTS_ENDPOINT, {
          headers: { Authorization: `Bearer ${res.token}` }
        })
        const data = await response.json()
        if (data.items) {
          setPlaylists(data.items.filter((p: any) => p !== null)) 
        }
      } catch (e) {
        toast.error("ERRO NA INTERCEPTAÇÃO DE DADOS", {
          description: "Não foi possível conectar aos satélites do Spotify."
        })
      }
    }
    setIsLoading(false)
  }

  const playPlaylist = async (uri: string, name: string) => {
    if (!token) return
    try {
      const res = await fetch(PLAY_ENDPOINT, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ context_uri: uri })
      })
      
      if (res.status === 403 || res.status === 404) {
          toast.error("ACESSO NEGADO", {
            description: "Spotify Premium ou dispositivo ativo não detectado."
          })
          return
      }

      toast.success(`FREQUÊNCIA ALTERADA`, {
        description: `Transmissão iniciada: ${name.toUpperCase()}`,
        icon: <Radio className="w-4 h-4 text-brand-cyan animate-pulse" />
      })
      onClose()
    } catch (e) {
      toast.error("FALHA NA TRANSMISSÃO")
    }
  }

  const filteredPlaylists = playlists.filter(playlist => 
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isOpen || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-500">
      {/* Backdrop de Alta Densidade */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-[12px] cursor-crosshair transition-all" 
        onClick={onClose} 
      />

      <Card className="relative w-full max-w-2xl bg-[#09090b] border-white/5 shadow-[0_0_80px_rgba(0,0,0,1)] overflow-hidden rounded-[24px]">
        {/* Camada de Gradiente Tático */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-violet/5 via-transparent to-brand-cyan/5 pointer-events-none" />
        
        {/* Barra de Status Superior */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-violet to-transparent opacity-50" />

        {/* Header de Comando */}
        <div className="relative flex items-center justify-between p-6 border-b border-white/[0.03] bg-white/[0.01]">
          <div className="flex items-center gap-4">
            <div className="relative">
                <div className="absolute inset-0 bg-brand-violet/20 blur-lg rounded-xl animate-pulse" />
                <div className="relative p-3 bg-black rounded-xl border border-brand-violet/30 shadow-2xl">
                    <Headphones className="w-6 h-6 text-brand-violet" />
                </div>
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-[0.1em] text-white">Ambiente Sonoro</h2>
              <div className="flex items-center gap-2 mt-0.5">
                 <span className="flex h-1.5 w-1.5 rounded-full bg-brand-cyan animate-pulse" />
                 <p className="text-[9px] text-brand-cyan/70 uppercase tracking-[0.2em] font-black">Link Neural Ativo</p>
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="rounded-xl hover:bg-white/5 text-white/30 hover:text-white transition-all group"
          >
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          </Button>
        </div>

        {/* Input de Busca Estilizado */}
        <div className="relative px-6 py-4 bg-black/40">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-brand-cyan transition-colors" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="BUSCAR FREQUÊNCIA DE FLOW..." 
              className="bg-white/[0.02] border-white/5 pl-12 h-14 focus-visible:ring-brand-violet/50 text-white placeholder:text-white/10 uppercase tracking-[0.15em] text-[10px] font-black rounded-2xl transition-all"
            />
          </div>
        </div>

        {/* Grid de Playlists com Scroll Customizado */}
        <CardContent className="relative p-6 h-[400px] overflow-y-auto custom-scrollbar bg-black/40">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="relative h-16 w-16">
                <Loader2 className="w-16 h-16 text-brand-violet animate-spin opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Music2 className="w-6 h-6 text-brand-violet animate-pulse" />
                </div>
              </div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-black">Escaneando Frequências...</p>
            </div>
          ) : filteredPlaylists.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredPlaylists.map((playlist, index) => (
                <button 
                  key={playlist.id}
                  onClick={() => playPlaylist(playlist.uri, playlist.name)}
                  className="group relative flex items-center gap-4 p-3 rounded-[18px] bg-white/[0.02] border border-white/5 hover:border-brand-violet/40 hover:bg-brand-violet/[0.03] transition-all text-left overflow-hidden animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 group-hover:border-brand-violet/50 transition-all shadow-2xl">
                    <img 
                      src={playlist.images?.[0]?.url || '/placeholder-spotify.png'} 
                      alt={playlist.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100" 
                    />
                    <div className="absolute inset-0 bg-brand-violet/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[1px]">
                      <Play className="w-6 h-6 text-white fill-white drop-shadow-[0_0_12px_rgba(255,255,255,0.5)]" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-xs text-white/80 group-hover:text-white transition-all truncate uppercase tracking-wider">
                      {playlist.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[8px] font-black text-brand-cyan/60 uppercase bg-brand-cyan/10 px-1.5 py-0.5 rounded border border-brand-cyan/20">
                            {playlist.tracks.total} TRACKS
                        </span>
                        <Radio className="w-3 h-3 text-white/10 group-hover:text-brand-violet transition-colors" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
              <Radio className="w-12 h-12" />
              <p className="text-[10px] uppercase font-black tracking-[0.3em]">Nenhum sinal detectado</p>
            </div>
          )}
        </CardContent>

        {/* Footer de Telemetria */}
        <div className="relative p-5 border-t border-white/[0.03] bg-[#070708] flex justify-between items-center px-8">
          <div className="flex items-center gap-6">
             <div className="flex flex-col">
                <span className="text-[8px] text-white/20 uppercase font-black tracking-widest">Protocolo</span>
                <span className={cn(
                    "text-[10px] font-black uppercase flex items-center gap-1.5",
                    token ? "text-emerald-500" : "text-red-500"
                )}>
                    {token ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    {token ? "Conectado" : "Desconectado"}
                </span>
             </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={loadPlaylists} 
            disabled={isLoading} 
            className="text-white/30 hover:text-brand-cyan gap-2 h-9 px-4 rounded-xl border border-white/5 hover:border-brand-cyan/20 bg-white/[0.01]"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin text-brand-cyan")} />
            <span className="text-[10px] font-black uppercase tracking-[0.1em]">Rescanear</span>
          </Button>
        </div>
      </Card>
    </div>,
    document.body
  )
}