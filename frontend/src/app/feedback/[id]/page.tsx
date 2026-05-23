'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ShieldAlert, CheckCircle2, Award, Sparkles, Smile } from 'lucide-react';

export default function FeedbackRatingPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const appointmentId = params.id as string;

  const [nota, setNota] = useState(5);
  const [ratingBarber, setRatingBarber] = useState(5);
  const [ratingEnv, setRatingEnv] = useState(5);
  const [ratingPunctual, setRatingPunctual] = useState('5'); // "5" = Excelente, "3" = Atrasou leve, "1" = Atraso grave
  const [comentario, setComentario] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch appointment info
  const { data: app, isLoading, error } = useQuery({
    queryKey: ['feedbackAppointment', appointmentId],
    queryFn: () =>
      fetch(`http://localhost:5001/appointments/${appointmentId}`).then((res) => {
        if (!res.ok) throw new Error('Agendamento não encontrado');
        return res.json();
      }),
    enabled: !!appointmentId,
  });

  const submitMutation = useMutation({
    mutationFn: (feedback: any) =>
      fetch('http://localhost:5001/feedbacks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedback),
      }).then((res) => {
        if (!res.ok) throw new Error('Falha ao enviar feedback');
        return res.json();
      }),
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['adminFeedbacks'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Erro de conexão.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    submitMutation.mutate({
      appointmentId,
      nota,
      comentario,
      ratingBarber,
      ratingEnv,
      ratingPunctual,
    });
  };

  const renderStarSelector = (rating: number, setRating: (val: number) => void) => {
    return (
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => {
          const starVal = i + 1;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setRating(starVal)}
              className="p-1 rounded transition-transform hover:scale-125 cursor-pointer"
            >
              <Star
                className={`h-7 w-7 ${
                  starVal <= rating ? 'text-davinci-gold fill-davinci-gold' : 'text-davinci-gray/30'
                }`}
              />
            </button>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-davinci-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <ShieldAlert className="h-12 w-12 text-red-500" />
        <h2 className="text-lg font-bold text-davinci-white">Link de Avaliação Inválido</h2>
        <p className="text-xs text-davinci-gray max-w-sm">
          Este agendamento não existe ou o link de feedback expirou.
        </p>
      </div>
    );
  }

  if (app.feedback || submitted) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card max-w-md w-full p-8 rounded-2xl text-center space-y-6 border border-davinci-gold/20"
        >
          <div className="inline-flex p-3 rounded-full bg-davinci-gold/10 border border-davinci-gold/30 text-davinci-gold mb-2 shadow-[0_0_15px_rgba(198,161,91,0.1)]">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="text-xl font-bold text-davinci-white uppercase tracking-wider text-glow">
            Avaliação Recebida!
          </h2>
          <p className="text-xs text-davinci-gray leading-relaxed">
            Sua opinião é o pilar da nossa busca por excelência. Obrigado por compartilhar sua experiência na Da Vinci Barbearia.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-3 bg-gold-gradient rounded-lg text-davinci-black font-semibold text-xs hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          >
            Voltar ao Início
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black tracking-wider text-davinci-white uppercase text-glow">
            Da Vinci
          </h1>
          <p className="text-[10px] font-light text-davinci-gold mt-1 uppercase tracking-[0.2em]">
            Salão & Estética | Barbearia
          </p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="glass-card p-8 rounded-2xl space-y-6 shadow-2xl">
          <div className="border-b border-davinci-gold/10 pb-4 text-center">
            <h3 className="text-sm font-bold text-davinci-white">Como foi seu atendimento hoje?</h3>
            <p className="text-[10px] text-davinci-gray mt-1 font-light">
              Serviço: <strong className="text-davinci-white">{app.service.nome}</strong> com o barbeiro <strong className="text-davinci-gold">{app.barber.user.nome}</strong>.
            </p>
          </div>

          {/* Stars selectors */}
          <div className="space-y-5">
            <div className="flex flex-col items-center gap-2">
              <label className="text-[10px] text-davinci-gray uppercase tracking-wider font-bold">
                Avaliação Geral do Serviço
              </label>
              {renderStarSelector(nota, setNota)}
            </div>

            <div className="flex flex-col items-center gap-2">
              <label className="text-[10px] text-davinci-gray uppercase tracking-wider font-bold">
                Habilidade do Barbeiro ({app.barber.user.nome})
              </label>
              {renderStarSelector(ratingBarber, setRatingBarber)}
            </div>

            <div className="flex flex-col items-center gap-2">
              <label className="text-[10px] text-davinci-gray uppercase tracking-wider font-bold">
                Acolhimento e Ambiente Da Vinci
              </label>
              {renderStarSelector(ratingEnv, setRatingEnv)}
            </div>

            <div className="flex flex-col items-center gap-2">
              <label className="text-[10px] text-davinci-gray uppercase tracking-wider font-bold">
                Pontualidade
              </label>
              <select
                value={ratingPunctual}
                onChange={(e) => setRatingPunctual(e.target.value)}
                className="bg-[#0A0A0A] border border-davinci-gold/20 rounded-lg px-4 py-2 text-davinci-white focus:outline-none focus:border-davinci-gold text-xs w-48 text-center cursor-pointer"
              >
                <option value="5">Excelente (No horário)</option>
                <option value="3">Atraso Leve (5 a 10 min)</option>
                <option value="1">Atraso Moderado</option>
              </select>
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="block text-[10px] text-davinci-gray uppercase tracking-wider font-bold text-center">
              Comentários e Sugestões
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Escreva como foi sua experiência..."
              rows={3}
              className="w-full bg-[#0A0A0A] border border-davinci-gold/20 focus:border-davinci-gold rounded-xl px-4 py-3 text-xs text-davinci-white focus:outline-none leading-relaxed"
            />
          </div>

          {errorMsg && <div className="text-red-400 text-xs text-center font-medium">{errorMsg}</div>}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitMutation.isPending}
            className="w-full py-3.5 bg-gold-gradient rounded-xl text-davinci-black font-bold text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-[0_4px_15px_rgba(198,161,91,0.2)] flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitMutation.isPending ? (
              <div className="h-5 w-5 border-2 border-davinci-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Enviar Avaliação
                <Smile className="h-4.5 w-4.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
