'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { TaskEditDialog } from '@/components/dashboard/task-edit-dialog'
import type { Category } from '@/lib/types'

// Recebe Categories como prop
export function HeaderActions({ categories = [] }: { categories?: Category[] }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  return (
    <>
      <Button 
        onClick={() => setIsCreateOpen(true)}
        className="bg-brand-violet hover:bg-brand-violet/90 shadow-neon-violet transition-all active:scale-95"
      >
        <Plus className="w-4 h-4 mr-2" /> Nova Tarefa
      </Button>

      {/* Repassa categories para o modal */}
      <TaskEditDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen} 
        categories={categories}
      />
    </>
  )
}