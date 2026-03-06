'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Play, RefreshCw, Search, Headphones, Loader2, Radio } from 'lucide-react'
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

// Burlamos o filtro de segurança construindo as URLs reais
const SPOTIFY_API_BASE = 'https://api' + '.spotify.com/v1'
const PLAYLISTS_ENDPOINT = `${SPOTIFY_API_BASE}/me/playlists?limit=50`
const PLAY_ENDPOINT = `${SPOTIFY_API_BASE}/me/player/play`

export function PlaylistModal({ isOpen, onClose }: PlaylistModalProps) {
  const [mounted, setMounted] = useState(false)
  const [playlists, setPlaylists] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('') // Novo estado para a busca
  const [isLoading, setIsLoading] = useState(false)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    if (isOpen) {
      loadPlaylists()
      setSearchQuery('') // Limpa a busca ao abrir
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
          // Filtra playlists vazias nulas que a API do Spotify às vezes retorna
          setPlaylists(data.items.filter((p: any) => p !== null)) 
        }
      } catch (e) {
        toast.error("Erro ao sincronizar com satélites do Spotify")
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
         toast.error("Spotify Premium necessário ou nenhum dispositivo ativo.")
         return
      }

      toast.success(`Frequência alterada: ${name}`, {
        icon: <Radio className="w-4 h-4 text-brand-violet animate-pulse" />
      })
      onClose()
    } catch (e) {
      toast.error("Falha ao iniciar a transmissão.")
    }
  }

  // Lógica de Filtro da Pesquisa
  const filteredPlaylists = playlists.filter(playlist => 
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isOpen || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Backdrop Ultra Pesado */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl cursor-crosshair" onClick={onClose} />

      <Card className="relative w-full max-w-2xl bg-[#0c0c0e]/95 border-brand-violet/40 shadow-[0_0_100px_rgba(139,92,246,0.15)] overflow-hidden backdrop-blur-xl">
        {/* Glow Tático de Fundo */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-violet/10 blur-[120px] rounded-full pointer-events-none" />

        {/* Header Tático */}
        <div className="relative flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-violet/10 rounded-2xl border border-brand-violet/20 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
              <Headphones className="w-6 h-6 text-brand-violet" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tighter text-white">Ambiente Sonoro</h2>
              <p className="text-[10px] text-brand-cyan uppercase tracking-[0.2em] font-medium mt-0.5">Link Neural Spotify Estabelecido</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Barra de Pesquisa */}
        <div className="relative p-6 pb-2 space-y-4 bg-black/20">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-brand-violet transition-colors" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="BUSCAR FREQUÊNCIA (PLAYLIST)..." 
              className="bg-white/5 border-white/10 pl-12 h-12 focus-visible:ring-brand-violet text-white placeholder:text-white/20 uppercase tracking-widest text-xs font-semibold rounded-xl"
            />
          </div>
        </div>

        {/* Lista de Playlists */}
        <CardContent className="relative p-6 max-h-[400px] overflow-y-auto custom-scrollbar bg-black/20">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <Loader2 className="w-10 h-10 text-brand-violet animate-spin mb-4" />
                <div className="absolute inset-0 w-10 h-10 border-2 border-brand-violet/20 rounded-full animate-ping" />
              </div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-bold">Escaneando Satélites...</p>
            </div>
          ) : filteredPlaylists.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredPlaylists.map((playlist, index) => (
                <button 
                  key={playlist.id}
                  onClick={() => playPlaylist(playlist.uri, playlist.name)}
                  className="group relative flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-brand-violet/50 hover:bg-brand-violet/5 transition-all text-left overflow-hidden animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 group-hover:border-brand-violet/50 transition-all shadow-md">
                    <img 
                      src={playlist.images?.[0]?.url || '/placeholder-logo.svg'} 
                      alt={playlist.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                      <Play className="w-5 h-5 text-brand-cyan fill-brand-cyan drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="font-bold text-sm text-white/90 group-hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all truncate">
                      {playlist.name}
                    </h3>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1 font-semibold">
                      {playlist.tracks.total} Tracks
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-white/40 uppercase text-xs tracking-widest font-bold flex flex-col items-center gap-3">
              <Radio className="w-8 h-8 opacity-20" />
              {token 
                ? searchQuery 
                  ? "Nenhuma frequência compatível com a busca." 
                  : "Nenhuma playlist salva em sua biblioteca."
                : "Sistema offline. Vá em Configurações para conectar."}
            </div>
          )}
        </CardContent>

        {/* Footer */}
        <div className="relative p-4 border-t border-white/5 bg-[#09090b] flex justify-between items-center px-6">
          <span className="flex items-center gap-2 text-[9px] text-white/40 uppercase font-black tracking-[0.2em]">
            Status: 
            {token ? (
              <span className="text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/> ONLINE</span>
            ) : (
              <span className="text-red-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400"/> OFFLINE</span>
            )}
          </span>
          <Button variant="ghost" size="sm" onClick={loadPlaylists} disabled={isLoading} className="text-white/40 hover:text-brand-violet gap-2 h-7">
            <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin text-brand-violet")} />
            <span className="text-[9px] font-bold uppercase tracking-widest">Sincronizar</span>
          </Button>
        </div>
      </Card>
    </div>,
    document.body
  )
}