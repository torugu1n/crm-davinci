'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { getLogoUrl } from '@/lib/logo-helper';
import {
  Building,
  Instagram,
  Facebook,
  Phone,
  Mail,
  MapPin,
  Clock,
  Copyright,
  Sparkles,
  Save,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export default function SettingsManager() {
  const token = useStore((state) => state.token);
  const tenant = useStore((state) => state.tenant);
  const setTenant = useStore((state) => state.setTenant);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Form State
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
  });

  // Sync state with tenant data from store
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
      });
    }
  }, [tenant]);

  // Clean social/contact URLs and WhatsApp links
  const getCleanNumber = (num: string) => num.replace(/\D/g, '');

  const getWhatsAppLink = (input: string) => {
    if (!input) return '';
    const clean = getCleanNumber(input);
    if (!clean) return input;
    // Add Brazil country code (55) if length suggests local number (10 or 11 digits)
    if (clean.length === 10 || clean.length === 11) {
      return `https://wa.me/55${clean}`;
    }
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
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Erro ao atualizar configurações do rodapé');
      }

      // Update state in Zustand store
      setTenant(data);
      setSuccess('Configurações do rodapé salvas com sucesso!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const logoSrc = tenant?.logoUrl ? getLogoUrl(tenant.logoUrl) : null;
  const activeColor = tenant?.primaryColor || '#C5A880';
  const bgColor = tenant?.secondaryColor || '#18181b';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Description header */}
      <div className="bg-white border border-zinc-200/80 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-davinci-black uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-davinci-gold" />
            Personalização do Rodapé e Contatos
          </h3>
          <p className="text-xs text-davinci-gray leading-relaxed max-w-2xl">
            Configure as informações que aparecem no rodapé do seu site de agendamento (/catalogo) e da tela de login (/login).
            O design adapta-se automaticamente à identidade visual da sua marca de forma responsiva.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* Settings Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
            <h4 className="text-xs font-bold text-davinci-black uppercase tracking-widest">Campos do Rodapé</h4>
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

          <div className="p-6 space-y-5">
            {/* Slogan */}
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

            {/* Socials Grid */}
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

            {/* Operating Hours */}
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
                placeholder="Ex: Segunda a Sexta: 9h às 20h&#10;Sábado: 9h às 18h&#10;Domingo: Fechado"
              />
            </div>

            {/* Contact Grid */}
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

            {/* Address */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-davinci-gray uppercase tracking-wider flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-rose-500" />
                Endereço Físico (será clicável redirecionando para o Maps)
              </label>
              <input
                type="text"
                value={formData.footerAddress}
                onChange={(e) => setFormData({ ...formData, footerAddress: e.target.value })}
                className="w-full px-4 py-2.5 bg-background border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-davinci-gold transition"
                placeholder="Ex: Av. Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100"
              />
            </div>

            {/* Credits Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-davinci-gray uppercase tracking-wider flex items-center gap-1">
                  <Copyright className="h-3.5 w-3.5 text-zinc-500" />
                  Texto de Direitos Reservados (Copyright)
                </label>
                <input
                  type="text"
                  value={formData.footerCopyright}
                  onChange={(e) => setFormData({ ...formData, footerCopyright: e.target.value })}
                  className="w-full px-3 py-2.5 bg-background border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-davinci-gold transition"
                  placeholder="Ex: © 2026 Estabelecimento. Todos os direitos reservados."
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-davinci-gray uppercase tracking-wider flex items-center gap-1">
                  <Building className="h-3.5 w-3.5 text-zinc-500" />
                  Texto de Atribuição (Powered By)
                </label>
                <input
                  type="text"
                  value={formData.footerPoweredBy}
                  onChange={(e) => setFormData({ ...formData, footerPoweredBy: e.target.value })}
                  className="w-full px-3 py-2.5 bg-background border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-davinci-gold transition"
                  placeholder="Ex: Desenvolvido por Vtec Solutions"
                />
              </div>
            </div>
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

        {/* Live Preview Panel */}
        <div className="space-y-4">
          <span className="block text-[10px] font-bold text-davinci-gray uppercase tracking-wider">Pré-visualização do Rodapé</span>
          <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden p-1">
            <div className="border border-dashed border-zinc-200 bg-background rounded-xl p-6 min-h-[300px] flex flex-col justify-end">
              <span className="text-[9px] uppercase tracking-widest font-bold text-davinci-gray mb-4 block text-center border-b border-zinc-200/60 pb-2">
                Demonstração Pública no Site
              </span>

              {/* Dynamic Footer Layout */}
              <footer
                style={{ backgroundColor: bgColor }}
                className="w-full rounded-xl text-white p-8 text-xs select-none transition-all duration-300 shadow-xl border border-zinc-800"
              >
                {/* Upper Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-zinc-800">
                  {/* Brand Column */}
                  <div className="space-y-4">
                    {logoSrc ? (
                      <img
                        src={logoSrc}
                        alt="Logo"
                        className="h-10 w-auto object-contain max-w-[150px] filter brightness-100"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <div
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: activeColor, color: bgColor }}
                        >
                          {tenant?.name?.charAt(0).toUpperCase() || 'E'}
                        </div>
                        <span className="font-bold text-sm font-outfit uppercase tracking-wider">{tenant?.name || 'Estabelecimento'}</span>
                      </div>
                    )}
                    <p className="text-zinc-400 leading-relaxed font-light">
                      {formData.footerSlogan || 'Slogan ou descrição curta do estabelecimento.'}
                    </p>
                    {/* Social links */}
                    <div className="flex items-center gap-3">
                      {formData.footerInstagram && (
                        <a
                          href={`https://instagram.com/${formData.footerInstagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition border border-zinc-700 hover:border-white"
                          style={{ color: activeColor }}
                        >
                          <Instagram className="h-4 w-4" />
                        </a>
                      )}
                      {formData.footerWhatsapp && (
                        <a
                          href={getWhatsAppLink(formData.footerWhatsapp)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition border border-zinc-700 hover:border-white"
                          style={{ color: activeColor }}
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                      )}
                      {formData.footerFacebook && (
                        <a
                          href={`https://facebook.com/${formData.footerFacebook}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition border border-zinc-700 hover:border-white"
                          style={{ color: activeColor }}
                        >
                          <Facebook className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Hours Column */}
                  <div className="space-y-4 md:pl-4">
                    <h5 className="font-bold uppercase tracking-widest text-[10px] text-zinc-400">Funcionamento</h5>
                    {formData.footerHours ? (
                      <div className="text-zinc-300 space-y-1 whitespace-pre-line font-light">
                        {formData.footerHours}
                      </div>
                    ) : (
                      <p className="text-zinc-500 italic">Horários não cadastrados.</p>
                    )}
                  </div>

                  {/* Contact/Address Column */}
                  <div className="space-y-4 md:pl-4">
                    <h5 className="font-bold uppercase tracking-widest text-[10px] text-zinc-400">Contatos e Local</h5>
                    <ul className="space-y-2.5 font-light text-zinc-300">
                      {formData.footerAddress && (
                        <li>
                          <a
                            href={getMapsLink(formData.footerAddress)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-2 hover:text-white transition group"
                          >
                            <MapPin className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform" style={{ color: activeColor }} />
                            <span className="hover:underline text-left leading-normal">{formData.footerAddress}</span>
                          </a>
                        </li>
                      )}
                      {formData.footerPhone && (
                        <li>
                          <a
                            href={`tel:${getCleanNumber(formData.footerPhone)}`}
                            className="flex items-center gap-2 hover:text-white transition group"
                          >
                            <Phone className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform" style={{ color: activeColor }} />
                            <span className="hover:underline">{formData.footerPhone}</span>
                          </a>
                        </li>
                      )}
                      {formData.footerWhatsapp && (
                        <li>
                          <a
                            href={getWhatsAppLink(formData.footerWhatsapp)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 hover:text-white transition group"
                          >
                            <Phone className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform" style={{ color: activeColor }} />
                            <span className="hover:underline flex items-center gap-1">
                              WhatsApp <ExternalLink className="h-3 w-3 opacity-60" />
                            </span>
                          </a>
                        </li>
                      )}
                      {formData.footerEmail && (
                        <li>
                          <a
                            href={`mailto:${formData.footerEmail}`}
                            className="flex items-center gap-2 hover:text-white transition group"
                          >
                            <Mail className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform" style={{ color: activeColor }} />
                            <span className="hover:underline truncate">{formData.footerEmail}</span>
                          </a>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Bottom Section */}
                <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-zinc-500 font-light">
                  <span>{formData.footerCopyright || `© ${new Date().getFullYear()} ${tenant?.name || 'Estabelecimento'}. Todos os direitos reservados.`}</span>
                  <span className="flex items-center gap-1">
                    {formData.footerPoweredBy || 'Powered by DaVinci'}
                  </span>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
