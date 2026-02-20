'use client'

import { useMemo, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState, 
  Position,
  Node,
  Edge
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { Tarefa, Categoria } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TaskEditDialog } from '@/components/dashboard/task-edit-dialog';
import { Edit, GitBranch, X, MousePointerClick, Trash2 } from 'lucide-react';

// --- 1. Nó Customizado (Visual Neon) ---
const CustomNode = ({ data }: any) => {
  const isUrgent = data.priority === 'URGENTE';
  const isDone = data.status === 'CONCLUIDO';

  return (
    <div 
      className={cn(
        "px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl min-w-[180px] text-center transition-all group relative overflow-hidden cursor-context-menu",
        isDone ? "opacity-60 grayscale border-white/10 bg-black/40" : "hover:scale-105 hover:shadow-[0_0_25px_-5px_rgba(139,92,246,0.3)]"
      )}
      style={{ 
        backgroundColor: isDone ? undefined : `${data.color}15`,
        borderColor: isDone ? undefined : data.color,
      }}
    >
      <div className="text-[9px] font-bold uppercase tracking-widest mb-1 opacity-70" style={{ color: isDone ? '#fff' : data.color }}>
        {data.categoryName}
      </div>
      <div className="font-bold text-white text-sm line-clamp-2 leading-tight">
        {data.label}
      </div>
      <div className="mt-2 flex justify-center gap-2 text-[10px] text-slate-400 font-medium">
        {data.dueDate && <span>{data.dueDate}</span>}
        {data.time && <span>• {data.time}m</span>}
      </div>
      <div className="w-full bg-white/5 h-1 mt-2 rounded-full overflow-hidden">
        <div className="h-full transition-all duration-500" style={{ width: isDone ? '100%' : '0%', backgroundColor: isDone ? '#22c55e' : data.color }} />
      </div>
      {isUrgent && !isDone && (
        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_red]" />
      )}
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

interface ProjectTreeProps {
  tasks: Tarefa[]
  categories: Categoria[]
}

// Componente do Menu separado para usar no Portal
const ContextMenu = ({ 
    top, left, onEdit, onAddSubtask, onClose 
}: { 
    top: number, left: number, onEdit: () => void, onAddSubtask: () => void, onClose: () => void 
}) => {
    return (
        <div className="fixed inset-0 z-[9999]" onClick={onClose} onContextMenu={(e) => e.preventDefault()}>
            <div
                style={{ top, left }}
                className="absolute w-56 rounded-xl border border-white/10 bg-[#121214]/95 backdrop-blur-xl shadow-2xl p-1.5 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center px-2 py-1.5 border-b border-white/5 mb-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Opções da Tarefa</span>
                    <button onClick={onClose} className="hover:bg-white/10 rounded p-0.5 transition-colors">
                        <X className="w-3 h-3 text-muted-foreground hover:text-white" />
                    </button>
                </div>
                
                <button
                    onClick={() => { onEdit(); onClose(); }}
                    className="flex items-center gap-2 px-2 py-2 text-sm text-white hover:bg-brand-violet/20 hover:text-brand-violet rounded-lg transition-colors text-left"
                >
                    <Edit className="w-4 h-4" />
                    Editar Detalhes
                </button>
                
                <button
                    onClick={() => { onAddSubtask(); onClose(); }}
                    className="flex items-center gap-2 px-2 py-2 text-sm text-white hover:bg-brand-cyan/20 hover:text-brand-cyan rounded-lg transition-colors text-left"
                >
                    <GitBranch className="w-4 h-4" />
                    Criar Subtarefa
                </button>
            </div>
        </div>
    )
}

export function ProjectTree({ tasks, categories }: ProjectTreeProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Tarefa | null>(null);
  const [parentIdForNewTask, setParentIdForNewTask] = useState<string | null>(null);
  
  const [menu, setMenu] = useState<{ id: string; top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const catMap = new Map(categories.map(c => [c.KEY_CATEGORIA, c]));
    const siblings: { [key: string]: number } = {};

    tasks.forEach((task, index) => {
      const category = task.KEY_CATEGORIA ? catMap.get(task.KEY_CATEGORIA) : null;
      const color = category?.COR || '#8b5cf6';
      const parentId = task.KEY_TAREFA_PAI || 'root';
      
      if (!siblings[parentId]) siblings[parentId] = 0;
      
      const x = (index % 4) * 240; 
      const y = Math.floor(index / 4) * 180;

      nodes.push({
        id: task.KEY_TAREFA,
        type: 'custom',
        position: { x, y },
        data: { 
          label: task.TITULO, 
          color: color, 
          categoryName: category?.NOME || 'Geral',
          priority: task.PRIORIDADE,
          status: task.STATUS,
          dueDate: task.DATA_VENCIMENTO ? format(new Date(task.DATA_VENCIMENTO), 'dd MMM', { locale: ptBR }) : null,
          time: task.MINUTOS_ESTIMADOS
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      });

      if (task.KEY_TAREFA_PAI) {
        edges.push({
          id: `e-${task.KEY_TAREFA_PAI}-${task.KEY_TAREFA}`,
          source: task.KEY_TAREFA_PAI,
          target: task.KEY_TAREFA,
          animated: true,
          style: { stroke: '#ffffff30', strokeWidth: 1.5 },
          type: 'smoothstep', 
        });
      }
    });
    return { initialNodes: nodes, initialEdges: edges };
  }, [tasks, categories]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      
      const MENU_WIDTH = 224; 
      const MENU_HEIGHT = 150;
      
      let x = event.clientX;
      let y = event.clientY;

      if (x + MENU_WIDTH > window.innerWidth) {
          x -= MENU_WIDTH;
      }
      if (y + MENU_HEIGHT > window.innerHeight) {
          y -= MENU_HEIGHT;
      }

      setMenu({
        id: node.id,
        top: y,
        left: x,
      });
    },
    [setMenu]
  );

  const onPaneClick = useCallback(() => setMenu(null), [setMenu]);

  const handleEdit = () => {
      if (!menu) return;
      const task = tasks.find(t => t.KEY_TAREFA === menu.id);
      if (task) {
          setEditingTask(task);
          setParentIdForNewTask(null);
          setModalOpen(true);
      }
  };

  const handleAddSubtask = () => {
      if (!menu) return;
      setEditingTask(null);
      setParentIdForNewTask(menu.id);
      setModalOpen(true);
  };

  return (
    <div className="h-[600px] w-full rounded-2xl overflow-hidden bg-[#09090b] relative group border border-white/5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/5 via-[#09090b] to-[#09090b] pointer-events-none z-0" />
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        className="bg-transparent z-10"
        minZoom={0.5}
        maxZoom={2}
        onNodeContextMenu={onNodeContextMenu}
        onPaneClick={onPaneClick}
        onNodeClick={onPaneClick}
      >
        <Background color="#334155" gap={30} size={1} className="opacity-10" />
        <Controls className="bg-[#121214] border-white/10 fill-white rounded-xl shadow-xl" />
        <MiniMap 
          nodeColor={(n) => n.data.color} 
          className="bg-[#121214] border border-white/10 rounded-xl"
          maskColor="rgba(0, 0, 0, 0.6)"
        />
      </ReactFlow>
      
      {mounted && menu && createPortal(
          <ContextMenu 
            top={menu.top} 
            left={menu.left} 
            onClose={() => setMenu(null)}
            onEdit={handleEdit}
            onAddSubtask={handleAddSubtask}
          />,
          document.body
      )}

      <div className="absolute top-6 left-6 pointer-events-none z-20">
         <h3 className="text-white font-bold text-xl drop-shadow-lg flex items-center gap-2">
            <span className="text-brand-violet animate-pulse">●</span> Rede Neural
         </h3>
         <p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
            <MousePointerClick className="w-3 h-3" /> Clique Direito para Opções
         </p>
      </div>

      <TaskEditDialog 
          open={modalOpen} 
          onOpenChange={setModalOpen}
          task={editingTask as any}
          categories={categories as any}
          defaultParentId={parentIdForNewTask}
       />
    </div>
  );
}