'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User, Tag, Clock, Plus, CheckCircle, Play, Smile, XCircle } from 'lucide-react';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 9); // 09h às 20h

export default function DashboardCalendar() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ hour: number; barberId: string } | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  // Form states for new appointment
  const [newClientId, setNewClientId] = useState('');
  const [newServiceId, setNewServiceId] = useState('');

  // Fetch Barbers, Clients, Services, Appointments
  const { data: barbers = [] } = useQuery({
    queryKey: ['barbers'],
    queryFn: () => fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/barbers`).then((res) => res.json()),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/clients`).then((res) => res.json()),
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/services`).then((res) => res.json()),
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/appointments`).then((res) => res.json()),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newApp: any) =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApp),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setIsNewModalOpen(false);
      resetForm();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsStatusModalOpen(false);
    },
  });

  const resetForm = () => {
    setNewClientId('');
    setNewServiceId('');
  };

  const adjustDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'border border-davinci-gold/30 bg-davinci-gold/5 text-davinci-gold';
      case 'CONFIRMED':
        return 'border border-blue-400/40 bg-blue-500/5 text-blue-300 shadow-[0_0_10px_rgba(96,165,250,0.1)]';
      case 'CHECKED_IN':
        return 'bg-amber-600/35 border border-amber-500/50 text-amber-200';
      case 'IN_PROGRESS':
        return 'bg-emerald-600/30 border-2 border-emerald-500 text-emerald-100 animate-pulse';
      case 'COMPLETED':
        return 'bg-gold-gradient text-davinci-black font-semibold border-none';
      case 'CANCELLED':
        return 'bg-red-950/20 border border-red-900/30 text-davinci-gray/70 line-through';
      default:
        return 'bg-[#222] text-[#aaa]';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'Agendado';
      case 'CONFIRMED':
        return 'Confirmado';
      case 'CHECKED_IN':
        return 'Cliente Chegou';
      case 'IN_PROGRESS':
        return 'Em Atendimento';
      case 'COMPLETED':
        return 'Finalizado';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status;
    }
  };

  // Filtrar agendamentos do dia selecionado
  const dailyAppointments = appointments.filter((app: any) => {
    const appDate = new Date(app.data);
    return (
      appDate.getFullYear() === selectedDate.getFullYear() &&
      appDate.getMonth() === selectedDate.getMonth() &&
      appDate.getDate() === selectedDate.getDate()
    );
  });

  const handleCellClick = (hour: number, barberId: string) => {
    // Procurar se já existe agendamento nessa célula
    const match = dailyAppointments.find((app: any) => {
      const appDate = new Date(app.data);
      return appDate.getHours() === hour && app.barberId === barberId;
    });

    if (match) {
      setSelectedAppointment(match);
      setIsStatusModalOpen(true);
    } else {
      setSelectedCell({ hour, barberId });
      setIsNewModalOpen(true);
    }
  };

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCell || !newClientId || !newServiceId) return;

    const appointmentDate = new Date(selectedDate);
    appointmentDate.setHours(selectedCell.hour, 0, 0, 0);

    createMutation.mutate({
      clientId: newClientId,
      serviceId: newServiceId,
      barberId: selectedCell.barberId,
      data: appointmentDate,
      status: 'CONFIRMED', // Criado pela recepção inicia como confirmado
    });
  };

  return (
    <div className="space-y-6">
      {/* Date Controls */}
      <div className="flex items-center justify-between p-4 bg-[#111111] rounded-xl border border-davinci-gold/10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => adjustDate(-1)}
            className="p-2 rounded-lg bg-[#0A0A0A] border border-davinci-gold/20 hover:border-davinci-gold/50 transition-colors text-davinci-white cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-4 py-2 rounded-lg bg-[#0A0A0A] border border-davinci-gold/20 hover:border-davinci-gold/50 text-xs font-semibold text-davinci-gold transition-colors uppercase tracking-wider cursor-pointer"
          >
            Hoje
          </button>
          <button
            onClick={() => adjustDate(1)}
            className="p-2 rounded-lg bg-[#0A0A0A] border border-davinci-gold/20 hover:border-davinci-gold/50 transition-colors text-davinci-white cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-2.5 text-davinci-white font-semibold">
          <CalendarIcon className="h-5 w-5 text-davinci-gold" />
          <span className="text-sm md:text-md uppercase tracking-wider">
            {selectedDate.toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </div>

        <div className="hidden md:flex gap-4 text-xs font-light text-davinci-gray uppercase tracking-widest">
          <span>Horário de Funcionamento: 09h - 21h</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-[#111111] rounded-xl border border-davinci-gold/10 overflow-x-auto shadow-2xl scrollbar-thin">
        <div className="min-w-[650px] lg:min-w-0">
          <div className="grid grid-cols-[80px_1fr] md:grid-cols-[100px_1fr] divide-x divide-davinci-gold/10">
            {/* Time scale label */}
            <div className="bg-[#0A0A0A] p-4 text-center text-xs font-bold text-davinci-gold uppercase tracking-wider flex items-center justify-center">
              Horário
            </div>

            {/* Barbers Header columns */}
            <div className="grid" style={{ gridTemplateColumns: `repeat(${barbers.length || 1}, minmax(0, 1fr))` }}>
              {barbers.map((barber: any) => (
                <div key={barber.id} className="p-4 text-center bg-[#0A0A0A] border-b border-davinci-gold/10">
                  <h4 className="text-sm font-bold text-davinci-white">{barber.user.nome}</h4>
                  <p className="text-[10px] text-davinci-gold font-light truncate max-w-[120px] mx-auto mt-0.5">
                    ⭐ {barber.notaMedia.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-davinci-gold/5">
            {HOURS.map((hour) => (
              <div key={hour} className="grid grid-cols-[80px_1fr] md:grid-cols-[100px_1fr] divide-x divide-davinci-gold/10 min-h-[70px]">
                {/* Hour Column */}
                <div className="flex items-center justify-center bg-[#0A0A0A]/40 text-xs font-semibold text-davinci-gray">
                  {`${hour.toString().padStart(2, '0')}:00`}
                </div>

                {/* Slots Cells */}
                <div className="grid" style={{ gridTemplateColumns: `repeat(${barbers.length || 1}, minmax(0, 1fr))` }}>
                  {barbers.map((barber: any) => {
                    const cellAppointment = dailyAppointments.find((app: any) => {
                      const appDate = new Date(app.data);
                      return appDate.getHours() === hour && app.barberId === barber.id;
                    });

                    return (
                      <div
                        key={barber.id}
                        onClick={() => handleCellClick(hour, barber.id)}
                        className="p-2 flex flex-col justify-center min-h-[70px] cursor-pointer hover:bg-davinci-gold/2 transition-colors relative group"
                      >
                        {cellAppointment ? (
                          <motion.div
                            layoutId={`card-${cellAppointment.id}`}
                            className={`w-full h-full p-2.5 rounded-lg text-left text-xs flex flex-col justify-between shadow-md transition-all ${getStatusStyle(
                              cellAppointment.status
                            )}`}
                          >
                            <div className="font-bold truncate">{cellAppointment.client.nome}</div>
                            <div className="flex items-center justify-between text-[10px] mt-1 font-light opacity-90">
                              <span className="truncate max-w-[70%]">{cellAppointment.service.nome}</span>
                              <span className="font-bold">R$ {cellAppointment.valor}</span>
                            </div>
                            <span className="absolute top-1.5 right-1.5 text-[8px] uppercase tracking-wider font-extrabold opacity-70">
                              {getStatusLabel(cellAppointment.status)}
                            </span>
                          </motion.div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center border border-dashed border-davinci-gold/5 group-hover:border-davinci-gold/30 rounded-lg text-davinci-gold/0 group-hover:text-davinci-gold transition-all text-xs">
                            <Plus className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL 1: Novo Agendamento */}
      <AnimatePresence>
        {isNewModalOpen && selectedCell && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111111] border border-davinci-gold/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-davinci-gold/10 bg-[#0A0A0A] flex justify-between items-center">
                <h3 className="text-md font-bold text-davinci-white uppercase tracking-wider flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-davinci-gold" />
                  Agendar Cliente
                </h3>
                <button
                  onClick={() => setIsNewModalOpen(false)}
                  className="text-davinci-gray hover:text-davinci-white cursor-pointer"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateAppointment} className="p-6 space-y-6">
                <div className="bg-[#0A0A0A] p-3 rounded-lg border border-davinci-gold/10 flex items-center justify-between text-xs text-davinci-gray">
                  <span>Horário: <strong>{`${selectedCell.hour}:00`}</strong></span>
                  <span>Data: <strong>{selectedDate.toLocaleDateString('pt-BR')}</strong></span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-davinci-gray uppercase tracking-wider mb-2">
                      Selecionar Cliente
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-davinci-gray" />
                      <select
                        required
                        value={newClientId}
                        onChange={(e) => setNewClientId(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#0A0A0A] border border-davinci-gold/20 rounded-lg text-davinci-white focus:outline-none focus:border-davinci-gold text-sm cursor-pointer"
                      >
                        <option value="" disabled>-- Escolha o cliente --</option>
                        {clients.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.nome} ({c.telefone})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-davinci-gray uppercase tracking-wider mb-2">
                      Serviço Premium
                    </label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-davinci-gray" />
                      <select
                        required
                        value={newServiceId}
                        onChange={(e) => setNewServiceId(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#0A0A0A] border border-davinci-gold/20 rounded-lg text-davinci-white focus:outline-none focus:border-davinci-gold text-sm cursor-pointer"
                      >
                        <option value="" disabled>-- Escolha o serviço --</option>
                        {services.map((s: any) => (
                          <option key={s.id} value={s.id}>{s.nome} - R$ {s.preco}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="w-full py-3 bg-gold-gradient rounded-lg text-davinci-black font-semibold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_4px_15px_rgba(198,161,91,0.2)] cursor-pointer"
                >
                  {createMutation.isPending ? 'Agendando...' : 'Confirmar Agendamento'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Fluxo Operacional de Atendimento */}
      <AnimatePresence>
        {isStatusModalOpen && selectedAppointment && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111111] border border-davinci-gold/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-davinci-gold/10 bg-[#0A0A0A] flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-davinci-white uppercase tracking-wider">
                    Operação do Atendimento
                  </h3>
                  <p className="text-[10px] text-davinci-gold tracking-widest uppercase mt-0.5">
                    Cliente: {selectedAppointment.client.nome}
                  </p>
                </div>
                <button
                  onClick={() => setIsStatusModalOpen(false)}
                  className="text-davinci-gray hover:text-davinci-white cursor-pointer"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Details */}
                <div className="bg-[#0A0A0A] p-4 rounded-xl border border-davinci-gold/10 space-y-2 text-xs text-davinci-gray">
                  <div className="flex justify-between">
                    <span>Barbeiro:</span>
                    <span className="text-davinci-white font-bold">{selectedAppointment.barber.user.nome}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Serviço:</span>
                    <span className="text-davinci-white font-bold">{selectedAppointment.service.nome}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valor:</span>
                    <span className="text-davinci-gold font-bold">R$ {selectedAppointment.valor.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status Atual:</span>
                    <span className="text-davinci-white font-bold uppercase tracking-wider">
                      {getStatusLabel(selectedAppointment.status)}
                    </span>
                  </div>
                </div>

                {/* Workflow Buttons */}
                <div className="space-y-3">
                  <label className="block text-[10px] font-bold text-davinci-gray uppercase tracking-widest mb-1 text-center">
                    Alterar Status do Atendimento
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Check-In */}
                    <button
                      onClick={() =>
                        updateStatusMutation.mutate({ id: selectedAppointment.id, status: 'CHECKED_IN' })
                      }
                      disabled={selectedAppointment.status === 'CHECKED_IN' || selectedAppointment.status === 'COMPLETED'}
                      className="p-3 bg-[#0A0A0A] border border-amber-500/25 text-amber-400 hover:bg-amber-500/10 disabled:opacity-40 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Cliente Chegou
                    </button>

                    {/* Iniciar Atendimento */}
                    <button
                      onClick={() =>
                        updateStatusMutation.mutate({ id: selectedAppointment.id, status: 'IN_PROGRESS' })
                      }
                      disabled={selectedAppointment.status === 'IN_PROGRESS' || selectedAppointment.status === 'COMPLETED'}
                      className="p-3 bg-[#0A0A0A] border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Play className="h-4 w-4" />
                      Iniciar Corte
                    </button>
                  </div>

                  {/* Concluir Atendimento */}
                  <button
                    onClick={() =>
                      updateStatusMutation.mutate({ id: selectedAppointment.id, status: 'COMPLETED' })
                    }
                    disabled={selectedAppointment.status === 'COMPLETED'}
                    className="w-full p-3 bg-gold-gradient text-davinci-black disabled:opacity-40 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-[0_4px_10px_rgba(198,161,91,0.15)] cursor-pointer"
                  >
                    <Smile className="h-4.5 w-4.5" />
                    Finalizar Atendimento (Comissão + Feedback)
                  </button>

                  {/* Cancelar */}
                  <button
                    onClick={() =>
                      updateStatusMutation.mutate({ id: selectedAppointment.id, status: 'CANCELLED' })
                    }
                    disabled={selectedAppointment.status === 'CANCELLED' || selectedAppointment.status === 'COMPLETED'}
                    className="w-full py-2 bg-transparent text-red-500 hover:bg-red-500/5 hover:text-red-400 disabled:opacity-40 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    Cancelar Agendamento
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
