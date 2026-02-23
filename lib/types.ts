export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TipoPomodoro = 'WORK' | 'SHORT_BREAK' | 'LONG_BREAK'

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  email: string
  daily_goal?: number
  pomodoro_duration?: number
  short_break?: number
  long_break?: number
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  color: string
  icon?: string | null
  created_at: string
}

export interface Tag {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface Team {
  id: string
  name: string
  description: string | null
  owner_id: string
  invite_code: string
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at: string
  
  // Joins
  team?: Team 
  profile?: Profile | null
}

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  position: number | null
  created_at: string
  updated_at: string
  
  user_id: string
  team_id?: string | null
  category_id?: string | null
  parent_id?: string | null
  assignee_id?: string | null

  estimated_minutes?: number | null
  actual_minutes?: number | null
  is_recurring?: boolean
  recurrence_pattern?: string | null

  // Dados populados por Joins
  category?: Category | null
  assignee?: Profile | null
  subtasks?: Task[]
}

export type Tarefa = Task
export type Categoria = Category
export type StatusTarefa = TaskStatus
export type PrioridadeTarefa = TaskPriority
export type MembroTime = TeamMember
export type UsuarioProfile = Profile