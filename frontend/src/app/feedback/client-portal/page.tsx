'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Calendar,
  Check,
  CheckCircle,
  Clock3,
  Edit2,
  Gift,
  Heart,
  LogOut,
  Phone,
  Scissors,
  ShieldCheck,
  Sparkles,
  User,
  MapPin,
  Mail,
  Instagram,
  Facebook,
  ExternalLink,
  X,
  CreditCard
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { getLogoUrl } from '@/lib/logo-helper';

function formatBirthdayInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function formatBirthdayDisplay(value?: string | null) {
  if (!value) return 'Nao informado';
  const digits = value.replace(/\D/g, '');
  if (digits.length === 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return value;
}

function getProfessionalCategoryLabel(barber: any) {
  const roles = barber?.user?.roles || [];
  const category = barber?.categoria;

  if (roles.includes('HAIRDRESSER')) return 'Cabeleireiro(a)';
  if (roles.includes('MANICURE_PEDICURE')) return 'Manicure / Pedicure';
  if (roles.includes('BARBER')) return 'Barbeiro';

  switch (category) {
    case 'BARBER':
      return 'Barbeiro';
    case 'HAIRDRESSER':
      return 'Cabeleireiro(a)';
    case 'MANICURE_PEDICURE':
      return 'Manicure / Pedicure';
    default:
      return 'Profissional';
  }
}

export default function ClientPortalPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useStore((state) => state.token);
  const user = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);
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

  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedHour, setSelectedHour] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [editBirthday, setEditBirthday] = useState(false);
  const [birthdayVal, setBirthdayVal] = useState('');

  // Subscription states
  const [payWithCredit, setPayWithCredit] = useState(false);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [selectedPlanForSub, setSelectedPlanForSub] = useState<any>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Progressive billing & compliance details
  const [cpf, setCpf] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [addressZip, setAddressZip] = useState('');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [consentLgpd, setConsentLgpd] = useState(false);

  useEffect(() => {
    if (!token || !user) {
      router.push('/login');
    } else if (user.role !== 'CLIENT') {
      router.push('/dashboard');
    }
  }, [token, user, router]);

  const clientId = user?.id;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

  const { data: client, isLoading } = useQuery({
    queryKey: ['clientPortalProfile', clientId],
    queryFn: () =>
      fetch(`${apiUrl}/clients/${clientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }).then((res) => {
        if (!res.ok) throw new Error('Failed to fetch client');
        return res.json();
      }),
    enabled: !!clientId && !!token,
  });

  useEffect(() => {
    if (client) {
      if (client.aniversario) {
        setBirthdayVal(formatBirthdayDisplay(client.aniversario));
      }
      if (client.email) {
        setBillingEmail(client.email);
      }
      if (client.cpf) {
        setCpf(client.cpf);
      }
      if (client.addressZip) {
        setAddressZip(client.addressZip);
      }
      if (client.addressStreet) {
        setAddressStreet(client.addressStreet);
      }
      if (client.addressNumber) {
        setAddressNumber(client.addressNumber);
      }
      if (client.addressCity) {
        setAddressCity(client.addressCity);
      }
      if (client.addressState) {
        setAddressState(client.addressState);
      }
    }
  }, [client]);

  const updateBirthdayMutation = useMutation({
    mutationFn: (newAniv: string) =>
      fetch(`${apiUrl}/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          nome: client?.nome,
          telefone: client?.telefone,
          aniversario: newAniv,
        }),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Falha ao atualizar aniversario');
        return data;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientPortalProfile', clientId] });
      setEditBirthday(false);
    },
  });

  const { data: barbers = [] } = useQuery({
    queryKey: ['barbers'],
    queryFn: () =>
      fetch(`${apiUrl}/barbers`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      }).then((res) => {
        if (!res.ok) throw new Error('Failed to fetch barbers');
        return res.json();
      }),
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () =>
      fetch(`${apiUrl}/services`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      }).then((res) => {
        if (!res.ok) throw new Error('Failed to fetch services');
        return res.json();
      }),
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: () =>
      fetch(`${apiUrl}/appointments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }).then((res) => {
        if (!res.ok) throw new Error('Failed to fetch appointments');
        return res.json();
      }),
    enabled: !!token,
  });

  // Fetch Work Schedules for selected barber
  const { data: selectedBarberSchedule = [] } = useQuery({
    queryKey: ['barberSchedule', selectedBarber],
    queryFn: () =>
      selectedBarber
        ? fetch(`${apiUrl}/barbers/${selectedBarber}/schedule`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((res) => { if (!res.ok) throw new Error('Failed to fetch schedule'); return res.json(); })
        : Promise.resolve([]),
    enabled: !!selectedBarber && !!token,
  });

  // Fetch Agenda Blocks for selected barber
  const { data: selectedBarberBlocks = [] } = useQuery({
    queryKey: ['barberBlocks', selectedBarber],
    queryFn: () =>
      selectedBarber
        ? fetch(`${apiUrl}/barbers/${selectedBarber}/blocks`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((res) => { if (!res.ok) throw new Error('Failed to fetch blocks'); return res.json(); })
        : Promise.resolve([]),
    enabled: !!selectedBarber && !!token,
  });

  const createAppointmentMutation = useMutation({
    mutationFn: (newApp: any) =>
      fetch(`${apiUrl}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newApp),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Falha ao criar agendamento');
        return data;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientPortalProfile', clientId] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['clientSubscription', clientId] });
      setBookingSuccess(true);
      setSelectedBarber('');
      setSelectedService('');
      setSelectedHour('');
      setPayWithCredit(false);
      setTimeout(() => setBookingSuccess(false), 5000);
    },
  });

  // Fetch client subscription
  const { data: clientSubscription, isLoading: loadingSub } = useQuery({
    queryKey: ['clientSubscription', clientId],
    queryFn: () =>
      fetch(`${apiUrl}/subscriptions/my`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }).then((res) => {
        if (res.status === 404) return null;
        if (!res.ok) throw new Error('Failed to fetch subscription');
        return res.json().catch(() => null);
      }),
    enabled: !!clientId && !!token && !!tenant?.subscriptionModuleEnabled,
  });

  // Fetch available plans
  const { data: availablePlans = [], isLoading: loadingPlans } = useQuery({
    queryKey: ['availablePlans'],
    queryFn: () =>
      fetch(`${apiUrl}/plans`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      }).then((res) => {
        if (!res.ok) throw new Error('Failed to fetch plans');
        return res.json();
      }),
    enabled: !!token && !!tenant?.subscriptionModuleEnabled,
  });

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: (subData: { planId: string; cardDetails: any }) =>
      fetch(`${apiUrl}/subscriptions/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(subData),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Falha ao efetuar assinatura');
        return data;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientSubscription', clientId] });
      setSubModalOpen(false);
      setCardNumber('');
      setCardName('');
      setCardExpiry('');
      setCardCvv('');
      setSelectedPlanForSub(null);
      alert('Sua assinatura foi ativada com sucesso! Agora você possui cortes ilimitados.');
    },
    onError: (err: any) => {
      alert(err.message || 'Erro ao processar a assinatura.');
    },
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: (subId: string) =>
      fetch(`${apiUrl}/subscriptions/cancel/${subId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Falha ao cancelar assinatura');
        return data;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientSubscription', clientId] });
      alert('Sua assinatura foi cancelada. O acesso ilimitado continuará disponível até o vencimento.');
    },
    onError: (err: any) => {
      alert(err.message || 'Erro ao cancelar assinatura.');
    },
  });

  const HOURS = ['09', '10', '11', '13', '14', '15', '16', '17', '18', '19'];

  const getDaysInMonthGrid = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const grid = [];
    for (let i = 0; i < firstDayIndex; i++) grid.push(null);
    for (let day = 1; day <= totalDays; day++) grid.push(new Date(year, month, day));
    return grid;
  };

  const changeMonth = (offset: number) => {
    const d = new Date(currentMonth);
    d.setMonth(currentMonth.getMonth() + offset);
    setCurrentMonth(d);
  };

  const getSlotsStatus = () => {
    if (!selectedBarber || !selectedDate) return [];

    const dayOfWeek = selectedDate.getDay(); // 0 = Domingo, 1 = Segunda, etc.
    const daySchedule = selectedBarberSchedule.find((s: any) => s.dayOfWeek === dayOfWeek);

    return HOURS.map((hourStr) => {
      const hourInt = parseInt(hourStr, 10);

      // 1. Verificar se o profissional trabalha nesse dia da semana
      if (daySchedule && !daySchedule.active) {
        return { hour: hourStr, label: `${hourStr}:00`, available: false };
      }

      // 2. Verificar se está dentro do horário de expediente
      if (daySchedule) {
        const startHour = parseInt(daySchedule.startTime.split(':')[0], 10);
        const endHour = parseInt(daySchedule.endTime.split(':')[0], 10);
        if (hourInt < startHour || hourInt >= endHour) {
          return { hour: hourStr, label: `${hourStr}:00`, available: false };
        }
        
        // 3. Verificar se coincide com o horário de almoço
        if (daySchedule.breakStart && daySchedule.breakEnd) {
          const breakStartHour = parseInt(daySchedule.breakStart.split(':')[0], 10);
          const breakEndHour = parseInt(daySchedule.breakEnd.split(':')[0], 10);
          if (hourInt >= breakStartHour && hourInt < breakEndHour) {
            return { hour: hourStr, label: `${hourStr}:00`, available: false };
          }
        }
      }

      // 4. Verificar se coincide com bloqueios (ex: férias, licenças)
      const targetTime = new Date(selectedDate);
      targetTime.setHours(hourInt, 0, 0, 0);

      const isBlocked = selectedBarberBlocks.some((block: any) => {
        const blockStart = new Date(block.dataInicio);
        const blockEnd = new Date(block.dataFim);
        return targetTime >= blockStart && targetTime < blockEnd;
      });

      if (isBlocked) {
        return { hour: hourStr, label: `${hourStr}:00`, available: false };
      }

      // 5. Verificar se já existe agendamento
      const isBooked = appointments.some((app: any) => {
        const appDate = new Date(app.data);
        return (
          app.barberId === selectedBarber &&
          app.status !== 'CANCELLED' &&
          appDate.getDate() === selectedDate.getDate() &&
          appDate.getMonth() === selectedDate.getMonth() &&
          appDate.getFullYear() === selectedDate.getFullYear() &&
          appDate.getHours() === hourInt
        );
      });

      return {
        hour: hourStr,
        label: `${hourStr}:00`,
        available: !isBooked,
      };
    });
  };

  const slots = getSlotsStatus();

  const filteredBarbers = selectedService
    ? barbers.filter((barber: any) => {
        const serviceData = services.find((s: any) => s.id === selectedService);
        return serviceData?.barbers?.some((b: any) => b.id === barber.id);
      })
    : barbers;

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBarber || !selectedService || !selectedHour || !selectedDate || !clientId) return;

    const date = new Date(selectedDate);
    date.setHours(parseInt(selectedHour, 10), 0, 0, 0);

    createAppointmentMutation.mutate({
      clientId,
      barberId: selectedBarber,
      serviceId: selectedService,
      data: date,
      status: 'CONFIRMED',
      payWithCredit,
    });
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const formatCpf = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const formatCep = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  };

  const handleDeleteAccount = async () => {
    if (confirm('Atenção (LGPD): Tem certeza que deseja excluir permanentemente todos os seus dados pessoais deste estabelecimento? Esta ação é irreversível e excluirá seu perfil, histórico de agendamentos e assinaturas.')) {
      if (confirm('Esta é a confirmação final. Deseja mesmo prosseguir com a exclusão definitiva dos seus dados?')) {
        try {
          const res = await fetch(`${apiUrl}/clients/${clientId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || 'Erro ao excluir dados.');
          }
          alert('Seus dados foram excluídos com sucesso em conformidade com a LGPD. Você será deslogado.');
          logout();
          router.push('/login');
        } catch (err: any) {
          alert(err.message || 'Erro ao processar sua solicitação de exclusão.');
        }
      }
    }
  };

  if (isLoading || !client) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-davinci-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div id="client-portal-root" className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(197,168,128,0.10),transparent_30%),linear-gradient(180deg,#fcfaf6_0%,#f7f1e7_100%)] text-davinci-black flex flex-col justify-between">
      <div className="max-w-6xl mx-auto px-6 py-8 lg:py-10 space-y-8 flex-1 w-full">
        <section
          className="relative overflow-hidden rounded-[28px] border border-davinci-gold/20 bg-white/90 shadow-[0_24px_80px_rgba(28,26,23,0.08)]"
          data-demo-title="Portal premium do cliente"
          data-demo-description="Este topo resume a experiência do cliente, reforça a marca do estabelecimento e apresenta dados principais de relacionamento."
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,168,128,0.12),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(28,26,23,0.04),transparent_35%)]" />
          <div className="relative p-6 lg:p-8 flex flex-col gap-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-davinci-gold/15 border border-davinci-gold/35 flex items-center justify-center font-black text-lg text-davinci-gold shadow-[0_10px_30px_rgba(197,168,128,0.18)]">
                  {client.nome.charAt(0).toUpperCase()}
                </div>
                <div className="space-y-3">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-davinci-gold/10 border border-davinci-gold/20 text-davinci-gold text-[10px] font-black uppercase tracking-[0.22em]">
                    <Sparkles className="h-3.5 w-3.5" />
                    Portal do Cliente
                  </span>
                  <div>
                    <h1 className="text-2xl lg:text-4xl font-black uppercase tracking-tight text-davinci-black">
                      Ola, {client.nome}
                    </h1>
                    <p className="text-sm text-davinci-gray font-medium mt-2 max-w-2xl">
                      Gerencie seus agendamentos, acompanhe seu historico e mantenha seus dados sempre atualizados em uma experiencia mais premium.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start flex-wrap">
                <button
                  onClick={() => window.open('/catalogo', '_blank')}
                  className="px-4 py-2.5 rounded-xl bg-white border border-davinci-gold/30 text-davinci-gold hover:bg-davinci-gold/5 transition-colors text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Scissors className="h-4 w-4" />
                  Ver Catálogo
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2.5 rounded-xl bg-white border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-400 transition-colors text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
                  title="Direito de Exclusão de Dados Pessoais (LGPD)"
                >
                  Excluir Meus Dados
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2.5 rounded-xl bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-50 transition-colors text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-4">
                <span className="text-[10px] uppercase tracking-[0.18em] text-davinci-gray font-black block">
                  Contato principal
                </span>
                <div className="mt-3 flex items-center gap-2 text-davinci-black font-bold">
                  <Phone className="h-4.5 w-4.5 text-davinci-gold" />
                  <span>{client.telefone}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-4">
                <span className="text-[10px] uppercase tracking-[0.18em] text-davinci-gray font-black block">
                  Data de aniversario
                </span>
                <div className="mt-3 flex items-center gap-2 text-davinci-black font-bold">
                  <Gift className="h-4.5 w-4.5 text-davinci-gold" />
                  <span>{formatBirthdayDisplay(client.aniversario)}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-4">
                <span className="text-[10px] uppercase tracking-[0.18em] text-davinci-gray font-black block">
                  Ticket medio
                </span>
                <div className="mt-3 flex items-center gap-2 text-davinci-black font-bold">
                  <ShieldCheck className="h-4.5 w-4.5 text-davinci-gold" />
                  <span>R$ {client.ticketMedio.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">
          <section
            id="client-portal-booking"
            className="bg-white p-6 rounded-[24px] border border-zinc-200/80 shadow-[0_18px_50px_rgba(28,26,23,0.06)] space-y-6"
            data-demo-title="Reserva de atendimento"
            data-demo-description="Aqui o cliente escolhe serviço, profissional, data e horário em um fluxo de autoatendimento pensado para conversão."
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-davinci-black uppercase tracking-[0.16em] flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-davinci-gold" />
                  Agendar Novo Atendimento
                </h3>
                <p className="text-[11px] text-davinci-gray mt-2 font-medium">
                  Escolha o servico, o profissional e reserve um horario livre com poucos cliques.
                </p>
              </div>
              <div className="hidden md:flex items-center gap-2 rounded-full bg-davinci-gold/10 border border-davinci-gold/20 px-3 py-1.5 text-[10px] text-davinci-gold font-black uppercase tracking-[0.18em]">
                Reserva rapida
              </div>
            </div>

            {bookingSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs rounded-xl flex items-center gap-2 font-medium">
                <CheckCircle className="h-5 w-5" />
                Agendamento efetuado com sucesso. Estaremos te esperando.
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] text-davinci-gray uppercase tracking-wider mb-2 font-bold">
                  Escolha o Servico
                </label>
                <select
                  required
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full px-3 py-3 bg-white border border-zinc-200 rounded-xl text-davinci-black focus:outline-none focus:border-davinci-gold text-xs shadow-sm"
                >
                  <option value="" disabled>-- Selecione um servico --</option>
                  {services.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.nome} - R$ {s.preco.toFixed(2)} ({s.duracao} min)</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] text-davinci-gray uppercase tracking-wider font-bold">
                  Escolha seu Profissional
                </label>

                {filteredBarbers.length === 0 ? (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-davinci-gray font-medium">
                    {selectedService
                      ? 'Nenhum profissional cadastrado realiza este serviço no momento.'
                      : 'Nenhum profissional disponível no momento.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {filteredBarbers.map((barber: any) => {
                      const isSelected = selectedBarber === barber.id;
                      const categoryLabel = getProfessionalCategoryLabel(barber);
                      const professionalBio =
                        barber.miniBio || barber.especialidade || 'Atendimento profissional com foco em qualidade e cuidado.';

                      return (
                        <button
                          key={barber.id}
                          type="button"
                          onClick={() => {
                            setSelectedBarber(barber.id);
                            setSelectedHour('');
                          }}
                          data-demo-title={`Profissional: ${barber.user.nome}`}
                          data-demo-description={`Este card apresenta ${barber.user.nome}, sua função e mini bio, ajudando o cliente a escolher o profissional com mais confiança.`}
                          className={`group relative overflow-hidden rounded-[22px] border p-3.5 text-left transition-all duration-300 ${
                            isSelected
                              ? 'border-davinci-gold bg-[linear-gradient(135deg,rgba(197,168,128,0.18),rgba(255,255,255,0.96))] shadow-[0_18px_45px_rgba(197,168,128,0.18)]'
                              : 'border-zinc-200 bg-white hover:border-davinci-gold/45 hover:shadow-[0_16px_34px_rgba(28,26,23,0.08)]'
                          }`}
                        >
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,168,128,0.14),transparent_35%)] opacity-80" />
                          <div className="relative flex items-center gap-3">
                            {barber.fotoUrl ? (
                              <img
                                src={barber.fotoUrl}
                                alt={barber.user.nome}
                                className="h-16 w-16 rounded-2xl object-cover border border-davinci-gold/20 shadow-sm"
                              />
                            ) : (
                              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-davinci-gold/20 bg-davinci-gold/10 text-lg font-black text-davinci-gold shadow-sm">
                                {barber.user.nome
                                  .split(' ')
                                  .slice(0, 2)
                                  .map((part: string) => part.charAt(0))
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-black uppercase tracking-[0.08em] text-davinci-black">
                                    {barber.user.nome}
                                  </p>
                                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-davinci-gold">
                                    {categoryLabel}
                                  </p>
                                </div>
                                {isSelected ? (
                                  <span className="rounded-full border border-davinci-gold/35 bg-white/80 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-davinci-gold">
                                    Selecionado
                                  </span>
                                ) : null}
                              </div>

                              <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-davinci-gray">
                                {professionalBio}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] text-davinci-gray uppercase tracking-wider mb-2 font-bold">
                    Selecione o Dia no Calendario
                  </label>
                  <div className="bg-white p-4 rounded-2xl border border-zinc-200 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center text-xs">
                      <button
                        type="button"
                        onClick={() => changeMonth(-1)}
                        className="p-1 px-2.5 rounded bg-white hover:bg-davinci-gold/10 text-davinci-gold border border-zinc-200 hover:border-davinci-gold transition-all cursor-pointer font-extrabold"
                      >
                        &lt;
                      </button>
                      <span className="font-bold uppercase tracking-wider text-davinci-black text-[11px]">
                        {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                      </span>
                      <button
                        type="button"
                        onClick={() => changeMonth(1)}
                        className="p-1 px-2.5 rounded bg-white hover:bg-davinci-gold/10 text-davinci-gold border border-zinc-200 hover:border-davinci-gold transition-all cursor-pointer font-extrabold"
                      >
                        &gt;
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-[9px] text-davinci-gray uppercase font-bold">
                      <span>Dom</span>
                      <span>Seg</span>
                      <span>Ter</span>
                      <span>Qua</span>
                      <span>Qui</span>
                      <span>Sex</span>
                      <span>Sab</span>
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {getDaysInMonthGrid().map((day, idx) => {
                        if (!day) return <div key={`empty-${idx}`} />;

                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const isPast = day < today;
                        const isSunday = day.getDay() === 0;
                        const isDisabled = isPast || isSunday;
                        const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();

                        return (
                          <button
                            key={day.toISOString()}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => {
                              setSelectedDate(day);
                              setSelectedHour('');
                            }}
                            className={`py-1.5 rounded text-xs font-semibold transition-all ${
                              isDisabled
                                ? 'text-davinci-gray/25 cursor-not-allowed line-through bg-zinc-50'
                                : isSelected
                                ? 'bg-davinci-gold text-white font-extrabold shadow-[0_0_10px_rgba(198,161,91,0.25)]'
                                : 'bg-white text-davinci-black border border-zinc-200 hover:border-davinci-gold cursor-pointer'
                            }`}
                          >
                            {day.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-davinci-gray uppercase tracking-wider mb-2 font-bold">
                    Horario de Preferencia
                  </label>

                  {!selectedBarber ? (
                    <p className="text-[10px] text-davinci-gray font-light italic bg-zinc-50 p-3 rounded-lg border border-zinc-200/60 text-center">
                      Selecione um profissional para visualizar os horarios disponiveis.
                    </p>
                  ) : (
                    <div className="grid grid-cols-5 gap-2">
                      {slots.map((slot) => (
                        <button
                          key={slot.hour}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setSelectedHour(slot.hour)}
                          className={`py-2 rounded-lg text-xs transition-all flex flex-col items-center justify-center font-medium relative overflow-hidden ${
                            !slot.available
                              ? 'bg-zinc-50 text-davinci-gray/40 border border-zinc-200/40 cursor-not-allowed line-through'
                              : selectedHour === slot.hour
                              ? 'bg-davinci-gold/20 border-2 border-davinci-gold text-davinci-gold font-bold shadow-[0_0_10px_rgba(198,161,91,0.15)] cursor-pointer'
                              : 'bg-white border border-zinc-200 text-davinci-black hover:border-davinci-gold cursor-pointer shadow-sm'
                          }`}
                        >
                          <span>{slot.label}</span>
                          {!slot.available ? (
                            <span className="text-[6px] uppercase tracking-tighter opacity-50 block mt-0.5">Ocupado</span>
                          ) : (
                            <span className="text-[6px] uppercase tracking-tighter text-emerald-600 block mt-0.5">Livre</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment by Subscription Choice */}
              {tenant?.subscriptionModuleEnabled && clientSubscription && (clientSubscription.status === 'ACTIVE' || clientSubscription.status === 'TRIALING') && (
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="block text-[10px] font-bold text-purple-700 uppercase tracking-wide flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      Clube de Assinatura Ativo
                    </span>
                    <span className="block text-[9px] text-zinc-500">
                      Utilizar meu plano de assinatura para cobrir este agendamento.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={payWithCredit} 
                      onChange={(e) => setPayWithCredit(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={createAppointmentMutation.isPending}
                className="w-full py-3.5 bg-gold-gradient rounded-xl text-davinci-black font-semibold text-xs hover:scale-[1.01] active:scale-[0.98] transition-transform shadow-[0_8px_30px_rgba(198,161,91,0.22)] flex items-center justify-center gap-2 cursor-pointer"
              >
                Reservar Horario
                <ArrowRight className="h-4.5 w-4.5" />
              </button>
            </form>
          </section>

          <section className="space-y-6">
            {/* Club Subscription Module (if enabled) */}
            {tenant?.subscriptionModuleEnabled && (
              <div className="bg-white p-6 rounded-[24px] border border-zinc-200/80 shadow-[0_18px_50px_rgba(28,26,23,0.06)] space-y-4">
                <h3 className="text-sm font-black text-davinci-black uppercase tracking-[0.16em] flex items-center gap-2">
                  <CreditCard className="h-4.5 w-4.5 text-davinci-gold" />
                  Clube de Assinatura
                </h3>
                
                {loadingSub || loadingPlans ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="h-6 w-6 border-2 border-davinci-gold border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : clientSubscription && (clientSubscription.status === 'ACTIVE' || clientSubscription.status === 'TRIALING') ? (
                  /* Active Subscription View */
                  <div className="space-y-4 text-xs">
                    <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/15 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-purple-700 uppercase tracking-widest">Assinatura Ativa</span>
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[8px] font-black uppercase">Club</span>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-black text-davinci-black uppercase tracking-wider">{clientSubscription.plan.name}</h4>
                        <p className="text-[11px] text-davinci-gray mt-1 font-semibold">Benefício: Cortes e agendamentos ilimitados</p>
                      </div>

                      <div className="pt-2 border-t border-purple-500/10 flex justify-between text-[10px] text-zinc-500 font-bold">
                        <span>Preço: R$ {clientSubscription.plan.price.toFixed(2)}/mês</span>
                        <span>Expira em: {clientSubscription.expiresAt ? new Date(clientSubscription.expiresAt).toLocaleDateString('pt-BR') : 'N/A'}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={cancelSubscriptionMutation.isPending}
                      onClick={() => {
                        if (confirm('Tem certeza que deseja cancelar sua assinatura? O acesso ilimitado continuará ativo até o vencimento.')) {
                          cancelSubscriptionMutation.mutate(clientSubscription.id);
                        }
                      }}
                      className="w-full py-2.5 bg-transparent text-red-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 rounded-xl text-xs font-bold border border-red-200 transition-colors cursor-pointer text-center"
                    >
                      {cancelSubscriptionMutation.isPending ? 'Cancelando...' : 'Cancelar Assinatura'}
                    </button>
                  </div>
                ) : (
                  /* No Active Subscription - Show Plans */
                  <div className="space-y-4 text-xs">
                    <p className="text-[11px] text-davinci-gray font-semibold leading-relaxed">
                      Assine um plano mensal e faça quantos cortes de barba e cabelo quiser! Acesso ilimitado aos serviços do estabelecimento.
                    </p>

                    {availablePlans.length === 0 ? (
                      <p className="text-[10px] text-davinci-gray italic bg-zinc-50 p-3 rounded-xl border border-zinc-200/60 text-center">
                        Nenhum plano disponível no momento.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {availablePlans.filter((p: any) => p.active).map((plan: any) => (
                          <div 
                            key={plan.id}
                            className="p-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 hover:border-davinci-gold/30 transition-all space-y-3"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-xs font-bold text-davinci-black uppercase tracking-wider">{plan.name}</h4>
                                <p className="text-[10px] text-davinci-gray leading-normal mt-1">{plan.description || 'Cortes ilimitados.'}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-sm font-black text-davinci-black">R$ {plan.price.toFixed(2)}</span>
                                <span className="block text-[8px] text-zinc-400 lowercase leading-none">/mês</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPlanForSub(plan);
                                setSubModalOpen(true);
                              }}
                              className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                            >
                              Assinar Clube
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div
              className="bg-white p-6 rounded-[24px] border border-zinc-200/80 shadow-[0_18px_50px_rgba(28,26,23,0.06)] space-y-5"
              data-demo-title="Dados do cliente"
              data-demo-description="Este bloco concentra informações de relacionamento, como telefone, aniversário e preferências, para facilitar recorrência e personalização."
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-davinci-black uppercase tracking-[0.16em] flex items-center gap-2">
                    <User className="h-4.5 w-4.5 text-davinci-gold" />
                    Seus Dados
                  </h3>
                  <p className="text-[11px] text-davinci-gray mt-2 font-medium">
                    Atualize informacoes importantes para atendimento e relacionamento.
                  </p>
                </div>
                {!editBirthday ? (
                  <button
                    onClick={() => setEditBirthday(true)}
                    className="p-2 rounded-xl bg-white border border-davinci-gold/20 text-davinci-gold hover:bg-davinci-gold/5 transition-colors cursor-pointer"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <div className="rounded-2xl border border-zinc-200/80 bg-background/70 p-4 space-y-4">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-davinci-gray font-black block">
                    Nome do cliente
                  </span>
                  <p className="mt-2 text-sm font-bold text-davinci-black">{client.nome}</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-davinci-gray font-black block">
                    Telefone cadastrado
                  </span>
                  <p className="mt-2 text-sm font-bold text-davinci-black">{client.telefone}</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-davinci-gray font-black block">
                    Aniversario
                  </span>
                  {editBirthday ? (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        value={birthdayVal}
                        onChange={(e) => setBirthdayVal(formatBirthdayInput(e.target.value))}
                        placeholder="DD/MM"
                        className="w-28 px-3 py-2 bg-white border border-zinc-200 rounded-xl text-davinci-black text-xs focus:outline-none focus:border-davinci-gold shadow-sm"
                      />
                      <button
                        onClick={() => updateBirthdayMutation.mutate(birthdayVal)}
                        disabled={updateBirthdayMutation.isPending}
                        className="p-2 bg-davinci-gold/15 border border-davinci-gold/40 rounded-xl text-davinci-gold hover:bg-davinci-gold/25 transition-colors cursor-pointer"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm font-bold text-davinci-black">{formatBirthdayDisplay(client.aniversario)}</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200/80 bg-background/70 p-4 space-y-4">
                <div>
                  <h4 className="text-[10px] uppercase tracking-[0.18em] text-davinci-gray font-black flex items-center gap-2">
                    <Heart className="h-4 w-4 text-davinci-gold" />
                    Preferencias
                  </h4>
                  <p className="mt-2 text-xs leading-relaxed text-davinci-black font-medium">
                    {client.preferences || 'Nenhuma preferencia registrada ate o momento.'}
                  </p>
                </div>
              </div>
            </div>

            <div
              className="bg-white p-6 rounded-[24px] border border-zinc-200/80 shadow-[0_18px_50px_rgba(28,26,23,0.06)] space-y-4"
              data-demo-title="Histórico do cliente"
              data-demo-description="Esta área mostra os atendimentos anteriores do cliente e reforça a percepção de acompanhamento e continuidade do serviço."
            >
              <h3 className="text-sm font-black text-davinci-black uppercase tracking-[0.16em] flex items-center gap-2">
                <Clock3 className="h-4.5 w-4.5 text-davinci-gold" />
                Seu Historico
              </h3>

              {client.appointments.length === 0 ? (
                <p className="text-xs text-davinci-gray font-medium">Nenhum atendimento registrado no seu perfil.</p>
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {client.appointments.map((app: any) => (
                    <div key={app.id} className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200/60 flex justify-between items-center text-xs">
                      <div>
                        <h4 className="font-bold text-davinci-black">{app.service.nome}</h4>
                        <p className="text-[10px] text-davinci-gray mt-1">
                          {new Date(app.data).toLocaleDateString('pt-BR')} com {app.barber.user.nome}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-davinci-gold">R$ {app.valor.toFixed(2)}</span>
                        <span className="block text-[8px] uppercase tracking-wider font-extrabold text-davinci-gray mt-1">{app.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

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
              <h4 className={`text-[10px] font-bold uppercase tracking-widest ${footerHeadingClass}`}>Navegação</h4>
              <ul className={`space-y-2 text-xs ${footerSubtextClass} font-light`}>
                <li>
                  <a
                    href="/catalogo"
                    target="_blank"
                    className={`hover:underline transition flex items-center gap-1.5 ${footerLinkClass}`}
                  >
                    <span>Ver Catálogo Público</span>
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

      {/* Simulated Credit Card Modal */}
      {subModalOpen && selectedPlanForSub && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative animate-fadeIn text-xs max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-zinc-200 bg-background flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-davinci-black uppercase tracking-wider">Assinar Clube de Assinatura</h3>
                <p className="text-[10px] text-davinci-gold font-bold uppercase tracking-wider mt-0.5">Plano: {selectedPlanForSub.name}</p>
              </div>
              <button 
                type="button"
                onClick={() => setSubModalOpen(false)}
                className="text-davinci-gray hover:text-davinci-black cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
                  alert('Preencha todos os campos do cartão de crédito.');
                  return;
                }
                if (!cpf || !billingEmail || !addressZip || !addressStreet || !addressNumber || !addressCity || !addressState) {
                  alert('Preencha todas as informações de faturamento.');
                  return;
                }
                if (!consentLgpd) {
                  alert('Você precisa aceitar os termos de consentimento da LGPD.');
                  return;
                }
                subscribeMutation.mutate({
                  planId: selectedPlanForSub.id,
                  cardDetails: {
                    cardNumber,
                    cardName,
                    expiry: cardExpiry,
                    cvv: cardCvv,
                    cpf,
                    email: billingEmail,
                    addressZip,
                    addressStreet,
                    addressNumber,
                    addressCity,
                    addressState
                  }
                });
              }}
              className="p-6 space-y-4 overflow-y-auto flex-1"
            >
              <div className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl space-y-1">
                <span className="font-bold text-purple-700 block">Detalhes da Cobrança:</span>
                <span className="block text-[10px] text-zinc-500">
                  Será cobrado o valor mensal de <strong>R$ {selectedPlanForSub.price.toFixed(2)}</strong> diretamente no cartão de crédito informado abaixo. Uso imediato e ilimitado.
                </span>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-davinci-gray mb-1.5">Número do Cartão (Crédito Apenas)</label>
                <input 
                  type="text"
                  required
                  placeholder="4000 1234 5678 9010"
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                  className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-davinci-gold"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-davinci-gray mb-1.5">Nome no Cartão</label>
                <input 
                  type="text"
                  required
                  placeholder="JOÃO DA SILVA"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-davinci-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-davinci-gray mb-1.5">Validade</label>
                  <input 
                    type="text"
                    required
                    placeholder="MM/AA"
                    maxLength={5}
                    value={cardExpiry}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.length > 2) {
                        val = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
                      }
                      setCardExpiry(val);
                    }}
                    className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-davinci-gold text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-davinci-gray mb-1.5">CVV</label>
                  <input 
                    type="password"
                    required
                    placeholder="123"
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-davinci-gold text-center"
                  />
                </div>
              </div>

              {/* Progressive Billing Details Section */}
              <div className="pt-3 border-t border-zinc-200 space-y-3">
                <h4 className="text-[10px] font-black text-purple-750 uppercase tracking-widest">Faturamento e LGPD</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-davinci-gray mb-1">CPF</label>
                    <input 
                      type="text"
                      required
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={(e) => setCpf(formatCpf(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-davinci-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-davinci-gray mb-1">E-mail</label>
                    <input 
                      type="email"
                      required
                      placeholder="nome@email.com"
                      value={billingEmail}
                      onChange={(e) => setBillingEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-davinci-gold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-davinci-gray mb-1">CEP</label>
                    <input 
                      type="text"
                      required
                      placeholder="00000-000"
                      value={addressZip}
                      onChange={(e) => setAddressZip(formatCep(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-davinci-gold text-center"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] uppercase font-bold text-davinci-gray mb-1">Rua / Av</label>
                    <input 
                      type="text"
                      required
                      placeholder="Av. Paulista"
                      value={addressStreet}
                      onChange={(e) => setAddressStreet(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-davinci-gold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-davinci-gray mb-1">Número</label>
                    <input 
                      type="text"
                      required
                      placeholder="123"
                      value={addressNumber}
                      onChange={(e) => setAddressNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-davinci-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-davinci-gray mb-1">Cidade</label>
                    <input 
                      type="text"
                      required
                      placeholder="São Paulo"
                      value={addressCity}
                      onChange={(e) => setAddressCity(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-davinci-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-davinci-gray mb-1">Estado</label>
                    <input 
                      type="text"
                      required
                      maxLength={2}
                      placeholder="SP"
                      value={addressState}
                      onChange={(e) => setAddressState(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-davinci-gold text-center"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-2">
                  <input 
                    type="checkbox"
                    required
                    id="lgpd-consent-sub"
                    checked={consentLgpd}
                    onChange={(e) => setConsentLgpd(e.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-zinc-300 text-purple-650 focus:ring-purple-500 cursor-pointer"
                  />
                  <label htmlFor="lgpd-consent-sub" className="text-[9px] text-zinc-500 font-semibold leading-relaxed cursor-pointer select-none">
                    Aceito os Termos de Uso e autorizo o tratamento dos meus dados para fins de gestão de assinaturas, conforme a Política de Privacidade (LGPD).
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSubModalOpen(false)}
                  className="flex-1 py-2.5 border border-zinc-200 text-davinci-gray hover:bg-zinc-50 rounded-lg font-bold transition-all cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={subscribeMutation.isPending}
                  className="flex-1 py-2.5 bg-purple-650 hover:bg-purple-700 text-white rounded-lg font-bold hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                >
                  {subscribeMutation.isPending ? 'Processando...' : 'Confirmar Assinatura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
