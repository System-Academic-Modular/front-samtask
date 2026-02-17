'use client'

import * as React from 'react'

export const backgroundThemes = [
  { value: 'obsidian', label: 'Obsidiana', className: 'bg-[#09090b]' },
  { value: 'midnight', label: 'Meia-noite', className: 'bg-[#0b1020]' },
  { value: 'nebula', label: 'Nebulosa', className: 'bg-[#140c1f]' },
  { value: 'slate', label: 'Ardósia', className: 'bg-[#0f172a]' },
  { value: 'carbon', label: 'Carbono', className: 'bg-[#050505]' },
] as const

export const surfaceThemes = [
  { value: 'graphite', label: 'Grafite', className: 'bg-[#121214]' },
  { value: 'steel', label: 'Aço', className: 'bg-[#171c2b]' },
  { value: 'smoke', label: 'Fumaça', className: 'bg-[#1b1b20]' },
  { value: 'ink', label: 'Tinta', className: 'bg-[#141720]' },
  { value: 'frost', label: 'Neve', className: 'bg-[#1a202c]' },
] as const

export type BackgroundTheme = (typeof backgroundThemes)[number]['value']
export type SurfaceTheme = (typeof surfaceThemes)[number]['value']

type AppearanceState = {
  background: BackgroundTheme
  surface: SurfaceTheme
  setBackground: (value: BackgroundTheme) => void
  setSurface: (value: SurfaceTheme) => void
}

type AppearanceProviderProps = {
  children: React.ReactNode
  defaultBackground?: BackgroundTheme
  defaultSurface?: SurfaceTheme
  storageKey?: string
}

const AppearanceContext = React.createContext<AppearanceState | undefined>(
  undefined,
)

const isBackgroundTheme = (value: string): value is BackgroundTheme =>
  backgroundThemes.some((theme) => theme.value === value)

const isSurfaceTheme = (value: string): value is SurfaceTheme =>
  surfaceThemes.some((theme) => theme.value === value)

export function AppearanceProvider({
  children,
  defaultBackground = 'obsidian',
  defaultSurface = 'graphite',
  storageKey = 'taskflow-appearance',
}: AppearanceProviderProps) {
  const [background, setBackgroundState] =
    React.useState<BackgroundTheme>(defaultBackground)
  const [surface, setSurfaceState] =
    React.useState<SurfaceTheme>(defaultSurface)

  React.useEffect(() => {
    const storedBackground = localStorage.getItem(`${storageKey}-background`)
    if (storedBackground && isBackgroundTheme(storedBackground)) {
      setBackgroundState(storedBackground)
    }

    const storedSurface = localStorage.getItem(`${storageKey}-surface`)
    if (storedSurface && isSurfaceTheme(storedSurface)) {
      setSurfaceState(storedSurface)
    }
  }, [storageKey])

  React.useEffect(() => {
    const root = window.document.documentElement
    root.setAttribute('data-bg', background)
    root.setAttribute('data-surface', surface)
  }, [background, surface])

  const setBackground = React.useCallback(
    (value: BackgroundTheme) => {
      setBackgroundState(value)
      localStorage.setItem(`${storageKey}-background`, value)
    },
    [storageKey],
  )

  const setSurface = React.useCallback(
    (value: SurfaceTheme) => {
      setSurfaceState(value)
      localStorage.setItem(`${storageKey}-surface`, value)
    },
    [storageKey],
  )

  const contextValue = React.useMemo(
    () => ({
      background,
      surface,
      setBackground,
      setSurface,
    }),
    [background, surface, setBackground, setSurface],
  )

  return (
    <AppearanceContext.Provider value={contextValue}>
      {children}
    </AppearanceContext.Provider>
  )
}

export function useAppearance() {
  const context = React.useContext(AppearanceContext)

  if (!context) {
    throw new Error('useAppearance must be used within an AppearanceProvider')
  }

  return context
}
