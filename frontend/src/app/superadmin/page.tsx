'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { getLogoUrl } from '@/lib/logo-helper';
import {
  Building,
  CreditCard,
  Sparkles,
  Settings,
  Plus,
  Trash2,
  Edit2,
  LogOut,
  ExternalLink,
  Globe,
  User,
  Users,
  AlertTriangle,
  Check,
  Search,
  Eye,
  Loader2,
  ChevronRight,
  Shield,
  Key
} from 'lucide-react';

export default function SuperAdminPage() {
  const router = useRouter();
  const token = useStore((state) => state.token);
  const user = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);

  const [activeTab, setActiveTab] = useState('tenants');
  const [tenants, setTenants] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mounted, setMounted] = useState(false);

  // Search/Filter states
  const [tenantSearch, setTenantSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<any | null>(null);
  const [submittingTenant, setSubmittingTenant] = useState(false);

  // Form states for tenant
  const [tenantForm, setTenantForm] = useState({
    name: '',
    subdomain: '',
    customDomain: '',
    logoUrl: '',
    primaryColor: '#C5A880',
    secondaryColor: '#18181b',
    active: true,
    saasPlan: 'BASIC',
    saasPlanLimitBarbers: 3,
    saasPlanLimitAttendants: 1,
    saasPlanLimitClients: 500,
    whatsAppEnabled: true,
    chatbotIAEnabled: false,
    trialEndsAt: '',
    subscriptionStatus: 'TRIAL',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  });

  // Settings states
  const [settingsForm, setSettingsForm] = useState({
    PLATFORM_ASAAS_API_KEY: '',
    PLAN_BASIC_LINK: '',
    PLAN_UNLIMITED_LINK: '',
    RESEND_API_KEY: '',
    RESEND_FROM_EMAIL: '',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (!token || !user || user.role !== 'SUPER_ADMIN') {
        router.replace('/login');
      } else {
        loadData();
      }
    }
  }, [mounted, token, user]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      
      // Fetch Tenants
      const tenantsRes = await fetch(`${apiUrl}/tenants`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!tenantsRes.ok) throw new Error('Falha ao carregar estabelecimentos');
      const tenantsData = await tenantsRes.json();
      setTenants(tenantsData);

      // Fetch Users
      const usersRes = await fetch(`${apiUrl}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      // Fetch System Settings
      const settingsRes = await fetch(`${apiUrl}/system-settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSystemSettings(settingsData);
        setSettingsForm({
          PLATFORM_ASAAS_API_KEY: settingsData.PLATFORM_ASAAS_API_KEY || '',
          PLAN_BASIC_LINK: settingsData.PLAN_BASIC_LINK || '',
          PLAN_UNLIMITED_LINK: settingsData.PLAN_UNLIMITED_LINK || '',
          RESEND_API_KEY: settingsData.RESEND_API_KEY || '',
          RESEND_FROM_EMAIL: settingsData.RESEND_FROM_EMAIL || '',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados do servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setTenantForm(prev => {
      const updated = { ...prev, name };
      if (!editingTenant) {
        updated.subdomain = name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9-]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-+|-+$/g, '');
      }
      return updated;
    });
  };

  const handleOpenCreate = () => {
    setEditingTenant(null);
    setTenantForm({
      name: '',
      subdomain: '',
      customDomain: '',
      logoUrl: '',
      primaryColor: '#C5A880',
      secondaryColor: '#18181b',
      active: true,
      saasPlan: 'BASIC',
      saasPlanLimitBarbers: 3,
      saasPlanLimitAttendants: 1,
      saasPlanLimitClients: 500,
      whatsAppEnabled: true,
      chatbotIAEnabled: false,
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subscriptionStatus: 'TRIAL',
      adminName: '',
      adminEmail: '',
      adminPassword: '',
    });
    setError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (t: any) => {
    setEditingTenant(t);
    setTenantForm({
      name: t.name,
      subdomain: t.subdomain,
      customDomain: t.customDomain || '',
      logoUrl: t.logoUrl || '',
      primaryColor: t.primaryColor || '#C5A880',
      secondaryColor: t.secondaryColor || '#18181b',
      active: t.active !== false,
      saasPlan: t.saasPlan || 'BASIC',
      saasPlanLimitBarbers: t.saasPlanLimitBarbers ?? 3,
      saasPlanLimitAttendants: t.saasPlanLimitAttendants ?? 1,
      saasPlanLimitClients: t.saasPlanLimitClients ?? 500,
      whatsAppEnabled: t.whatsAppEnabled !== false,
      chatbotIAEnabled: !!t.chatbotIAEnabled,
      trialEndsAt: t.trialEndsAt ? t.trialEndsAt.split('T')[0] : '',
      subscriptionStatus: t.subscriptionStatus || 'TRIAL',
      adminName: t.users?.[0]?.nome || '',
      adminEmail: t.users?.[0]?.email || '',
      adminPassword: '',
    });
    setError('');
    setModalOpen(true);
  };

  const handleTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmittingTenant(true);

    const payload: any = { ...tenantForm };
    if (editingTenant) {
      // Clean admin user fields if password is empty to avoid overwriting password
      if (!payload.adminPassword) {
        delete payload.adminPassword;
      }
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const url = editingTenant ? `${apiUrl}/tenants/${editingTenant.id}` : `${apiUrl}/tenants`;
      const res = await fetch(url, {
        method: editingTenant ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao salvar estabelecimento');

      setSuccess(editingTenant ? 'Estabelecimento atualizado com sucesso!' : 'Estabelecimento criado com sucesso!');
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Erro de comunicação');
    } finally {
      setSubmittingTenant(false);
    }
  };

  const handleDeleteTenant = async (id: string, name: string) => {
    if (!window.confirm(`Você tem certeza que deseja excluir permanentemente o estabelecimento ${name}?`)) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/tenants/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Falha ao deletar');
      }
      setSuccess('Estabelecimento excluído com sucesso.');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir estabelecimento');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!window.confirm(`Você tem certeza que deseja excluir permanentemente o usuário ${name}?`)) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Falha ao deletar usuário');
      }
      setSuccess('Usuário excluído com sucesso.');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir usuário');
    }
  };

  const handleToggleUserStatus = async (id: string, name: string, currentStatus: boolean) => {
    setError('');
    setSuccess('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Falha ao atualizar status do usuário');
      }
      setSuccess(`Status do usuário ${name} alterado com sucesso.`);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar status do usuário');
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/system-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settingsForm)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Falha ao salvar configurações');
      }
      setSuccess('Configurações salvas com sucesso!');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar configurações');
    }
  };

  const getSubdomainUrl = (subdomain: string) => {
    if (typeof window === 'undefined') return '';
    const host = window.location.hostname;
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      return `http://${subdomain}.localhost:${window.location.port || '3000'}`;
    }
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'appvenusta.com.br';
    return `https://${subdomain}.${baseDomain}`;
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(tenantSearch.toLowerCase()) ||
    t.subdomain.toLowerCase().includes(tenantSearch.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
    u.nome.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.tenant?.name || 'Super Admin').toLowerCase().includes(userSearch.toLowerCase())
  );

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-zinc-850 font-sans flex">
      
      {/* Side Navigation Bar */}
      <aside className="w-64 bg-white border-r border-zinc-200/80 flex flex-col h-screen fixed left-0 top-0 z-20">
        <div className="p-6 border-b border-zinc-200 flex items-center gap-3 shrink-0">
          <div className="h-9 w-9 bg-gold-gradient rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-amber-500/10">
            <Building className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-zinc-900 tracking-wide uppercase leading-none">VENUSTA</h2>
            <span className="text-[8px] text-davinci-gold font-bold uppercase tracking-widest block mt-1">Super Admin</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <button
            onClick={() => setActiveTab('tenants')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'tenants'
                ? 'bg-davinci-gold/10 text-davinci-gold border-l-2 border-davinci-gold pl-3 font-semibold'
                : 'text-zinc-555 hover:text-zinc-900 hover:bg-zinc-50'
            }`}
          >
            <Building className="h-4.5 w-4.5" />
            Estabelecimentos
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'users'
                ? 'bg-davinci-gold/10 text-davinci-gold border-l-2 border-davinci-gold pl-3 font-semibold'
                : 'text-zinc-555 hover:text-zinc-900 hover:bg-zinc-50'
            }`}
          >
            <Users className="h-4.5 w-4.5" />
            Usuários
          </button>

          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'subscriptions'
                ? 'bg-davinci-gold/10 text-davinci-gold border-l-2 border-davinci-gold pl-3 font-semibold'
                : 'text-zinc-555 hover:text-zinc-900 hover:bg-zinc-50'
            }`}
          >
            <CreditCard className="h-4.5 w-4.5" />
            Assinaturas SaaS
          </button>

          <button
            onClick={() => setActiveTab('plans')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'plans'
                ? 'bg-davinci-gold/10 text-davinci-gold border-l-2 border-davinci-gold pl-3 font-semibold'
                : 'text-zinc-550 hover:text-zinc-900 hover:bg-zinc-50'
            }`}
          >
            <Sparkles className="h-4.5 w-4.5" />
            Links de Checkout
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'settings'
                ? 'bg-davinci-gold/10 text-davinci-gold border-l-2 border-davinci-gold pl-3 font-semibold'
                : 'text-zinc-550 hover:text-zinc-900 hover:bg-zinc-50'
            }`}
          >
            <Settings className="h-4.5 w-4.5" />
            Configurações
          </button>
        </nav>

        <div className="p-4 border-t border-zinc-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-250 hover:bg-zinc-50 text-xs font-bold text-zinc-700 transition"
          >
            <LogOut className="h-4.5 w-4.5" />
            Sair do Painel
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        
        {/* Top Header */}
        <header className="h-16 border-b border-zinc-200 bg-white flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
          <div>
            <h1 className="text-base font-extrabold text-zinc-950 uppercase tracking-wide">
              {activeTab === 'tenants' && 'Gerenciamento de Estabelecimentos'}
              {activeTab === 'users' && 'Gerenciamento de Usuários'}
              {activeTab === 'subscriptions' && 'Assinaturas & Trials'}
              {activeTab === 'plans' && 'Plano SaaS & Preços'}
              {activeTab === 'settings' && 'Chaves de Integração (Resend/Asaas)'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs font-bold text-zinc-900 block">{user?.nome || 'Administrador'}</span>
              <span className="text-[10px] text-davinci-gold font-bold uppercase tracking-wider block">Super Admin</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-davinci-gold/10 border border-davinci-gold/25 flex items-center justify-center text-xs font-bold text-davinci-gold">
              SA
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-8">
          
          {/* Status Alerts */}
          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 text-sm animate-fadeIn">
              <Check className="h-5 w-5 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-3 text-sm animate-fadeIn">
              <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 text-davinci-gold animate-spin mb-4" />
              <p className="text-zinc-500 text-xs font-medium">Carregando dados da plataforma...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: Tenants List */}
              {activeTab === 'tenants' && (
                <div className="space-y-6">
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                    <div className="bg-white border border-zinc-200/80 p-6 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Total de Salões</span>
                        <div className="text-3xl font-extrabold text-zinc-950 mt-1">{tenants.length}</div>
                      </div>
                      <Building className="absolute right-4 bottom-4 h-12 w-12 text-zinc-150 pointer-events-none" />
                    </div>

                    <div className="bg-white border border-zinc-200/80 p-6 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Total de Usuários</span>
                        <div className="text-3xl font-extrabold text-zinc-950 mt-1">{users.length}</div>
                      </div>
                      <Users className="absolute right-4 bottom-4 h-12 w-12 text-zinc-150 pointer-events-none" />
                    </div>
                    
                    <div className="bg-white border border-zinc-200/80 p-6 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Assinaturas Ativas</span>
                        <div className="text-3xl font-extrabold text-zinc-950 mt-1">
                          {tenants.filter(t => t.subscriptionStatus === 'ACTIVE').length}
                        </div>
                      </div>
                      <CreditCard className="absolute right-4 bottom-4 h-12 w-12 text-zinc-150 pointer-events-none" />
                    </div>

                    <div className="bg-white border border-zinc-200/80 p-6 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Períodos de Teste</span>
                        <div className="text-3xl font-extrabold text-zinc-950 mt-1">
                          {tenants.filter(t => t.subscriptionStatus === 'TRIAL').length}
                        </div>
                      </div>
                      <Sparkles className="absolute right-4 bottom-4 h-12 w-12 text-zinc-150 pointer-events-none" style={{ color: '#C5A880' }} />
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-zinc-200/85 shadow-sm">
                    <div className="relative w-80">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="Pesquisar salão ou subdomínio..."
                        value={tenantSearch}
                        onChange={(e) => setTenantSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:border-davinci-gold text-xs"
                      />
                    </div>

                    <button
                      onClick={handleOpenCreate}
                      className="bg-gold-gradient text-white font-extrabold px-5 py-2.5 rounded-lg text-xs flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-md shadow-amber-500/10"
                    >
                      <Plus className="h-4.5 w-4.5" /> Cadastrar Salão
                    </button>
                  </div>

                  {/* Table Card */}
                  <div className="bg-white rounded-xl border border-zinc-200/80 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-zinc-200 text-zinc-400 uppercase tracking-wider text-[10px] bg-zinc-50">
                            <th className="py-4 px-6">Estabelecimento</th>
                            <th className="py-4 px-6">Domínio / Subdomínio</th>
                            <th className="py-4 px-6 text-center">Plano</th>
                            <th className="py-4 px-6 text-center">Status</th>
                            <th className="py-4 px-6 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {filteredTenants.map((t) => (
                            <tr key={t.id} className="hover:bg-zinc-50/50 transition-colors">
                              <td className="py-4 px-6 font-bold text-zinc-900 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-xs text-zinc-650 font-bold">
                                  {t.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <span className="block font-bold">{t.name}</span>
                                  <span className="text-[10px] text-zinc-400 font-mono">ID: {t.id.slice(0, 8)}</span>
                                </div>
                              </td>
                              <td className="py-4 px-6 font-mono text-zinc-600">
                                <span className="block">{t.subdomain}.appvenusta.com.br</span>
                                {t.customDomain && <span className="text-[10px] text-blue-600 font-semibold">{t.customDomain}</span>}
                              </td>
                              <td className="py-4 px-6 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  t.saasPlan === 'UNLIMITED' 
                                    ? 'bg-amber-100 text-amber-900' 
                                    : 'bg-zinc-100 text-zinc-800'
                                }`}>
                                  {t.saasPlan === 'UNLIMITED' ? 'Absoluto' : 'Essencial'}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  t.active !== false 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {t.active !== false ? 'Ativo' : 'Inativo'}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right space-x-2">
                                <button
                                  onClick={() => handleOpenEdit(t)}
                                  className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition"
                                  title="Editar"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <a
                                  href={getSubdomainUrl(t.subdomain)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition"
                                  title="Acessar"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                                {t.subdomain !== 'venusta' && (
                                  <button
                                    onClick={() => handleDeleteTenant(t.id, t.name)}
                                    className="p-1.5 text-zinc-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                                    title="Deletar"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: Users List */}
              {activeTab === 'users' && (
                <div className="space-y-6">
                  
                  {/* Actions Toolbar */}
                  <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-zinc-200/80 shadow-sm">
                    <div className="relative w-80">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="Pesquisar usuário, e-mail ou estabelecimento..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:border-davinci-gold text-xs"
                      />
                    </div>
                    <div className="text-xs text-zinc-500 font-medium">
                      Exibindo {filteredUsers.length} de {users.length} usuários
                    </div>
                  </div>

                  {/* Users Table Card */}
                  <div className="bg-white rounded-xl border border-zinc-200/80 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-zinc-200 text-zinc-400 uppercase tracking-wider text-[10px] bg-zinc-50">
                            <th className="py-4 px-6">Usuário</th>
                            <th className="py-4 px-6">Perfil Principal / Permissões</th>
                            <th className="py-4 px-6">Estabelecimento</th>
                            <th className="py-4 px-6 text-center">Status</th>
                            <th className="py-4 px-6">Criado em</th>
                            <th className="py-4 px-6 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {filteredUsers.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-12 text-center text-zinc-500 font-semibold">
                                Nenhum usuário encontrado
                              </td>
                            </tr>
                          ) : (
                            filteredUsers.map((u) => {
                              const createdAtDate = u.createdAt ? new Date(u.createdAt) : null;
                              
                              return (
                                <tr key={u.id} className="hover:bg-zinc-50/50 transition-colors">
                                  <td className="py-4 px-6">
                                    <span className="block font-bold text-zinc-900">{u.nome}</span>
                                    <span className="text-[10px] text-zinc-400 font-mono">{u.email}</span>
                                  </td>
                                  <td className="py-4 px-6">
                                    <div className="space-y-1">
                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                                        u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800' :
                                        u.role === 'ADMIN' ? 'bg-blue-100 text-blue-800' :
                                        u.role === 'ATTENDANT' ? 'bg-amber-100 text-amber-800' :
                                        'bg-zinc-100 text-zinc-700'
                                      }`}>
                                        {u.role === 'SUPER_ADMIN' ? 'Super Admin' :
                                         u.role === 'ADMIN' ? 'Administrador' :
                                         u.role === 'ATTENDANT' ? 'Atendente' : 'Profissional'}
                                      </span>
                                      {u.roles && u.roles.length > 1 && (
                                        <div className="text-[8.5px] text-zinc-400 font-mono">
                                          Permissões: {u.roles.join(', ')}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 font-semibold text-zinc-700">
                                    {u.tenant ? (
                                      <div>
                                        <span className="block">{u.tenant.name}</span>
                                        <span className="text-[10px] text-zinc-400 font-normal">
                                          {u.tenant.subdomain}.appvenusta.com.br
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-zinc-400 italic">Super Admin Global</span>
                                    )}
                                  </td>
                                  <td className="py-4 px-6 text-center">
                                    <button
                                      onClick={() => handleToggleUserStatus(u.id, u.nome, u.isActive)}
                                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition border hover:scale-[1.03] active:scale-[0.97] ${
                                        u.isActive 
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50 hover:bg-emerald-100'
                                          : 'bg-rose-50 text-rose-700 border-rose-200/50 hover:bg-rose-100'
                                      }`}
                                    >
                                      {u.isActive ? 'Ativo' : 'Bloqueado'}
                                    </button>
                                  </td>
                                  <td className="py-4 px-6 text-zinc-500 font-mono text-[10.5px]">
                                    {createdAtDate ? createdAtDate.toLocaleDateString('pt-BR') : '--'}
                                  </td>
                                  <td className="py-4 px-6 text-right space-x-2">
                                    <button
                                      disabled={u.role === 'SUPER_ADMIN'}
                                      onClick={() => handleDeleteUser(u.id, u.nome)}
                                      className={`p-2 rounded-lg border text-zinc-500 transition-colors ${
                                        u.role === 'SUPER_ADMIN'
                                          ? 'opacity-40 cursor-not-allowed border-zinc-100'
                                          : 'border-zinc-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 cursor-pointer'
                                      }`}
                                      title={u.role === 'SUPER_ADMIN' ? 'Não é possível deletar o super administrador principal' : 'Excluir usuário'}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Subscriptions & Trials */}
              {activeTab === 'subscriptions' && (
                <div className="bg-white rounded-xl border border-zinc-200/80 overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-zinc-100">
                    <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Histórico de Assinaturas e Períodos de Teste</h3>
                    <p className="text-xs text-zinc-500 mt-1">Acompanhe vencimentos de trials e status de clientes integrados ao gateway Asaas.</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-zinc-200 text-zinc-400 uppercase tracking-wider text-[10px] bg-zinc-50">
                          <th className="py-4 px-6">Salão</th>
                          <th className="py-4 px-6">Fim do Trial</th>
                          <th className="py-4 px-6">Status da Assinatura</th>
                          <th className="py-4 px-6">Asaas ID (Customer/Subscription)</th>
                          <th className="py-4 px-6 text-right">Alterar Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {tenants.map((t) => {
                          const trialDate = t.trialEndsAt ? new Date(t.trialEndsAt) : null;
                          const isExpired = t.subscriptionStatus === 'TRIAL' && trialDate && trialDate < new Date();
                          
                          return (
                            <tr key={t.id} className="hover:bg-zinc-50/50 transition-colors">
                              <td className="py-4 px-6">
                                <span className="block font-bold text-zinc-900">{t.name}</span>
                                <span className="text-[10px] text-zinc-400 font-mono">{t.users?.[0]?.email || 'Sem e-mail'}</span>
                              </td>
                              <td className="py-4 px-6 font-mono text-zinc-650">
                                {trialDate ? (
                                  <span className={isExpired ? 'text-rose-600 font-bold' : ''}>
                                    {trialDate.toLocaleDateString('pt-BR')} {isExpired && '(Expirado)'}
                                  </span>
                                ) : (
                                  'Ativa (Sem Trial)'
                                )}
                              </td>
                              <td className="py-4 px-6">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  t.subscriptionStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                                  t.subscriptionStatus === 'OVERDUE' ? 'bg-rose-100 text-rose-800' :
                                  t.subscriptionStatus === 'CANCELED' ? 'bg-zinc-100 text-zinc-700' :
                                  'bg-amber-100 text-amber-800'
                                }`}>
                                  {t.subscriptionStatus === 'ACTIVE' && 'Ativa'}
                                  {t.subscriptionStatus === 'OVERDUE' && 'Atrasada'}
                                  {t.subscriptionStatus === 'CANCELED' && 'Cancelada'}
                                  {t.subscriptionStatus === 'TRIAL' && 'Trial (Teste)'}
                                </span>
                              </td>
                              <td className="py-4 px-6 font-mono text-[10px] text-zinc-550 space-y-0.5">
                                <div className="block">Cus: {t.asaasCustomerId || '--'}</div>
                                <div className="block">Sub: {t.asaasSubscriptionId || '--'}</div>
                              </td>
                              <td className="py-4 px-6 text-right">
                                <select
                                  value={t.subscriptionStatus}
                                  onChange={async (e) => {
                                    const nextStatus = e.target.value;
                                    try {
                                      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
                                      const res = await fetch(`${apiUrl}/tenants/${t.id}`, {
                                        method: 'PUT',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'Authorization': `Bearer ${token}`
                                        },
                                        body: JSON.stringify({ subscriptionStatus: nextStatus, trialEndsAt: nextStatus === 'ACTIVE' ? null : t.trialEndsAt })
                                      });
                                      if (res.ok) {
                                        setSuccess(`Status de ${t.name} alterado para ${nextStatus}`);
                                        loadData();
                                        setTimeout(() => setSuccess(''), 3000);
                                      }
                                    } catch (err) {
                                      setError('Falha ao atualizar assinatura');
                                    }
                                  }}
                                  className="bg-white border border-zinc-250 rounded px-2 py-1 text-[11px] focus:outline-none"
                                >
                                  <option value="TRIAL">Trial (Teste)</option>
                                  <option value="ACTIVE">Active (Ativa)</option>
                                  <option value="OVERDUE">Overdue (Atrasada)</option>
                                  <option value="CANCELED">Canceled (Cancelada)</option>
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: Plans Setup */}
              {activeTab === 'plans' && (
                <div className="bg-white rounded-xl border border-zinc-200/80 shadow-sm p-8 max-w-2xl">
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="h-4.5 w-4.5 text-davinci-gold" />
                      Links de Assinatura do Asaas
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">Defina os URLs de checkout (Links de Pagamento) que serão apresentados aos salões na Paywall caso seu trial expire.</p>
                  </div>

                  <form onSubmit={handleUpdateSettings} className="space-y-6">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Checkout URL - Plano Essencial (Basic)</label>
                      <input
                        type="url"
                        value={settingsForm.PLAN_BASIC_LINK}
                        onChange={(e) => setSettingsForm({ ...settingsForm, PLAN_BASIC_LINK: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-davinci-gold transition font-mono"
                        placeholder="https://asaas.com/c/xxxxx..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Checkout URL - Plano Absoluto (Unlimited)</label>
                      <input
                        type="url"
                        value={settingsForm.PLAN_UNLIMITED_LINK}
                        onChange={(e) => setSettingsForm({ ...settingsForm, PLAN_UNLIMITED_LINK: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-davinci-gold transition font-mono"
                        placeholder="https://asaas.com/c/yyyyy..."
                      />
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        type="submit"
                        className="bg-gold-gradient text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md"
                      >
                        Salvar Links de Pagamento
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 4: General Settings */}
              {activeTab === 'settings' && (
                <div className="bg-white rounded-xl border border-zinc-200/80 shadow-sm p-8 max-w-2xl">
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                      <Key className="h-4.5 w-4.5 text-davinci-gold" />
                      Chaves de API Globais
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">Configure as chaves e credenciais globais da plataforma para envio de e-mails via Resend e cobrança Asaas.</p>
                  </div>

                  <form onSubmit={handleUpdateSettings} className="space-y-6">
                    
                    <div className="border-b border-zinc-100 pb-4">
                      <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-4">Módulo de E-mail (Resend)</h4>
                      
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Resend API Key</label>
                          <input
                            type="password"
                            value={settingsForm.RESEND_API_KEY}
                            onChange={(e) => setSettingsForm({ ...settingsForm, RESEND_API_KEY: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-davinci-gold transition font-mono"
                            placeholder="re_xxxxxxx..."
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">E-mail Remetente (From Email)</label>
                          <input
                            type="email"
                            value={settingsForm.RESEND_FROM_EMAIL}
                            onChange={(e) => setSettingsForm({ ...settingsForm, RESEND_FROM_EMAIL: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-davinci-gold transition"
                            placeholder="onboarding@seu-dominio.com.br"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-4">Plataforma Cobranças (Asaas)</h4>
                      
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">API Key do Asaas Principal</label>
                          <input
                            type="password"
                            value={settingsForm.PLATFORM_ASAAS_API_KEY}
                            onChange={(e) => setSettingsForm({ ...settingsForm, PLATFORM_ASAAS_API_KEY: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-davinci-gold transition font-mono"
                            placeholder="Insira a chave master do Asaas"
                          />
                        </div>

                        {/* Webhook notification alert */}
                        <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl text-xs text-zinc-600 space-y-1 leading-normal">
                          <span className="font-bold text-zinc-950 block">URL de Webhook para cadastrar no Asaas Principal:</span>
                          <code className="block p-1.5 bg-zinc-200/60 rounded text-[10px] break-all select-all font-mono">
                            {`${typeof window !== 'undefined' ? window.location.origin.replace(':3000', ':5001') : 'http://localhost:5001'}/tenants/saas-webhook`}
                          </code>
                          <span className="block mt-1">
                            Este webhook deve ser cadastrado na sua conta Asaas principal para escutar confirmações de pagamento dos planos SaaS.
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        type="submit"
                        className="bg-gold-gradient text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md"
                      >
                        Salvar Chaves Globais
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* CREATE/EDIT TENANT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-zinc-200 w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="p-6 border-b border-zinc-150">
              <h3 className="text-sm font-extrabold text-zinc-950 uppercase tracking-wider">
                {editingTenant ? `Editar Estabelecimento` : 'Novo Estabelecimento'}
              </h3>
            </div>

            <form onSubmit={handleTenantSubmit}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                
                {/* General Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Nome</label>
                    <input
                      type="text"
                      required
                      value={tenantForm.name}
                      onChange={handleNameChange}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-davinci-gold"
                      placeholder="Ex: Salão Beleza Real"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Subdomínio</label>
                    <input
                      type="text"
                      required
                      value={tenantForm.subdomain}
                      onChange={(e) => setTenantForm({ ...tenantForm, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      disabled={editingTenant?.subdomain === 'venusta'}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-davinci-gold disabled:opacity-50 font-mono"
                      placeholder="ex: beleza-real"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Domínio Personalizado</label>
                    <input
                      type="text"
                      value={tenantForm.customDomain}
                      onChange={(e) => setTenantForm({ ...tenantForm, customDomain: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-davinci-gold font-mono"
                      placeholder="ex: www.belezareal.com.br"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Status da Assinatura</label>
                    <select
                      value={tenantForm.subscriptionStatus}
                      onChange={(e) => setTenantForm({ ...tenantForm, subscriptionStatus: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none"
                    >
                      <option value="TRIAL">Trial (Teste)</option>
                      <option value="ACTIVE">Active (Ativa)</option>
                      <option value="OVERDUE">Overdue (Atrasada)</option>
                      <option value="CANCELED">Canceled (Cancelada)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Plano SaaS</label>
                    <select
                      value={tenantForm.saasPlan}
                      onChange={(e) => setTenantForm({ ...tenantForm, saasPlan: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none"
                    >
                      <option value="BASIC">Essencial (Basic)</option>
                      <option value="UNLIMITED">Absoluto (Unlimited)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Vencimento do Trial</label>
                    <input
                      type="date"
                      value={tenantForm.trialEndsAt}
                      onChange={(e) => setTenantForm({ ...tenantForm, trialEndsAt: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Admin user configuration */}
                <div className="border-t border-zinc-150 pt-4 space-y-3">
                  <h5 className="text-[10px] font-bold text-zinc-700 uppercase tracking-wider">Dados do Administrador Principal</h5>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Nome do Admin</label>
                      <input
                        type="text"
                        required
                        value={tenantForm.adminName}
                        onChange={(e) => setTenantForm({ ...tenantForm, adminName: e.target.value })}
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none"
                        placeholder="Nome"
                      />
                    </div>

                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">E-mail do Admin</label>
                      <input
                        type="email"
                        required
                        value={tenantForm.adminEmail}
                        onChange={(e) => setTenantForm({ ...tenantForm, adminEmail: e.target.value })}
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none font-mono"
                        placeholder="email@salão.com"
                      />
                    </div>

                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                        {editingTenant ? 'Senha (opcional)' : 'Senha de Acesso'}
                      </label>
                      <input
                        type="password"
                        required={!editingTenant}
                        value={tenantForm.adminPassword}
                        onChange={(e) => setTenantForm({ ...tenantForm, adminPassword: e.target.value })}
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none"
                        placeholder={editingTenant ? 'Manter inalterada' : 'Mín. 6 caracteres'}
                      />
                    </div>
                  </div>
                </div>

                {/* Limits configuration */}
                <div className="border-t border-zinc-150 pt-4 space-y-3">
                  <h5 className="text-[10px] font-bold text-zinc-700 uppercase tracking-wider">Limites de Uso do Plano</h5>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Limite Profissionais</label>
                      <input
                        type="number"
                        required
                        value={tenantForm.saasPlanLimitBarbers}
                        onChange={(e) => setTenantForm({ ...tenantForm, saasPlanLimitBarbers: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Limite Atendentes</label>
                      <input
                        type="number"
                        required
                        value={tenantForm.saasPlanLimitAttendants}
                        onChange={(e) => setTenantForm({ ...tenantForm, saasPlanLimitAttendants: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Limite Clientes</label>
                      <input
                        type="number"
                        required
                        value={tenantForm.saasPlanLimitClients}
                        onChange={(e) => setTenantForm({ ...tenantForm, saasPlanLimitClients: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-zinc-150 bg-zinc-50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-zinc-250 hover:bg-zinc-100 rounded-lg text-xs font-bold text-zinc-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingTenant}
                  className="bg-gold-gradient text-white font-extrabold px-6 py-2 rounded-lg text-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingTenant ? 'Gravando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
