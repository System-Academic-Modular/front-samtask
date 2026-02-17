export const TASK_CONTEXT_COOKIE = 'taskflow-context'

export type TaskContextValue = 'personal' | `team:${string}`

export type TaskContext =
  | { type: 'personal' }
  | { type: 'team'; teamId: string }

export function parseTaskContext(value?: string | null): TaskContext {
  if (!value || value === 'personal') {
    return { type: 'personal' }
  }

  if (value.startsWith('team:')) {
    const teamId = value.slice(5)
    if (teamId) {
      return { type: 'team', teamId }
    }
  }

  return { type: 'personal' }
}

export function toTaskContextValue(context: TaskContext): TaskContextValue {
  return context.type === 'team' ? `team:${context.teamId}` : 'personal'
}

export function normalizeTaskContextValue(
  value?: string | null,
): TaskContextValue {
  return toTaskContextValue(parseTaskContext(value))
}
