'use client'

import { useEffect } from 'react'

type Palette = {
  primary: string
  cyan: string
  emerald: string
  rose: string
  amber: string
  sky: string
}

// Calibração Neon: Cores ajustadas para brilho máximo no Dark Mode
const accentPalettes: Record<string, Palette> = {
  violet: { // O Roxo Assinatura do FocusOS
    primary: '270 100% 65%', // Roxo Neon vibrante
    cyan: '190 100% 50%',
    emerald: '150 100% 45%',
    rose: '340 100% 60%',
    amber: '40 100% 55%',
    sky: '200 100% 55%',
  },
  cyan: {
    primary: '190 100% 50%',
    cyan: '185 100% 45%',
    emerald: '155 100% 45%',
    rose: '335 100% 60%',
    amber: '35 100% 55%',
    sky: '205 100% 55%',
  },
  emerald: {
    primary: '150 100% 45%',
    cyan: '185 100% 50%',
    emerald: '145 100% 40%',
    rose: '345 100% 60%',
    amber: '45 100% 55%',
    sky: '195 100% 50%',
  },
  rose: {
    primary: '340 100% 60%',
    cyan: '195 100% 50%',
    emerald: '160 100% 45%',
    rose: '335 100% 65%',
    amber: '35 100% 55%',
    sky: '210 100% 55%',
  },
  amber: {
    primary: '40 100% 55%',
    cyan: '190 100% 50%',
    emerald: '155 100% 45%',
    rose: '345 100% 60%',
    amber: '35 100% 50%',
    sky: '200 100% 55%',
  },
  sky: {
    primary: '200 100% 55%',
    cyan: '190 100% 50%',
    emerald: '160 100% 45%',
    rose: '340 100% 60%',
    amber: '40 100% 55%',
    sky: '205 100% 60%',
  },
}

// Cenários Holográficos / Cockpit
const backgroundPresets: Record<string, string> = {
  aurora:
    'radial-gradient(circle at 10% 0%, hsl(var(--brand-primary-hsl) / 0.15), transparent 40%), radial-gradient(circle at 80% 10%, hsl(var(--brand-cyan-hsl) / 0.15), transparent 45%), linear-gradient(180deg, hsl(240 10% 4%), hsl(240 10% 6%))',
  neural: // Foco em Grid/Matriz Escura com glow central
    'radial-gradient(ellipse at 50% 0%, hsl(var(--brand-primary-hsl) / 0.15), transparent 60%), linear-gradient(180deg, hsl(240 5% 3%), hsl(240 5% 5%))',
  void: // Oled Black com brilho de base
    'radial-gradient(circle at 50% 100%, hsl(var(--brand-primary-hsl) / 0.08), transparent 50%), linear-gradient(180deg, #000000, #050505)',
  ocean:
    'radial-gradient(circle at 20% -5%, hsl(var(--brand-cyan-hsl) / 0.20), transparent 50%), radial-gradient(circle at 90% 0%, hsl(var(--brand-sky-hsl) / 0.15), transparent 45%), linear-gradient(180deg, hsl(210 40% 5%), hsl(210 40% 8%))',
}

function applyPalette(colorVariable: string) {
  const palette = accentPalettes[colorVariable] || accentPalettes.violet
  const root = document.documentElement
  
  root.style.setProperty('--brand-primary-hsl', palette.primary)
  root.style.setProperty('--brand-cyan-hsl', palette.cyan)
  root.style.setProperty('--brand-emerald-hsl', palette.emerald)
  root.style.setProperty('--brand-rose-hsl', palette.rose)
  root.style.setProperty('--brand-amber-hsl', palette.amber)
  root.style.setProperty('--brand-sky-hsl', palette.sky)

  // Injeta variável extra para glows de sombras e neons
  root.style.setProperty('--brand-glow', `hsl(${palette.primary} / 0.3)`)
}

function applyBackground(backgroundPreset: string) {
  const image = backgroundPresets[backgroundPreset] || backgroundPresets.aurora
  document.body.style.setProperty('--app-bg-image', image)
}

export function DynamicStyleProvider({ colorVariable }: { colorVariable: string }) {
  useEffect(() => {
    // 🚀 BRANDING UPDATE: De taskflow para focusos
    const storedColor = localStorage.getItem('focusos-accent-color')
    const selectedColor = storedColor && accentPalettes[storedColor] ? storedColor : colorVariable

    const storedPreset = localStorage.getItem('focusos-theme-preset') || 'aurora'

    applyPalette(selectedColor)
    applyBackground(storedPreset)

    const onAppearanceChange = () => {
      const nextColor = localStorage.getItem('focusos-accent-color') || colorVariable
      const nextPreset = localStorage.getItem('focusos-theme-preset') || 'aurora'
      
      applyPalette(nextColor)
      applyBackground(nextPreset)
    }

    window.addEventListener('focusos-appearance-changed', onAppearanceChange)
    return () => window.removeEventListener('focusos-appearance-changed', onAppearanceChange)
  }, [colorVariable])

  return null
}