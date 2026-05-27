'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { Plus, Edit2, Trash2, Zap, Save, X, Search, MessageSquareCode } from 'lucide-react';

interface QuickReply {
  id: string;
  titulo: string;
  conteudo: string;
  createdAt: string;
}

export default function QuickRepliesManager() {
  const queryClient = useQueryClient();
  const token = useStore((state) => state.token);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReply, setEditingReply] = useState<QuickReply | null>(null);
  
  // Form states
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');

  // Fetch Quick Replies
  const { data: quickReplies = [], isLoading, isError } = useQuery<QuickReply[]>({
    queryKey: ['quickReplies'],
    queryFn: () =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/whatsapp/quick-replies`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        if (!res.ok) throw new Error('Falha ao buscar respostas rápidas');
        return res.json();
      }),
    enabled: !!token,
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (newReply: { titulo: string; conteudo: string }) =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/whatsapp/quick-replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newReply),
      }).then((res) => {
        if (!res.ok) throw new Error('Erro ao criar resposta rápida');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quickReplies'] });
      closeModal();
    },
    onError: (err: any) => {
      alert(err.message || 'Erro ao salvar modelo.');
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { titulo: string; conteudo: string } }) =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/whatsapp/quick-replies/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }).then((res) => {
        if (!res.ok) throw new Error('Erro ao editar resposta rápida');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quickReplies'] });
      closeModal();
    },
    onError: (err: any) => {
      alert(err.message || 'Erro ao atualizar modelo.');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/whatsapp/quick-replies/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        if (!res.ok) throw new Error('Erro ao deletar resposta rápida');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quickReplies'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Erro ao deletar modelo.');
    },
  });

  const handleOpenAdd = () => {
    setEditingReply(null);
    setTitulo('');
    setConteudo('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (qr: QuickReply) => {
    setEditingReply(qr);
    setTitulo(qr.titulo);
    setConteudo(qr.conteudo);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingReply(null);
    setTitulo('');
    setConteudo('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !conteudo.trim()) return;

    if (editingReply) {
      updateMutation.mutate({
        id: editingReply.id,
        payload: { titulo, conteudo },
      });
    } else {
      createMutation.mutate({ titulo, conteudo });
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir a resposta rápida "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const filteredReplies = quickReplies.filter(
    (qr) =>
      qr.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      qr.conteudo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Barra de Ações Superior */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-white p-4 rounded-xl border border-zinc-200/85 shadow-sm gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-davinci-gray" />
          <input
            type="text"
            placeholder="Pesquisar por atalho ou conteúdo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-davinci-black focus:outline-none focus:border-davinci-gold text-xs"
          />
        </div>
        
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-gold-gradient hover:scale-[1.02] active:scale-[0.98] transition-transform text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Novo Modelo
        </button>
      </div>

      {/* Grid de Modelos Cadastrados */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="h-8 w-8 border-2 border-davinci-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : isError ? (
        <div className="p-8 text-center text-red-500 font-semibold bg-red-50 rounded-xl border border-red-200">
          Erro ao carregar os modelos de respostas rápidas do banco de dados.
        </div>
      ) : filteredReplies.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200/80 p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-davinci-gold/10 flex items-center justify-center text-davinci-gold">
            <Zap className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-sm text-davinci-black">Nenhum modelo cadastrado</h3>
          <p className="text-xs text-davinci-gray max-w-sm">
            Configure frases prontas como "Boas vindas" ou "Confirmação de Agendamento" para responder seus clientes em segundos.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-2 px-3.5 py-1.5 border border-davinci-gold text-davinci-gold hover:bg-davinci-gold/5 rounded-lg text-xs font-semibold cursor-pointer transition-all"
          >
            Cadastrar Primeira Mensagem
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReplies.map((qr) => (
            <div
              key={qr.id}
              className="bg-white border border-zinc-200/80 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-davinci-gold/40 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 rounded-md bg-davinci-gold/10 text-davinci-gold shrink-0">
                    <MessageSquareCode className="h-4 w-4" />
                  </div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-davinci-black truncate">
                    {qr.titulo}
                  </h4>
                </div>
                <p className="text-xs text-davinci-gray leading-relaxed break-words line-clamp-4 min-h-[72px]">
                  {qr.conteudo}
                </p>
              </div>

              <div className="flex justify-between items-center mt-4 pt-3 border-t border-zinc-100">
                <span className="text-[9px] text-zinc-400 font-medium">
                  {new Date(qr.createdAt).toLocaleDateString('pt-BR')}
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(qr)}
                    className="p-1.5 rounded-lg text-davinci-gray hover:text-davinci-gold hover:bg-zinc-100 transition-colors cursor-pointer"
                    title="Editar"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(qr.id, qr.titulo)}
                    className="p-1.5 rounded-lg text-davinci-gray hover:text-red-500 hover:bg-zinc-100 transition-colors cursor-pointer"
                    title="Excluir"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-zinc-200 animate-slide-in">
            {/* Modal Header */}
            <div className="bg-[#f0f2f5] px-6 py-4 border-b border-zinc-200 flex justify-between items-center">
              <h3 className="font-bold text-sm text-davinci-black flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-davinci-gold fill-davinci-gold" />
                {editingReply ? 'Editar Resposta Rápida' : 'Nova Resposta Rápida'}
              </h3>
              <button
                onClick={closeModal}
                className="text-davinci-gray hover:text-davinci-black transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-davinci-gray mb-1.5">
                  Atalho / Título (ex: Boas Vindas)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Saudação Inicial"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs text-davinci-black focus:outline-none focus:border-davinci-gold focus:ring-1 focus:ring-davinci-gold/20"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-davinci-gray mb-1.5">
                  Conteúdo da Mensagem
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder="Digite a mensagem padrão que será inserida ao clicar..."
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs text-davinci-black focus:outline-none focus:border-davinci-gold focus:ring-1 focus:ring-davinci-gold/20 resize-none leading-relaxed"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2 border border-zinc-200 text-davinci-gray hover:bg-zinc-50 rounded-lg text-xs font-bold transition-all cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 py-2 bg-gold-gradient text-white rounded-lg text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Save className="h-4 w-4" />
                  {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : 'Salvar Modelo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
