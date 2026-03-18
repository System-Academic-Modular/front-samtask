'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, Search, UploadCloud, Target, CheckCircle2, Flame, Users, Code2, Activity, Plus } from 'lucide-react'
import { TaskEditDialog } from '@/components/dashboard/task-edit-dialog'
import { ImportTasksDialog } from '@/components/dashboard/import-tasks-dialog'
import { ZenMode } from '@/components/dashboard/zen-mode'
import type { Categoria } from '@/lib/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

// Notificações injetadas com o contexto do seu ecossistema
const mockNotifications = [
  {
    id: 1,
    title: 'Integração de Equipa',
    description: 'Sincronização concluída com o workspace "Ateliê Aflorar Doces".',
    time: 'Agora mesmo',
    icon: Users,
    color: 'text-brand-cyan',
    bg: 'bg-brand-cyan/10',
    unread: true,
  },
  {
    id: 2,
    title: 'Missão Atualizada',
    description: 'Gabriela alterou o status do planejamento financeiro para Concluído.',
    time: 'Há 10 min',
    icon: CheckCircle2,
    color: 'text-brand-emerald',
    bg: 'bg-brand-emerald/10',
    unread: true,
  },
  {
    id: 3,
    title: 'Overclock Mental! 🔥',
    description: 'Sistemas registam 3 dias consecutivos de hiperfoco.',
    time: 'Há 2 horas',
    icon: Flame,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    unread: false,
  },
  {
    id: 4,
    title: 'Alerta de Repositório',
    description: 'Revisão de arquitetura pendente no projeto SAM (Sistema Acadêmico Modular).',
    time: 'Há 5 horas',
    icon: Code2,
    color: 'text-brand-rose',
    bg: 'bg-brand-rose/10',
    unread: false,
  }
]

export function HeaderActions({ categories }: { categories: Categoria[] }) {
  const [open, setOpen] = useState(false)
  const [zenModeOpen, setZenModeOpen] = useState(false)
  const [notifications, setNotifications] = useState(mockNotifications)

  const unreadCount = notifications.filter(n => n.unread).length

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })))
  }

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, unread: false } : n))
  }

  return (
    <div className="flex items-center gap-2 md:gap-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className={cn(
          "border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan gap-2 transition-all duration-300",
          "hover:bg-brand-cyan hover:text-black hover:scale-105 active:scale-95",
          "px-3 md:px-4 h-9 rounded-xl font-black uppercase tracking-widest text-[10px]"
        )}
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">NOVA TAREFA</span>
      </Button>

      {/* Botão Modo Zen - Estética Tática */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setZenModeOpen(true)}
        className={cn(
          "border-brand-violet/40 bg-brand-violet/10 text-brand-violet gap-2 transition-all duration-300",
          "hover:bg-brand-violet hover:text-white hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(139,92,246,0.2)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)]",
          "px-3 md:px-4 h-9 rounded-xl font-black uppercase tracking-widest text-[10px]"
        )}
      >
        <Target className="w-4 h-4 animate-pulse" />
        <span className="hidden sm:inline">MODO ZEN</span>
      </Button>

      {/* Botão de Importação da Inteligência Artificial */}
      <ImportTasksDialog 
        categories={categories}
        trigger={
            <Button 
              variant="outline" 
              size="icon" 
              className="h-9 w-9 rounded-xl border-white/10 bg-black/40 backdrop-blur-md hover:bg-brand-cyan/20 hover:border-brand-cyan/50 hover:text-brand-cyan hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all hover:scale-105" 
              title="Importar Missões (IA)"
            >
                <UploadCloud className="w-4 h-4" />
            </Button>
        }
      />

      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-white hover:bg-white/10 transition-all hidden xs:flex">
        <Search className="w-4 h-4" />
      </Button>
      
      {/* CENTRAL DE NOTIFICAÇÕES (O HUD) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-white hover:bg-white/10 relative transition-all group">
            <Bell className="w-4 h-4 group-hover:animate-swing" />
            {unreadCount > 0 && (
              <>
                <span className="absolute top-2 right-2 w-2 h-2 bg-brand-rose rounded-full border border-[#09090b] z-10" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-brand-rose rounded-full animate-ping opacity-75" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[calc(100vw-32px)] sm:w-[400px] bg-[#0c0c0e]/95 backdrop-blur-2xl border-white/10 p-0 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-2xl mt-2 z-[60] overflow-hidden">
          
          <div className="flex items-center justify-between p-4 border-b border-white/5 bg-gradient-to-r from-white/[0.05] to-transparent">
            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-violet" />
              Painel de Alertas
            </h3>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead} 
                className="h-auto p-0 text-[9px] font-black uppercase tracking-widest text-brand-cyan hover:text-brand-cyan/80 hover:bg-transparent transition-colors"
              >
                PURGAR DADOS
              </Button>
            )}
          </div>
          
          <ScrollArea className="h-[380px] bg-black/20">
            {notifications.length > 0 ? (
              <div className="flex flex-col">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={cn(
                      "flex items-start gap-4 p-4 border-b border-white/5 transition-all duration-300 hover:bg-white/[0.04] cursor-pointer relative group",
                      notification.unread ? "bg-brand-violet/5" : ""
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    {notification.unread && (
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand-violet shadow-[0_0_10px_var(--brand-violet)]" />
                    )}

                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/5 shadow-inner transition-transform group-hover:scale-110", notification.bg, notification.color)}>
                      <notification.icon className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className={cn("text-xs font-bold uppercase tracking-wider leading-none", notification.unread ? "text-white" : "text-white/60")}>
                            {notification.title}
                        </p>
                        <span className="text-[9px] text-muted-foreground font-mono shrink-0 ml-2 bg-white/5 px-1.5 py-0.5 rounded-md">{notification.time}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed pr-2 font-medium">
                        {notification.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center flex flex-col items-center justify-center h-full border-dashed border-white/5 m-4 rounded-2xl bg-white/[0.01]">
                <CheckCircle2 className="w-12 h-12 mb-4 text-muted-foreground/20" />
                <p className="text-[11px] font-black uppercase tracking-widest text-white/50">Radar Limpo</p>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">Nenhuma anomalia detetada.</p>
              </div>
            )}
          </ScrollArea>
          
          <div className="p-3 border-t border-white/5 bg-black/40 text-center backdrop-blur-md">
            <p className="text-[9px] text-brand-violet/50 font-black tracking-[0.3em] uppercase">FocusOS // Terminal Ativo</p>
          </div>

        </DropdownMenuContent>
      </DropdownMenu>

      <TaskEditDialog 
        categories={categories}
        open={open}
        onOpenChange={setOpen}
      />

      <ZenMode 
        isOpen={zenModeOpen} 
        onClose={() => setZenModeOpen(false)} 
        taskTitle="Sessão de Foco Livre"
      />
    </div>
  )
}
