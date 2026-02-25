'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Injeta o conteúdo direto no body apenas após a montagem no cliente
  return mounted ? createPortal(children, document.body) : null
}