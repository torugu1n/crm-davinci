'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { getLogoUrl } from '@/lib/logo-helper';
import TenantBillingManager from '@/components/TenantBillingManager';
import {
  Instagram,
  Facebook,
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  Save,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  CreditCard,
  Monitor,
  Globe,
  Image,
  Upload,
} from 'lucide-react';

const LOGIN_STYLES = [
  {
    id: 'split',
    label: 'Split',
    desc: 'Divisão com hero lateral colorido',
    bg: 'from-amber-100 to-zinc-100',
    accent: '#C5A880',
  },
  {
    id: 'centered',
    label: 'Centralizado',
    desc: 'Logo e formulário centralizados',
    bg: 'from-zinc-50 to-zinc-100',
    accent: '#C5A880',
  },
  {
    id: 'minimalist',
    label: 'Minimalista',
    desc: 'Dark mode elegante e sóbrio',
    bg: 'from-zinc-900 to-zinc-950',
    accent: '#C5A880',
  },
  {
    id: 'glassmorphism',
    label: 'Glassmorphism',
    desc: 'Blur vibrante com gradientes flutuantes',
    bg: 'from-slate-900 via-purple-950 to-slate-900',
    accent: '#a78bfa',
  },
  {
    id: 'bubblegum',
    label: 'Bubblegum',
    desc: 'Tons pastel rosa & violeta lúdicos',
    bg: 'from-pink-200 via-violet-100 to-purple-200',
    accent: '#db2777',
  },
  {
    id: 'brutalist',
    label: 'Brutalist',
    desc: 'Linhas fortes, preto e branco ousado',
    bg: 'from-white to-zinc-100',
    accent: '#000000',
  },
  {
    id: 'royal_gold',
    label: 'Royal Gold',
    desc: 'Azul marinho e dourado majestoso',
    bg: 'from-slate-950 via-slate-900 to-amber-950',
    accent: '#d97706',
  },
  {
    id: 'cyberpunk',
    label: 'Cyberpunk',
    desc: 'Neon vibrante, preto e rosa tech',
    bg: 'from-zinc-950 via-indigo-950 to-zinc-950',
    accent: '#ec4899',
  },
  {
    id: 'vintage_barber',
    label: 'Vintage Barber',
    desc: 'Classic retrô com tons de couro e creme vintage',
    bg: 'from-amber-950/20 via-amber-900/10 to-amber-950/20',
    accent: '#8b5a2b',
  },
  {
    id: 'emerald_luxe',
    label: 'Emerald Luxe',
    desc: 'Verde esmeralda sofisticado e realce dourado',
    bg: 'from-emerald-950 via-teal-950 to-emerald-950',
    accent: '#d4af37',
  },
  {
    id: 'aurora_nord',
    label: 'Aurora Nord',
    desc: 'Clean escandinavo com tons de azul e aurora boreal',
    bg: 'from-slate-900 via-indigo-950 to-slate-900',
    accent: '#48cae4',
  },
] as const;

export default function SettingsManager() {
  const token = useStore((state) => state.token);
  const tenant = useStore((state) => state.tenant);
  const setTenant = useStore((state) => state.setTenant);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeSettingsTab, setActiveSettingsTab] = useState<'visual' | 'chatbot' | 'footer' | 'gateway'>('visual');

  const [formData, setFormData] = useState({
    footerSlogan: '',
    footerInstagram: '',
    footerWhatsapp: '',
    footerFacebook: '',
    footerHours: '',
    footerAddress: '',
    footerPhone: '',
    footerEmail: '',
    footerCopyright: '',
    footerPoweredBy: '',
    gatewayProvider: 'SIMULADO',
    gatewayApiKey: '',
    gatewayWebhookSecret: '',
    loginStyle: 'split',
    rootRedirect: 'login',
    chatbotPrompt: '',
    primaryColor: '#C5A880',
    secondaryColor: '#18181b',
    backgroundColor: '#FAF9FF',
    logoUrl: '',
  });

  useEffect(() => {
    if (tenant) {
      setFormData({
        footerSlogan: tenant.footerSlogan || '',
        footerInstagram: tenant.footerInstagram || '',
        footerWhatsapp: tenant.footerWhatsapp || '',
        footerFacebook: tenant.footerFacebook || '',
        footerHours: tenant.footerHours || '',
        footerAddress: tenant.footerAddress || '',
        footerPhone: tenant.footerPhone || '',
        footerEmail: tenant.footerEmail || '',
        footerCopyright: tenant.footerCopyright || '',
        footerPoweredBy: tenant.footerPoweredBy || '',
        gatewayProvider: tenant.gatewayProvider || 'SIMULADO',
        gatewayApiKey: tenant.gatewayApiKey || '',
        gatewayWebhookSecret: tenant.gatewayWebhookSecret || '',
        loginStyle: tenant.loginStyle || 'split',
        rootRedirect: tenant.rootRedirect || 'login',
        chatbotPrompt: (tenant as any).chatbotPrompt || '',
        primaryColor: tenant.primaryColor || '#C5A880',
        secondaryColor: tenant.secondaryColor || '#18181b',
        backgroundColor: tenant.backgroundColor || '#FAF9FF',
        logoUrl: tenant.logoUrl || '',
      });
    }
  }, [tenant]);

  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tenant) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('A imagem é muito grande. Escolha uma foto de até 2MB.');
      return;
    }

    setUploadingLogo(true);
    setError('');
    setSuccess('');

    try {
      const fileData = new FormData();
      fileData.append('file', file);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/tenants/upload-logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: fileData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao fazer upload da logo');

      setFormData((prev) => ({ ...prev, logoUrl: data.url }));
      setSuccess('Logo carregada com sucesso! Lembre-se de salvar as alterações.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Erro de conexão ao enviar logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({ ...prev, logoUrl: '' }));
  };

  const getCleanNumber = (num: string) => num.replace(/\D/g, '');

  const getWhatsAppLink = (input: string) => {
    if (!input) return '';
    const clean = getCleanNumber(input);
    if (!clean) return input;
    if (clean.length === 10 || clean.length === 11) return `https://wa.me/55${clean}`;
    return `https://wa.me/${clean}`;
  };

  const getMapsLink = (address: string) => {
    if (!address) return '';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/tenants/${tenant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          footerSlogan: formData.footerSlogan,
          footerInstagram: formData.footerInstagram,
          footerWhatsapp: formData.footerWhatsapp,
          footerFacebook: formData.footerFacebook,
          footerHours: formData.footerHours,
          footerAddress: formData.footerAddress,
          footerPhone: formData.footerPhone,
          footerEmail: formData.footerEmail,
          footerCopyright: formData.footerCopyright,
          footerPoweredBy: formData.footerPoweredBy,
          gatewayProvider: formData.gatewayProvider,
          gatewayApiKey: formData.gatewayApiKey,
          gatewayWebhookSecret: formData.gatewayWebhookSecret,
          loginStyle: formData.loginStyle,
          rootRedirect: formData.rootRedirect,
          chatbotPrompt: formData.chatbotPrompt,
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          backgroundColor: formData.backgroundColor,
          logoUrl: formData.logoUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao atualizar configurações');
      setTenant(data);
      setSuccess('Configurações salvas com sucesso!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const logoSrc = formData.logoUrl ? getLogoUrl(formData.logoUrl) : null;
  const activeColor = formData.primaryColor || '#C5A880';
  const bgColor = formData.secondaryColor || '#18181b';

  return (
    <div className="space-y-8 animate-fadeIn">
      <TenantBillingManager />

      <div className="bg-white border border-zinc-200/80 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-davinci-black uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-davinci-gold" />
            Personalização — Login, Rodapé e Contatos
          </h3>
          <p className="text-xs text-davinci-gray leading-relaxed max-w-2xl">
            Configure o estilo visual da tela de login do seu subdomínio, a página padrão ao acessar a raiz (&quot;/&quot;), e as informações que aparecem no rodapé do site de agendamento.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* ── Settings Form ─────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
            <h4 className="text-xs font-bold text-davinci-black uppercase tracking-widest">Configurações</h4>
            {success && (
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 animate-pulse">
                <CheckCircle className="h-3.5 w-3.5" />
                {success}
              </span>
            )}
            {error && (
              <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-pulse">
                <AlertCircle className="h-3.5 w-3.5" />
                {error}
              </span>
            )}
          </div>

          <div className="flex border-b border-zinc-100 bg-zinc-50/50 p-1 gap-1 shrink-0 overflow-x-auto scrollbar-none">
            {[
              { id: 'visual', label: 'Visual e Acesso', icon: Monitor },
              { id: 'chatbot', label: 'Chatbot de IA', icon: Sparkles },
              { id: 'footer', label: 'Rodapé e Localização', icon: Globe },
              ...(tenant?.subscriptionModuleEnabled ? [{ id: 'gateway', label: 'Gateway de Pagamento', icon: CreditCard }] : []),
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSettingsTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSettingsTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-davinci-gold shadow-sm border border-zinc-200/40'
                      : 'text-zinc-500 hover:text-zinc-800 hover:bg-white/50'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-davinci-gold' : 'text-zinc-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-6 space-y-6">
            {activeSettingsTab === 'visual' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="space-y-5">
                  <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                    <Monitor className="h-4 w-4 text-davinci-gold" />
                    <h5 className="text-[11px] font-bold text-davinci-black uppercase tracking-wider">Tela de Login do Subdomínio</h5>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-davinci-gray uppercase tracking-wider mb-3">
                      Estilo Visual da Tela de Login
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {LOGIN_STYLES.map((style) => {
                        const isSelected = formData.loginStyle === style.id;
                        return (
                          <button
                            key={style.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, loginStyle: style.id })}
                            className={`relative flex flex-col items-start gap-2 p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'border-davinci-gold shadow-[0_0_0_3px_rgba(197,168,128,0.12)] bg-amber-50/60'
                                : 'border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50/80'
                            }`}
                          >
                            <div className={`w-full h-10 rounded-lg bg-gradient-to-br ${style.bg} overflow-hidden relative border border-zinc-200/60`}>
                              <div className="absolute inset-0 flex">
                                {style.id === 'split' && (
                                  <>
                                    <div className="w-2/5 h-full" style={{ backgroundColor: activeColor, opacity: 0.7 }} />
                                    <div className="w-3/5 h-full bg-zinc-50/80 flex items-center justify-center">
                                      <div className="w-10 h-1.5 bg-zinc-300 rounded-full" />
                                    </div>
                                  </>
                                )}
                                {style.id === 'centered' && (
                                  <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                                    <div className="w-5 h-1.5 bg-zinc-400 rounded-full" />
                                    <div className="w-8 h-1 bg-zinc-200 rounded-full" />
                                  </div>
                                )}
                                {style.id === 'minimalist' && (
                                  <div className="w-full h-full bg-zinc-900 flex flex-col items-center justify-center gap-1">
                                    <div className="w-5 h-1.5 rounded-full" style={{ backgroundColor: style.accent }} />
                                    <div className="w-8 h-1 bg-zinc-700 rounded-full" />
                                  </div>
                                )}
                                {style.id === 'glassmorphism' && (
                                  <div className="w-full h-full relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-slate-900 to-indigo-900" />
                                    <div className="absolute top-0 left-0 w-6 h-6 rounded-full blur-md opacity-50" style={{ backgroundColor: style.accent }} />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="w-12 h-7 rounded bg-white/10 border border-white/20 backdrop-blur-sm flex flex-col items-center justify-center gap-1">
                                        <div className="w-6 h-1 rounded-full bg-white/40" />
                                        <div className="w-4 h-1 rounded-full bg-white/20" />
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {style.id === 'bubblegum' && (
                                  <div className="w-full h-full bg-gradient-to-br from-pink-200 via-violet-100 to-purple-200 flex items-center justify-center">
                                    <div className="w-10 h-7 rounded-xl bg-white shadow flex flex-col items-center justify-center gap-1">
                                      <div className="w-5 h-1 rounded-full bg-pink-300" />
                                      <div className="w-4 h-1 rounded-full bg-violet-300" />
                                    </div>
                                  </div>
                                )}
                                {style.id === 'brutalist' && (
                                  <div className="w-full h-full bg-white flex">
                                    <div className="w-2/5 h-full border-r-2 border-black" style={{ backgroundColor: activeColor }} />
                                    <div className="w-3/5 h-full flex flex-col items-center justify-center gap-1 px-1">
                                      <div className="w-8 h-1.5 bg-black rounded-none" />
                                      <div className="w-6 h-1 bg-zinc-400 rounded-none" />
                                    </div>
                                  </div>
                                )}
                                {style.id === 'royal_gold' && (
                                  <div className="w-full h-full bg-[#0b0b0f] flex flex-col items-center justify-center gap-1 border border-amber-500/25">
                                    <div className="w-6 h-1 bg-amber-500 rounded-full" />
                                    <div className="w-4 h-1 bg-zinc-800 rounded-full" />
                                  </div>
                                )}
                                {style.id === 'cyberpunk' && (
                                  <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center gap-1 border border-cyan-400/30">
                                    <div className="w-6 h-1 bg-pink-500 rounded-none shadow-[0_0_4px_#ec4899]" />
                                    <div className="w-4 h-1 bg-cyan-400 rounded-none shadow-[0_0_4px_#22d3ee]" />
                                  </div>
                                )}
                                {style.id === 'vintage_barber' && (
                                  <div className="w-full h-full bg-[#fdfbf7] flex">
                                    <div className="w-2/5 h-full bg-[#3c2a21]" />
                                    <div className="w-3/5 h-full flex flex-col items-center justify-center gap-1 px-1">
                                      <div className="w-8 h-1.5 bg-[#8b5a2b] rounded-full" />
                                      <div className="w-6 h-1 bg-[#d7c49e] rounded-full" />
                                    </div>
                                  </div>
                                )}
                                {style.id === 'emerald_luxe' && (
                                  <div className="w-full h-full bg-[#031d16] flex flex-col items-center justify-center gap-1 border border-amber-500/20">
                                    <div className="w-6 h-1 bg-amber-500 rounded-full shadow-[0_0_4px_rgba(245,158,11,0.3)]" />
                                    <div className="w-4 h-1 bg-emerald-800 rounded-full" />
                                  </div>
                                )}
                                {style.id === 'aurora_nord' && (
                                  <div className="w-full h-full bg-[#0b132b] flex flex-col items-center justify-center gap-1 border border-[#48cae4]/20">
                                    <div className="w-6 h-1 bg-[#48cae4] rounded-full shadow-[0_0_4px_#48cae4]" />
                                    <div className="w-4 h-1 bg-[#1c2541] rounded-full" />
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="space-y-0.5 w-full">
                              <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-davinci-gold' : 'text-davinci-black'}`}>
                                  {style.label}
                                </span>
                                {isSelected && <CheckCircle className="h-3 w-3 text-davinci-gold shrink-0" />}
                              </div>
                              <p className="text-[9px] text-davinci-gray leading-tight font-medium">{style.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cores da Barbearia */}
                  <div className="space-y-3 pt-2">
                    <label className="block text-[10px] font-bold text-davinci-gray uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-davinci-gold" />
                      Cores da Identidade Visual
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Cor Primária */}
                      <div className="bg-zinc-50/50 border border-zinc-200/60 p-3.5 rounded-xl flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-davinci-black uppercase tracking-wider block">Cor Primária</span>
                          <span className="text-[9px] text-davinci-gray font-medium leading-none block font-mono">{formData.primaryColor}</span>
                        </div>
                        <input
                          type="color"
                          value={formData.primaryColor}
                          onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                          className="w-10 h-10 rounded-lg cursor-pointer border border-zinc-300 overflow-hidden shrink-0 bg-transparent p-0"
                        />
                      </div>
                      {/* Cor Secundária (Fundo) */}
                      <div className="bg-zinc-50/50 border border-zinc-200/60 p-3.5 rounded-xl flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-davinci-black uppercase tracking-wider block">Cor Secundária</span>
                          <span className="text-[9px] text-davinci-gray font-medium leading-none block font-mono">{formData.secondaryColor}</span>
                        </div>
                        <input
                          type="color"
                          value={formData.secondaryColor}
                          onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                          className="w-10 h-10 rounded-lg cursor-pointer border border-zinc-300 overflow-hidden shrink-0 bg-transparent p-0"
                        />
                      </div>
                      {/* Cor de Fundo */}
                      <div className="bg-zinc-50/50 border border-zinc-200/60 p-3.5 rounded-xl flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-davinci-black uppercase tracking-wider block">Cor de Fundo</span>
                          <span className="text-[9px] text-davinci-gray font-medium leading-none block font-mono">{formData.backgroundColor}</span>
                        </div>
                        <input
                          type="color"
                          value={formData.backgroundColor}
                          onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                          className="w-10 h-10 rounded-lg cursor-pointer border border-zinc-300 overflow-hidden shrink-0 bg-transparent p-0"
                        />
                      </div>
                    </div>
                    {/* Contraste automático safeguard */}
                    <div className="bg-zinc-50 border border-zinc-200/80 p-3 rounded-xl flex items-start gap-2.5">
                      <AlertCircle className="h-4 w-4 text-davinci-gold shrink-0 mt-0.5" />
                      <p className="text-[9px] text-davinci-gray leading-relaxed font-medium">
                        <strong className="text-davinci-black block mb-0.5">Contraste Automático Ativo</strong>
                        Para garantir a melhor experiência de leitura para seus clientes, o sistema calcula o contraste WCAG das cores escolhidas e ajusta automaticamente a legibilidade de botões e textos, prevenindo que fiquem invisíveis ou difíceis de ler.
                      </p>
                    </div>
                  </div>

                  {/* Logo do Estabelecimento */}
                  <div className="space-y-3 pt-2">
                    <label className="block text-[10px] font-bold text-davinci-gray uppercase tracking-wider flex items-center gap-1.5">
                      <Image className="h-3.5 w-3.5 text-davinci-gold" />
                      Logo do Estabelecimento
                    </label>
                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-zinc-50/50 border border-zinc-200/60 p-4 rounded-xl">
                      {/* Logo Preview Container */}
                      <div className="relative group shrink-0">
                        {logoSrc ? (
                          <img
                            src={logoSrc}
                            alt="Logo do Estabelecimento"
                            className="h-16 w-16 rounded-xl object-contain border border-zinc-200 bg-white p-1 shadow-sm"
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 text-[9px] text-zinc-400 font-semibold text-center leading-tight p-1">
                            Sem Logo
                          </div>
                        )}
                      </div>

                      {/* Controls and upload status */}
                      <div className="flex-1 text-center sm:text-left space-y-1.5">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <label className="px-3 py-1.5 bg-davinci-gold hover:bg-davinci-gold-dark text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm">
                            <Upload className="h-3.5 w-3.5" />
                            {uploadingLogo ? 'Carregando...' : 'Enviar Nova Logo'}
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingLogo}
                              onChange={handleLogoUpload}
                              className="hidden"
                            />
                          </label>
                          {formData.logoUrl && (
                            <button
                              type="button"
                              onClick={handleRemoveLogo}
                              className="px-3 py-1.5 border border-zinc-200 text-red-500 hover:bg-red-50 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              Remover Logo
                            </button>
                          )}
                        </div>
                        <p className="text-[9px] text-davinci-gray font-medium leading-none">
                          JPG, PNG, GIF ou WEBP. Tamanho máximo recomendado de 2MB.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-davinci-gray uppercase tracking-wider flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5 text-davinci-gold" />
                      Página Inicial do Subdomínio (ao acessar a raiz &quot;/&quot;)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'login', label: '🔐 Tela de Login', desc: 'Exibe o formulário de acesso ao sistema' },
                        { value: 'catalogo', label: '📅 Catálogo', desc: 'Exibe a página pública de agendamento' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, rootRedirect: opt.value })}
                          className={`flex flex-col items-start gap-1 p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                            formData.rootRedirect === opt.value
                              ? 'border-davinci-gold bg-amber-50/60 shadow-[0_0_0_3px_rgba(197,168,128,0.12)]'
                              : 'border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50/80'
                          }`}
                        >
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${formData.rootRedirect === opt.value ? 'text-davinci-gold' : 'text-davinci-black'}`}>
                            {opt.label}
                          </span>
                          <span className="text-[9px] text-davinci-gray font-medium leading-tight">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSettingsTab === 'chatbot' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                    <Sparkles className="h-4 w-4 text-davinci-gold" />
                    <h5 className="text-[11px] font-bold text-davinci-black uppercase tracking-wider">Instruções do Chatbot de IA</h5>
                  </div>
                  <p className="text-[10px] text-davinci-gray leading-relaxed font-medium">
                    Personalize as regras de atendimento da IA no WhatsApp (ex: tom de voz, política de cancelamento, regras exclusivas ou detalhes de estacionamento). A IA respeitará o escopo do salão e as regras fixas de segurança.
                  </p>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-davinci-gray uppercase tracking-wider">Instruções Personalizadas (Máx. 1000 caracteres)</label>
                    <textarea
                      value={formData.chatbotPrompt}
                      onChange={(e) => setFormData({ ...formData, chatbotPrompt: e.target.value.slice(0, 1000) })}
                      rows={6}
                      className="w-full px-4 py-2.5 bg-background border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-davinci-gold transition resize-none font-medium text-zinc-855 placeholder-zinc-400"
                      placeholder="Ex: Trate todos com simpatia usando gírias locais. Mencione que temos café e cerveja cortesia. Avise que toleramos apenas 15 minutos de atraso."
                    />
                    <span className="text-[9px] text-zinc-400 font-bold block text-right mt-1">
                      {formData.chatbotPrompt.length} / 1000 caracteres
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeSettingsTab === 'footer' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="space-y-5">
                  <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                    <Globe className="h-4 w-4 text-davinci-gold" />
                    <span className="text-[11px] font-bold text-davinci-black uppercase tracking-wider">Rodapé e Contatos</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-davinci-gray uppercase tracking-wider">Slogan Institucional</label>
                    <input
                      type="text"
                      value={formData.footerSlogan}
                      onChange={(e) => setFormData({ ...formData, footerSlogan: e.target.value })}
                      className="w-full px-4 py-2.5 bg-background border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-davinci-gold transition"
                      placeholder="Ex: O melhor corte de cabelo e barba com atendimento premium."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-davinci-gray uppercase tracking-wider flex items-center gap-1">
                        <Instagram className="h-3.5 w-3.5 text-pink-600" />
                        Instagram
                      </label>
                      <input
                        type="text"
                        value={formData.footerInstagram}
                        onChange={(e) => setFormData({ ...formData, footerInstagram: e.target.value })}
                        className="w-full px-3 py-2.5 bg-background border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-davinci-gold transition"
                        placeholder="Ex: @barbearia_premium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-davinci-gray uppercase tracking-wider flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-emerald-600" />
                        WhatsApp
                      </label>
                      <input
                        type="text"
                        value={formData.footerWhatsapp}
                        onChange={(e) => setFormData({ ...formData, footerWhatsapp: e.target.value })}
                        className="w-full px-3 py-2.5 bg-background border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-davinci-gold transition"
                        placeholder="Ex: 5511999999999"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-davinci-gray uppercase tracking-wider flex items-center gap-1">
                        <Facebook className="h-3.5 w-3.5 text-blue-600" />
                        Facebook
                      </label>
                      <input
                        type="text"
                        value={formData.footerFacebook}
                        onChange={(e) => setFormData({ ...formData, footerFacebook: e.target.value })}
                        className="w-full px-3 py-2.5 bg-background border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-davinci-gold transition"
                        placeholder="Ex: barbeariapremium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-davinci-gray uppercase tracking-wider flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                      Horário de Funcionamento
                    </label>
                    <textarea
                      value={formData.footerHours}
                      onChange={(e) => setFormData({ ...formData, footerHours: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-background border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-davinci-gold transition resize-none"
                      placeholder={"Ex: Segunda a Sexta: 9h às 20h\nSábado: 9h às 18h\nDomingo: Fechado"}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-davinci-gray uppercase tracking-wider flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-davinci-gold" />
                        Telefone Geral
                      </label>
                      <input
                        type="text"
                        value={formData.footerPhone}
                        onChange={(e) => setFormData({ ...formData, footerPhone: e.target.value })}
                        className="w-full px-3 py-2.5 bg-background border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-davinci-gold transition"
                        placeholder="Ex: (11) 4567-8901"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-davinci-gray uppercase tracking-wider flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5 text-davinci-gold" />
                        E-mail de Contato
                      </label>
                      <input
                        type="email"
                        value={formData.footerEmail}
                        onChange={(e) => setFormData({ ...formData, footerEmail: e.target.value })}
                        className="w-full px-3 py-2.5 bg-background border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-davinci-gold transition"
                        placeholder="Ex: contato@estabelecimento.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-davinci-gray uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-rose-500" />
                      Endereço Físico (clicável → Google Maps)
                    </label>
                    <input
                      type="text"
                      value={formData.footerAddress}
                      onChange={(e) => setFormData({ ...formData, footerAddress: e.target.value })}
                      className="w-full px-4 py-2.5 bg-background border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-davinci-gold transition"
                      placeholder="Ex: Av. Paulista, 1000 - Bela Vista, São Paulo - SP"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-davinci-gray uppercase tracking-wider">Texto de Copyright</label>
                    <input
                      type="text"
                      value={formData.footerCopyright}
                      onChange={(e) => setFormData({ ...formData, footerCopyright: e.target.value })}
                      className="w-full px-4 py-2.5 bg-background border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-davinci-gold transition"
                      placeholder="Ex: © 2026 Estabelecimento. Todos os direitos reservados."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-davinci-gray uppercase tracking-wider">Créditos de Desenvolvimento (Opcional)</label>
                    <input
                      type="text"
                      value={formData.footerPoweredBy}
                      onChange={(e) => setFormData({ ...formData, footerPoweredBy: e.target.value })}
                      className="w-full px-4 py-2.5 bg-background border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-davinci-gold transition"
                      placeholder="Ex: Powered by MinhaMarca (deixe vazio para ocultar)"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSettingsTab === 'gateway' && tenant?.subscriptionModuleEnabled && (
              <div className="space-y-6 animate-fadeIn">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                    <CreditCard className="h-4 w-4 text-davinci-gold" />
                    <h5 className="text-[11px] font-bold text-davinci-black uppercase tracking-wider">Gateway de Pagamentos</h5>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-davinci-gray uppercase tracking-wider">Provedor de Pagamento</label>
                    <select
                      value={formData.gatewayProvider}
                      onChange={(e) => setFormData({ ...formData, gatewayProvider: e.target.value })}
                      className="w-full px-4 py-2.5 bg-background border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-davinci-gold transition"
                    >
                      <option value="SIMULADO">Apenas Simulação (Demo)</option>
                      <option value="ASAAS">Asaas (Produção ou Sandbox)</option>
                    </select>
                  </div>
                  {formData.gatewayProvider === 'ASAAS' && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-davinci-gray uppercase tracking-wider">Asaas API Key</label>
                        <input
                          type="password"
                          value={formData.gatewayApiKey}
                          onChange={(e) => setFormData({ ...formData, gatewayApiKey: e.target.value })}
                          className="w-full px-4 py-2.5 bg-background border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-davinci-gold transition"
                          placeholder="Ex: $aae.xxxx..."
                        />
                        <span className="text-[10px] text-davinci-gray leading-normal block">
                          Chaves de produção começam com <code>$aae.</code>. O sistema detecta automaticamente o ambiente.
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-davinci-gray uppercase tracking-wider">Webhook Token / Secret (Opcional)</label>
                        <input
                          type="password"
                          value={formData.gatewayWebhookSecret}
                          onChange={(e) => setFormData({ ...formData, gatewayWebhookSecret: e.target.value })}
                          className="w-full px-4 py-2.5 bg-background border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-davinci-gold transition"
                          placeholder="Token de validação configurado no Asaas"
                        />
                      </div>
                      {tenant?.id && (
                        <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-xl space-y-1 text-[10px] text-davinci-gray">
                          <span className="font-bold text-davinci-black block">URL de Webhook para cadastrar no Asaas:</span>
                          <code className="block p-1.5 bg-zinc-200/60 rounded text-[9px] break-all select-all font-mono">
                            {`${typeof window !== 'undefined' ? window.location.origin.replace(':3000', ':5001') : 'http://localhost:5001'}/subscriptions/webhook/${tenant.id}`}
                          </code>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-zinc-100 bg-background flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-davinci-gold hover:bg-davinci-gold-dark text-white font-bold px-6 py-2.5 rounded-xl text-xs transition duration-200 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar Alterações
            </button>
          </div>
        </form>

        {/* ── Live Footer Preview ────────────────────────────── */}
        <div className="space-y-4">
          <span className="block text-[10px] font-bold text-davinci-gray uppercase tracking-wider">Pré-visualização do Rodapé</span>
          <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden p-1">
            <div className="border border-dashed border-zinc-200 bg-background rounded-xl p-6 min-h-[300px] flex flex-col justify-end">
              <span className="text-[9px] uppercase tracking-widest font-bold text-davinci-gray mb-4 block text-center border-b border-zinc-200/60 pb-2">
                Demonstração Pública no Site
              </span>

              <footer
                style={{ backgroundColor: bgColor }}
                className="w-full rounded-xl text-white p-8 text-xs select-none transition-all duration-300 shadow-xl border border-zinc-800"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-zinc-800">
                  <div className="space-y-4">
                    {logoSrc ? (
                      <div className="h-24 w-24 rounded-2xl p-1 flex items-center justify-center overflow-hidden border bg-white/10 border-white/10">
                        <img src={logoSrc} alt="Logo" className="h-full w-full object-contain" />
                      </div>
                    ) : (
                      <div
                        className="h-24 w-24 rounded-2xl flex items-center justify-center text-3xl font-bold border border-white/10"
                        style={{ backgroundColor: activeColor, color: bgColor }}
                      >
                        {tenant?.name?.charAt(0).toUpperCase() || 'E'}
                      </div>
                    )}
                    <p className="text-zinc-400 leading-relaxed font-light">
                      {formData.footerSlogan || 'Slogan ou descrição curta do estabelecimento.'}
                    </p>
                    <div className="flex items-center gap-3">
                      {formData.footerInstagram && (
                        <a href={`https://instagram.com/${formData.footerInstagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                          className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition border border-zinc-700"
                          style={{ color: activeColor }}>
                          <Instagram className="h-4 w-4" />
                        </a>
                      )}
                      {formData.footerWhatsapp && (
                        <a href={getWhatsAppLink(formData.footerWhatsapp)} target="_blank" rel="noopener noreferrer"
                          className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition border border-zinc-700"
                          style={{ color: activeColor }}>
                          <Phone className="h-4 w-4" />
                        </a>
                      )}
                      {formData.footerFacebook && (
                        <a href={`https://facebook.com/${formData.footerFacebook}`} target="_blank" rel="noopener noreferrer"
                          className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition border border-zinc-700"
                          style={{ color: activeColor }}>
                          <Facebook className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 md:pl-4">
                    <h5 className="font-bold uppercase tracking-widest text-[10px] text-zinc-400">Funcionamento</h5>
                    {formData.footerHours ? (
                      <div className="text-zinc-300 space-y-1 whitespace-pre-line font-light">{formData.footerHours}</div>
                    ) : (
                      <p className="text-zinc-500 italic">Horários não cadastrados.</p>
                    )}
                  </div>

                  <div className="space-y-4 md:pl-4">
                    <h5 className="font-bold uppercase tracking-widest text-[10px] text-zinc-400">Contatos e Local</h5>
                    <ul className="space-y-2.5 font-light text-zinc-300">
                      {formData.footerAddress && (
                        <li>
                          <a href={getMapsLink(formData.footerAddress)} target="_blank" rel="noopener noreferrer"
                            className="flex items-start gap-2 hover:text-white transition group">
                            <MapPin className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform" style={{ color: activeColor }} />
                            <span className="hover:underline text-left leading-normal">{formData.footerAddress}</span>
                          </a>
                        </li>
                      )}
                      {formData.footerPhone && (
                        <li>
                          <a href={`tel:${getCleanNumber(formData.footerPhone)}`}
                            className="flex items-center gap-2 hover:text-white transition group">
                            <Phone className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform" style={{ color: activeColor }} />
                            <span className="hover:underline">{formData.footerPhone}</span>
                          </a>
                        </li>
                      )}
                      {formData.footerWhatsapp && (
                        <li>
                          <a href={getWhatsAppLink(formData.footerWhatsapp)} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 hover:text-white transition group">
                            <Phone className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform" style={{ color: activeColor }} />
                            <span className="hover:underline flex items-center gap-1">
                              WhatsApp <ExternalLink className="h-3 w-3 opacity-60" />
                            </span>
                          </a>
                        </li>
                      )}
                      {formData.footerEmail && (
                        <li>
                          <a href={`mailto:${formData.footerEmail}`}
                            className="flex items-center gap-2 hover:text-white transition group">
                            <Mail className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform" style={{ color: activeColor }} />
                            <span className="hover:underline truncate">{formData.footerEmail}</span>
                          </a>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-zinc-500 font-light">
                  <span>{formData.footerCopyright || `© ${new Date().getFullYear()} ${tenant?.name || 'Estabelecimento'}. Todos os direitos reservados.`}</span>
                  <span>{formData.footerPoweredBy || 'Desenvolvido por VTRX Solutions'}</span>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
