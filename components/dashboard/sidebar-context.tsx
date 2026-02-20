'use client'

import React, { createContext, useContext, useState } from 'react'
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

  const toggle = () => setIsOpen((prev) => !prev)
  const close = () => setIsOpen(false)
  const open = () => setIsOpen(true)

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, close, open }}>
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
// NOVO: Wrapper exportado direto do Context!
// ==========================================
export function SidebarMain({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSidebar()

  return (
    <main 
      className={cn(
        "flex-1 flex flex-col min-w-0 h-[100dvh] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        isOpen ? "md:ml-72" : "md:ml-0" // Empurra o conteúdo no Desktop
      )}
    >
      {children}
    </main>
  )
}