'use client'

import { useEffect, useState, useTransition, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import {
  FolderTree, Github, Globe, Loader2,
  Music, Palette, Plus, Save, Pencil, Trash2, User,
  X, Settings, ShieldCheck, Zap
} from 'lucide-react'
import { toast } from 'sonner'

// UI Components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Actions & Types
import { updateProfile } from '@/lib/actions/profile'
import { createCategory, deleteCategory, updateCategory } from '@/lib/actions/categories'
import type { Categoria, Profile } from '@/lib/types'

// --- Constantes ---
const ACCENT_COLORS = [
  { name: 'Índigo Elétrico', hex: '#6366f1', variable: 'violet' },
  { name: 'Azul Oceano', hex: '#0ea5e9', variable: 'sky' },
  { name: 'Ciano Fluxo', hex: '#06b6d4', variable: 'cyan' },
  { name: 'Verde Vital', hex: '#10b981', variable: 'emerald' },
  { name: 'Coral Quente', hex: '#f43f5e', variable: 'rose' },
  { name: 'Âmbar Solar', hex: '#f59e0b', variable: 'amber' },
] as const

const BG_PRESETS = [
  {
    id: 'aurora',
    label: 'Aurora',
    preview: 'linear-gradient(135deg,#0b1024 0%,#1b1f3a 40%,#101828 100%)',
    image: 'radial-gradient(circle at 10% 0%, hsl(var(--brand-primary-hsl) / 0.15), transparent 35%), radial-gradient(circle at 80% 10%, hsl(var(--brand-cyan-hsl) / 0.12), transparent 42%), linear-gradient(180deg, hsl(224 43% 7%), hsl(225 35% 9%))',
  },
  {
    id: 'ocean',
    label: 'Azul Profundo',
    preview: 'linear-gradient(135deg,#0b1724 0%,#10263f 45%,#0d1a2e 100%)',
    image: 'radial-gradient(circle at 20% -5%, hsl(var(--brand-cyan-hsl) / 0.18), transparent 45%), radial-gradient(circle at 90% 0%, hsl(var(--brand-sky-hsl) / 0.14), transparent 40%), linear-gradient(180deg, hsl(210 45% 9%), hsl(214 46% 11%))',
  },
  {
    id: 'graphite',
    label: 'Grafite',
    preview: 'linear-gradient(135deg,#121212 0%,#1a1f29 50%,#0d1117 100%)',
    image: 'radial-gradient(circle at 15% 0%, hsl(var(--brand-primary-hsl) / 0.1), transparent 35%), radial-gradient(circle at 80% 5%, hsl(var(--brand-emerald-hsl) / 0.08), transparent 35%), linear-gradient(180deg, hsl(223 28% 8%), hsl(224 28% 10%))',
  },
] as const

type BackgroundPresetId = (typeof BG_PRESETS)[number]['id']

// --- Componentes Atômicos ---

const CategoryModal = ({ 
  isOpen, 
  onClose, 
  category, 
  isPending, 
  onSave 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  category: Categoria, 
  isPending: boolean, 
  onSave: (data: Categoria) => void 
}) => {
  const [localState, setLocalState] = useState<Categoria>(category)
  
  useEffect(() => setLocalState(category), [category])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md"
          >
            <Card className="bg-[#0c0c0e]/95 border-brand-violet/30 shadow-[0_0_50px_rgba(139,92,246,0.15)] overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-transparent via-brand-violet to-transparent" />
              <CardHeader className="flex flex-row items-center justify-between border-b border-white/5">
                <CardTitle className="flex items-center gap-2 text-white text-sm uppercase tracking-widest font-bold">
                  <FolderTree className="w-4 h-4 text-brand-violet" />
                  {localState.id ? 'Editar Módulo' : 'Novo Módulo'}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={onClose} className="text-white/50 hover:text-white">
                  <X className="h-5 w-5" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Nome de Registro</Label>
                  <Input
                    value={localState.nome || ''}
                    onChange={(e) => setLocalState(prev => ({ ...prev, nome: e.target.value }))}
                    className="border-white/10 bg-black/40 focus-visible:ring-brand-violet font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Assinatura Cromática</Label>
                  <div className="flex items-center gap-4 bg-black/40 p-3 rounded-xl border border-white/5">
                    <input
                      type="color"
                      value={localState.cor || '#6366f1'}
                      onChange={(e) => setLocalState(prev => ({ ...prev, cor: e.target.value }))}
                      className="h-10 w-10 cursor-pointer bg-transparent border-none"
                    />
                    <code className="flex-1 text-xs text-brand-violet uppercase font-mono">{localState.cor}</code>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="ghost" onClick={onClose} disabled={isPending}>Cancelar</Button>
                  <Button 
                    onClick={() => onSave(localState)} 
                    disabled={isPending} 
                    className="bg-brand-violet shadow-neon"
                  >
                    {isPending ? <Loader2 className="animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Sincronizar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// --- View Principal ---

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
  const { setTheme } = useTheme()
  const [currentTab, setCurrentTab] = useState('profile')
  const [fullName, setFullName] = useState(profile?.nome_completo || '')
  const [activeColor, setActiveColor] = useState('violet')
  const [backgroundPreset, setBackgroundPreset] = useState<BackgroundPresetId>('aurora')
  const [categories, setCategories] = useState<Categoria[]>(initialCategories || [])
  
  const [modal, setModal] = useState<{ isOpen: boolean; data: Categoria }>({ 
    isOpen: false, 
    data: { id: '', nome: '', cor: '#6366f1', usuario_id: '', criado_em: new Date().toISOString() } as Categoria 
  })

  useEffect(() => {
    const storedPreset = localStorage.getItem('taskflow-preset') as BackgroundPresetId
    const storedColor = localStorage.getItem('taskflow-accent')
    if (storedPreset) setBackgroundPreset(storedPreset)
    if (storedColor) setActiveColor(storedColor)
  }, [])

  useEffect(() => {
    const preset = BG_PRESETS.find(p => p.id === backgroundPreset)
    if (preset) document.body.style.setProperty('--app-bg-image', preset.image)
  }, [backgroundPreset])

  const handleSaveProfile = useCallback(() => {
    startTransition(async () => {
      const response = await updateProfile({ nome_completo: fullName })
      response.error ? toast.error(response.error) : toast.success('Perfil atualizado.')
    })
  }, [fullName])

  const handleSaveAppearance = useCallback(() => {
    localStorage.setItem('taskflow-preset', backgroundPreset)
    localStorage.setItem('taskflow-accent', activeColor)
    window.dispatchEvent(new Event('taskflow-appearance-changed'))
    toast.success('Interface reconfigurada.', { icon: <Palette className="w-4 h-4" /> })
  }, [backgroundPreset, activeColor])

  const handleCategorySave = useCallback((data: Categoria) => {
    startTransition(async () => {
      const response = data.id 
        ? await updateCategory(data.id, { nome: data.nome, cor: data.cor })
        : await createCategory({ nome: data.nome, cor: data.cor })
      
      if (response.error) toast.error(response.error)
      else {
        toast.success('Módulo sincronizado.')
        setModal(m => ({ ...m, isOpen: false }))
      }
    })
  }, [])

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-20 md:flex-row relative min-h-screen">
      
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-brand-violet/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[0%] right-[0%] w-[30%] h-[30%] bg-brand-cyan/5 blur-[100px] rounded-full" />
      </div>

      <CategoryModal 
        isOpen={modal.isOpen} 
        onClose={() => setModal(m => ({ ...m, isOpen: false }))}
        category={modal.data}
        isPending={isPending}
        onSave={handleCategorySave}
      />

      <aside className="hidden w-64 shrink-0 flex-col gap-1 md:flex z-10">
        <div className="mb-6 px-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-violet/70 flex items-center gap-2">
            <Settings className="w-3 h-3" /> System Terminal
          </h2>
        </div>
        <NavButton active={currentTab === 'profile'} onClick={() => setCurrentTab('profile')} icon={User} label="Perfil Neural" />
        <NavButton active={currentTab === 'appearance'} onClick={() => setCurrentTab('appearance')} icon={Palette} label="Motor Visual" />
        <NavButton active={currentTab === 'workspace'} onClick={() => setCurrentTab('workspace')} icon={FolderTree} label="Workspace" />
        <NavButton active={currentTab === 'integrations'} onClick={() => setCurrentTab('integrations')} icon={Globe} label="Conexões API" />
      </aside>

      <main className="min-w-0 flex-1 z-10">
        <Tabs value={currentTab} className="w-full">
          
          <TabsContent value="profile">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-white/5 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden border-t-brand-violet/30">
                <CardHeader className="bg-white/[0.02] border-b border-white/5">
                  <CardTitle className="text-xl font-bold tracking-tight">Identidade Biométrica</CardTitle>
                  <CardDescription>Gerencie suas credenciais de acesso ao núcleo.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-brand-violet/30 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      <Avatar className="h-24 w-24 border-2 border-brand-violet/30 ring-4 ring-black/50 relative">
                        <AvatarImage src={profile?.avatar_url || ''} />
                        <AvatarFallback className="bg-brand-violet text-2xl font-black">
                          {fullName?.substring(0, 2).toUpperCase() || '??'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-white">{fullName || 'Identidade Pendente'}</h3>
                      <Badge className="bg-brand-violet/10 text-brand-violet border-brand-violet/20 font-mono text-[9px] uppercase tracking-widest">
                        <ShieldCheck className="w-3 h-3 mr-1" /> Authorized Pilot
                      </Badge>
                    </div>
                  </div>

                  <Separator className="bg-white/5" />

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Nome Operacional</Label>
                      <Input 
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)}
                        className="bg-black/40 border-white/10 h-12 focus:border-brand-violet/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Link de Comunicação</Label>
                      <Input value={user?.email || ''} disabled className="bg-black/60 border-white/5 opacity-40 h-12" />
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4 border-t border-white/5">
                    <Button onClick={handleSaveProfile} disabled={isPending} className="bg-brand-violet shadow-neon">
                      {isPending ? <Loader2 className="animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Atualizar Núcleo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="appearance">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-white/5 bg-black/40 backdrop-blur-xl">
                <CardHeader className="bg-white/[0.02] border-b border-white/5">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Zap className="w-5 h-5 text-brand-violet" /> Motores Gráficos
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                  <div className="space-y-4">
                    <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Espectro Cromático</Label>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {ACCENT_COLORS.map((color) => (
                        <button
                          key={color.variable}
                          onClick={() => setActiveColor(color.variable)}
                          className={cn(
                            'group relative rounded-xl border p-4 text-left transition-all overflow-hidden',
                            activeColor === color.variable ? 'border-white/30 bg-white/5 shadow-lg' : 'border-white/5 bg-black/20 hover:bg-white/[0.02]'
                          )}
                        >
                          <div className={cn(
                            "mb-2 h-4 w-4 rounded-full border-2 transition-transform",
                            activeColor === color.variable ? "border-white scale-125" : "border-white/10"
                          )} style={{ backgroundColor: color.hex }} />
                          <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">{color.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Ambiente de Fundo</Label>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      {BG_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => setBackgroundPreset(preset.id)}
                          className={cn(
                            'group rounded-xl border p-2 transition-all',
                            backgroundPreset === preset.id ? 'border-brand-violet/50 bg-brand-violet/5' : 'border-white/5 bg-black/20'
                          )}
                        >
                          <div className="h-16 rounded-lg w-full mb-2" style={{ background: preset.preview }} />
                          <p className="text-[10px] font-bold uppercase text-center text-muted-foreground">{preset.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-white/5">
                    <Button onClick={handleSaveAppearance} className="bg-brand-violet shadow-neon">
                      Sincronizar Visuais
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="workspace">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-white/5 bg-black/40 backdrop-blur-xl">
                <CardHeader className="flex flex-row items-center justify-between bg-white/[0.02] border-b border-white/5">
                  <div>
                    <CardTitle className="text-xl font-bold">Módulos de Estudo</CardTitle>
                    <CardDescription className="text-[10px] uppercase tracking-tighter">Core Processing Units</CardDescription>
                  </div>
                  <Button 
                    onClick={() => setModal({ 
                      isOpen: true, 
                      data: { id: '', nome: '', cor: '#6366f1', usuario_id: '', criado_em: new Date().toISOString() } as Categoria 
                    })}
                    className="bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 hover:bg-brand-cyan hover:text-black"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Novo Módulo
                  </Button>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((cat) => (
                      <div key={cat.id} className="group relative bg-white/[0.02] border border-white/5 p-4 rounded-xl flex items-center justify-between hover:border-white/20 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-8 rounded-full" style={{ backgroundColor: cat.cor }} />
                          <span className="font-bold text-sm text-white/80">{cat.nome}</span>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setModal({ isOpen: true, data: cat })}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-red-500 hover:bg-red-500/10"
                            onClick={() => {
                              startTransition(async () => {
                                await deleteCategory(cat.id)
                                toast.success('Módulo removido.')
                              })
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="integrations">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-white/5 bg-black/40 backdrop-blur-xl">
                <CardHeader className="bg-white/[0.02] border-b border-white/5">
                  <CardTitle className="text-xl font-bold">Protocolos Externos</CardTitle>
                  <CardDescription>Conecte o FocusOS a redes de dados mundiais.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <IntegrationCard 
                    icon={Music} 
                    title="Spotify API" 
                    desc="Controle de Áudio e Ondas Alfa"
                    connected={integrations.some(i => i.provider === 'spotify')}
                    color="#1DB954"
                    url="/api/integrations/spotify/connect"
                  />
                  <IntegrationCard 
                    icon={Github} 
                    title="GitHub" 
                    desc="Sincronização de Repositórios Táticos"
                    connected={false}
                    color="#fff"
                    url="#"
                  />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  )
}

function NavButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <Button
      variant="ghost"
      className={cn(
        'justify-start gap-3 h-12 transition-all relative overflow-hidden group',
        active ? 'bg-brand-violet/10 text-brand-violet' : 'text-muted-foreground hover:bg-white/5 hover:text-white'
      )}
      onClick={onClick}
    >
      {active && <motion.div layoutId="activeNav" className="absolute left-0 w-1 h-6 bg-brand-violet rounded-full" />}
      <Icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", active && "text-brand-violet")} />
      <span className="font-bold uppercase tracking-widest text-[10px]">{label}</span>
    </Button>
  )
}

function IntegrationCard({ icon: Icon, title, desc, connected, color, url }: any) {
  return (
    <div className="flex items-center justify-between p-5 rounded-2xl border border-white/5 bg-black/20 hover:border-white/10 transition-all">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <Icon className="h-6 w-6" style={{ color: connected ? color : '#444' }} />
        </div>
        <div>
          <h4 className="font-bold text-white flex items-center gap-2">
            {title}
            {connected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
          </h4>
          <p className="text-[10px] uppercase tracking-tight text-muted-foreground">{desc}</p>
        </div>
      </div>
      <Button 
        variant={connected ? 'outline' : 'default'} 
        className={cn("text-[10px] font-bold uppercase h-9", connected ? "border-red-500/20 text-red-400 hover:bg-red-500/10" : "bg-white text-black")}
        onClick={() => !connected && (window.location.href = url)}
      >
        {connected ? 'Desconectar' : 'Conectar'}
      </Button>
    </div>
  )
}