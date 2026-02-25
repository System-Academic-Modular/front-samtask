'use client'

import { SkipBack, SkipForward, Play } from 'lucide-react'

export function SpotifyPlayer() {
  return (
    <div className="glass-panel border-white/10 p-4 rounded-[24px] flex items-center gap-4 hover:border-brand-violet/30 transition-all group shadow-2xl">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
        <img 
          src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=100" 
          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
          alt="Capa"
        />
        <div className="absolute inset-0 bg-brand-violet/10 animate-pulse" />
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-white truncate text-neon">Weightless</h4>
        <p className="text-[10px] text-brand-violet/60 uppercase font-black tracking-widest mt-1">Deep Work Mode</p>
      </div>

      <div className="flex items-center gap-3 pr-2">
        <SkipBack className="w-5 h-5 text-white/40 hover:text-white transition-colors cursor-pointer" />
        <div className="w-10 h-10 rounded-full bg-brand-violet flex items-center justify-center hover:scale-110 transition-all cursor-pointer shadow-[0_0_15px_rgba(139,92,246,0.5)]">
          <Play className="w-4 h-4 text-white fill-current ml-1" />
        </div>
        <SkipForward className="w-5 h-5 text-white/40 hover:text-white transition-colors cursor-pointer" />
      </div>
    </div>
  )
}