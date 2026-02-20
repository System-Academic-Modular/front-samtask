// ==========================================
// ENUMS & TYPES BÁSICOS (PADRÃO PT-BR)
// ==========================================
export type StatusTarefa = 'TODO' | 'EM_ANDAMENTO' | 'CONCLUIDO'
export type PrioridadeTarefa = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE'
export type TipoPomodoro = 'TRABALHO' | 'PAUSA_CURTA' | 'PAUSA_LONGA'

// ==========================================
// ENTIDADES PRINCIPAIS (SCHEMA DO BANCO)
// ==========================================

// Perfil adaptado para a nova tabela LOGIN / USUARIOS
export interface UsuarioProfile {
  KEY_LOGIN: string
  NOME: string | null
  AVATAR_URL: string | null
  EMAIL?: string
  // Metas (Se mantidas na nova estrutura)
  META_DIARIA?: number
  DURACAO_POMODORO?: number
  PAUSA_CURTA?: number
  PAUSA_LONGA?: number
  DATA_CRIACAO: string
  DATA_ATUALIZACAO: string
}

export interface Categoria {
  KEY_CATEGORIA: string
  NOME: string
  COR: string
  DATA_CRIACAO: string
  DATA_ATUALIZACAO: string
  // Referências públicas
  KEY_TIME?: string | null
  KEY_LOGIN: string
}

export interface Tag {
  KEY_TAG: string
  NOME: string
  COR: string
  DATA_CRIACAO: string
  DATA_ATUALIZACAO: string
  KEY_LOGIN: string
}

export interface Time {
  KEY_TIME: string
  NOME: string
  DESCRICAO: string | null
  CODIGO_CONVITE: string
  DATA_CRIACAO: string
  DATA_ATUALIZACAO: string
  KEY_LOGIN: string // O Criador
}

// Relacionamento Many-to-Many (Usuários <-> Times)
export interface MembroTime {
  KEY_TIME: string
  KEY_LOGIN: string
  DATA_INTEGRACAO: string
  SUPER_ADMIN: boolean
  
  // Joins (Opcionais para UI)
  TIME?: Time 
  PERFIL?: Pick<UsuarioProfile, 'KEY_LOGIN' | 'NOME' | 'AVATAR_URL'> | null
}

export interface Tarefa {
  KEY_TAREFA: string
  TITULO: string
  DESCRICAO: string | null
  STATUS: StatusTarefa
  PRIORIDADE: PrioridadeTarefa
  DATA_VENCIMENTO: string | null
  POSICAO: number | null
  DATA_CRIACAO: string
  DATA_ATUALIZACAO: string
  
  // Chaves Públicas
  KEY_TIME?: string | null
  KEY_LOGIN: string
  KEY_CATEGORIA?: string | null
  KEY_TAREFA_PAI?: string | null // Para sub-tarefas
  KEY_RESPONSAVEL?: string | null // Usuário assinalado

  // Campos extras de negócio (Adaptados)
  MINUTOS_ESTIMADOS?: number | null
  MINUTOS_REAIS?: number
  RECORRENTE?: boolean
  PADRAO_RECORRENCIA?: string | null

  // Joined data (Retornados pela API/Supabase Joins)
  CATEGORIA?: Categoria | null
  TAGS?: Tag[]
  SUBTAREFAS?: Tarefa[]
  TIME?: Time | null
  RESPONSAVEL?: {
    NOME: string | null
    AVATAR_URL: string | null
  } | null
}

export interface SessaoFoco {
  KEY_SESSAO_FOCO: string
  DURACAO_SEGUNDOS: number
  DATA_CONCLUSAO: string | null
  DATA_CRIACAO: string
  DATA_ATUALIZACAO: string
  
  KEY_TAREFA?: string | null
  KEY_LOGIN: string
}

export interface CheckinEmocional {
  KEY_CHECKIN: string
  HUMOR: number
  ENERGIA: number
  NOTA: string | null
  DATA_CRIACAO: string
  KEY_LOGIN: string
}

// ==========================================
// VIEW & FILTER TYPES
// ==========================================
export type TipoVisao = 'LISTA' | 'KANBAN' | 'CALENDARIO'

export interface FiltrosTarefa {
  STATUS?: StatusTarefa[]
  PRIORIDADE?: PrioridadeTarefa[]
  KEY_CATEGORIA?: string
  KEY_TAGS?: string[]
  BUSCA?: string
  DATA_VENCIMENTO_INICIO?: string
  DATA_VENCIMENTO_FIM?: string
  APENAS_HOJE?: boolean
}

export interface OrdenacaoTarefa {
  CAMPO: 'DATA_VENCIMENTO' | 'PRIORIDADE' | 'STATUS' | 'DATA_CRIACAO' | 'POSICAO'
  DIRECAO: 'asc' | 'desc'
}