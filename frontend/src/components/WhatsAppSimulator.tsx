'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import {
  Send,
  Phone,
  Video,
  MoreVertical,
  Search,
  Smartphone,
  Sparkles,
  CheckCheck,
  Zap,
  Info,
  Calendar,
  X,
  Plus,
  Paperclip,
  Smile,
  UserCheck,
  Tags,
} from 'lucide-react';
import { useStore } from '@/store/useStore';

const STATUS_OPTIONS = [
  { value: 'NEW', label: 'Novo Contato', color: 'bg-blue-500 text-white' },
  { value: 'BOOKING', label: 'Em Agendamento', color: 'bg-amber-500 text-white' },
  { value: 'CONFIRMED', label: 'Confirmado', color: 'bg-emerald-500 text-white' },
  { value: 'COMPLETED', label: 'Finalizado', color: 'bg-zinc-800 text-white' },
  { value: 'LOST', label: 'Perdido', color: 'bg-red-500 text-white' },
];

const STATUS_FILTER_TABS = [
  { value: 'ALL', label: 'Todos' },
  { value: 'NEW', label: 'Novos' },
  { value: 'BOOKING', label: 'Agendando' },
  { value: 'CONFIRMED', label: 'Confirmados' },
  { value: 'COMPLETED', label: 'Finalizados' },
];

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
  
  // Custom sidebar toggle
  const [showInfoSidebar, setShowInfoSidebar] = useState(true);
  
  // Chat list filter
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Quick booking states
  const [quickBookService, setQuickBookService] = useState('');
  const [quickBookBarber, setQuickBookBarber] = useState('');
  const [quickBookDate, setQuickBookDate] = useState('');
  const [quickBookHour, setQuickBookHour] = useState('');

  // Quick reply toggle
  const [showQuickReplies, setShowQuickReplies] = useState(false);

  const chatEndRefOperator = useRef<HTMLDivElement | null>(null);
  const chatEndRefCustomer = useRef<HTMLDivElement | null>(null);

  // Fetch clients
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/clients`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        if (!res.ok) throw new Error('Falha ao carregar clientes');
        return res.json();
      }),
    enabled: !!token,
  });

  // Fetch chat history for selected client
  const { data: history = [] } = useQuery({
    queryKey: ['chatHistory', selectedClientId],
    queryFn: () =>
      selectedClientId
        ? fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/whatsapp/history/${selectedClientId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((res) => {
            if (!res.ok) throw new Error('Falha ao carregar histórico');
            return res.json();
          })
        : Promise.resolve([]),
    enabled: !!selectedClientId && !!token,
  });

  // Fetch Barbers for quick booking
  const { data: barbers = [] } = useQuery({
    queryKey: ['barbers'],
    queryFn: () =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/barbers`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).then((res) => res.json()),
  });

  // Fetch Services for quick booking
  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/services`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).then((res) => res.json()),
  });

  // Fetch Quick Replies
  const { data: quickReplies = [] } = useQuery({
    queryKey: ['quickReplies'],
    queryFn: () =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/whatsapp/quick-replies`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),
    enabled: !!token,
  });

  useEffect(() => {
    if (Array.isArray(history)) {
      setChats(history);
    }
  }, [history]);

  // Set default selected client
  useEffect(() => {
    const clientList = Array.isArray(clients) ? clients : [];
    if (clientList.length > 0 && !selectedClientId) {
      setSelectedClientId(clientList[0].id);
    }
  }, [clients, selectedClientId]);

  // WebSockets listener
  useEffect(() => {
    const socket = io((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'));

    socket.on('new-message', (data: { clientId: string; message: any }) => {
      if (data.clientId === selectedClientId) {
        if (data.message.tipo === 'SENT') {
          setTyping(true);
          setTimeout(() => {
            setTyping(false);
            setChats((prev) => [...prev, data.message]);
            queryClient.invalidateQueries({ queryKey: ['chatHistory', selectedClientId] });
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            queryClient.invalidateQueries({ queryKey: ['clients'] });
          }, 800);
        } else {
          setChats((prev) => [...prev, data.message]);
          queryClient.invalidateQueries({ queryKey: ['chatHistory', selectedClientId] });
          queryClient.invalidateQueries({ queryKey: ['clients'] });
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedClientId, queryClient]);

  useEffect(() => {
    chatEndRefOperator.current?.scrollIntoView({ behavior: 'smooth' });
    chatEndRefCustomer.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, typing]);

  // Mutations
  const customerSendMutation = useMutation({
    mutationFn: (msg: any) =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/whatsapp/customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(msg),
      }).then((res) => res.json()),
    onSuccess: () => {
      setCustomerText('');
    },
  });

  const operatorSendMutation = useMutation({
    mutationFn: (msg: any) =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/whatsapp/operator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(msg),
      }).then((res) => res.json()),
    onSuccess: () => {
      setOperatorText('');
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ id, chatStatus }: { id: string; chatStatus: string }) =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/clients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ chatStatus }),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const quickBookMutation = useMutation({
    mutationFn: (newApp: any) =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newApp),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Erro ao criar agendamento');
        return data;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      alert('Agendamento realizado com sucesso!');
      setQuickBookService('');
      setQuickBookBarber('');
      setQuickBookDate('');
      setQuickBookHour('');
    },
    onError: (err: any) => {
      alert(err.message);
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

  const handleQuickBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !quickBookService || !quickBookBarber || !quickBookDate || !quickBookHour) return;

    const [hours, minutes] = quickBookHour.split(':');
    const appointmentDate = new Date(quickBookDate + 'T00:00:00');
    appointmentDate.setHours(parseInt(hours, 10), parseInt(minutes || '0', 10), 0, 0);

    quickBookMutation.mutate({
      clientId: selectedClientId,
      serviceId: quickBookService,
      barberId: quickBookBarber,
      data: appointmentDate,
      status: 'CONFIRMED',
    });
  };

  const selectQuickReply = (conteudo: string) => {
    setOperatorText(conteudo);
    setShowQuickReplies(false);
  };

  const clientList = Array.isArray(clients) ? clients : [];
  const selectedClient = clientList.find((c: any) => c.id === selectedClientId);

  const filteredClients = clientList.filter((c: any) => {
    const matchesSearch = (c.nome || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatusFilter === 'ALL' || c.chatStatus === selectedStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusLabel = (statusVal: string) => {
    return STATUS_OPTIONS.find((opt) => opt.value === statusVal)?.label || 'Desconhecido';
  };

  const getStatusColor = (statusVal: string) => {
    return STATUS_OPTIONS.find((opt) => opt.value === statusVal)?.color || 'bg-zinc-200 text-zinc-600';
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-8 min-h-[650px]">
      {/* PAINEL ESQUERDO: Whatsapp Web Clone (CRM / Recepção) */}
      <div className="bg-zinc-100 rounded-2xl overflow-hidden flex flex-col h-[680px] border border-zinc-300 shadow-xl relative">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-[280px_1fr] divide-x divide-zinc-300 overflow-hidden h-full">
          
          {/* Chat List (Sidebar Esquerda Whatsapp) */}
          <div className={`flex flex-col bg-white overflow-hidden h-full ${mobileView === 'list' ? 'flex' : 'hidden md:flex'}`}>
            {/* Cabeçalho Whatsapp - Operador */}
            <div className="bg-[#f0f2f5] p-3 border-b border-zinc-200 flex justify-between items-center h-14 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-davinci-gold/15 border border-davinci-gold flex items-center justify-center font-bold text-xs text-davinci-gold">
                  OP
                </div>
                <div className="leading-tight">
                  <h4 className="text-xs font-bold text-davinci-black">Recepção</h4>
                  <span className="text-[9px] text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Ativo
                  </span>
                </div>
              </div>
            </div>

            {/* Abas de Filtros por Status */}
            <div className="bg-white px-2 py-1.5 border-b border-zinc-100 flex gap-1 overflow-x-auto scrollbar-none shrink-0">
              {STATUS_FILTER_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setSelectedStatusFilter(tab.value)}
                  className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
                    selectedStatusFilter === tab.value
                      ? 'bg-davinci-gold text-white'
                      : 'bg-zinc-100 text-davinci-gray hover:bg-zinc-200/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Pesquisa */}
            <div className="p-2 border-b border-zinc-100 bg-[#f6f6f6] shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-davinci-gray" />
                <input
                  type="text"
                  placeholder="Pesquisar conversa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-davinci-black focus:outline-none text-[11px]"
                />
              </div>
            </div>

            {/* Lista de Contatos */}
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 bg-white">
              {filteredClients.length === 0 ? (
                <div className="p-6 text-center text-xs text-davinci-gray font-semibold">
                  Nenhuma conversa encontrada.
                </div>
              ) : (
                filteredClients.map((c: any) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedClientId(c.id);
                      setMobileView('chat');
                    }}
                    className={`w-full text-left p-3 flex items-start gap-2.5 transition-all cursor-pointer border-l-2 ${
                      selectedClientId === c.id
                        ? 'bg-zinc-100 border-davinci-gold'
                        : 'hover:bg-zinc-50 border-transparent'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-davinci-gold/10 border border-davinci-gold/20 flex items-center justify-center font-bold text-xs text-davinci-gold shrink-0">
                      {c.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1 leading-tight">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-bold text-davinci-black truncate">{c.nome}</span>
                        <span className="text-[8px] text-davinci-gray font-light">12:34</span>
                      </div>
                      <p className="text-[10px] text-davinci-gray truncate mt-1">{c.telefone}</p>
                      
                      <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${getStatusColor(c.chatStatus)}`}>
                        {getStatusLabel(c.chatStatus)}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Area do Chat com Wallpaper e Ficha CRM Lateral */}
          <div className={`flex bg-white overflow-hidden h-full ${mobileView === 'chat' ? 'flex' : 'hidden md:flex'}`}>
            
            {/* Bloco Chat Central */}
            <div className="flex-1 flex flex-col h-full bg-[#efeae2] relative overflow-hidden">
              
              {selectedClient ? (
                <>
                  {/* Cabeçalho do Chat Ativo */}
                  <div className="bg-[#f0f2f5] p-3 border-b border-zinc-200 flex justify-between items-center h-14 shrink-0 z-10 shadow-sm">
                    <div className="flex items-center gap-2.5 min-w-0 cursor-pointer" onClick={() => setShowInfoSidebar(!showInfoSidebar)}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMobileView('list');
                        }}
                        className="p-1.5 rounded bg-white hover:bg-zinc-100 text-davinci-black border border-zinc-200 transition-all font-bold text-xs md:hidden"
                      >
                        ← Voltar
                      </button>
                      <div className="w-9 h-9 rounded-full bg-davinci-gold/20 border border-davinci-gold flex items-center justify-center font-bold text-xs text-davinci-gold shrink-0">
                        {selectedClient.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="leading-tight min-w-0">
                        <h4 className="text-xs font-bold text-davinci-black truncate">{selectedClient.nome}</h4>
                        <span className="text-[9px] text-davinci-gray font-medium block truncate">
                          Clique para ver ficha do cliente
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-zinc-500">
                      <button
                        onClick={() => setShowInfoSidebar(!showInfoSidebar)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-zinc-200/50 ${
                          showInfoSidebar ? 'text-davinci-gold' : 'text-zinc-500'
                        }`}
                        title="Informações do contato"
                      >
                        <Info className="h-4.5 w-4.5" />
                      </button>
                      <MoreVertical className="h-4.5 w-4.5 cursor-pointer" />
                    </div>
                  </div>

                  {/* Wallpaper do Chat de Mensagens */}
                  <div 
                    className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#efeae2] relative"
                    style={{
                      backgroundImage: 'radial-gradient(#d3c3a9 0.5px, transparent 0.5px), radial-gradient(#d3c3a9 0.5px, #efeae2 0.5px)',
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 10px 10px',
                      opacity: 0.95
                    }}
                  >
                    {chats.map((msg: any) => {
                      const isOperator = msg.tipo === 'SENT';
                      return (
                        <div
                          key={msg.id}
                          className={`p-2.5 rounded-lg max-w-[75%] text-xs leading-relaxed shadow-sm relative ${
                            isOperator
                              ? 'bg-[#d9fdd3] text-davinci-black ml-auto rounded-tr-none'
                              : 'bg-white text-davinci-black mr-auto rounded-tl-none border border-zinc-200/60'
                          }`}
                        >
                          <p>{msg.mensagem}</p>
                          <div className="flex justify-end items-center gap-1 mt-1 text-[8px] text-davinci-gray select-none">
                            <span>{new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                            {isOperator && <CheckCheck className="h-3 w-3 text-sky-500 inline" />}
                          </div>
                        </div>
                      );
                    })}
                    {typing && (
                      <div className="bg-white border border-zinc-200/60 text-davinci-gray mr-auto p-2 rounded-lg text-[10px] italic flex items-center gap-1.5 shadow-sm rounded-tl-none">
                        <span>Digitando</span>
                        <span className="flex gap-0.5">
                          <span className="w-1 h-1 bg-davinci-gold rounded-full animate-bounce" />
                          <span className="w-1 h-1 bg-davinci-gold rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1 h-1 bg-davinci-gold rounded-full animate-bounce [animation-delay:0.4s]" />
                        </span>
                      </div>
                    )}
                    <div ref={chatEndRefOperator} />
                  </div>

                  {/* Quick Replies Popover */}
                  {showQuickReplies && (
                    <div className="absolute bottom-16 left-4 bg-white border border-zinc-200 rounded-xl p-3 shadow-2xl z-20 w-72 max-h-48 overflow-y-auto space-y-2">
                      <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
                        <span className="text-[10px] font-bold text-davinci-gray uppercase tracking-widest flex items-center gap-1">
                          <Zap className="h-3.5 w-3.5 text-davinci-gold fill-davinci-gold" />
                          Respostas Rápidas
                        </span>
                        <button onClick={() => setShowQuickReplies(false)} className="text-davinci-gray hover:text-davinci-black">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      {quickReplies.length === 0 ? (
                        <p className="text-[10px] text-davinci-gray italic p-2 text-center">Nenhum modelo cadastrado.</p>
                      ) : (
                        quickReplies.map((qr: any) => (
                          <button
                            key={qr.id}
                            type="button"
                            onClick={() => selectQuickReply(qr.conteudo)}
                            className="w-full text-left p-2 hover:bg-zinc-50 rounded-lg text-xs leading-snug border border-zinc-100 hover:border-zinc-200 transition-colors"
                          >
                            <strong className="block text-[9px] uppercase text-davinci-gold tracking-wider mb-0.5">{qr.titulo}</strong>
                            <span className="text-davinci-black line-clamp-2">{qr.conteudo}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {/* Barra de Digitação */}
                  <form onSubmit={handleOperatorSend} className="p-2.5 bg-[#f0f2f5] border-t border-zinc-200 flex gap-2 items-center h-14 shrink-0 z-10">
                    <div className="flex gap-2 text-zinc-500">
                      <Smile className="h-5 w-5 cursor-pointer hover:text-davinci-black transition-colors" />
                      <Paperclip className="h-5 w-5 cursor-pointer hover:text-davinci-black transition-colors" />
                      <button
                        type="button"
                        onClick={() => setShowQuickReplies(!showQuickReplies)}
                        className={`p-0.5 rounded transition-colors cursor-pointer ${showQuickReplies ? 'text-davinci-gold bg-davinci-gold/15' : 'hover:text-davinci-black'}`}
                        title="Respostas rápidas"
                      >
                        <Zap className="h-5 w-5" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={operatorText}
                      onChange={(e) => setOperatorText(e.target.value)}
                      placeholder="Mensagem..."
                      className="flex-1 bg-white border border-zinc-200 rounded-full px-4 py-2 text-xs text-davinci-black focus:outline-none focus:border-davinci-gold shadow-sm"
                    />
                    <button
                      type="submit"
                      className="p-2 rounded-full bg-davinci-gold text-white hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md shrink-0 flex items-center justify-center"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-davinci-gray flex-col gap-2 p-4">
                  <span className="text-center font-semibold">Selecione uma conversa para iniciar o atendimento.</span>
                </div>
              )}
            </div>

            {/* Ficha CRM Rápida Integrada (Whatsapp Web Contact Info) */}
            {selectedClient && showInfoSidebar && (
              <div className="w-[280px] border-l border-zinc-200 bg-white flex flex-col h-full overflow-hidden shrink-0 animate-slide-in">
                
                {/* Header info */}
                <div className="p-3 bg-[#f0f2f5] border-b border-zinc-200 flex justify-between items-center h-14 shrink-0">
                  <span className="text-xs font-bold text-davinci-black uppercase tracking-wider">Ficha do Cliente</span>
                  <button onClick={() => setShowInfoSidebar(false)} className="text-davinci-gray hover:text-davinci-black cursor-pointer">
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                {/* CRM content scroll */}
                <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
                  {/* Perfil card */}
                  <div className="flex flex-col items-center text-center pb-4 border-b border-zinc-100">
                    <div className="w-14 h-14 rounded-full bg-davinci-gold/10 border-2 border-davinci-gold/30 flex items-center justify-center font-bold text-lg text-davinci-gold mb-2 shadow-inner">
                      {selectedClient.nome.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-davinci-black text-sm">{selectedClient.nome}</span>
                    <span className="text-[10px] text-davinci-gray mt-1 block">{selectedClient.telefone}</span>
                  </div>

                  {/* Status Dropdown */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-davinci-gray block">Status da Conversa</label>
                    <select
                      value={selectedClient.chatStatus}
                      onChange={(e) => updateClientMutation.mutate({ id: selectedClient.id, chatStatus: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs text-davinci-black focus:outline-none focus:border-davinci-gold font-semibold cursor-pointer"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Indicadores rápidos */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-zinc-50 border border-zinc-200/60 p-2 rounded-xl text-center">
                      <span className="text-[8px] uppercase tracking-wider text-davinci-gray font-semibold block">Visitas</span>
                      <strong className="text-sm font-bold text-davinci-black block mt-0.5">{selectedClient.frequency}</strong>
                    </div>
                    <div className="bg-zinc-50 border border-zinc-200/60 p-2 rounded-xl text-center">
                      <span className="text-[8px] uppercase tracking-wider text-davinci-gray font-semibold block">Ticket Médio</span>
                      <strong className="text-sm font-bold text-davinci-gold block mt-0.5">R$ {selectedClient.ticketMedio.toFixed(0)}</strong>
                    </div>
                  </div>

                  {/* Preferencias / Observações */}
                  <div className="space-y-3 pb-3 border-b border-zinc-100">
                    {selectedClient.preferences && (
                      <div>
                        <span className="text-[9px] uppercase tracking-wider font-bold text-davinci-gray block">Preferências</span>
                        <p className="mt-1 text-davinci-black leading-relaxed text-[11px] font-medium">{selectedClient.preferences}</p>
                      </div>
                    )}
                    {selectedClient.observacoes && (
                      <div>
                        <span className="text-[9px] uppercase tracking-wider font-bold text-davinci-gray block">Observações</span>
                        <p className="mt-1 text-davinci-black leading-relaxed text-[11px] font-medium">{selectedClient.observacoes}</p>
                      </div>
                    )}
                  </div>

                  {/* Agendamento Rápido em 1-Clique */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-davinci-black uppercase tracking-wider">
                      <Calendar className="h-3.5 w-3.5 text-davinci-gold" />
                      <span>Agendamento Rápido</span>
                    </div>

                    <form onSubmit={handleQuickBookSubmit} className="space-y-2.5 bg-zinc-50 border border-zinc-200 p-3 rounded-xl">
                      <div>
                        <label className="block text-[8px] uppercase font-bold text-davinci-gray mb-1">Serviço</label>
                        <select
                          required
                          value={quickBookService}
                          onChange={(e) => setQuickBookService(e.target.value)}
                          className="w-full p-1 bg-white border border-zinc-200 rounded text-[10px] focus:outline-none focus:border-davinci-gold"
                        >
                          <option value="" disabled>-- Selecione --</option>
                          {services.map((s: any) => (
                            <option key={s.id} value={s.id}>{s.nome} - R$ {s.preco}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[8px] uppercase font-bold text-davinci-gray mb-1">Profissional</label>
                        <select
                          required
                          value={quickBookBarber}
                          onChange={(e) => setQuickBookBarber(e.target.value)}
                          className="w-full p-1 bg-white border border-zinc-200 rounded text-[10px] focus:outline-none focus:border-davinci-gold"
                        >
                          <option value="" disabled>-- Selecione --</option>
                          {barbers.map((b: any) => (
                            <option key={b.id} value={b.id}>{b.user.nome}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <label className="block text-[8px] uppercase font-bold text-davinci-gray mb-1">Data</label>
                          <input
                            required
                            type="date"
                            value={quickBookDate}
                            onChange={(e) => setQuickBookDate(e.target.value)}
                            className="w-full p-1 bg-white border border-zinc-200 rounded text-[10px] focus:outline-none focus:border-davinci-gold"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] uppercase font-bold text-davinci-gray mb-1">Horário</label>
                          <input
                            required
                            type="time"
                            value={quickBookHour}
                            onChange={(e) => setQuickBookHour(e.target.value)}
                            className="w-full p-1 bg-white border border-zinc-200 rounded text-[10px] focus:outline-none focus:border-davinci-gold"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={quickBookMutation.isPending}
                        className="w-full py-1.5 bg-gold-gradient rounded text-[10px] text-davinci-black font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer shadow-sm flex items-center justify-center gap-1"
                      >
                        {quickBookMutation.isPending ? 'Gravando...' : 'Confirmar Reserva'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PAINEL DIREITO: Simulador de Celular do Cliente (Estilo Whatsapp Web Test Sandbox) */}
      <div className="flex flex-col items-center justify-center">
        <div className="w-[320px] h-[680px] bg-white border-[10px] border-[#D8C3A5] rounded-[48px] shadow-2xl relative overflow-hidden flex flex-col ring-4 ring-zinc-100/50 shrink-0">
          {/* Speaker / Notch */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-5 bg-white border border-zinc-200 rounded-full z-30 flex items-center justify-center">
            <div className="w-12 h-1 bg-zinc-300 rounded-full" />
          </div>

          {/* Screen Content */}
          <div className="flex-1 flex flex-col pt-8 bg-zinc-50 overflow-hidden text-xs text-davinci-black">
            {/* Phone Whatsapp Header */}
            <div className="bg-[#f0f2f5] px-3.5 py-2.5 border-b border-zinc-200 flex items-center justify-between h-14 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-davinci-gold/20 border border-davinci-gold flex items-center justify-center text-[10px] font-bold text-davinci-gold">
                  DV
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-davinci-black flex items-center gap-1 leading-none">
                    Da Vinci Premium
                  </h4>
                  <span className="text-[8px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
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

            {/* Sandbox Title */}
            <div className="bg-davinci-gold/10 border-b border-davinci-gold/20 px-3 py-1.5 text-[8px] text-davinci-gold text-center font-bold uppercase tracking-wider flex items-center justify-center gap-1 shrink-0">
              <Smartphone className="h-3 w-3" />
              Sandbox Cliente
            </div>

            {/* Simulated Chat Messages List */}
            <div 
              className="flex-1 p-3 overflow-y-auto space-y-2 relative bg-[#efeae2]"
              style={{
                backgroundImage: 'radial-gradient(#d3c3a9 0.5px, transparent 0.5px), radial-gradient(#d3c3a9 0.5px, #efeae2 0.5px)',
                backgroundSize: '16px 16px',
                backgroundPosition: '0 0, 8px 8px',
                opacity: 0.95
              }}
            >
              {chats.map((msg: any) => {
                const isCustomer = msg.tipo === 'RECEIVED';
                return (
                  <div
                    key={msg.id}
                    className={`p-2.5 rounded-lg max-w-[80%] text-[11px] leading-relaxed shadow-sm relative ${
                      isCustomer
                        ? 'bg-[#d9fdd3] text-davinci-black ml-auto rounded-tr-none'
                        : 'bg-white text-davinci-black mr-auto rounded-tl-none border border-zinc-200/60'
                    }`}
                  >
                    {msg.mensagem}
                    <div className="flex justify-end items-center gap-0.5 mt-1 text-[7px] text-davinci-gray select-none leading-none">
                      <span>{new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      {isCustomer && <CheckCheck className="h-2.5 w-2.5 text-sky-500 inline" />}
                    </div>
                  </div>
                );
              })}

              {typing && (
                <div className="bg-white border border-zinc-200/60 text-davinci-gray mr-auto p-2 rounded-lg text-[10px] italic flex items-center gap-1.5 shadow-sm rounded-tl-none">
                  <span>Digitando</span>
                  <span className="flex gap-0.5">
                    <span className="w-1 h-1 bg-davinci-gold rounded-full animate-bounce" />
                    <span className="w-1 h-1 bg-davinci-gold rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1 h-1 bg-davinci-gold rounded-full animate-bounce [animation-delay:0.4s]" />
                  </span>
                </div>
              )}

              <div ref={chatEndRefCustomer} />
            </div>

            {/* Input keyboard Area */}
            <form onSubmit={handleCustomerSend} className="p-2.5 bg-[#f0f2f5] border-t border-zinc-200 flex gap-2 items-center h-14 shrink-0 z-10">
              <input
                type="text"
                value={customerText}
                onChange={(e) => setCustomerText(e.target.value)}
                placeholder="Mensagem do cliente..."
                className="flex-1 bg-white border border-zinc-200 rounded-full px-4 py-2 text-[11px] text-davinci-black focus:outline-none focus:border-davinci-gold shadow-sm"
              />
              <button
                type="submit"
                className="p-2 rounded-full bg-davinci-gold text-white hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md flex items-center justify-center shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>

          {/* iPhone Home indicator */}
          <div className="h-1.5 w-28 bg-zinc-300 rounded-full mx-auto mb-2 mt-1 z-30 shrink-0" />
        </div>
      </div>
    </div>
  );
}
