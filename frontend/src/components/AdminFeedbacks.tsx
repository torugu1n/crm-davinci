'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star, ShieldAlert, Heart, Calendar, Smile } from 'lucide-react';

export default function AdminFeedbacks() {
  const { data: feedbacks = [], isLoading, error } = useQuery({
    queryKey: ['adminFeedbacks'],
    queryFn: () => fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/feedbacks`).then((res) => { if (!res.ok) throw new Error('Failed to fetch feedbacks'); return res.json(); }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 border-2 border-davinci-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 flex items-center justify-center gap-2 font-bold">
        <ShieldAlert className="h-5 w-5" />
        Erro ao carregar feedbacks.
      </div>
    );
  }

  // Calcular médias
  const totalReviews = feedbacks.length;
  const avgOverall = totalReviews > 0 ? feedbacks.reduce((s: number, f: any) => s + f.nota, 0) / totalReviews : 5.0;
  const avgBarber = totalReviews > 0 ? feedbacks.reduce((s: number, f: any) => s + f.ratingBarber, 0) / totalReviews : 5.0;
  const avgEnv = totalReviews > 0 ? feedbacks.reduce((s: number, f: any) => s + f.ratingEnv, 0) / totalReviews : 5.0;

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${
              i < Math.round(rating)
                ? 'text-davinci-gold fill-davinci-gold'
                : 'text-davinci-gray/30'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-[10px] text-davinci-gray uppercase tracking-widest font-bold">Média Geral</span>
          <h3 className="text-4xl font-black text-davinci-black mt-2">{avgOverall.toFixed(1)}</h3>
          <div className="mt-2">{renderStars(avgOverall)}</div>
          <span className="text-[9px] text-davinci-gray mt-2 font-semibold">{totalReviews} avaliações enviadas</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-davinci-gray uppercase tracking-widest font-bold">Técnica do Profissional</span>
            <h3 className="text-2xl font-bold text-davinci-black mt-1">{avgBarber.toFixed(2)} / 5.00</h3>
          </div>
          <div className="w-full bg-background h-2 rounded-full mt-4 overflow-hidden border border-zinc-200">
            <div className="bg-davinci-gold h-full rounded-full" style={{ width: `${(avgBarber / 5) * 100}%` }} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-davinci-gray uppercase tracking-widest font-bold">Ambiente e Luxo</span>
            <h3 className="text-2xl font-bold text-davinci-black mt-1">{avgEnv.toFixed(2)} / 5.00</h3>
          </div>
          <div className="w-full bg-background h-2 rounded-full mt-4 overflow-hidden border border-zinc-200">
            <div className="bg-davinci-gold h-full rounded-full" style={{ width: `${(avgEnv / 5) * 100}%` }} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-davinci-gray uppercase tracking-widest font-bold">Pontualidade Média</span>
            <h3 className="text-2xl font-bold text-davinci-black mt-1">Excelente</h3>
          </div>
          <p className="text-[10px] text-davinci-gray mt-3 leading-relaxed font-semibold">
            96% dos atendimentos iniciados no horário selecionado.
          </p>
        </div>
      </div>

      {/* Feedbacks Grid */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-davinci-black uppercase tracking-widest flex items-center gap-2">
          <Smile className="h-4.5 w-4.5 text-davinci-gold" />
          Depoimentos e Avaliações Recentes
        </h4>

        {feedbacks.length === 0 ? (
          <p className="text-xs text-davinci-gray font-semibold italic">Nenhum feedback recebido até o momento.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {feedbacks.map((f: any) => (
              <div key={f.id} className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="text-xs font-bold text-davinci-black">{f.appointment.client.nome}</h5>
                    <p className="text-[9px] text-davinci-gray mt-1 font-semibold">
                      Atendido por <strong className="text-davinci-gold">{f.appointment.barber.user.nome}</strong> • {f.appointment.service.nome}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {renderStars(f.nota)}
                    <span className="text-[8px] text-davinci-gray uppercase tracking-wider font-semibold flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-davinci-gold" />
                      {new Date(f.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-davinci-black leading-relaxed italic bg-background p-3 rounded-lg border border-zinc-200/60 font-medium">
                  "{f.comentario || 'Sem comentários adicionais.'}"
                </p>

                <div className="grid grid-cols-2 gap-3 text-[10px] text-davinci-gray border-t border-zinc-100 pt-3">
                  <div className="flex justify-between">
                    <span>Habilidade Profissional:</span>
                    <strong className="text-davinci-black">{f.ratingBarber}/5</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Espaço Da Vinci:</span>
                    <strong className="text-davinci-black">{f.ratingEnv}/5</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
