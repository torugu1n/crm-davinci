'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Scissors, ShoppingBag, Clock, DollarSign, Phone, MapPin, MessageSquare, Calendar, ChevronRight, X, Sparkles, Instagram, Facebook, Mail, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { getLogoUrl } from '@/lib/logo-helper';

export default function CatalogoPublicoPage() {
  const [activeTab, setActiveTab] = useState<'services' | 'products'>('services');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
  const tenant = useStore((state) => state.tenant);

  const getLuminance = (hex?: string | null) => {
    if (!hex) return 0;
    const cleanHex = hex.replace('#', '').trim();
    if (cleanHex.length !== 6) return 0.5;
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
    const a = [r, g, b].map((v) => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };

  const secondaryColor = tenant?.secondaryColor || '#18181b';
  const footerBg = secondaryColor;
  const isLightFooter = getLuminance(footerBg) > 0.5;

  const footerTextClass = isLightFooter ? 'text-zinc-600' : 'text-zinc-400';
  const footerHeadingClass = isLightFooter ? 'text-zinc-800' : 'text-zinc-400';
  const footerSubtextClass = isLightFooter ? 'text-zinc-700' : 'text-zinc-300';
  const footerBorderClass = isLightFooter ? 'border-zinc-200' : 'border-zinc-800';
  const footerLinkClass = isLightFooter ? 'text-zinc-700 hover:text-black' : 'text-zinc-300 hover:text-white';
  const footerSocialBtnClass = isLightFooter 
    ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 hover:border-zinc-400 text-zinc-850' 
    : 'bg-zinc-850 hover:bg-zinc-700 border-zinc-700 hover:border-white text-zinc-300';

  // Fetch services and products
  const { data: services = [], isLoading: isLoadingServices } = useQuery({
    queryKey: ['services'],
    queryFn: () => fetch(`${apiUrl}/services`).then((res) => { if (!res.ok) throw new Error('Failed to fetch services'); return res.json(); }),
  });

  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => fetch(`${apiUrl}/products`).then((res) => { if (!res.ok) throw new Error('Failed to fetch products'); return res.json(); }),
  });

  const handleOpenActionModal = (item: any) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setIsModalOpen(false);
  };

  // WhatsApp click handler
  const handleWhatsAppAction = () => {
    if (!selectedItem) return;
    const isService = 'duracao' in selectedItem;
    
    // Clean and retrieve phone number from tenant config or use default fallback
    const tenantPhone = tenant?.footerWhatsapp || tenant?.footerPhone || '5511999999999';
    const cleanPhone = tenantPhone.replace(/\D/g, '');
    
    // Prefix Brazil country code if not present and is local number length
    const finalPhone = (cleanPhone.length === 10 || cleanPhone.length === 11) 
      ? `55${cleanPhone}` 
      : cleanPhone;

    const text = isService
      ? `Olá! Gostaria de agendar o serviço "${selectedItem.nome}" (R$ ${selectedItem.preco.toFixed(2)}).`
      : `Olá! Tenho interesse no produto "${selectedItem.nome}" (R$ ${selectedItem.preco.toFixed(2)}).`;

    const waUrl = `https://wa.me/${finalPhone}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
    handleCloseModal();
  };

  // Portal redirection — passa o serviceId para o login pre-selecionar após OTP
  const handlePortalAction = () => {
    const isService = selectedItem && 'duracao' in selectedItem;
    const query = isService && selectedItem?.id ? `?serviceId=${selectedItem.id}` : '';
    window.location.href = `/login${query}`;
  };

  const getMainDomainLoginUrl = () => {
    if (typeof window === 'undefined') return '/login';
    const host = window.location.host;
    const protocol = window.location.protocol;
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      const port = window.location.port ? `:${window.location.port}` : '';
      return `${protocol}//venusta.localhost${port}/login`;
    }
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'appvenusta.com.br';
    return `${protocol}//venusta.${baseDomain}/login`;
  };

  const isLoading = activeTab === 'services' ? isLoadingServices : isLoadingProducts;
  const items = activeTab === 'services' ? services : products;

  return (
    <div id="catalog-root" className="min-h-screen bg-[#FDFBF9] text-[#1C1917] font-sans pb-16">

      <div className="relative overflow-hidden bg-white border-b border-zinc-200/60 py-16 px-6 text-center">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-davinci-gold/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-davinci-gold/10 border border-davinci-gold/20 text-davinci-gold text-[10px] font-bold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            Catálogo Online
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-davinci-black tracking-tight text-glow uppercase">
            Serviços e Produtos
          </h1>
          <p className="text-xs sm:text-sm text-davinci-gray font-medium max-w-md mx-auto">
            Explore os serviços e produtos disponíveis e escolha a melhor forma de seguir com seu atendimento.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 text-[11px] text-davinci-gray font-semibold">
            {tenant?.footerAddress && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tenant.footerAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-davinci-black transition-colors"
              >
                <MapPin className="h-4 w-4 text-davinci-gold" />
                <span>{tenant.footerAddress}</span>
              </a>
            )}
            {tenant?.footerAddress && tenant?.footerPhone && (
              <div className="hidden sm:block text-zinc-300">|</div>
            )}
            {tenant?.footerPhone && (
              <a
                href={`tel:${tenant.footerPhone.replace(/\D/g, '')}`}
                className="flex items-center gap-1.5 hover:text-davinci-black transition-colors"
              >
                <Phone className="h-4 w-4 text-davinci-gold" />
                <span>{tenant.footerPhone}</span>
              </a>
            )}
            {!tenant?.footerAddress && !tenant?.footerPhone && (
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-davinci-gold" />
                <span>Seja bem-vindo(a) ao nosso catálogo!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Tab Controls */}
      <div className="max-w-4xl mx-auto px-4 mt-10">
        <div className="flex justify-center bg-white p-1 rounded-xl border border-zinc-200/80 shadow-sm max-w-xs mx-auto mb-8">
          <button
            onClick={() => setActiveTab('services')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'services'
                ? 'bg-davinci-gold/15 text-davinci-gold shadow-sm font-bold border border-davinci-gold/10'
                : 'text-davinci-gray hover:text-davinci-black'
              }`}
          >
            <Scissors className="h-4 w-4" />
            Serviços
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'products'
                ? 'bg-davinci-gold/15 text-davinci-gold shadow-sm font-bold border border-davinci-gold/10'
                : 'text-davinci-gray hover:text-davinci-black'
              }`}
          >
            <ShoppingBag className="h-4 w-4" />
            Produtos
          </button>
        </div>

        {/* Dynamic List Section */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 border-2 border-davinci-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-zinc-200/80 shadow-sm p-6 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-davinci-gold/10 border border-davinci-gold/20 flex items-center justify-center mx-auto mb-4">
              {activeTab === 'services' ? (
                <Scissors className="h-5 w-5 text-davinci-gold" />
              ) : (
                <ShoppingBag className="h-5 w-5 text-davinci-gold" />
              )}
            </div>
            <h3 className="text-sm font-bold text-davinci-black mb-1">
              Catálogo indisponível
            </h3>
            <p className="text-xs text-davinci-gray">
              Não existem itens cadastrados nesta seção no momento. Por favor, retorne mais tarde.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.map((item: any) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                key={item.id}
                className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-md flex flex-col justify-between hover:border-davinci-gold/60 hover:shadow-lg transition-all duration-300 relative group overflow-hidden"
              >
                {/* Gold Gradient Top Bar Accent */}
                <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-davinci-gold/40 to-davinci-gold" />

                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-bold text-sm sm:text-md text-davinci-black">
                      {item.nome}
                    </h3>
                    <div className="flex items-center gap-0.5 text-davinci-gold font-extrabold text-sm sm:text-md whitespace-nowrap bg-davinci-gold/5 px-2.5 py-1 rounded-lg border border-davinci-gold/10">
                      <span>R$ {item.preco.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-zinc-100 pt-4 mt-6">
                  {activeTab === 'services' && 'duracao' in item ? (
                    <div className="flex items-center gap-1.5 text-[10px] text-davinci-gray font-bold bg-zinc-100 px-3 py-1 rounded-full">
                      <Clock className="h-3.5 w-3.5 text-davinci-gold" />
                      <span>{item.duracao} minutos</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                      <span>Pronta Entrega</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleOpenActionModal(item)}
                    className="flex items-center gap-1 text-[11px] font-bold text-davinci-black hover:text-davinci-gold transition-colors duration-200 cursor-pointer"
                  >
                    <span>{activeTab === 'services' ? 'Agendar Horário' : 'Quero Comprar'}</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Action Choice Modal */}
      <AnimatePresence>
        {isModalOpen && selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Modal Panel */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-2xl border border-zinc-200/80 shadow-2xl p-6 relative z-10 text-center"
            >
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 p-1 rounded-full text-davinci-gray hover:text-davinci-black hover:bg-zinc-100 transition-all cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              <div className="w-12 h-12 rounded-full bg-davinci-gold/10 border border-davinci-gold/20 flex items-center justify-center mx-auto mb-4">
                {activeTab === 'services' ? (
                  <Calendar className="h-6 w-6 text-davinci-gold" />
                ) : (
                  <ShoppingBag className="h-6 w-6 text-davinci-gold" />
                )}
              </div>

              <h3 className="font-bold text-davinci-black text-sm mb-1">
                {activeTab === 'services' ? 'Agendar Serviço' : 'Adquirir Produto'}
              </h3>
              <p className="text-xs text-davinci-gray mb-6">
                Você escolheu <strong className="text-davinci-black">{selectedItem.nome}</strong> por <strong className="text-davinci-gold">R$ {selectedItem.preco.toFixed(2)}</strong>. Como gostaria de prosseguir?
              </p>

              <div className="space-y-3">
                {/* WhatsApp Button */}
                <button
                  onClick={handleWhatsAppAction}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                >
                  <MessageSquare className="h-4.5 w-4.5" />
                  Agendar / Comprar via WhatsApp
                </button>

                {/* Portal scheduling for clients */}
                {activeTab === 'services' && (
                  <button
                    onClick={handlePortalAction}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border border-zinc-200/85 hover:border-davinci-gold/50 text-davinci-black font-semibold text-xs rounded-xl transition-all hover:bg-zinc-50 active:scale-[0.98] cursor-pointer"
                  >
                    <Calendar className="h-4.5 w-4.5 text-davinci-gold" />
                    Entrar no Portal & Agendar Online
                  </button>
                )}

                <button
                  onClick={handleCloseModal}
                  className="w-full py-2 text-[10px] font-bold text-davinci-gray hover:text-davinci-black transition-colors"
                >
                  Voltar ao Catálogo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer
        style={{ backgroundColor: footerBg }}
        className={`w-full ${isLightFooter ? 'text-zinc-850 border-t border-zinc-200' : 'text-white border-t border-zinc-800'} mt-16`}
      >
        <div className="max-w-6xl mx-auto px-6 py-12">
          {/* Main columns grid */}
          <div className={`grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b ${footerBorderClass}`}>
            {/* Column 1: Brand Info */}
            <div className="space-y-4">
              {tenant?.logoUrl ? (
                <div className={`h-24 w-24 rounded-2xl p-1 flex items-center justify-center overflow-hidden border ${isLightFooter ? 'bg-zinc-50 border-zinc-200' : 'bg-white/10 border-white/10'}`}>
                  <img
                    src={getLogoUrl(tenant.logoUrl)}
                    alt={tenant.name}
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : (
                <div
                  className={`h-24 w-24 rounded-2xl flex items-center justify-center text-3xl font-bold border ${isLightFooter ? 'border-zinc-200' : 'border-white/10'}`}
                  style={{ backgroundColor: tenant?.primaryColor || '#C5A880', color: tenant?.secondaryColor || '#18181b' }}
                >
                  {tenant?.name?.charAt(0).toUpperCase() || 'E'}
                </div>
              )}
              <p className={`${footerTextClass} text-xs leading-relaxed font-light`}>
                {tenant?.footerSlogan || 'Slogan ou descrição curta do seu estabelecimento.'}
              </p>
              
              {/* Social Icons */}
              <div className="flex items-center gap-3 pt-2">
                {tenant?.footerInstagram && (
                  <a
                    href={`https://instagram.com/${tenant.footerInstagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition border ${footerSocialBtnClass}`}
                    style={{ color: tenant?.primaryColor || '#C5A880' }}
                    title="Instagram"
                  >
                    <Instagram className="h-4 w-4" />
                  </a>
                )}
                {tenant?.footerWhatsapp && (
                  <a
                    href={`https://wa.me/${(tenant.footerWhatsapp.replace(/\D/g, '').length === 10 || tenant.footerWhatsapp.replace(/\D/g, '').length === 11) ? '55' + tenant.footerWhatsapp.replace(/\D/g, '') : tenant.footerWhatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition border ${footerSocialBtnClass}`}
                    style={{ color: tenant?.primaryColor || '#C5A880' }}
                    title="WhatsApp"
                  >
                    <Phone className="h-4 w-4" />
                  </a>
                )}
                {tenant?.footerFacebook && (
                  <a
                    href={`https://facebook.com/${tenant.footerFacebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition border ${footerSocialBtnClass}`}
                    style={{ color: tenant?.primaryColor || '#C5A880' }}
                    title="Facebook"
                  >
                    <Facebook className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Column 2: Hours */}
            <div className="space-y-4 md:pl-4">
              <h4 className={`text-[10px] font-bold uppercase tracking-widest ${footerHeadingClass}`}>Funcionamento</h4>
              {tenant?.footerHours ? (
                <div className={`${footerSubtextClass} text-xs space-y-1.5 whitespace-pre-line font-light leading-relaxed`}>
                  {tenant.footerHours}
                </div>
              ) : (
                <p className={`${isLightFooter ? 'text-zinc-400' : 'text-zinc-500'} text-xs italic`}>Horários não informados.</p>
              )}
            </div>

            {/* Column 3: Contact details */}
            <div className="space-y-4 md:pl-4">
              <h4 className={`text-[10px] font-bold uppercase tracking-widest ${footerHeadingClass}`}>Contatos e Local</h4>
              <ul className={`space-y-3 text-xs ${footerSubtextClass} font-light`}>
                {tenant?.footerAddress && (
                  <li>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tenant.footerAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-start gap-2 transition group ${footerLinkClass}`}
                    >
                      <MapPin className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform" style={{ color: tenant?.primaryColor || '#C5A880' }} />
                      <span className="hover:underline text-left leading-normal">{tenant.footerAddress}</span>
                    </a>
                  </li>
                )}
                {tenant?.footerPhone && (
                  <li>
                    <a
                      href={`tel:${tenant.footerPhone.replace(/\D/g, '')}`}
                      className={`flex items-center gap-2 transition group ${footerLinkClass}`}
                    >
                      <Phone className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform" style={{ color: tenant?.primaryColor || '#C5A880' }} />
                      <span className="hover:underline">{tenant.footerPhone}</span>
                    </a>
                  </li>
                )}
                {tenant?.footerEmail && (
                  <li>
                    <a
                      href={`mailto:${tenant.footerEmail}`}
                      className={`flex items-center gap-2 transition group ${footerLinkClass}`}
                    >
                      <Mail className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform" style={{ color: tenant?.primaryColor || '#C5A880' }} />
                      <span className="hover:underline truncate">{tenant.footerEmail}</span>
                    </a>
                  </li>
                )}
              </ul>
            </div>

            {/* Column 4: Quick Links */}
            <div className="space-y-4 md:pl-4">
              <h4 className={`text-[10px] font-bold uppercase tracking-widest ${footerHeadingClass}`}>Atendimento</h4>
              <ul className={`space-y-2 text-xs ${footerSubtextClass} font-light`}>
                <li>
                  <a
                    href="/login"
                    className={`hover:underline transition flex items-center gap-1.5 ${footerLinkClass}`}
                  >
                    <span>Acessar Portal do Cliente</span>
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                </li>
                 <li>
                  <a
                    href={getMainDomainLoginUrl()}
                    className={`hover:underline transition flex items-center gap-1.5 ${footerLinkClass}`}
                  >
                    <span>Área Administrativa</span>
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Lower section */}
          <div className={`pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] ${isLightFooter ? 'text-zinc-500' : 'text-zinc-500'} font-light`}>
            <span>
              {tenant?.footerCopyright || `© ${new Date().getFullYear()} ${tenant?.name || 'Estabelecimento'}. Todos os direitos reservados.`}
            </span>
            <span className="flex items-center gap-1">
              {tenant?.footerPoweredBy || 'Desenvolvido por VTRX SOLUTIONS'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
