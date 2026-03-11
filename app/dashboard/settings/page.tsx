import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsView } from '@/components/dashboard/settings-view'
import { Settings2, ShieldCheck, Zap } from 'lucide-react'
// Trocado UsuarioProfile por Perfil e adicionado Integracao
import type { Categoria, Perfil, Integracao } from '@/lib/types'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Performance de Elite: Buscas paralelas sincronizadas com o banco em PT
  const [profileRes, categoriesRes, integrationsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
    
    supabase
      .from('categorias') // Sincronizado com seu banco em português
      .select('*')
      .eq('usuario_id', user.id) // usuario_id conforme seu types.ts
      .order('nome', { ascending: true }),

    supabase
      .from('integracoes') // Sincronizado com seu banco em português
      .select('*')
      .eq('usuario_id', user.id)
  ])

  // Casting para 'Perfil' resolve o erro ts(2739) pois inclui XP, Nível, etc.
  const profile = profileRes.data as Perfil
  const categories = (categoriesRes.data || []) as Categoria[]
  const integrations = (integrationsRes.data || []) as Integracao[]

  return (
    <div className="h-full flex flex-col space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Background FX - Atmosfera de Laboratório/Ajustes */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-brand-violet/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Header de Parâmetros de Sistema */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/5 rounded-xl border border-white/10 shadow-inner">
              <Settings2 className="h-6 w-6 text-white/70" />
            </div>
            <h1 className="text-3xl font-[1000] italic uppercase tracking-tighter text-white">
              Parâmetros do <span className="text-brand-violet">Núcleo</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">
            <ShieldCheck className="w-3 h-3 text-brand-violet/50" />
            <span>Configurações de Identidade, Bio-ritmo e Integrações</span>
          </div>
        </div>

        {/* Badge de Status de Sistema */}
        <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-brand-violet/5 border border-brand-violet/10 rounded-full">
          <Zap className="w-3 h-3 text-brand-violet animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-widest text-brand-violet">
            Sincronia Neural Ativa
          </span>
        </div>
      </header>

      {/* Container Principal de Configurações */}
      <main className="flex-1 relative z-10">
        <div className="bg-[#0c0c0e]/50 border border-white/5 rounded-[2.5rem] backdrop-blur-3xl shadow-2xl overflow-hidden min-h-[600px]">
          <SettingsView 
            user={user}
            profile={profile} 
            initialCategories={categories}
            integrations={integrations}
          />
        </div>
      </main>

      <footer className="flex justify-between items-center px-4 text-[9px] font-black uppercase tracking-[0.5em] text-white/5">
        <span>System Preferences v1.0.4</span>
        <span>FocusOS User Environment</span>
      </footer>
    </div>
  )
}