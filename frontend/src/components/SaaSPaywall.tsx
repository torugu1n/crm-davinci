'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { CreditCard, AlertTriangle, LogOut, CheckCircle2, Lock } from 'lucide-react';

export default function SaaSPaywall() {
  const tenant = useStore((state) => state.tenant);
  const logout = useStore((state) => state.logout);
  const [billingLinks, setBillingLinks] = useState<{ PLAN_BASIC_LINK: string; PLAN_UNLIMITED_LINK: string }>({
    PLAN_BASIC_LINK: '',
    PLAN_UNLIMITED_LINK: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
        const res = await fetch(`${apiUrl}/tenants/public/billing/links`);
        if (res.ok) {
          const data = await res.json();
          setBillingLinks(data);
        }
      } catch (err) {
        console.error('Erro ao carregar links de pagamento', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLinks();
  }, []);

  if (!tenant) return null;

  const status = tenant.subscriptionStatus || 'TRIAL';
  const isTrial = status === 'TRIAL';
  const trialEnds = tenant.trialEndsAt ? new Date(tenant.trialEndsAt) : null;
  const isExpired = isTrial && trialEnds && trialEnds < new Date();
  const isOverdue = status === 'OVERDUE';
  const isCanceled = status === 'CANCELED';

  // If subscription is active or trial has not expired, do not show paywall
  if (!isExpired && !isOverdue && !isCanceled) {
    return null;
  }

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row my-8">
        
        {/* Left Side: Info & Slogan */}
        <div className="p-8 md:p-12 md:w-1/2 flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-850">
          <div className="space-y-6">
            <span className="font-outfit text-2xl font-extrabold tracking-wider bg-gold-gradient bg-clip-text text-transparent">
              VENUSTA
            </span>

            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Lock className="w-6 h-6" />
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-extrabold text-white">
                {isExpired ? 'Seu período de teste expirou!' : 'Sua assinatura está suspensa!'}
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {isExpired 
                  ? 'Seu salão completou o período de 7 dias de experimentação gratuita. Para continuar utilizando os recursos da plataforma, escolha um plano ao lado.' 
                  : 'Identificamos uma pendência financeira em sua assinatura da plataforma Venusta. Por favor, regularize seu pagamento para continuar acessando seu painel.'}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs text-zinc-400">
                <CheckCircle2 className="text-davinci-gold h-4 w-4 shrink-0" />
                <span>Gestão completa de agenda e profissionais</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-400">
                <CheckCircle2 className="text-davinci-gold h-4 w-4 shrink-0" />
                <span>Confirmações automáticas de WhatsApp</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-400">
                <CheckCircle2 className="text-davinci-gold h-4 w-4 shrink-0" />
                <span>Dashboard de faturamento e comissões</span>
              </div>
            </div>
          </div>

          <div className="pt-8 flex items-center justify-between">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              <LogOut className="h-4 w-4" /> Sair da conta
            </button>
            <span className="text-[10px] text-zinc-650 font-bold uppercase tracking-wider">
              Criado por VTRX Solutions
            </span>
          </div>
        </div>

        {/* Right Side: Payment Plans */}
        <div className="p-8 md:p-12 md:w-1/2 bg-zinc-950 flex flex-col justify-center space-y-6">
          <div className="text-xs font-semibold text-zinc-550 uppercase tracking-wider">
            Planos SaaS Disponíveis
          </div>

          <div className="space-y-4">
            {/* Essencial (BASIC) */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between transition-all hover:border-zinc-750">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-white text-base">Plano Essencial</h4>
                  <p className="text-xs text-zinc-500">Perfeito para salões iniciantes</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-white">R$ 69,90</div>
                  <div className="text-[10px] text-zinc-500">/mês</div>
                </div>
              </div>
              
              <ul className="text-[10px] text-zinc-400 space-y-1 mb-4">
                <li>• Até 3 Barbeiros/Profissionais</li>
                <li>• 1 Atendente Administrativo</li>
                <li>• Até 500 Clientes Cadastrados</li>
              </ul>

              <a
                href={billingLinks.PLAN_BASIC_LINK || '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (!billingLinks.PLAN_BASIC_LINK) {
                    e.preventDefault();
                    alert('Link de pagamento não configurado pelo administrador.');
                  }
                }}
                className="w-full bg-zinc-800 hover:bg-zinc-750 text-white font-bold text-xs py-3 rounded-lg text-center flex items-center justify-center gap-1.5 transition-colors border border-zinc-700"
              >
                <CreditCard className="h-3.5 w-3.5" /> Assinar Essencial
              </a>
            </div>

            {/* Absoluto (UNLIMITED) */}
            <div className="bg-zinc-900 border border-davinci-gold/30 rounded-2xl p-6 flex flex-col justify-between transition-all hover:border-davinci-gold/50 relative overflow-hidden">
              <div className="absolute top-0 right-4 bg-davinci-gold text-zinc-950 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-b">
                MAIS POPULAR
              </div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-white text-base">Plano Absoluto</h4>
                  <p className="text-xs text-zinc-500">Sem limites e completo</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-davinci-gold">R$ 99,90</div>
                  <div className="text-[10px] text-zinc-500">/mês</div>
                </div>
              </div>

              <ul className="text-[10px] text-zinc-400 space-y-1 mb-4">
                <li>• Profissionais, Atendentes e Clientes ilimitados</li>
                <li>• Chatbot de Inteligência Artificial Ativo</li>
                <li>• Clube de Assinaturas e Lembretes ilimitados</li>
              </ul>

              <a
                href={billingLinks.PLAN_UNLIMITED_LINK || '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (!billingLinks.PLAN_UNLIMITED_LINK) {
                    e.preventDefault();
                    alert('Link de pagamento não configurado pelo administrador.');
                  }
                }}
                className="w-full bg-gold-gradient text-white font-bold text-xs py-3 rounded-lg text-center flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                <CreditCard className="h-3.5 w-3.5" /> Assinar Absoluto
              </a>
            </div>
          </div>
          
          <p className="text-[10px] text-zinc-500 text-center leading-normal">
            ℹ️ Após confirmar seu pagamento no checkout do Asaas, seu painel será liberado automaticamente em poucos instantes.
          </p>
        </div>

      </div>
    </div>
  );
}
