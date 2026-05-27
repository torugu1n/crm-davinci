'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, CheckCircle, Play, Smile, XCircle, Search } from 'lucide-react';
import { useStore } from '@/store/useStore';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 9); // 09h às 20h

// Custom Mini-Calendar Popover
const DatePickerPopover = ({ selectedDate, onChange, onClose }: { selectedDate: Date; onChange: (d: Date) => void; onClose: () => void }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const startDayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const dayCells = [];
  // Empty slots for start day offset
  for (let i = 0; i < startDayOfWeek; i++) {
    dayCells.push(<div key={`empty-${i}`} className="w-8 h-8" />);
  }
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const isSelected = selectedDate.getDate() === day &&
                       selectedDate.getMonth() === currentMonth.getMonth() &&
                       selectedDate.getFullYear() === currentMonth.getFullYear();
    const isToday = new Date().getDate() === day &&
                    new Date().getMonth() === currentMonth.getMonth() &&
                    new Date().getFullYear() === currentMonth.getFullYear();

    dayCells.push(
      <button
        key={`day-${day}`}
        type="button"
        onClick={() => {
          onChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
          onClose();
        }}
        className={`w-8 h-8 rounded-full text-xs flex items-center justify-center transition-all cursor-pointer font-semibold ${
          isSelected
            ? 'bg-davinci-gold text-white shadow-md'
            : isToday
            ? 'border border-davinci-gold text-davinci-gold font-bold'
            : 'text-davinci-black hover:bg-davinci-gold/15'
        }`}
      >
        {day}
      </button>
    );
  }

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-white border border-zinc-200/80 rounded-xl p-4 shadow-xl z-50 w-64">
      <div className="flex justify-between items-center mb-3">
        <button type="button" onClick={prevMonth} className="p-1 rounded hover:bg-zinc-100 text-davinci-black cursor-pointer">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-bold text-davinci-black uppercase tracking-wider">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>
        <button type="button" onClick={nextMonth} className="p-1 rounded hover:bg-zinc-100 text-davinci-black cursor-pointer">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-davinci-gray uppercase tracking-wider mb-2">
        <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span>
      </div>
      <div className="grid grid-cols-7 gap-1 justify-items-center">
        {dayCells}
      </div>
    </div>
  );
};

export default function DashboardCalendar() {
  const queryClient = useQueryClient();
  const token = useStore((state) => state.token);
  const addNotification = useStore((state) => state.addNotification);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ hour: number; barberId: string } | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  
  // Hover coordinate tracking
  const [hoveredCell, setHoveredCell] = useState<{ hour: number; barberId: string } | null>(null);

  // Form states for new appointment
  const [newClientId, setNewClientId] = useState('');
  const [newServiceId, setNewServiceId] = useState('');
  const [newBarberId, setNewBarberId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [barberSearch, setBarberSearch] = useState('');
  const [activeLookup, setActiveLookup] = useState<'client' | 'service' | null>(null);
  const [isBarberPickerOpen, setIsBarberPickerOpen] = useState(false);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientBirthday, setNewClientBirthday] = useState('');

  // Clock state for live timeline
  const [now, setNow] = useState(new Date());

  // Filters state
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');
  const [selectedBarberFilter, setSelectedBarberFilter] = useState('ALL');

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Barbers, Clients, Services, Appointments
  const { data: barbers = [] } = useQuery({
    queryKey: ['barbers'],
    queryFn: () => fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/barbers`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    }).then((res) => { if (!res.ok) throw new Error('Failed to fetch barbers'); return res.json(); }),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/clients`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    }).then((res) => { if (!res.ok) throw new Error('Failed to fetch clients'); return res.json(); }),
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/services`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    }).then((res) => { if (!res.ok) throw new Error('Failed to fetch services'); return res.json(); }),
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/appointments`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    }).then((res) => { if (!res.ok) throw new Error('Failed to fetch appointments'); return res.json(); }),
  });

  const { data: agendaBlocks = [] } = useQuery({
    queryKey: ['allAgendaBlocks'],
    queryFn: () => fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/barbers/blocks/all`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    }).then((res) => { if (!res.ok) throw new Error('Failed to fetch blocks'); return res.json(); }),
  });

  const filteredBarbers = barbers.filter((barber: any) => {
    const matchesRole = selectedRoleFilter === 'ALL' || barber.categoria === selectedRoleFilter;
    const matchesBarber = selectedBarberFilter === 'ALL' || barber.id === selectedBarberFilter;
    return matchesRole && matchesBarber;
  });

  const allowedBarbersForFilter = selectedRoleFilter === 'ALL'
    ? barbers
    : barbers.filter((b: any) => b.categoria === selectedRoleFilter);

  const handleRoleFilterChange = (role: string) => {
    setSelectedRoleFilter(role);
    setSelectedBarberFilter('ALL');
  };

  const allowedServices = services;
  const normalizeSearch = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const sortByName = (items: any[], getName: (item: any) => string) =>
    [...items].sort((a, b) => getName(a).localeCompare(getName(b), 'pt-BR', { sensitivity: 'base' }));

  const filteredClientsForModal = sortByName(clients, (client) => client.nome || '').filter((client: any) => {
    const search = normalizeSearch(clientSearch);
    const phone = String(client.telefone || '').replace(/\D/g, '');
    return (
      normalizeSearch(client.nome || '').includes(search) ||
      phone.includes(clientSearch.replace(/\D/g, ''))
    );
  });

  const filteredServicesForModal = sortByName(allowedServices, (service) => service.nome || '').filter((service: any) => {
    const search = normalizeSearch(serviceSearch);
    return (
      normalizeSearch(service.nome || '').includes(search) ||
      normalizeSearch(service.descricao || '').includes(search) ||
      String(service.preco || '').includes(serviceSearch)
    );
  });

  const visibleClientsForModal = filteredClientsForModal.slice(0, 8);
  const visibleServicesForModal = filteredServicesForModal.slice(0, 8);
  const shouldShowClientResults = activeLookup === 'client' && clientSearch.trim().length > 0;
  const shouldShowServiceResults = activeLookup === 'service' && serviceSearch.trim().length > 0;
  const selectedService = services.find((service: any) => service.id === newServiceId);
  const selectedBarber = barbers.find((barber: any) => barber.id === newBarberId);
  const selectedServiceBarberIds = new Set((selectedService?.barbers || []).map((barber: any) => barber.id));
  const compatibleBarbers = selectedServiceBarberIds.size > 0
    ? barbers.filter((barber: any) => selectedServiceBarberIds.has(barber.id))
    : barbers;
  const filteredCompatibleBarbers = sortByName(compatibleBarbers, (barber) => barber.user?.nome || '').filter((barber: any) => {
    const search = normalizeSearch(barberSearch);
    return (
      normalizeSearch(barber.user?.nome || '').includes(search) ||
      normalizeSearch(barber.categoria || '').includes(search) ||
      normalizeSearch(barber.especialidade || '').includes(search)
    );
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newApp: any) =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newApp),
      }).then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.message || 'Não foi possível criar o agendamento.');
        }
        return data;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['barbers'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      addNotification({
        title: 'Agendamento criado',
        description: 'O cliente, profissional e serviço foram vinculados com sucesso.',
        type: 'success',
      });
      setIsNewModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      addNotification({
        title: 'Erro ao criar agendamento',
        description: err.message || 'Verifique os dados e tente novamente.',
        type: 'error',
      });
    },
  });

  const createClientMutation = useMutation({
    mutationFn: (newClient: any) =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newClient),
      }).then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.message || 'Não foi possível cadastrar o cliente.');
        }
        return data;
      }),
    onSuccess: (client) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setNewClientId(client.id);
      setClientSearch(client.nome);
      setShowNewClientForm(false);
      setNewClientName('');
      setNewClientPhone('');
      setNewClientBirthday('');
      addNotification({
        title: 'Cliente cadastrado',
        description: 'O novo cliente foi selecionado para este agendamento.',
        type: 'success',
      });
    },
    onError: (err: any) => {
      addNotification({
        title: 'Erro ao cadastrar cliente',
        description: err.message || 'Verifique nome e telefone.',
        type: 'error',
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/appointments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
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
    setNewBarberId('');
    setClientSearch('');
    setServiceSearch('');
    setBarberSearch('');
    setActiveLookup(null);
    setIsBarberPickerOpen(false);
    setShowNewClientForm(false);
    setNewClientName('');
    setNewClientPhone('');
    setNewClientBirthday('');
  };

  const adjustDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'border border-davinci-gold/30 bg-davinci-gold/5 text-davinci-gold shadow-[0_2px_8px_rgba(197,168,128,0.04)]';
      case 'CONFIRMED':
        return 'border border-blue-200 bg-blue-50 text-blue-700 shadow-[0_2px_8px_rgba(59,130,246,0.04)]';
      case 'CHECKED_IN':
        return 'border border-amber-200 bg-amber-50 text-amber-800';
      case 'IN_PROGRESS':
        return 'border-2 border-emerald-500 bg-emerald-50 text-emerald-800 animate-pulse';
      case 'COMPLETED':
        return 'bg-gold-gradient text-davinci-black font-semibold border-none shadow-[0_2px_8px_rgba(197,168,128,0.12)]';
      case 'CANCELLED':
        return 'border border-zinc-100 bg-zinc-50/50 text-zinc-400 line-through';
      default:
        return 'bg-zinc-100 text-zinc-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'Agendado';
      case 'CONFIRMED':
        return 'Confirmado';
      case 'CHECKED_IN':
        return 'Chegou';
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

  // Check if calendar date is today
  const isToday = now.toDateString() === selectedDate.toDateString();

  // Calculate live timeline top offset
  const getTimelineTop = () => {
    const startHour = 9;
    const endHour = 21;
    const rowHeight = 72; // height in px
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    
    if (currentHour < startHour || currentHour >= endHour) return null;
    
    const minutesSinceStart = (currentHour - startHour) * 60 + currentMin;
    const pixelsPerMinute = rowHeight / 60;
    return minutesSinceStart * pixelsPerMinute;
  };

  const timelineTop = isToday ? getTimelineTop() : null;

  // Filter daily appointments
  const dailyAppointments = appointments.filter((app: any) => {
    const appDate = new Date(app.data);
    return (
      appDate.getFullYear() === selectedDate.getFullYear() &&
      appDate.getMonth() === selectedDate.getMonth() &&
      appDate.getDate() === selectedDate.getDate()
    );
  });

  const handleCellClick = (hour: number, barberId: string) => {
    const match = dailyAppointments.find((app: any) => {
      const appDate = new Date(app.data);
      return appDate.getHours() === hour && app.barberId === barberId;
    });

    if (match) {
      setSelectedAppointment(match);
      setIsStatusModalOpen(true);
    } else {
      setSelectedCell({ hour, barberId });
      setNewBarberId(barberId);
      setBarberSearch('');
      setIsNewModalOpen(true);
    }
  };

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCell || !newClientId || !newServiceId || !newBarberId) return;

    const appointmentDate = new Date(selectedDate);
    appointmentDate.setHours(selectedCell.hour, 0, 0, 0);

    createMutation.mutate({
      clientId: newClientId,
      serviceId: newServiceId,
      barberId: newBarberId,
      data: appointmentDate,
      status: 'CONFIRMED',
    });
  };

  const handleCreateClient = () => {
    if (!newClientName.trim() || !newClientPhone.trim()) return;

    createClientMutation.mutate({
      nome: newClientName.trim(),
      telefone: newClientPhone.trim(),
      aniversario: newClientBirthday.trim() || undefined,
      origem: 'Agenda',
    });
  };

  return (
    <div className="space-y-6">
      {/* Date Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 p-4 bg-white rounded-xl border border-zinc-200/80 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => adjustDate(-1)}
            className="p-2 rounded-lg bg-white border border-zinc-200 hover:border-davinci-gold transition-colors text-davinci-black cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-4 py-2 rounded-lg bg-white border border-zinc-200 hover:border-davinci-gold text-xs font-semibold text-davinci-gold transition-colors uppercase tracking-wider cursor-pointer"
          >
            Hoje
          </button>
          <button
            onClick={() => adjustDate(1)}
            className="p-2 rounded-lg bg-white border border-zinc-200 hover:border-davinci-gold transition-colors text-davinci-black cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Premium Filters Selector */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Categoria/Função */}
          <select
            value={selectedRoleFilter}
            onChange={(e) => handleRoleFilterChange(e.target.value)}
            className="px-3.5 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-davinci-black focus:outline-none focus:border-davinci-gold font-medium cursor-pointer shadow-sm hover:border-zinc-300 transition-colors"
          >
            <option value="ALL">Todas as funções</option>
            <option value="BARBER">Barbeiro</option>
            <option value="HAIRDRESSER">Cabeleireira(o)</option>
            <option value="MANICURE_PEDICURE">Manicure/Pedicure</option>
            <option value="OTHER">Outros</option>
          </select>

          {/* Profissionais */}
          <select
            value={selectedBarberFilter}
            onChange={(e) => setSelectedBarberFilter(e.target.value)}
            className="px-3.5 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-davinci-black focus:outline-none focus:border-davinci-gold font-medium cursor-pointer shadow-sm hover:border-zinc-300 transition-colors"
          >
            <option value="ALL">Todos os profissionais</option>
            {allowedBarbersForFilter.map((b: any) => (
              <option key={b.id} value={b.id}>{b.user.nome}</option>
            ))}
          </select>

          {/* Premium DatePicker Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="flex items-center gap-2.5 text-davinci-black font-semibold hover:text-davinci-gold transition-colors cursor-pointer border border-zinc-200/60 bg-white py-2 px-4 rounded-xl shadow-sm hover:shadow-md"
            >
              <CalendarIcon className="h-5 w-5 text-davinci-gold" />
              <span className="text-xs md:text-sm uppercase tracking-wider font-bold">
                {selectedDate.toLocaleDateString('pt-BR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </button>
            
            {isDatePickerOpen && (
              <DatePickerPopover
                selectedDate={selectedDate}
                onChange={(d) => setSelectedDate(d)}
                onClose={() => setIsDatePickerOpen(false)}
              />
            )}
          </div>
        </div>

        <div className="hidden xl:flex gap-4 text-[10px] font-bold text-davinci-gray uppercase tracking-widest">
          <span>Horário de Funcionamento: 09h - 21h</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl border border-zinc-200/80 overflow-x-auto shadow-md scrollbar-thin">
        <div className="min-w-[750px] lg:min-w-0">
          
          {/* Header Grid */}
          <div className="grid grid-cols-[80px_1fr] md:grid-cols-[100px_1fr] divide-x divide-zinc-200/80 border-b border-zinc-200/80">
            {/* Time scale label */}
            <div className="bg-background p-4 text-center text-xs font-bold text-davinci-gold uppercase tracking-wider flex items-center justify-center">
              Horário
            </div>

            {/* Barbers Header columns */}
            <div className="grid" style={{ gridTemplateColumns: `repeat(${filteredBarbers.length || 1}, minmax(0, 1fr))` }}>
              {filteredBarbers.length === 0 ? (
                <div className="p-4 text-center text-xs text-davinci-gray font-semibold bg-background flex items-center justify-center col-span-full">
                  Nenhum profissional com os filtros aplicados
                </div>
              ) : (
                filteredBarbers.map((barber: any) => {
                  const isHoveredCol = hoveredCell?.barberId === barber.id;
                  return (
                    <div 
                      key={barber.id} 
                      className={`p-4 text-center transition-colors flex flex-col items-center justify-center ${
                        isHoveredCol ? 'bg-davinci-gold/5' : 'bg-background'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-davinci-gold/10 border border-davinci-gold/30 flex items-center justify-center font-bold text-xs text-davinci-gold mb-1 shadow-inner">
                        {barber.user.nome.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <h4 className="text-xs font-bold text-davinci-black leading-tight">{barber.user.nome}</h4>
                      <p className="text-[9px] text-davinci-gold font-semibold tracking-wider mt-0.5">
                        ★ {barber.notaMedia.toFixed(2)}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Grid Rows Wrapper with Relative positioning for live timeline and sliding animation */}
          <div className="relative divide-y divide-zinc-200/80">
            
            {/* Live Timeline Line */}
            {timelineTop !== null && (
              <div 
                className="absolute right-0 h-[2px] bg-red-400 z-10 pointer-events-none flex items-center"
                style={{ 
                  top: `${timelineTop}px`, 
                  left: '100px',
                  boxShadow: '0 0 8px rgba(248,113,113,0.6)'
                }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1 border-2 border-white shadow-md animate-ping absolute" />
                <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 border-2 border-white shadow-md" />
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={selectedDate.toDateString()}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="divide-y divide-zinc-100"
              >
                {HOURS.map((hour) => {
                  const isHoveredRow = hoveredCell?.hour === hour;
                  
                  return (
                    <div key={hour} className="grid grid-cols-[80px_1fr] md:grid-cols-[100px_1fr] divide-x divide-zinc-200/80 h-[72px]">
                      {/* Hour Column */}
                      <div className={`flex items-center justify-center text-xs font-bold transition-colors border-r border-zinc-200/80 ${
                        isHoveredRow ? 'bg-davinci-gold/10 text-davinci-gold font-extrabold' : 'bg-background/50 text-davinci-gray'
                      }`}>
                        {`${hour.toString().padStart(2, '0')}:00`}
                      </div>

                      {/* Slots Cells */}
                      <div className="grid" style={{ gridTemplateColumns: `repeat(${filteredBarbers.length || 1}, minmax(0, 1fr))` }}>
                        {filteredBarbers.length === 0 ? (
                          <div className="h-[72px] bg-background/10 col-span-full" />
                        ) : (
                          filteredBarbers.map((barber: any) => {
                            const cellAppointment = dailyAppointments.find((app: any) => {
                              const appDate = new Date(app.data);
                              return appDate.getHours() === hour && app.barberId === barber.id;
                            });

                            const cellBlock = agendaBlocks.find((block: any) => {
                              const blockStart = new Date(block.dataInicio);
                              const blockEnd = new Date(block.dataFim);
                              const targetTime = new Date(selectedDate);
                              targetTime.setHours(hour, 0, 0, 0);
                              return block.barberId === barber.id && targetTime >= blockStart && targetTime < blockEnd;
                            });

                            const isHoveredCell = hoveredCell?.hour === hour && hoveredCell?.barberId === barber.id;
                            const isHoveredCol = hoveredCell?.barberId === barber.id;

                            return (
                              <div
                                key={barber.id}
                                onMouseEnter={() => setHoveredCell({ hour, barberId: barber.id })}
                                onMouseLeave={() => setHoveredCell(null)}
                                onClick={() => {
                                  if (cellBlock) return;
                                  handleCellClick(hour, barber.id);
                                }}
                                className={`p-2 flex flex-col justify-center h-[72px] cursor-pointer transition-all relative group ${
                                  isHoveredCell
                                    ? 'bg-davinci-gold/15'
                                    : isHoveredRow || isHoveredCol
                                    ? 'bg-davinci-gold/5'
                                    : 'bg-transparent'
                                }`}
                              >
                              {cellAppointment ? (
                                <motion.div
                                  layoutId={`card-${cellAppointment.id}`}
                                  className={`w-full h-full p-2.5 rounded-lg text-left text-xs flex flex-col justify-between shadow-sm border-l-4 transition-all ${getStatusStyle(
                                    cellAppointment.status
                                  )}`}
                                  style={{
                                    borderLeftColor: cellAppointment.status === 'SCHEDULED' ? '#C5A880' :
                                                     cellAppointment.status === 'CONFIRMED' ? '#3B82F6' :
                                                     cellAppointment.status === 'CHECKED_IN' ? '#F59E0B' :
                                                     cellAppointment.status === 'IN_PROGRESS' ? '#10B981' :
                                                     cellAppointment.status === 'COMPLETED' ? '#10B981' : '#EF4444'
                                  }}
                                >
                                  <div className="font-bold text-davinci-black truncate">{cellAppointment.client.nome}</div>
                                  <div className="flex items-center justify-between text-[9px] mt-1 font-semibold text-davinci-gray">
                                    <span className="truncate max-w-[70%]">{cellAppointment.service.nome}</span>
                                    <span className="text-davinci-black font-extrabold">R$ {cellAppointment.valor}</span>
                                  </div>
                                  <span className="absolute top-1.5 right-1.5 text-[8px] uppercase tracking-wider font-extrabold text-davinci-gold opacity-80 bg-white/80 px-1 rounded">
                                    {getStatusLabel(cellAppointment.status)}
                                  </span>
                                </motion.div>
                              ) : cellBlock ? (
                                <div className="w-full h-full p-2 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-400 text-left flex flex-col justify-between cursor-not-allowed select-none">
                                  <div className="font-bold text-[10px] uppercase tracking-wider truncate flex items-center gap-1">
                                    <span>🔒 {cellBlock.titulo}</span>
                                  </div>
                                  <span className="text-[8px] uppercase tracking-wider font-extrabold opacity-60">
                                    Bloqueado
                                  </span>
                                </div>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center border border-dashed border-zinc-200 group-hover:border-davinci-gold/40 rounded-lg text-davinci-gold/0 group-hover:text-davinci-gold transition-all text-xs">
                                  <Plus className="h-4.5 w-4.5" />
                                </div>
                              )}
                            </div>
                          );
                        }))}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* MODAL 1: Novo Agendamento */}
      <AnimatePresence>
        {isNewModalOpen && selectedCell && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-zinc-200 rounded-2xl w-full max-w-xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-zinc-200/80 bg-background flex justify-between items-center">
                <h3 className="text-md font-bold text-davinci-black uppercase tracking-wider flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-davinci-gold" />
                  Agendar Cliente
                </h3>
                <button
                  onClick={() => setIsNewModalOpen(false)}
                  className="text-davinci-gray hover:text-davinci-black cursor-pointer transition-colors"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateAppointment} className="p-6 space-y-5 overflow-y-auto">
                <div className="bg-background p-3 rounded-lg border border-zinc-200/80 flex items-center justify-between text-xs text-davinci-gray font-semibold">
                  <span>Horário: <strong className="text-davinci-black">{`${selectedCell.hour}:00`}</strong></span>
                  <span>Data: <strong className="text-davinci-black">{selectedDate.toLocaleDateString('pt-BR')}</strong></span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-davinci-gray uppercase tracking-wider mb-2">
                      Cliente
                    </label>
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-davinci-gray" />
                      <input
                        type="search"
                        value={clientSearch}
                        onFocus={() => setActiveLookup('client')}
                        onChange={(e) => {
                          setClientSearch(e.target.value);
                          setNewClientId('');
                          setActiveLookup('client');
                        }}
                        placeholder="Pesquisar cliente por nome ou telefone..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-davinci-black focus:outline-none focus:border-davinci-gold text-sm"
                      />
                    </div>
                    {shouldShowClientResults && (
                      <div className="max-h-44 overflow-y-auto rounded-lg border border-zinc-200 bg-white divide-y divide-zinc-100 shadow-sm">
                        {visibleClientsForModal.length > 0 ? (
                          visibleClientsForModal.map((client: any) => (
                            <button
                              key={client.id}
                              type="button"
                              onClick={() => {
                                setNewClientId(client.id);
                                setClientSearch(client.nome);
                                setActiveLookup(null);
                              }}
                              className="w-full px-3 py-2 text-left transition-colors cursor-pointer hover:bg-davinci-gold/10"
                            >
                              <span className="block text-xs font-bold text-davinci-black">{client.nome}</span>
                              <span className="block text-[10px] font-semibold text-davinci-gray">{client.telefone}</span>
                            </button>
                          ))
                        ) : (
                          <p className="px-3 py-3 text-[11px] font-semibold text-davinci-gray">Nenhum cliente encontrado.</p>
                        )}
                      </div>
                    )}
                    {newClientId && (
                      <p className="mt-1 text-[10px] font-bold text-davinci-gold">
                        Cliente selecionado: {clients.find((client: any) => client.id === newClientId)?.nome}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        const hasLetters = /[A-Za-zÀ-ÿ]/.test(clientSearch);
                        const digits = clientSearch.replace(/\D/g, '');
                        setShowNewClientForm(true);
                        setNewClientName(hasLetters ? clientSearch : '');
                        setNewClientPhone(digits.length >= 8 ? clientSearch : '');
                        setNewClientBirthday('');
                      }}
                      className="mt-2 text-[11px] font-bold text-davinci-gold hover:underline cursor-pointer"
                    >
                      Cliente não cadastrado? Criar novo cliente
                    </button>

                    {showNewClientForm && (
                      <div className="mt-3 rounded-xl border border-davinci-gold/30 bg-davinci-gold/5 p-3 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <input
                            type="text"
                            value={newClientName}
                            onChange={(e) => setNewClientName(e.target.value)}
                            placeholder="Nome do cliente"
                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-davinci-black focus:outline-none focus:border-davinci-gold text-sm"
                          />
                          <input
                            type="tel"
                            value={newClientPhone}
                            onChange={(e) => setNewClientPhone(e.target.value)}
                            placeholder="WhatsApp / telefone"
                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-davinci-black focus:outline-none focus:border-davinci-gold text-sm"
                          />
                          <input
                            type="text"
                            inputMode="numeric"
                            value={newClientBirthday}
                            onChange={(e) => setNewClientBirthday(e.target.value)}
                            placeholder="Aniversário DD/MM"
                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-davinci-black focus:outline-none focus:border-davinci-gold text-sm"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowNewClientForm(false)}
                            className="px-3 py-1.5 text-xs font-bold text-davinci-gray hover:text-davinci-black cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={handleCreateClient}
                            disabled={createClientMutation.isPending || !newClientName.trim() || !newClientPhone.trim()}
                            className="px-3 py-1.5 rounded-lg bg-davinci-gold text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                          >
                            {createClientMutation.isPending ? 'Cadastrando...' : 'Cadastrar e selecionar'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-davinci-gray uppercase tracking-wider mb-2">
                      Serviço
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveLookup(activeLookup === 'service' ? null : 'service');
                        setServiceSearch('');
                      }}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left hover:border-davinci-gold/60 hover:bg-davinci-gold/5 transition-colors cursor-pointer"
                    >
                      {selectedService ? (
                        <>
                          <span className="block text-xs font-bold text-davinci-black">{selectedService.nome}</span>
                          <span className="block text-[10px] font-semibold text-davinci-gray mt-0.5">
                            R$ {Number(selectedService.preco).toFixed(2)} • {selectedService.duracao} min
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="block text-xs font-bold text-davinci-black">Escolher serviço</span>
                          <span className="block text-[10px] font-semibold text-davinci-gray mt-0.5">
                            Abrir catálogo e pesquisar por nome, descrição ou valor
                          </span>
                        </>
                      )}
                    </button>
                    {activeLookup === 'service' && (
                      <div className="mt-2 rounded-xl border border-zinc-200 bg-zinc-50/60 p-3 space-y-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-davinci-gray" />
                          <input
                            type="search"
                            value={serviceSearch}
                            onChange={(e) => {
                              setServiceSearch(e.target.value);
                              setNewServiceId('');
                            }}
                            placeholder="Pesquisar serviço..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-davinci-black focus:outline-none focus:border-davinci-gold text-sm"
                          />
                        </div>
                        {shouldShowServiceResults ? (
                          <div className="max-h-44 overflow-y-auto rounded-lg border border-zinc-200 bg-white divide-y divide-zinc-100">
                            {visibleServicesForModal.length > 0 ? (
                              visibleServicesForModal.map((service: any) => (
                                <button
                                  key={service.id}
                                  type="button"
                                  onClick={() => {
                                    setNewServiceId(service.id);
                                    setServiceSearch('');
                                    setActiveLookup(null);
                                  }}
                                  className="w-full px-3 py-2 text-left transition-colors cursor-pointer hover:bg-davinci-gold/10"
                                >
                                  <span className="block text-xs font-bold text-davinci-black">{service.nome}</span>
                                  <span className="block text-[10px] font-semibold text-davinci-gray">
                                    R$ {Number(service.preco).toFixed(2)} • {service.duracao} min
                                  </span>
                                </button>
                              ))
                            ) : (
                              <p className="px-3 py-3 text-[11px] font-semibold text-davinci-gray">Nenhum serviço encontrado.</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-[10px] font-semibold text-davinci-gray">
                            Digite para listar serviços compatíveis.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-davinci-gray uppercase tracking-wider mb-2">
                      Profissional
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsBarberPickerOpen(true)}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left hover:border-davinci-gold/60 hover:bg-davinci-gold/5 transition-colors cursor-pointer"
                    >
                      {selectedBarber ? (
                        <span className="flex items-center gap-3">
                          <span className="h-10 w-10 rounded-full overflow-hidden bg-davinci-gold/10 border border-davinci-gold/30 flex items-center justify-center text-xs font-bold text-davinci-gold shrink-0">
                            {selectedBarber.fotoUrl ? (
                              <img src={selectedBarber.fotoUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              selectedBarber.user.nome.split(' ').map((part: string) => part[0]).join('').slice(0, 2).toUpperCase()
                            )}
                          </span>
                          <span>
                            <span className="block text-xs font-bold text-davinci-black">{selectedBarber.user.nome}</span>
                            <span className="block text-[10px] font-semibold text-davinci-gray mt-0.5">
                              {selectedBarber.categoria || 'Profissional'} • {selectedService ? 'compatível com o serviço' : 'pré-selecionado pelo horário'}
                            </span>
                          </span>
                        </span>
                      ) : (
                        <>
                          <span className="block text-xs font-bold text-davinci-black">Escolher profissional</span>
                          <span className="block text-[10px] font-semibold text-davinci-gray mt-0.5">
                            Abrir popup com fotos e especialidades
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="w-full py-3 bg-gold-gradient rounded-lg text-white font-bold text-sm hover:scale-[1.01] active:scale-[0.99] transition-all shadow-[0_4px_15px_rgba(197,168,128,0.25)] cursor-pointer disabled:opacity-60"
                >
                  {createMutation.isPending ? 'Agendando...' : 'Confirmar Agendamento'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isBarberPickerOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white border border-zinc-200 rounded-2xl w-full max-w-3xl max-h-[88vh] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-5 border-b border-zinc-200/80 bg-background flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-davinci-black uppercase tracking-wider">
                    Escolher Profissional
                  </h3>
                  <p className="text-[11px] text-davinci-gray font-semibold mt-1">
                    {selectedService
                      ? `Profissionais vinculados ao serviço ${selectedService.nome}.`
                      : 'Selecione um profissional cadastrado para este horário.'}
                  </p>
                </div>
                <button
                  onClick={() => setIsBarberPickerOpen(false)}
                  className="text-davinci-gray hover:text-davinci-black cursor-pointer transition-colors"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-davinci-gray" />
                  <input
                    type="search"
                    value={barberSearch}
                    onChange={(e) => setBarberSearch(e.target.value)}
                    placeholder="Pesquisar por nome, função ou especialidade..."
                    className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-davinci-black focus:outline-none focus:border-davinci-gold text-sm"
                  />
                </div>

                {filteredCompatibleBarbers.length === 0 ? (
                  <div className="p-8 text-center bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-davinci-gray font-semibold">
                    Nenhum profissional compatível encontrado.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredCompatibleBarbers.map((barber: any) => {
                      const initials = barber.user.nome
                        .split(' ')
                        .map((part: string) => part[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase();

                      return (
                        <button
                          key={barber.id}
                          type="button"
                          onClick={() => {
                            setNewBarberId(barber.id);
                            setBarberSearch('');
                            setIsBarberPickerOpen(false);
                          }}
                          className={`text-left rounded-xl border p-4 transition-all cursor-pointer hover:border-davinci-gold hover:bg-davinci-gold/5 ${
                            newBarberId === barber.id
                              ? 'border-davinci-gold bg-davinci-gold/10'
                              : 'border-zinc-200 bg-white'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-14 w-14 rounded-full overflow-hidden bg-davinci-gold/10 border border-davinci-gold/30 flex items-center justify-center text-sm font-bold text-davinci-gold shrink-0">
                              {barber.fotoUrl ? (
                                <img src={barber.fotoUrl} alt="" className="h-full w-full object-cover" />
                              ) : (
                                initials
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-davinci-black truncate">{barber.user.nome}</h4>
                              <p className="text-[10px] text-davinci-gold font-bold uppercase tracking-wider mt-0.5">
                                {barber.categoria || 'Profissional'}
                              </p>
                              <p className="text-[10px] text-davinci-gray font-semibold leading-relaxed mt-2 line-clamp-3">
                                {barber.miniBio || barber.especialidade || 'Profissional cadastrado.'}
                              </p>
                              <p className="text-[10px] text-davinci-gray font-bold mt-2">
                                Nota {Number(barber.notaMedia || 5).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Fluxo Operacional de Atendimento */}
      <AnimatePresence>
        {isStatusModalOpen && selectedAppointment && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-zinc-200/80 bg-background flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-davinci-black uppercase tracking-wider">
                    Operação do Atendimento
                  </h3>
                  <p className="text-[10px] text-davinci-gold tracking-widest uppercase font-extrabold mt-0.5">
                    Cliente: {selectedAppointment.client.nome}
                  </p>
                </div>
                <button
                  onClick={() => setIsStatusModalOpen(false)}
                  className="text-davinci-gray hover:text-davinci-black cursor-pointer transition-colors"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Details */}
                <div className="bg-background p-4 rounded-xl border border-zinc-200/80 space-y-2 text-xs text-davinci-gray font-semibold">
                  <div className="flex justify-between">
                    <span>Profissional:</span>
                    <span className="text-davinci-black font-bold">{selectedAppointment.barber.user.nome}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Serviço:</span>
                    <span className="text-davinci-black font-bold">{selectedAppointment.service.nome}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valor:</span>
                    <span className="text-davinci-gold font-extrabold">R$ {selectedAppointment.valor.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status Atual:</span>
                    <span className="text-davinci-black font-extrabold uppercase tracking-wider">
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
                      className="p-3 bg-white border border-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-40 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
                      className="p-3 bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50 disabled:opacity-40 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
                    className="w-full p-3 bg-gold-gradient text-white disabled:opacity-40 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-[0_4px_10px_rgba(197,168,128,0.2)] cursor-pointer"
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
                    className="w-full py-2 bg-transparent text-red-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
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
