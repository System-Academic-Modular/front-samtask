'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import type { Profile, Category } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { createCategory, updateCategory, deleteCategory } from '@/lib/actions/categories'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Settings, User as UserIcon, Timer, Folder, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface SettingsViewProps {
  user: User
  profile: Profile | null
  categories: Category[]
}

export function SettingsView({ user, profile, categories }: SettingsViewProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()

  // Profile form
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [dailyGoal, setDailyGoal] = useState(profile?.daily_goal?.toString() || '5')
  const [pomodoroDuration, setPomodoroDuration] = useState(profile?.pomodoro_duration?.toString() || '25')
  const [shortBreak, setShortBreak] = useState(profile?.short_break?.toString() || '5')
  const [longBreak, setLongBreak] = useState(profile?.long_break?.toString() || '15')

  // Category form
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6')
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)

  async function handleProfileUpdate() {
    startTransition(async () => {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          daily_goal: parseInt(dailyGoal) || 5,
          pomodoro_duration: parseInt(pomodoroDuration) || 25,
          short_break: parseInt(shortBreak) || 5,
          long_break: parseInt(longBreak) || 15,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) {
        toast.error('Erro ao salvar perfil')
        return
      }

      toast.success('Perfil atualizado!')
      router.refresh()
    })
  }

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) return

    startTransition(async () => {
      const result = await createCategory({
        name: newCategoryName.trim(),
        color: newCategoryColor,
      })

      if (result.error) {
        toast.error('Erro ao criar categoria')
        return
      }

      toast.success('Categoria criada!')
      setNewCategoryName('')
      setNewCategoryColor('#3b82f6')
      setCategoryDialogOpen(false)
      router.refresh()
    })
  }

  async function handleUpdateCategory() {
    if (!editingCategory || !newCategoryName.trim()) return

    startTransition(async () => {
      const result = await updateCategory(editingCategory.id, {
        name: newCategoryName.trim(),
        color: newCategoryColor,
      })

      if (result.error) {
        toast.error('Erro ao atualizar categoria')
        return
      }

      toast.success('Categoria atualizada!')
      setEditingCategory(null)
      setNewCategoryName('')
      setNewCategoryColor('#3b82f6')
      setCategoryDialogOpen(false)
      router.refresh()
    })
  }

  async function handleDeleteCategory(id: string) {
    startTransition(async () => {
      const result = await deleteCategory(id)

      if (result.error) {
        toast.error('Erro ao excluir categoria')
        return
      }

      toast.success('Categoria excluida!')
      router.refresh()
    })
  }

  function openEditCategory(category: Category) {
    setEditingCategory(category)
    setNewCategoryName(category.name)
    setNewCategoryColor(category.color)
    setCategoryDialogOpen(true)
  }

  function openNewCategory() {
    setEditingCategory(null)
    setNewCategoryName('')
    setNewCategoryColor('#3b82f6')
    setCategoryDialogOpen(true)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          Configuracoes
        </h1>
        <p className="text-muted-foreground">Personalize sua experiencia</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="w-5 h-5" />
            Perfil
          </CardTitle>
          <CardDescription>Suas informacoes pessoais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email || ''} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome completo</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Seu nome"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dailyGoal">Meta diaria de tarefas</Label>
            <Input
              id="dailyGoal"
              type="number"
              value={dailyGoal}
              onChange={(e) => setDailyGoal(e.target.value)}
              min="1"
              max="50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Pomodoro Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5" />
            Pomodoro
          </CardTitle>
          <CardDescription>Configure os tempos do timer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pomodoro">Foco (min)</Label>
              <Input
                id="pomodoro"
                type="number"
                value={pomodoroDuration}
                onChange={(e) => setPomodoroDuration(e.target.value)}
                min="1"
                max="60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shortBreak">Pausa curta (min)</Label>
              <Input
                id="shortBreak"
                type="number"
                value={shortBreak}
                onChange={(e) => setShortBreak(e.target.value)}
                min="1"
                max="30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longBreak">Pausa longa (min)</Label>
              <Input
                id="longBreak"
                type="number"
                value={longBreak}
                onChange={(e) => setLongBreak(e.target.value)}
                min="1"
                max="60"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleProfileUpdate} disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Salvar alteracoes
      </Button>

      <Separator />

      {/* Categories */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Folder className="w-5 h-5" />
                Categorias
              </CardTitle>
              <CardDescription>Organize suas tarefas em categorias</CardDescription>
            </div>
            <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={openNewCategory}>
                  <Plus className="w-4 h-4 mr-1" />
                  Nova
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoryName">Nome</Label>
                    <Input
                      id="categoryName"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Nome da categoria"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoryColor">Cor</Label>
                    <div className="flex gap-2">
                      <Input
                        id="categoryColor"
                        type="color"
                        value={newCategoryColor}
                        onChange={(e) => setNewCategoryColor(e.target.value)}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={newCategoryColor}
                        onChange={(e) => setNewCategoryColor(e.target.value)}
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>
                </div>
                <Button
                  onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                  disabled={isPending || !newCategoryName.trim()}
                >
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingCategory ? 'Atualizar' : 'Criar'}
                </Button>
                                      <Button onClick={() => window.location.href = '/api/integrations/google/connect'}>
  Conectar Google Calendar 📅
</Button>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {categories.length > 0 ? (
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium text-foreground">{category.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditCategory(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma categoria criada ainda
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
