'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Scissors, ShoppingBag, Clock, DollarSign, Phone, MapPin, MessageSquare, Calendar, ChevronRight, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CatalogoPublicoPage() {
  const [activeTab, setActiveTab] = useState<'services' | 'products'>('services');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

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
    const phone = '5511999999999';

    const text = isService
      ? `Olá! Gostaria de agendar o serviço "${selectedItem.nome}" (R$ ${selectedItem.preco.toFixed(2)}).`
      : `Olá! Tenho interesse no produto "${selectedItem.nome}" (R$ ${selectedItem.preco.toFixed(2)}).`;

    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
    handleCloseModal();
  };

  // Portal redirection
  const handlePortalAction = () => {
    window.location.href = '/login';
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
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-davinci-gold" />
              <span>Endereço do estabelecimento</span>
            </div>
            <div className="hidden sm:block text-zinc-300">|</div>
            <div className="flex items-center gap-1.5">
              <Phone className="h-4 w-4 text-davinci-gold" />
              <span>(00) 00000-0000</span>
            </div>
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
    </div>
  );
}
