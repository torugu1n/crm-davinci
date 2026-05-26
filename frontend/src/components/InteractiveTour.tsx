'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Compass, ArrowRight, ArrowLeft, X, Sparkles, LogOut } from 'lucide-react';
import { useStore, type DemoPersona } from '@/store/useStore';
import { DEMO_TOUR_CONTENT, authenticateDemoPersona, DEMO_PERSONAS } from '@/lib/demo';

export default function InteractiveTour() {
  const router = useRouter();
  const pathname = usePathname();
  const tourActive = useStore((state) => state.tourActive);
  const tourStep = useStore((state) => state.tourStep);
  const demoPersona = useStore((state) => state.demoPersona);
  const demoMode = useStore((state) => state.demoMode);
  const token = useStore((state) => state.token);
  const setTourActive = useStore((state) => state.setTourActive);
  const setTourStep = useStore((state) => state.setTourStep);
  const setSession = useStore((state) => state.setSession);
  const setDemoMode = useStore((state) => state.setDemoMode);
  const logout = useStore((state) => state.logout);
  const addNotification = useStore((state) => state.addNotification);

  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [switchingPersona, setSwitchingPersona] = useState<DemoPersona | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activePersona = demoPersona || 'admin';
  const tourData = useMemo(() => DEMO_TOUR_CONTENT[activePersona], [activePersona]);
  const steps = useMemo(() => tourData?.steps || [], [tourData]);
  const step = useMemo(() => steps[tourStep], [steps, tourStep]);

  // Handle data-demo-mode attribute on HTML tag for click indicators and custom hover borders
  useEffect(() => {
    if (demoMode) {
      document.documentElement.setAttribute('data-demo-mode', 'true');
    } else {
      document.documentElement.removeAttribute('data-demo-mode');
    }
    return () => {
      document.documentElement.removeAttribute('data-demo-mode');
    };
  }, [demoMode]);

  // Track viewport changes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Trigger route/tab actions automatically when step or persona changes
  useEffect(() => {
    if (tourActive && step?.href) {
      const t = setTimeout(() => {
        router.push(step.href);
      }, 50);
      return () => clearTimeout(t);
    }
  }, [tourActive, tourStep, step?.href, router]);

  // Dynamic Spotlight positioning hook
  useEffect(() => {
    if (!tourActive || !step?.selector) {
      setCoords(null);
      return;
    }

    const updateCoords = () => {
      const el = document.querySelector(step.selector);
      if (el) {
        const rect = el.getBoundingClientRect();
        setCoords((prev) => {
          if (
            prev &&
            prev.top === rect.top &&
            prev.left === rect.left &&
            prev.width === rect.width &&
            prev.height === rect.height
          ) {
            return prev;
          }
          return {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          };
        });
      } else {
        setCoords(null);
      }
    };

    updateCoords();
    const interval = setInterval(updateCoords, 150);
    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords, true);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [tourActive, tourStep, step?.selector]);

  if (!mounted || !tourActive || !demoMode || !token || !step) {
    return null;
  }

  const handleNext = () => {
    if (tourStep < steps.length - 1) {
      setTourStep(tourStep + 1);
    } else {
      setTourActive(false);
      addNotification({
        title: 'Roteiro finalizado!',
        description: `Você explorou todos os módulos do perfil ${
          activePersona === 'admin' ? 'Administrador' : activePersona === 'attendant' ? 'Atendente' : 'Profissional'
        }.`,
        type: 'success',
      });
    }
  };

  const handlePrev = () => {
    if (tourStep > 0) {
      setTourStep(tourStep - 1);
    }
  };

  const handleSwitchPersona = async (persona: DemoPersona) => {
    if (persona === activePersona) return;
    setSwitchingPersona(persona);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const data = await authenticateDemoPersona(persona, apiUrl);
      const nextUser = data.user || data.client;
      if (!nextUser) throw new Error('Não foi possível alternar de perfil.');

      setSession(data.access_token, nextUser);
      setDemoMode(true, persona);
      addNotification({
        title: `Perfil alternado!`,
        description: `Iniciando tutorial para ${
          persona === 'admin' ? 'Administrador' : persona === 'attendant' ? 'Atendente' : 'Profissional'
        }.`,
        type: 'info',
      });
      router.push(DEMO_PERSONAS[persona].destination);
    } catch (err: any) {
      addNotification({
        title: 'Erro ao alternar',
        description: err.message || 'Falha na conexão.',
        type: 'error',
      });
    } finally {
      setSwitchingPersona(null);
    }
  };

  // Safe Tooltip Card styling: placed at the bottom-left, next to the 256px sidebar
  // This guarantees it is 100% visible, never overlaps the main content, and never goes offscreen.
  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 99,
    width: isMobile ? 'calc(100% - 32px)' : '340px',
    maxWidth: '380px',
    bottom: '24px',
    left: isMobile
      ? '50%'
      : pathname.startsWith('/dashboard') || pathname.startsWith('/profissional')
      ? '280px' // Clear of the 256px sidebar
      : '24px',
    transform: isMobile ? 'translateX(-50%)' : 'none',
    transition: 'left 0.3s ease, transform 0.3s ease',
  };

  const personaLabels: Record<DemoPersona, string> = {
    admin: 'Administrador',
    attendant: 'Atendente',
    professional: 'Profissional',
    client: 'Cliente',
  };

  return (
    <>
      {/* Spotlight highlight box. pointerEvents: none lets user click directly on elements underneath */}
      {coords && (
        <div
          style={{
            position: 'fixed',
            top: `${coords.top - 8}px`,
            left: `${coords.left - 8}px`,
            width: `${coords.width + 16}px`,
            height: `${coords.height + 16}px`,
            borderRadius: '16px',
            boxShadow: '0 0 0 9999px rgba(15, 15, 15, 0.45)',
            zIndex: 35,
            pointerEvents: 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          className="border-2 border-davinci-gold shadow-[0_0_20px_rgba(197,168,128,0.45)] ring-4 ring-davinci-gold/20"
        />
      )}

      {/* Tooltip Card (Premium Glassmorphism Design) */}
      <div
        style={tooltipStyle}
        className="rounded-[24px] border border-davinci-gold/25 bg-white/95 p-5 shadow-[0_20px_60px_rgba(28,26,23,0.22)] backdrop-blur-xl flex flex-col"
      >
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-davinci-gold/15 text-davinci-gold animate-pulse">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-davinci-gold">
                Guia Rápido
              </span>
              <h5 className="text-[11px] font-bold text-davinci-black">
                Perfil: {personaLabels[activePersona]}
              </h5>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setTourActive(false)}
            className="rounded-lg p-1 text-davinci-gray hover:bg-zinc-100 hover:text-davinci-black transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Card Body */}
        <div className="flex-1 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-[0.15em] bg-zinc-100 px-2 py-0.5 rounded-full text-davinci-gray">
              Módulo {tourStep + 1} de {steps.length}
            </span>
            <div className="flex gap-1">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    idx === tourStep ? 'w-4 bg-davinci-gold' : 'w-1.5 bg-zinc-200'
                  }`}
                />
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-black uppercase tracking-[0.05em] text-davinci-black">
              {step.title}
            </h4>
            <p className="mt-1.5 text-[11px] leading-relaxed text-davinci-gray font-semibold">
              {step.description}
            </p>
          </div>
        </div>

        {/* Quick Persona Switcher Toggle inside the Tour Popup */}
        <div className="mt-4 pt-3 border-t border-zinc-100 space-y-1.5">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-davinci-gold">
            Alternar Roteiro / Conta Demo
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {(['admin', 'attendant', 'professional'] as DemoPersona[]).map((persona) => {
              const isActive = persona === activePersona;
              return (
                <button
                  key={persona}
                  type="button"
                  disabled={switchingPersona !== null}
                  onClick={() => handleSwitchPersona(persona)}
                  className={`py-1.5 px-1 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all text-center border cursor-pointer ${
                    isActive
                      ? 'bg-davinci-gold/12 border-davinci-gold text-davinci-gold shadow-sm font-semibold'
                      : 'bg-zinc-50 border-zinc-200 text-davinci-gray hover:border-davinci-gold/40 hover:text-davinci-black'
                  }`}
                >
                  {switchingPersona === persona ? (
                    <span className="inline-block h-2 w-2 border border-davinci-gold border-t-transparent rounded-full animate-spin" />
                  ) : (
                    personaLabels[persona]
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="mt-4 pt-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-700 transition-colors cursor-pointer"
          >
            <LogOut className="h-3 w-3" />
            Sair
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={tourStep === 0}
              onClick={handlePrev}
              className={`inline-flex items-center justify-center gap-1 rounded-xl border border-zinc-200 px-3 py-1.5 text-[10px] font-bold text-davinci-black transition-all hover:bg-zinc-50 ${
                tourStep === 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <ArrowLeft className="h-3 w-3" />
              Voltar
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center justify-center gap-1 rounded-xl bg-gold-gradient px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-davinci-black transition-all hover:scale-[1.02] shadow-[0_4px_12px_rgba(197,168,128,0.25)] cursor-pointer"
            >
              {tourStep === steps.length - 1 ? 'Concluir' : 'Próximo'}
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
