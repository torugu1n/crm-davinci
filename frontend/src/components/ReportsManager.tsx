'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  Calendar,
  Users,
  Award,
  TrendingUp,
  Clock,
  UserCheck,
  Percent,
  Search,
  ChevronRight,
  TrendingDown,
  CalendarDays,
  Scissors,
  CheckCircle,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function ReportsManager() {
  const token = useStore((state) => state.token);
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeSubTab = searchParams.get('subtab') || 'financial';

  // Date filters
  const [filterType, setFilterType] = useState<'7d' | '30d' | 'month' | 'custom'>('30d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sincronizar datas com filtros padrão
  useEffect(() => {
    const end = new Date();
    const start = new Date();

    if (filterType === '7d') {
      start.setDate(end.getDate() - 7);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    } else if (filterType === '30d') {
      start.setDate(end.getDate() - 30);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    } else if (filterType === 'month') {
      const firstDay = new Date(end.getFullYear(), end.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    }
  }, [filterType]);

  // Fetch report data
  const { data: reportData, isLoading, error } = useQuery({
    queryKey: ['reportData', activeSubTab, startDate, endDate],
    queryFn: () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      return fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/reports/${activeSubTab}?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      ).then((res) => {
        if (!res.ok) throw new Error('Falha ao carregar dados do relatório');
        return res.json();
      });
    },
    enabled: !!token && !!startDate && !!endDate,
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}`;
  };

  // Helper to render custom SVG Line Chart for daily trends
  const renderSVGLineChart = (data: { date: string; value: number }[], labelPrefix = '') => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-48 bg-zinc-50 border border-zinc-100 rounded-xl text-xs text-davinci-gray italic font-semibold">
          Sem dados para o gráfico
        </div>
      );
    }

    const width = 600;
    const height = 200;
    const paddingLeft = 55;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const values = data.map((d) => d.value);
    const maxValue = Math.max(...values, 100);

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Build path coordinates
    const points = data.map((d, idx) => {
      const x = paddingLeft + (idx / (data.length - 1 || 1)) * chartWidth;
      const y = paddingTop + chartHeight - (d.value / maxValue) * chartHeight;
      return { x, y, value: d.value, date: d.date };
    });

    const pathD = points.reduce(
      (acc, p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
      ''
    );

    const areaD =
      points.length > 0
        ? `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${
            paddingTop + chartHeight
          } Z`
        : '';

    // Generate grid lines
    const yGridLines = [0, 0.25, 0.5, 0.75, 1];

    return (
      <div className="w-full overflow-x-auto bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[500px] overflow-visible">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C5A880" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#C5A880" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines and Y axis labels */}
          {yGridLines.map((ratio, idx) => {
            const y = paddingTop + chartHeight * (1 - ratio);
            const val = Math.round(maxValue * ratio);
            return (
              <g key={idx} className="opacity-45">
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#E4E4E7"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-davinci-gray text-[9px] font-bold"
                >
                  {labelPrefix}
                  {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          {areaD && <path d={areaD} fill="url(#areaGradient)" />}

          {/* Line path */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#C5A880"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points */}
          {points.map((p, idx) => (
            <g key={idx} className="group">
              <circle
                cx={p.x}
                cy={p.y}
                r="3.5"
                className="fill-white stroke-davinci-gold stroke-2 cursor-pointer transition-all hover:r-5"
              />
              {/* Tooltip on hover */}
              <title>{`${formatDate(p.date)}: ${labelPrefix}${p.value.toFixed(1)}`}</title>
            </g>
          ))}

          {/* X axis labels (Dates) */}
          {points.map((p, idx) => {
            // Show dates periodically to avoid crowding
            const step = Math.ceil(data.length / 6);
            if (idx % step === 0 || idx === data.length - 1) {
              return (
                <text
                  key={idx}
                  x={p.x}
                  y={height - 10}
                  textAnchor="middle"
                  className="fill-davinci-gray text-[9px] font-bold"
                >
                  {formatDate(p.date)}
                </text>
              );
            }
            return null;
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Upper bar filters */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200/85 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Quick filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {[
            { value: '7d', label: 'Últimos 7 Dias' },
            { value: '30d', label: 'Últimos 30 Dias' },
            { value: 'month', label: 'Este Mês' },
            { value: 'custom', label: 'Personalizado' },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setFilterType(item.value as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === item.value
                  ? 'bg-davinci-gold text-white shadow-sm'
                  : 'bg-zinc-100 text-davinci-gray hover:bg-zinc-200/60'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Date Inputs */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="date"
              value={startDate}
              disabled={filterType !== 'custom'}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-davinci-black focus:outline-none focus:border-davinci-gold disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
          <span className="text-davinci-gray text-[10px] uppercase font-bold tracking-wider">até</span>
          <div className="relative">
            <input
              type="date"
              value={endDate}
              disabled={filterType !== 'custom'}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-davinci-black focus:outline-none focus:border-davinci-gold disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* RENDER LOADING STATE */}
      {isLoading && (
        <div className="flex items-center justify-center p-24 bg-white border border-zinc-200 rounded-2xl h-[400px]">
          <div className="h-8 w-8 border-2 border-davinci-gold border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* RENDER ERROR STATE */}
      {error && (
        <div className="p-8 text-center text-red-500 flex items-center justify-center gap-2 font-bold bg-red-50 rounded-2xl border border-red-200">
          <AlertCircle className="h-5 w-5" />
          Falha ao carregar o relatório. Verifique os filtros.
        </div>
      )}

      {/* RENDER FINANCIAL VIEW */}
      {!isLoading && !error && activeSubTab === 'financial' && reportData && (
        <div className="space-y-6 animate-fade-in">
          {/* Financial Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Faturamento Bruto',
                value: formatCurrency(reportData.kpis.totalRevenue),
                desc: 'Receita gerada no período',
                icon: DollarSign,
                color: 'text-davinci-black',
              },
              {
                title: 'Ticket Médio',
                value: formatCurrency(reportData.kpis.ticketMedio),
                desc: 'Média gasta por agendamento',
                icon: TrendingUp,
                color: 'text-davinci-gold',
              },
              {
                title: 'Comissões Devidas',
                value: formatCurrency(reportData.kpis.totalCommissions),
                desc: 'Rateio destinado aos profissionais',
                icon: Users,
                color: 'text-amber-600',
              },
              {
                title: 'Lucro Líquido Est.',
                value: formatCurrency(reportData.kpis.netProfit),
                desc: 'Faturamento menos comissões',
                icon: Award,
                color: 'text-emerald-600',
              },
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-davinci-gray uppercase tracking-widest font-bold">
                      {card.title}
                    </span>
                    <div className="p-2 rounded-lg bg-davinci-gold/10 border border-davinci-gold/20 text-davinci-gold">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className={`text-2xl font-black ${card.color}`}>{card.value}</h3>
                    <p className="text-[10px] text-davinci-gray mt-1 font-semibold">{card.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Gráfico SVG Linha Faturamento Diário */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-davinci-black uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-davinci-gold" />
              Evolução Temporal do Faturamento Diário (R$)
            </h4>
            {renderSVGLineChart(
              reportData.dailyTrend.map((d: any) => ({ date: d.date, value: d.revenue })),
              'R$'
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Faturamento por Profissional */}
            <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-davinci-black uppercase tracking-widest flex items-center gap-2">
                <Award className="h-4.5 w-4.5 text-davinci-gold" />
                Faturamento por Profissional
              </h4>
              {reportData.revenueByBarber.length === 0 ? (
                <p className="text-xs text-davinci-gray font-semibold italic p-4">Sem registros no período.</p>
              ) : (
                <div className="space-y-4">
                  {reportData.revenueByBarber.map((barber: any, idx: number) => {
                    const maxVal = Math.max(...reportData.revenueByBarber.map((b: any) => b.revenue), 1);
                    const percent = (barber.revenue / maxVal) * 100;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-davinci-black">{barber.name}</span>
                          <span className="text-davinci-gold font-extrabold">{formatCurrency(barber.revenue)}</span>
                        </div>
                        <div className="w-full bg-[#f6f6f6] h-3.5 rounded-full overflow-hidden border border-zinc-100 flex">
                          <div
                            className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full h-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[8px] font-bold text-davinci-gray uppercase tracking-wider">
                          <span>{barber.count} Atendimentos</span>
                          <span>Comissão: {formatCurrency(barber.commission)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Serviços mais Rentáveis */}
            <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-davinci-black uppercase tracking-widest flex items-center gap-2">
                <Scissors className="h-4.5 w-4.5 text-davinci-gold" />
                Serviços mais Rentáveis
              </h4>
              {reportData.revenueByService.length === 0 ? (
                <p className="text-xs text-davinci-gray font-semibold italic p-4">Sem registros no período.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-zinc-200 text-davinci-gray uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-2 font-bold">Nome do Serviço</th>
                        <th className="py-3 px-2 text-center font-bold">Realizados</th>
                        <th className="py-3 px-2 text-right font-bold">Faturamento Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-medium">
                      {reportData.revenueByService.map((srv: any, idx: number) => (
                        <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="py-3 px-2 font-bold text-davinci-black">{srv.name}</td>
                          <td className="py-3 px-2 text-center text-davinci-gray font-semibold">{srv.count}</td>
                          <td className="py-3 px-2 text-right font-bold text-davinci-gold">{formatCurrency(srv.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RENDER APPOINTMENTS VIEW */}
      {!isLoading && !error && activeSubTab === 'appointments' && reportData && (
        <div className="space-y-6 animate-fade-in">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Total de Agendamentos',
                value: reportData.kpis.totalAppointments,
                desc: 'Marcados no período',
                icon: CalendarDays,
                color: 'text-davinci-black',
              },
              {
                title: 'Agendamentos Concluídos',
                value: reportData.kpis.completedCount,
                desc: 'Atendimentos finalizados',
                icon: CheckCircle,
                color: 'text-emerald-600',
              },
              {
                title: 'Faltas e Cancelamentos',
                value: reportData.kpis.cancelledCount,
                desc: 'Cancelados ou não comparecidos',
                icon: AlertCircle,
                color: 'text-rose-600',
              },
              {
                title: 'Taxa de Comparecimento',
                value: `${reportData.kpis.attendanceRate}%`,
                desc: 'Percentual de presença',
                icon: Percent,
                color: 'text-davinci-gold',
              },
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-davinci-gray uppercase tracking-widest font-bold">
                      {card.title}
                    </span>
                    <div className="p-2 rounded-lg bg-davinci-gold/10 border border-davinci-gold/20 text-davinci-gold">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className={`text-2xl font-black ${card.color}`}>{card.value}</h3>
                    <p className="text-[10px] text-davinci-gray mt-1 font-semibold">{card.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Gráfico SVG Linha Atendimentos */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-davinci-black uppercase tracking-widest flex items-center gap-2">
              <CalendarDays className="h-4.5 w-4.5 text-davinci-gold" />
              Volume Diário de Agendamentos (Total)
            </h4>
            {renderSVGLineChart(
              reportData.dailyTrend.map((d: any) => ({ date: d.date, value: d.total }))
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pico por Dia da Semana */}
            <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-davinci-black uppercase tracking-widest flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-davinci-gold" />
                Picos por Dia da Semana
              </h4>
              <div className="space-y-2.5 pt-2">
                {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((dayName, idx) => {
                  const count = reportData.appointmentsByDayOfWeek[idx] || 0;
                  const maxDay = Math.max(...reportData.appointmentsByDayOfWeek, 1);
                  const percent = (count / maxDay) * 100;
                  return (
                    <div key={idx} className="flex items-center gap-4 text-xs">
                      <span className="w-16 font-semibold text-davinci-black">{dayName}</span>
                      <div className="flex-1 bg-[#f6f6f6] h-3 rounded-full overflow-hidden border border-zinc-100 flex">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full h-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="w-8 text-right font-extrabold text-davinci-gold">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Produtividade da Equipe */}
            <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm lg:col-span-2 space-y-4">
              <h4 className="text-xs font-bold text-davinci-black uppercase tracking-widest flex items-center gap-2">
                <Award className="h-4.5 w-4.5 text-davinci-gold" />
                Atendimentos por Profissional
              </h4>
              {reportData.appointmentsByBarber.length === 0 ? (
                <p className="text-xs text-davinci-gray font-semibold italic p-4">Sem registros no período.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-zinc-200 text-davinci-gray uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-2 font-bold">Profissional</th>
                        <th className="py-3 px-2 text-center font-bold">Totais</th>
                        <th className="py-3 px-2 text-center font-bold">Concluídos</th>
                        <th className="py-3 px-2 text-center font-bold">Cancelados</th>
                        <th className="py-3 px-2 text-right font-bold">Conversão</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-medium">
                      {reportData.appointmentsByBarber.map((barber: any, idx: number) => {
                        const total = barber.total || 0;
                        const comp = barber.completed || 0;
                        const rate = total > 0 ? (comp / total) * 100 : 0;
                        return (
                          <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                            <td className="py-3 px-2 font-bold text-davinci-black">{barber.name}</td>
                            <td className="py-3 px-2 text-center text-davinci-gray font-semibold">{total}</td>
                            <td className="py-3 px-2 text-center text-emerald-600 font-bold">{comp}</td>
                            <td className="py-3 px-2 text-center text-rose-600 font-bold">{barber.cancelled}</td>
                            <td className="py-3 px-2 text-right font-bold text-davinci-gold">{rate.toFixed(1)}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RENDER CLIENTS VIEW */}
      {!isLoading && !error && activeSubTab === 'clients' && reportData && (
        <div className="space-y-6 animate-fade-in">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Total de Clientes',
                value: reportData.kpis.totalClients,
                desc: 'Base de contatos cadastrada',
                icon: Users,
                color: 'text-davinci-black',
              },
              {
                title: 'Novos Clientes',
                value: reportData.kpis.newClientsCount,
                desc: 'Cadastros criados no período',
                icon: Plus,
                color: 'text-emerald-600',
              },
              {
                title: 'Clientes Ativos (30d)',
                value: reportData.kpis.activeClients,
                desc: 'Com agendamento recente',
                icon: UserCheck,
                color: 'text-davinci-gold',
              },
              {
                title: 'Taxa de Recorrência',
                value: `${reportData.kpis.recurrenceRate}%`,
                desc: 'Mais de 1 visita cadastrada',
                icon: Percent,
                color: 'text-indigo-600',
              },
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-davinci-gray uppercase tracking-widest font-bold">
                      {card.title}
                    </span>
                    <div className="p-2 rounded-lg bg-davinci-gold/10 border border-davinci-gold/20 text-davinci-gold">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className={`text-2xl font-black ${card.color}`}>{card.value}</h3>
                    <p className="text-[10px] text-davinci-gray mt-1 font-semibold">{card.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Gráfico SVG Linha Novos Cadastros */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-davinci-black uppercase tracking-widest flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-davinci-gold" />
              Crescimento de Cadastros (Novos Clientes Diários)
            </h4>
            {renderSVGLineChart(
              reportData.dailyTrend.map((d: any) => ({ date: d.date, value: d.count }))
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Distribuição de Frequência */}
            <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-davinci-black uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Percent className="h-4.5 w-4.5 text-davinci-gold" />
                  Segmentação por Frequência
                </h4>
                <div className="space-y-4 font-semibold text-xs leading-normal">
                  {[
                    { label: 'Apenas 1 Visita', count: reportData.frequencyDistribution.oneVisit, color: 'bg-zinc-400' },
                    { label: '2 a 5 Visitas', count: reportData.frequencyDistribution.twoToFive, color: 'bg-yellow-500' },
                    { label: '6 a 10 Visitas', count: reportData.frequencyDistribution.sixToTen, color: 'bg-amber-600' },
                    { label: '11 ou mais Visitas', count: reportData.frequencyDistribution.elevenPlus, color: 'bg-[#C5A880]' },
                    { label: 'Sem nenhuma Visita', count: reportData.frequencyDistribution.zeroVisits, color: 'bg-red-400' },
                  ].map((freq, idx) => {
                    const total = Object.values(reportData.frequencyDistribution).reduce((s: any, v: any) => s + v, 0) as number;
                    const pct = total > 0 ? (freq.count / total) * 100 : 0;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-davinci-black">{freq.label}</span>
                          <span className="text-davinci-gray text-[10px] font-bold">
                            {freq.count} ({pct.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="w-full bg-[#f6f6f6] h-2.5 rounded-full overflow-hidden border border-zinc-100">
                          <div className={`h-full ${freq.color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Clientes VIP do Período */}
            <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm lg:col-span-2 space-y-4">
              <h4 className="text-xs font-bold text-davinci-black uppercase tracking-widest flex items-center gap-2">
                <Award className="h-4.5 w-4.5 text-davinci-gold" />
                Clientes VIP (Mais Rentáveis no Período)
              </h4>
              {reportData.vipClients.length === 0 ? (
                <p className="text-xs text-davinci-gray font-semibold italic p-4">Sem registros no período.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-zinc-200 text-davinci-gray uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-2 font-bold">Cliente</th>
                        <th className="py-3 px-2 font-bold">WhatsApp</th>
                        <th className="py-3 px-2 text-center font-bold">Visitas no Período</th>
                        <th className="py-3 px-2 text-right font-bold">Gasto Total no Período</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-medium">
                      {reportData.vipClients.map((vip: any, idx: number) => (
                        <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="py-3 px-2 font-bold text-davinci-black">{vip.name}</td>
                          <td className="py-3 px-2 text-davinci-gray font-semibold">{vip.phone}</td>
                          <td className="py-3 px-2 text-center text-davinci-black font-extrabold">{vip.visits}</td>
                          <td className="py-3 px-2 text-right font-black text-davinci-gold">{formatCurrency(vip.spent)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
