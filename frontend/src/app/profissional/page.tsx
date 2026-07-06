'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock3,
  DollarSign,
  Menu,
  Scissors,
  Users,
  Settings,
  Camera,
  Check,
  Trash2,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { isProfessionalUser } from '@/lib/auth';
import BrandLogo from '@/components/BrandLogo';
import SaaSPaywall from '@/components/SaaSPaywall';
import Header from '@/components/Header';

type ProfessionalTab = 'overview' | 'schedule' | 'clients' | 'settings';

type StatusKey =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

type AppointmentLike = {
  id: string;
  data: string;
  status: StatusKey;
  valor: number;
  service: { nome: string };
  client: {
    id: string;
    nome: string;
    telefone?: string;
    preferences?: string | null;
    observacoes?: string | null;
  };
};

type DashboardData = {
  barber: {
    id: string;
    nome: string;
    categoria?: string | null;
    especialidade?: string | null;
    miniBio?: string | null;
    fotoUrl?: string | null;
  };
  todayAppointments: AppointmentLike[];
  metrics: {
    totalAppointments: number;
    totalBilling: number;
    commissionRate: number;
    commissionEarned: number;
    returnRate: number;
  };
};

type DailyClient = AppointmentLike['client'] & {
  latestService: string;
  latestTime: string;
  appointmentStatus: StatusKey;
  totalVisitsToday: number;
};

const PROFESSIONAL_TABS: Array<{
  id: ProfessionalTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'overview', label: 'Operação do Dia', icon: ClipboardList },
  { id: 'schedule', label: 'Agenda', icon: Calendar },
  { id: 'clients', label: 'Clientes do Dia', icon: Users },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

const STATUS_LABELS: Record<StatusKey, string> = {
  SCHEDULED: 'Agendado',
  CONFIRMED: 'Confirmado',
  CHECKED_IN: 'Cliente chegou',
  IN_PROGRESS: 'Em atendimento',
  COMPLETED: 'Finalizado',
  CANCELLED: 'Cancelado',
};

const STATUS_STYLES: Record<StatusKey, string> = {
  SCHEDULED: 'bg-davinci-gold/10 text-davinci-gold border border-davinci-gold/20',
  CONFIRMED: 'bg-blue-50 text-blue-700 border border-blue-200',
  CHECKED_IN: 'bg-amber-50 text-amber-800 border border-amber-200',
  IN_PROGRESS: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  COMPLETED: 'bg-zinc-900 text-white border border-zinc-900',
  CANCELLED: 'bg-zinc-100 text-zinc-500 border border-zinc-200',
};

const STATUS_ACTIONS: Partial<
  Record<
    StatusKey,
    {
      label: string;
      nextStatus: StatusKey;
      className: string;
    }
  >
> = {
  SCHEDULED: {
    label: 'Confirmar',
    nextStatus: 'CONFIRMED',
    className: 'bg-blue-50 text-blue-700 border border-blue-200',
  },
  CONFIRMED: {
    label: 'Cliente chegou',
    nextStatus: 'CHECKED_IN',
    className: 'bg-amber-50 text-amber-800 border border-amber-200',
  },
  CHECKED_IN: {
    label: 'Iniciar',
    nextStatus: 'IN_PROGRESS',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  IN_PROGRESS: {
    label: 'Finalizar',
    nextStatus: 'COMPLETED',
    className: 'bg-davinci-gold/15 text-davinci-gold border border-davinci-gold/20',
  },
};

function formatTime(dateValue: string) {
  return new Date(dateValue).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function getPageTitle(activeTab: ProfessionalTab) {
  switch (activeTab) {
    case 'overview':
      return 'Painel do Profissional';
    case 'schedule':
      return 'Agenda do Dia';
    case 'clients':
      return 'Clientes do Dia';
    case 'settings':
      return 'Meu Perfil & Configurações';
    default:
      return 'Painel do Profissional';
  }
}

export default function ProfessionalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const token = useStore((state) => state.token);
  const user = useStore((state) => state.user);
  const tenant = useStore((state) => state.tenant);
  const mobileMenuOpen = useStore((state) => state.mobileMenuOpen);
  const setMobileMenuOpen = useStore((state) => state.setMobileMenuOpen);

  const [activeTab, setActiveTab] = useState<ProfessionalTab>('overview');
  const [activeClientNotesId, setActiveClientNotesId] = useState<string | null>(null);
  const [clientPreferencesText, setClientPreferencesText] = useState('');
  const [clientObservationsText, setClientObservationsText] = useState('');

  const requestedTab = searchParams.get('tab');

  useEffect(() => {
    if (!token || !user) {
      router.push('/login');
      return;
    }

    if (!isProfessionalUser(user)) {
      router.push('/dashboard');
    }
  }, [token, user, router]);

  useEffect(() => {
    if (
      requestedTab &&
      ['overview', 'schedule', 'clients', 'settings'].includes(requestedTab) &&
      requestedTab !== activeTab
    ) {
      setActiveTab(requestedTab as ProfessionalTab);
    }
  }, [requestedTab, activeTab]);

  const professionalId = user?.barberId;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

  // Work schedules & agenda blocks states
  const [newBlockTitle, setNewBlockTitle] = useState('');
  const [newBlockStart, setNewBlockStart] = useState('');
  const [newBlockEnd, setNewBlockEnd] = useState('');
  const [localSchedule, setLocalSchedule] = useState<any[]>([]);

  // Fetch Work Schedules
  const { data: rawSchedule, refetch: refetchSchedule } = useQuery({
    queryKey: ['barberSchedule', professionalId],
    queryFn: () =>
      fetch(`${apiUrl}/barbers/${professionalId}/schedule`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => { if (!res.ok) throw new Error('Falha ao carregar grade'); return res.json(); }),
    enabled: !!professionalId && !!token && activeTab === 'settings',
  });

  const schedule = rawSchedule || [];

  // Fetch Agenda Blocks
  const { data: blocks = [], refetch: refetchBlocks } = useQuery({
    queryKey: ['barberBlocks', professionalId],
    queryFn: () =>
      fetch(`${apiUrl}/barbers/${professionalId}/blocks`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => { if (!res.ok) throw new Error('Falha ao carregar bloqueios'); return res.json(); }),
    enabled: !!professionalId && !!token && activeTab === 'settings',
  });

  // Initialize localSchedule when schedule is loaded
  useEffect(() => {
    if (rawSchedule) {
      if (rawSchedule.length > 0) {
        setLocalSchedule(rawSchedule);
      } else {
        const defaults = Array.from({ length: 7 }, (_, i) => ({
          dayOfWeek: i,
          startTime: '09:00',
          endTime: '20:00',
          breakStart: '12:00',
          breakEnd: '13:00',
          active: i !== 0,
        }));
        setLocalSchedule(defaults);
      }
    }
  }, [rawSchedule]);

  const updateScheduleMutation = useMutation({
    mutationFn: (schedulesList: any[]) =>
      fetch(`${apiUrl}/barbers/${professionalId}/schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(schedulesList),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Erro ao salvar grade');
        return data;
      }),
    onSuccess: () => {
      refetchSchedule();
      alert('Grade de trabalho salva com sucesso!');
    },
  });

  const createBlockMutation = useMutation({
    mutationFn: (newBlock: { titulo: string; dataInicio: string; dataFim: string }) =>
      fetch(`${apiUrl}/barbers/${professionalId}/blocks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newBlock),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Erro ao criar bloqueio');
        return data;
      }),
    onSuccess: () => {
      refetchBlocks();
      setNewBlockTitle('');
      setNewBlockStart('');
      setNewBlockEnd('');
    },
  });

  const deleteBlockMutation = useMutation({
    mutationFn: (blockId: string) =>
      fetch(`${apiUrl}/barbers/blocks/${blockId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Erro ao deletar bloqueio');
        return data;
      }),
    onSuccess: () => {
      refetchBlocks();
    },
  });

  const { data: dashboard, isLoading } = useQuery<DashboardData>({
    queryKey: ['professionalDashboard', professionalId],
    queryFn: () =>
      fetch(`${apiUrl}/barbers/${professionalId}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }).then((res) => {
        if (!res.ok) throw new Error('Falha ao carregar painel do profissional');
        return res.json();
      }),
    enabled: !!professionalId && !!token,
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ id, preferences, observacoes }: { id: string; preferences: string; observacoes: string }) =>
      fetch(`${apiUrl}/clients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ preferences, observacoes }),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Erro ao atualizar ficha do cliente');
        return data;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionalDashboard', professionalId] });
      setActiveClientNotesId(null);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StatusKey }) =>
      fetch(`${apiUrl}/appointments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Erro ao atualizar status do atendimento');
        return data;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionalDashboard', professionalId] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const openClientNotes = (client: AppointmentLike['client']) => {
    setActiveClientNotesId(client.id);
    setClientPreferencesText(client.preferences || '');
    setClientObservationsText(client.observacoes || '');
    setActiveTab('clients');
  };

  const handleSaveNotes = (clientId: string) => {
    updateClientMutation.mutate({
      id: clientId,
      preferences: clientPreferencesText,
      observacoes: clientObservationsText,
    });
  };

  const professional = dashboard?.barber;

  const [especialidadeInput, setEspecialidadeInput] = useState('');
  const [miniBioInput, setMiniBioInput] = useState('');
  const [fotoUrlInput, setFotoUrlInput] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (professional) {
      setEspecialidadeInput(professional.especialidade || '');
      setMiniBioInput(professional.miniBio || '');
      setFotoUrlInput(professional.fotoUrl || '');
    }
  }, [professional]);

  const updateProfileMutation = useMutation({
    mutationFn: (updatedData: { especialidade: string; miniBio: string; fotoUrl: string }) =>
      fetch(`${apiUrl}/barbers/${professionalId}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Erro ao atualizar perfil');
        return data;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionalDashboard', professionalId] });
      queryClient.invalidateQueries({ queryKey: ['barbers'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem é muito grande. Escolha uma foto de até 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setFotoUrlInput(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const sortedAppointments = useMemo(
    () =>
      [...(dashboard?.todayAppointments || [])].sort(
        (left, right) => new Date(left.data).getTime() - new Date(right.data).getTime()
      ),
    [dashboard?.todayAppointments]
  );

  const nextAppointment =
    sortedAppointments.find((appointment) =>
      ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'].includes(appointment.status)
    ) || null;

  const todayBilling = sortedAppointments.reduce((sum, appointment) => sum + appointment.valor, 0);
  const completedToday = sortedAppointments.filter((appointment) => appointment.status === 'COMPLETED').length;
  const inProgressToday = sortedAppointments.filter((appointment) => appointment.status === 'IN_PROGRESS').length;
  const waitingToday = sortedAppointments.filter((appointment) =>
    ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN'].includes(appointment.status)
  ).length;

  const dailyClients = useMemo<DailyClient[]>(() => {
    const byId = new Map<string, DailyClient>();

    sortedAppointments.forEach((appointment) => {
      const existing = byId.get(appointment.client.id);

      if (!existing) {
        byId.set(appointment.client.id, {
          ...appointment.client,
          latestService: appointment.service.nome,
          latestTime: appointment.data,
          appointmentStatus: appointment.status,
          totalVisitsToday: 1,
        });
        return;
      }

      existing.totalVisitsToday += 1;

      if (new Date(appointment.data).getTime() >= new Date(existing.latestTime).getTime()) {
        existing.latestService = appointment.service.nome;
        existing.latestTime = appointment.data;
        existing.appointmentStatus = appointment.status;
      }
    });

    return Array.from(byId.values());
  }, [sortedAppointments]);

  const quickActions = nextAppointment
    ? [
        {
          label: 'Abrir ficha',
          onClick: () => openClientNotes(nextAppointment.client),
          className: 'bg-white text-davinci-black border border-zinc-200',
        },
        ...(STATUS_ACTIONS[nextAppointment.status]
          ? [
              {
                label: STATUS_ACTIONS[nextAppointment.status]!.label,
                onClick: () =>
                  updateStatusMutation.mutate({
                    id: nextAppointment.id,
                    status: STATUS_ACTIONS[nextAppointment.status]!.nextStatus,
                  }),
                className: STATUS_ACTIONS[nextAppointment.status]!.className,
              },
            ]
          : []),
      ]
    : [];

  if (isLoading || !dashboard || !professional) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-davinci-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-davinci-black font-sans flex">
      <SaaSPaywall />
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden transition-all duration-300"
        />
      )}

      <aside
        className={`w-64 bg-white border-r border-zinc-200/80 flex flex-col h-screen fixed left-0 top-0 z-40 lg:z-20 transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Logo */}
        <div className="p-6 border-b border-zinc-200/80 flex items-center gap-3 shrink-0">
          <BrandLogo iconSize="lg" hideText={true} />
          <div className="min-w-0 flex-1">
            <h2 className="text-xs font-semibold text-davinci-black uppercase tracking-wider leading-tight break-words">
              {tenant?.name || 'Venusta'}
            </h2>
            <p className="text-[8px] text-davinci-gold uppercase tracking-[0.05em] font-medium mt-0.5 leading-tight break-words">
              Painel do profissional
            </p>
          </div>
        </div>

        {/* Nav List */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {PROFESSIONAL_TABS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-davinci-gold/10 text-davinci-gold border-l-2 border-davinci-gold pl-3 font-semibold'
                    : 'text-davinci-gray hover:text-davinci-black hover:bg-davinci-gold/5'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-davinci-gold' : 'text-davinci-gray'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <Header
          title={getPageTitle(activeTab)}
          subtitle={professional.miniBio || professional.especialidade || professional.categoria || 'Atendimento e acompanhamento do dia'}
          avatarUrl={professional.fotoUrl}
          rightSlot={(
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-davinci-black uppercase tracking-widest">Comissão ativa</div>
              <div className="text-[11px] text-davinci-gold mt-1">{dashboard.metrics.commissionRate.toFixed(0)}%</div>
            </div>
          )}
        />

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'overview' && (
            <div
              id="professional-tab-content-overview"
              className="space-y-6"
              data-demo-title="Painel operacional do profissional"
              data-demo-description="Esta visão concentra o que o profissional precisa no dia: fila de atendimentos, resumo operacional, comissão prevista e acesso rápido à ficha do cliente."
            >
              <section className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm">
                <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
                  <div className="space-y-3">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-davinci-gold/10 border border-davinci-gold/20 text-davinci-gold text-[10px] font-bold uppercase tracking-widest">
                      Operação do dia
                    </span>
                    <h2 className="text-2xl font-black text-davinci-black uppercase leading-tight">
                      {nextAppointment
                        ? `${nextAppointment.client.nome} às ${formatTime(nextAppointment.data)}`
                        : 'Sem atendimentos pendentes agora'}
                    </h2>
                    <p className="text-sm text-davinci-gray font-medium max-w-2xl">
                      Acompanhe a fila do dia, avance os status com poucos cliques e consulte a ficha do cliente sem sair do painel.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 min-w-full xl:min-w-[320px] xl:max-w-[360px]">
                    <div className="rounded-xl border border-zinc-200 p-4 bg-background/70">
                      <span className="text-[10px] uppercase tracking-widest text-davinci-gray font-bold">
                        Próximo horário
                      </span>
                      <h3 className="text-xl font-black text-davinci-black mt-2">
                        {nextAppointment ? formatTime(nextAppointment.data) : '--:--'}
                      </h3>
                    </div>
                    <div className="rounded-xl border border-zinc-200 p-4 bg-background/70">
                      <span className="text-[10px] uppercase tracking-widest text-davinci-gray font-bold">
                        Em fila
                      </span>
                      <h3 className="text-xl font-black text-davinci-black mt-2">{waitingToday}</h3>
                    </div>
                    <div className="rounded-xl border border-zinc-200 p-4 bg-background/70">
                      <span className="text-[10px] uppercase tracking-widest text-davinci-gray font-bold">
                        Em atendimento
                      </span>
                      <h3 className="text-xl font-black text-davinci-black mt-2">{inProgressToday}</h3>
                    </div>
                    <div className="rounded-xl border border-zinc-200 p-4 bg-background/70">
                      <span className="text-[10px] uppercase tracking-widest text-davinci-gray font-bold">
                        Finalizados
                      </span>
                      <h3 className="text-xl font-black text-davinci-black mt-2">{completedToday}</h3>
                    </div>
                  </div>
                </div>

                {nextAppointment && (
                  <div className="mt-6 rounded-2xl border border-zinc-200 bg-background/60 p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold text-davinci-black">{nextAppointment.client.nome}</h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              STATUS_STYLES[nextAppointment.status]
                            }`}
                          >
                            {STATUS_LABELS[nextAppointment.status]}
                          </span>
                        </div>
                        <p className="text-sm text-davinci-gray mt-2">
                          {nextAppointment.service.nome} • {formatTime(nextAppointment.data)} •{' '}
                          {formatCurrency(nextAppointment.valor)}
                        </p>
                        <p className="text-xs text-davinci-gray mt-1">
                          {nextAppointment.client.telefone || 'Telefone não informado'}
                        </p>
                      </div>

                      <div className="flex items-center flex-wrap gap-2">
                        {quickActions.map((action) => (
                          <button
                            key={action.label}
                            onClick={action.onClick}
                            disabled={updateStatusMutation.isPending}
                            className={`px-3 py-2 rounded-lg text-[11px] font-bold cursor-pointer ${action.className}`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
                <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <h3 className="text-xs font-bold text-davinci-black uppercase tracking-widest flex items-center gap-2">
                      <Clock3 className="h-4.5 w-4.5 text-davinci-gold" />
                      Fila de Atendimentos
                    </h3>
                    <button
                      onClick={() => setActiveTab('schedule')}
                      className="text-[11px] font-bold text-davinci-gold uppercase tracking-widest cursor-pointer"
                    >
                      Ver agenda completa
                    </button>
                  </div>

                  {sortedAppointments.length === 0 ? (
                    <div className="p-8 rounded-xl bg-background/70 border border-zinc-200 text-center text-sm text-davinci-gray font-semibold">
                      Nenhum atendimento marcado para hoje.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sortedAppointments.map((appointment) => {
                        const stepAction = STATUS_ACTIONS[appointment.status];

                        return (
                          <div
                            key={appointment.id}
                            className="rounded-xl border border-zinc-200 p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-davinci-black">
                                  {appointment.client.nome}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                    STATUS_STYLES[appointment.status]
                                  }`}
                                >
                                  {STATUS_LABELS[appointment.status]}
                                </span>
                              </div>
                              <p className="text-xs text-davinci-gray mt-1">
                                {appointment.service.nome} • {formatTime(appointment.data)} •{' '}
                                {formatCurrency(appointment.valor)}
                              </p>
                            </div>

                            <div className="flex items-center flex-wrap gap-2">
                              {stepAction && (
                                <button
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      id: appointment.id,
                                      status: stepAction.nextStatus,
                                    })
                                  }
                                  disabled={updateStatusMutation.isPending}
                                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${stepAction.className}`}
                                >
                                  {stepAction.label}
                                </button>
                              )}
                              {!['COMPLETED', 'CANCELLED'].includes(appointment.status) && (
                                <button
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      id: appointment.id,
                                      status: 'CANCELLED',
                                    })
                                  }
                                  disabled={updateStatusMutation.isPending}
                                  className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 text-[11px] font-bold cursor-pointer"
                                >
                                  Cancelar
                                </button>
                              )}
                              <button
                                onClick={() => openClientNotes(appointment.client)}
                                className="px-3 py-1.5 rounded-lg bg-white text-davinci-black border border-zinc-200 text-[11px] font-bold cursor-pointer"
                              >
                                Abrir ficha
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <section className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm">
                    <h3 className="text-xs font-bold text-davinci-black uppercase tracking-widest flex items-center gap-2">
                      <DollarSign className="h-4.5 w-4.5 text-davinci-gold" />
                      Resumo do Dia
                    </h3>

                    <div className="mt-5 space-y-4">
                      <div className="rounded-xl border border-zinc-200 p-4">
                        <span className="text-[10px] uppercase tracking-widest text-davinci-gray font-bold">
                          Valor agendado
                        </span>
                        <h4 className="text-2xl font-black text-davinci-black mt-2">
                          {formatCurrency(todayBilling)}
                        </h4>
                      </div>
                      <div className="rounded-xl border border-zinc-200 p-4 bg-davinci-gold/5">
                        <span className="text-[10px] uppercase tracking-widest text-davinci-gray font-bold">
                          Comissão prevista ({dashboard.metrics.commissionRate.toFixed(0)}%)
                        </span>
                        <h4 className="text-2xl font-black text-davinci-gold mt-2">
                          {formatCurrency(todayBilling * (dashboard.metrics.commissionRate / 100))}
                        </h4>
                      </div>
                      <div className="rounded-xl border border-zinc-200 p-4">
                        <span className="text-[10px] uppercase tracking-widest text-davinci-gray font-bold">
                          Clientes do dia
                        </span>
                        <h4 className="text-2xl font-black text-davinci-black mt-2">{dailyClients.length}</h4>
                      </div>
                    </div>
                  </section>

                  <section className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm">
                    <h3 className="text-xs font-bold text-davinci-black uppercase tracking-widest flex items-center gap-2">
                      <CheckCircle2 className="h-4.5 w-4.5 text-davinci-gold" />
                      Indicadores Operacionais
                    </h3>

                    <div className="mt-5 grid grid-cols-1 gap-3 text-sm">
                      <div className="rounded-xl border border-zinc-200 p-4 bg-background/60 flex items-center justify-between gap-3">
                        <span className="text-davinci-gray">Atendimentos totais</span>
                        <strong className="text-davinci-black">{dashboard.metrics.totalAppointments}</strong>
                      </div>
                      <div className="rounded-xl border border-zinc-200 p-4 bg-background/60 flex items-center justify-between gap-3">
                        <span className="text-davinci-gray">Faturamento acumulado</span>
                        <strong className="text-davinci-black">{formatCurrency(dashboard.metrics.totalBilling)}</strong>
                      </div>
                      <div className="rounded-xl border border-zinc-200 p-4 bg-background/60 flex items-center justify-between gap-3">
                        <span className="text-davinci-gray">Comissão acumulada</span>
                        <strong className="text-davinci-black">{formatCurrency(dashboard.metrics.commissionEarned)}</strong>
                      </div>
                      <div className="rounded-xl border border-zinc-200 p-4 bg-background/60 flex items-center justify-between gap-3">
                        <span className="text-davinci-gray">Retorno de clientes</span>
                        <strong className="text-davinci-black">{dashboard.metrics.returnRate}%</strong>
                      </div>
                    </div>
                  </section>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div
              id="professional-tab-content-schedule"
              className="space-y-4"
              data-demo-title="Agenda do profissional"
              data-demo-description="Aqui o profissional acompanha os horários do dia, status dos atendimentos e preferências de cada cliente sem depender da recepção."
            >
              {sortedAppointments.length === 0 ? (
                <div className="bg-white rounded-2xl border border-zinc-200/80 p-10 text-center shadow-sm">
                  <h3 className="text-sm font-bold text-davinci-black">Agenda vazia</h3>
                  <p className="text-xs text-davinci-gray mt-2">Nenhum atendimento programado para hoje.</p>
                </div>
              ) : (
                sortedAppointments.map((appointment) => {
                  const stepAction = STATUS_ACTIONS[appointment.status];

                  return (
                    <div
                      key={appointment.id}
                      className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-sm space-y-4"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-bold text-davinci-black">{appointment.client.nome}</h3>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                STATUS_STYLES[appointment.status]
                              }`}
                            >
                              {STATUS_LABELS[appointment.status]}
                            </span>
                          </div>
                          <p className="text-xs text-davinci-gray mt-2">
                            {appointment.service.nome} • {formatTime(appointment.data)} •{' '}
                            {appointment.client.telefone || 'Telefone não informado'}
                          </p>
                          <p className="text-xs text-davinci-gray mt-1">
                            Valor do serviço:{' '}
                            <strong className="text-davinci-black">{formatCurrency(appointment.valor)}</strong>
                          </p>
                        </div>

                        <div className="flex items-center flex-wrap gap-2">
                          <button
                            onClick={() => openClientNotes(appointment.client)}
                            className="px-3 py-2 rounded-lg bg-white text-davinci-black border border-zinc-200 text-[11px] font-bold cursor-pointer"
                          >
                            Ficha do cliente
                          </button>
                          {stepAction && (
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: appointment.id,
                                  status: stepAction.nextStatus,
                                })
                              }
                              disabled={updateStatusMutation.isPending}
                              className="px-3 py-2 rounded-lg bg-gold-gradient text-davinci-black text-[11px] font-bold cursor-pointer"
                            >
                              {stepAction.label}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div className="rounded-xl border border-zinc-200 p-4 bg-background/60">
                          <span className="text-[10px] uppercase tracking-widest text-davinci-gray font-bold">
                            Preferências
                          </span>
                          <p className="text-davinci-black mt-2 leading-relaxed">
                            {appointment.client.preferences || 'Nenhuma preferência registrada.'}
                          </p>
                        </div>
                        <div className="rounded-xl border border-zinc-200 p-4 bg-background/60">
                          <span className="text-[10px] uppercase tracking-widest text-davinci-gray font-bold">
                            Observações
                          </span>
                          <p className="text-davinci-black mt-2 leading-relaxed">
                            {appointment.client.observacoes || 'Nenhuma observação registrada.'}
                          </p>
                        </div>
                        <div className="rounded-xl border border-zinc-200 p-4 bg-background/60">
                          <span className="text-[10px] uppercase tracking-widest text-davinci-gray font-bold">
                            Comissão prevista
                          </span>
                          <p className="text-davinci-black mt-2 leading-relaxed">
                            {formatCurrency(appointment.valor * (dashboard.metrics.commissionRate / 100))}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'clients' && (
            <div
              id="professional-tab-content-clients"
              className="space-y-4"
              data-demo-title="Clientes do dia"
              data-demo-description="Nesta área o profissional consulta a ficha do cliente, registra observações e mantém o atendimento mais contextualizado."
            >
              {dailyClients.length === 0 ? (
                <div className="bg-white rounded-2xl border border-zinc-200/80 p-10 text-center shadow-sm">
                  <h3 className="text-sm font-bold text-davinci-black">Nenhum cliente no dia</h3>
                  <p className="text-xs text-davinci-gray mt-2">
                    Sua lista de clientes do dia aparece aqui conforme a agenda.
                  </p>
                </div>
              ) : (
                dailyClients.map((client) => (
                  <div key={client.id} className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-sm space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-davinci-black">{client.nome}</h3>
                        <p className="text-xs text-davinci-gray mt-2">
                          {client.telefone || 'Telefone não informado'} • Último serviço do dia: {client.latestService}{' '}
                          • {formatTime(client.latestTime)}
                        </p>
                        <p className="text-xs text-davinci-gray mt-1">
                          Passagens hoje: <strong className="text-davinci-black">{client.totalVisitsToday}</strong>
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider self-start ${
                          STATUS_STYLES[client.appointmentStatus]
                        }`}
                      >
                        {STATUS_LABELS[client.appointmentStatus]}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="rounded-xl border border-zinc-200 p-4 bg-background/60">
                        <span className="text-[10px] uppercase tracking-widest text-davinci-gray font-bold">
                          Preferências atuais
                        </span>
                        <p className="text-davinci-black mt-2 leading-relaxed text-sm">
                          {client.preferences || 'Nenhuma preferência registrada.'}
                        </p>
                      </div>

                      <div className="rounded-xl border border-zinc-200 p-4 bg-background/60">
                        <span className="text-[10px] uppercase tracking-widest text-davinci-gray font-bold">
                          Observações atuais
                        </span>
                        <p className="text-davinci-black mt-2 leading-relaxed text-sm">
                          {client.observacoes || 'Nenhuma observação registrada.'}
                        </p>
                      </div>
                    </div>

                    {activeClientNotesId === client.id ? (
                      <div className="rounded-xl border border-zinc-200 p-4 bg-white space-y-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest font-bold text-davinci-gray mb-1.5">
                            Preferências
                          </label>
                          <textarea
                            rows={3}
                            value={clientPreferencesText}
                            onChange={(event) => setClientPreferencesText(event.target.value)}
                            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm resize-none focus:outline-none focus:border-davinci-gold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase tracking-widest font-bold text-davinci-gray mb-1.5">
                            Observações
                          </label>
                          <textarea
                            rows={3}
                            value={clientObservationsText}
                            onChange={(event) => setClientObservationsText(event.target.value)}
                            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm resize-none focus:outline-none focus:border-davinci-gold"
                          />
                        </div>

                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => setActiveClientNotesId(null)}
                            className="px-4 py-2 rounded-lg border border-zinc-200 text-xs font-bold text-davinci-gray hover:text-davinci-black cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleSaveNotes(client.id)}
                            disabled={updateClientMutation.isPending}
                            className="px-4 py-2 rounded-lg bg-gold-gradient text-davinci-black text-xs font-bold cursor-pointer"
                          >
                            Salvar ficha
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => openClientNotes(client)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-davinci-black border border-zinc-200 text-xs font-bold cursor-pointer"
                      >
                        <ClipboardList className="h-4 w-4" />
                        Editar ficha do cliente
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-8">
              {/* Card 1: Perfil de Exibição */}
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm space-y-6">
                <div>
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-davinci-gold/10 border border-davinci-gold/20 text-davinci-gold text-[10px] font-bold uppercase tracking-widest">
                    Meu Perfil Público
                  </span>
                  <h2 className="text-xl font-bold text-davinci-black mt-2">CONFIGURAÇÃO DE EXIBIÇÃO</h2>
                  <p className="text-xs text-davinci-gray mt-1">
                    Personalize as informações que os clientes visualizam no portal de agendamentos online.
                  </p>
                </div>

                {saveSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-bold">
                    <Check className="h-4 w-4 text-emerald-600" />
                    Perfil atualizado com sucesso! Suas alterações já estão ativas para os clientes.
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-zinc-100">
                  <div className="relative group">
                    {fotoUrlInput ? (
                      <img
                        src={fotoUrlInput}
                        alt="Foto do Perfil"
                        className="h-24 w-24 rounded-2xl object-cover border-2 border-davinci-gold/30 shadow-md animate-fade-in"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 text-xs text-zinc-400 font-semibold">
                        Sem Foto
                      </div>
                    )}
                    <label
                      htmlFor="photo-upload"
                      className="absolute -bottom-2 -right-2 p-1.5 rounded-xl bg-davinci-gold text-white hover:bg-davinci-gold/90 transition-colors shadow-md cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95"
                    >
                      <Camera className="h-4 w-4" />
                      <input
                        type="file"
                        id="photo-upload"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="text-center sm:text-left space-y-1">
                    <h3 className="font-bold text-davinci-black">{professional.nome}</h3>
                    <p className="text-xs text-davinci-gold font-bold uppercase tracking-wider">
                      {professional.categoria === 'BARBER' ? 'Barbeiro' : 'Profissional'}
                    </p>
                    <p className="text-[10px] text-davinci-gray">Formatos aceitos: JPG, PNG. Tamanho máximo: 2MB.</p>
                    {fotoUrlInput && (
                      <button
                        onClick={() => setFotoUrlInput('')}
                        className="text-[10px] font-bold text-red-500 hover:text-red-700 block transition-colors mt-2 mx-auto sm:mx-0"
                      >
                        Remover foto
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-davinci-black mb-1.5">
                      Minha Especialidade
                    </label>
                    <input
                      type="text"
                      value={especialidadeInput}
                      onChange={(e) => setEspecialidadeInput(e.target.value)}
                      placeholder="Ex: Cortes unissex clássicos, colorimetria avançada, manicure artística..."
                      className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs text-davinci-black focus:outline-none focus:border-davinci-gold shadow-sm"
                    />
                    <span className="text-[9px] text-davinci-gray block mt-1">Breve resumo de suas principais competências de atendimento.</span>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-davinci-black mb-1.5">
                      Biografia Curta (Mini Bio)
                    </label>
                    <textarea
                      rows={4}
                      value={miniBioInput}
                      onChange={(e) => setMiniBioInput(e.target.value)}
                      placeholder="Conte um pouco sobre sua trajetória profissional, estilo de atendimento ou especializações para os clientes..."
                      className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs text-davinci-black focus:outline-none focus:border-davinci-gold shadow-sm resize-none"
                    />
                    <span className="text-[9px] text-davinci-gray block mt-1">Este texto aparecerá no card de escolha do profissional no portal do cliente.</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                  <button
                    onClick={() => {
                      setEspecialidadeInput(professional.especialidade || '');
                      setMiniBioInput(professional.miniBio || '');
                      setFotoUrlInput(professional.fotoUrl || '');
                      setActiveTab('overview');
                      router.push('/profissional');
                    }}
                    className="px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-davinci-gray hover:text-davinci-black transition-colors cursor-pointer"
                  >
                    Descartar
                  </button>
                  <button
                    onClick={() =>
                      updateProfileMutation.mutate({
                        especialidade: especialidadeInput,
                        miniBio: miniBioInput,
                        fotoUrl: fotoUrlInput,
                      })
                    }
                    disabled={updateProfileMutation.isPending}
                    className="px-4 py-2.5 rounded-xl bg-gold-gradient text-davinci-black text-xs font-bold transition-all shadow-[0_4px_14px_rgba(197,168,128,0.2)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center gap-1.5"
                  >
                    {updateProfileMutation.isPending && (
                      <div className="h-3 w-3 border-2 border-davinci-black border-t-transparent rounded-full animate-spin" />
                    )}
                    Salvar Alterações
                  </button>
                </div>
              </div>

              {/* Card 2: Grade de Horários */}
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm space-y-6">
                <div>
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-davinci-gold/10 border border-davinci-gold/20 text-davinci-gold text-[10px] font-bold uppercase tracking-widest">
                    Minha Agenda
                  </span>
                  <h2 className="text-xl font-bold text-davinci-black mt-2">GRADE SEMANAL DE TRABALHO</h2>
                  <p className="text-xs text-davinci-gray mt-1">
                    Defina seus dias de atendimento, horários de expediente e intervalos.
                  </p>
                </div>

                <div className="space-y-4 divide-y divide-zinc-100">
                  {[
                    { value: 1, label: 'Segunda-feira' },
                    { value: 2, label: 'Terça-feira' },
                    { value: 3, label: 'Quarta-feira' },
                    { value: 4, label: 'Quinta-feira' },
                    { value: 5, label: 'Sexta-feira' },
                    { value: 6, label: 'Sábado' },
                    { value: 0, label: 'Domingo' }
                  ].map((day) => {
                    const daySchedule = localSchedule.find((s) => s.dayOfWeek === day.value) || {
                      dayOfWeek: day.value,
                      startTime: '09:00',
                      endTime: '20:00',
                      breakStart: '12:00',
                      breakEnd: '13:00',
                      active: false,
                    };

                    const handleDayActiveToggle = (checked: boolean) => {
                      setLocalSchedule((prev) => {
                        const index = prev.findIndex((s) => s.dayOfWeek === day.value);
                        const updated = { ...daySchedule, active: checked };
                        if (index >= 0) {
                          const copy = [...prev];
                          copy[index] = updated;
                          return copy;
                        } else {
                          return [...prev, updated];
                        }
                      });
                    };

                    const handleTimeChange = (field: string, val: string) => {
                      setLocalSchedule((prev) => {
                        const index = prev.findIndex((s) => s.dayOfWeek === day.value);
                        const updated = { ...daySchedule, [field]: val };
                        if (index >= 0) {
                          const copy = [...prev];
                          copy[index] = updated;
                          return copy;
                        } else {
                          return [...prev, updated];
                        }
                      });
                    };

                    return (
                      <div key={day.value} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 first:pt-0">
                        <div className="flex items-center gap-3 w-40">
                          <input
                            type="checkbox"
                            id={`day-${day.value}`}
                            checked={daySchedule.active}
                            onChange={(e) => handleDayActiveToggle(e.target.checked)}
                            className="h-4 w-4 text-davinci-gold border-zinc-300 rounded focus:ring-davinci-gold"
                          />
                          <label htmlFor={`day-${day.value}`} className="text-xs font-bold text-davinci-black uppercase tracking-wider cursor-pointer">
                            {day.label}
                          </label>
                        </div>

                        {daySchedule.active ? (
                          <div className="flex flex-wrap gap-2 items-center text-xs text-davinci-gray font-medium">
                            <div className="flex items-center gap-1.5">
                              <span>Expediente:</span>
                              <input
                                type="time"
                                value={daySchedule.startTime}
                                onChange={(e) => handleTimeChange('startTime', e.target.value)}
                                className="px-2 py-1 bg-white border border-zinc-200 rounded-lg text-davinci-black focus:outline-none focus:border-davinci-gold"
                              />
                              <span>às</span>
                              <input
                                type="time"
                                value={daySchedule.endTime}
                                onChange={(e) => handleTimeChange('endTime', e.target.value)}
                                className="px-2 py-1 bg-white border border-zinc-200 rounded-lg text-davinci-black focus:outline-none focus:border-davinci-gold"
                              />
                            </div>

                            <div className="flex items-center gap-1.5 sm:ml-4">
                              <span>Almoço:</span>
                              <input
                                type="time"
                                value={daySchedule.breakStart || '12:00'}
                                onChange={(e) => handleTimeChange('breakStart', e.target.value)}
                                className="px-2 py-1 bg-white border border-zinc-200 rounded-lg text-davinci-black focus:outline-none focus:border-davinci-gold"
                              />
                              <span>às</span>
                              <input
                                type="time"
                                value={daySchedule.breakEnd || '13:00'}
                                onChange={(e) => handleTimeChange('breakEnd', e.target.value)}
                                className="px-2 py-1 bg-white border border-zinc-200 rounded-lg text-davinci-black focus:outline-none focus:border-davinci-gold"
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Fechado / Folga</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-4 border-t border-zinc-100">
                  <button
                    onClick={() => updateScheduleMutation.mutate(localSchedule)}
                    disabled={updateScheduleMutation.isPending}
                    className="px-4 py-2.5 rounded-xl bg-gold-gradient text-davinci-black text-xs font-bold transition-all shadow-[0_4px_14px_rgba(197,168,128,0.2)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center gap-1.5"
                  >
                    {updateScheduleMutation.isPending && (
                      <div className="h-3 w-3 border-2 border-davinci-black border-t-transparent rounded-full animate-spin" />
                    )}
                    Salvar Grade Semanal
                  </button>
                </div>
              </div>

              {/* Card 3: Bloqueios e Férias */}
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm space-y-6">
                <div>
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-davinci-gold/10 border border-davinci-gold/20 text-davinci-gold text-[10px] font-bold uppercase tracking-widest">
                    Bloqueios
                  </span>
                  <h2 className="text-xl font-bold text-davinci-black mt-2">AUSÊNCIAS, FÉRIAS & ALMOÇOS</h2>
                  <p className="text-xs text-davinci-gray mt-1">
                    Bloqueie horários específicos da sua agenda para reuniões, folgas ou férias.
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newBlockTitle || !newBlockStart || !newBlockEnd) return;
                    createBlockMutation.mutate({
                      titulo: newBlockTitle,
                      dataInicio: newBlockStart,
                      dataFim: newBlockEnd,
                    });
                  }}
                  className="bg-background/60 p-4 rounded-xl border border-zinc-200/80 space-y-4"
                >
                  <h4 className="text-[10px] font-bold text-davinci-black uppercase tracking-widest">Adicionar Bloqueio</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider font-bold text-davinci-gray mb-1">Título/Motivo</label>
                      <input
                        required
                        type="text"
                        value={newBlockTitle}
                        onChange={(e) => setNewBlockTitle(e.target.value)}
                        placeholder="Ex: Férias, Médico"
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs text-davinci-black focus:outline-none focus:border-davinci-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider font-bold text-davinci-gray mb-1">Início</label>
                      <input
                        required
                        type="datetime-local"
                        value={newBlockStart}
                        onChange={(e) => setNewBlockStart(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs text-davinci-black focus:outline-none focus:border-davinci-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider font-bold text-davinci-gray mb-1">Fim</label>
                      <input
                        required
                        type="datetime-local"
                        value={newBlockEnd}
                        onChange={(e) => setNewBlockEnd(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs text-davinci-black focus:outline-none focus:border-davinci-gold"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={createBlockMutation.isPending}
                      className="px-3.5 py-2 bg-zinc-900 text-white rounded-lg text-xs font-bold hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      {createBlockMutation.isPending && (
                        <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      )}
                      Bloquear Agenda
                    </button>
                  </div>
                </form>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-davinci-gray uppercase tracking-widest">Bloqueios Ativos</h4>

                  {blocks.length === 0 ? (
                    <div className="p-4 bg-background/50 border border-dashed border-zinc-200 text-center text-xs text-davinci-gray rounded-xl">
                      Nenhum período de bloqueio ativo no momento.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {blocks.map((block: any) => (
                        <div key={block.id} className="p-3 bg-white border border-zinc-200 rounded-xl flex items-center justify-between gap-4">
                          <div>
                            <span className="text-xs font-bold text-davinci-black">{block.titulo}</span>
                            <p className="text-[10px] text-davinci-gray mt-1">
                              De: {new Date(block.dataInicio).toLocaleString('pt-BR')} <br />
                              Até: {new Date(block.dataFim).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          
                          <button
                            onClick={() => deleteBlockMutation.mutate(block.id)}
                            disabled={deleteBlockMutation.isPending}
                            className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
