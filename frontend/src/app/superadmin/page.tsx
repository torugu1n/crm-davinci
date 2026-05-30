'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore, TenantInfo } from '@/store/useStore';
import { getLogoUrl } from '@/lib/logo-helper';
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
  Paintbrush,
  Upload,
  User,
  Eye
} from 'lucide-react';

export default function SuperAdminPage() {
  const { user, token, logout } = useStore();
  const router = useRouter();

  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failedLogos, setFailedLogos] = useState<Record<string, boolean>>({});
  const [logoPreviewFailed, setLogoPreviewFailed] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [baseDomain, setBaseDomain] = useState('vtecsolutions.online');

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
    logoUrl: '',
    loginStyle: 'split',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    footerSlogan: '',
    footerInstagram: '',
    footerWhatsapp: '',
    footerFacebook: '',
    footerHours: '',
    footerAddress: '',
    footerPhone: '',
    footerEmail: '',
    footerCopyright: '',
    footerPoweredBy: ''
  });

  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('file', file);

    setUploadingLogo(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/tenants/upload-logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: fd
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao enviar arquivo da logomarca');

      setFormData(prev => ({ ...prev, logoUrl: data.url }));
      setLogoPreviewFailed(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar logomarca.');
    } finally {
      setUploadingLogo(false);
    }
  };

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
    setMounted(true);
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      const envDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN;
      if (envDomain) {
        setBaseDomain(envDomain);
      } else if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
        const parts = host.split('.');
        if (parts.length >= 2) {
          if (['superadmin', 'app', 'www'].includes(parts[0])) {
            setBaseDomain(parts.slice(1).join('.'));
          } else if (parts.length > 2) {
            setBaseDomain(parts.slice(1).join('.'));
          } else {
            setBaseDomain(host);
          }
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!token || !user || user.role !== 'SUPER_ADMIN') {
      router.push('/login');
      return;
    }
    fetchTenants();
  }, [mounted, token, user, router]);

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
      logoUrl: '',
      loginStyle: 'split',
      adminName: '',
      adminEmail: '',
      adminPassword: '',
      footerSlogan: '',
      footerInstagram: '',
      footerWhatsapp: '',
      footerFacebook: '',
      footerHours: '',
      footerAddress: '',
      footerPhone: '',
      footerEmail: '',
      footerCopyright: '',
      footerPoweredBy: ''
    });
    setError('');
    setLogoPreviewFailed(false);
    setModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (tenant: any) => {
    setEditingTenant(tenant);
    setFormData({
      name: tenant.name,
      subdomain: tenant.subdomain,
      customDomain: tenant.customDomain || '',
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
      logoUrl: tenant.logoUrl || '',
      loginStyle: tenant.loginStyle || 'split',
      adminName: tenant.users?.[0]?.nome || '',
      adminEmail: tenant.users?.[0]?.email || '',
      adminPassword: '',
      footerSlogan: tenant.footerSlogan || '',
      footerInstagram: tenant.footerInstagram || '',
      footerWhatsapp: tenant.footerWhatsapp || '',
      footerFacebook: tenant.footerFacebook || '',
      footerHours: tenant.footerHours || '',
      footerAddress: tenant.footerAddress || '',
      footerPhone: tenant.footerPhone || '',
      footerEmail: tenant.footerEmail || '',
      footerCopyright: tenant.footerCopyright || '',
      footerPoweredBy: tenant.footerPoweredBy || ''
    });
    setError('');
    setLogoPreviewFailed(false);
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

    const existingAdmin = (editingTenant as any)?.users?.[0];
    const needsAdminCredentials = !editingTenant || !existingAdmin;
    
    if (needsAdminCredentials && (!formData.adminEmail || !formData.adminPassword)) {
      setError('E-mail e senha do administrador principal são obrigatórios.');
      return;
    }

    const payload: any = {
      name: formData.name,
      subdomain: formData.subdomain,
      customDomain: formData.customDomain.trim() || null,
      logoUrl: formData.logoUrl.trim() || null,
      primaryColor: formData.primaryColor,
      secondaryColor: formData.secondaryColor,
      loginStyle: formData.loginStyle,
      footerSlogan: formData.footerSlogan.trim() || null,
      footerInstagram: formData.footerInstagram.trim() || null,
      footerWhatsapp: formData.footerWhatsapp.trim() || null,
      footerFacebook: formData.footerFacebook.trim() || null,
      footerHours: formData.footerHours.trim() || null,
      footerAddress: formData.footerAddress.trim() || null,
      footerPhone: formData.footerPhone.trim() || null,
      footerEmail: formData.footerEmail.trim() || null,
      footerCopyright: formData.footerCopyright.trim() || null,
      footerPoweredBy: formData.footerPoweredBy.trim() || null,
    };

    if (needsAdminCredentials) {
      payload.adminName = formData.adminName.trim();
      payload.adminEmail = formData.adminEmail.trim();
      payload.adminPassword = formData.adminPassword;
    } else {
      if (formData.adminName.trim() !== (existingAdmin.nome || '')) {
        payload.adminName = formData.adminName.trim();
      }
      if (formData.adminEmail.trim() !== (existingAdmin.email || '')) {
        payload.adminEmail = formData.adminEmail.trim();
      }
      if (formData.adminPassword) {
        payload.adminPassword = formData.adminPassword;
      }
    }

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

      setSuccess(editingTenant ? 'Estabelecimento atualizado com sucesso!' : 'Novo estabelecimento cadastrado com sucesso!');
      setModalOpen(false);
      fetchTenants();

      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Erro de conexão com o servidor');
    }
  };

  // Delete Tenant
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`ATENÇÃO: Você tem certeza que deseja excluir "${name}"?\nTodos os usuários, clientes, agendamentos e dados deste estabelecimento serão apagados permanentemente!`)) {
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

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex items-center justify-center p-6">
        <Loader2 className="h-10 w-10 text-[#C5A880] animate-spin" />
      </div>
    );
  }

  if (!token || !user || user.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex items-center justify-center p-6">
        <div className="glass-card max-w-md w-full p-8 border border-red-500/20 text-center rounded-2xl flex flex-col items-center">
          <ShieldAlert className="h-16 w-16 text-red-500 mb-4 animate-pulse" />
          <h1 className="text-2xl font-bold font-outfit mb-2">Acesso Negado</h1>
          <p className="text-gray-400 text-sm mb-6">Você precisa estar logado como Super Administrador para acessar esta área.</p>
          <button 
            onClick={() => router.push('/login')}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition duration-250 font-medium cursor-pointer"
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
            <p className="text-xs text-zinc-400 font-semibold tracking-wider uppercase mb-1">Total Estabelecimentos</p>
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
            <h2 className="text-xl font-bold font-outfit">Gerenciamento de Estabelecimentos (SaaS)</h2>
            <p className="text-zinc-400 text-xs mt-1">Crie, ative e configure marcas de clientes em tempo real.</p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center space-x-2 bg-[#C5A880] hover:bg-[#B39268] text-black font-semibold px-5 py-2.5 rounded-xl transition duration-200 shadow-md shadow-gold/5"
          >
            <Plus className="h-5 w-5" />
            <span>Cadastrar Estabelecimento</span>
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
            <p className="text-zinc-400 text-sm mb-4">Nenhum estabelecimento cadastrado no sistema.</p>
            <button 
              onClick={handleOpenCreate}
              className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-4 py-2 rounded-lg transition"
            >
              Adicionar Primeiro Estabelecimento
            </button>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants.map((tenant) => {
              const mainDomain = baseDomain;
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
                        {tenant.logoUrl && !failedLogos[tenant.id] ? (
                          <img 
                            src={getLogoUrl(tenant.logoUrl)} 
                            alt={tenant.name} 
                            className="h-10 w-10 rounded-lg object-cover bg-zinc-800 border border-zinc-700"
                            onError={() => {
                              setFailedLogos(prev => ({ ...prev, [tenant.id]: true }));
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

                    {/* Domain Meta & Admin User */}
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center text-xs text-zinc-400 bg-zinc-950/60 px-3 py-2 rounded-lg border border-zinc-800/40">
                        <Globe className="h-3.5 w-3.5 mr-2 text-[#C5A880]" />
                        <span className="font-mono text-zinc-300 overflow-hidden text-ellipsis whitespace-nowrap">
                          {tenant.subdomain}.{baseDomain}
                        </span>
                      </div>
                      
                      {tenant.customDomain && (
                        <div className="flex items-center text-xs text-zinc-400 bg-zinc-950/60 px-3 py-2 rounded-lg border border-zinc-800/40">
                          <Globe className="h-3.5 w-3.5 mr-2 text-blue-400" />
                          <span className="font-mono text-zinc-300 overflow-hidden text-ellipsis whitespace-nowrap font-semibold">
                            {tenant.customDomain}
                          </span>
                        </div>
                      )}

                      {tenant.users?.[0] ? (
                        <div className="flex items-center text-xs text-zinc-400 bg-zinc-950/60 px-3 py-2 rounded-lg border border-zinc-800/40">
                          <User className="h-3.5 w-3.5 mr-2 text-green-400" />
                          <span className="font-mono text-zinc-300 overflow-hidden text-ellipsis whitespace-nowrap">
                            Admin: {tenant.users[0].email}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center text-xs text-red-400 bg-red-950/20 px-3 py-2 rounded-lg border border-red-800/30">
                          <AlertTriangle className="h-3.5 w-3.5 mr-2 text-red-500 animate-pulse" />
                          <span className="font-semibold">Sem administrador cadastrado</span>
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
                      <div>
                        <span className="text-zinc-500">Login:</span>{' '}
                        <span className="text-zinc-300 font-semibold">
                          {tenant.loginStyle === 'split' && 'Split'}
                          {tenant.loginStyle === 'centered' && 'Centrado'}
                          {tenant.loginStyle === 'minimalist' && 'Minimalista'}
                          {tenant.loginStyle === 'glassmorphism' && 'Vidro'}
                          {!tenant.loginStyle && 'Split'}
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
                          title="Excluir Estabelecimento"
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
                {editingTenant ? `Editar Estabelecimento: ${editingTenant.name}` : 'Cadastrar Novo Estabelecimento'}
              </h3>
              <p className="text-zinc-400 text-xs mt-1">Configure o subdomínio, domínio personalizado, cores e rodapé do cliente.</p>
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
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase">Nome do Estabelecimento</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleNameChange}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-[#C5A880] transition"
                    placeholder="Ex: Estabelecimento Premium, Classic Club"
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
                      .{baseDomain}
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

                {/* Logo Upload & URL */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase">Logomarca (Upload ou URL)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* File Upload Input Area */}
                    <div className="border border-dashed border-zinc-800 bg-zinc-950/60 p-4 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#C5A880]/30 transition relative min-h-[90px]">
                      {uploadingLogo ? (
                        <>
                          <Loader2 className="h-5 w-5 text-[#C5A880] animate-spin mb-1.5" />
                          <span className="text-[10px] text-zinc-400">Enviando arquivo...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5 text-zinc-500 mb-1.5" />
                          <span className="text-xs text-zinc-300 font-medium">Enviar Imagem</span>
                          <span className="text-[9px] text-zinc-500 mt-0.5">PNG, JPG, SVG, WEBP</span>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </>
                      )}
                    </div>
                    {/* Direct URL input */}
                    <div className="flex flex-col justify-center space-y-1.5">
                      <span className="text-[10px] text-zinc-500 font-semibold uppercase">Ou link direto da logo</span>
                      <input
                        type="text"
                        value={formData.logoUrl}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, logoUrl: e.target.value }));
                          setLogoPreviewFailed(false);
                        }}
                        className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-[#C5A880] transition"
                        placeholder="https://site.com/logo.png"
                      />
                    </div>
                  </div>
                  {/* Uploaded Logo Preview */}
                  {formData.logoUrl && !logoPreviewFailed && (
                    <div className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 mt-2">
                      <div className="flex items-center space-x-3 min-w-0">
                        <img 
                          src={getLogoUrl(formData.logoUrl)} 
                          alt="Preview" 
                          className="h-9 w-9 object-cover bg-zinc-800 border border-zinc-700 rounded" 
                          onError={() => { setLogoPreviewFailed(true); }}
                        />
                        <div className="min-w-0">
                          <span className="block text-[9px] font-semibold text-zinc-500 uppercase leading-none">Arquivo da Logo</span>
                          <span className="block text-[10px] font-mono text-zinc-400 truncate mt-0.5 max-w-[240px]">{formData.logoUrl}</span>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setFormData(prev => ({ ...prev, logoUrl: '' }))}
                        className="text-[10px] text-red-400 hover:text-red-300 font-medium px-2 py-1 hover:bg-red-950/20 rounded transition"
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>

                {/* Administrator Credentials */}
                <div className="border border-zinc-800 bg-zinc-950/20 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="block text-xs font-bold text-[#C5A880] uppercase tracking-wider">Conta do Administrador Principal</span>
                    {editingTenant && (
                      <span className="text-[9px] bg-zinc-800 text-zinc-300 font-mono px-2 py-0.5 rounded-full">
                        {((editingTenant as any)?.users?.[0]) ? 'Conta Existente' : 'Sem Conta'}
                      </span>
                    )}
                  </div>

                  {editingTenant && !((editingTenant as any)?.users?.[0]) && (
                    <div className="p-3 bg-red-950/20 border border-red-800/40 text-red-300 rounded-lg text-[11px] flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-500 animate-pulse" />
                      <span>Este estabelecimento não possui uma conta de acesso vinculada. Cadastre os dados abaixo para habilitar o login do administrador.</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-400 mb-1 uppercase">Nome do Administrador</label>
                      <input
                        type="text"
                        required={!editingTenant || !((editingTenant as any)?.users?.[0])}
                        value={formData.adminName}
                        onChange={(e) => setFormData(prev => ({ ...prev, adminName: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs focus:outline-none focus:border-[#C5A880] transition"
                        placeholder="Ex: Carlos Silva"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-400 mb-1 uppercase">E-mail de Login</label>
                      <input
                        type="email"
                        required={!editingTenant || !((editingTenant as any)?.users?.[0])}
                        value={formData.adminEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, adminEmail: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs focus:outline-none focus:border-[#C5A880] transition font-mono"
                        placeholder="carlos@email.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 mb-1.5 uppercase">
                      {editingTenant && ((editingTenant as any)?.users?.[0]) ? 'Nova Senha do Administrador' : 'Senha de Acesso'}
                    </label>
                    <input
                      type="password"
                      required={!editingTenant || !((editingTenant as any)?.users?.[0])}
                      value={formData.adminPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, adminPassword: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs focus:outline-none focus:border-[#C5A880] transition font-mono"
                      placeholder={editingTenant && ((editingTenant as any)?.users?.[0]) ? 'Deixe em branco para não alterar' : '••••••••'}
                    />
                  </div>
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

                {/* Login Screen Theme Selector */}
                <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider leading-none">Estilo da Tela de Login</label>
                    <button
                      type="button"
                      onClick={() => setShowPreviewModal(true)}
                      className="flex items-center gap-1.5 text-[9px] text-[#C5A880] hover:text-white font-bold uppercase tracking-wider bg-[#C5A880]/10 border border-[#C5A880]/30 hover:border-white/30 px-2 py-1 rounded transition cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Visualizar Modelos
                    </button>
                  </div>
                  <select
                    value={formData.loginStyle}
                    onChange={(e) => setFormData(prev => ({ ...prev, loginStyle: e.target.value }))}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-[#C5A880] transition cursor-pointer"
                  >
                    <option value="split">Lado a Lado (Padrão Split)</option>
                    <option value="centered">Centralizado Clássico (Centered)</option>
                    <option value="minimalist">Minimalista Escuro (Dark Minimalist)</option>
                    <option value="glassmorphism">Vidro Espelhado (Glassmorphism Glow)</option>
                  </select>
                </div>

                {/* Custom Footer Fields */}
                <div className="border border-zinc-800 bg-zinc-950/20 p-4 rounded-xl space-y-3">
                  <span className="block text-xs font-bold text-[#C5A880] uppercase tracking-wider">Configurações de Rodapé</span>
                  
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 mb-1 uppercase">Slogan do Rodapé</label>
                    <input
                      type="text"
                      value={formData.footerSlogan}
                      onChange={(e) => setFormData(prev => ({ ...prev, footerSlogan: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs focus:outline-none focus:border-[#C5A880] transition"
                      placeholder="Ex: O melhor corte e atendimento da região"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-400 mb-1 uppercase">Instagram</label>
                      <input
                        type="text"
                        value={formData.footerInstagram}
                        onChange={(e) => setFormData(prev => ({ ...prev, footerInstagram: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs focus:outline-none focus:border-[#C5A880] transition"
                        placeholder="@perfil"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-400 mb-1 uppercase">WhatsApp</label>
                      <input
                        type="text"
                        value={formData.footerWhatsapp}
                        onChange={(e) => setFormData(prev => ({ ...prev, footerWhatsapp: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs focus:outline-none focus:border-[#C5A880] transition"
                        placeholder="Ex: 5511999999999"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-400 mb-1 uppercase">Facebook</label>
                      <input
                        type="text"
                        value={formData.footerFacebook}
                        onChange={(e) => setFormData(prev => ({ ...prev, footerFacebook: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs focus:outline-none focus:border-[#C5A880] transition"
                        placeholder="Ex: facebook.com/pagina"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 mb-1 uppercase">Horário de Funcionamento</label>
                    <textarea
                      value={formData.footerHours}
                      onChange={(e) => setFormData(prev => ({ ...prev, footerHours: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs focus:outline-none focus:border-[#C5A880] transition resize-none"
                      placeholder="Ex: Seg a Sex: 9h às 20h&#10;Sáb: 9h às 18h"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-400 mb-1 uppercase">Telefone de Contato</label>
                      <input
                        type="text"
                        value={formData.footerPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, footerPhone: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs focus:outline-none focus:border-[#C5A880] transition"
                        placeholder="Ex: (11) 99999-9999"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-400 mb-1 uppercase">E-mail de Contato</label>
                      <input
                        type="email"
                        value={formData.footerEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, footerEmail: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs focus:outline-none focus:border-[#C5A880] transition"
                        placeholder="Ex: contato@estabelecimento.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 mb-1 uppercase">Endereço do Local</label>
                    <input
                      type="text"
                      value={formData.footerAddress}
                      onChange={(e) => setFormData(prev => ({ ...prev, footerAddress: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs focus:outline-none focus:border-[#C5A880] transition"
                      placeholder="Rua Exemplo, 123 - Centro, São Paulo - SP"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-400 mb-1 uppercase">Copyright Texto</label>
                      <input
                        type="text"
                        value={formData.footerCopyright}
                        onChange={(e) => setFormData(prev => ({ ...prev, footerCopyright: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs focus:outline-none focus:border-[#C5A880] transition"
                        placeholder="Ex: © 2026 Estabelecimento. Todos os direitos reservados."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-400 mb-1 uppercase">Powered By Texto</label>
                      <input
                        type="text"
                        value={formData.footerPoweredBy}
                        onChange={(e) => setFormData(prev => ({ ...prev, footerPoweredBy: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs focus:outline-none focus:border-[#C5A880] transition"
                        placeholder="Ex: Desenvolvido por Vtec"
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
                      <div className="text-sm font-semibold">{formData.name || 'Novo Estabelecimento'}</div>
                      <div className="text-xs text-zinc-400">{formData.subdomain || 'subdominio'}.{baseDomain}</div>
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
                  {editingTenant ? 'Salvar Alterações' : 'Cadastrar Estabelecimento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Login Templates Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-[#0c0c0e] border border-zinc-855/90 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white font-outfit">Modelos de Tela de Login</h3>
                <p className="text-xs text-zinc-500">Selecione o modelo desejado clicando diretamente em qualquer miniatura</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="text-zinc-400 hover:text-white transition text-xs font-semibold px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg cursor-pointer"
              >
                Fechar
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-[70vh]">
              {/* 1. Split Screen */}
              <div 
                onClick={() => {
                  setFormData(prev => ({ ...prev, loginStyle: 'split' }));
                  setShowPreviewModal(false);
                }}
                className={`group border rounded-xl overflow-hidden cursor-pointer transition-all duration-300 p-4 bg-zinc-950 flex flex-col justify-between h-72 ${
                  formData.loginStyle === 'split' ? 'border-[#C5A880] ring-1 ring-[#C5A880]/50 shadow-lg shadow-[#C5A880]/5' : 'border-zinc-800/60 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white group-hover:text-[#C5A880] transition-colors">1. Lado a Lado (Split)</span>
                    {formData.loginStyle === 'split' && <span className="text-[9px] bg-[#C5A880]/20 border border-[#C5A880]/45 text-[#C5A880] px-2 py-0.5 rounded-full font-bold">Ativo</span>}
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-relaxed mb-4">Design moderno corporativo. Banner com imagem e diferenciais na esquerda e formulário na direita.</p>
                </div>
                
                {/* CSS Mockup Split */}
                <div className="flex-1 rounded-lg border border-zinc-800 overflow-hidden bg-zinc-900 flex">
                  {/* Left Hero */}
                  <div className="w-[45%] bg-[#C5A880]/10 border-r border-zinc-800 p-2 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="h-2 w-8 bg-[#C5A880] rounded" />
                      <div className="h-3 w-16 bg-white rounded" />
                      <div className="h-1.5 w-12 bg-zinc-500 rounded" />
                    </div>
                    <div className="flex gap-1">
                      <div className="h-2 w-2 rounded bg-zinc-700" />
                      <div className="h-2 w-2 rounded bg-zinc-700" />
                      <div className="h-2 w-2 rounded bg-zinc-700" />
                    </div>
                  </div>
                  {/* Right Form */}
                  <div className="flex-1 bg-zinc-900 p-2 flex items-center justify-center">
                    <div className="w-[75%] bg-white rounded border border-zinc-200/50 p-2 space-y-1.5 shadow-sm">
                      <div className="h-1.5 w-8 bg-zinc-300 rounded mx-auto" />
                      <div className="h-2.5 w-full bg-zinc-100 rounded" />
                      <div className="h-2.5 w-full bg-zinc-100 rounded" />
                      <div className="h-3.5 w-full bg-[#C5A880] rounded" />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Centered Layout */}
              <div 
                onClick={() => {
                  setFormData(prev => ({ ...prev, loginStyle: 'centered' }));
                  setShowPreviewModal(false);
                }}
                className={`group border rounded-xl overflow-hidden cursor-pointer transition-all duration-300 p-4 bg-zinc-950 flex flex-col justify-between h-72 ${
                  formData.loginStyle === 'centered' ? 'border-[#C5A880] ring-1 ring-[#C5A880]/50 shadow-lg shadow-[#C5A880]/5' : 'border-zinc-800/60 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white group-hover:text-[#C5A880] transition-colors">2. Centralizado Clássico (Centered)</span>
                    {formData.loginStyle === 'centered' && <span className="text-[9px] bg-[#C5A880]/20 border border-[#C5A880]/45 text-[#C5A880] px-2 py-0.5 rounded-full font-bold">Ativo</span>}
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-relaxed mb-4">Layout focado em branding. Logotipo grande e centralizado acima do card, com fundo claro e leve.</p>
                </div>
                
                {/* CSS Mockup Centered */}
                <div className="flex-1 rounded-lg border border-zinc-800 overflow-hidden bg-zinc-50 flex flex-col items-center justify-center p-3 relative">
                  {/* Logo mockup */}
                  <div className="flex flex-col items-center space-y-1 mb-2">
                    <div className="h-5 w-5 rounded-full bg-zinc-300 flex items-center justify-center border border-[#C5A880]/30 p-0.5">
                      <div className="h-3 w-3 bg-[#C5A880] rounded-full" />
                    </div>
                    <div className="h-1.5 w-10 bg-zinc-800 rounded" />
                  </div>
                  {/* Card mockup */}
                  <div className="w-[65%] bg-white rounded border border-zinc-200/50 p-2 space-y-1.5 shadow-md">
                    <div className="h-2.5 w-full bg-zinc-100 rounded" />
                    <div className="h-2.5 w-full bg-zinc-100 rounded" />
                    <div className="h-3.5 w-full bg-[#C5A880] rounded" />
                  </div>
                </div>
              </div>

              {/* 3. Minimalist Dark */}
              <div 
                onClick={() => {
                  setFormData(prev => ({ ...prev, loginStyle: 'minimalist' }));
                  setShowPreviewModal(false);
                }}
                className={`group border rounded-xl overflow-hidden cursor-pointer transition-all duration-300 p-4 bg-zinc-950 flex flex-col justify-between h-72 ${
                  formData.loginStyle === 'minimalist' ? 'border-[#C5A880] ring-1 ring-[#C5A880]/50 shadow-lg shadow-[#C5A880]/5' : 'border-zinc-800/60 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white group-hover:text-[#C5A880] transition-colors">3. Minimalista Escuro (Minimalist)</span>
                    {formData.loginStyle === 'minimalist' && <span className="text-[9px] bg-[#C5A880]/20 border border-[#C5A880]/45 text-[#C5A880] px-2 py-0.5 rounded-full font-bold">Ativo</span>}
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-relaxed mb-4">Elegância e alto contraste em Dark Mode. Fundo preto absoluto com inputs escuros e detalhes dourados.</p>
                </div>
                
                {/* CSS Mockup Minimalist */}
                <div className="flex-1 rounded-lg border border-zinc-800 overflow-hidden bg-black flex flex-col items-center justify-center p-3">
                  <div className="flex flex-col items-center space-y-1.5 mb-2">
                    <div className="h-4 w-4 bg-[#C5A880]/20 rounded border border-[#C5A880] flex items-center justify-center" />
                    <div className="h-1.5 w-10 bg-white rounded" />
                  </div>
                  <div className="w-[65%] bg-zinc-900 border border-zinc-800 p-2 rounded space-y-1.5">
                    <div className="h-2.5 w-full bg-zinc-950 border border-zinc-800 rounded" />
                    <div className="h-2.5 w-full bg-zinc-950 border border-[#C5A880]/40 rounded" />
                    <div className="h-3.5 w-full bg-[#C5A880] rounded" />
                  </div>
                </div>
              </div>

              {/* 4. Glassmorphism */}
              <div 
                onClick={() => {
                  setFormData(prev => ({ ...prev, loginStyle: 'glassmorphism' }));
                  setShowPreviewModal(false);
                }}
                className={`group border rounded-xl overflow-hidden cursor-pointer transition-all duration-300 p-4 bg-zinc-950 flex flex-col justify-between h-72 ${
                  formData.loginStyle === 'glassmorphism' ? 'border-[#C5A880] ring-1 ring-[#C5A880]/50 shadow-lg shadow-[#C5A880]/5' : 'border-zinc-800/60 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white group-hover:text-[#C5A880] transition-colors">4. Vidro Espelhado (Glassmorphism)</span>
                    {formData.loginStyle === 'glassmorphism' && <span className="text-[9px] bg-[#C5A880]/20 border border-[#C5A880]/45 text-[#C5A880] px-2 py-0.5 rounded-full font-bold">Ativo</span>}
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-relaxed mb-4">Visual futurista premium. Card translúcido com forte efeito de blur sobre esferas coloridas brilhando ao fundo.</p>
                </div>
                
                {/* CSS Mockup Glass */}
                <div className="flex-1 rounded-lg border border-zinc-800 overflow-hidden bg-[#0d0e12] flex flex-col items-center justify-center p-3 relative">
                  {/* Glowing spheres in background */}
                  <div className="absolute top-1/4 right-1/4 w-12 h-12 rounded-full bg-[#C5A880]/30 blur-md pointer-events-none" />
                  <div className="absolute bottom-1/4 left-1/4 w-14 h-14 rounded-full bg-blue-500/20 blur-md pointer-events-none" />
                  
                  <div className="flex flex-col items-center space-y-1.5 mb-2 z-10">
                    <div className="h-4 w-4 bg-white/20 rounded-full border border-white/30 flex items-center justify-center" />
                    <div className="h-1.5 w-12 bg-white/95 rounded" />
                  </div>
                  <div className="w-[65%] backdrop-blur-md bg-white/5 border border-white/10 p-2 rounded-xl space-y-1.5 z-10 shadow-lg">
                    <div className="h-2.5 w-full bg-white/5 border border-white/5 rounded" />
                    <div className="h-2.5 w-full bg-white/5 border border-white/5 rounded" />
                    <div className="h-3.5 w-full bg-[#C5A880]/90 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
