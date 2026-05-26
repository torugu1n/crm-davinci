'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { useStore } from '@/store/useStore';
import { Search, UserCheck, ShieldAlert } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import DashboardCalendar from '@/components/DashboardCalendar';
import WhatsAppSimulator from '@/components/WhatsAppSimulator';
import FinanceSummary from '@/components/FinanceSummary';
import AdminFeedbacks from '@/components/AdminFeedbacks';
import CRMDrawer from '@/components/CRMDrawer';
import ServicesProductsManager from '@/components/ServicesProductsManager';
import EmployeesManager from '@/components/EmployeesManager';
import UsersManager from '@/components/UsersManager';
import { canAccessDashboard, canAccessDashboardTab, getAllowedDashboardTabs, isAdminUser, isClientUser, isProfessionalUser } from '@/lib/auth';

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useStore((state) => state.token);
  const user = useStore((state) => state.user);
  const addNotification = useStore((state) => state.addNotification);

  const [activeTab, setActiveTab] = useState('calendar');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [crmSearch, setCrmSearch] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  const requestedTab = searchParams.get('tab');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!user) return;
    const allowedTabs = getAllowedDashboardTabs(user);
    if (allowedTabs.length > 0 && !allowedTabs.includes(activeTab as any)) {
      setActiveTab(allowedTabs[0]);
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (!user) return;
    if (requestedTab && canAccessDashboardTab(user, requestedTab) && requestedTab !== activeTab) {
      setActiveTab(requestedTab);
    }
  }, [requestedTab, activeTab, user]);

  // Redirecionamento se não autenticado ou papel incorreto
  useEffect(() => {
    if (!token || !user) {
      router.push('/login');
    } else if (!canAccessDashboard(user) && isProfessionalUser(user)) {
      router.push('/profissional');
    } else if (isClientUser(user)) {
      router.push('/feedback/client-portal');
    }
  }, [token, user, router]);

  // WebSocket para notificações globais em tempo real no Dashboard
  useEffect(() => {
    if (!token) return;
    const socket = io((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'));

    socket.on('dashboard-notification', (notif: { title: string; description: string; type: any }) => {
      addNotification({
        title: notif.title,
        description: notif.description,
        type: notif.type,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [token, addNotification]);

  // Buscar clientes para o CRM
  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: () => fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/clients`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }).then((res) => { if (!res.ok) throw new Error('Failed to fetch clients'); return res.json(); }),
    enabled: activeTab === 'crm' && !!token,
  });

  const getTitle = () => {
    switch (activeTab) {
      case 'calendar':
        return 'Agenda Inteligente';
      case 'crm':
        return 'CRM Gestão de Clientes';
      case 'whatsapp':
        return 'WhatsApp e Atendimento';
      case 'services':
        return 'Serviços & Produtos';
      case 'employees':
        return 'Equipe';
      case 'users':
        return 'Usuários & Permissões';
      case 'finance':
        return 'Dashboard Financeiro';
      case 'feedbacks':
        return 'Central de Feedbacks';
      default:
        return 'Painel de Gestão';
    }
  };

  const filteredClients = clients.filter((c: any) =>
    c.nome.toLowerCase().includes(crmSearch.toLowerCase()) ||
    c.telefone.replace(/\D/g, '').includes(crmSearch.replace(/\D/g, ''))
  );

  if (!isMounted) return null;

  if (!user || !canAccessDashboard(user)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-davinci-black font-sans flex">
      {/* Navigation Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <Header title={getTitle()} />

        {/* Dynamic View Tab */}
        <main className="flex-1 p-8 overflow-y-auto">
          {activeTab === 'calendar' && (
            <div
              id="dashboard-tab-content-calendar"
              data-demo-title="Agenda inteligente"
              data-demo-description="Esta área centraliza os agendamentos do dia, a ocupação dos profissionais e o andamento dos atendimentos."
            >
              <DashboardCalendar />
            </div>
          )}

          {activeTab === 'crm' && (
            <div
              id="dashboard-tab-content-crm"
              className="space-y-6"
              data-demo-title="CRM de clientes"
              data-demo-description="Aqui a operação consulta cadastro, preferências, aniversário e histórico para personalizar o atendimento."
            >
              {/* Toolbar */}
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-zinc-200/85 shadow-sm">
                <div className="relative w-72">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-davinci-gray" />
                  <input
                    type="text"
                    placeholder="Pesquisar por nome ou telefone..."
                    value={crmSearch}
                    onChange={(e) => setCrmSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-davinci-black focus:outline-none focus:border-davinci-gold text-xs"
                  />
                </div>
                <div className="text-xs font-bold text-davinci-gray uppercase tracking-widest flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4 text-davinci-gold" />
                  Total de Clientes: <strong className="text-davinci-black">{clients.length}</strong>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl border border-zinc-200/80 overflow-hidden shadow-md">
                {isLoading ? (
                  <div className="flex items-center justify-center p-12">
                    <div className="h-8 w-8 border-2 border-davinci-gold border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : error ? (
                  <div className="p-8 text-center text-red-500 flex items-center justify-center gap-2">
                    <ShieldAlert className="h-5 w-5" />
                    Erro ao carregar banco de dados do CRM.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-zinc-200 text-davinci-gray uppercase tracking-wider text-[10px] bg-background">
                          <th className="py-4 px-6">Nome Completo</th>
                          <th className="py-4 px-6">WhatsApp</th>
                          <th className="py-4 px-6 text-center">Aniversário</th>
                          <th className="py-4 px-6 text-center">Visitas</th>
                          <th className="py-4 px-6 text-right">Ticket Médio</th>
                          <th className="py-4 px-6 text-right">Preferencia</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {filteredClients.map((client: any) => (
                          <tr
                            key={client.id}
                            onClick={() => setSelectedClientId(client.id)}
                            className="hover:bg-davinci-gold/5 transition-colors cursor-pointer"
                          >
                            <td className="py-4 px-6 font-bold text-davinci-black flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-davinci-gold/10 border border-davinci-gold/20 flex items-center justify-center text-[10px] text-davinci-gold font-bold">
                                {client.nome.charAt(0).toUpperCase()}
                              </div>
                              {client.nome}
                            </td>
                            <td className="py-4 px-6 text-davinci-gray font-medium">{client.telefone}</td>
                            <td className="py-4 px-6 text-center text-davinci-gray font-medium">{client.aniversario || '--'}</td>
                            <td className="py-4 px-6 text-center font-bold text-davinci-black">{client.frequency}</td>
                            <td className="py-4 px-6 text-right font-bold text-davinci-gold">R$ {client.ticketMedio.toFixed(2)}</td>
                            <td className="py-4 px-6 text-right text-davinci-gray truncate max-w-[150px] font-medium">
                              {client.preferences || 'Nenhuma preferência'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'whatsapp' && canAccessDashboardTab(user, 'whatsapp') && (
            <div
              id="dashboard-tab-content-whatsapp"
              data-demo-title="Mensagens WhatsApp"
              data-demo-description="Este módulo demonstra atendimento digital, confirmação de horários e continuidade da comunicação com os clientes."
            >
              <WhatsAppSimulator />
            </div>
          )}

          {activeTab === 'users' && isAdminUser(user) && (
            <div
              id="dashboard-tab-content-users"
              data-demo-title="Usuários e permissões"
              data-demo-description="Nesta área o administrador cadastra contas, define papéis, ativa ou desativa acessos e controla permissões."
            >
              <UsersManager />
            </div>
          )}

          {activeTab === 'services' && isAdminUser(user) && (
            <div
              id="dashboard-tab-content-services"
              data-demo-title="Serviços e produtos"
              data-demo-description="Aqui ficam o catálogo comercial, preços, duração e os itens usados para compor a operação da casa."
            >
              <ServicesProductsManager />
            </div>
          )}

          {activeTab === 'employees' && isAdminUser(user) && (
            <div
              id="dashboard-tab-content-employees"
              data-demo-title="Equipe do estabelecimento"
              data-demo-description="Este módulo apresenta os profissionais, comissões, especialidades, mini bio e identidade visual de cada perfil."
            >
              <EmployeesManager />
            </div>
          )}

          {activeTab === 'finance' && isAdminUser(user) && (
            <div
              id="dashboard-tab-content-finance"
              data-demo-title="Financeiro"
              data-demo-description="Nesta visão o administrador acompanha faturamento, indicadores e leitura gerencial da performance do negócio."
            >
              <FinanceSummary />
            </div>
          )}

          {activeTab === 'feedbacks' && isAdminUser(user) && (
            <div
              id="dashboard-tab-content-feedbacks"
              data-demo-title="Feedbacks e avaliações"
              data-demo-description="Aqui a gestão acompanha percepção do cliente e sinais de qualidade do atendimento entregue pela equipe."
            >
              <AdminFeedbacks />
            </div>
          )}
        </main>
      </div>

      {/* CRM Client Sliding Drawer */}
      {selectedClientId && (
        <CRMDrawer clientId={selectedClientId} onClose={() => setSelectedClientId(null)} />
      )}
    </div>
  );
}
