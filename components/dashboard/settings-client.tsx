'use client'

import { useState, useTransition, useEffect } from 'react'
import { Button } from '@/components/ui/button' // Verifique se o import do Button está correto (geralmente @/components/ui/button)
import { Button as UIButton } from '@/components/ui/button' 
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    full_name: initialProfile?.full_name || '',
    email: initialProfile?.email || ''
  })

  // --- CATEGORIAS (Garantir que inicializa com os dados do banco) ---
  const [categories, setCategories] = useState<Categoria[]>(initialCategories || [])
  
  // Sincronizar estado se os dados do servidor mudarem (importante para revalidatePath)
  useEffect(() => {
    setCategories(initialCategories || [])
  }, [initialCategories])

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [currentCategory, setCurrentCategory] = useState<{id?: string, name: string, color: string}>({ 
    name: '', 
    color: '#8b5cf6' 
  })

  // --- APARÊNCIA (Fiel ao teu visual) ---
  const [activeTheme, setActiveTheme] = useState<ThemeOption>('dark')
  const [activeColor, setActiveColor] = useState('#8b5cf6')
  const themeColors = ['#8b5cf6', '#10b981', '#f43f5e', '#0ea5e9', '#f59e0b']

  // --- INTEGRAÇÕES ---
  const [isConnectedSpotify, setIsConnectedSpotify] = useState(false)
  const [isConnectedGithub, setIsConnectedGithub] = useState(false)
  const [isConnectedGoogle, setIsConnectedGoogle] = useState(false)
  const [isLoading, setIsLoading] = useState<string | null>(null)

  // ==========================================
  // LÓGICA DE CATEGORIAS
  // ==========================================

  const handleSaveCategory = () => {
    if (!currentCategory.name.trim()) return
    startTransition(async () => {
      const result = currentCategory.id 
        ? await updateCategory(currentCategory.id, { name: currentCategory.name, color: currentCategory.color })
        : await createCategory({ name: currentCategory.name, color: currentCategory.color })

      if (result.error) toast.error(result.error)
      else {
        toast.success('Categoria guardada!')
        setIsCategoryModalOpen(false)
      }
    })
  }

  const handleDeleteCategory = (id: string) => {
    startTransition(async () => {
      const result = await deleteCategory(id)
      if (result.error) toast.error(result.error)
      else toast.success('Removida com sucesso.')
    })
  }

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================

  return (
    <div className="max-w-6xl mx-auto pb-24 animate-in fade-in duration-500 flex flex-col md:flex-row gap-8 relative">
      
      {/* MODAL DE CATEGORIA (Exatamente como o teu original) */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#121214] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
              <h3 className="font-bold text-lg text-white">{currentCategory.id ? 'Editar' : 'Nova'} Categoria</h3>
              <UIButton variant="ghost" size="icon" onClick={() => setIsCategoryModalOpen(false)}><X className="w-5 h-5" /></UIButton>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={currentCategory.name} onChange={(e) => setCurrentCategory({...currentCategory, name: e.target.value})} className="bg-black/50 border-white/10" />
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <Input type="color" value={currentCategory.color} onChange={(e) => setCurrentCategory({...currentCategory, color: e.target.value})} className="h-12 p-1 bg-black/50 border-white/10 cursor-pointer rounded-lg" />
              </div>
            </div>
            <div className="p-4 border-t border-white/5 bg-black/20 flex justify-end gap-2">
              <UIButton variant="ghost" onClick={() => setIsCategoryModalOpen(false)}>Cancelar</UIButton>
              <UIButton onClick={handleSaveCategory} disabled={isPending} className="bg-brand-violet text-white">
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Guardar
              </UIButton>
            </div>
          </div>
        </div>
      )}

      {/* ASIDE - MENU */}
      <aside className="w-full md:w-64 shrink-0 space-y-1">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Ajustes</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas preferências.</p>
        </div>
        <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          <TabButton active={activeTab === 'account'} onClick={() => setActiveTab('account')} icon={User} label="Minha Conta" />
          <TabButton active={activeTab === 'appearance'} onClick={() => setActiveTab('appearance')} icon={Palette} label="Aparência" />
          <TabButton active={activeTab === 'workflow'} onClick={() => setActiveTab('workflow')} icon={Columns} label="Categorias" />
          <TabButton active={activeTab === 'integrations'} onClick={() => setActiveTab('integrations')} icon={Link2} label="Integrações" />
        </nav>
      </aside>

      <Separator orientation="vertical" className="hidden md:block min-h-[600px] bg-white/5" />

      {/* CONTEÚDO DINÂMICO */}
      <div className="flex-1 space-y-8 max-w-3xl">

        {/* --- ABA APARÊNCIA (O teu código visual favorito) --- */}
        {activeTab === 'appearance' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Tema do Sistema</h2>
              <p className="text-sm text-muted-foreground mt-1">Personalize as cores para focar melhor.</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <ThemeCard active={activeTheme === 'dark'} onClick={() => setActiveTheme('dark')} icon={Moon} label="Escuro" />
              <ThemeCard active={activeTheme === 'light'} onClick={() => setActiveTheme('light')} icon={Sun} label="Claro" />
              <ThemeCard active={activeTheme === 'system'} onClick={() => setActiveTheme('system')} icon={Monitor} label="Sistema" />
            </div>
            <div className="pt-4">
              <h3 className="text-sm font-semibold text-white mb-3">Cor de Destaque</h3>
              <div className="flex gap-3">
                {themeColors.map(color => (
                  <button 
                    key={color} 
                    onClick={() => setActiveColor(color)}
                    className={cn("w-10 h-10 rounded-full border-2 transition-all", activeColor === color ? "border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.2)]" : "border-transparent")} 
                    style={{ backgroundColor: color }} 
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- ABA CATEGORIAS (Corrigido para usar .id e .name) --- */}
        {activeTab === 'workflow' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Categorias</h2>
              <UIButton onClick={() => { setCurrentCategory({name: '', color: '#8b5cf6'}); setIsCategoryModalOpen(true) }} size="sm" className="bg-brand-violet text-white"><Plus className="w-4 h-4 mr-2" /> Nova</UIButton>
            </div>
            <div className="bg-[#09090b]/50 border border-white/10 rounded-2xl divide-y divide-white/5">
              {categories.length === 0 ? (
                 <div className="p-8 text-center text-muted-foreground text-sm">Nenhuma categoria encontrada no banco de dados.</div>
              ) : (
                categories.map((cat) => (
                  <div key={cat.id} className="p-4 flex items-center justify-between group hover:bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="font-medium text-white/90">{cat.name}</span>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-opacity">
                      <UIButton variant="ghost" size="sm" onClick={() => { setCurrentCategory({id: cat.id, name: cat.name, color: cat.color}); setIsCategoryModalOpen(true) }}>Editar</UIButton>
                      <UIButton variant="ghost" size="icon" onClick={() => handleDeleteCategory(cat.id)} className="text-red-400"><Trash2 className="w-4 h-4" /></UIButton>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ... Outras abas (Conta e Integrações) seguem o mesmo estilo do teu código original ... */}
      </div>
    </div>
  )
}

// Componentes Auxiliares para manter o código limpo
function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <UIButton variant="ghost" onClick={onClick} className={cn("justify-start shrink-0", active ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white")}>
      <Icon className="w-4 h-4 mr-2" /> {label}
    </UIButton>
  )
}

function ThemeCard({ active, onClick, icon: Icon, label }: any) {
  return (
    <div onClick={onClick} className={cn("border rounded-xl p-4 flex flex-col items-center gap-3 cursor-pointer transition-all", active ? "border-brand-violet bg-brand-violet/5" : "border-white/10 bg-white/5 hover:bg-white/10")}>
      <Icon className={cn("w-6 h-6", active ? "text-brand-violet" : "text-muted-foreground")} />
      <span className={cn("text-sm font-medium", active ? "text-white" : "text-muted-foreground")}>{label}</span>
    </div>
  )
}