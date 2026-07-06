'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { CreditCard, Calendar, ShieldAlert, Sparkles, CheckCircle } from 'lucide-react';

export default function TenantBillingManager() {
  const tenant = useStore((state) => state.tenant);
  const [billingLinks, setBillingLinks] = useState<{ PLAN_BASIC_LINK: string; PLAN_UNLIMITED_LINK: string }>({
    PLAN_BASIC_LINK: '',
    PLAN_UNLIMITED_LINK: '',
  });
  const [loadingLinks, setLoadingLinks] = useState(true);

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
        console.error('Erro ao carregar links de cobrança', err);
      } finally {
        setLoadingLinks(false);
      }
    };
    fetchLinks();
  }, []);

  if (!tenant) return null;

  const status = tenant.subscriptionStatus || 'TRIAL';
  const isTrial = status === 'TRIAL';
  const trialEnds = tenant.trialEndsAt ? new Date(tenant.trialEndsAt) : null;
  
  let trialDaysLeft = 0;
  if (trialEnds) {
    const diff = trialEnds.getTime() - Date.now();
    trialDaysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
  const isExpired = isTrial && trialDaysLeft <= 0;

  const planName = tenant.saasPlan === 'UNLIMITED' ? 'Absoluto (Ilimitado)' : 'Essencial (Basic)';
  const checkoutUrl = tenant.saasPlan === 'UNLIMITED' ? billingLinks.PLAN_UNLIMITED_LINK : billingLinks.PLAN_BASIC_LINK;

  const getStatusBadge = () => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle className="h-3.5 w-3.5" /> Ativa
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
            <ShieldAlert className="h-3.5 w-3.5 animate-pulse" /> Atrasada
          </span>
        );
      case 'CANCELED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-100 text-zinc-700">
            Cancelada
          </span>
        );
      case 'TRIAL':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <Calendar className="h-3.5 w-3.5" /> Período de Testes
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden mb-8">
      <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
        <h4 className="text-xs font-bold text-davinci-black uppercase tracking-widest flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-davinci-gold" />
          Minha Assinatura Venusta
        </h4>
        {getStatusBadge()}
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Subscription Info */}
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-davinci-gray uppercase tracking-wider block">Plano Selecionado</span>
            <div className="text-sm font-extrabold text-davinci-black flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-davinci-gold" />
              {planName}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-davinci-gray uppercase tracking-wider block">Status da Conta</span>
            <div className="text-xs text-davinci-gray leading-relaxed">
              {status === 'ACTIVE' && 'Sua assinatura está ativa e regularizada. Obrigado pela parceria!'}
              {status === 'OVERDUE' && 'Sua assinatura está pendente de pagamento. Por favor, regularize clicando no botão ao lado.'}
              {status === 'CANCELED' && 'Sua assinatura foi cancelada. Assine novamente para restabelecer o acesso total.'}
              {status === 'TRIAL' && (
                isExpired 
                  ? 'Seu período de teste gratuito expirou. Regularize sua assinatura ao lado.'
                  : `Você está no período de testes grátis de 7 dias da plataforma. Restam exatamente ${trialDaysLeft} ${trialDaysLeft === 1 ? 'dia' : 'dias'}.`
              )}
            </div>
          </div>
        </div>

        {/* Subscribe / Checkout Trigger */}
        <div className="flex flex-col sm:items-end justify-center">
          {status !== 'ACTIVE' ? (
            <div className="w-full max-w-sm space-y-3">
              <a
                href={checkoutUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (!checkoutUrl) {
                    e.preventDefault();
                    alert('Link de pagamento não configurado pelo administrador da plataforma.');
                  }
                }}
                className="w-full bg-gold-gradient text-white hover:scale-[1.01] active:scale-[0.99] font-bold text-xs py-3.5 rounded-xl text-center flex items-center justify-center gap-1.5 transition-all shadow-[0_4px_15px_rgba(197,168,128,0.2)]"
              >
                <CreditCard className="h-4 w-4" /> 
                {isTrial ? 'Ativar Assinatura Venusta' : 'Regularizar Assinatura'}
              </a>
              <span className="text-[9px] text-davinci-gray block text-center sm:text-right">
                Pagamento processado de forma segura via gateway Asaas.
              </span>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-xl text-xs text-emerald-850 flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold block">Assinatura Ativa</span>
                Sua conta está totalmente licenciada e sem restrições.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
