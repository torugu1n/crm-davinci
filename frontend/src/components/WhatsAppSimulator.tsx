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
  Save,
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

const EMOJI_CATEGORIES = [
  {
    name: '😀 Carinhas',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🫣', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🫠', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '😵‍💫', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕']
  },
  {
    name: '👍 Gestos',
    emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸']
  },
  {
    name: '❤️ Símbolos',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '🌟', '⭐', '✨', '⚡', '💥', '🔥', '🌈', '☀️', '☁️', '❄️', '💧', '💦', '💨', '💤', '💯', '💢', '💥', '💫', '🕳️', '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭']
  },
  {
    name: '🎉 Festas',
    emojis: ['🎉', '🎊', '🎈', '🎁', '🎀', '🧧', '🎂', '🧁', '🍬', '🍭', '🍫', '🍿', '🍩', '🍪', '🍻', '🥂', '🍷', '🍹', '🧉', '🥤', '🔔', '📣', '📢', '🎙️', '📻', '🎷', '🎸', '🎹', '🎺', '🎻', '🥁', '🔮', '🧿', '💈']
  }
];

export default function WhatsAppSimulator() {
  const queryClient = useQueryClient();
  const token = useStore((state) => state.token);
  
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [operatorText, setOperatorText] = useState('');
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

  // Emoji picker & File upload states
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiTab, setActiveEmojiTab] = useState(0);
  const [hoveredQuickReplyText, setHoveredQuickReplyText] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Edit Client States
  const [editNome, setEditNome] = useState('');
  const [editTelefone, setEditTelefone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPreferences, setEditPreferences] = useState('');
  const [editObservacoes, setEditObservacoes] = useState('');
  const [editAssignedBarberId, setEditAssignedBarberId] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [newTagText, setNewTagText] = useState('');

  const chatEndRefOperator = useRef<HTMLDivElement | null>(null);
  const operatorInputRef = useRef<HTMLInputElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const quickRepliesRef = useRef<HTMLDivElement | null>(null);

  // Fetch clients
  const { data: rawClients } = useQuery({
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
  const clients = rawClients || [];

  // Fetch chat history for selected client
  const { data: rawHistory } = useQuery({
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
  const history = rawHistory || [];

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

  const clientList = Array.isArray(clients) ? clients : [];
  const selectedClient = clientList.find((c: any) => c.id === selectedClientId);

  useEffect(() => {
    if (Array.isArray(rawHistory)) {
      setChats(rawHistory);
    }
  }, [rawHistory]);

  // Set default selected client
  useEffect(() => {
    const clientList = Array.isArray(rawClients) ? rawClients : [];
    if (clientList.length > 0 && !selectedClientId) {
      setSelectedClientId(clientList[0].id);
    }
  }, [rawClients, selectedClientId]);

  // Sync client details fields for editing
  useEffect(() => {
    if (selectedClient) {
      setEditNome(selectedClient.nome || '');
      setEditTelefone(selectedClient.telefone || '');
      setEditEmail(selectedClient.email || '');
      setEditPreferences(selectedClient.preferences || '');
      setEditObservacoes(selectedClient.observacoes || '');
      setEditAssignedBarberId(selectedClient.assignedBarberId || '');
      setEditTags(selectedClient.tags || []);
    }
  }, [selectedClientId, selectedClient]);

  // Click outside listener to close popovers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (showEmojiPicker && emojiPickerRef.current && !emojiPickerRef.current.contains(target)) {
        setShowEmojiPicker(false);
      }
      if (showQuickReplies && quickRepliesRef.current && !quickRepliesRef.current.contains(target)) {
        setShowQuickReplies(false);
        setHoveredQuickReplyText(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker, showQuickReplies]);

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
  }, [chats, typing]);

  // Mutations
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
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/clients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }).then((res) => {
        if (!res.ok) throw new Error('Erro ao atualizar cliente');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Erro ao salvar alterações.');
    }
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

  const handleOperatorSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!operatorText.trim() || !selectedClientId) return;
    operatorSendMutation.mutate({
      clientId: selectedClientId,
      mensagem: operatorText,
    });
    setShowEmojiPicker(false);
    setShowQuickReplies(false);
  };

  const insertEmoji = (emoji: string) => {
    const input = operatorInputRef.current;
    if (input) {
      const start = input.selectionStart ?? 0;
      const end = input.selectionEnd ?? 0;
      const text = operatorText;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      const newText = before + emoji + after;
      setOperatorText(newText);
      
      const newCursorPos = start + emoji.length;
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    } else {
      setOperatorText((prev) => prev + emoji);
    }
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedClientId) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      const isImage = file.type.startsWith('image/');
      
      let formattedMsg = '';
      if (isImage) {
        formattedMsg = `[IMAGE:${base64Data}|${file.name}]`;
      } else {
        formattedMsg = `[FILE:${file.name}|${file.size}|${file.type}]`;
      }

      operatorSendMutation.mutate({
        clientId: selectedClientId,
        mensagem: formattedMsg,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const renderMessageContent = (text: string) => {
    if (text.startsWith('[IMAGE:') && text.includes('|')) {
      const match = text.match(/^\[IMAGE:(.+)\|(.+)\]$/);
      if (match) {
        const [_, base64, filename] = match;
        return (
          <div className="space-y-1">
            <img src={base64} alt={filename} className="max-w-full rounded-md max-h-48 object-cover border border-zinc-200/50" />
            <span className="block text-[8px] text-zinc-500 italic truncate">{filename}</span>
          </div>
        );
      }
    }

    if (text.startsWith('[FILE:') && text.includes('|')) {
      const match = text.match(/^\[FILE:(.+)\|(.+)\|(.+)\]$/);
      if (match) {
        const [_, filename, sizeStr, mimeType] = match;
        const size = parseInt(sizeStr, 10);
        const formattedSize = size > 1024 * 1024 
          ? `${(size / (1024 * 1024)).toFixed(1)} MB` 
          : `${(size / 1024).toFixed(0)} KB`;
        
        return (
          <div className="flex items-center gap-2.5 p-2 bg-zinc-50/80 rounded-lg border border-zinc-200/50 min-w-[180px]">
            <div className="p-2 bg-davinci-gold/15 text-davinci-gold rounded-lg shrink-0">
              <Paperclip className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1 leading-normal">
              <p className="font-semibold truncate text-[10px] text-davinci-black">{filename}</p>
              <span className="text-[8px] text-zinc-400 block">{formattedSize} • {mimeType.split('/')[1]?.toUpperCase() || 'Arquivo'}</span>
            </div>
          </div>
        );
      }
    }

    return <p>{text}</p>;
  };



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
    <div className="bg-zinc-100 rounded-2xl overflow-hidden flex flex-col h-[680px] border border-zinc-300 shadow-xl relative w-full">
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
          <div className={`flex bg-white overflow-hidden h-full ${mobileView === 'chat' ? 'flex' : 'hidden md:flex'} relative`}>
            
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
                          {renderMessageContent(msg.mensagem)}
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
                    <div ref={quickRepliesRef} className="absolute bottom-16 left-4 bg-white border border-zinc-200 rounded-xl p-3 shadow-2xl z-20 w-72 max-h-48 overflow-y-auto space-y-2">
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
                            onMouseEnter={() => setHoveredQuickReplyText(qr.conteudo)}
                            onMouseLeave={() => setHoveredQuickReplyText(null)}
                            className="w-full text-left p-2 hover:bg-zinc-50 rounded-lg text-xs leading-snug border border-zinc-100 hover:border-zinc-200 transition-colors"
                            title={qr.conteudo}
                          >
                            <strong className="block text-[9px] uppercase text-davinci-gold tracking-wider mb-0.5">{qr.titulo}</strong>
                            <span className="text-davinci-black line-clamp-2">{qr.conteudo}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {/* Quick Replies Tooltip Preview */}
                  {showQuickReplies && hoveredQuickReplyText && (
                    <div className="absolute bottom-16 left-[304px] bg-zinc-950/95 text-white border border-zinc-800 rounded-xl p-3 shadow-2xl z-30 w-80 max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                      <div className="text-[9px] font-bold text-davinci-gold uppercase tracking-wider mb-1.5 pb-1 border-b border-zinc-800 flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3 text-davinci-gold fill-davinci-gold" />
                        Visualização Completa
                      </div>
                      <div className="text-xs font-medium text-zinc-300">{hoveredQuickReplyText}</div>
                    </div>
                  )}

                  {/* Emoji Picker Popover */}
                  {showEmojiPicker && (
                    <div ref={emojiPickerRef} className="absolute bottom-16 left-4 bg-white border border-zinc-200 rounded-xl p-3 shadow-2xl z-20 w-72 h-64 flex flex-col">
                      <div className="flex justify-between items-center pb-2 border-b border-zinc-100 shrink-0">
                        <span className="text-[10px] font-bold text-davinci-gray uppercase tracking-widest flex items-center gap-1">
                          <Smile className="h-3.5 w-3.5 text-davinci-gold fill-davinci-gold/20" />
                          Emojis
                        </span>
                        <button onClick={() => setShowEmojiPicker(false)} className="text-davinci-gray hover:text-davinci-black cursor-pointer">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {/* Tabs */}
                      <div className="flex gap-1.5 py-1.5 overflow-x-auto scrollbar-none shrink-0 border-b border-zinc-50">
                        {EMOJI_CATEGORIES.map((cat, idx) => (
                          <button
                            key={cat.name}
                            type="button"
                            onClick={() => setActiveEmojiTab(idx)}
                            className={`px-2 py-0.5 rounded text-[9px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                              activeEmojiTab === idx
                                ? 'bg-davinci-gold/15 text-davinci-gold'
                                : 'text-davinci-gray hover:bg-zinc-50'
                            }`}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>

                      {/* Emoji Grid */}
                      <div className="flex-1 overflow-y-auto p-1.5 grid grid-cols-6 gap-2 mt-1.5">
                        {EMOJI_CATEGORIES[activeEmojiTab].emojis.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => insertEmoji(emoji)}
                            className="text-lg hover:scale-125 transition-transform p-1 cursor-pointer hover:bg-zinc-50 rounded flex items-center justify-center h-8 w-8"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {/* Barra de Digitação */}
                  <form onSubmit={handleOperatorSend} className="p-2.5 bg-[#f0f2f5] border-t border-zinc-200 flex gap-2 items-center h-14 shrink-0 z-10">
                    <div className="flex gap-2 text-zinc-500">
                      <Smile
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowEmojiPicker(!showEmojiPicker);
                          setShowQuickReplies(false);
                        }}
                        className={`h-5 w-5 cursor-pointer hover:text-davinci-black transition-colors ${showEmojiPicker ? 'text-davinci-gold' : ''}`}
                      />
                      <Paperclip
                        onClick={() => fileInputRef.current?.click()}
                        className="h-5 w-5 cursor-pointer hover:text-davinci-black transition-colors"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowQuickReplies(!showQuickReplies);
                          setShowEmojiPicker(false);
                        }}
                        className={`p-0.5 rounded transition-colors cursor-pointer ${showQuickReplies ? 'text-davinci-gold bg-davinci-gold/15' : 'hover:text-davinci-black'}`}
                        title="Respostas rápidas"
                      >
                        <Zap className="h-5 w-5" />
                      </button>
                    </div>

                    <input
                      ref={operatorInputRef}
                      type="text"
                      value={operatorText}
                      onChange={(e) => setOperatorText(e.target.value)}
                      placeholder="Mensagem..."
                      className="flex-1 min-w-0 bg-white border border-zinc-200 rounded-full px-4 py-2 text-xs text-davinci-black focus:outline-none focus:border-davinci-gold shadow-sm"
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
              <div className="absolute md:relative right-0 top-0 h-full w-[280px] border-l border-zinc-200 bg-white flex flex-col overflow-hidden shrink-0 shadow-2xl md:shadow-none z-20 md:z-auto animate-slide-in">
                
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
                      {editNome ? editNome.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <span className="font-bold text-davinci-black text-sm">{editNome || selectedClient.nome}</span>
                    <span className="text-[10px] text-davinci-gray mt-1 block">{editTelefone || selectedClient.telefone}</span>
                  </div>

                  {/* Status Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-davinci-gray block">Status da Conversa</label>
                    <select
                      value={selectedClient.chatStatus}
                      onChange={(e) => updateClientMutation.mutate({ id: selectedClient.id, payload: { chatStatus: e.target.value } })}
                      className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs text-davinci-black focus:outline-none focus:border-davinci-gold font-semibold cursor-pointer"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Operator dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-davinci-gray block">Contato atribuído a</label>
                    <select
                      value={editAssignedBarberId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditAssignedBarberId(val);
                        updateClientMutation.mutate({ id: selectedClient.id, payload: { assignedBarberId: val || null } });
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs text-davinci-black focus:outline-none focus:border-davinci-gold font-semibold cursor-pointer"
                    >
                      <option value="">Ninguém</option>
                      {barbers.map((b: any) => (
                        <option key={b.id} value={b.id}>{b.user.nome}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-davinci-gray block flex items-center gap-1">
                      <Tags className="h-3.5 w-3.5 text-davinci-gold" />
                      Etiquetas
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {editTags.length === 0 ? (
                        <span className="text-[9px] text-zinc-400 italic">Sem etiquetas</span>
                      ) : (
                        editTags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-davinci-gold/10 text-davinci-gold font-bold text-[9px] uppercase border border-davinci-gold/20"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => {
                                const newTags = editTags.filter((t) => t !== tag);
                                setEditTags(newTags);
                                updateClientMutation.mutate({ id: selectedClient.id, payload: { tags: newTags } });
                              }}
                              className="hover:text-red-500 font-bold ml-0.5 cursor-pointer text-[10px]"
                            >
                              ×
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Adicionar etiqueta..."
                        value={newTagText}
                        onChange={(e) => setNewTagText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (!newTagText.trim()) return;
                            const cleanTag = newTagText.trim();
                            if (editTags.includes(cleanTag)) return;
                            const newTags = [...editTags, cleanTag];
                            setEditTags(newTags);
                            setNewTagText('');
                            updateClientMutation.mutate({ id: selectedClient.id, payload: { tags: newTags } });
                          }
                        }}
                        className="flex-1 px-2 py-1 bg-white border border-zinc-200 rounded text-[10px] focus:outline-none focus:border-davinci-gold"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newTagText.trim()) return;
                          const cleanTag = newTagText.trim();
                          if (editTags.includes(cleanTag)) return;
                          const newTags = [...editTags, cleanTag];
                          setEditTags(newTags);
                          setNewTagText('');
                          updateClientMutation.mutate({ id: selectedClient.id, payload: { tags: newTags } });
                        }}
                        className="px-2 py-1 bg-davinci-gold text-white rounded text-[10px] font-bold hover:bg-davinci-gold-hover cursor-pointer"
                      >
                        +
                      </button>
                    </div>
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

                  {/* Dados Cadastrais editáveis */}
                  <div className="space-y-3.5 pt-3 border-t border-zinc-100">
                    <h5 className="font-bold text-[10px] uppercase text-davinci-gray tracking-wider">Dados do Cadastro</h5>
                    
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-davinci-gray mb-1">Nome Exibição</label>
                      <input
                        type="text"
                        value={editNome}
                        onChange={(e) => setEditNome(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs text-davinci-black focus:outline-none focus:border-davinci-gold"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase font-bold text-davinci-gray mb-1">Telefone</label>
                      <input
                        type="text"
                        value={editTelefone}
                        onChange={(e) => setEditTelefone(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs text-davinci-black focus:outline-none focus:border-davinci-gold"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase font-bold text-davinci-gray mb-1">E-mail</label>
                      <input
                        type="email"
                        placeholder="email@exemplo.com"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs text-davinci-black focus:outline-none focus:border-davinci-gold"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase font-bold text-davinci-gray mb-1">Preferências</label>
                      <textarea
                        rows={2}
                        value={editPreferences}
                        onChange={(e) => setEditPreferences(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs text-davinci-black focus:outline-none focus:border-davinci-gold resize-none leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase font-bold text-davinci-gray mb-1">Observações</label>
                      <textarea
                        rows={2}
                        value={editObservacoes}
                        onChange={(e) => setEditObservacoes(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs text-davinci-black focus:outline-none focus:border-davinci-gold resize-none leading-relaxed"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        updateClientMutation.mutate({
                          id: selectedClient.id,
                          payload: {
                            nome: editNome,
                            telefone: editTelefone,
                            email: editEmail || null,
                            preferences: editPreferences,
                            observacoes: editObservacoes,
                          }
                        });
                      }}
                      disabled={updateClientMutation.isPending}
                      className="w-full py-2 bg-gold-gradient rounded-lg text-xs text-davinci-black font-bold hover:scale-[1.01] active:scale-[0.99] transition-transform cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Save className="h-3.5 w-3.5 text-davinci-black" />
                      {updateClientMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
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
  );
}
