'use client'

import { useState, useTransition, useEffect } from 'react'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button' 
import { 
  Github, Music, CheckCircle2, AlertCircle, Link2, 
  User, Palette, Columns, Plus, Trash2, Moon, Sun, Monitor, X, Save, Calendar, Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

import { createCategory, updateCategory, deleteCategory } from '@/lib/actions/categories'
import { updateProfile } from '@/lib/actions/profile'
import type { Categoria, UsuarioProfile } from '@/lib/types'

type Tab = 'account' | 'appearance' | 'workflow' | 'integrations'
type ThemeOption = 'dark' | 'light' | 'system'

interface SettingsClientProps {
  initialProfile: UsuarioProfile
  initialCategories: Categoria[]
}

export function SettingsClient({ initialProfile, initialCategories }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('account')
  const [isPending, startTransition] = useTransition()
  
  // --- CONTA ---
  const [profileData, setProfileData] = useState({
    nome_completo: initialProfile?.nome_completo || '',
    email: initialProfile?.email || ''
  })

  // --- CATEGORIAS ---
  const [categories, setCategories] = useState<Categoria[]>(initialCategories || [])
  
  useEffect(() => {
    setCategories(initialCategories || [])
  }, [initialCategories])

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [currentCategory, setCurrentCategory] = useState<{id?: string, nome: string, cor: string}>({ 
    nome: '', 
    cor: '#8b5cf6' 
  })

  // --- APARÊNCIA ---
  const [activeTheme, setActiveTheme] = useState<ThemeOption>('dark')
  const [activeColor, setActiveColor] = useState('#8b5cf6')
  const themeColors = ['#8b5cf6', '#10b981', '#f43f5e', '#0ea5e9', '#f59e0b']

  // ==========================================
  // LÓGICA DE PERFIL
  // ==========================================
  const handleUpdateProfile = () => {
    startTransition(async () => {
      const result = await updateProfile({ nome_completo: profileData.nome_completo })
      if (result.error) toast.error(result.error)
      else toast.success('Perfil atualizado com sucesso!')
    })
  }

  // ==========================================
  // LÓGICA DE CATEGORIAS (Traduzido para pt-BR)
  // ==========================================
  const handleSaveCategory = () => {
    if (!currentCategory.nome.trim()) return
    startTransition(async () => {
      const result = currentCategory.id 
        ? await updateCategory(currentCategory.id, { nome: currentCategory.nome, cor: currentCategory.cor })
        : await createCategory({ nome: currentCategory.nome, cor: currentCategory.cor })

      if (result.error) toast.error(result.error)
      else {
        toast.success(currentCategory.id ? 'Categoria atualizada!' : 'Categoria criada!')
        setIsCategoryModalOpen(false)
        setCurrentCategory({ nome: '', cor: '#8b5cf6' })
      }
    })
  }

  const handleDeleteCategory = (id: string) => {
    if (!confirm("Tem certeza? Isso pode afetar tarefas vinculadas.")) return
    startTransition(async () => {
      const result = await deleteCategory(id)
      if (result.error) toast.error(result.error)
      else toast.success('Removida com sucesso.')
    })
  }

  return (
    <div className="max-w-6xl mx-auto pb-24 animate-in fade-in duration-500 flex flex-col md:flex-row gap-8 relative">
      
      {/* MODAL DE CATEGORIA */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#121214] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
              <h3 className="font-bold text-lg text-white uppercase italic tracking-tighter">
                {currentCategory.id ? 'Editar' : 'Nova'} <span className="text-brand-violet">Categoria</span>
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setIsCategoryModalOpen(false)}><X className="w-5 h-5" /></Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-white/40">Nome do Setor</Label>
                <Input 
                  value={currentCategory.nome} 
                  onChange={(e) => setCurrentCategory({...currentCategory, nome: e.target.value})} 
                  className="bg-black/50 border-white/10 h-12 rounded-xl focus:border-brand-violet transition-all" 
                  placeholder="Ex: Deep Work, Saúde..."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-white/40">Identificador Visual</Label>
                <div className="flex gap-4 items-center">
                  <Input 
                    type="color" 
                    value={currentCategory.cor} 
                    onChange={(e) => setCurrentCategory({...currentCategory, cor: e.target.value})} 
                    className="w-20 h-12 p-1 bg-black/50 border-white/10 cursor-pointer rounded-xl" 
                  />
                  <div className="flex-1 h-12 rounded-xl border border-white/5 flex items-center px-4 bg-white/[0.02]">
                    <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: currentCategory.cor }} />
                    <span className="text-xs font-mono text-white/40 uppercase">{currentCategory.cor}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-white/5 bg-black/20 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsCategoryModalOpen(false)} className="rounded-xl uppercase font-black text-[10px] tracking-widest">Cancelar</Button>
              <Button onClick={handleSaveCategory} disabled={isPending} className="bg-brand-violet hover:bg-brand-violet/90 text-white rounded-xl px-8 uppercase font-black text-[10px] tracking-widest shadow-neon-violet">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ASIDE - MENU */}
      <aside className="w-full md:w-64 shrink-0 space-y-1">
        <div className="mb-8 px-4 md:px-0">
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">Ajustes</h1>
          <p className="text-[10px] uppercase font-black tracking-[0.2em] text-brand-violet">Configuração de Sistema</p>
        </div>
        <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 no-scrollbar px-4 md:px-0">
          <TabButton active={activeTab === 'account'} onClick={() => setActiveTab('account')} icon={User} label="Minha Conta" />
          <TabButton active={activeTab === 'appearance'} onClick={() => setActiveTab('appearance')} icon={Palette} label="Aparência" />
          <TabButton active={activeTab === 'workflow'} onClick={() => setActiveTab('workflow')} icon={Columns} label="Categorias" />
          <TabButton active={activeTab === 'integrations'} onClick={() => setActiveTab('integrations')} icon={Link2} label="Integrações" />
        </nav>
      </aside>

      <Separator orientation="vertical" className="hidden md:block min-h-[600px] bg-white/5" />

      {/* CONTEÚDO DINÂMICO */}
      <div className="flex-1 space-y-8 max-w-3xl px-4 md:px-0">

        {/* --- ABA CONTA --- */}
        {activeTab === 'account' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <section className="space-y-4">
              <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Perfil de <span className="text-brand-cyan">Comando</span></h2>
              <div className="grid gap-6 p-6 bg-white/[0.02] border border-white/5 rounded-[32px]">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">E-mail de Acesso (Não alterável)</Label>
                  <Input value={profileData.email} disabled className="bg-white/5 border-white/5 text-white/40 h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Nome Completo</Label>
                  <Input 
                    value={profileData.nome_completo} 
                    onChange={(e) => setProfileData({...profileData, nome_completo: e.target.value})} 
                    className="bg-black/50 border-white/10 h-12 rounded-xl focus:border-brand-cyan transition-all text-white" 
                  />
                </div>
                <Button onClick={handleUpdateProfile} disabled={isPending} className="w-fit bg-brand-cyan hover:bg-brand-cyan/90 text-black font-black uppercase text-[10px] tracking-widest rounded-xl h-12 px-8">
                  {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Atualizar Perfil
                </Button>
              </div>
            </section>
          </div>
        )}

        {/* --- ABA APARÊNCIA --- */}
        {activeTab === 'appearance' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Estética de <span className="text-brand-violet">Interface</span></h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Personalize seu ambiente de imersão.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ThemeCard active={activeTheme === 'dark'} onClick={() => setActiveTheme('dark')} icon={Moon} label="Modo Escuro" />
              <ThemeCard active={activeTheme === 'light'} onClick={() => setActiveTheme('light')} icon={Sun} label="Modo Claro" />
              <ThemeCard active={activeTheme === 'system'} onClick={() => setActiveTheme('system')} icon={Monitor} label="Sistema" />
            </div>
          </div>
        )}

        {/* --- ABA CATEGORIAS (Traduzida) --- */}
        {activeTab === 'workflow' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Matriz de <span className="text-brand-emerald">Setores</span></h2>
              <Button onClick={() => { setCurrentCategory({nome: '', cor: '#10b981'}); setIsCategoryModalOpen(true) }} size="sm" className="bg-brand-emerald text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-brand-emerald/90"><Plus className="w-4 h-4 mr-2" /> Novo Setor</Button>
            </div>
            <div className="bg-[#09090b]/50 border border-white/10 rounded-[32px] overflow-hidden divide-y divide-white/5">
              {categories.length === 0 ? (
                 <div className="p-12 text-center text-muted-foreground text-[10px] uppercase font-black tracking-widest opacity-30">Nenhuma diretriz de setor configurada.</div>
              ) : (
                categories.map((cat) => (
                  <div key={cat.id} className="p-5 flex items-center justify-between group hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-10 rounded-full" style={{ backgroundColor: cat.cor, boxShadow: `0 0 15px ${cat.cor}30` }} />
                      <div className="flex flex-col">
                        <span className="font-black text-white uppercase italic tracking-tight">{cat.nome}</span>
                        <span className="text-[9px] font-mono text-white/20 uppercase">{cat.cor}</span>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-all">
                      <Button variant="ghost" size="sm" onClick={() => { setCurrentCategory({id: cat.id, nome: cat.nome, cor: cat.cor}); setIsCategoryModalOpen(true) }} className="text-[10px] font-black uppercase tracking-widest hover:bg-white/5">Editar</Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(cat.id)} className="text-red-500/50 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <Button 
      variant="ghost" 
      onClick={onClick} 
      className={cn(
        "justify-start h-12 rounded-xl px-4 transition-all duration-300", 
        active 
          ? "bg-white/10 text-white shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]" 
          : "text-white/40 hover:text-white hover:bg-white/5"
      )}
    >
      <Icon className={cn("w-4 h-4 mr-3", active ? "text-brand-violet" : "text-white/20")} /> 
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </Button>
  )
}

function ThemeCard({ active, onClick, icon: Icon, label }: any) {
  return (
    <div 
      onClick={onClick} 
      className={cn(
        "border-2 rounded-[24px] p-6 flex flex-col items-center gap-4 cursor-pointer transition-all duration-500", 
        active 
          ? "border-brand-violet bg-brand-violet/5 shadow-neon-violet/20" 
          : "border-white/5 bg-white/[0.02] hover:border-white/10"
      )}
    >
      <Icon className={cn("w-8 h-8 transition-transform duration-500", active ? "text-brand-violet scale-110" : "text-white/20")} />
      <span className={cn("text-[10px] font-black uppercase tracking-[0.2em]", active ? "text-white" : "text-white/40")}>{label}</span>
    </div>
  )
}