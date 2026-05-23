'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Scissors, Calendar, DollarSign, Award, LogOut, CheckCircle, Save, PlusCircle } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function BarberPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useStore((state) => state.token);
  const user = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);

  const [activeClientNotesId, setActiveClientNotesId] = useState<string | null>(null);
  const [clientPreferencesText, setClientPreferencesText] = useState('');
  const [clientObservationsText, setClientObservationsText] = useState('');

  useEffect(() => {
    if (!token || !user) {
      router.push('/login');
    } else if (user.role !== 'BARBER') {
      router.push('/dashboard');
    }
  }, [token, user, router]);

  // Buscar dados específicos do barbeiro
  const barberId = user?.barberId;
  const { data: dashboard, isLoading, error } = useQuery({
    queryKey: ['barberDashboard', barberId],
    queryFn: () => fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/barbers/${barberId}/dashboard`).then((res) => res.json()),
    enabled: !!barberId,
  });

  // Mutation para atualizar as preferências do cliente
  const updateClientMutation = useMutation({
    mutationFn: ({ id, preferences, observacoes }: { id: string; preferences: string; observacoes: string }) =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences, observacoes }),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barberDashboard', barberId] });
      setActiveClientNotesId(null);
    },
  });

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleEditNotesClick = (client: any) => {
    setActiveClientNotesId(client.id);
    setClientPreferencesText(client.preferences || '');
    setClientObservationsText(client.observacoes || '');
  };

  const handleSaveNotes = (clientId: string) => {
    updateClientMutation.mutate({
      id: clientId,
      preferences: clientPreferencesText,
      observacoes: clientObservationsText,
    });
  };

  if (isLoading || !dashboard) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-davinci-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { barber, todayAppointments = [], metrics } = dashboard;

  // Gamificação: avaliar conquistas
  const achievements = [];
  if (metrics.totalAppointments >= 2) {
    achievements.push({
      title: 'Lenda da Navalha',
      description: 'Mais de 2 cortes concluídos.',
      color: 'from-amber-600 to-amber-700',
    });
  }
  if (metrics.returnRate >= 50) {
    achievements.push({
      title: 'Fidelização Elite',
      description: 'Taxa de retorno acima de 50%.',
      color: 'from-yellow-500 to-yellow-600',
    });
  }
  if (barber.notaMedia >= 4.8) {
    achievements.push({
      title: 'Estrela de Ouro',
      description: 'Nota média excelente no CRM.',
      color: 'from-yellow-400 to-amber-600',
    });
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-davinci-white p-6 max-w-4xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex justify-between items-center bg-[#111111] p-5 rounded-2xl border border-davinci-gold/15 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-davinci-gold/10 border border-davinci-gold/30 rounded-full text-davinci-gold">
            <Scissors className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-davinci-white">{barber.nome}</h2>
            <p className="text-[10px] text-davinci-gold font-light uppercase tracking-wider">
              {barber.especialidade} • ⭐ {barber.notaMedia.toFixed(2)}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="p-2 rounded-lg bg-red-950/20 border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#111111] p-4 rounded-xl border border-davinci-gold/5 flex flex-col justify-between h-24">
          <span className="text-[9px] text-davinci-gray uppercase tracking-widest font-bold">Atendimentos</span>
          <h3 className="text-xl font-bold text-davinci-white mt-1">{metrics.totalAppointments}</h3>
        </div>

        <div className="bg-[#111111] p-4 rounded-xl border border-davinci-gold/5 flex flex-col justify-between h-24">
          <span className="text-[9px] text-davinci-gray uppercase tracking-widest font-bold">Faturamento Total</span>
          <h3 className="text-xl font-bold text-davinci-white mt-1">R$ {metrics.totalBilling.toFixed(2)}</h3>
        </div>

        <div className="bg-[#111111] p-4 rounded-xl border border-davinci-gold/5 flex flex-col justify-between h-24">
          <span className="text-[9px] text-davinci-gray uppercase tracking-widest font-bold">Sua Comissão (50%)</span>
          <h3 className="text-xl font-bold text-davinci-gold mt-1">R$ {metrics.commissionEarned.toFixed(2)}</h3>
        </div>

        <div className="bg-[#111111] p-4 rounded-xl border border-davinci-gold/5 flex flex-col justify-between h-24">
          <span className="text-[9px] text-davinci-gray uppercase tracking-widest font-bold">Retorno Cliente</span>
          <h3 className="text-xl font-bold text-davinci-white mt-1">{metrics.returnRate}%</h3>
        </div>
      </div>

      {/* Gamificação / Conquistas */}
      <div className="bg-[#111111] p-6 rounded-2xl border border-davinci-gold/10 space-y-4">
        <h3 className="text-xs font-bold text-davinci-white uppercase tracking-widest flex items-center gap-2">
          <Award className="h-4.5 w-4.5 text-davinci-gold" />
          Conquistas e Medalhas
        </h3>
        
        {achievements.length === 0 ? (
          <p className="text-xs text-davinci-gray font-light">Continue atendendo clientes para desbloquear medalhas corporativas.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {achievements.map((ach, idx) => (
              <div key={idx} className={`p-4 rounded-xl bg-gradient-to-br ${ach.color} text-white flex flex-col justify-between space-y-2`}>
                <span className="text-xs font-bold block">{ach.title}</span>
                <span className="text-[9px] opacity-80">{ach.description}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Agenda do Dia Timeline */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-davinci-white uppercase tracking-widest flex items-center gap-2">
          <Calendar className="h-4.5 w-4.5 text-davinci-gold" />
          Sua Agenda de Hoje
        </h3>

        {todayAppointments.length === 0 ? (
          <div className="bg-[#111111] p-8 rounded-2xl border border-davinci-gold/5 text-center text-xs text-davinci-gray">
            Nenhum agendamento marcado para hoje.
          </div>
        ) : (
          <div className="space-y-4">
            {todayAppointments.map((app: any) => (
              <div key={app.id} className="bg-[#111111] p-5 rounded-2xl border border-davinci-gold/5 space-y-4 shadow-md">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-davinci-white">{app.client.nome}</h4>
                    <p className="text-[10px] text-davinci-gold mt-1 font-light uppercase tracking-wider">
                      {app.service.nome} • {new Date(app.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                    app.status === 'COMPLETED'
                      ? 'bg-davinci-gold/20 text-davinci-gold'
                      : 'bg-davinci-white/10 text-davinci-white'
                  }`}>
                    {app.status}
                  </span>
                </div>

                {/* Cliente Preferencias journal snippet */}
                <div className="bg-[#0A0A0A] p-3 rounded-lg border border-davinci-gold/5 flex justify-between items-center">
                  <div className="text-xs text-davinci-gray flex-1">
                    <span className="text-[9px] uppercase tracking-wider block font-bold text-davinci-gold">Dossiê do Cliente</span>
                    <p className="mt-1 leading-relaxed italic text-[11px]">
                      {app.client.preferences || 'Nenhuma preferência registrada. Clique ao lado para catalogar.'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleEditNotesClick(app.client)}
                    className="ml-4 px-3 py-1.5 rounded-lg bg-[#111111] hover:bg-davinci-gold/10 text-davinci-gold border border-davinci-gold/20 hover:border-davinci-gold/50 text-[10px] font-semibold transition-all cursor-pointer"
                  >
                    Notas & Estilo
                  </button>
                </div>

                {/* Editor Modal/Drawer inline */}
                {activeClientNotesId === app.client.id && (
                  <div className="bg-[#0A0A0A] p-4 rounded-lg border border-davinci-gold/20 space-y-4">
                    <h5 className="text-[10px] font-bold text-davinci-white uppercase tracking-widest">
                      Atualizar Ficha de Estilo: {app.client.nome}
                    </h5>
                    
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-[9px] text-davinci-gray uppercase tracking-wider mb-1">
                          Preferências (Cortes, Pomadas, Estilos)
                        </label>
                        <input
                          type="text"
                          value={clientPreferencesText}
                          onChange={(e) => setClientPreferencesText(e.target.value)}
                          placeholder="Ex: Degradê médio, cabelo texturizado com pomada matte"
                          className="w-full bg-[#111111] border border-davinci-gold/10 focus:border-davinci-gold rounded-lg px-3 py-2 text-davinci-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] text-davinci-gray uppercase tracking-wider mb-1">
                          Observações Técnicas / Restrições
                        </label>
                        <input
                          type="text"
                          value={clientObservationsText}
                          onChange={(e) => setClientObservationsText(e.target.value)}
                          placeholder="Ex: Evitar navalha devido a foliculite"
                          className="w-full bg-[#111111] border border-davinci-gold/10 focus:border-davinci-gold rounded-lg px-3 py-2 text-davinci-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 text-xs">
                      <button
                        onClick={() => setActiveClientNotesId(null)}
                        className="px-3 py-1.5 rounded-lg text-davinci-gray hover:text-davinci-white cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleSaveNotes(app.client.id)}
                        disabled={updateClientMutation.isPending}
                        className="px-3 py-1.5 rounded-lg bg-gold-gradient text-davinci-black font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Save className="h-3.5 w-3.5" />
                        Salvar Ficha
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
