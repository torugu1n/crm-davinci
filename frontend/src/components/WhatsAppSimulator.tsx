'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { Send, Phone, Video, MoreVertical, Search, Smartphone, ShieldCheck, Sparkles, CheckCheck } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function WhatsAppSimulator() {
  const queryClient = useQueryClient();
  const token = useStore((state) => state.token);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [operatorText, setOperatorText] = useState('');
  const [customerText, setCustomerText] = useState('');
  const [chats, setChats] = useState<any[]>([]);
  const [typing, setTyping] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  const chatEndRefOperator = useRef<HTMLDivElement | null>(null);
  const chatEndRefCustomer = useRef<HTMLDivElement | null>(null);

  // Fetch clients to populate left chat list
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/clients`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }).then((res) => {
        if (!res.ok) throw new Error('Falha ao carregar clientes');
        return res.json();
      }),
    enabled: !!token,
  });

  // Fetch chat history for selected client
  const { data: history = [], refetch: refetchHistory } = useQuery({
    queryKey: ['chatHistory', selectedClientId],
    queryFn: () =>
      selectedClientId
        ? fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/whatsapp/history/${selectedClientId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }).then((res) => {
            if (!res.ok) throw new Error('Falha ao carregar histórico');
            return res.json();
          })
        : Promise.resolve([]),
    enabled: !!selectedClientId && !!token,
  });

  useEffect(() => {
    if (Array.isArray(history)) {
      setChats(history);
    }
  }, [history]);

  // Set default selected client on load
  useEffect(() => {
    const clientList = Array.isArray(clients) ? clients : [];
    if (clientList.length > 0 && !selectedClientId) {
      setSelectedClientId(clientList[0].id);
    }
  }, [clients, selectedClientId]);

  // WebSockets Listener
  useEffect(() => {
    const socket = io((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'));

    socket.on('new-message', (data: { clientId: string; message: any }) => {
      if (data.clientId === selectedClientId) {
        // Se a mensagem é enviada pelo bot, simular digitação
        if (data.message.tipo === 'SENT') {
          setTyping(true);
          setTimeout(() => {
            setTyping(false);
            setChats((prev) => [...prev, data.message]);
            // Atualizar cache de histórico no react-query
            queryClient.invalidateQueries({ queryKey: ['chatHistory', selectedClientId] });
            queryClient.invalidateQueries({ queryKey: ['appointments'] }); // Se agendou algo
          }, 800);
        } else {
          setChats((prev) => [...prev, data.message]);
          queryClient.invalidateQueries({ queryKey: ['chatHistory', selectedClientId] });
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedClientId, queryClient]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRefOperator.current?.scrollIntoView({ behavior: 'smooth' });
    chatEndRefCustomer.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, typing]);

  // Send Mutation: Customer
  const customerSendMutation = useMutation({
    mutationFn: (msg: any) =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/whatsapp/customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(msg),
      }).then((res) => res.json()),
    onSuccess: () => {
      setCustomerText('');
    },
  });

  // Send Mutation: Operator
  const operatorSendMutation = useMutation({
    mutationFn: (msg: any) =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/whatsapp/operator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(msg),
      }).then((res) => res.json()),
    onSuccess: () => {
      setOperatorText('');
    },
  });

  const handleCustomerSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerText.trim() || !selectedClientId) return;
    customerSendMutation.mutate({
      clientId: selectedClientId,
      mensagem: customerText,
    });
  };

  const handleOperatorSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!operatorText.trim() || !selectedClientId) return;
    operatorSendMutation.mutate({
      clientId: selectedClientId,
      mensagem: operatorText,
    });
  };

  const clientList = Array.isArray(clients) ? clients : [];
  const selectedClient = clientList.find((c: any) => c.id === selectedClientId);

  const filteredClients = clientList.filter((c: any) =>
    (c.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 min-h-[600px]">
      {/* PAINEL ESQUERDO: Painel de Atendimento do CRM (Visão Recepção) */}
      <div className="glass-card rounded-2xl overflow-hidden flex flex-col h-[650px] border border-zinc-200">
        {/* Header CRM Chat */}
        <div className="bg-white p-4 border-b border-zinc-200 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-davinci-black uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              Atendimento WhatsApp
            </h3>
            <p className="text-[10px] text-davinci-gray mt-0.5">Operador: recepção</p>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-[220px_1fr] divide-y md:divide-y-0 md:divide-x divide-zinc-200 overflow-hidden">
          {/* Chat List */}
          <div className={`flex flex-col bg-zinc-50/50 overflow-y-auto h-full ${mobileView === 'list' ? 'flex' : 'hidden md:flex'}`}>
            {/* Search */}
            <div className="p-3 border-b border-zinc-200/60 relative">
              <Search className="absolute left-5.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-davinci-gray" />
              <input
                type="text"
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-davinci-black focus:outline-none text-[11px] shadow-sm"
              />
            </div>
            {/* Items */}
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
              {filteredClients.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedClientId(c.id);
                    setMobileView('chat');
                  }}
                  className={`w-full text-left p-3 flex flex-col gap-1 transition-all cursor-pointer ${
                    selectedClientId === c.id
                      ? 'bg-davinci-gold/10 border-l-2 border-davinci-gold'
                      : 'hover:bg-zinc-50'
                  }`}
                >
                  <span className="text-xs font-bold text-davinci-black truncate">{c.nome}</span>
                  <span className="text-[9px] text-davinci-gray font-light truncate">{c.telefone}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Messages Area */}
          <div className={`flex flex-col bg-white overflow-hidden h-full ${mobileView === 'chat' ? 'flex' : 'hidden md:flex'}`}>
            {selectedClient ? (
              <>
                {/* Active Chat Header */}
                <div className="p-3 bg-white border-b border-zinc-200 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setMobileView('list')}
                      className="p-1 px-2.5 rounded bg-white hover:bg-zinc-50 text-davinci-black border border-zinc-200 transition-all cursor-pointer font-bold text-xs md:hidden"
                    >
                      ← Voltar
                    </button>
                    <span className="text-xs font-semibold text-davinci-black">Conversando com {selectedClient.nome}</span>
                  </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {chats.map((msg: any) => {
                    const isOperator = msg.tipo === 'SENT';
                    return (
                      <div
                        key={msg.id}
                        className={`p-2.5 rounded-lg max-w-[80%] text-xs leading-relaxed ${
                          isOperator
                            ? 'bg-davinci-gold/15 border border-davinci-gold/30 text-davinci-black ml-auto'
                            : 'bg-zinc-100 border border-zinc-200/60 text-davinci-black mr-auto'
                        }`}
                      >
                        {msg.mensagem}
                      </div>
                    );
                  })}
                  {typing && (
                    <div className="bg-zinc-100 border border-zinc-200/60 text-davinci-gray mr-auto p-2.5 rounded-lg text-[10px] italic flex items-center gap-1.5">
                      <span>Digitando</span>
                      <span className="flex gap-0.5"><span className="w-1 h-1 bg-davinci-gold rounded-full animate-bounce" /><span className="w-1 h-1 bg-davinci-gold rounded-full animate-bounce [animation-delay:0.2s]" /><span className="w-1 h-1 bg-davinci-gold rounded-full animate-bounce [animation-delay:0.4s]" /></span>
                    </div>
                  )}
                  <div ref={chatEndRefOperator} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleOperatorSend} className="p-3 border-t border-zinc-200 bg-white flex gap-2">
                  <input
                    type="text"
                    value={operatorText}
                    onChange={(e) => setOperatorText(e.target.value)}
                    placeholder="Responda como operador..."
                    className="flex-1 bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-davinci-black focus:outline-none focus:border-davinci-gold shadow-sm"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-lg bg-gold-gradient text-davinci-black hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-sm"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-davinci-gray flex-col gap-2 p-4">
                <button
                  onClick={() => setMobileView('list')}
                  className="p-1.5 px-3 rounded bg-white text-davinci-gold border border-zinc-200 md:hidden cursor-pointer"
                >
                  Ver Lista de Clientes
                </button>
                <span className="text-center">Nenhum chat ativo. Selecione um cliente no menu esquerdo.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PAINEL DIREITO: Simulador de Celular do Cliente (Para Teste do Chatbot) */}
      <div className="flex flex-col items-center justify-center">
        <div className="w-[340px] h-[650px] bg-white border-8 border-[#D8C3A5] rounded-[42px] shadow-2xl relative overflow-hidden flex flex-col ring-4 ring-zinc-100">
          {/* Speaker / Notch */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-5 bg-white border border-zinc-200 rounded-full z-30 flex items-center justify-center">
            <div className="w-12 h-1 bg-zinc-300 rounded-full" />
          </div>

          {/* Screen Content */}
          <div className="flex-1 flex flex-col pt-8 bg-zinc-50 overflow-hidden text-xs text-davinci-black">
            {/* Phone WhatsApp Header */}
            <div className="bg-white px-4 py-3 border-b border-zinc-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-davinci-gold/20 border border-davinci-gold flex items-center justify-center text-[10px] font-bold text-davinci-gold">
                  DV
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-davinci-black flex items-center gap-1">
                    Atendimento do Estabelecimento
                    <Sparkles className="h-3 w-3 text-davinci-gold fill-davinci-gold" />
                  </h4>
                  <span className="text-[8px] text-emerald-600 font-light flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    online
                  </span>
                </div>
              </div>

              <div className="flex gap-3 text-zinc-500">
                <Phone className="h-3.5 w-3.5" />
                <Video className="h-3.5 w-3.5" />
                <MoreVertical className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Sandbox Notice */}
            <div className="bg-davinci-gold/10 border-b border-davinci-gold/20 px-3 py-1.5 text-[8px] text-davinci-gold text-center font-bold uppercase tracking-wider flex items-center justify-center gap-1">
              <Smartphone className="h-3 w-3" />
              Visualização de Mensagens do Cliente
            </div>

            {/* Simulated Chat Messages List */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-white bg-[radial-gradient(ellipse_at_top,rgba(197,168,128,0.03),transparent)]">
              <div className="text-center my-2 text-[8px] text-davinci-gray uppercase tracking-widest bg-zinc-100 w-fit mx-auto px-2 py-0.5 rounded border border-zinc-200/50">
                Criptografia Simétrica Ativa
              </div>

              {chats.map((msg: any) => {
                const isCustomer = msg.tipo === 'RECEIVED';
                return (
                  <div
                    key={msg.id}
                    className={`p-2.5 rounded-xl max-w-[85%] text-[11px] leading-relaxed relative ${
                      isCustomer
                        ? 'bg-davinci-gold/25 border border-davinci-gold/45 text-davinci-black ml-auto rounded-tr-none shadow-sm'
                        : 'bg-zinc-100 border border-zinc-200/80 text-davinci-black mr-auto rounded-tl-none'
                    }`}
                  >
                    {msg.mensagem}
                    <div className="flex justify-end mt-1 text-[8px] opacity-70">
                      {isCustomer && <CheckCheck className="h-3 w-3 text-davinci-black inline" />}
                    </div>
                  </div>
                );
              })}

              {typing && (
                <div className="bg-zinc-100 border border-zinc-200/80 text-davinci-black mr-auto p-2.5 rounded-xl rounded-tl-none text-[10px] italic flex items-center gap-1.5">
                  <span>Digitando</span>
                  <span className="flex gap-0.5"><span className="w-1 h-1 bg-davinci-gold rounded-full animate-bounce" /><span className="w-1 h-1 bg-davinci-gold rounded-full animate-bounce [animation-delay:0.2s]" /><span className="w-1 h-1 bg-davinci-gold rounded-full animate-bounce [animation-delay:0.4s]" /></span>
                </div>
              )}

              <div ref={chatEndRefCustomer} />
            </div>

            {/* Customer keyboard bar */}
            <form onSubmit={handleCustomerSend} className="p-3 bg-white border-t border-zinc-200 flex gap-2">
              <input
                type="text"
                value={customerText}
                onChange={(e) => setCustomerText(e.target.value)}
                placeholder="Escreva como cliente... (Ex: 'Quero cortar amanhã')"
                className="flex-1 bg-zinc-50 border border-zinc-200 rounded-full px-4 py-2 text-[11px] text-davinci-black focus:outline-none focus:border-davinci-gold shadow-inner"
              />
              <button
                type="submit"
                className="p-2 rounded-full bg-davinci-gold text-white hover:scale-105 active:scale-95 transition-transform flex items-center justify-center cursor-pointer shadow-sm"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>

          {/* iPhone Home indicator */}
          <div className="h-1 w-28 bg-zinc-300 rounded-full mx-auto mb-2 mt-1 z-30" />
        </div>
      </div>
    </div>
  );
}
