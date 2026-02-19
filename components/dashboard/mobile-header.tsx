'use client'

import { Menu, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/components/dashboard/sidebar-context'

export function MobileHeader() {
  const { toggle } = useSidebar()

  return (
    // md:hidden faz com que esse header só apareça em telas de celular/tablet pequeno
    <div className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-[#09090b]/95 backdrop-blur-md sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-brand-violet to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-brand-violet/20">
          <Zap className="w-4 h-4 text-white fill-white/20" />
        </div>
        <span className="text-lg font-bold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
          Focus OS
        </span>
      </div>
      
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggle} 
        className="text-muted-foreground hover:text-white bg-white/5 border border-white/5 rounded-md"
      >
        <Menu className="w-5 h-5" />
      </Button>
    </div>
  )
}