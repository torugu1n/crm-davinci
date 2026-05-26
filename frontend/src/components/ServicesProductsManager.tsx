'use client';

import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Scissors, ShoppingBag, Plus, Edit2, Trash2, Search, Clock, DollarSign, FileText, X, AlertTriangle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function ServicesProductsManager() {
  const queryClient = useQueryClient();
  const addNotification = useStore((state) => state.addNotification);
  const token = useStore((state) => state.token);
  const [activeSubTab, setActiveSubTab] = useState<'services' | 'products'>('services');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null); // null means creating
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    nome: '',
    preco: '',
    duracao: '', // only for services
    descricao: '',
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ['products'],
      queryFn: () =>
        fetch(`${apiUrl}/products`).then((res) => {
          if (!res.ok) throw new Error('Failed to fetch products');
          return res.json();
        }),
      staleTime: 5 * 60 * 1000,
    });
  }, [apiUrl, queryClient]);

  // Fetch Services
  const { data: services = [], isLoading: isLoadingServices } = useQuery({
    queryKey: ['services'],
    queryFn: () => fetch(`${apiUrl}/services`).then((res) => { if (!res.ok) throw new Error('Failed to fetch services'); return res.json(); }),
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
  });

  // Fetch Products — lazy: only fetches when the products tab is active
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => fetch(`${apiUrl}/products`).then((res) => { if (!res.ok) throw new Error('Failed to fetch products'); return res.json(); }),
    enabled: activeSubTab === 'products',
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
  });

  // Mutations
  const createServiceMutation = useMutation({
    mutationFn: (newService: any) =>
      fetch(`${apiUrl}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newService),
      }).then((res) => {
        if (!res.ok) throw new Error('Erro ao criar serviço');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      addNotification({
        title: 'Serviço Criado',
        description: 'O serviço foi cadastrado com sucesso!',
        type: 'success',
      });
      closeModal();
    },
    onError: (err: any) => {
      addNotification({
        title: 'Erro ao Criar',
        description: err.message || 'Houve um erro ao processar sua requisição.',
        type: 'error',
      });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      fetch(`${apiUrl}/services/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }).then((res) => {
        if (!res.ok) throw new Error('Erro ao atualizar serviço');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      addNotification({
        title: 'Serviço Atualizado',
        description: 'O serviço foi atualizado com sucesso!',
        type: 'success',
      });
      closeModal();
    },
    onError: (err: any) => {
      addNotification({
        title: 'Erro ao Atualizar',
        description: err.message || 'Houve um erro ao processar sua requisição.',
        type: 'error',
      });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`${apiUrl}/services/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }).then((res) => {
        if (!res.ok) throw new Error('Erro ao excluir serviço');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      addNotification({
        title: 'Serviço Excluído',
        description: 'O serviço foi excluído do sistema.',
        type: 'success',
      });
      setIsConfirmDeleteOpen(false);
      setDeletingItem(null);
    },
    onError: (err: any) => {
      addNotification({
        title: 'Erro ao Excluir',
        description: err.message || 'Houve um erro ao processar sua requisição.',
        type: 'error',
      });
      setIsConfirmDeleteOpen(false);
    },
  });

  const createProductMutation = useMutation({
    mutationFn: (newProduct: any) =>
      fetch(`${apiUrl}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newProduct),
      }).then((res) => {
        if (!res.ok) throw new Error('Erro ao criar produto');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      addNotification({
        title: 'Produto Criado',
        description: 'O produto foi cadastrado com sucesso!',
        type: 'success',
      });
      closeModal();
    },
    onError: (err: any) => {
      addNotification({
        title: 'Erro ao Criar',
        description: err.message || 'Houve um erro ao processar sua requisição.',
        type: 'error',
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      fetch(`${apiUrl}/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }).then((res) => {
        if (!res.ok) throw new Error('Erro ao atualizar produto');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      addNotification({
        title: 'Produto Atualizado',
        description: 'O produto foi atualizado com sucesso!',
        type: 'success',
      });
      closeModal();
    },
    onError: (err: any) => {
      addNotification({
        title: 'Erro ao Atualizar',
        description: err.message || 'Houve um erro ao processar sua requisição.',
        type: 'error',
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`${apiUrl}/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }).then((res) => {
        if (!res.ok) throw new Error('Erro ao excluir produto');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      addNotification({
        title: 'Produto Excluído',
        description: 'O produto foi excluído do sistema.',
        type: 'success',
      });
      setIsConfirmDeleteOpen(false);
      setDeletingItem(null);
    },
    onError: (err: any) => {
      addNotification({
        title: 'Erro ao Excluir',
        description: err.message || 'Houve um erro ao processar sua requisição.',
        type: 'error',
      });
      setIsConfirmDeleteOpen(false);
    },
  });

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      nome: '',
      preco: '',
      duracao: activeSubTab === 'services' ? '45' : '',
      descricao: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: any) => {
    setEditingItem(item);
    setFormData({
      nome: item.nome,
      preco: item.preco.toString(),
      duracao: item.duracao ? item.duracao.toString() : '',
      descricao: item.descricao || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.preco) {
      addNotification({
        title: 'Campos Obrigatórios',
        description: 'Preencha o nome e o preço corretamente.',
        type: 'warning',
      });
      return;
    }

    const payload: any = {
      nome: formData.nome,
      preco: parseFloat(formData.preco),
      descricao: formData.descricao,
    };

    if (activeSubTab === 'services') {
      payload.duracao = parseInt(formData.duracao || '30', 10);
      if (editingItem) {
        updateServiceMutation.mutate({ id: editingItem.id, data: payload });
      } else {
        createServiceMutation.mutate(payload);
      }
    } else {
      if (editingItem) {
        updateProductMutation.mutate({ id: editingItem.id, data: payload });
      } else {
        createProductMutation.mutate(payload);
      }
    }
  };

  const handleOpenDeleteConfirm = (item: any) => {
    setDeletingItem(item);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingItem) return;
    if (activeSubTab === 'services') {
      deleteServiceMutation.mutate(deletingItem.id);
    } else {
      deleteProductMutation.mutate(deletingItem.id);
    }
  };

  // Filtering
  const filteredServices = services.filter((s: any) =>
    s.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.descricao && s.descricao.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredProducts = products.filter((p: any) =>
    p.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.descricao && p.descricao.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const isLoading = activeSubTab === 'services' ? isLoadingServices : isLoadingProducts;
  const displayItems = activeSubTab === 'services' ? filteredServices : filteredProducts;

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white p-4 rounded-xl border border-zinc-200/85 shadow-sm">
        
        {/* Tab switch inside component */}
        <div className="flex bg-zinc-100 p-1 rounded-lg border border-zinc-200">
          <button
            onClick={() => {
              setActiveSubTab('services');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeSubTab === 'services'
                ? 'bg-white text-davinci-gold shadow-sm font-bold border border-zinc-200/50'
                : 'text-davinci-gray hover:text-davinci-black'
            }`}
          >
            <Scissors className="h-3.5 w-3.5" />
            Serviços ({services.length})
          </button>
          <button
            onClick={() => {
              setActiveSubTab('products');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeSubTab === 'products'
                ? 'bg-white text-davinci-gold shadow-sm font-bold border border-zinc-200/50'
                : 'text-davinci-gray hover:text-davinci-black'
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Produtos ({products.length})
          </button>
        </div>

        {/* Search Field */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-davinci-gray" />
          <input
            type="text"
            placeholder={
              activeSubTab === 'services'
                ? 'Pesquisar serviços...'
                : 'Pesquisar produtos...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-davinci-black focus:outline-none focus:border-davinci-gold text-xs"
          />
        </div>

        {/* Add Button */}
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gold-gradient text-davinci-black font-bold text-xs rounded-lg transition-all shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer border border-davinci-gold/20"
        >
          <Plus className="h-4 w-4" />
          Adicionar {activeSubTab === 'services' ? 'Serviço' : 'Produto'}
        </button>
      </div>

      {/* Grid List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-xl border border-zinc-200/80 shadow-sm">
          <div className="h-8 w-8 border-2 border-davinci-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : displayItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-zinc-200/80 shadow-sm flex flex-col items-center justify-center p-6">
          <div className="w-12 h-12 rounded-full bg-davinci-gold/10 border border-davinci-gold/20 flex items-center justify-center mb-4">
            {activeSubTab === 'services' ? (
              <Scissors className="h-6 w-6 text-davinci-gold" />
            ) : (
              <ShoppingBag className="h-6 w-6 text-davinci-gold" />
            )}
          </div>
          <h3 className="text-sm font-bold text-davinci-black mb-1">
            Nenhum item cadastrado
          </h3>
          <p className="text-xs text-davinci-gray max-w-sm mb-4">
            {searchQuery
              ? 'Nenhum resultado corresponde à sua pesquisa.'
              : activeSubTab === 'services'
              ? 'Cadastre os serviços oferecidos pela sua barbearia/salão para habilitar agendamentos.'
              : 'Cadastre os produtos vendidos no estabelecimento (óleos, pomadas, perfumes, etc.)'}
          </p>
          <button
            onClick={handleOpenAddModal}
            className="text-xs font-bold text-davinci-gold hover:underline cursor-pointer"
          >
            Cadastrar primeiro item agora &rarr;
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayItems.map((item: any) => (
            <motion.div
              layout
              key={item.id}
              className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-md flex flex-col justify-between hover:border-davinci-gold/50 hover:shadow-lg transition-all duration-300 relative group overflow-hidden"
            >
              {/* Gold Top Accent Line */}
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-davinci-gold/30 to-davinci-gold" />

              <div>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-sm text-davinci-black line-clamp-1 pr-6" title={item.nome}>
                    {item.nome}
                  </h4>
                  <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="p-1 rounded text-davinci-gray hover:text-davinci-gold hover:bg-zinc-100 transition-all cursor-pointer"
                      title="Editar"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenDeleteConfirm(item)}
                      className="p-1 rounded text-davinci-gray hover:text-red-500 hover:bg-red-50"
                      title="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-davinci-gray line-clamp-2 min-h-[2rem] mb-4">
                  {item.descricao || 'Nenhuma descrição fornecida para este item.'}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-100 pt-3 mt-1">
                <div className="flex items-center gap-1.5 text-davinci-gold font-bold text-sm">
                  <DollarSign className="h-4 w-4 stroke-[2.5]" />
                  <span>R$ {item.preco.toFixed(2)}</span>
                </div>

                {activeSubTab === 'services' && (
                  <div className="flex items-center gap-1 text-[10px] text-davinci-gray font-semibold bg-zinc-100 px-2 py-0.5 rounded-full">
                    <Clock className="h-3.5 w-3.5 text-davinci-gold" />
                    <span>{item.duracao} min</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-2xl border border-zinc-200/80 shadow-2xl p-6 relative z-10 overflow-hidden"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-zinc-100 mb-6">
                <div>
                  <h3 className="font-bold text-davinci-black text-sm">
                    {editingItem ? 'Editar' : 'Cadastrar'}{' '}
                    {activeSubTab === 'services' ? 'Serviço' : 'Produto'}
                  </h3>
                  <p className="text-[10px] text-davinci-gold uppercase font-bold tracking-wider mt-0.5">
                    Cadastro de item
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-1 rounded-full text-davinci-gray hover:text-davinci-black hover:bg-zinc-100 transition-all cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nome */}
                <div>
                  <label className="block text-[10px] font-bold text-davinci-gray uppercase tracking-wider mb-1.5">
                    Nome do {activeSubTab === 'services' ? 'Serviço' : 'Produto'} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      activeSubTab === 'services' ? 'Ex: Corte feminino, barba, hidratação' : 'Ex: Pomada modeladora 120g'
                    }
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-davinci-black focus:outline-none focus:border-davinci-gold text-xs"
                  />
                </div>

                {/* Preço e Duração */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-davinci-gray uppercase tracking-wider mb-1.5">
                      Preço de Venda (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      placeholder="Ex: 85.00"
                      value={formData.preco}
                      onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-davinci-black focus:outline-none focus:border-davinci-gold text-xs"
                    />
                  </div>

                  {activeSubTab === 'services' && (
                    <div>
                      <label className="block text-[10px] font-bold text-davinci-gray uppercase tracking-wider mb-1.5">
                        Duração (Minutos) *
                      </label>
                      <input
                        type="number"
                        required
                        min="5"
                        placeholder="Ex: 45"
                        value={formData.duracao}
                        onChange={(e) => setFormData({ ...formData, duracao: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-davinci-black focus:outline-none focus:border-davinci-gold text-xs"
                      />
                    </div>
                  )}
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-[10px] font-bold text-davinci-gray uppercase tracking-wider mb-1.5">
                    Descrição Detalhada
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Descreva as etapas do serviço ou especificações e modo de uso do produto..."
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-davinci-black focus:outline-none focus:border-davinci-gold text-xs resize-none"
                  />
                </div>

                {/* Submit Actions */}
                <div className="flex gap-3 justify-end pt-4 border-t border-zinc-100 mt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-zinc-200 text-davinci-gray hover:text-davinci-black hover:bg-zinc-50 rounded-lg text-xs font-semibold cursor-pointer transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gold-gradient text-davinci-black font-bold rounded-lg text-xs transition-all shadow-md hover:shadow-lg cursor-pointer"
                  >
                    {editingItem ? 'Salvar Alterações' : 'Cadastrar Item'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isConfirmDeleteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConfirmDeleteOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-2xl border border-zinc-200/80 shadow-2xl p-6 relative z-10"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="font-bold text-davinci-black text-sm mb-1">
                  Confirmar Exclusão
                </h3>
                <p className="text-xs text-davinci-gray mb-6">
                  Tem certeza que deseja excluir o item <strong className="text-davinci-black">"{deletingItem?.nome}"</strong>? Esta ação é irreversível e pode afetar registros vinculados no sistema.
                </p>
                <div className="flex gap-3 w-full justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsConfirmDeleteOpen(false);
                      setDeletingItem(null);
                    }}
                    className="flex-1 px-4 py-2 border border-zinc-200 text-davinci-gray hover:text-davinci-black hover:bg-zinc-50 rounded-lg text-xs font-semibold cursor-pointer transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="flex-1 px-4 py-2 bg-red-500 text-white font-bold rounded-lg text-xs transition-all hover:bg-red-600 cursor-pointer"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
