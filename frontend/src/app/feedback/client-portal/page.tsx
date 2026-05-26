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
} from 'lucide-react';
import { useStore } from '@/store/useStore';

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
      fetch(`${apiUrl}/clients/${clientId}`).then((res) => {
        if (!res.ok) throw new Error('Failed to fetch client');
        return res.json();
      }),
    enabled: !!clientId,
  });

  useEffect(() => {
    if (client?.aniversario) {
      setBirthdayVal(formatBirthdayDisplay(client.aniversario));
    }
  }, [client]);

  const updateBirthdayMutation = useMutation({
    mutationFn: (newAniv: string) =>
      fetch(`${apiUrl}/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
      fetch(`${apiUrl}/barbers`).then((res) => {
        if (!res.ok) throw new Error('Failed to fetch barbers');
        return res.json();
      }),
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () =>
      fetch(`${apiUrl}/services`).then((res) => {
        if (!res.ok) throw new Error('Failed to fetch services');
        return res.json();
      }),
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: () =>
      fetch(`${apiUrl}/appointments`).then((res) => {
        if (!res.ok) throw new Error('Failed to fetch appointments');
        return res.json();
      }),
  });

  const createAppointmentMutation = useMutation({
    mutationFn: (newApp: any) =>
      fetch(`${apiUrl}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApp),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Falha ao criar agendamento');
        return data;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientPortalProfile', clientId] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setBookingSuccess(true);
      setSelectedBarber('');
      setSelectedService('');
      setSelectedHour('');
      setTimeout(() => setBookingSuccess(false), 5000);
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

    return HOURS.map((hourStr) => {
      const hourInt = parseInt(hourStr, 10);

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
    });
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (isLoading || !client) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-davinci-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(197,168,128,0.10),transparent_30%),linear-gradient(180deg,#fcfaf6_0%,#f7f1e7_100%)] text-davinci-black">
      <div className="max-w-6xl mx-auto px-6 py-8 lg:py-10 space-y-8">
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

              <div className="flex items-center gap-2 self-start">
                <button
                  onClick={() => window.open('/catalogo', '_blank')}
                  className="px-4 py-2.5 rounded-xl bg-white border border-davinci-gold/30 text-davinci-gold hover:bg-davinci-gold/5 transition-colors text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Scissors className="h-4 w-4" />
                  Ver Catalogo
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2.5 rounded-xl bg-white border border-red-200 text-red-500 hover:bg-red-50 transition-colors text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
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
            id="booking"
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

                {barbers.length === 0 ? (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-davinci-gray font-medium">
                    Nenhum profissional disponivel no momento.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {barbers.map((barber: any) => {
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
    </div>
  );
}
