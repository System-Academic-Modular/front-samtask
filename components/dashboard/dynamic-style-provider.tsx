'use client'
import { useEffect } from 'react'

const accentColors: Record<string, string> = {
  violet: '#8b5cf6',
  cyan: '#06b6d4',
  amber: '#f59e0b',
  emerald: '#10b981',
  rose: '#f43f5e',
}

export function DynamicStyleProvider({ colorVariable }: { colorVariable: string }) {
  useEffect(() => {
    const hex = accentColors[colorVariable] || accentColors.violet
    // Atualiza a variável CSS usada no Tailwind e nos componentes
    document.documentElement.style.setProperty('--brand-violet', hex)
  }, [colorVariable])

  return null
}