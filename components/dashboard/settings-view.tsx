'use client'

import { useState, useTransition, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { 
  User, Mail, Palette, Globe, Moon, Sun, Laptop, 
  LogOut, CheckCircle2, Loader2, Calendar, FolderTree, 
  Plus, Trash2, Save, X, Github, Music 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Actions e Tipos
import { updateProfile } from '@/lib/actions/profile'
import { createCategory, updateCategory, deleteCategory } from '@/lib/actions/categories'
import type { Categoria } from '@/lib/types'

const accentColors = [
  { name: 'Violet', hex: '#8b5cf6', variable: 'violet' },
  { name: 'Cyan', hex: '#06b6d4', variable: 'cyan' },
  { name: 'Amber', hex: '#f59e0b', variable: 'amber' },
  { name: 'Emerald', hex: '#10b981', variable: 'emerald' },
  { name: 'Rose', hex: '#f43f5e', variable: 'rose' },
]

export function SettingsView({ user, profile, integrations, initialCategories }: any) {
  const [isPending, startTransition] = useTransition()
  const { theme, setTheme } = useTheme()
  const [currentTab, setCurrentTab] = useState('profile')
  
  // Estados Locais
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [activeColor, setActiveColor] = useState(profile?.theme_color || 'violet')
  const [categories, setCategories] = useState<Categoria[]>(initialCategories || [])
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [currentCategory, setCurrentCategory] = useState({ id: '', name: '', color: '#8b5cf6' })

  useEffect(() => {
    setCategories(initialCategories || [])
  }, [initialCategories])

  // --- PERSISTÊNCIA ---

  const handleSaveProfile = () => {
    startTransition(async () => {
      const res = await updateProfile({ full_name: fullName })
      if (res.error) toast.error(res.error)
      else toast.success(res.success)
    })
  }

  const handleSaveAppearance = () => {
    startTransition(async () => {
      const selected = accentColors.find(c => c.variable === activeColor)
      if (selected) {
        document.documentElement.style.setProperty('--brand-violet', selected.hex)
      }
      const res = await updateProfile({ theme_color: activeColor, theme_mode: theme })
      if (res.error) toast.error(res.error)
      else toast.success('Visual atualizado e salvo!')
    })
  }

  const handleSaveCategory = () => {
    if (!currentCategory.name.trim()) return
    startTransition(async () => {
      const res = currentCategory.id 
        ? await updateCategory(currentCategory.id, { name: currentCategory.name, color: currentCategory.color })
        : await createCategory({ name: currentCategory.name, color: currentCategory.color })
      
      if (res.error) toast.error(res.error)
      else {
        toast.success('Categoria sincronizada!')
        setIsCategoryModalOpen(false)
      }
    })
  }

  const handleRemoveCategory = (id: string) => {
    startTransition(async () => {
      const res = await deleteCategory(id)
      if (res.error) toast.error(res.error)
      else toast.success('Categoria removida.')
    })
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto pb-20 px-4">
      
      {/* MODAL DE CATEGORIA */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-[#121214] border-white/10 shadow-2xl animate-in zoom-in-95">
            <CardHeader className="flex flex-row items-center justify-between border-b border-white/5">
              <CardTitle>{currentCategory.id ? 'Editar' : 'Nova'} Categoria</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsCategoryModalOpen(false)}><X className="h-5 w-5" /></Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Nome da Categoria</Label>
                <Input value={currentCategory.name} onChange={(e) => setCurrentCategory({...currentCategory, name: e.target.value})} className="bg-black/50 border-white/10" />
              </div>
              <div className="space-y-2">
                <Label>Cor de Identificação</Label>
                <Input type="color" value={currentCategory.color} onChange={(e) => setCurrentCategory({...currentCategory, color: e.target.value})} className="h-12 p-1 bg-black/50 border-white/10 cursor-pointer" />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="ghost" onClick={() => setIsCategoryModalOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveCategory} disabled={isPending} className="bg-brand-violet text-white">
                  {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navegação Lateral */}
      <nav className="hidden md:flex flex-col w-64 gap-2 shrink-0">
         <NavButton active={currentTab === 'profile'} onClick={() => setCurrentTab('profile')} icon={User} label="Perfil" />
         <NavButton active={currentTab === 'appearance'} onClick={() => setCurrentTab('appearance')} icon={Palette} label="Aparência" />
         <NavButton active={currentTab === 'workspace'} onClick={() => setCurrentTab('workspace')} icon={FolderTree} label="Organização" />
         <NavButton active={currentTab === 'integrations'} onClick={() => setCurrentTab('integrations')} icon={Globe} label="Integrações" />
      </nav>

      <div className="flex-1 min-w-0">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            
            {/* --- ABA PERFIL --- */}
            <TabsContent value="profile" className="animate-in fade-in slide-in-from-bottom-4">
                <Card className="border-white/10 bg-[#121214]/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Informações da Conta</CardTitle>
                        <CardDescription>Atualize seu nome e veja seu email de acesso.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-6">
                            <Avatar className="w-20 h-20 border-2 border-white/10 ring-2 ring-brand-violet/20">
                                <AvatarImage src={profile?.avatar_url} />
                                <AvatarFallback className="bg-brand-violet text-white text-xl">
                                    {fullName?.substring(0, 2).toUpperCase() || 'US'}
                                </AvatarFallback>
                            </Avatar>
                            <Button variant="outline" size="sm" disabled className="border-white/10">Alterar Foto</Button>
                        </div>
                        <Separator className="bg-white/5" />
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Nome Completo</Label>
                                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-black/20 border-white/10" />
                            </div>
                            <div className="space-y-2">
                                <Label>Email de Acesso</Label>
                                <Input value={user?.email} disabled className="bg-black/40 border-white/5 opacity-50" />
                            </div>
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button onClick={handleSaveProfile} disabled={isPending} className="bg-brand-violet text-white">
                                {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Salvar Perfil
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* --- ABA APARÊNCIA --- */}
            <TabsContent value="appearance" className="animate-in fade-in slide-in-from-bottom-4">
                <Card className="border-white/10 bg-[#121214]/50 backdrop-blur-sm">
                    <CardHeader><CardTitle>Personalização</CardTitle></CardHeader>
                    <CardContent className="space-y-8">
                        <div className="grid grid-cols-3 gap-4">
                            <ThemeBtn active={theme === 'light'} onClick={() => setTheme('light')} icon={Sun} label="Claro" />
                            <ThemeBtn active={theme === 'dark'} onClick={() => setTheme('dark')} icon={Moon} label="Escuro" />
                            <ThemeBtn active={theme === 'system'} onClick={() => setTheme('system')} icon={Laptop} label="Sistema" />
                        </div>
                        <Separator className="bg-white/5" />
                        <div className="space-y-4">
                            <Label>Cor Neon de Destaque</Label>
                            <div className="flex flex-wrap gap-4">
                                {accentColors.map((color) => (
                                    <button
                                        key={color.variable}
                                        onClick={() => setActiveColor(color.variable)}
                                        className={cn(
                                          "w-12 h-12 rounded-full border-2 transition-all hover:scale-110", 
                                          activeColor === color.variable ? 'border-white ring-4 ring-white/10 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'border-transparent'
                                        )}
                                        style={{ backgroundColor: color.hex }}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button onClick={handleSaveAppearance} disabled={isPending} className="bg-brand-violet text-white">
                                {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                Aplicar Preferências
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* --- ABA ORGANIZAÇÃO --- */}
            <TabsContent value="workspace" className="animate-in fade-in slide-in-from-bottom-4">
                <Card className="border-white/10 bg-[#121214]/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2"><FolderTree className="w-5 h-5 text-brand-cyan" /> Suas Categorias</CardTitle>
                          <CardDescription>Etiquetas para organizar seu Kanban e relatórios.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" className="border-white/10" onClick={() => { setCurrentCategory({id: '', name: '', color: '#8b5cf6'}); setIsCategoryModalOpen(true) }}>
                          <Plus className="w-4 h-4 mr-2" /> Nova
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-3">
                            {categories.length > 0 ? categories.map((cat) => (
                                <Badge key={cat.id} variant="outline" className="px-3 py-1.5 bg-black/20 border-white/10 group hover:border-brand-violet/50 transition-all">
                                    <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: cat.color }} />
                                    {cat.name}
                                    <button onClick={() => { setCurrentCategory(cat); setIsCategoryModalOpen(true) }} className="ml-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-white transition-opacity text-[10px] uppercase font-bold">Editar</button>
                                    <button onClick={() => handleRemoveCategory(cat.id)} className="ml-2 opacity-0 group-hover:opacity-100 text-red-500/70 hover:text-red-400 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                                </Badge>
                            )) : <p className="text-muted-foreground text-sm italic">Crie categorias para organizar seus projetos.</p>}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* --- ABA INTEGRAÇÕES --- */}
            <TabsContent value="integrations" className="animate-in fade-in slide-in-from-bottom-4 space-y-4">
                <Card className="border-white/10 bg-[#121214]/50 backdrop-blur-sm">
                    <CardHeader><CardTitle>Conexões de Produtividade</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {/* Google Calendar */}
                        <IntegrationCard 
                          icon="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg"
                          title="Google Calendar"
                          description="Sincronize prazos automaticamente."
                          connected={integrations?.some((i: any) => i.provider === 'google_calendar')}
                        />
                        {/* GitHub */}
                        <IntegrationCard 
                          lucideIcon={Github}
                          title="GitHub"
                          description="Issues e PRs no seu Kanban."
                          connected={false}
                        />
                        {/* Spotify */}
                        <IntegrationCard 
                          lucideIcon={Music}
                          iconColor="#1DB954"
                          title="Spotify"
                          description="Foque com suas playlists Lo-Fi."
                          connected={false}
                        />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// --- SUBCOMPONENTES AUXILIARES ---

function NavButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <Button variant={active ? 'secondary' : 'ghost'} className={cn("justify-start gap-3", active && "bg-brand-violet/10 text-brand-violet border-l-2 border-brand-violet rounded-none")} onClick={onClick}>
      <Icon className="w-4 h-4" /> {label}
    </Button>
  )
}

function ThemeBtn({ active, onClick, icon: Icon, label }: any) {
  return (
    <button onClick={onClick} className={cn("flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all", active ? 'border-brand-violet bg-brand-violet/5 text-brand-violet' : 'border-white/5 bg-black/20 hover:border-white/20 text-muted-foreground')}>
      <Icon className="w-6 h-6 mb-2" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  )
}

function IntegrationCard({ icon, lucideIcon: Icon, title, description, connected, iconColor }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-black/20 hover:border-white/10 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden border border-white/5">
          {icon ? <img src={icon} className="w-7 h-7 object-contain" /> : <Icon className="w-7 h-7" style={{ color: iconColor }} />}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">{title}</h4>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Button variant={connected ? "destructive" : "outline"} size="sm" className={cn(!connected && "border-white/10 hover:bg-white/5")}>
        {connected ? 'Desconectar' : 'Conectar'}
      </Button>
    </div>
  )
}