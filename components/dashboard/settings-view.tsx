'use client'

import { useState, useTransition } from 'react'
import { useTheme } from 'next-themes'
import { 
  User, Mail, Palette, Globe, 
  Moon, Sun, Laptop, 
  LogOut, CheckCircle2, Loader2, Calendar, FolderTree, Layout, Plus, Trash2, GripVertical
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
import { updateProfile, disconnectIntegration } from '@/lib/actions/settings'
import { Category } from '@/lib/types'

// Cores de destaque (Neon Palette)
const accentColors = [
  { name: 'Violet', value: '263.4 70% 50.4%', hex: '#8b5cf6', variable: 'violet' },
  { name: 'Cyan', value: '189 94% 43%', hex: '#06b6d4', variable: 'cyan' },
  { name: 'Amber', value: '38 92% 50%', hex: '#f59e0b', variable: 'amber' },
  { name: 'Emerald', value: '142 76% 36%', hex: '#10b981', variable: 'emerald' },
  { name: 'Rose', value: '343 87% 55%', hex: '#f43f5e', variable: 'rose' },
]

export function SettingsView({ user, profile, integrations, categories }: any) {
  const [isPending, startTransition] = useTransition()
  const { theme, setTheme } = useTheme()
  const [currentTab, setCurrentTab] = useState('profile')
  const [activeColor, setActiveColor] = useState('violet')

  // Estado local para simular o front-end das colunas do Kanban
  const [kanbanColumns, setKanbanColumns] = useState([
    { id: 'todo', title: 'A Fazer', color: '#64748b' },
    { id: 'in_progress', title: 'Em Foco', color: '#8b5cf6' },
    { id: 'done', title: 'Concluído', color: '#10b981' },
  ])

  const handleUpdateProfile = (formData: FormData) => {
    startTransition(async () => {
        const res = await updateProfile(formData)
        if (res.error) toast.error(res.error)
        else toast.success(res.success)
    })
  }

  const handleDisconnect = (provider: string) => {
    toast.promise(disconnectIntegration(provider), {
        loading: 'Desconectando...',
        success: 'Integração removida!',
        error: 'Erro ao desconectar.'
    })
  }

  const handleGoogleConnect = () => {
    window.location.href = '/api/integrations/google/connect'
  }

  const googleConnected = integrations.some((i: any) => i.provider === 'google_calendar')

  return (
    <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
        
      {/* Sidebar de Navegação */}
      <nav className="hidden md:flex flex-col w-64 gap-2 shrink-0">
         <Button variant={currentTab === 'profile' ? 'secondary' : 'ghost'} className="justify-start gap-3" onClick={() => setCurrentTab('profile')}>
            <User className="w-4 h-4" /> Perfil
         </Button>
         <Button variant={currentTab === 'appearance' ? 'secondary' : 'ghost'} className="justify-start gap-3" onClick={() => setCurrentTab('appearance')}>
            <Palette className="w-4 h-4" /> Aparência
         </Button>
         {/* NOVA ABA: ORGANIZAÇÃO */}
         <Button variant={currentTab === 'workspace' ? 'secondary' : 'ghost'} className="justify-start gap-3" onClick={() => setCurrentTab('workspace')}>
            <FolderTree className="w-4 h-4" /> Organização
         </Button>
         <Button variant={currentTab === 'integrations' ? 'secondary' : 'ghost'} className="justify-start gap-3" onClick={() => setCurrentTab('integrations')}>
            <Globe className="w-4 h-4" /> Integrações
         </Button>
      </nav>

      {/* Conteúdo Principal */}
      <div className="flex-1 space-y-6 min-w-0">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            
            {/* Mobile Navigation */}
            <TabsList className="md:hidden grid w-full grid-cols-4 mb-6 h-auto p-1">
                <TabsTrigger value="profile" className="text-[10px] py-2">Perfil</TabsTrigger>
                <TabsTrigger value="appearance" className="text-[10px] py-2">Visual</TabsTrigger>
                <TabsTrigger value="workspace" className="text-[10px] py-2">Organizar</TabsTrigger>
                <TabsTrigger value="integrations" className="text-[10px] py-2">Apps</TabsTrigger>
            </TabsList>

            {/* --- TAB PERFIL (Igual ao que já tínhamos) --- */}
            <TabsContent value="profile" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="border-white/10 bg-[#121214]/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Informações Pessoais</CardTitle>
                        <CardDescription>Gerencie seus dados públicos e de conta.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={handleUpdateProfile} className="space-y-6">
                            <div className="flex items-center gap-6">
                                <Avatar className="w-20 h-20 border-2 border-white/10">
                                    <AvatarImage src={profile?.avatar_url} />
                                    <AvatarFallback className="text-xl bg-brand-violet text-white">
                                        {profile?.full_name?.substring(0, 2).toUpperCase() || 'US'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                    <Button variant="outline" size="sm" type="button" disabled>Alterar Foto</Button>
                                </div>
                            </div>
                            <Separator className="bg-white/5" />
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Nome Completo</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input id="fullName" name="fullName" defaultValue={profile?.full_name} className="pl-9 bg-black/20 border-white/10" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input id="email" value={user?.email} disabled className="pl-9 bg-black/40 border-white/5 text-muted-foreground cursor-not-allowed" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={isPending} className="bg-brand-violet hover:bg-brand-violet/90">
                                    {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Salvar Alterações
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* --- TAB APARÊNCIA (Igual ao que já tínhamos) --- */}
            <TabsContent value="appearance" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="border-white/10 bg-[#121214]/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Tema & Cores</CardTitle>
                        <CardDescription>Customize a interface do Focus OS para o seu estilo.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="space-y-3">
                            <Label>Modo de Exibição</Label>
                            <div className="grid grid-cols-3 gap-4">
                                <button onClick={() => setTheme('light')} className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-brand-violet bg-brand-violet/10' : 'border-white/5 hover:border-white/20 bg-black/20'}`}>
                                    <Sun className="w-6 h-6 mb-2" />
                                    <span className="text-xs font-medium">Claro</span>
                                </button>
                                <button onClick={() => setTheme('dark')} className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-brand-violet bg-brand-violet/10' : 'border-white/5 hover:border-white/20 bg-black/20'}`}>
                                    <Moon className="w-6 h-6 mb-2" />
                                    <span className="text-xs font-medium">Escuro</span>
                                </button>
                                <button onClick={() => setTheme('system')} className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${theme === 'system' ? 'border-brand-violet bg-brand-violet/10' : 'border-white/5 hover:border-white/20 bg-black/20'}`}>
                                    <Laptop className="w-6 h-6 mb-2" />
                                    <span className="text-xs font-medium">Sistema</span>
                                </button>
                            </div>
                        </div>
                        <Separator className="bg-white/5" />
                        <div className="space-y-3">
                            <Label>Cor de Destaque (Neon)</Label>
                            <div className="flex flex-wrap gap-4">
                                {accentColors.map((color) => (
                                    <button
                                        key={color.variable}
                                        onClick={() => {
                                            setActiveColor(color.variable)
                                            document.documentElement.style.setProperty('--brand-violet', color.value)
                                        }}
                                        className={`group relative w-12 h-12 rounded-full flex items-center justify-center transition-all ${activeColor === color.variable ? 'ring-2 ring-white ring-offset-2 ring-offset-[#121214]' : 'hover:scale-110'}`}
                                        style={{ backgroundColor: color.hex }}
                                    >
                                        {activeColor === color.variable && <CheckCircle2 className="w-6 h-6 text-white drop-shadow-md" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* --- NOVA TAB: WORKSPACE (ORGANIZAÇÃO) --- */}
            <TabsContent value="workspace" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Gestão de Categorias */}
                <Card className="border-white/10 bg-[#121214]/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <FolderTree className="w-5 h-5 text-brand-cyan" /> Categorias & Tags
                            </CardTitle>
                            <CardDescription>Organize suas tarefas criando etiquetas de cores.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" className="hidden sm:flex border-white/10 bg-black/20 hover:bg-white/5" onClick={() => toast.info('Modal de criar categoria em breve!')}>
                            <Plus className="w-4 h-4 mr-2" /> Nova Categoria
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-3">
                            {categories && categories.length > 0 ? categories.map((cat: Category) => (
                                <Badge key={cat.id} variant="outline" className="px-3 py-1.5 text-sm bg-black/20 flex items-center gap-2 pr-1 border-white/10 group">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                                    {cat.name}
                                    <Button variant="ghost" size="icon" className="w-5 h-5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 rounded-full p-0">
                                        <Trash2 className="w-3 h-3 text-muted-foreground hover:text-red-400" />
                                    </Button>
                                </Badge>
                            )) : (
                                <p className="text-sm text-muted-foreground italic">Nenhuma categoria criada.</p>
                            )}
                            {/* Botão Mobile */}
                            <Button variant="outline" size="sm" className="sm:hidden border-dashed border-white/20 text-muted-foreground">
                                <Plus className="w-3 h-3 mr-1" /> Adicionar
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Gestão de Colunas do Kanban */}
                <Card className="border-white/10 bg-[#121214]/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-start sm:items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Layout className="w-5 h-5 text-brand-violet" /> Colunas do Kanban
                            </CardTitle>
                            <CardDescription>Personalize o fluxo de trabalho do seu quadro (Em breve).</CardDescription>
                        </div>
                        <Button size="sm" className="bg-brand-violet hover:bg-brand-violet/90 text-white shadow-neon-violet mt-4 sm:mt-0" onClick={() => toast.info('Funcionalidade sendo conectada ao banco!')}>
                            <Plus className="w-4 h-4 mr-2" /> Nova Coluna
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {kanbanColumns.map((col, index) => (
                                <div key={col.id} className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-black/20 hover:bg-white/[0.02] transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-white p-1">
                                            <GripVertical className="w-4 h-4" />
                                        </div>
                                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: col.color }} />
                                        <span className="font-medium text-sm text-white">{col.title}</span>
                                        {index === 0 && <Badge variant="secondary" className="text-[10px] ml-2 bg-white/5">Padrão Inicial</Badge>}
                                        {index === kanbanColumns.length - 1 && <Badge variant="secondary" className="text-[10px] ml-2 bg-green-500/10 text-green-400 border-green-500/20">Finalizado</Badge>}
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-400">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
                            Arraste para reordenar as colunas no seu painel.
                        </p>
                    </CardContent>
                </Card>

            </TabsContent>

            {/* --- TAB INTEGRAÇÕES (Igual ao que já tínhamos) --- */}
            <TabsContent value="integrations" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="border-white/10 bg-[#121214]/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Conexões Externas</CardTitle>
                        <CardDescription>Supercharge seu fluxo de trabalho conectando apps.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-black/20">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="GCal" className="w-8 h-8" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                                        Google Calendar
                                        {googleConnected && <span className="px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-500 text-[10px] border border-green-500/20">Ativo</span>}
                                    </h4>
                                    <p className="text-xs text-muted-foreground">Sincronize tarefas automaticamente com sua agenda.</p>
                                </div>
                            </div>
                            {googleConnected ? (
                                <Button variant="outline" className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300" onClick={() => handleDisconnect('google_calendar')}>
                                    <LogOut className="w-4 h-4 mr-2" /> Desconectar
                                </Button>
                            ) : (
                                <Button className="bg-white text-black hover:bg-white/90" onClick={handleGoogleConnect}>
                                    <Calendar className="w-4 h-4 mr-2" /> Conectar
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

        </Tabs>
      </div>
    </div>
  )
}