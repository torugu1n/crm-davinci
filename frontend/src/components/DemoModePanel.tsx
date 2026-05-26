'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, X, ChevronDown, ChevronUp, Compass, UserCheck } from 'lucide-react';
import { useStore, type DemoPersona } from '@/store/useStore';
import { authenticateDemoPersona, DEMO_PERSONAS } from '@/lib/demo';

const PERSONA_ORDER: DemoPersona[] = ['admin', 'attendant', 'professional', 'client'];

export default function DemoModePanel() {
  const router = useRouter();
  const token = useStore((state) => state.token);
  const demoMode = useStore((state) => state.demoMode);
  const demoPersona = useStore((state) => state.demoPersona);
  const setSession = useStore((state) => state.setSession);
  const logout = useStore((state) => state.logout);
  const setDemoMode = useStore((state) => state.setDemoMode);
  const tourActive = useStore((state) => state.tourActive);
  const setTourActive = useStore((state) => state.setTourActive);
  const setTourStep = useStore((state) => state.setTourStep);
  const addNotification = useStore((state) => state.addNotification);

  const [collapsed, setCollapsed] = useState(false);
  const [loadingPersona, setLoadingPersona] = useState<DemoPersona | null>(null);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activePersona = demoPersona || 'admin';

  if (!mounted || !demoMode || !token || tourActive) {
    return null;
  }

  const switchPersona = async (persona: DemoPersona) => {
    if (persona === activePersona) return;

    setLoadingPersona(persona);
    setError('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const data = await authenticateDemoPersona(persona, apiUrl);
      const nextUser = data.user || data.client;
      if (!nextUser) {
        throw new Error('Não foi possível alternar o perfil demo.');
      }

      setSession(data.access_token, nextUser);
      setDemoMode(true, persona); // This automatically sets tourActive: true and tourStep: 0
      
      addNotification({
        title: 'Perfil alternado!',
        description: `Carregando roteiro para ${DEMO_PERSONAS[persona].label}.`,
        type: 'info',
      });
      router.push(DEMO_PERSONAS[persona].destination);
    } catch (err: any) {
      setError(err.message || 'Falha ao alternar perfil demo.');
    } finally {
      setLoadingPersona(null);
    }
  };

  const handleRestartTour = () => {
    setTourStep(0);
    setTourActive(true);
    router.push(DEMO_PERSONAS[activePersona].destination);
    addNotification({
      title: 'Tutorial iniciado!',
      description: 'Acompanhe as etapas destacadas na tela.',
      type: 'info',
    });
  };

  return (
    <div className="fixed bottom-5 right-5 z-[88] w-[320px] max-w-[calc(100vw-2rem)]">
      <div className="rounded-[24px] border border-davinci-gold/25 bg-white/95 shadow-[0_20px_60px_rgba(28,26,23,0.18)] backdrop-blur-xl">
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-zinc-200/80 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-davinci-gold/12 text-davinci-gold">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-davinci-gold">Modo Demo</p>
              <p className="text-[11px] font-bold text-davinci-black">Controle de Perfis</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCollapsed((current) => !current)}
            className="rounded-xl border border-zinc-200 p-1.5 text-davinci-gray hover:border-davinci-gold hover:text-davinci-gold transition-colors"
          >
            {collapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {/* Panel Body */}
        {!collapsed ? (
          <div className="space-y-4 p-4">
            {/* Roles / Account Toggle */}
            <div className="space-y-2">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-davinci-gold">
                Escolha o perfil demo
              </p>
              <div className="space-y-2">
                {PERSONA_ORDER.map((persona) => {
                  const isActive = persona === activePersona;
                  return (
                    <button
                      key={persona}
                      type="button"
                      onClick={() => switchPersona(persona)}
                      disabled={loadingPersona !== null}
                      className={`w-full rounded-xl border p-2.5 text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isActive
                          ? 'border-davinci-gold bg-white text-davinci-black shadow-sm ring-1 ring-davinci-gold/10'
                          : 'border-zinc-200 bg-white/70 text-davinci-gray hover:border-davinci-gold/45 hover:bg-white'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-davinci-black">
                          {DEMO_PERSONAS[persona].label}
                        </p>
                        <p className="mt-0.5 text-[10px] leading-relaxed text-davinci-gray font-medium truncate">
                          {DEMO_PERSONAS[persona].description}
                        </p>
                      </div>
                      {loadingPersona === persona ? (
                        <div className="h-4 w-4 border-2 border-davinci-gold border-t-transparent rounded-full animate-spin shrink-0" />
                      ) : isActive ? (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-davinci-gold/10 text-davinci-gold shrink-0">
                          <UserCheck className="h-3 w-3" />
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {error ? <p className="text-[10px] font-semibold text-red-500">{error}</p> : null}

            {/* Guided Tour Trigger */}
            <button
              type="button"
              onClick={handleRestartTour}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gold-gradient px-4 py-2.5 text-xs font-black uppercase tracking-wider text-davinci-black transition-all hover:scale-[1.01] shadow-[0_4px_12px_rgba(197,168,128,0.22)] cursor-pointer"
            >
              <Compass className="h-4 w-4" />
              Reiniciar Roteiro
            </button>

            {/* Logout Demo */}
            <div className="pt-2 border-t border-zinc-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-1.5 text-[10px] font-bold text-red-500 hover:bg-red-50 transition-all cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
                Encerrar Modo Demo
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
