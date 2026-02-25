'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom' // Teletransporte para o body
import { X, Play, RefreshCw, Search, Headphones } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const MOCK_PLAYLISTS = [
  { id: '1', name: 'Lo-Fi Focus', tracks: 42, cover: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=300' },
  { id: '2', name: 'Deep Work Techno', tracks: 28, cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=300' },
  { id: '3', name: 'Ambient Coding', tracks: 55, cover: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=300' },
  { id: '4', name: 'Cyberpunk Beats', tracks: 31, cover: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=300' },
]

interface PlaylistModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PlaylistModal({ isOpen, onClose }: PlaylistModalProps) {
  const [mounted, setMounted] = useState(false)

  // Evita erros de hidratação no Next.js
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!isOpen || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Backdrop com desfoque ultra pesado para isolar o modal */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-2xl cursor-crosshair" 
        onClick={onClose} 
      />

      <Card className="relative w-full max-w-2xl bg-[#0c0c0e] border-brand-violet/40 shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden">
        {/* Header Tático */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-violet/10 rounded-2xl border border-brand-violet/20">
              <Headphones className="w-6 h-6 text-brand-violet" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tighter text-white">Ambientes de Áudio</h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Sincronizado com Spotify_API</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10 text-white/50">
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Barra de Pesquisa e Filtros */}
        <div className="p-6 space-y-4 bg-black/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input 
              placeholder="PESQUISAR PLAYLIST..." 
              className="bg-white/5 border-white/10 pl-10 h-12 focus-visible:ring-brand-violet text-white placeholder:text-white/20"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {['Foco', 'Relax', 'Synthwave', 'Personal'].map((tag) => (
              <Button key={tag} variant="outline" size="sm" className="rounded-full border-white/10 text-[10px] uppercase font-bold tracking-widest hover:border-brand-violet text-white/70 hover:text-white">
                {tag}
              </Button>
            ))}
          </div>
        </div>

        {/* Lista de Playlists */}
        <CardContent className="p-6 pt-0 max-h-[400px] overflow-y-auto custom-scrollbar bg-black/20">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {MOCK_PLAYLISTS.map((playlist) => (
              <button 
                key={playlist.id}
                className="group relative flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-brand-violet/50 hover:bg-brand-violet/5 transition-all text-left"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 group-hover:border-brand-violet/50 transition-all">
                  <img src={playlist.cover} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-6 h-6 text-white fill-current" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white group-hover:text-brand-violet transition-colors truncate">{playlist.name}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{playlist.tracks} Tracks</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>

        {/* Footer Informativo */}
        <div className="p-4 border-t border-white/5 bg-[#0c0c0e] flex justify-between items-center px-6">
          <span className="text-[9px] text-white/20 uppercase font-black tracking-[0.2em]">Bio_Auth: Arthur ✅</span>
          <Button variant="ghost" size="sm" className="text-white/40 hover:text-brand-violet gap-2">
            <RefreshCw className="w-3 h-3" />
            <span className="text-[9px] font-bold uppercase tracking-widest">Atualizar Biblioteca</span>
          </Button>
        </div>
      </Card>
    </div>,
    document.body
  )
}