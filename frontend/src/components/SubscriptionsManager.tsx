'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  CreditCard, 
  Save, 
  X, 
  DollarSign, 
  Users, 
  TrendingDown, 
  Sparkles,
  Search,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  creditsPerMonth: number;
  active: boolean;
  createdAt: string;
}

interface Subscription {
  id: string;
  status: string;
  remainingCredits: number;
  expiresAt: string | null;
  createdAt: string;
  client: {
    id: string;
    nome: string;
    telefone: string;
    email: string | null;
  };
  plan: {
    id: string;
    name: string;
    price: number;
  };
}

interface Metrics {
  activeSubscribers: number;
  mrr: number;
  churnRate: number;
}

export default function SubscriptionsManager() {
  const queryClient = useQueryClient();
  const token = useStore((state) => state.token);
  const addNotification = useStore((state) => state.addNotification);

  const [activeSubTab, setActiveSubTab] = useState<'plans' | 'subscribers'>('plans');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  
  // Search states
  const [planSearch, setPlanSearch] = useState('');
  const [subscriberSearch, setSubscriberSearch] = useState('');

  // Form states for Plan
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

  // Fetch Metrics
  const { data: metrics = { activeSubscribers: 0, mrr: 0, churnRate: 0 } } = useQuery<Metrics>({
    queryKey: ['subscriptionMetrics'],
    queryFn: () =>
      fetch(`${apiUrl}/subscriptions/metrics`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        if (!res.ok) throw new Error('Falha ao buscar métricas');
        return res.json();
      }),
    enabled: !!token,
  });

  // Fetch Plans
  const { data: plans = [], isLoading: loadingPlans } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: () =>
      fetch(`${apiUrl}/plans`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        if (!res.ok) throw new Error('Falha ao buscar planos');
        return res.json();
      }),
    enabled: !!token,
  });

  // Fetch Subscriptions
  const { data: subscriptions = [], isLoading: loadingSubscriptions } = useQuery<Subscription[]>({
    queryKey: ['subscriptionsList'],
    queryFn: () =>
      fetch(`${apiUrl}/subscriptions`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        if (!res.ok) throw new Error('Falha ao buscar assinaturas');
        return res.json();
      }),
    enabled: !!token,
  });

  // Create Plan Mutation
  const createPlanMutation = useMutation({
    mutationFn: (newPlan: { name: string; price: number; description: string; creditsPerMonth: number }) =>
      fetch(`${apiUrl}/plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newPlan),
      }).then((res) => {
        if (!res.ok) throw new Error('Erro ao criar plano de assinatura');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptionMetrics'] });
      addNotification({
        title: 'Plano criado',
        description: 'Plano de assinatura cadastrado com sucesso.',
        type: 'success',
      });
      closeModal();
    },
    onError: (err: any) => {
      addNotification({
        title: 'Erro ao salvar plano',
        description: err.message || 'Verifique os dados.',
        type: 'error',
      });
    },
  });

  // Update Plan Mutation
  const updatePlanMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name: string; description: string; active?: boolean } }) =>
      fetch(`${apiUrl}/plans/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }).then((res) => {
        if (!res.ok) throw new Error('Erro ao editar plano');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptionMetrics'] });
      addNotification({
        title: 'Plano atualizado',
        description: 'Plano de assinatura editado com sucesso.',
        type: 'success',
      });
      closeModal();
    },
    onError: (err: any) => {
      addNotification({
        title: 'Erro ao atualizar plano',
        description: err.message || 'Não foi possível atualizar.',
        type: 'error',
      });
    },
  });

  // Delete Plan Mutation (Soft delete - active: false)
  const deletePlanMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`${apiUrl}/plans/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.message || 'Erro ao desativar plano');
        return data;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      addNotification({
        title: 'Plano desativado',
        description: 'O plano foi desativado com sucesso.',
        type: 'success',
      });
    },
    onError: (err: any) => {
      addNotification({
        title: 'Erro ao desativar plano',
        description: err.message || 'Não foi possível desativar este plano.',
        type: 'error',
      });
    },
  });

  const handleOpenAdd = () => {
    setEditingPlan(null);
    setName('');
    setPrice('');
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setName(plan.name);
    setPrice(plan.price.toString());
    setDescription(plan.description || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
    setName('');
    setPrice('');
    setDescription('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price.trim()) return;

    const priceNum = parseFloat(price.replace(',', '.'));
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Por favor, informe um preço válido.');
      return;
    }

    if (editingPlan) {
      updatePlanMutation.mutate({
        id: editingPlan.id,
        payload: { name, description },
      });
    } else {
      createPlanMutation.mutate({
        name,
        price: priceNum,
        description,
        creditsPerMonth: 0, // 0 = unlimited cuts
      });
    }
  };

  const handleDelete = (id: string, planName: string) => {
    if (confirm(`Tem certeza que deseja desativar o plano "${planName}"?\nClientes com assinatura ativa continuarão ativos, mas novos assinantes não poderão contratar este plano.`)) {
      deletePlanMutation.mutate(id);
    }
  };

  const filteredPlans = plans.filter((p) =>
    p.name.toLowerCase().includes(planSearch.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(planSearch.toLowerCase()))
  );

  const filteredSubs = subscriptions.filter((s) =>
    s.client.nome.toLowerCase().includes(subscriberSearch.toLowerCase()) ||
    s.client.telefone.includes(subscriberSearch) ||
    s.plan.name.toLowerCase().includes(subscriberSearch.toLowerCase())
  );

  const getSubStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold">Ativa</span>;
      case 'TRIALING':
        return <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold">Período de Testes</span>;
      case 'CANCELED':
      case 'CANCELLED':
        return <span className="px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-400 text-[10px] font-bold">Cancelada</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold">{status}</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-zinc-200/80 p-6 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div>
            <p className="text-[10px] text-davinci-gray font-bold tracking-widest uppercase mb-1">Faturamento Mensal Estimado (MRR)</p>
            <p className="text-2xl font-black font-outfit text-davinci-black">R$ {metrics.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="absolute right-4 bottom-4 h-11 w-11 bg-davinci-gold/10 rounded-xl flex items-center justify-center text-davinci-gold shadow-inner border border-davinci-gold/10">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-zinc-200/80 p-6 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div>
            <p className="text-[10px] text-davinci-gray font-bold tracking-widest uppercase mb-1">Assinantes Ativos</p>
            <p className="text-2xl font-black font-outfit text-davinci-black">{metrics.activeSubscribers}</p>
          </div>
          <div className="absolute right-4 bottom-4 h-11 w-11 bg-davinci-gold/10 rounded-xl flex items-center justify-center text-davinci-gold shadow-inner border border-davinci-gold/10">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-zinc-200/80 p-6 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div>
            <p className="text-[10px] text-davinci-gray font-bold tracking-widest uppercase mb-1">Taxa de Cancelamento (Churn)</p>
            <p className="text-2xl font-black font-outfit text-davinci-black">{metrics.churnRate}%</p>
          </div>
          <div className="absolute right-4 bottom-4 h-11 w-11 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 shadow-inner border border-red-500/10">
            <TrendingDown className="h-5 w-5" />
          </div>
        </div>
      </section>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-zinc-200">
        <button
          onClick={() => setActiveSubTab('plans')}
          className={`pb-4 px-6 text-sm font-bold transition-all relative ${
            activeSubTab === 'plans'
              ? 'text-davinci-gold font-extrabold border-b-2 border-davinci-gold'
              : 'text-davinci-gray hover:text-davinci-black'
          }`}
        >
          Planos do Clube
        </button>
        <button
          onClick={() => setActiveSubTab('subscribers')}
          className={`pb-4 px-6 text-sm font-bold transition-all relative ${
            activeSubTab === 'subscribers'
              ? 'text-davinci-gold font-extrabold border-b-2 border-davinci-gold'
              : 'text-davinci-gray hover:text-davinci-black'
          }`}
        >
          Assinantes Cadastrados
        </button>
      </div>

      {/* Tab Contents */}
      {activeSubTab === 'plans' && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-white p-4 rounded-xl border border-zinc-200/85 shadow-sm gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-davinci-gray" />
              <input
                type="text"
                placeholder="Pesquisar planos de assinatura..."
                value={planSearch}
                onChange={(e) => setPlanSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-davinci-black focus:outline-none focus:border-davinci-gold text-xs"
              />
            </div>
            
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-gold-gradient hover:scale-[1.02] active:scale-[0.98] transition-transform text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Novo Plano Recorrente
            </button>
          </div>

          {/* Plans Grid */}
          {loadingPlans ? (
            <div className="flex items-center justify-center p-12">
              <div className="h-8 w-8 border-2 border-davinci-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="bg-white rounded-xl border border-zinc-200/80 p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-davinci-gold/10 flex items-center justify-center text-davinci-gold">
                <CreditCard className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-sm text-davinci-black">Nenhum plano recorrente</h3>
              <p className="text-xs text-davinci-gray max-w-sm">
                Crie planos mensais para que seus clientes assinem e façam cortes de barba e cabelo à vontade, melhorando a recorrência e faturamento.
              </p>
              <button
                onClick={handleOpenAdd}
                className="mt-2 px-3.5 py-1.5 border border-davinci-gold text-davinci-gold hover:bg-davinci-gold/5 rounded-lg text-xs font-semibold cursor-pointer transition-all"
              >
                Criar Primeiro Plano
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-white border rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden group ${
                    plan.active ? 'border-zinc-200/80 hover:border-davinci-gold/30' : 'border-zinc-200 bg-zinc-50 opacity-70'
                  }`}
                >
                  {/* Glass background gradient */}
                  {plan.active && (
                    <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full blur-2xl opacity-10 bg-davinci-gold transition duration-500 group-hover:scale-125" />
                  )}
                  
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="font-black text-sm uppercase tracking-wider text-davinci-black truncate flex-1">
                        {plan.name}
                      </h4>
                      {plan.active ? (
                        <span className="px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-[9px] font-bold shrink-0">Ativo</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-zinc-200 border border-zinc-350 text-zinc-500 text-[9px] font-bold shrink-0">Inativo</span>
                      )}
                    </div>
                    
                    <div className="my-3 flex items-baseline gap-1">
                      <span className="text-sm font-bold text-davinci-gold">R$</span>
                      <span className="text-3xl font-black font-outfit text-davinci-black">{plan.price.toFixed(2)}</span>
                      <span className="text-xs text-davinci-gray font-semibold lowercase">/mês</span>
                    </div>

                    <div className="my-2 py-1 px-2 bg-davinci-gold/5 border border-davinci-gold/10 rounded-lg text-[10px] text-davinci-gold font-bold inline-flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Cortes e Serviços Ilimitados
                    </div>

                    <p className="text-xs text-davinci-gray leading-relaxed break-words mt-3 min-h-[60px] line-clamp-3">
                      {plan.description || 'Acesso completo e ilimitado aos serviços oferecidos neste plano recorrente.'}
                    </p>
                  </div>

                  <div className="flex justify-between items-center mt-5 pt-3 border-t border-zinc-100 shrink-0">
                    <span className="text-[9px] text-zinc-400 font-medium">
                      Criado em {new Date(plan.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(plan)}
                        className="p-2 rounded-lg text-davinci-gray hover:text-davinci-gold hover:bg-zinc-100 transition-colors cursor-pointer"
                        title="Editar Plano"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {plan.active && (
                        <button
                          onClick={() => handleDelete(plan.id, plan.name)}
                          className="p-2 rounded-lg text-davinci-gray hover:text-red-500 hover:bg-zinc-100 transition-colors cursor-pointer"
                          title="Desativar Plano"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'subscribers' && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-zinc-200/85 shadow-sm">
            <div className="relative w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-davinci-gray" />
              <input
                type="text"
                placeholder="Pesquisar assinante ou plano..."
                value={subscriberSearch}
                onChange={(e) => setSubscriberSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-davinci-black focus:outline-none focus:border-davinci-gold text-xs"
              />
            </div>
            
            <div className="text-xs font-bold text-davinci-gray uppercase tracking-widest flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-davinci-gold" />
              Total de Assinantes: <strong className="text-davinci-black">{subscriptions.length}</strong>
            </div>
          </div>

          {/* Subscribers Table */}
          <div className="bg-white rounded-xl border border-zinc-200/80 overflow-hidden shadow-sm">
            {loadingSubscriptions ? (
              <div className="flex items-center justify-center p-12">
                <div className="h-8 w-8 border-2 border-davinci-gold border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredSubs.length === 0 ? (
              <div className="p-12 text-center text-davinci-gray font-medium flex flex-col items-center justify-center gap-2">
                <AlertTriangle className="h-6 w-6 text-davinci-gold" />
                <span>Nenhum cliente cadastrado no clube de assinaturas até o momento.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-zinc-200 text-davinci-gray uppercase tracking-wider text-[10px] bg-background">
                      <th className="py-4 px-6 font-bold">Cliente</th>
                      <th className="py-4 px-6 font-bold">WhatsApp / Telefone</th>
                      <th className="py-4 px-6 font-bold">Plano Assinado</th>
                      <th className="py-4 px-6 font-bold text-center">Status</th>
                      <th className="py-4 px-6 text-right font-bold">Mensalidade</th>
                      <th className="py-4 px-6 text-right font-bold">Vencimento / Renovação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredSubs.map((sub) => (
                      <tr key={sub.id} className="hover:bg-davinci-gold/5 transition-colors">
                        <td className="py-4 px-6 font-bold text-davinci-black flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-davinci-gold/10 border border-davinci-gold/20 flex items-center justify-center text-[10px] text-davinci-gold font-bold">
                            {sub.client.nome.charAt(0).toUpperCase()}
                          </div>
                          {sub.client.nome}
                        </td>
                        <td className="py-4 px-6 text-davinci-gray font-medium">{sub.client.telefone}</td>
                        <td className="py-4 px-6 font-bold text-davinci-black uppercase tracking-wider text-[11px]">
                          {sub.plan.name}
                        </td>
                        <td className="py-4 px-6 text-center">{getSubStatusLabel(sub.status)}</td>
                        <td className="py-4 px-6 text-right font-bold text-davinci-gold">
                          R$ {sub.plan.price.toFixed(2)}
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-davinci-black">
                          {sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString('pt-BR') : 'N/A'}
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

      {/* Modal Add / Edit Plan */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-zinc-200 animate-slide-in">
            {/* Modal Header */}
            <div className="bg-[#f0f2f5] px-6 py-4 border-b border-zinc-200 flex justify-between items-center">
              <h3 className="font-bold text-sm text-davinci-black flex items-center gap-1.5">
                <CreditCard className="h-4.5 w-4.5 text-davinci-gold" />
                {editingPlan ? 'Editar Plano de Assinatura' : 'Novo Plano de Assinatura'}
              </h3>
              <button
                onClick={closeModal}
                className="text-davinci-gray hover:text-davinci-black transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-davinci-gray mb-1.5">
                  Nome do Plano (ex: Barba e Cabelo Premium)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Assinatura Club Vip"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs text-davinci-black focus:outline-none focus:border-davinci-gold focus:ring-1 focus:ring-davinci-gold/20"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-davinci-gray mb-1.5">
                  Preço Mensal (R$)
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingPlan} // stripe plans are immutable on price
                  placeholder="Ex: 119.90"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs text-davinci-black focus:outline-none focus:border-davinci-gold focus:ring-1 focus:ring-davinci-gold/20 disabled:bg-zinc-50 disabled:text-zinc-400"
                />
                {editingPlan && (
                  <p className="mt-1 text-[9px] text-davinci-gray italic">O preço de planos ativos é imutável. Crie um novo plano para alterar o valor.</p>
                )}
              </div>

              <div className="py-2.5 px-3 bg-davinci-gold/5 border border-davinci-gold/15 rounded-xl text-xs space-y-1">
                <span className="font-bold text-davinci-gold flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  Benefício do Plano: Cortes Ilimitados
                </span>
                <p className="text-[10px] text-davinci-gray leading-normal">
                  Todas as assinaturas oferecem cortes de cabelo e serviços ilimitados para o assinante ao longo do mês.
                </p>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-davinci-gray mb-1.5">
                  Descrição do Plano (Opcional)
                </label>
                <textarea
                  rows={4}
                  placeholder="Ex: Cortes ilimitados de barba, cabelo e sobrancelha com atendimento vip."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs text-davinci-black focus:outline-none focus:border-davinci-gold focus:ring-1 focus:ring-davinci-gold/20 resize-none leading-relaxed"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2 border border-zinc-200 text-davinci-gray hover:bg-zinc-50 rounded-lg text-xs font-bold transition-all cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
                  className="flex-1 py-2 bg-gold-gradient text-white rounded-lg text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Save className="h-4 w-4" />
                  {createPlanMutation.isPending || updatePlanMutation.isPending ? 'Salvando...' : 'Salvar Plano'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
