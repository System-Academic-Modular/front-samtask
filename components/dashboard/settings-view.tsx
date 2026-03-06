'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import type { ComponentType, CSSProperties } from 'react'
import { useTheme } from 'next-themes'
import {
  CheckCircle2,
  FolderTree,
  Github,
  Globe,
  Laptop,
  Loader2,
  Moon,
  Music,
  Palette,
  Plus,
  Save,
  Pencil,
  Sun,
  Trash2,
  User,
  X,
  Settings,
  ShieldCheck,
  Zap
} from 'lucide-react'
import { toast } from 'sonner'
import { updateProfile } from '@/lib/actions/profile'
import { createCategory, deleteCategory, updateCategory } from '@/lib/actions/categories'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Categoria, Profile } from '@/lib/types'

const accentColors = [
  { name: 'Índigo Elétrico', hex: '#6366f1', variable: 'violet' },
  { name: 'Azul Oceano', hex: '#0ea5e9', variable: 'sky' },
  { name: 'Ciano Fluxo', hex: '#06b6d4', variable: 'cyan' },
  { name: 'Verde Vital', hex: '#10b981', variable: 'emerald' },
  { name: 'Coral Quente', hex: '#f43f5e', variable: 'rose' },
  { name: 'Âmbar Solar', hex: '#f59e0b', variable: 'amber' },
] as const

const backgroundPresets = [
  {
    id: 'aurora',
    label: 'Aurora',
    preview: 'linear-gradient(135deg,#0b1024 0%,#1b1f3a 40%,#101828 100%)',
    image:
      'radial-gradient(circle at 10% 0%, hsl(var(--brand-primary-hsl) / 0.15), transparent 35%), radial-gradient(circle at 80% 10%, hsl(var(--brand-cyan-hsl) / 0.12), transparent 42%), linear-gradient(180deg, hsl(224 43% 7%), hsl(225 35% 9%))',
  },
  {
    id: 'ocean',
    label: 'Azul Profundo',
    preview: 'linear-gradient(135deg,#0b1724 0%,#10263f 45%,#0d1a2e 100%)',
    image:
      'radial-gradient(circle at 20% -5%, hsl(var(--brand-cyan-hsl) / 0.18), transparent 45%), radial-gradient(circle at 90% 0%, hsl(var(--brand-sky-hsl) / 0.14), transparent 40%), linear-gradient(180deg, hsl(210 45% 9%), hsl(214 46% 11%))',
  },
  {
    id: 'graphite',
    label: 'Grafite',
    preview: 'linear-gradient(135deg,#121212 0%,#1a1f29 50%,#0d1117 100%)',
    image:
      'radial-gradient(circle at 15% 0%, hsl(var(--brand-primary-hsl) / 0.1), transparent 35%), radial-gradient(circle at 80% 5%, hsl(var(--brand-emerald-hsl) / 0.08), transparent 35%), linear-gradient(180deg, hsl(223 28% 8%), hsl(224 28% 10%))',
  },
] as const

type BackgroundPresetId = (typeof backgroundPresets)[number]['id']

function applyBackgroundPreset(presetId: BackgroundPresetId) {
  const preset = backgroundPresets.find((item) => item.id === presetId)
  if (!preset) return
  document.body.style.setProperty('--app-bg-image', preset.image)
}

export function SettingsView({
  user,
  profile,
  integrations,
  initialCategories,
}: {
  user: { email?: string | null }
  profile: Profile | null
  integrations: Array<{ provider: string }>
  initialCategories: Categoria[]
}) {
  const [isPending, startTransition] = useTransition()
  const { theme, setTheme } = useTheme()
  const [currentTab, setCurrentTab] = useState('profile')
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [activeColor, setActiveColor] = useState('violet')
  const [backgroundPreset, setBackgroundPreset] = useState<BackgroundPresetId>('aurora')
  const [categories, setCategories] = useState<Categoria[]>(initialCategories || [])
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [currentCategory, setCurrentCategory] = useState({ id: '', name: '', color: '#6366f1' })

  useEffect(() => {
    setCategories(initialCategories || [])
  }, [initialCategories])

  useEffect(() => {
    const storedPreset = localStorage.getItem('taskflow-background-preset') as BackgroundPresetId | null
    const storedAccent = localStorage.getItem('taskflow-accent-color')
    const nextPreset =
      storedPreset && backgroundPresets.some((preset) => preset.id === storedPreset)
        ? storedPreset
        : 'aurora'
    setBackgroundPreset(nextPreset)
    if (storedAccent && accentColors.some((color) => color.variable === storedAccent)) {
      setActiveColor(storedAccent)
    }
    applyBackgroundPreset(nextPreset)
  }, [])

  useEffect(() => {
    applyBackgroundPreset(backgroundPreset)
  }, [backgroundPreset])

  const activeAccent = useMemo(
    () => accentColors.find((color) => color.variable === activeColor) || accentColors[0],
    [activeColor],
  )

  function handleSaveProfile() {
    startTransition(async () => {
      const response = await updateProfile({ full_name: fullName })
      if (response.error) toast.error(response.error)
      else toast.success(response.success)
    })
  }

  function handleSaveAppearance() {
    startTransition(async () => {
      localStorage.setItem('taskflow-background-preset', backgroundPreset)
      localStorage.setItem('taskflow-accent-color', activeColor)
      applyBackgroundPreset(backgroundPreset)
      window.dispatchEvent(new Event('taskflow-appearance-changed'))
      toast.success('Aparência tática atualizada.', {
        icon: <Palette className="w-4 h-4 text-brand-violet" />
      })
    })
  }

  function handleSaveCategory() {
    if (!currentCategory.name.trim()) return

    startTransition(async () => {
      const response = currentCategory.id
        ? await updateCategory(currentCategory.id, {
            name: currentCategory.name,
            color: currentCategory.color,
          })
        : await createCategory({
            name: currentCategory.name,
            color: currentCategory.color,
          })

      if (response.error) {
        toast.error(response.error)
      } else {
        toast.success('Categoria sincronizada.')
        setIsCategoryModalOpen(false)
      }
    })
  }

  function handleRemoveCategory(categoryId: string) {
    startTransition(async () => {
      const response = await deleteCategory(categoryId)
      if (response.error) toast.error(response.error)
      else toast.success('Categoria removida do banco de dados.')
    })
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-20 md:flex-row relative">
      {/* Background Decorativo Global para a tela de configurações */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-brand-violet/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Modal de Categoria (High-Tech) */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <Card className="w-full max-w-md bg-[#0c0c0e]/95 border-brand-violet/30 shadow-[0_0_50px_rgba(139,92,246,0.15)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-violet to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-white/[0.02]">
              <CardTitle className="flex items-center gap-2 text-white">
                <FolderTree className="w-5 h-5 text-brand-violet" />
                {currentCategory.id ? 'Editar Categoria' : 'Nova Categoria'}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsCategoryModalOpen(false)} className="text-white/50 hover:text-white">
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-5 p-6">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Identificação</Label>
                <Input
                  value={currentCategory.name}
                  onChange={(event) =>
                    setCurrentCategory((previous) => ({ ...previous, name: event.target.value }))
                  }
                  className="border-white/10 bg-black/40 focus-visible:ring-brand-violet font-semibold text-white"
                  placeholder="Ex: Biologia"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Cor de Destaque</Label>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl border-2 border-white/10 shadow-inner flex shrink-0 items-center justify-center overflow-hidden bg-black/40">
                    <Input
                      type="color"
                      value={currentCategory.color}
                      onChange={(event) =>
                        setCurrentCategory((previous) => ({ ...previous, color: event.target.value }))
                      }
                      className="h-16 w-16 cursor-pointer border-0 p-0"
                    />
                  </div>
                  <div className="flex-1 text-xs text-white/50 font-mono bg-black/40 p-3 rounded-xl border border-white/5 uppercase">
                    {currentCategory.color}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <Button variant="ghost" onClick={() => setIsCategoryModalOpen(false)} className="hover:bg-white/5">
                  Cancelar
                </Button>
                <Button onClick={handleSaveCategory} disabled={isPending} className="bg-brand-violet text-white hover:bg-brand-violet/90 shadow-[0_0_15px_rgba(139,92,246,0.4)]">
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Módulo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Menu Lateral Tático */}
      <nav className="hidden w-64 shrink-0 flex-col gap-2 md:flex relative z-10">
        <div className="mb-4 px-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Settings className="w-4 h-4" /> Sistema
          </h2>
        </div>
        <NavButton active={currentTab === 'profile'} onClick={() => setCurrentTab('profile')} icon={User} label="Perfil Neural" />
        <NavButton active={currentTab === 'appearance'} onClick={() => setCurrentTab('appearance')} icon={Palette} label="Aparência Visual" />
        <NavButton active={currentTab === 'workspace'} onClick={() => setCurrentTab('workspace')} icon={FolderTree} label="Organização" />
        <NavButton active={currentTab === 'integrations'} onClick={() => setCurrentTab('integrations')} icon={Globe} label="Integrações API" />
      </nav>

      {/* Área de Conteúdo */}
      <div className="min-w-0 flex-1 relative z-10">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          
          {/* ABA PERFIL */}
          <TabsContent value="profile">
            <Card className="border-white/5 bg-card/40 backdrop-blur-xl shadow-2xl">
              <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                <CardTitle className="text-xl">Identificação de Usuário</CardTitle>
                <CardDescription>Atualize suas credenciais de acesso ao sistema.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 p-6">
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-brand-violet/20 blur-xl rounded-full group-hover:bg-brand-violet/40 transition-all" />
                    <Avatar className="h-24 w-24 border-2 border-white/10 ring-4 ring-brand-violet/20 relative z-10">
                      <AvatarImage src={profile?.avatar_url || ''} />
                      <AvatarFallback className="bg-gradient-to-br from-brand-violet to-brand-cyan text-2xl font-black text-white">
                        {fullName?.substring(0, 2).toUpperCase() || 'US'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-white text-lg">{fullName || 'Explorador'}</h3>
                    <Badge variant="outline" className="bg-brand-violet/10 text-brand-violet border-brand-violet/20 uppercase tracking-widest text-[9px]">
                      <ShieldCheck className="w-3 h-3 mr-1" /> Piloto Autorizado
                    </Badge>
                  </div>
                </div>
                
                <Separator className="bg-white/5" />
                
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Nome de Registro</Label>
                    <Input
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      className="border-white/10 bg-black/40 h-12 focus-visible:ring-brand-violet font-semibold"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Link de Comunicação (Email)</Label>
                    <Input value={user?.email || ''} disabled className="border-white/5 bg-black/60 opacity-50 h-12 cursor-not-allowed" />
                  </div>
                </div>
                
                <div className="flex justify-end pt-4 border-t border-white/5">
                  <Button onClick={handleSaveProfile} disabled={isPending} className="bg-brand-violet text-white hover:bg-brand-violet/90 shadow-neon">
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Atualizar Banco de Dados
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA APARÊNCIA */}
          <TabsContent value="appearance">
            <Card className="border-white/5 bg-card/40 backdrop-blur-xl shadow-2xl">
              <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Zap className="w-5 h-5 text-brand-violet" /> Motores Visuais
                </CardTitle>
                <CardDescription>
                  Configure a iluminação e as cores para melhorar sua retenção cognitiva.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 p-6">
                
                <div className="space-y-4">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">Espectro de Cor Principal</Label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {accentColors.map((color) => (
                      <button
                        key={color.variable}
                        onClick={() => setActiveColor(color.variable)}
                        className={cn(
                          'group relative rounded-xl border p-4 text-left transition-all overflow-hidden',
                          activeColor === color.variable
                            ? 'border-white/40 bg-white/10 shadow-lg'
                            : 'border-white/5 bg-black/20 hover:border-white/20 hover:bg-white/[0.02]'
                        )}
                      >
                        {activeColor === color.variable && (
                          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundColor: color.hex }} />
                        )}
                        <div
                          className={cn(
                            "mb-3 h-6 w-6 rounded-full border-2 transition-transform duration-300",
                            activeColor === color.variable ? "border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.5)]" : "border-white/10 group-hover:scale-110"
                          )}
                          style={{ backgroundColor: color.hex }}
                        />
                        <p className={cn("text-xs font-bold uppercase tracking-wider", activeColor === color.variable ? "text-white" : "text-muted-foreground group-hover:text-white/80")}>
                          {color.name}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">Ambiente de Fundo (HUD)</Label>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {backgroundPresets.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => setBackgroundPreset(preset.id)}
                        className={cn(
                          'group rounded-xl border p-2 text-left transition-all',
                          backgroundPreset === preset.id
                            ? 'border-brand-violet/50 bg-brand-violet/5 shadow-[0_0_20px_var(--brand-glow)]'
                            : 'border-white/5 bg-black/20 hover:border-white/20'
                        )}
                      >
                        <div className="h-20 rounded-lg border border-white/10 w-full transition-transform duration-500 group-hover:scale-[1.02]" style={{ background: preset.preview }} />
                        <div className="p-2">
                          <p className={cn("text-xs font-bold uppercase tracking-wider", backgroundPreset === preset.id ? "text-brand-violet" : "text-muted-foreground")}>
                            {preset.label}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-white/5">
                  <Button onClick={handleSaveAppearance} disabled={isPending} className="bg-brand-violet text-white hover:bg-brand-violet/90 shadow-neon">
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Sincronizar Visuais
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA CATEGORIAS (WORKSPACE) */}
          <TabsContent value="workspace">
            <Card className="border-white/5 bg-card/40 backdrop-blur-xl shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-white/[0.02]">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <FolderTree className="h-5 w-5 text-brand-cyan" />
                    Módulos de Estudo
                  </CardTitle>
                  <CardDescription>O núcleo que alimenta o Mapa de Retenção Neural.</CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setCurrentCategory({ id: '', name: '', color: '#6366f1' })
                    setIsCategoryModalOpen(true)
                  }}
                  className="bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 hover:bg-brand-cyan hover:text-black transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                >
                  <Plus className="mr-2 h-4 w-4" /> Novo Módulo
                </Button>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <div
                        key={category.id}
                        className="group flex items-center justify-between border border-white/5 bg-black/20 p-4 rounded-xl transition-all hover:border-white/20 hover:bg-white/[0.02]"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="h-3 w-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: category.color }} />
                          <span className="font-bold text-sm text-white/90 truncate">{category.name}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-muted-foreground hover:text-white bg-white/5"
                            onClick={() => {
                              setCurrentCategory({
                                id: category.id,
                                name: category.name,
                                color: category.color,
                              })
                              setIsCategoryModalOpen(true)
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20"
                            onClick={() => handleRemoveCategory(category.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                      <FolderTree className="h-10 w-10 text-white/10 mb-3" />
                      <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                        Nenhum módulo detectado.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA INTEGRAÇÕES */}
          <TabsContent value="integrations" className="space-y-4">
            <Card className="border-white/5 bg-card/40 backdrop-blur-xl shadow-2xl">
              <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Globe className="w-5 h-5 text-emerald-400" />
                  Conexões Externas
                </CardTitle>
                <CardDescription>Ligue o FocusOS a outros sistemas para automação total.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                
                {/* SPOTIFY CARD (CORRIGIDO) */}
                <IntegrationCard
                  lucideIcon={Music}
                  iconColor="#1DB954"
                  title="Spotify API"
                  description="Controle o player e playlists pelo Modo Zen."
                  connected={integrations.some((integration) => integration.provider === 'spotify')}
                  actionUrl="/api/integrations/spotify/connect" // A ROTA CORRETA AQUI!
                />
                
                <IntegrationCard
                  icon="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg"
                  title="Google Calendar"
                  description="Sincronize eventos como missões."
                  connected={integrations.some((integration) => integration.provider === 'google_calendar')}
                  actionUrl="#"
                />
                
                <IntegrationCard
                  lucideIcon={Github}
                  title="GitHub"
                  description="Importe issues como tarefas táticas."
                  connected={false}
                  actionUrl="#"
                />
                
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function NavButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <Button
      variant="ghost"
      className={cn(
        'justify-start gap-3 h-12 transition-all',
        active 
          ? 'bg-brand-violet/10 text-brand-violet border-r-2 border-brand-violet hover:bg-brand-violet/20 hover:text-brand-violet' 
          : 'text-muted-foreground hover:bg-white/5 hover:text-white'
      )}
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
      <span className="font-semibold uppercase tracking-wider text-xs">{label}</span>
    </Button>
  )
}

function IntegrationCard({ icon, lucideIcon: Icon, title, description, connected, iconColor, actionUrl }: any) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/20 p-5 hover:border-white/10 transition-colors group">
      <div className="flex items-center gap-5">
        <div className={cn(
          "flex h-14 w-14 items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] shadow-inner transition-colors",
          connected ? "border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.1)]" : "group-hover:bg-white/5"
        )}>
          {icon ? (
            <img src={icon} alt={title} className="h-8 w-8 object-contain" />
          ) : Icon ? (
            <Icon className="h-8 w-8" style={{ color: connected ? iconColor || '#fff' : '#888' }} />
          ) : null}
        </div>
        <div>
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            {title}
            {connected && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Online" />}
          </h4>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">{description}</p>
        </div>
      </div>
      <Button
        variant={connected ? 'outline' : 'default'}
        className={cn(
          "min-w-[120px] font-bold text-xs uppercase tracking-widest",
          connected 
            ? 'border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300' 
            : 'bg-white text-black hover:bg-gray-200'
        )}
        onClick={() => {
          if (!connected && actionUrl) window.location.href = actionUrl
        }}
      >
        {connected ? 'Desconectar' : 'Conectar'}
      </Button>
    </div>
  )
}