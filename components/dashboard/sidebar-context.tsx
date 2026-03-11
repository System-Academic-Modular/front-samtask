'use client'

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'

type SidebarContextType = {
  isOpen: boolean
  toggle: () => void
  close: () => void
  open: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  // Memoizando as funções para evitar re-renders desnecessários em componentes que consomem o context
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])
  const close = useCallback(() => setIsOpen(false), [])
  const open = useCallback(() => setIsOpen(true), [])

  const value = useMemo(() => ({ isOpen, toggle, close, open }), [isOpen, toggle, close, open])

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

// ==========================================
// SidebarMain: O "corpo" da aplicação
// ==========================================
export function SidebarMain({ children, className }: { children: React.ReactNode, className?: string }) {
  const { isOpen } = useSidebar()

  return (
    <main 
      className={cn(
        // Base: ocupa a tela toda, transição suave
        "flex-1 flex flex-col min-w-0 h-[100dvh] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-x-hidden",
        // Desktop: se a sidebar estiver aberta, empurra 288px (72 unidades do Tailwind)
        isOpen ? "md:ml-72" : "md:ml-0",
        // Mobile: geralmente a sidebar é um overlay, então o margin costuma ser 0
        "ml-0",
        className
      )}
    >
      {children}
    </main>
  )
}