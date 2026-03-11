'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Position,
  useEdgesState,
  useNodesState,
  Handle,
  type Edge,
  type Node,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Brain, Edit, GitBranch, MousePointerClick, X, Target, Zap, Calendar } from 'lucide-react'
import { TaskEditDialog } from '@/components/dashboard/task-edit-dialog'
import { cn } from '@/lib/utils'
import type { Categoria, Tarefa } from '@/lib/types'

interface ProjectTreeProps {
  tasks: Tarefa[]
  categories: Categoria[]
}

type ProjectNodeData = {
  label: string
  color: string
  categoryName: string
  status: Tarefa['status']
  priority: Tarefa['prioridade']
  dueDate: string | null
  estimatedMinutes: number | null
  cognitiveLoad: number
}

function ProjectNode({ data }: { data: ProjectNodeData }) {
  const isDone = data.status === 'concluida'
  const isUrgent = data.priority === 'urgente'

  return (
    <div
      className={cn(
        'relative min-w-[220px] rounded-[18px] border p-4 text-left transition-all duration-500',
        isDone
          ? 'border-white/5 bg-black/40 opacity-40 grayscale'
          : 'border-white/10 bg-[#0c0c0e]/90 hover:scale-[1.05] hover:border-white/30 shadow-2xl',
      )}
      style={{
        borderColor: isDone ? undefined : `${data.color}40`,
        boxShadow: isDone ? undefined : `0 10px 40px -10px ${data.color}15`,
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-white/20 !border-none !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-white/20 !border-none !w-2 !h-2" />

      <div className="flex items-center justify-between mb-2">
        <span 
          className="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md border border-white/5 bg-white/5"
          style={{ color: isDone ? '#666' : data.color }}
        >
          {data.categoryName}
        </span>
        {isUrgent && !isDone && (
          <div className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_#f43f5e]" />
        )}
      </div>

      <div className={cn(
        "line-clamp-2 text-xs font-bold tracking-tight text-white mb-3",
        isDone && "line-through text-white/40"
      )}>
        {data.label}
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-3">
        <div className="flex items-center gap-1.5 text-[9px] font-bold text-white/40 uppercase">
          <Calendar className="h-3 w-3" />
          {data.dueDate || 'S/ DATA'}
        </div>
        <div className="flex items-center gap-1.5 text-[9px] font-bold text-brand-cyan uppercase">
          <Brain className="h-3 w-3" />
          LOAD {data.cognitiveLoad}
        </div>
      </div>

      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[2px] rounded-full"
        style={{ backgroundColor: data.color }}
      />
    </div>
  )
}

const nodeTypes = {
  projectNode: ProjectNode,
}

function buildGraph(tasks: Tarefa[], categories: Categoria[]) {
  const categoryById = new Map(categories.map((cat) => [cat.id, cat]))
  const childrenByParent = new Map<string, Tarefa[]>()
  const roots: Tarefa[] = []

  // Organizar hierarquia usando tarefa_pai_id
  for (const task of tasks) {
    if (!task.tarefa_pai_id) {
      roots.push(task)
    } else {
      const siblings = childrenByParent.get(task.tarefa_pai_id) || []
      siblings.push(task)
      childrenByParent.set(task.tarefa_pai_id, siblings)
    }
  }

  const nodes: Node<ProjectNodeData>[] = []
  const edges: Edge[] = []
  let cursorY = 0

  const addTaskNode = (task: Tarefa, depth: number) => {
    const category = task.categoria_id ? categoryById.get(task.categoria_id) : undefined
    const parentId = task.tarefa_pai_id || '__root__'
    const siblings = childrenByParent.get(parentId) || []
    const siblingIndex = siblings.findIndex((sibling) => sibling.id === task.id)
    
    const x = depth * 320
    const y = cursorY + Math.max(0, siblingIndex) * 180

    nodes.push({
      id: task.id,
      type: 'projectNode',
      position: { x, y },
      data: {
        label: task.titulo,
        color: category?.cor || '#8b5cf6',
        categoryName: category?.nome || 'Geral',
        status: task.status,
        priority: task.prioridade,
        dueDate: task.data_vencimento ? format(new Date(task.data_vencimento), 'dd MMM', { locale: ptBR }) : null,
        estimatedMinutes: task.minutos_estimados ?? null,
        cognitiveLoad: task.carga_mental,
      },
    })

    if (task.tarefa_pai_id) {
      edges.push({
        id: `edge-${task.tarefa_pai_id}-${task.id}`,
        source: task.tarefa_pai_id,
        target: task.id,
        type: 'smoothstep',
        animated: task.status !== 'concluida',
        style: { 
            stroke: task.status === 'concluida' ? '#ffffff10' : `${category?.cor || '#8b5cf6'}40`, 
            strokeWidth: 2 
        },
      })
    }

    const children = childrenByParent.get(task.id) || []
    if (!children.length) {
      cursorY += 200
      return
    }

    for (const child of children) {
      addTaskNode(child, depth + 1)
    }
  }

  for (const rootTask of roots) {
    addTaskNode(rootTask, 0)
  }

  return { nodes, edges }
}

// Menu de Contexto (Omitido aqui por brevidade, mas deve seguir a lógica de tipos acima)
// ... (ContextMenu Component permanece similar, apenas garantindo as chamadas de TaskEditDialog corretas)

export function ProjectTree({ tasks, categories }: ProjectTreeProps) {
  const [mounted, setMounted] = useState(false)
  const [editingTask, setEditingTask] = useState<Tarefa | null>(null)
  const [parentIdForNewTask, setParentIdForNewTask] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [menu, setMenu] = useState<{ taskId: string; top: number; left: number } | null>(null)

  const { nodes: graphNodes, edges: graphEdges } = useMemo(
    () => buildGraph(tasks, categories),
    [tasks, categories],
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(graphNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(graphEdges)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    setNodes(graphNodes)
    setEdges(graphEdges)
  }, [graphEdges, graphNodes, setEdges, setNodes])

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault()
    setMenu({ taskId: node.id, top: event.clientY, left: event.clientX })
  }, [])

  return (
    <div className="relative h-[700px] w-full overflow-hidden rounded-[32px] border border-white/5 bg-[#070708] shadow-inner">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeContextMenu={onNodeContextMenu}
        onPaneClick={() => setMenu(null)}
        fitView
      >
        <Background color="#ffffff" gap={40} size={1} className="opacity-[0.03]" />
        <Controls className="!bg-[#0c0c0e] !border-white/10 !rounded-xl" />
        <MiniMap 
          className="!bg-[#0c0c0e] !border-white/10 !rounded-2xl" 
          nodeColor={(n) => (n.data as any).color}
        />
      </ReactFlow>

      {/* HUD de Status (Similar ao original) */}
      <div className="absolute left-10 top-10 z-30">
        <h3 className="text-xl font-black text-white uppercase italic">
          Tactical <span className="text-brand-violet">Network</span>
        </h3>
      </div>

      {mounted && menu && createPortal(
        /* Menu de contexto ajustado para usar tarefa.id */
        <div className="fixed inset-0 z-[10000]" onClick={() => setMenu(null)}>
            <div 
                style={{ top: menu.top, left: menu.left }} 
                className="absolute w-64 rounded-2xl border border-white/10 bg-[#09090b]/95 p-2 backdrop-blur-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={() => {
                        const t = tasks.find(x => x.id === menu.taskId)
                        if (t) { setEditingTask(t); setParentIdForNewTask(null); setIsDialogOpen(true); }
                        setMenu(null);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-white/5"
                >
                    <Edit className="h-4 w-4 text-brand-violet" />
                    <span className="text-[11px] font-black text-white uppercase">Modificar Alvo</span>
                </button>
                <button
                    onClick={() => {
                        setEditingTask(null); 
                        setParentIdForNewTask(menu.taskId); 
                        setIsDialogOpen(true);
                        setMenu(null);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-white/5"
                >
                    <GitBranch className="h-4 w-4 text-brand-cyan" />
                    <span className="text-[11px] font-black text-white uppercase">Ramificar</span>
                </button>
            </div>
        </div>,
        document.body,
      )}

      <TaskEditDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        task={editingTask}
        categories={categories}
        defaultParentId={parentIdForNewTask}
      />
    </div>
  )
}