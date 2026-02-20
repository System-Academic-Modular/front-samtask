'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Github, Music, CheckCircle2, AlertCircle, Link2, ExternalLink, 
  User, Palette, Columns, Plus, Trash2, Moon, Sun, Monitor, X, Save, Calendar
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Tab = 'account' | 'appearance' | 'workflow' | 'integrations'
type ThemeOption = 'dark' | 'light' | 'system'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('account')
  
  // --- ESTADOS: INTEGRAÇÕES ---
  const [isConnectedSpotify, setIsConnectedSpotify] = useState(false)
  const [isConnectedGithub, setIsConnectedGithub] = useState(false)
  const [isConnectedGoogle, setIsConnectedGoogle] = useState(false)
  const [isLoading, setIsLoading] = useState<string | null>(null)

  // --- ESTADOS: APARÊNCIA ---
  const [activeTheme, setActiveTheme] = useState<ThemeOption>('dark')
  const [activeColor, setActiveColor] = useState('#8b5cf6')
  const themeColors = ['#8b5cf6', '#10b981', '#f43f5e', '#0ea5e9', '#f59e0b']

  // --- ESTADOS: CONTA ---
  const [isSavingAccount, setIsSavingAccount] = useState(false)
  const [accountData, setAccountData] = useState({ name: 'Arthur Explorador' })

  // --- ESTADOS: CATEGORIAS (No padrão do novo DB) ---
  const [categories, setCategories] = useState([
    { KEY_CATEGORIA: '1', NOME: 'Desenvolvimento', COR: '#8b5cf6' },
    { KEY_CATEGORIA: '2', NOME: 'Ateliê Aflorar', COR: '#f43f5e' },
    { KEY_CATEGORIA: '3', NOME: 'Faculdade', COR: '#0ea5e9' },
  ])
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [currentCategory, setCurrentCategory] = useState({ KEY_CATEGORIA: '', NOME: '', COR: '#8b5cf6' })

  // ==========================================
  // FUNÇÕES DE AÇÃO
  // ==========================================

  const handleConnect = (platform: 'spotify' | 'github' | 'google') => {
    setIsLoading(platform)
    setTimeout(() => {
      if (platform === 'spotify') setIsConnectedSpotify(true)
      if (platform === 'github') setIsConnectedGithub(true)
      if (platform === 'google') setIsConnectedGoogle(true)
      setIsLoading(null)
      
      const platformName = platform === 'google' ? 'Google Calendar' : platform === 'spotify' ? 'Spotify' : 'GitHub'
      toast.success(`${platformName} conectado com sucesso!`)
    }, 1500)
  }

  const handleSaveAccount = () => {
    setIsSavingAccount(true)
    setTimeout(() => {
      setIsSavingAccount(false)
      toast.success('Dados do perfil atualizados com sucesso!')
    }, 1000)
  }

  // Ações do Modal de Categorias
  const openNewCategoryModal = () => {
    setCurrentCategory({ KEY_CATEGORIA: '', NOME: '', COR: '#8b5cf6' })
    setIsCategoryModalOpen(true)
  }

  const openEditCategoryModal = (cat: typeof currentCategory) => {
    setCurrentCategory(cat)
    setIsCategoryModalOpen(true)
  }

  const handleSaveCategory = () => {
    if (!currentCategory.NOME.trim()) {
      toast.error('O nome da categoria é obrigatório.')
      return
    }

    if (currentCategory.KEY_CATEGORIA) {
      setCategories(categories.map(c => c.KEY_CATEGORIA === currentCategory.KEY_CATEGORIA ? currentCategory : c))
      toast.success('Categoria atualizada!')
    } else {
      const newCat = { ...currentCategory, KEY_CATEGORIA: Math.random().toString(36).substring(7) }
      setCategories([...categories, newCat])
      toast.success('Categoria criada!')
    }
    setIsCategoryModalOpen(false)
  }

  const handleDeleteCategory = (key: string) => {
    setCategories(categories.filter(c => c.KEY_CATEGORIA !== key))
    toast.success('Categoria excluída com sucesso.')
  }

  return (
    <div className="max-w-6xl mx-auto pb-24 animate-in fade-in duration-500 flex flex-col md:flex-row gap-8 relative">
      
      {/* MODAL CUSTOMIZADO DE CATEGORIA */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#121214] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
              <h3 className="font-bold text-lg text-white">
                {currentCategory.KEY_CATEGORIA ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setIsCategoryModalOpen(false)} className="text-muted-foreground hover:text-white rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Nome da Categoria</Label>
                <Input 
                  value={currentCategory.NOME} 
                  onChange={(e) => setCurrentCategory({...currentCategory, NOME: e.target.value})}
                  placeholder="Ex: Trabalho, Estudos..." 
                  className="bg-black/50 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Cor de Identificação</Label>
                <div className="flex items-center gap-4">
                  <Input 
                    type="color" 
                    value={currentCategory.COR}
                    onChange={(e) => setCurrentCategory({...currentCategory, COR: e.target.value})}
                    className="w-14 h-14 p-1 bg-black/50 border-white/10 cursor-pointer rounded-lg"
                  />
                  <div className="flex-1 flex gap-2 flex-wrap">
                    {themeColors.map(color => (
                      <button 
                        key={color} 
                        onClick={() => setCurrentCategory({...currentCategory, COR: color})}
                        className={cn("w-8 h-8 rounded-full border-2 transition-all", currentCategory.COR === color ? "border-white scale-110" : "border-transparent hover:scale-110")}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-white/5 bg-black/20 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsCategoryModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveCategory} className="bg-brand-violet hover:bg-brand-violet/90 text-white">
                Salvar Categoria
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Menu Lateral */}
      <aside className="w-full md:w-64 shrink-0 space-y-1">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Ajustes</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas preferências.</p>
        </div>

        <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          <Button variant="ghost" onClick={() => setActiveTab('account')} className={cn("justify-start shrink-0", activeTab === 'account' ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white")}>
            <User className="w-4 h-4 mr-2" /> Minha Conta
          </Button>
          <Button variant="ghost" onClick={() => setActiveTab('appearance')} className={cn("justify-start shrink-0", activeTab === 'appearance' ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white")}>
            <Palette className="w-4 h-4 mr-2" /> Aparência e Temas
          </Button>
          <Button variant="ghost" onClick={() => setActiveTab('workflow')} className={cn("justify-start shrink-0", activeTab === 'workflow' ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white")}>
            <Columns className="w-4 h-4 mr-2" /> Categorias e Kanban
          </Button>
          <Button variant="ghost" onClick={() => setActiveTab('integrations')} className={cn("justify-start shrink-0", activeTab === 'integrations' ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white")}>
            <Link2 className="w-4 h-4 mr-2" /> Integrações
          </Button>
        </nav>
      </aside>

      <Separator orientation="vertical" className="hidden md:block min-h-[600px] bg-white/5" />

      {/* Área de Conteúdo */}
      <div className="flex-1 space-y-8 max-w-3xl">

        {/* --- ABA: MINHA CONTA --- */}
        {activeTab === 'account' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
             {/* ... (Mesmo código de Conta de antes) ... */}
            <div>
              <h2 className="text-xl font-semibold text-white">Dados do Perfil</h2>
              <p className="text-sm text-muted-foreground mt-1">Atualize suas informações pessoais e email.</p>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold border-4 border-[#09090b] shadow-xl" style={{ backgroundColor: activeColor }}>
                  {accountData.name.substring(0, 2).toUpperCase()}
                </div>
                <Button variant="outline" className="border-white/10 hover:bg-white/5" onClick={() => toast.info('Funcionalidade de upload em breve.')}>
                  Alterar Foto
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input 
                    value={accountData.name} 
                    onChange={(e) => setAccountData({ name: e.target.value })}
                    className="bg-black/50 border-white/10 focus-visible:ring-brand-violet" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input defaultValue="arthur@exemplo.com" disabled className="bg-black/20 border-white/5 text-muted-foreground" />
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-end">
                <Button onClick={handleSaveAccount} disabled={isSavingAccount} className="bg-brand-violet hover:bg-brand-violet/90 text-white">
                  {isSavingAccount ? 'Salvando...' : <><Save className="w-4 h-4 mr-2" /> Salvar Alterações</>}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* --- ABA: APARÊNCIA --- */}
        {activeTab === 'appearance' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            {/* ... (Mesmo código de Aparência de antes) ... */}
            <div>
              <h2 className="text-xl font-semibold text-white">Tema do Sistema</h2>
              <p className="text-sm text-muted-foreground mt-1">Personalize as cores para focar melhor.</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div onClick={() => { setActiveTheme('dark'); toast.success('Tema Escuro ativado!') }} className={cn("border rounded-xl p-4 flex flex-col items-center gap-3 cursor-pointer transition-all", activeTheme === 'dark' ? "border-brand-violet bg-brand-violet/5" : "border-white/10 bg-white/5 hover:bg-white/10")}>
                <Moon className={cn("w-6 h-6", activeTheme === 'dark' ? "text-brand-violet" : "text-muted-foreground")} />
                <span className={cn("text-sm font-medium", activeTheme === 'dark' ? "text-white" : "text-muted-foreground")}>Modo Escuro</span>
              </div>
              <div onClick={() => { setActiveTheme('light'); toast.success('Tema Claro ativado!') }} className={cn("border rounded-xl p-4 flex flex-col items-center gap-3 cursor-pointer transition-all", activeTheme === 'light' ? "border-brand-violet bg-brand-violet/5" : "border-white/10 bg-white/5 hover:bg-white/10")}>
                <Sun className={cn("w-6 h-6", activeTheme === 'light' ? "text-brand-violet" : "text-muted-foreground")} />
                <span className={cn("text-sm font-medium", activeTheme === 'light' ? "text-white" : "text-muted-foreground")}>Modo Claro</span>
              </div>
              <div onClick={() => { setActiveTheme('system'); toast.success('Tema do Sistema ativado!') }} className={cn("border rounded-xl p-4 flex flex-col items-center gap-3 cursor-pointer transition-all", activeTheme === 'system' ? "border-brand-violet bg-brand-violet/5" : "border-white/10 bg-white/5 hover:bg-white/10")}>
                <Monitor className={cn("w-6 h-6", activeTheme === 'system' ? "text-brand-violet" : "text-muted-foreground")} />
                <span className={cn("text-sm font-medium", activeTheme === 'system' ? "text-white" : "text-muted-foreground")}>Sistema</span>
              </div>
            </div>

            <div className="pt-4">
              <h3 className="text-sm font-semibold text-white mb-3">Cor de Destaque</h3>
              <div className="flex gap-3">
                {themeColors.map((color) => (
                  <button 
                    key={color} 
                    onClick={() => { setActiveColor(color); toast.success('Cor de destaque atualizada!') }}
                    className={cn("w-10 h-10 rounded-full border-2 transition-all outline-none", activeColor === color ? "border-white scale-110 shadow-lg" : "border-transparent hover:scale-110")} 
                    style={{ backgroundColor: color, boxShadow: activeColor === color ? `0 0 15px ${color}80` : 'none' }} 
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- ABA: KANBAN E CATEGORIAS --- */}
        {activeTab === 'workflow' && (
           <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
            {/* ... (Mesmo código de Workflow de antes) ... */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Suas Categorias</h2>
                  <p className="text-sm text-muted-foreground mt-1">Organize suas tarefas por áreas da vida.</p>
                </div>
                <Button onClick={openNewCategoryModal} size="sm" className="bg-brand-violet hover:bg-brand-violet/90 text-white gap-2">
                  <Plus className="w-4 h-4" /> Nova Categoria
                </Button>
              </div>

              <div className="bg-[#09090b]/50 border border-white/10 rounded-2xl divide-y divide-white/5">
                {categories.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">Nenhuma categoria criada.</div>
                ) : (
                  categories.map((cat) => (
                    <div key={cat.KEY_CATEGORIA} className="p-4 flex items-center justify-between group hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: cat.COR, boxShadow: `0 0 10px ${cat.COR}80` }} />
                        <span className="font-medium text-white/90">{cat.NOME}</span>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditCategoryModal(cat)} className="h-8 text-muted-foreground hover:text-white">Editar</Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(cat.KEY_CATEGORIA)} className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-white/5">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">Colunas do Kanban</h2>
                <p className="text-sm text-muted-foreground mt-1">O fluxo base do sistema (A Fazer, Em Foco, Concluído) está ativo.</p>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 p-3 rounded-xl border border-slate-500/20 bg-slate-500/5 text-center text-sm font-medium text-slate-300">A Fazer</div>
                <div className="flex-1 p-3 rounded-xl border border-brand-violet/20 bg-brand-violet/5 text-center text-sm font-medium text-brand-violet">Em Foco</div>
                <div className="flex-1 p-3 rounded-xl border border-brand-emerald/20 bg-brand-emerald/5 text-center text-sm font-medium text-brand-emerald">Concluído</div>
              </div>
            </div>
          </div>
        )}

        {/* --- ABA: INTEGRAÇÕES --- */}
        {activeTab === 'integrations' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Conexões Externas</h2>
              <p className="text-sm text-muted-foreground mt-1">Conecte suas ferramentas favoritas.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* GOOGLE CALENDAR */}
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#09090b]/50 backdrop-blur-sm p-6 flex flex-col justify-between group hover:border-[#4285F4]/30 transition-colors">
                {isConnectedGoogle && <div className="absolute top-0 right-0 w-32 h-32 bg-[#4285F4]/10 blur-3xl -z-10 rounded-full" />}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-full bg-[#4285F4]/10 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-[#4285F4]" />
                    </div>
                    {isConnectedGoogle ? (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-[#4285F4] bg-[#4285F4]/10 px-2.5 py-1 rounded-full border border-[#4285F4]/20"><CheckCircle2 className="w-3.5 h-3.5" /> Conectado</span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-white/5 px-2.5 py-1 rounded-full border border-white/10"><AlertCircle className="w-3.5 h-3.5" /> Desconectado</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Google Calendar</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">Sincronize seus eventos e reuniões diretamente com a sua Timeline.</p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-white/5">
                  {isConnectedGoogle ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/80 font-medium">Conta sincronizada</span>
                      <Button variant="ghost" size="sm" onClick={() => { setIsConnectedGoogle(false); toast.info('Desconectado do Google') }} className="text-red-400 hover:bg-red-400/10">Desconectar</Button>
                    </div>
                  ) : (
                    <Button onClick={() => handleConnect('google')} disabled={isLoading === 'google'} className="w-full bg-[#4285F4] hover:bg-[#4285F4]/90 text-white font-bold">
                      {isLoading === 'google' ? 'Conectando...' : 'Conectar ao Google'}
                    </Button>
                  )}
                </div>
              </div>

              {/* SPOTIFY */}
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#09090b]/50 backdrop-blur-sm p-6 flex flex-col justify-between group hover:border-[#1DB954]/30 transition-colors">
                {isConnectedSpotify && <div className="absolute top-0 right-0 w-32 h-32 bg-[#1DB954]/10 blur-3xl -z-10 rounded-full" />}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-full bg-[#1DB954]/10 flex items-center justify-center">
                      <Music className="w-6 h-6 text-[#1DB954]" />
                    </div>
                    {isConnectedSpotify ? (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-[#1DB954] bg-[#1DB954]/10 px-2.5 py-1 rounded-full border border-[#1DB954]/20"><CheckCircle2 className="w-3.5 h-3.5" /> Conectado</span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-white/5 px-2.5 py-1 rounded-full border border-white/10"><AlertCircle className="w-3.5 h-3.5" /> Desconectado</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Spotify</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">Controle suas playlists de Lo-Fi direto do Modo Zen.</p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-white/5">
                  {isConnectedSpotify ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/80 font-medium">Conta sincronizada</span>
                      <Button variant="ghost" size="sm" onClick={() => { setIsConnectedSpotify(false); toast.info('Desconectado do Spotify') }} className="text-red-400 hover:bg-red-400/10">Desconectar</Button>
                    </div>
                  ) : (
                    <Button onClick={() => handleConnect('spotify')} disabled={isLoading === 'spotify'} className="w-full bg-[#1DB954] hover:bg-[#1DB954]/90 text-black font-bold">
                      {isLoading === 'spotify' ? 'Conectando...' : 'Conectar ao Spotify'}
                    </Button>
                  )}
                </div>
              </div>

              {/* GITHUB */}
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#09090b]/50 backdrop-blur-sm p-6 flex flex-col justify-between group hover:border-white/30 transition-colors">
                {isConnectedGithub && <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl -z-10 rounded-full" />}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                      <Github className="w-6 h-6 text-white" />
                    </div>
                    {isConnectedGithub ? (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-white bg-white/10 px-2.5 py-1 rounded-full border border-white/20"><CheckCircle2 className="w-3.5 h-3.5" /> Conectado</span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-white/5 px-2.5 py-1 rounded-full border border-white/10"><AlertCircle className="w-3.5 h-3.5" /> Desconectado</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">GitHub</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">Sincronize Issues e PRs direto para o seu Kanban.</p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-white/5">
                  {isConnectedGithub ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/80 font-medium">Arthur (Exemplo)</span>
                      <Button variant="ghost" size="sm" onClick={() => { setIsConnectedGithub(false); toast.info('Desconectado do Github') }} className="text-red-400 hover:bg-red-400/10">Desconectar</Button>
                    </div>
                  ) : (
                    <Button onClick={() => handleConnect('github')} disabled={isLoading === 'github'} className="w-full bg-white hover:bg-white/90 text-black font-bold">
                      {isLoading === 'github' ? 'Autenticando...' : 'Conectar ao GitHub'}
                    </Button>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  )
}