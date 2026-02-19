'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, Search, UploadCloud, Target, CheckCircle2, Flame, Users, Clock, BookHeart } from 'lucide-react'
import { TaskEditDialog } from '@/components/dashboard/task-edit-dialog'
import { ImportTasksDialog } from '@/components/dashboard/import-tasks-dialog'
import { ZenMode } from '@/components/dashboard/zen-mode'
import { Category } from '@/lib/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

// Dados simulados para você ver o design em ação!
const mockNotifications = [
  {
    id: 1,
    title: 'Novo Workspace',
    description: 'Você foi adicionado ao time "Ateliê Aflorar Doces".',
    time: 'Agora mesmo',
    icon: Users,
    color: 'text-brand-cyan',
    bg: 'bg-brand-cyan/10',
    unread: true,
  },
  {
    id: 2,
    title: 'Tarefa Concluída',
    description: 'Gabriela moveu "Revisar paleta de cores" para Concluído.',
    time: 'Há 10 min',
    icon: CheckCircle2,
    color: 'text-brand-emerald',
    bg: 'bg-brand-emerald/10',
    unread: true,
  },
  {
    id: 3,
    title: 'Meta Atingida! 🔥',
    description: 'Incrível! Você alcançou 3 dias seguidos de foco.',
    time: 'Há 2 horas',
    icon: Flame,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    unread: false,
  },
  {
    id: 4,
    title: 'Lembrete de Projeto',
    description: 'Não esqueça de escrever o próximo capítulo do livro hoje.',
    time: 'Há 5 horas',
    icon: BookHeart,
    color: 'text-brand-rose',
    bg: 'bg-brand-rose/10',
    unread: false,
  }
]

export function HeaderActions({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false)
  const [zenModeOpen, setZenModeOpen] = useState(false)
  
  // Estado para controlar as notificações na UI
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
      
      {/* Botão Modo Zen */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setZenModeOpen(true)}
        className="hidden md:flex border-brand-violet/30 bg-brand-violet/10 hover:bg-brand-violet/20 text-brand-violet gap-2 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
      >
        <Target className="w-4 h-4" />
        Modo Zen
      </Button>

      {/* Botão de Importação */}
      <ImportTasksDialog 
        categories={categories}
        trigger={
            <Button variant="outline" size="icon" className="hidden md:flex border-white/10 hover:bg-white/5 hover:border-brand-cyan/50 hover:text-brand-cyan transition-all" title="Importar da Reunião">
                <UploadCloud className="w-4 h-4" />
            </Button>
        }
      />

      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white">
        <Search className="w-5 h-5" />
      </Button>
      
      {/* --- CENTRAL DE NOTIFICAÇÕES --- */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-brand-rose rounded-full border-2 border-[#09090b] animate-pulse" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 md:w-96 bg-[#121214]/95 backdrop-blur-xl border-white/10 p-0 shadow-2xl mt-2 z-[60]">
          
          {/* Header do Dropdown */}
          <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
            <h3 className="font-semibold text-white">Notificações</h3>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead} 
                className="h-auto p-0 text-xs text-brand-violet hover:text-brand-violet/80 hover:bg-transparent"
              >
                Marcar todas como lidas
              </Button>
            )}
          </div>
          
          {/* Lista Rolável */}
          <ScrollArea className="h-[350px]">
            {notifications.length > 0 ? (
              <div className="flex flex-col">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={cn(
                      "flex items-start gap-4 p-4 border-b border-white/5 transition-colors hover:bg-white/[0.04] cursor-pointer relative overflow-hidden",
                      notification.unread ? "bg-brand-violet/5" : ""
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    {/* Linha indicadora de não lido (Esquerda) */}
                    {notification.unread && (
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand-violet" />
                    )}

                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", notification.bg, notification.color)}>
                      <notification.icon className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className={cn("text-sm font-medium leading-none", notification.unread ? "text-white" : "text-white/80")}>
                            {notification.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{notification.time}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed pr-2">
                        {notification.description}
                      </p>
                    </div>

                    {notification.unread && (
                      <div className="w-2 h-2 rounded-full bg-brand-violet shrink-0 mt-1.5 shadow-neon-violet" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
                <CheckCircle2 className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm font-medium text-white/70">Tudo limpo!</p>
                <p className="text-xs mt-1">Você não tem novas notificações.</p>
              </div>
            )}
          </ScrollArea>
          
          {/* Footer do Dropdown */}
          <div className="p-2 border-t border-white/5 bg-black/20">
            <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:text-white h-8">
              Ver histórico completo
            </Button>
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