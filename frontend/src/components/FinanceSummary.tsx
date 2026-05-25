'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Calendar, TrendingUp, Users, Award, ShieldAlert } from 'lucide-react';

export default function FinanceSummary() {
  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['financeSummary'],
    queryFn: () => fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/finance/summary`).then((res) => { if (!res.ok) throw new Error('Failed to fetch finance summary'); return res.json(); }),
    refetchInterval: 10000, // auto refresh a cada 10s
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 border-2 border-davinci-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="p-8 text-center text-red-500 flex items-center justify-center gap-2 font-bold">
        <ShieldAlert className="h-5 w-5" />
        Erro ao carregar dados financeiros.
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-8">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm flex flex-col justify-between">
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

        <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm flex flex-col justify-between">
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

        <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm flex flex-col justify-between">
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

        <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm flex flex-col justify-between">
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
          <h4 className="text-xs font-bold text-davinci-black uppercase tracking-widest">Meta de Faturamento Mensal</h4>
          
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

          <div className="space-y-1 text-xs">
            <p className="text-davinci-gray font-semibold">Faturamento: <strong className="text-davinci-black font-extrabold">{formatCurrency(summary.monthlyBilling)}</strong></p>
            <p className="text-davinci-gray font-semibold">Meta do Mês: <strong className="text-davinci-gold font-extrabold">{formatCurrency(summary.monthlyGoal)}</strong></p>
          </div>
        </div>

        {/* Barber Leaderboard Ranking */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm lg:col-span-2 space-y-4">
          <h4 className="text-xs font-bold text-davinci-black uppercase tracking-widest flex items-center gap-2">
            <Award className="h-4.5 w-4.5 text-davinci-gold animate-bounce" />
            Ranking de Produtividade dos Barbeiros
          </h4>

          {summary.barberRanking.length === 0 ? (
            <p className="text-xs text-davinci-gray font-semibold italic">Nenhum dado de produtividade no momento.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-zinc-200 text-davinci-gray uppercase tracking-wider text-[10px] bg-background">
                    <th className="py-3 px-4">Barbeiro</th>
                    <th className="py-3 px-4 text-center">Cortes Realizados</th>
                    <th className="py-3 px-4 text-right">Faturamento Gerado</th>
                    <th className="py-3 px-4 text-right">Comissões</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {summary.barberRanking.map((barber: any, index: number) => (
                    <tr key={index} className="hover:bg-davinci-gold/5 transition-colors">
                      <td className="py-3 px-4 font-bold text-davinci-black flex items-center gap-2">
                        <span className="text-[10px] font-bold text-davinci-gold w-4">#{index + 1}</span>
                        {barber.nome}
                      </td>
                      <td className="py-3 px-4 text-center text-davinci-gray font-semibold">{barber.atendimentos} atendimentos</td>
                      <td className="py-3 px-4 text-right font-bold text-davinci-black">{formatCurrency(barber.faturamento)}</td>
                      <td className="py-3 px-4 text-right font-bold text-davinci-gold">{formatCurrency(barber.comissao)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
