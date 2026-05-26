'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Scissors, Calendar, User, Tag, Clock, ArrowRight, ShieldCheck, LogOut, CheckCircle, Gift, Edit2, Check } from 'lucide-react';
import { useStore } from '@/store/useStore';

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

  // Fetch client complete profile (past appointments)
  const clientId = user?.id;
  const { data: client, isLoading, error } = useQuery({
    queryKey: ['clientPortalProfile', clientId],
    queryFn: () => fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/clients/${clientId}`).then((res) => { if (!res.ok) throw new Error('Failed to fetch client'); return res.json(); }),
    enabled: !!clientId,
  });

  useEffect(() => {
    if (client?.aniversario) {
      setBirthdayVal(client.aniversario);
    }
  }, [client]);

  const updateBirthdayMutation = useMutation({
    mutationFn: (newAniv: string) =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: client?.nome,
          telefone: client?.telefone,
          aniversario: newAniv,
        }),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientPortalProfile', clientId] });
      setEditBirthday(false);
    },
  });

  // Fetch Barbers & Services for booking selection
  const { data: barbers = [] } = useQuery({
    queryKey: ['barbers'],
    queryFn: () => fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/barbers`).then((res) => { if (!res.ok) throw new Error('Failed to fetch barbers'); return res.json(); }),
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/services`).then((res) => { if (!res.ok) throw new Error('Failed to fetch services'); return res.json(); }),
  });

  // Buscar todos os agendamentos para checar horários ocupados
  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/appointments`).then((res) => { if (!res.ok) throw new Error('Failed to fetch appointments'); return res.json(); }),
  });

  const createAppointmentMutation = useMutation({
    mutationFn: (newApp: any) =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApp),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientPortalProfile', clientId] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setBookingSuccess(true);
      resetBookingForm();
      setTimeout(() => setBookingSuccess(false), 5000);
    },
  });

  const resetBookingForm = () => {
    setSelectedBarber('');
    setSelectedService('');
    setSelectedHour('');
  };

  // Horários de atendimento disponíveis (ex: 09h às 19h)
  const HOURS = ['09', '10', '11', '13', '14', '15', '16', '17', '18', '19'];

  const getDaysInMonthGrid = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const grid = [];
    for (let i = 0; i < firstDayIndex; i++) {
      grid.push(null);
    }
    for (let day = 1; day <= totalDays; day++) {
      grid.push(new Date(year, month, day));
    }
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
    <div className="min-h-screen bg-background text-davinci-black p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-davinci-gold/15 border border-davinci-gold/40 flex items-center justify-center font-bold text-davinci-gold">
            {client.nome.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-md font-bold text-davinci-black">Olá, {client.nome}</h2>
            <p className="text-[10px] text-davinci-gray font-light uppercase tracking-wider flex flex-wrap items-center gap-1.5 mt-0.5">
              <span>Portal do Cliente</span>
              <span>•</span>
              <span>Tel: {client.telefone}</span>
              {client.aniversario && (
                <>
                  <span>•</span>
                  <span className="text-davinci-gold flex items-center gap-1 font-semibold">
                    <Gift className="h-3 w-3" />
                    Niver: {client.aniversario}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open('/catalogo', '_blank')}
            className="p-2 rounded-lg bg-white border border-davinci-gold/30 text-davinci-gold hover:bg-davinci-gold/5 transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Scissors className="h-4 w-4" />
            Ver Catálogo
          </button>

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg bg-white border border-red-200 text-red-500 hover:bg-red-50 transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </div>

      {/* Metrics & Profile summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm space-y-1">
          <span className="text-[9px] text-davinci-gray uppercase tracking-widest font-bold block">Suas Visitas</span>
          <h3 className="text-2xl font-black text-davinci-black text-glow">{client.frequency} cortes</h3>
        </div>

        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm space-y-1">
          <span className="text-[9px] text-davinci-gray uppercase tracking-widest font-bold block">Gasto Total Acumulado</span>
          <h3 className="text-2xl font-black text-davinci-gold text-glow">
            R$ {(client.frequency * client.ticketMedio).toFixed(2)}
          </h3>
        </div>

        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm space-y-1">
          <span className="text-[9px] text-davinci-gray uppercase tracking-widest font-bold block">Preferências</span>
          <p className="text-xs text-davinci-gray italic truncate mt-1">
            {client.preferences || 'Nenhuma preferência ainda.'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm space-y-1 flex flex-col justify-between">
          <div>
            <span className="text-[9px] text-davinci-gray uppercase tracking-widest font-bold block">Data de Aniversário</span>
            {editBirthday ? (
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="text"
                  value={birthdayVal}
                  onChange={(e) => setBirthdayVal(e.target.value)}
                  placeholder="Ex: 15/09"
                  className="w-24 px-2 py-1 bg-white border border-zinc-200 rounded text-davinci-black text-xs focus:outline-none focus:border-davinci-gold shadow-sm"
                />
                <button
                  onClick={() => updateBirthdayMutation.mutate(birthdayVal)}
                  disabled={updateBirthdayMutation.isPending}
                  className="p-1 bg-davinci-gold/25 border border-davinci-gold/50 rounded text-davinci-gold hover:bg-davinci-gold/40 transition-colors cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between mt-1">
                <h3 className="text-xl font-black text-davinci-black text-glow">
                  {client.aniversario || 'Não definida'}
                </h3>
                <button
                  onClick={() => setEditBirthday(true)}
                  className="p-1 text-davinci-gray hover:text-davinci-gold transition-colors cursor-pointer"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Booking Form Card */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-bold text-davinci-black uppercase tracking-wider flex items-center gap-2">
              <Calendar className="h-5 w-5 text-davinci-gold" />
              Agendar Novo Atendimento
            </h3>
            <p className="text-[10px] text-davinci-gray mt-1">Escolha seu serviço e reserve seu horário.</p>
          </div>

          {bookingSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs rounded-lg flex items-center gap-2 font-medium">
              <CheckCircle className="h-5 w-5" />
              Agendamento efetuado! Estaremos te esperando.
            </div>
          )}

          <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] text-davinci-gray uppercase tracking-wider mb-2 font-bold">
                Escolha o Serviço
              </label>
              <select
                required
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg text-davinci-black focus:outline-none focus:border-davinci-gold text-xs shadow-sm"
              >
                <option value="" disabled>-- Selecione um serviço --</option>
                {services.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.nome} - R$ {s.preco.toFixed(2)} ({s.duracao} min)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-davinci-gray uppercase tracking-wider mb-2 font-bold">
                Escolha seu Barbeiro
              </label>
              <select
                required
                value={selectedBarber}
                onChange={(e) => {
                  setSelectedBarber(e.target.value);
                  setSelectedHour('');
                }}
                className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg text-davinci-black focus:outline-none focus:border-davinci-gold text-xs shadow-sm"
              >
                <option value="" disabled>-- Selecione um profissional --</option>
                {barbers.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.user.nome} (⭐ {b.notaMedia})</option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-davinci-gray uppercase tracking-wider mb-2 font-bold">
                  Selecione o Dia no Calendário
                </label>
                
                {/* Mini Monthly Calendar Widget */}
                <div className="bg-white p-4 rounded-xl border border-zinc-200 space-y-4 shadow-sm">
                  {/* Month header */}
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

                  {/* Day labels header */}
                  <div className="grid grid-cols-7 gap-1 text-center text-[9px] text-davinci-gray uppercase font-bold">
                    <span>Dom</span>
                    <span>Seg</span>
                    <span>Ter</span>
                    <span>Qua</span>
                    <span>Qui</span>
                    <span>Sex</span>
                    <span>Sáb</span>
                  </div>

                  {/* Grid cells */}
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
                  Horário de Preferência
                </label>
                
                {!selectedBarber ? (
                  <p className="text-[10px] text-davinci-gray font-light italic bg-zinc-50 p-3 rounded-lg border border-zinc-200/60 text-center">
                    Por favor, selecione um profissional para visualizar os horários disponíveis.
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
                        {!slot.available && (
                          <span className="text-[6px] uppercase tracking-tighter opacity-50 block mt-0.5">Ocupado</span>
                        )}
                        {slot.available && (
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
              className="w-full py-3 bg-gold-gradient rounded-lg text-davinci-black font-semibold text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-[0_4px_15px_rgba(198,161,91,0.2)] flex items-center justify-center gap-1 cursor-pointer"
            >
              Reservar Cadeira
              <ArrowRight className="h-4.5 w-4.5" />
            </button>
          </form>
        </div>

        {/* History timeline card */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-davinci-black uppercase tracking-widest">Seu Histórico de Cortes</h3>

          {client.appointments.length === 0 ? (
            <p className="text-xs text-davinci-gray font-light">Nenhum atendimento registrado no seu perfil.</p>
          ) : (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {client.appointments.map((app: any) => (
                <div key={app.id} className="bg-zinc-50 p-4 rounded-xl border border-zinc-200/60 flex justify-between items-center text-xs">
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
      </div>
    </div>
  );
}
