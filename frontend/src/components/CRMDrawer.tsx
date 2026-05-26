'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, User, Phone, Calendar, Heart, MessageSquare, Clipboard, DollarSign, Award, Edit2, Save, Gift } from 'lucide-react';
import { motion } from 'framer-motion';

interface CRMDrawerProps {
  clientId: string;
  onClose: () => void;
}

export default function CRMDrawer({ clientId, onClose }: CRMDrawerProps) {
  const queryClient = useQueryClient();

  // Buscar detalhes do cliente
  const { data: client, isLoading, error } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/clients/${clientId}`).then((res) => { if (!res.ok) throw new Error('Failed to fetch client'); return res.json(); }),
    enabled: !!clientId,
  });

  // Estados para edição
  const [isEditing, setIsEditing] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [aniversario, setAniversario] = useState('');
  const [preferences, setPreferences] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Sincronizar estados com os dados carregados
  useEffect(() => {
    if (client) {
      setNome(client.nome);
      setTelefone(client.telefone);
      setAniversario(client.aniversario || '');
      setPreferences(client.preferences || '');
      setObservacoes(client.observacoes || '');
    }
  }, [client]);

  // Mutation para atualizar cadastro do cliente no backend
  const updateClientMutation = useMutation({
    mutationFn: (updatedData: any) =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsEditing(false);
    },
  });

  if (isLoading) {
    return (
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white border-l border-zinc-200 z-40 p-8 flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-davinci-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white border-l border-zinc-200 z-40 p-8 flex items-center justify-center text-red-500 font-bold">
        Erro ao carregar ficha do cliente.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-y-0 right-0 w-full max-w-lg bg-white border-l border-zinc-200/80 shadow-2xl z-40 flex flex-col h-screen"
    >
      {/* Header */}
      <div className="p-6 border-b border-zinc-200/80 bg-background flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-davinci-gold/10 border border-davinci-gold/20 flex items-center justify-center font-bold text-davinci-gold">
            {client.nome.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-md font-bold text-davinci-black">{client.nome}</h3>
            <div className="flex flex-col gap-0.5 mt-0.5">
              <p className="text-[10px] text-davinci-gray font-semibold uppercase tracking-wider flex items-center gap-1">
                <Phone className="h-3 w-3 text-davinci-gold" />
                {client.telefone}
              </p>
              {client.aniversario && (
                <p className="text-[10px] text-davinci-gold font-bold uppercase tracking-wider flex items-center gap-1">
                  <Gift className="h-3 w-3 text-davinci-gold" />
                  Aniversário: {client.aniversario}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  updateClientMutation.mutate({
                    nome,
                    telefone,
                    aniversario,
                    preferences,
                    observacoes,
                  });
                }}
                disabled={updateClientMutation.isPending}
                className="px-3 py-1.5 rounded bg-davinci-gold hover:bg-davinci-gold-hover text-white font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-[0_2px_10px_rgba(197,168,128,0.2)]"
              >
                <Save className="h-3.5 w-3.5" />
                {updateClientMutation.isPending ? 'Salvando' : 'Salvar'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setNome(client.nome);
                  setTelefone(client.telefone);
                  setAniversario(client.aniversario || '');
                  setPreferences(client.preferences || '');
                  setObservacoes(client.observacoes || '');
                }}
                className="px-3 py-1.5 rounded bg-white border border-zinc-200 hover:border-davinci-gold text-davinci-gray hover:text-davinci-black text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 rounded bg-white border border-davinci-gold/30 hover:border-davinci-gold text-davinci-gold hover:text-davinci-black text-xs transition-colors flex items-center gap-1 cursor-pointer font-semibold"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Editar Ficha
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white border border-zinc-200 hover:border-davinci-gold text-davinci-gray hover:text-davinci-black transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] text-davinci-black uppercase tracking-wider mb-1.5 font-bold">
                Nome Completo
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-davinci-black focus:outline-none focus:border-davinci-gold text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] text-davinci-black uppercase tracking-wider mb-1.5 font-bold">
                WhatsApp / Celular
              </label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-davinci-black focus:outline-none focus:border-davinci-gold text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] text-davinci-black uppercase tracking-wider mb-1.5 font-bold">
                Data de Aniversário
              </label>
              <input
                type="text"
                value={aniversario}
                onChange={(e) => setAniversario(e.target.value)}
                placeholder="Ex: 15/09"
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-davinci-black focus:outline-none focus:border-davinci-gold text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] text-davinci-black uppercase tracking-wider mb-1.5 font-bold">
                Preferências do Cliente
              </label>
              <textarea
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                rows={3}
                placeholder="Ex: Prefere corte Bob, luzes mel, finalização com ondas suaves..."
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-davinci-black focus:outline-none focus:border-davinci-gold text-xs resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] text-davinci-black uppercase tracking-wider mb-1.5 font-bold">
                Observações Técnicas
              </label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
                placeholder="Ex: preferências de atendimento, restrições de produtos ou observações relevantes..."
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-davinci-black focus:outline-none focus:border-davinci-gold text-xs resize-none"
              />
            </div>
          </div>
        ) : (
          <>
            {/* Core stats grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background p-4 rounded-xl border border-zinc-200/60 flex items-center gap-3">
                <Award className="h-8 w-8 text-davinci-gold animate-pulse" />
                <div>
                  <span className="text-[10px] text-davinci-gray uppercase tracking-wider block font-bold">Frequência</span>
                  <span className="text-md font-bold text-davinci-black">{client.frequency} visitas</span>
                </div>
              </div>

              <div className="bg-background p-4 rounded-xl border border-zinc-200/60 flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-davinci-gold" />
                <div>
                  <span className="text-[10px] text-davinci-gray uppercase tracking-wider block font-bold">Ticket Médio</span>
                  <span className="text-md font-bold text-davinci-black">R$ {client.ticketMedio.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Preferences / Custom Notes */}
            <div className="bg-background p-5 rounded-xl border border-zinc-200/80 space-y-4 shadow-sm">
              <h4 className="text-xs font-bold text-davinci-black uppercase tracking-wider flex items-center gap-2">
                <Heart className="h-4 w-4 text-davinci-gold" />
                Preferências do Cliente
              </h4>
              <p className="text-xs text-davinci-black leading-relaxed italic bg-white p-3 rounded-lg border border-zinc-200/60 font-medium">
                {client.preferences || 'Nenhuma preferência estilística catalogada no momento.'}
              </p>

              <h4 className="text-xs font-bold text-davinci-black uppercase tracking-wider flex items-center gap-2 mt-4">
                <Clipboard className="h-4 w-4 text-davinci-gold" />
                Observações Técnicas / Operacionais
              </h4>
              <p className="text-xs text-davinci-black leading-relaxed bg-white p-3 rounded-lg border border-zinc-200/60 font-medium">
                {client.observacoes || 'Sem observações operacionais adicionais.'}
              </p>
            </div>

            {/* Haircut History */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-davinci-black uppercase tracking-wider flex items-center gap-2">
                <Calendar className="h-4 w-4 text-davinci-gold" />
                Histórico de Atendimentos
              </h4>

              {client.appointments.length === 0 ? (
                <p className="text-xs text-davinci-gray font-semibold italic">Nenhum atendimento finalizado registrado.</p>
              ) : (
                <div className="space-y-3">
                  {client.appointments.map((app: any) => (
                    <div key={app.id} className="bg-background p-4 rounded-xl border border-zinc-100 flex justify-between items-center text-xs shadow-sm">
                      <div>
                        <h5 className="font-bold text-davinci-black">{app.service.nome}</h5>
                        <p className="text-[10px] text-davinci-gray mt-1 font-semibold">
                          {new Date(app.data).toLocaleDateString('pt-BR')} com {app.barber.user.nome}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-davinci-gold">R$ {app.valor.toFixed(2)}</span>
                        <span className={`block text-[9px] uppercase tracking-wider font-extrabold mt-1 ${
                          app.status === 'COMPLETED' ? 'text-emerald-600' : 'text-davinci-gray'
                        }`}>
                          {app.status === 'COMPLETED' ? 'Concluído' : app.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* WhatsApp Logs preview */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-davinci-black uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-davinci-gold" />
                Registro de Conversas
              </h4>

              {client.messages.length === 0 ? (
                <p className="text-xs text-davinci-gray font-semibold italic">Nenhuma conversa registrada para este cliente.</p>
              ) : (
                <div className="bg-background p-4 rounded-xl border border-zinc-100 max-h-48 overflow-y-auto space-y-2 shadow-inner">
                  {client.messages.slice(-5).map((msg: any) => (
                    <div key={msg.id} className={`p-2 rounded-lg max-w-[85%] text-xs leading-relaxed ${
                      msg.tipo === 'SENT'
                        ? 'bg-davinci-gold/10 border border-davinci-gold/20 text-davinci-black ml-auto font-medium shadow-sm'
                        : 'bg-white text-davinci-black mr-auto border border-zinc-200/80 font-medium shadow-sm'
                    }`}>
                      {msg.mensagem}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
