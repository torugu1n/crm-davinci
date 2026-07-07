'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createSupabaseClient } from '@/lib/supabaseClient';
import QRCode from 'qrcode';
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
  Link,
  QrCode,
  ShieldCheck,
  RefreshCw,
  LogOut,
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

function Avatar({ src, name, className, fallbackSizeClass = 'text-xs' }: { src?: string | null; name: string; className: string; fallbackSizeClass?: string }) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  if (src && !error) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setError(true)}
        className={className}
      />
    );
  }

  const initial = name ? name.trim().charAt(0).toUpperCase() : '?';
  return (
    <div className={`${className} bg-davinci-gold/10 border border-davinci-gold/25 flex items-center justify-center font-bold text-davinci-gold shrink-0`}>
      <span className={fallbackSizeClass}>{initial}</span>
    </div>
  );
}

export default function WhatsAppSimulator() {
  const queryClient = useQueryClient();
  const token = useStore((state) => state.token);
  const tenant = useStore((state) => state.tenant);

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [operatorText, setOperatorText] = useState('');
  const [chats, setChats] = useState<any[]>([]);
  const [typing, setTyping] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  // WhatsApp connection states
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [qrImageSrc, setQrImageSrc] = useState<string | null>(null);
  const [isSimulatedConn, setIsSimulatedConn] = useState(false);
  const [isConnectionStarted, setIsConnectionStarted] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

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
  const [editChatbotEnabled, setEditChatbotEnabled] = useState(true);

  const chatEndRefOperator = useRef<HTMLDivElement | null>(null);
  const operatorInputRef = useRef<HTMLInputElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const quickRepliesRef = useRef<HTMLDivElement | null>(null);

  // Simular Novo Contato States
  const [showNewContactModal, setShowNewContactModal] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactMessage, setNewContactMessage] = useState('Olá! Gostaria de fazer um agendamento.');
  const [creatingContact, setCreatingContact] = useState(false);

  // Simular Mensagem do Cliente na conversa ativa
  const [simulatedCustomerText, setSimulatedCustomerText] = useState('');
  const [sendingSimulatedCustomerMessage, setSendingSimulatedCustomerMessage] = useState(false);

  const handleSendSimulatedCustomerMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatedCustomerText.trim() || !selectedClientId) return;

    setSendingSimulatedCustomerMessage(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/whatsapp/customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientId: selectedClientId,
          mensagem: simulatedCustomerText.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao simular mensagem');

      setSimulatedCustomerText('');
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['chatHistory', selectedClientId] });
    } catch (err: any) {
      alert(err.message || 'Erro ao simular mensagem.');
    } finally {
      setSendingSimulatedCustomerMessage(false);
    }
  };

  // 1. Fetch WhatsApp Status & Polling
  const { data: whatsappConn, isLoading: connLoading } = useQuery({
    queryKey: ['whatsappStatus'],
    queryFn: () =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/whatsapp/instance/status`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        if (!res.ok) throw new Error('Erro ao obter status do WhatsApp');
        return res.json();
      }),
    refetchInterval: (query) => {
      const conn = query.state.data as any;
      return conn?.status === 'CONNECTING' ? 3000 : false;
    },
    enabled: !!token,
  });

  // Mutations for WhatsApp Connection
  const connectMutation = useMutation({
    mutationFn: () =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/whatsapp/instance/connect`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || 'Falha ao iniciar conexão do WhatsApp');
        }
        return data;
      }),
    onSuccess: (data) => {
      setQrCodeData(data.qrcode);
      setIsSimulatedConn(data.simulated);
      setIsConnectionStarted(data.status !== 'CONNECTED');
      setConnectionError(null);
      queryClient.invalidateQueries({ queryKey: ['whatsappStatus'] });
    },
    onError: (err: any) => {
      setConnectionError(err.message || 'Falha ao iniciar conexão do WhatsApp');
      setIsConnectionStarted(false);
      alert(`Falha ao iniciar conexão: ${err.message}`);
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/whatsapp/instance/disconnect`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || 'Falha ao desconectar WhatsApp');
        }
        return data;
      }),
    onSuccess: () => {
      setQrCodeData(null);
      setIsConnectionStarted(false);
      setConnectionError(null);
      queryClient.invalidateQueries({ queryKey: ['whatsappStatus'] });
      alert('WhatsApp desconectado com sucesso.');
    },
  });

  const simulateSuccessMutation = useMutation({
    mutationFn: () =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/whatsapp/instance/simulate-success`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsappStatus'] });
      setIsConnectionStarted(false);
      setConnectionError(null);
      alert('Simulação de conexão ativa realizada!');
    },
  });

  const handleCreateContactAndSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim() || !newContactMessage.trim()) return;

    setCreatingContact(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

      // 1. Create client
      const clientRes = await fetch(`${apiUrl}/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          nome: newContactName.trim(),
          telefone: newContactPhone.trim(),
        }),
      });

      const clientData = await clientRes.json();
      if (!clientRes.ok) {
        throw new Error(clientData.message || 'Falha ao criar cliente');
      }

      // 2. Simulate client message
      const msgRes = await fetch(`${apiUrl}/whatsapp/customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientId: clientData.id,
          mensagem: newContactMessage.trim(),
        }),
      });

      const msgData = await msgRes.json();
      if (!msgRes.ok) {
        throw new Error(msgData.message || 'Falha ao enviar mensagem de simulação');
      }

      // 3. Invalidate queries & reset states
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setSelectedClientId(clientData.id);
      setNewContactName('');
      setNewContactPhone('');
      setNewContactMessage('Olá! Gostaria de fazer um agendamento.');
      setShowNewContactModal(false);
    } catch (err: any) {
      alert(err.message || 'Erro durante a simulação.');
    } finally {
      setCreatingContact(false);
    }
  };

  // Fetch clients
  const { data: rawClients } = useQuery({
    queryKey: ['clients'],
    queryFn: () =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/clients`, {
        headers: {
          Authorization: `Bearer ${token}`,
          ...(tenant?.subdomain ? { 'x-tenant-subdomain': tenant.subdomain } : {}),
        },
      }).then((res) => {
        if (!res.ok) throw new Error('Falha ao carregar clientes');
        return res.json();
      }),
    enabled: !!token && whatsappConn?.status === 'CONNECTED',
    retry: false,
    refetchInterval: 5000,
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
    enabled: !!selectedClientId && !!token && whatsappConn?.status === 'CONNECTED',
  });
  const history = rawHistory || [];

  // Fetch Barbers for quick booking
  const { data: barbers = [] } = useQuery({
    queryKey: ['barbers'],
    queryFn: () =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/barbers`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(tenant?.subdomain ? { 'x-tenant-subdomain': tenant.subdomain } : {}),
        },
      }).then((res) => {
        if (!res.ok) throw new Error('Falha ao carregar profissionais');
        return res.json();
      }),
    enabled: !!token && whatsappConn?.status === 'CONNECTED',
    retry: false,
  });

  // Fetch Services for quick booking
  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/services`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(tenant?.subdomain ? { 'x-tenant-subdomain': tenant.subdomain } : {}),
        },
      }).then((res) => {
        if (!res.ok) throw new Error('Falha ao carregar serviços');
        return res.json();
      }),
    enabled: !!token && whatsappConn?.status === 'CONNECTED',
    retry: false,
  });

  // Fetch Quick Replies
  const { data: quickReplies = [] } = useQuery({
    queryKey: ['quickReplies'],
    queryFn: () =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/whatsapp/quick-replies`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),
    enabled: !!token && whatsappConn?.status === 'CONNECTED',
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
      setEditChatbotEnabled(selectedClient.chatbotEnabled !== false);
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

  // Supabase Realtime listener
  useEffect(() => {
    if (whatsappConn?.status !== 'CONNECTED' || !token) return;

    const supabase = createSupabaseClient(token);

    const channel = supabase
      .channel('whatsapp-simulator')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload: any) => {
          queryClient.invalidateQueries({ queryKey: ['clients'] });
          const newMessage = payload.new;
          const camelCaseMessage = {
            id: newMessage.id,
            clientId: newMessage.client_id,
            mensagem: newMessage.mensagem,
            tipo: newMessage.tipo,
            createdAt: newMessage.created_at,
          };

          if (camelCaseMessage.clientId === selectedClientId) {
            if (camelCaseMessage.tipo === 'SENT') {
              setTyping(true);
              setTimeout(() => {
                setTyping(false);
                setChats((prev) => [...prev, camelCaseMessage]);
                queryClient.invalidateQueries({ queryKey: ['chatHistory', selectedClientId] });
                queryClient.invalidateQueries({ queryKey: ['appointments'] });
              }, 800);
            } else {
              setChats((prev) => [...prev, camelCaseMessage]);
              queryClient.invalidateQueries({ queryKey: ['chatHistory', selectedClientId] });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'clients' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['clients'] });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tenants' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['whatsappStatus'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedClientId, queryClient, whatsappConn?.status, token]);

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
            <a href={base64} target="_blank" rel="noopener noreferrer" className="block cursor-zoom-in group">
              <img src={base64} alt={filename} className="max-w-full rounded-md max-h-48 object-cover border border-zinc-200/50 group-hover:opacity-90 transition-opacity" />
              <span className="block text-[8px] text-zinc-500 italic truncate mt-1 group-hover:text-davinci-gold transition-colors">{filename}</span>
            </a>
          </div>
        );
      }
    }

    if (text.startsWith('[FILE:') && text.includes('|')) {
      const parts = text.slice(6, -1).split('|');
      if (parts.length >= 3) {
        let url = '';
        let filename = '';
        let sizeStr = '';
        let mimeType = '';

        if (parts.length === 4) {
          [url, filename, sizeStr, mimeType] = parts;
        } else {
          [filename, sizeStr, mimeType] = parts;
        }

        const size = parseInt(sizeStr, 10) || 0;
        const formattedSize = size > 1024 * 1024
          ? `${(size / (1024 * 1024)).toFixed(1)} MB`
          : size > 0
          ? `${(size / 1024).toFixed(0)} KB`
          : 'Tamanho desconhecido';

        const content = (
          <div className="flex items-center gap-2.5 p-2 bg-zinc-50/80 rounded-lg border border-zinc-200/50 min-w-[180px] hover:bg-zinc-100/80 transition-colors">
            <div className="p-2 bg-davinci-gold/15 text-davinci-gold rounded-lg shrink-0">
              <Paperclip className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1 leading-normal">
              <p className="font-bold truncate text-[10px] text-davinci-black">{filename}</p>
              <span className="text-[8px] text-zinc-400 block mt-0.5">{formattedSize} • {mimeType.split('/')[1]?.toUpperCase() || 'Arquivo'}</span>
            </div>
          </div>
        );

        if (url) {
          return (
            <a href={url} target="_blank" rel="noopener noreferrer" className="block no-underline hover:scale-[1.01] active:scale-[0.99] transition-transform">
              {content}
            </a>
          );
        }
        return content;
      }
    }

    return <p>{text}</p>;
  };

  const formatPhoneInput = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.substring(0, 2)}) ${numbers.substring(2)}`;
    return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 7)}-${numbers.substring(7, 11)}`;
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

  useEffect(() => {
    if (whatsappConn?.status === 'CONNECTED') {
      setIsConnectionStarted(false);
      setConnectionError(null);
    }
  }, [whatsappConn?.status]);

  useEffect(() => {
    let isMounted = true;

    const buildQrImage = async () => {
      if (!qrCodeData || qrCodeData === 'MOCK_QR_CODE_DATA') {
        setQrImageSrc(null);
        return;
      }

      const payload = qrCodeData.trim();
      const imageBase64Prefixes = ['iVBOR', '/9j/', 'R0lGOD', 'UklGR'];
      const isImagePayload = payload.startsWith('data:image')
        || imageBase64Prefixes.some((prefix) => payload.startsWith(prefix));

      if (isImagePayload) {
        const src = payload.startsWith('data:image') ? payload : `data:image/png;base64,${payload}`;
        if (isMounted) setQrImageSrc(src);
        return;
      }

      const dataUrl = await QRCode.toDataURL(payload, {
        width: 192,
        margin: 1,
        errorCorrectionLevel: 'M',
      });
      if (isMounted) setQrImageSrc(dataUrl);
    };

    buildQrImage().catch(() => {
      if (isMounted) setQrImageSrc(null);
    });

    return () => {
      isMounted = false;
    };
  }, [qrCodeData]);

  if (connLoading) {
    return (
      <div className="flex items-center justify-center p-24 bg-white border border-zinc-200 rounded-2xl h-[550px] shadow-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-2 border-davinci-gold border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-davinci-gray uppercase tracking-widest">Carregando status do canal...</span>
        </div>
      </div>
    );
  }

  const isConnected = whatsappConn?.status === 'CONNECTED';
  const isConnecting = whatsappConn?.status === 'CONNECTING' || isConnectionStarted;

  // RENDER ONBOARDING & QR CODE GENERATION SCREEN
  if (!isConnected) {
    return (
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-lg p-8 max-w-4xl mx-auto flex flex-col md:flex-row gap-12 items-center min-h-[500px]">
        {/* Onboarding info */}
        <div className="flex-1 space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] text-davinci-gold uppercase font-bold tracking-widest bg-davinci-gold/10 border border-davinci-gold/20 px-3 py-1 rounded-full">
              Atendimento WhatsApp
            </span>
            <h2 className="text-2xl font-black text-davinci-black">Conecte o WhatsApp do seu Estabelecimento</h2>
            <p className="text-xs text-davinci-gray leading-relaxed">
              Vincule o número oficial do seu salão ou barbearia para que o CRM envie lembretes, responda clientes e faça agendamentos de forma 100% automatizada.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {[
              { title: 'Chatbot Integrado', desc: 'Atendente virtual agenda horários direto com o cliente.' },
              { title: 'Confirmação Ativa', desc: 'Envio automático de lembretes reduzindo faltas em até 85%.' },
              { title: 'Multitenancy Isolado', desc: 'Sua barbearia usa o próprio chip, sem misturar com outros estabelecimentos.' },
            ].map((benefit, idx) => (
              <div key={idx} className="flex gap-3 items-start">
                <div className="p-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 mt-0.5 shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="leading-tight text-xs">
                  <h4 className="font-bold text-davinci-black">{benefit.title}</h4>
                  <p className="text-davinci-gray mt-0.5">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Panel: QR Code / Generator */}
        <div className="w-full md:w-[360px] bg-zinc-50 border border-zinc-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-6 shrink-0 relative overflow-hidden min-h-[360px]">
          {isConnecting ? (
            <div className="space-y-5 w-full flex flex-col items-center">
              <h4 className="text-xs font-bold text-davinci-black uppercase tracking-wider">Leia o QR Code</h4>

              {/* Render QR code */}
              <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-inner flex items-center justify-center w-48 h-48 relative">
                {qrImageSrc ? (
                  <img
                    src={qrImageSrc}
                    alt="WhatsApp QR Code"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <QrCode className="h-16 w-16 text-davinci-gold opacity-30 animate-pulse" />
                    <span className="text-[10px] text-davinci-gray font-bold">QR Code de Simulação</span>
                  </div>
                )}
              </div>

              {/* Simulation success trigger for local development */}
              {(isSimulatedConn || !process.env.NEXT_PUBLIC_API_URL) && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[10px] text-amber-800 leading-normal w-full space-y-2">
                  <p className="font-bold">Modo de Simulação Ativo</p>
                  <p>Clique no botão abaixo para simular que o celular realizou a leitura do QR Code com sucesso.</p>
                  <button
                    onClick={() => simulateSuccessMutation.mutate()}
                    disabled={simulateSuccessMutation.isPending}
                    className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition-colors cursor-pointer border-0 text-[10px]"
                  >
                    {simulateSuccessMutation.isPending ? 'Simulando...' : 'Simular Leitura (Celular)'}
                  </button>
                </div>
              )}

              {/* Instructions */}
              <div className="text-[10px] text-davinci-gray space-y-1 w-full text-left bg-white border border-zinc-200/60 p-3 rounded-xl font-medium">
                <p className="font-bold text-davinci-black uppercase tracking-wider mb-1">Passos para Conexão:</p>
                <p>1. Abra o WhatsApp no celular</p>
                <p>2. Menu (⋮ ou Configurações) → Aparelhos Conectados</p>
                <p>3. Clique em Conectar Aparelho e aponte a câmera</p>
              </div>

              <button
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
                className="text-xs text-red-500 hover:text-red-700 font-bold uppercase tracking-wider cursor-pointer bg-transparent border-0 flex items-center gap-1.5"
              >
                <X className="h-4 w-4" /> Cancelar Conexão
              </button>
            </div>
          ) : (
            <div className="space-y-6 py-6 w-full flex flex-col items-center">
              <div className="p-4 bg-davinci-gold/10 text-davinci-gold border border-davinci-gold/20 rounded-full">
                <Smartphone className="h-10 w-10" />
              </div>
              <div>
                <h4 className="text-sm font-black text-davinci-black">Nenhum aparelho conectado</h4>
                <p className="text-[10px] text-davinci-gray mt-1 leading-normal">
                  Gere o QR Code e faça a autenticação em poucos segundos.
                </p>
              </div>
              {connectionError && (
                <div className="w-full rounded-xl border border-red-200 bg-red-50 p-3 text-left text-[10px] font-semibold leading-relaxed text-red-700">
                  {connectionError}
                </div>
              )}
              <button
                onClick={() => {
                  setConnectionError(null);
                  connectMutation.mutate();
                }}
                disabled={connectMutation.isPending}
                className="w-full py-3 bg-gold-gradient hover:scale-[1.02] active:scale-[0.98] transition-transform text-davinci-black font-bold text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer border-0 flex items-center justify-center gap-2"
              >
                {connectMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Gerando...
                  </>
                ) : (
                  <>
                    <Link className="h-4 w-4" /> Conectar WhatsApp
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // RENDER COMPLETE ACTIVE CHAT INTERFACE
  return (
    <div className="bg-zinc-100 rounded-2xl overflow-hidden flex flex-col h-[680px] border border-[var(--wa-border-color)] shadow-xl relative w-full">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[280px_1fr] divide-x divide-[var(--wa-border-color)] overflow-hidden h-full">

        {/* Chat List (Sidebar Esquerda Whatsapp) */}
        <div className={`flex flex-col bg-[var(--wa-sidebar-bg)] overflow-hidden h-full ${mobileView === 'list' ? 'flex' : 'hidden md:flex'}`}>
          {/* Cabeçalho Whatsapp - Operador */}
          <div className="bg-[var(--wa-header-bg)] p-3 border-b border-[var(--wa-border-color)] flex justify-between items-center h-14 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center font-bold text-xs text-emerald-800 shrink-0">
                WA
              </div>
              <div className="leading-tight">
                <h4 className="text-xs font-bold text-davinci-black">WhatsApp Ativo</h4>
                <span className="text-[8px] text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Conectado
                </span>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setShowNewContactModal(true)}
                className="flex items-center gap-0.5 text-[8px] bg-davinci-gold/25 hover:bg-davinci-gold/35 text-davinci-black font-bold px-2 py-1 rounded transition-colors cursor-pointer border border-davinci-gold/30 shadow-sm shrink-0"
                title="Simular mensagem de novo contato"
              >
                <Plus className="h-3 w-3" />
                Novo
              </button>
              <button
                onClick={() => {
                  if (confirm('Tem certeza de que deseja desconectar este canal de WhatsApp?')) {
                    disconnectMutation.mutate();
                  }
                }}
                disabled={disconnectMutation.isPending}
                className="p-1 rounded hover:bg-red-50 text-davinci-gray hover:text-red-600 transition-colors border border-transparent hover:border-red-100 cursor-pointer"
                title="Desconectar Celular"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Abas de Filtros por Status */}
          <div className="bg-[var(--wa-sidebar-bg)] px-2 py-1.5 border-b border-[var(--wa-border-color)] flex gap-1 overflow-x-auto scrollbar-none shrink-0">
            {STATUS_FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSelectedStatusFilter(tab.value)}
                className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
                  selectedStatusFilter === tab.value
                    ? 'bg-davinci-gold text-white font-extrabold'
                    : 'bg-zinc-100 text-davinci-gray hover:bg-zinc-200/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Pesquisa */}
          <div className="p-2 border-b border-[var(--wa-border-color)] bg-[var(--wa-search-bg)] shrink-0">
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
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--wa-border-color)] bg-[var(--wa-sidebar-bg)]">
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
                  <Avatar
                    src={c.fotoUrl}
                    name={c.nome}
                    className="w-10 h-10 rounded-full object-cover border border-davinci-gold/20 shrink-0"
                    fallbackSizeClass="text-xs"
                  />
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-bold text-davinci-black truncate">{c.nome}</span>
                      <span className="text-[8px] text-davinci-gray font-light">
                        {c.createdAt ? new Date(c.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </span>
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
        <div className={`flex bg-[var(--wa-sidebar-bg)] overflow-hidden h-full ${mobileView === 'chat' ? 'flex' : 'hidden md:flex'} relative`}>

          {/* Bloco Chat Central */}
          <div className="flex-1 flex flex-col h-full bg-[var(--wa-wallpaper-bg)] relative overflow-hidden">

            {selectedClient ? (
              <>
                {/* Cabeçalho do Chat Ativo */}
                <div className="bg-[var(--wa-header-bg)] p-3 border-b border-[var(--wa-border-color)] flex justify-between items-center h-14 shrink-0 z-10 shadow-sm">
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
                    <Avatar
                      src={selectedClient.fotoUrl}
                      name={selectedClient.nome}
                      className="w-9 h-9 rounded-full object-cover border border-davinci-gold shrink-0"
                      fallbackSizeClass="text-xs"
                    />
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
                  className="flex-1 p-4 overflow-y-auto space-y-3 bg-[var(--wa-wallpaper-bg)] relative"
                  style={{
                    backgroundImage: 'radial-gradient(var(--wa-wallpaper-dots) 0.5px, transparent 0.5px), radial-gradient(var(--wa-wallpaper-dots) 0.5px, var(--wa-wallpaper-bg) 0.5px)',
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
                        className={`p-2.5 rounded-lg max-w-[75%] text-xs leading-relaxed shadow-sm relative animate-message-slide-up ${
                          isOperator
                            ? 'bg-[var(--wa-bubble-sent-bg)] text-[var(--wa-bubble-sent-text)] ml-auto rounded-tr-none'
                            : 'bg-[var(--wa-bubble-recv-bg)] text-[var(--wa-bubble-recv-text)] mr-auto rounded-tl-none border border-[var(--wa-border-color)]'
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
                    <div className="bg-[var(--wa-bubble-recv-bg)] border border-[var(--wa-border-color)] text-[var(--wa-bubble-recv-text)] opacity-80 mr-auto p-2 rounded-lg text-[10px] italic flex items-center gap-1.5 shadow-sm rounded-tl-none">
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
                <form onSubmit={handleOperatorSend} className="p-2.5 bg-[var(--wa-input-container-bg)] border-t border-[var(--wa-border-color)] flex gap-2 items-center h-14 shrink-0 z-10">
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
            <div className="absolute md:relative right-0 top-0 h-full w-[280px] border-l border-[var(--wa-border-color)] bg-[var(--wa-sidebar-bg)] flex flex-col overflow-hidden shrink-0 shadow-2xl md:shadow-none z-20 md:z-auto animate-slide-in">

              {/* Header info */}
              <div className="p-3 bg-[var(--wa-header-bg)] border-b border-[var(--wa-border-color)] flex justify-between items-center h-14 shrink-0">
                <span className="text-xs font-bold text-davinci-black uppercase tracking-wider">Ficha do Cliente</span>
                <button onClick={() => setShowInfoSidebar(false)} className="text-davinci-gray hover:text-davinci-black cursor-pointer">
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* CRM content scroll */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
                {/* Perfil card */}
                <div className="flex flex-col items-center text-center pb-4 border-b border-zinc-100">
                  <Avatar
                    src={selectedClient.fotoUrl}
                    name={editNome || selectedClient.nome}
                    className="w-14 h-14 rounded-full object-cover border-2 border-davinci-gold/30 mb-2 shadow-md"
                    fallbackSizeClass="text-lg"
                  />
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

                {/* Chatbot Toggle */}
                <div className="flex items-center justify-between p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <div className="leading-tight">
                    <span className="font-bold text-[10px] uppercase text-davinci-black tracking-wider block">Chatbot de IA</span>
                    <span className="text-[8px] text-davinci-gray block mt-0.5">
                      {editChatbotEnabled ? 'Ativado (Automático)' : 'Pausado (Manual)'}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editChatbotEnabled}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setEditChatbotEnabled(val);
                        updateClientMutation.mutate({
                          id: selectedClient.id,
                          payload: { chatbotEnabled: val },
                        });
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-davinci-gold"></div>
                  </label>
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
                    className="w-full py-2 bg-[#C5A880] text-black rounded-lg text-xs font-bold hover:scale-[1.01] active:scale-[0.99] transition-transform cursor-pointer shadow-sm flex items-center justify-center gap-1.5 border-0"
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
                        className="w-full p-1 bg-white border border-zinc-200 rounded text-[10px] focus:outline-none focus:border-davinci-gold cursor-pointer"
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
                        className="w-full p-1 bg-white border border-zinc-200 rounded text-[10px] focus:outline-none focus:border-davinci-gold cursor-pointer"
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
                      className="w-full py-1.5 bg-[#C5A880] text-black rounded text-[10px] font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer shadow-sm flex items-center justify-center gap-1 border-0"
                    >
                      {quickBookMutation.isPending ? 'Gravando...' : 'Confirmar Reserva'}
                    </button>
                  </form>
                </div>

                {/* Simulador de Cliente */}
                <div className="space-y-3 pt-3 border-t border-zinc-100">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-davinci-black uppercase tracking-wider">
                    <Sparkles className="h-3.5 w-3.5 text-davinci-gold" />
                    <span>Simular Cliente (Testar Chatbot)</span>
                  </div>

                  <form onSubmit={handleSendSimulatedCustomerMessage} className="space-y-2 bg-zinc-50 border border-zinc-200 p-3 rounded-xl">
                    <p className="text-[9px] text-davinci-gray leading-normal">
                      Escreva e envie mensagens **como se você fosse o cliente** para testar as respostas automáticas do Chatbot com IA.
                    </p>
                    <div className="relative">
                      <textarea
                        required
                        rows={2}
                        value={simulatedCustomerText}
                        onChange={(e) => setSimulatedCustomerText(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-[11px] text-davinci-black focus:outline-none focus:border-davinci-gold resize-none leading-relaxed"
                        placeholder="Ex: Quero agendar um corte amanhã às 14h..."
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={sendingSimulatedCustomerMessage}
                      className="w-full py-1.5 bg-davinci-black text-white rounded text-[10px] font-bold hover:bg-zinc-800 transition-colors cursor-pointer flex items-center justify-center gap-1 border-0"
                    >
                      {sendingSimulatedCustomerMessage ? 'Enviando...' : 'Enviar como Cliente'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Contact Simulation Modal */}
      {showNewContactModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-[#0c0c0e] border border-zinc-800 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/20">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Simular Novo Contato</h3>
                <p className="text-[9px] text-zinc-500">Cria um cliente e simula uma mensagem de WhatsApp recebida.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewContactModal(false)}
                className="text-zinc-500 hover:text-white transition text-xs font-bold bg-transparent border-0 cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateContactAndSimulate} className="p-4 space-y-3.5">
              <div>
                <label className="block text-[9px] uppercase tracking-wider font-bold text-zinc-400 mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#C5A880]"
                  placeholder="Ex: Victor Hugo"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-wider font-bold text-zinc-400 mb-1">WhatsApp / Celular</label>
                <input
                  type="text"
                  required
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(formatPhoneInput(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#C5A880]"
                  placeholder="Ex: (86) 99999-8888"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-wider font-bold text-zinc-400 mb-1">Mensagem Inicial</label>
                <textarea
                  required
                  rows={2}
                  value={newContactMessage}
                  onChange={(e) => setNewContactMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#C5A880] resize-none leading-relaxed"
                  placeholder="Mensagem enviada pelo cliente..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowNewContactModal(false)}
                  className="px-3 py-1.5 text-zinc-400 hover:text-white text-[10px] font-bold uppercase tracking-wider transition-colors bg-transparent border-0 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingContact}
                  className="px-4 py-1.5 bg-[#C5A880] text-black font-bold text-[10px] uppercase tracking-wider rounded-lg hover:bg-[#B39268] transition-colors flex items-center gap-1 shadow cursor-pointer border-0"
                >
                  {creatingContact ? (
                    <span className="h-3 w-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Iniciar Simulação'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
