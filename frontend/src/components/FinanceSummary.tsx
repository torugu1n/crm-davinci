'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DollarSign,
  Calendar,
  TrendingUp,
  Users,
  Award,
  ShieldAlert,
  Shield,
  Target,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  Activity,
  ArrowRight,
  TrendingDown,
  Lock,
} from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function FinanceSummary() {
  const token = useStore((state) => state.token);
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const requestedSubTab = searchParams.get('financeSubTab');
  const initialSubTab =
    requestedSubTab === 'goals' || requestedSubTab === 'audit' || requestedSubTab === 'overview'
      ? requestedSubTab
      : 'overview';

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'goals' | 'audit'>(initialSubTab);
  const [showCreateGoalForm, setShowCreateGoalForm] = useState(false);
  const [auditSearchTerm, setAuditSearchTerm] = useState('');

  // New goal form state
  const [goalTitle, setGoalTitle] = useState('');
  const [goalType, setGoalType] = useState('BILLING');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalStart, setGoalStart] = useState('');
  const [goalEnd, setGoalEnd] = useState('');

  useEffect(() => {
    if (requestedSubTab === 'goals' || requestedSubTab === 'audit' || requestedSubTab === 'overview') {
      setActiveSubTab(requestedSubTab);
    }
  }, [requestedSubTab]);

  // Queries
  const { data: summary, isLoading: summaryLoading, error: summaryError } = useQuery({
    queryKey: ['financeSummary'],
    queryFn: () =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/finance/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        if (!res.ok) throw new Error('Falha ao carregar resumo financeiro');
        return res.json();
      }),
    refetchInterval: activeSubTab === 'overview' ? 10000 : undefined,
    enabled: !!token,
  });

  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: () =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/finance/goals`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        if (!res.ok) throw new Error('Falha ao carregar metas');
        return res.json();
      }),
    enabled: !!token && activeSubTab === 'goals',
  });

  const { data: auditLogs = [], isLoading: auditLoading } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/finance/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        if (!res.ok) throw new Error('Falha ao carregar logs de auditoria');
        return res.json();
      }),
    enabled: !!token && activeSubTab === 'audit',
  });

  // Mutations
  const createGoalMutation = useMutation({
    mutationFn: (newGoal: any) =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/finance/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newGoal),
      }).then((res) => {
        if (!res.ok) throw new Error('Erro ao criar meta');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['financeSummary'] });
      setGoalTitle('');
      setGoalTarget('');
      setGoalStart('');
      setGoalEnd('');
      setShowCreateGoalForm(false);
      alert('Meta corporativa cadastrada com sucesso!');
    },
    onError: (err: any) => {
      alert(err.message);
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/finance/goals/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        if (!res.ok) throw new Error('Erro ao excluir meta');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['financeSummary'] });
      alert('Meta excluída com sucesso.');
    },
  });

  const handleCreateGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle || !goalTarget || !goalStart || !goalEnd) return;

    createGoalMutation.mutate({
      titulo: goalTitle,
      tipo: goalType,
      valorAlvo: parseFloat(goalTarget),
      dataInicio: goalStart,
      dataFim: goalEnd,
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  // Filter audit logs
  const filteredAuditLogs = auditLogs.filter((log: any) => {
    const search = auditSearchTerm.toLowerCase();
    return (
      (log.usuario || '').toLowerCase().includes(search) ||
      (log.acao || '').toLowerCase().includes(search) ||
      (log.detalhes || '').toLowerCase().includes(search)
    );
  });

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'CANCEL_APPOINTMENT':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'CHANGE_APPOINTMENT_PRICE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CHANGE_SERVICE_PRICE':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'DELETE_SERVICE':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'CREATE_SERVICE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-zinc-50 text-zinc-700 border-zinc-200';
    }
  };

  if (summaryLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 border-2 border-davinci-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (summaryError || !summary) {
    return (
      <div className="p-8 text-center text-red-500 flex items-center justify-center gap-2 font-bold bg-red-50 rounded-2xl border border-red-200">
        <ShieldAlert className="h-5 w-5" />
        Erro ao carregar dados do painel executivo.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-px">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeSubTab === 'overview'
              ? 'border-davinci-gold text-davinci-gold'
              : 'border-transparent text-davinci-gray hover:text-davinci-black'
          }`}
        >
          <span className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Visão Geral
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('goals')}
          className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeSubTab === 'goals'
              ? 'border-davinci-gold text-davinci-gold'
              : 'border-transparent text-davinci-gray hover:text-davinci-black'
          }`}
        >
          <span className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Metas Corporativas
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('audit')}
          className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeSubTab === 'audit'
              ? 'border-davinci-gold text-davinci-gold'
              : 'border-transparent text-davinci-gray hover:text-davinci-black'
          }`}
        >
          <span className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Logs de Auditoria
          </span>
        </button>
      </div>

      {/* OVERVIEW SUB-TAB */}
      {activeSubTab === 'overview' && (
        <div className="space-y-8 animate-fade-in">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-davinci-gray uppercase tracking-widest font-bold">Faturamento Hoje</span>
                <div className="p-2 rounded-lg bg-davinci-gold/10 border border-davinci-gold/20 text-davinci-gold">
                  <DollarSign className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-davinci-black">{formatCurrency(summary.dailyBilling)}</h3>
                <p className="text-[10px] text-davinci-gray mt-1 font-semibold">Cortes concluídos hoje</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-davinci-gray uppercase tracking-widest font-bold">Semanal</span>
                <div className="p-2 rounded-lg bg-davinci-gold/10 border border-davinci-gold/20 text-davinci-gold">
                  <Calendar className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-davinci-black">{formatCurrency(summary.weeklyBilling)}</h3>
                <p className="text-[10px] text-davinci-gray mt-1 font-semibold">Faturamento últimos 7 dias</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-davinci-gray uppercase tracking-widest font-bold">Mensal</span>
                <div className="p-2 rounded-lg bg-davinci-gold/10 border border-davinci-gold/20 text-davinci-gold">
                  <TrendingUp className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-davinci-black">{formatCurrency(summary.monthlyBilling)}</h3>
                <p className="text-[10px] text-davinci-gray mt-1 font-semibold">Mês corrente consolidado</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-davinci-gray uppercase tracking-widest font-bold">Comissões Devidas</span>
                <div className="p-2 rounded-lg bg-davinci-gold/10 border border-davinci-gold/20 text-davinci-gold">
                  <Users className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-davinci-black">{formatCurrency(summary.monthlyCommissions)}</h3>
                <p className="text-[10px] text-davinci-gray mt-1 font-semibold">Estimativa de 50% rateio equipe</p>
              </div>
            </div>
          </div>

          {/* Goal Ring & Barbers Ranking Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Goal Card */}
            <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm flex flex-col items-center justify-center text-center space-y-6">
              <h4 className="text-xs font-bold text-davinci-black uppercase tracking-widest flex items-center gap-1.5 justify-center">
                <Target className="h-4.5 w-4.5 text-davinci-gold" />
                Meta Faturamento Ativa
              </h4>
              
              {/* Custom SVG Circular Gauge */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="64"
                    className="stroke-[#F5F2EB] fill-transparent"
                    strokeWidth="10"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="64"
                    className="stroke-davinci-gold fill-transparent transition-all duration-1000"
                    strokeWidth="10"
                    strokeDasharray={`${2 * Math.PI * 64}`}
                    strokeDashoffset={`${
                      2 * Math.PI * 64 * (1 - Math.min(summary.goalProgress, 100) / 100)
                    }`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold text-davinci-black">{summary.goalProgress}%</span>
                  <span className="text-[8px] text-davinci-gray uppercase tracking-widest font-bold mt-1">Concluída</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs w-full border-t border-zinc-100 pt-4">
                <div className="flex justify-between px-2 font-semibold">
                  <span className="text-davinci-gray">Faturamento:</span>
                  <span className="text-davinci-black font-bold">{formatCurrency(summary.monthlyBilling)}</span>
                </div>
                <div className="flex justify-between px-2 font-semibold">
                  <span className="text-davinci-gray">Meta Alvo:</span>
                  <span className="text-davinci-gold font-bold">{formatCurrency(summary.monthlyGoal)}</span>
                </div>
              </div>
            </div>

            {/* Barber Leaderboard Ranking */}
            <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm lg:col-span-2 space-y-4">
              <h4 className="text-xs font-bold text-davinci-black uppercase tracking-widest flex items-center gap-2">
                <Award className="h-4.5 w-4.5 text-davinci-gold animate-pulse" />
                Ranking de Produtividade da Equipe
              </h4>

              {summary.barberRanking.length === 0 ? (
                <p className="text-xs text-davinci-gray font-semibold italic p-4">Nenhum dado de produtividade no momento.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-zinc-200 text-davinci-gray uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4 font-extrabold">Profissional</th>
                        <th className="py-3 px-4 text-center font-extrabold">Atendimentos</th>
                        <th className="py-3 px-4 text-right font-extrabold">Faturamento</th>
                        <th className="py-3 px-4 text-right font-extrabold">Comissão Estimada</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {summary.barberRanking.map((barber: any, index: number) => (
                        <tr key={index} className="hover:bg-davinci-gold/5 transition-colors">
                          <td className="py-3 px-4 font-bold text-davinci-black flex items-center gap-2">
                            <span className={`text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                              index === 0 ? 'bg-amber-100 text-amber-800' : 'bg-zinc-100 text-zinc-600'
                            }`}>
                              #{index + 1}
                            </span>
                            {barber.nome}
                          </td>
                          <td className="py-3 px-4 text-center text-davinci-gray font-semibold">{barber.atendimentos}</td>
                          <td className="py-3 px-4 text-right font-bold text-davinci-black">{formatCurrency(barber.faturamento)}</td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatCurrency(barber.comissao)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Dynamic SVG bar chart for faturamento distribution */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm space-y-5">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-davinci-black uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="h-4.5 w-4.5 text-davinci-gold" />
                Distribuição Comparativa de Faturamento
              </h4>
              <span className="text-[10px] text-davinci-gray font-semibold bg-zinc-50 border border-zinc-100 px-2 py-0.5 rounded">
                Valores Totais Gerados
              </span>
            </div>

            {summary.barberRanking.length === 0 ? (
              <p className="text-xs text-davinci-gray font-semibold italic py-4 text-center">Nenhum dado financeiro para exibir no gráfico.</p>
            ) : (
              <div className="space-y-4 pt-2">
                {summary.barberRanking.map((barber: any, idx: number) => {
                  const maxFaturamento = Math.max(...summary.barberRanking.map((b: any) => b.faturamento), 1);
                  const pct = (barber.faturamento / maxFaturamento) * 100;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-davinci-black">{barber.nome}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-davinci-gray text-[10px] font-semibold">({barber.atendimentos} serv.)</span>
                          <span className="text-davinci-gold font-extrabold">{formatCurrency(barber.faturamento)}</span>
                        </div>
                      </div>
                      <div className="w-full bg-[#f6f6f6] h-4 rounded-full overflow-hidden border border-zinc-100 flex shadow-inner">
                        <div 
                          className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full h-full transition-all duration-1000 ease-out flex items-center justify-end px-2"
                          style={{ width: `${pct}%` }}
                        >
                          {pct > 15 && (
                            <span className="text-[9px] text-white font-extrabold select-none">
                              {pct.toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* METAS SUB-TAB */}
      {activeSubTab === 'goals' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Actions */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-davinci-black uppercase tracking-wider">Gestão de Metas</h3>
              <p className="text-[11px] text-davinci-gray mt-0.5">Defina e monitore alvos de faturamento ou volume de serviços.</p>
            </div>
            <button
              onClick={() => setShowCreateGoalForm(!showCreateGoalForm)}
              className="px-3.5 py-1.5 bg-davinci-gold hover:bg-davinci-gold/90 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              {showCreateGoalForm ? 'Fechar Form' : 'Criar Nova Meta'}
            </button>
          </div>

          {/* Create Goal Form */}
          {showCreateGoalForm && (
            <form onSubmit={handleCreateGoalSubmit} className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-5 space-y-4 animate-slide-in">
              <h4 className="text-xs font-bold text-davinci-black uppercase tracking-wider border-b border-zinc-200 pb-2">Cadastrar Nova Meta Corporativa</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-davinci-gray uppercase tracking-wider block">Título da Meta</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Faturamento Maio Premium"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs text-davinci-black focus:outline-none focus:border-davinci-gold focus:ring-1 focus:ring-davinci-gold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-davinci-gray uppercase tracking-wider block">Tipo de Meta</label>
                  <select
                    value={goalType}
                    onChange={(e) => setGoalType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs text-davinci-black focus:outline-none focus:border-davinci-gold cursor-pointer"
                  >
                    <option value="BILLING">Faturamento Bruto (R$)</option>
                    <option value="SERVICES">Volume de Atendimentos (Qtd)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-davinci-gray uppercase tracking-wider block">Valor Alvo (Target)</label>
                  <input
                    type="number"
                    required
                    placeholder="Ex: 20000"
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs text-davinci-black focus:outline-none focus:border-davinci-gold focus:ring-1 focus:ring-davinci-gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-davinci-gray uppercase tracking-wider block">Data de Início</label>
                  <input
                    type="date"
                    required
                    value={goalStart}
                    onChange={(e) => setGoalStart(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs text-davinci-black focus:outline-none focus:border-davinci-gold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-davinci-gray uppercase tracking-wider block">Data de Término</label>
                  <input
                    type="date"
                    required
                    value={goalEnd}
                    onChange={(e) => setGoalEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs text-davinci-black focus:outline-none focus:border-davinci-gold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGoalForm(false)}
                  className="px-3.5 py-1.5 border border-zinc-300 hover:bg-zinc-100 rounded-lg text-xs font-bold text-davinci-gray transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createGoalMutation.isPending}
                  className="px-4 py-1.5 bg-davinci-gold hover:bg-davinci-gold/90 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {createGoalMutation.isPending ? 'Salvando...' : 'Cadastrar Meta'}
                </button>
              </div>
            </form>
          )}

          {/* Goals List Grid */}
          {goalsLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="h-6 w-6 border-2 border-davinci-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : goals.length === 0 ? (
            <div className="p-8 text-center bg-zinc-50 border border-zinc-200 rounded-2xl text-xs text-davinci-gray font-semibold italic">
              Nenhuma meta cadastrada no sistema. Clique em "Criar Nova Meta" para começar.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {goals.map((goal: any) => {
                const percent = goal.valorAlvo > 0 ? (goal.valorAtual / goal.valorAlvo) * 100 : 0;
                const formattedPercent = parseFloat(percent.toFixed(1));
                const isBilling = goal.tipo === 'BILLING';

                return (
                  <div key={goal.id} className="bg-white p-5 border border-zinc-200 rounded-2xl shadow-sm space-y-4 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="text-xs font-extrabold text-davinci-black">{goal.titulo}</h4>
                          <span className="text-[9px] text-davinci-gray font-medium mt-0.5 block">
                            {formatDate(goal.dataInicio)} até {formatDate(goal.dataFim)}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border shrink-0 ${
                          isBilling
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}>
                          {isBilling ? 'Faturamento' : 'Serviços'}
                        </span>
                      </div>

                      {/* Values display */}
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <div className="bg-zinc-50/50 p-2 rounded-xl border border-zinc-100">
                          <span className="text-[8px] uppercase tracking-wider text-davinci-gray font-bold block">Atual</span>
                          <strong className={`text-xs font-black block mt-0.5 ${isBilling ? 'text-davinci-black' : 'text-indigo-900'}`}>
                            {isBilling ? formatCurrency(goal.valorAtual) : `${goal.valorAtual} cortes`}
                          </strong>
                        </div>
                        <div className="bg-zinc-50/50 p-2 rounded-xl border border-zinc-100">
                          <span className="text-[8px] uppercase tracking-wider text-davinci-gray font-bold block">Alvo</span>
                          <strong className="text-xs font-black text-davinci-gold block mt-0.5">
                            {isBilling ? formatCurrency(goal.valorAlvo) : `${goal.valorAlvo} cortes`}
                          </strong>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1 pt-2">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-davinci-gray">Progresso:</span>
                          <span className="text-davinci-gold font-extrabold">{formattedPercent}%</span>
                        </div>
                        <div className="w-full bg-[#f6f6f6] h-3 rounded-full overflow-hidden border border-zinc-100">
                          <div
                            className={`rounded-full h-full transition-all duration-1000 ease-out ${
                              percent >= 100
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                : 'bg-gradient-to-r from-amber-500 to-yellow-500'
                            }`}
                            style={{ width: `${Math.min(percent, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-zinc-100 pt-3 mt-2 shrink-0">
                      {percent >= 100 ? (
                        <span className="text-[9px] text-emerald-600 font-extrabold uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 fill-emerald-100" />
                          Alvo Atingido
                        </span>
                      ) : (
                        <span className="text-[9px] text-davinci-gray font-bold uppercase tracking-wider">
                          Em Andamento
                        </span>
                      )}

                      <button
                        onClick={() => {
                          if (confirm(`Tem certeza que deseja excluir a meta "${goal.titulo}"?`)) {
                            deleteGoalMutation.mutate(goal.id);
                          }
                        }}
                        className="p-1 rounded hover:bg-red-50 text-davinci-gray hover:text-red-600 transition-colors cursor-pointer border border-transparent hover:border-red-100"
                        title="Excluir meta"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECURITY AUDIT LOGS SUB-TAB */}
      {activeSubTab === 'audit' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h3 className="text-sm font-bold text-davinci-black uppercase tracking-wider flex items-center gap-2">
              <Lock className="h-4.5 w-4.5 text-davinci-gold" />
              Logs de Auditoria e Segurança
            </h3>
            <p className="text-[11px] text-davinci-gray mt-0.5">
              Rastreamento de exclusões de agendamentos, cancelamentos e alterações de preços praticadas pela equipe.
            </p>
          </div>

          {/* Search bar */}
          <div className="bg-[#fcfcfa] p-3 rounded-2xl border border-zinc-200/80 flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-davinci-gray" />
              <input
                type="text"
                placeholder="Pesquisar por operador, ação ou palavras-chave nos detalhes..."
                value={auditSearchTerm}
                onChange={(e) => setAuditSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-davinci-black focus:outline-none focus:border-davinci-gold"
              />
            </div>
            <span className="text-[10px] text-davinci-gray font-bold uppercase tracking-wider shrink-0 bg-white border border-zinc-200/60 px-3 py-1.5 rounded-xl">
              Qtd: {filteredAuditLogs.length}
            </span>
          </div>

          {/* Table display */}
          {auditLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="h-6 w-6 border-2 border-davinci-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredAuditLogs.length === 0 ? (
            <div className="p-8 text-center bg-zinc-50 border border-zinc-200 rounded-2xl text-xs text-davinci-gray font-semibold italic">
              Nenhum log de auditoria encontrado correspondente aos critérios.
            </div>
          ) : (
            <div className="bg-white border border-zinc-200/85 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 text-davinci-gray uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4 font-bold">Data/Hora</th>
                      <th className="py-3 px-4 font-bold">Operador</th>
                      <th className="py-3 px-4 font-bold">Ação</th>
                      <th className="py-3 px-4 font-bold">Histórico e Detalhes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-medium">
                    {filteredAuditLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="py-3 px-4 text-davinci-gray whitespace-nowrap text-[11px]">
                          {new Date(log.createdAt).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-3 px-4 font-bold text-davinci-black whitespace-nowrap">
                          {log.usuario}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${getActionBadgeColor(log.acao)}`}>
                            {log.acao}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-davinci-gray text-[11px] leading-relaxed max-w-sm">
                          {log.detalhes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
