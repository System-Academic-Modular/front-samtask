'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { setTaskContext } from '@/lib/actions/task-context-action'
import { normalizarCargaMental } from '@/lib/effort' // Ajustado
import {
  parseTaskContext,
  type TaskContext as SharedTaskContext, // Renomeado para não conflitar com a const
  type TaskContextValue,
} from '@/lib/task-context-shared'
import type { CargaMental } from '@/lib/types' // Ajustado de CognitiveLoad para CargaMental

type TeamOption = {
  id: string
  name: string
}

// Unimos os tipos para que o state tenha tudo no primeiro nível
type TaskContextState = SharedTaskContext & {
  value: TaskContextValue
  teams: TeamOption[]
  preferredCognitiveLoad: CargaMental
  isPending: boolean
  setValue: (value: TaskContextValue) => void
  setPreferredCognitiveLoad: (value: CargaMental) => void
}

const TaskContext = React.createContext<TaskContextState | undefined>(undefined)

export function TaskContextProvider({
  children,
  initialValue = 'personal',
  teams = [],
}: {
  children: React.ReactNode
  initialValue?: TaskContextValue
  teams?: TeamOption[]
}) {
  const router = useRouter()
  const [value, setValueState] = React.useState<TaskContextValue>(initialValue)
  const [preferredCognitiveLoad, setPreferredCognitiveLoadState] =
    React.useState<CargaMental>(3)
  const [isPending, startTransition] = React.useTransition()

  // Sincroniza carga mental preferida do localStorage
  React.useEffect(() => {
    const storedValue = localStorage.getItem('taskflow-cognitive-load')
    if (!storedValue) return
    setPreferredCognitiveLoadState(normalizarCargaMental(Number(storedValue)))
  }, [])

  // Validação: Se tentar acessar um time que não existe na lista, volta para pessoal
  const validValue = React.useMemo<TaskContextValue>(() => {
    if (value === 'personal') return value
    const teamId = value.slice(5) // remove o prefixo 'team:'
    const exists = teams.some((team) => team.id === teamId)
    return exists ? value : 'personal'
  }, [value, teams])

  // Sincroniza o estado local e atualiza o servidor se o valor validado mudar
  React.useEffect(() => {
    if (validValue !== value) {
      setValueState(validValue)
      startTransition(() => {
        void setTaskContext(validValue).then(() => router.refresh())
      })
    }
  }, [validValue, value, router])

  const setValue = React.useCallback(
    (nextValue: TaskContextValue) => {
      if (nextValue === value) return
      setValueState(nextValue)
      startTransition(() => {
        void setTaskContext(nextValue).then(() => router.refresh())
      })
    },
    [value, router],
  )

  const setPreferredCognitiveLoad = React.useCallback((nextValue: CargaMental) => {
    const normalizedValue = normalizarCargaMental(nextValue)
    setPreferredCognitiveLoadState(normalizedValue)
    localStorage.setItem('taskflow-cognitive-load', String(normalizedValue))
  }, [])

  // Parseia 'team:123' para { type: 'team', teamId: '123' }
  const parsedContext = React.useMemo(() => parseTaskContext(validValue), [validValue])

  const state = React.useMemo<TaskContextState>(
    () => ({
      value: validValue,
      ...parsedContext, // type e teamId ficam na raiz
      teams,
      preferredCognitiveLoad,
      isPending,
      setValue,
      setPreferredCognitiveLoad,
    }),
    [
      validValue,
      parsedContext,
      teams,
      preferredCognitiveLoad,
      isPending,
      setValue,
      setPreferredCognitiveLoad,
    ],
  )

  return <TaskContext.Provider value={state}>{children}</TaskContext.Provider>
}

export function useTaskContext() {
  const context = React.useContext(TaskContext)

  if (!context) {
    throw new Error('useTaskContext must be used within a TaskContextProvider')
  }

  return context
}