'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore, TenantInfo } from '@/store/useStore';
import { 
  Building, 
  Plus, 
  Globe, 
  Palette, 
  Trash2, 
  Edit2, 
  LogOut, 
  ExternalLink, 
  Check, 
  AlertTriangle, 
  ShieldAlert,
  Loader2,
  Paintbrush
} from 'lucide-react';

export default function SuperAdminPage() {
  const { user, token, logout } = useStore();
  const router = useRouter();

  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantInfo | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    customDomain: '',
    primaryColor: '#C5A880',
    secondaryColor: '#18181b',
    logoUrl: ''
  });

  // Load Tenants
  const fetchTenants = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/tenants`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Falha ao carregar estabelecimentos');
      const data = await res.json();
      setTenants(data);
    } catch (err: any) {
      setError(err.message || 'Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !user || user.role !== 'SUPER_ADMIN') {
      router.push('/login');
      return;
    }
    fetchTenants();
  }, [token, user]);

  // Handle Tenant Name changes to slugify subdomain
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => {
      const updated = { ...prev, name };
      // Only auto-generate subdomain if we are creating new tenant (not editing)
      if (!editingTenant) {
        updated.subdomain = name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // remove accents
          .replace(/[^a-z0-9-]/g, '-') // replace non-alphanumeric with hyphen
          .replace(/-+/g, '-') // collapse consecutive hyphens
          .replace(/^-+|-+$/g, ''); // trim hyphens from ends
      }
      return updated;
    });
  };

  // Open Modal for Create
  const handleOpenCreate = () => {
    setEditingTenant(null);
    setFormData({
      name: '',
      subdomain: '',
      customDomain: '',
      primaryColor: '#C5A880',
      secondaryColor: '#18181b',
      logoUrl: ''
    });
    setError('');
    setModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (tenant: TenantInfo) => {
    setEditingTenant(tenant);
    setFormData({
      name: tenant.name,
      subdomain: tenant.subdomain,
      customDomain: tenant.customDomain || '',
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
      logoUrl: tenant.logoUrl || ''
    });
    setError('');
    setModalOpen(true);
  };

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name || !formData.subdomain) {
      setError('Nome e Subdomínio são campos obrigatórios.');
      return;
    }

    const payload = {
      ...formData,
      customDomain: formData.customDomain.trim() || null,
      logoUrl: formData.logoUrl.trim() || null
    };

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const url = editingTenant 
        ? `${apiUrl}/tenants/${editingTenant.id}`
        : `${apiUrl}/tenants`;
      
      const method = editingTenant ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao salvar estabelecimento');

      setSuccess(editingTenant ? 'Barbearia atualizada com sucesso!' : 'Nova barbearia cadastrada com sucesso!');
      setModalOpen(false);
      fetchTenants();

      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Erro de conexão com o servidor');
    }
  };

  // Delete Tenant
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`ATENÇÃO: Você tem certeza que deseja excluir "${name}"?\nTodos os usuários, clientes, agendamentos e dados desta barbearia serão apagados permanentemente!`)) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/tenants/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao excluir');
      }

      setSuccess('Estabelecimento excluído permanentemente.');
      fetchTenants();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar estabelecimento');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!token || !user || user.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex items-center justify-center p-6">
        <div className="glass-card max-w-md w-full p-8 border border-red-500/20 text-center rounded-2xl flex flex-col items-center">
          <ShieldAlert className="h-16 w-16 text-red-500 mb-4 animate-pulse" />
          <h1 className="text-2xl font-bold font-outfit mb-2">Acesso Negado</h1>
          <p className="text-gray-400 text-sm mb-6">Você precisa estar logado como Super Administrador para acessar esta área.</p>
          <button 
            onClick={() => router.push('/login')}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition duration-250 font-medium"
          >
            Ir para Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] font-sans pb-12">
      {/* Top Navbar */}
      <header className="border-b border-zinc-800 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-tr from-[#C5A880] to-[#E3D1B9] rounded-xl flex items-center justify-center shadow-lg shadow-gold/10">
              <Building className="h-5 w-5 text-black" />
            </div>
            <div>
              <h1 className="font-outfit font-bold text-lg tracking-tight">VTEC SOLUTIONS</h1>
              <span className="text-[10px] text-[#C5A880] font-medium tracking-widest uppercase">Super Admin Portal</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-semibold">{user.nome}</p>
              <p className="text-xs text-zinc-400">Super Admin</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-900 rounded-lg transition duration-200"
              title="Sair do Portal"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 mt-8">
        
        {/* Banner Alert Success/Error */}
        {success && (
          <div className="mb-6 p-4 bg-green-950/40 border border-green-800 text-green-300 rounded-xl flex items-center space-x-3 text-sm animate-fadeIn">
            <Check className="h-5 w-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-800 text-red-300 rounded-xl flex items-center space-x-3 text-sm animate-fadeIn">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden">
            <p className="text-xs text-zinc-400 font-semibold tracking-wider uppercase mb-1">Total Barbearias</p>
            <p className="text-4xl font-bold font-outfit">{tenants.length}</p>
            <div className="absolute right-4 bottom-4 h-12 w-12 bg-zinc-800/30 rounded-xl flex items-center justify-center text-zinc-500">
              <Building className="h-6 w-6" />
            </div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden">
            <p className="text-xs text-zinc-400 font-semibold tracking-wider uppercase mb-1">Subdomínios Ativos</p>
            <p className="text-4xl font-bold font-outfit">{tenants.filter(t => t.subdomain).length}</p>
            <div className="absolute right-4 bottom-4 h-12 w-12 bg-zinc-800/30 rounded-xl flex items-center justify-center text-zinc-500">
              <Paintbrush className="h-6 w-6" />
            </div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden">
            <p className="text-xs text-zinc-400 font-semibold tracking-wider uppercase mb-1">Domínios Personalizados</p>
            <p className="text-4xl font-bold font-outfit">{tenants.filter(t => t.customDomain).length}</p>
            <div className="absolute right-4 bottom-4 h-12 w-12 bg-zinc-800/30 rounded-xl flex items-center justify-center text-zinc-500">
              <Globe className="h-6 w-6" />
            </div>
          </div>
        </section>

        {/* Top Control Bar */}
        <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold font-outfit">Gerenciamento de Barbearias (SaaS)</h2>
            <p className="text-zinc-400 text-xs mt-1">Crie, ative e configure marcas de clientes em tempo real.</p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center space-x-2 bg-[#C5A880] hover:bg-[#B39268] text-black font-semibold px-5 py-2.5 rounded-xl transition duration-200 shadow-md shadow-gold/5"
          >
            <Plus className="h-5 w-5" />
            <span>Cadastrar Barbearia</span>
          </button>
        </section>

        {/* Tenants List Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 text-[#C5A880] animate-spin mb-4" />
            <p className="text-zinc-400 text-sm">Carregando estabelecimentos...</p>
          </div>
        ) : tenants.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl">
            <Building className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400 text-sm mb-4">Nenhuma barbearia cadastrada no sistema.</p>
            <button 
              onClick={handleOpenCreate}
              className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-4 py-2 rounded-lg transition"
            >
              Adicionar Primeira Barbearia
            </button>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants.map((tenant) => {
              const mainDomain = 'vtecsolutions.online';
              const demoUrl = `http://${tenant.subdomain}.localhost:3000`;
              const prodUrl = `https://${tenant.subdomain}.${mainDomain}`;
              const activeUrl = tenant.customDomain ? `https://${tenant.customDomain}` : prodUrl;

              return (
                <div 
                  key={tenant.id}
                  className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 flex flex-col justify-between hover:border-[#C5A880]/30 transition duration-300 relative group overflow-hidden"
                >
                  {/* Subtle Background Accent Gradient */}
                  <div 
                    className="absolute -right-16 -top-16 w-32 h-32 rounded-full blur-3xl opacity-[0.06] pointer-events-none transition duration-500 group-hover:opacity-[0.12]"
                    style={{ backgroundColor: tenant.primaryColor }}
                  />

                  <div>
                    {/* Header Card */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {tenant.logoUrl ? (
                          <img 
                            src={tenant.logoUrl} 
                            alt={tenant.name} 
                            className="h-10 w-10 rounded-lg object-cover bg-zinc-800 border border-zinc-700"
                            onError={(e) => {
                              // If image fails to load, replace with building icon
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="h-10 w-10 bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-700 text-zinc-400">
                            <Building className="h-5 w-5" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-base font-outfit text-white group-hover:text-[#C5A880] transition">{tenant.name}</h3>
                          <span className="text-[10px] text-zinc-500 font-mono tracking-wider">ID: {tenant.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Domain Meta */}
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center text-xs text-zinc-400 bg-zinc-950/60 px-3 py-2 rounded-lg border border-zinc-800/40">
                        <Globe className="h-3.5 w-3.5 mr-2 text-[#C5A880]" />
                        <span className="font-mono text-zinc-300 overflow-hidden text-ellipsis whitespace-nowrap">
                          {tenant.subdomain}.vtecsolutions.online
                        </span>
                      </div>
                      
                      {tenant.customDomain && (
                        <div className="flex items-center text-xs text-zinc-400 bg-zinc-950/60 px-3 py-2 rounded-lg border border-zinc-800/40">
                          <Globe className="h-3.5 w-3.5 mr-2 text-blue-400" />
                          <span className="font-mono text-zinc-300 overflow-hidden text-ellipsis whitespace-nowrap">
                            {tenant.customDomain}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Colors & Visuals */}
                    <div className="flex items-center space-x-6 text-xs text-zinc-400 mb-6">
                      <div className="flex items-center space-x-2">
                        <span className="text-zinc-500">Tema:</span>
                        <div 
                          className="h-4 w-4 rounded-full border border-zinc-700 shadow-inner"
                          style={{ backgroundColor: tenant.primaryColor }}
                          title={`Primary: ${tenant.primaryColor}`}
                        />
                        <div 
                          className="h-4 w-4 rounded-full border border-zinc-700 shadow-inner"
                          style={{ backgroundColor: tenant.secondaryColor }}
                          title={`Secondary: ${tenant.secondaryColor}`}
                        />
                      </div>
                      <div>
                        <span className="text-zinc-500">Logo:</span>{' '}
                        <span className={tenant.logoUrl ? 'text-green-400' : 'text-zinc-500'}>
                          {tenant.logoUrl ? 'Ativa' : 'Padrão'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between border-t border-zinc-800/60 pt-4 mt-2">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleOpenEdit(tenant)}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
                        title="Editar Configurações"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      
                      {/* Prevent deleting default tenant */}
                      {tenant.subdomain !== 'davinci' && (
                        <button
                          onClick={() => handleDelete(tenant.id, tenant.name)}
                          className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition"
                          title="Excluir Barbearia"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      {/* Localhost Link for developers */}
                      <a
                        href={demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-[11px] text-zinc-400 hover:text-[#C5A880] transition bg-zinc-950 px-2.5 py-1 rounded-md border border-zinc-800"
                      >
                        <span className="mr-1">Local</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>

                      <a
                        href={activeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-[11px] text-zinc-400 hover:text-[#C5A880] transition bg-zinc-950 px-2.5 py-1 rounded-md border border-zinc-800"
                      >
                        <span className="mr-1">Acessar</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </main>

      {/* CREATE/EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0c0c0e] border border-zinc-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="p-6 border-b border-zinc-800">
              <h3 className="text-lg font-bold font-outfit">
                {editingTenant ? `Editar Barbearia: ${editingTenant.name}` : 'Cadastrar Nova Barbearia'}
              </h3>
              <p className="text-zinc-400 text-xs mt-1">Configure o subdomínio, domínio personalizado e cores do cliente.</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Error inside modal */}
                {error && (
                  <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 rounded-lg text-xs flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase">Nome da Barbearia</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleNameChange}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-[#C5A880] transition"
                    placeholder="Ex: Barbearia Premium, Classic Club"
                  />
                </div>

                {/* Subdomain */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase">Subdomínio na Plataforma</label>
                  <div className="flex">
                    <input
                      type="text"
                      required
                      value={formData.subdomain}
                      onChange={(e) => setFormData(prev => ({ ...prev, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                      disabled={editingTenant?.subdomain === 'davinci'} // prevent editing davinci subdomain
                      className="flex-1 min-w-0 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-l-xl text-sm focus:outline-none focus:border-[#C5A880] transition font-mono disabled:opacity-50"
                      placeholder="subdominio"
                    />
                    <span className="inline-flex items-center px-4 rounded-r-xl border border-l-0 border-zinc-800 bg-zinc-900 text-zinc-400 text-xs font-mono">
                      .vtecsolutions.online
                    </span>
                  </div>
                </div>

                {/* Custom Domain */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase">Domínio Personalizado (Opcional)</label>
                  <input
                    type="text"
                    value={formData.customDomain}
                    onChange={(e) => setFormData(prev => ({ ...prev, customDomain: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-[#C5A880] transition font-mono"
                    placeholder="Ex: agendabarbavp.com.br"
                  />
                </div>

                {/* Logo URL */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase">URL da Logomarca (Opcional)</label>
                  <input
                    type="text"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-[#C5A880] transition"
                    placeholder="https://sua-logo.com/imagem.png"
                  />
                </div>

                {/* Theme Colors */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase">Cor Primária (Destaque)</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="h-10 w-10 border border-zinc-800 rounded-lg cursor-pointer bg-zinc-950"
                      />
                      <input
                        type="text"
                        value={formData.primaryColor}
                        onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase">Cor Secundária (Fundo/Textos)</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={formData.secondaryColor}
                        onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        className="h-10 w-10 border border-zinc-800 rounded-lg cursor-pointer bg-zinc-950"
                      />
                      <input
                        type="text"
                        value={formData.secondaryColor}
                        onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* Real-time Theme Preview */}
                <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl">
                  <span className="block text-[10px] font-semibold text-zinc-500 mb-2 uppercase">Pré-visualização do Tema</span>
                  <div className="flex items-center space-x-4">
                    <div 
                      className="h-10 w-10 rounded-lg flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: formData.primaryColor }}
                    >
                      <Building className="h-5 w-5" style={{ color: formData.secondaryColor }} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{formData.name || 'Nova Barbearia'}</div>
                      <div className="text-xs text-zinc-400">{formData.subdomain || 'subdominio'}.vtecsolutions.online</div>
                    </div>
                    <button
                      type="button"
                      className="text-xs px-3 py-1.5 rounded-lg border font-medium cursor-default"
                      style={{ 
                        borderColor: formData.primaryColor + '40', 
                        color: formData.primaryColor, 
                        backgroundColor: formData.primaryColor + '10' 
                      }}
                    >
                      Botão Demonstrativo
                    </button>
                  </div>
                </div>

              </div>

              <div className="p-6 border-t border-zinc-800 flex justify-end space-x-3 bg-zinc-950/20">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#C5A880] hover:bg-[#B39268] text-black font-semibold px-5 py-2 rounded-xl text-sm transition"
                >
                  {editingTenant ? 'Salvar Alterações' : 'Cadastrar Barbearia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
