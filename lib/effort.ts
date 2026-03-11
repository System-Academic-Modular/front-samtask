import type { Task, CargaMental } from '@/lib/types'

/**
 * Normaliza o valor para garantir que esteja dentro da união 1 | 2 | 3 | 4 | 5
 */
export function normalizarCargaMental(valor?: number | null): CargaMental {
  if (!valor || Number.isNaN(valor)) return 3
  if (valor <= 1) return 1
  if (valor >= 5) return 5
  return Math.round(valor) as CargaMental
}

/**
 * Calcula os pontos de esforço baseados na carga mental e no tempo estimado.
 * Usa 25 min (1 bloco Pomodoro) como base para o multiplicador.
 */
export function getPontosEsforcoTarefa(
  tarefa: Pick<Task, 'carga_mental' | 'minutos_estimados'>
) {
  const carga = normalizarCargaMental(tarefa.carga_mental)
  // Se minutos_estimados for nulo, assume 25 min (base 1)
  const multiplicadorDuracao = Math.max(1, Math.round((tarefa.minutos_estimados ?? 25) / 25))
  
  return carga * multiplicadorDuracao
}

/**
 * Calcula o progresso total de esforço do dia.
 */
export function getEffortProgress(
  tasks: Array<Pick<Task, 'status' | 'carga_mental' | 'minutos_estimados'>>
) {
  const totalEffort = tasks.reduce(
    (soma, tarefa) => soma + getPontosEsforcoTarefa(tarefa), 
    0
  )

  const completedEffort = tasks
    .filter((tarefa) => tarefa.status === 'concluida')
    .reduce((soma, tarefa) => soma + getPontosEsforcoTarefa(tarefa), 0)

  const percentage = totalEffort > 0 
    ? Math.min(100, Math.round((completedEffort / totalEffort) * 100)) 
    : 0

  return {
    completedEffort,
    totalEffort,
    percentage,
  }
}