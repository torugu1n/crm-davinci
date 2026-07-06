'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { canAccessDashboard, isClientUser, isProfessionalUser } from '@/lib/auth';
import Link from 'next/link';
import { ArrowRight, Check, MessageSquare, Calendar, ShieldCheck, CreditCard, Sparkles, ChevronRight, Menu, X, ArrowDown } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

import { AnimatePresence } from 'framer-motion';
import Lenis from 'lenis';

const MOCK_CLIENTS = [
  {
    id: 0,
    name: 'Victor Hugo',
    phone: '(86) 99999-9999',
    initials: 'P',
    avatarBg: 'bg-purple-100 border-purple-200 text-purple-700',
    status: 'EM AGENDAMENTO',
    statusBg: 'bg-amber-100 text-amber-800 border border-amber-200/50',
    time: '14:05',
    subTitle: 'Membro Club Premium',
    subscription: '⭐ CLUB PREMIUM ATIVO',
    balance: ['2x Corte de Cabelo', '1x Manicure'],
    services: ['Corte de Cabelo', 'Barba Premium', 'Manicure & Pedicure', 'Coloração & Mechas'],
    visits: 12,
    ticket: 'R$ 115',
    chat: [
      { type: 'client', text: 'Olá, gostaria de marcar um corte de cabelo para amanhã.', time: '14:04' },
      { type: 'ia', text: 'Olá, Victor Hugo! Seja bem-vindo ao <strong>Barber Venusta</strong>. 💈\n\nIdentifiquei que você possui o plano <strong>Club Premium Ativo</strong> (saldo: 2 cortes).\n\nSe preferir agendar sozinho:\n👉 <strong>venusta.link/estabelecimento1</strong>\n\nOu continue por aqui mesmo!', time: '14:04' },
      { type: 'client', text: 'Quero continuar por aqui mesmo.', time: '14:05' },
      { type: 'ia', text: 'Perfeito! Como você é membro do <strong>Club Premium</strong>, podemos agendar seu corte com prioridade. 🌟\n\nTemos horários livres amanhã com o barbeiro <strong>Rodrigo</strong>:\n📅 <strong>14:00</strong> ou <strong>16:30</strong>.\n\nQual deles você prefere?', time: '14:05' },
      { type: 'client', text: 'Pode marcar para as 16:30 com o Rodrigo.', time: '14:06' },
      { type: 'ia', text: 'Confirmadíssimo, Victor Hugo! Seu corte com Rodrigo está agendado para amanhã às <strong>16:30</strong>. 📅\n\n🕒 <em>Lembrete: Enviaremos um follow-up de confirmação por aqui 1 hora antes do serviço. Até lá!</em> 🚀', time: '14:06' }
    ]
  },
  {
    id: 1,
    name: 'Mariana Costa',
    phone: '(11) 98888-7777',
    initials: 'M',
    avatarBg: 'bg-emerald-100 border-emerald-250 text-emerald-700',
    status: 'CONFIRMADO',
    statusBg: 'bg-emerald-100 text-emerald-850 border border-emerald-200/50',
    time: '13:40',
    subTitle: 'Membro Club VIP',
    subscription: '⭐ CLUB VIP ATIVO',
    balance: ['1x Hidratação', '1x Escova', '1x Sobrancelha'],
    services: ['Hidratação L\'Oréal', 'Escova Modeladora', 'Design de Sobrancelhas', 'Depilação Buço'],
    visits: 8,
    ticket: 'R$ 95',
    chat: [
      { type: 'client', text: 'Oi, preciso agendar uma hidratação esta semana.', time: '13:38' },
      { type: 'ia', text: 'Olá, Mariana! Que bom falar com você. 🌸\n\nConfirmamos seu plano <strong>Club VIP Ativo</strong> (saldo: 1x Hidratação, 1x Escova).\n\nPara agendar pelo link personalizado:\n👉 <strong>venusta.link/estabelecimento1</strong>\n\nOu continue por aqui.', time: '13:38' },
      { type: 'client', text: 'Prefiro continuar por aqui.', time: '13:39' },
      { type: 'ia', text: 'Maravilha! Verifiquei que seu plano <strong>Club VIP</strong> cobre o serviço completo. ✨\n\nTemos horários livres na sexta com a cabeleireira <strong>Gabriela</strong>:\n📅 <strong>09:30</strong> ou <strong>11:00</strong>. Qual prefere?', time: '13:39' },
      { type: 'client', text: 'Quero às 09:30 com a Gabriela.', time: '13:40' },
      { type: 'ia', text: 'Agendamento confirmed, Mariana! Hidratação + Escova na sexta às <strong>09:30</strong> com Gabriela. 🌸\n\n🕒 <em>Lembrete: Enviaremos um follow-up de confirmação por aqui 1 hora antes. Até sexta!</em>', time: '13:40' }
    ]
  },
  {
    id: 2,
    name: 'Lucas Oliveira',
    phone: '(21) 97777-6666',
    initials: 'L',
    avatarBg: 'bg-sky-100 border-sky-250 text-sky-700',
    status: 'NOVO',
    statusBg: 'bg-sky-100 text-sky-850 border border-sky-200/50',
    time: 'Ontem',
    subTitle: 'Club Barbearia Master',
    subscription: '⭐ CLUB MASTER ATIVO',
    balance: ['1x Barba Premium', '1x Selante'],
    services: ['Corte Navalhado', 'Barba Premium', 'Selagem Capilar', 'Massagem Facial'],
    visits: 4,
    ticket: 'R$ 80',
    chat: [
      { type: 'client', text: 'Fala! Tem como marcar a barba para hoje?', time: '17:10' },
      { type: 'ia', text: 'Grande Lucas, beleza? 💈\n\nIdentifiquei sua assinatura no <strong>Club Barbearia Master</strong> (saldo: 1x Barba Premium).\n\nSe quiser agendar via link:\n👉 <strong>venusta.link/estabelecimento1</strong>\n\nOu continue por aqui.', time: '17:10' },
      { type: 'client', text: 'Vou continuar pelo chat.', time: '17:12' },
      { type: 'ia', text: 'Fechado! Seu plano <strong>Club Master</strong> está active e garante atendimento sem custo adicional. 👊\n\nHorários livres hoje com o barbeiro <strong>Felipe</strong>:\n📅 <strong>18:00</strong> ou <strong>19:15</strong>. Qual atende melhor?', time: '17:13' },
      { type: 'client', text: 'Pode ser às 19:15 com o Felipe.', time: '17:14' },
      { type: 'ia', text: 'Tudo pronto, Lucas! Barba Premium confirmada hoje às <strong>19:15</strong> com Felipe. 💈\n\n🕒 <em>Lembrete: Mandaremos um follow-up de confirmação por aqui 1 hora antes. Até logo!</em>', time: '17:15' }
    ]
  },
  {
    id: 3,
    name: 'Beatriz Santos',
    phone: '(31) 96666-5555',
    initials: 'B',
    avatarBg: 'bg-pink-100 border-pink-250 text-pink-700',
    status: 'CONCLUÍDO',
    statusBg: 'bg-zinc-100 text-zinc-700 border border-zinc-200/50',
    time: '3 dias atrás',
    subTitle: 'Cliente Avulso',
    subscription: '❌ ASSINATURA INATIVA',
    balance: ['Nenhum plano ativo'],
    services: ['Coloração Keune', 'Mechas Criativas', 'Corte Bob', 'Manicure Gel'],
    visits: 2,
    ticket: 'R$ 140',
    chat: [
      { type: 'client', text: 'Olá, gostaria de agendar mechas para esta semana.', time: '10:00' },
      { type: 'ia', text: 'Olá, Beatriz! Seja muito bem-vinda à nossa recepção. 🌸\n\nNotei que você ainda não tem um Clube de Assinatura ativo, então faremos o agendamento avulso.\n\nSe quiser ver todos os preços e agendar pelo link:\n👉 <strong>venusta.link/estabelecimento1</strong>\n\nOu continue por aqui.', time: '10:00' },
      { type: 'client', text: 'Quero agendar por aqui mesmo.', time: '10:01' },
      { type: 'ia', text: 'Perfeito! Como é uma reserva avulsa, consultei a escala.\n\nTemos horários livres nesta quinta-feira com a especialista <strong>Luciana</strong>:\n📅 <strong>14:00</strong> ou <strong>16:00</strong>. Qual prefere?', time: '10:02' },
      { type: 'client', text: 'Pode marcar quinta às 14:00 com a Luciana.', time: '10:02' },
      { type: 'ia', text: 'Agendado, Beatriz! Mechas Criativas nesta quinta às <strong>14:00</strong> com Luciana. ✨\n\n🕒 <em>Lembrete: Enviaremos o link de pagamento do sinal e o follow-up de confirmação 1 hora antes. Até lá!</em>', time: '10:03' }
    ]
  },
  {
    id: 4,
    name: 'Thiago Silva',
    phone: '(11) 95555-4444',
    initials: 'T',
    avatarBg: 'bg-blue-100 border-blue-200 text-blue-700',
    status: 'EM AGENDAMENTO',
    statusBg: 'bg-amber-100 text-amber-800 border border-amber-200/50',
    time: '2 horas atrás',
    subTitle: 'Membro Club Black',
    subscription: '⭐ CLUB BLACK ATIVO',
    balance: ['3x Corte de Cabelo', '2x Barba', '1x Massagem'],
    services: ['Corte Executivo', 'Barba Toalha Quente', 'Massagem Relaxante', 'Camuflagem Fios Brancos'],
    visits: 18,
    ticket: 'R$ 160',
    chat: [
      { type: 'client', text: 'Opa, quero marcar corte e barba para quarta.', time: '11:15' },
      { type: 'ia', text: 'Olá, Thiago! É uma honra atendê-lo. 💎\n\nSeu plano <strong>Club Black Ativo</strong> foi localizado (saldo: 3x Cortes, 2x Barba).\n\nPara agendar direto pelo link:\n👉 <strong>venusta.link/estabelecimento1</strong>\n\nOu continue por aqui.', time: '11:15' },
      { type: 'client', text: 'Quero continuar por aqui.', time: '11:16' },
      { type: 'ia', text: 'Excelente! Como cliente <strong>Club Black</strong>, você tem prioridade total na agenda. 👑\n\nHorários livres na quarta com o barbeiro <strong>Mateus</strong>:\n📅 <strong>15:00</strong> ou <strong>17:15</strong>. Qual prefere?', time: '11:18' },
      { type: 'client', text: 'Pode marcar quarta às 15:00 com o Mateus.', time: '11:19' },
      { type: 'ia', text: 'Confirmadíssimo, Thiago! Corte + Barba na quarta às <strong>15:00</strong> com Mateus. 💈\n\n🕒 <em>Lembrete: Enviaremos o follow-up de confirmação 1 hora antes para o seu WhatsApp. Até lá!</em>', time: '11:20' }
    ]
  },
  {
    id: 5,
    name: 'Juliana Rocha',
    phone: '(81) 94444-3333',
    initials: 'J',
    avatarBg: 'bg-rose-100 border-rose-200 text-rose-700',
    status: 'NOVO',
    statusBg: 'bg-sky-100 text-sky-850 border border-sky-200/50',
    time: '4 horas atrás',
    subTitle: 'Club Nails & SPA',
    subscription: '⭐ CLUB NAILS & SPA ATIVO',
    balance: ['2x Pedicure Gel', '1x Spa de Pés'],
    services: ['Manicure Francesinha', 'Alongamento de Fibra', 'Pedicure Gel', 'Spa dos Pés'],
    visits: 6,
    ticket: 'R$ 110',
    chat: [
      { type: 'client', text: 'Olá, quero marcar pedicure e spa de pés para sábado.', time: '09:00' },
      { type: 'ia', text: 'Olá, Juliana! Que bom falar com você. 💅\n\nIdentifiquei seu plano <strong>Club Nails & SPA Ativo</strong> (saldo: 2x Pedicure Gel, 1x Spa).\n\nAgende direto pelo link personalizado:\n👉 <strong>venusta.link/estabelecimento1</strong>\n\nOu continue por aqui.', time: '09:00' },
      { type: 'client', text: 'Vou continuar por aqui.', time: '09:02' },
      { type: 'ia', text: 'Perfeito! Seu plano cobre integralmente os dois serviços. ✨\n\nTemos horários livres neste sábado com a profissional <strong>Aline</strong>:\n📅 <strong>09:00</strong> ou <strong>10:30</strong>. Qual prefere?', time: '09:03' },
      { type: 'client', text: 'Quero sábado às 10:30 com a Aline.', time: '09:04' },
      { type: 'ia', text: 'Confirmadíssimo, Juliana! Pedicure + Spa de Pés neste sábado às <strong>10:30</strong> com Aline. 🌸\n\n🕒 <em>Lembrete: Enviaremos o follow-up de confirmação por aqui 1 hora antes do seu spa. Até sábado!</em>', time: '09:05' }
    ]
  }
];

export default function RootClientPage() {
  const router = useRouter();
  const token = useStore((state) => state.token);
  const user = useStore((state) => state.user);
  const [mounted, setMounted] = useState(false);
  const mobileMenuOpen = useStore((state) => state.mobileMenuOpen);
  const setMobileMenuOpen = useStore((state) => state.setMobileMenuOpen);
  const [selectedClientIndex, setSelectedClientIndex] = useState(0);
  const activeClient = MOCK_CLIENTS[selectedClientIndex];

  // Tension Preloader state
  const [preloaderComplete, setPreloaderComplete] = useState(false);
  const [preloaderText, setPreloaderText] = useState('_');
  const [preloaderPercent, setPreloaderPercent] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const phoneWrapperRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);

  // Authenticated redirect
  useEffect(() => {
    setMounted(true);
    if (token && user) {
      if (user.role === 'SUPER_ADMIN') {
        router.push('/superadmin');
      } else if (canAccessDashboard(user)) {
        router.push('/dashboard');
      } else if (isProfessionalUser(user)) {
        router.push('/profissional');
      } else if (isClientUser(user)) {
        router.push('/feedback/client-portal');
      } else {
        router.push('/dashboard');
      }
    }
  }, [token, user, router]);

  // Preloader Intro Sequence (Typographical Tension)
  useEffect(() => {
    if (!mounted || (token && user)) return;

    let textIndex = 0;
    const phrases = [
      '_',
      'V',
      'VE',
      'VEN',
      'VENU',
      'VENUS',
      'VENUST',
      'VENUSTA',
      'VENUSTA // Desde 2026',
      'VENUSTA // CARREGANDO SISTEMA',
    ];

    // Typographic typing simulation
    const typeInterval = setInterval(() => {
      if (textIndex < phrases.length) {
        setPreloaderText(phrases[textIndex]);
        textIndex++;
      }
    }, 120);

    // Percentage counter
    const pctInterval = setInterval(() => {
      setPreloaderPercent((prev) => {
        const step = Math.floor(Math.random() * 8) + 4;
        const next = prev + step;
        if (next >= 100) {
          clearInterval(pctInterval);
          clearInterval(typeInterval);
          // Small delay before completing to resolve tension
          setTimeout(() => {
            setPreloaderComplete(true);
          }, 400);
          return 100;
        }
        return next;
      });
    }, 80);

    return () => {
      clearInterval(typeInterval);
      clearInterval(pctInterval);
    };
  }, [mounted, token, user]);

  // Initialize Lenis Smooth Scroll and GSAP Animations
  useEffect(() => {
    if (!mounted || !preloaderComplete || (token && user)) return;

    // Initialize Lenis
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      syncTouch: true, // Sync scroll on mobile touch devices
    });

    // Update ScrollTrigger on Lenis scroll
    lenis.on('scroll', ScrollTrigger.update);

    // Use GSAP ticker to drive Lenis RAF for perfect synchronization
    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Intercept anchor clicks for smooth scrolling
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor && anchor.hash && anchor.hash.startsWith('#')) {
        const targetElement = document.querySelector(anchor.hash);
        if (targetElement) {
          e.preventDefault();
          lenis.scrollTo(anchor.hash);
        }
      }
    };
    document.addEventListener('click', handleAnchorClick);

    // GSAP Animations Context
    const ctx = gsap.context(() => {
      // 2. Hero Big Text Reveal (Typographical Tension release - starting wide, scale & tighten)
      gsap.fromTo('.hero-title-reveal',
        { 
          y: 80, 
          opacity: 0,
          letterSpacing: '0.4em',
          filter: 'blur(10px)'
        },
        { 
          y: 0, 
          opacity: 1, 
          letterSpacing: '-0.03em',
          filter: 'blur(0px)',
          duration: 1.8, 
          ease: 'power4.out', 
          stagger: 0.2, 
          delay: 0.2 
        }
      );

      gsap.fromTo('.hero-text-reveal',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: 'power3.out', stagger: 0.1, delay: 1.0 }
      );

      // 2.5 Hero Decor, SVG and Badge Entrance Animations
      gsap.fromTo('.hero-sun',
        { scale: 0, opacity: 0, filter: 'blur(40px)' },
        { scale: 1, opacity: 0.8, filter: 'blur(0px)', duration: 2.2, ease: 'elastic.out(1, 0.75)', delay: 0.4 }
      );



      gsap.fromTo('.hero-badge-left',
        { x: -200, rotation: -15, opacity: 0 },
        { x: 0, rotation: 0, opacity: 1, duration: 2.2, ease: 'power4.out', delay: 1.2 }
      );
      gsap.fromTo('.hero-badge-right',
        { x: 200, rotation: 15, opacity: 0 },
        { x: 0, rotation: 0, opacity: 1, duration: 2.2, ease: 'power4.out', delay: 1.4 }
      );

      gsap.fromTo('.hero-sparkle',
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.5, ease: 'back.out(1.5)', stagger: 0.2, delay: 1.5 }
      );

      gsap.fromTo('.hero-illustration-reveal',
        { scale: 0.85, opacity: 0, y: 40, filter: 'blur(10px)' },
        { scale: 1, opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.8, ease: 'power4.out', delay: 1.1 }
      );

      // Scroll-triggered parallax reveal and movement for the illustration
      gsap.to('.hero-illustration-reveal', {
        y: -100,
        scale: 0.96,
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: 1
        }
      });

      // 3. Scroll Indicator animation and ScrollTrigger to fade out
      gsap.fromTo('.indicator-bar',
        { y: '-100%' },
        { y: '200%', duration: 1.5, repeat: -1, ease: 'power2.inOut' }
      );

      gsap.to('.scroll-indicator', {
        opacity: 0,
        y: -30,
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top top',
          end: 'bottom 80%',
          scrub: true
        }
      });

      // 4. Section reveals
      gsap.utils.toArray('.scroll-reveal').forEach((section: any) => {
        gsap.fromTo(section,
          { y: 60, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 80%',
              toggleActions: 'play none none none'
            }
          }
        );
      });

      // 5. 3D Camera Pin-Scroll WhatsApp Simulation
      const pinTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: '.pin-scroll-sec',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
          pin: '.pin-scroll-inner',
        }
      });

      // Active messages step timeline (no tilt/rotate/scale of mockup container)
      pinTimeline
        // Step 2: First bubble entry (Client request)
        .to('.chat-bubble-1', { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power3.out' }, '+=0.1')
        .to('.exp-step-1', { color: '#C5A880', duration: 0.5 }, '<')
        .to('.chat-history-container', { scrollTop: 70, duration: 1, ease: 'power2.out' }, '<')
        
        // Step 3: Second bubble entry (AI availability response)
        .to('.chat-bubble-2', { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power3.out' }, '+=0.2')
        .to('.exp-step-1', { color: '#a1a1aa', duration: 0.5 }, '<')
        .to('.exp-step-2', { color: '#C5A880', duration: 0.5 }, '<')
        .to('.chat-history-container', { scrollTop: 190, duration: 1, ease: 'power2.out' }, '<')

        // Step 4: Third bubble entry (Client confirmation)
        .to('.chat-bubble-3', { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power3.out' }, '+=0.2')
        .to('.exp-step-2', { color: '#a1a1aa', duration: 0.5 }, '<')
        .to('.exp-step-3', { color: '#C5A880', duration: 0.5 }, '<')
        .to('.chat-history-container', { scrollTop: 290, duration: 1, ease: 'power2.out' }, '<')

        // Step 5: Fourth bubble entry (Booking confirmation & takeover)
        .to('.chat-bubble-4', { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power3.out' }, '+=0.2')
        .to('.exp-step-3', { color: '#a1a1aa', duration: 0.5 }, '<')
        .to('.exp-step-4', { color: '#C5A880', duration: 0.5 }, '<')
        .to('.chat-history-container', { scrollTop: 1000, duration: 1, ease: 'power2.out' }, '<');

      // Refresh ScrollTrigger to calculate offsets correctly after DOM is fully ready
      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 100);

    }, containerRef);

    return () => {
      document.removeEventListener('click', handleAnchorClick);
      gsap.ticker.remove(tick);
      lenis.destroy();
      ctx.revert();
    };
  }, [mounted, preloaderComplete, token, user]);

  if (!mounted || (token && user)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-6 w-6 border border-davinci-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="bg-background text-davinci-black antialiased selection:bg-davinci-gold selection:text-white font-sans relative overflow-x-hidden overflow-hidden">
      
      {/* 1. TYPOGRAPHICAL TENSION INTRO PRELOADER */}
      <AnimatePresence>
        {!preloaderComplete && (
          <div className="fixed inset-0 bg-background z-[9999] flex flex-col items-center justify-center font-mono">
            <div className="space-y-4 text-center">
              {/* Blinking block code look to create anticipation */}
              <div className="text-xs text-davinci-gold tracking-[0.2em] font-semibold h-6">
                {preloaderText}
              </div>
              <div className="h-[1px] w-48 bg-zinc-200 relative overflow-hidden">
                <div 
                  className="h-full bg-davinci-gold transition-all duration-75"
                  style={{ width: `${preloaderPercent}%` }}
                />
              </div>
              <div className="text-[10px] text-zinc-500 tracking-widest uppercase">
                Carregando Experiência // {preloaderPercent}%
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
                <header className="border-b border-zinc-200 bg-background/95 backdrop-blur-md fixed top-0 left-0 w-full z-100 relative transition-colors">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-display text-xl font-bold tracking-[0.18em] text-davinci-black">
              VENUSTA
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-10 text-xs font-semibold tracking-widest text-zinc-555 uppercase">
            <a href="#features" className="hover:text-davinci-black transition-colors">Funcionalidades</a>
            <a href="#experience" className="hover:text-davinci-black transition-colors">WhatsApp Experience</a>
            <a href="#pricing" className="hover:text-davinci-black transition-colors">Preços</a>
          </nav>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/login" className="text-xs font-semibold tracking-widest uppercase text-zinc-555 hover:text-davinci-black transition-colors">
              Entrar
            </Link>
            <Link 
              href="/register" 
              className="bg-transparent border border-davinci-gold text-davinci-gold hover:bg-davinci-gold hover:text-white font-bold text-xs tracking-widest uppercase px-5 py-3 rounded-full transition-all duration-300"
            >
              Criar Conta
            </Link>
          </div>

          {/* Mobile Menu Button */}
                    <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden absolute right-4 top-4 text-davinci-black p-2 hover:text-davinci-gold transition-colors z-110"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
                                  <div className="fixed inset-0 top-20 bg-white/30 backdrop-blur-lg z-40 flex flex-col p-8 md:hidden border-t border-zinc-200">
            <nav className="flex flex-col gap-6 text-sm font-semibold tracking-widest text-zinc-555 uppercase">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-davinci-black transition-colors">Funcionalidades</a>
              <a href="#experience" onClick={() => setMobileMenuOpen(false)} className="hover:text-davinci-black transition-colors">WhatsApp Experience</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-davinci-black transition-colors">Preços</a>
              <hr className="border-zinc-200" />
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="hover:text-davinci-black transition-colors">Entrar</Link>
              <Link 
                href="/register" 
                onClick={() => setMobileMenuOpen(false)}
                className="border border-davinci-gold text-davinci-gold text-center font-bold tracking-widest uppercase py-3.5"
              >
                Criar Conta
              </Link>
            </nav>
          </div>
        )}
      </AnimatePresence>

      {/* 2. PREMIUM ORGANIC GRAPHICS HERO SECTION */}
      <section 
        className="relative min-h-screen lg:h-screen w-full flex items-center justify-center px-8 pt-32 pb-32 lg:py-0 hero-section overflow-hidden select-none"
        style={{
          background: 'radial-gradient(circle at 80% 30%, rgba(253, 230, 138, 0.25) 0%, rgba(243, 244, 246, 0.4) 40%, rgba(245, 243, 255, 0.9) 70%, rgba(250, 245, 255, 1) 100%)'
        }}
      >
        
        {/* Glowing Warm Sun / Sphere (Center-Right Gap) */}
        <div className="hero-sun absolute top-[10%] right-[38%] w-[180px] h-[180px] md:w-[260px] md:h-[260px] rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 opacity-80 blur-xs shadow-[0_0_100px_rgba(245,158,11,0.2)] animate-float-slow pointer-events-none z-0" />

        {/* Floating Clouds / Soft Organic Blobs */}
        {/* Cloud 1 (Top Left) */}
        <div className="absolute top-[10%] left-[-5%] w-[350px] h-[200px] bg-white/40 rounded-[120px] blur-2xl pointer-events-none z-0" />
        
        {/* Cloud 2 (Center Right) */}
        <div className="absolute top-[40%] right-[-10%] w-[450px] h-[250px] bg-white/50 rounded-[150px] blur-2xl pointer-events-none z-0" />

        {/* Subtle SaaS Dotted Grid Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_75%,transparent_100%)] opacity-70 pointer-events-none z-0" />

        {/* SVG Sparkles (Four-pointed Stars) */}
        <svg className="hero-sparkle absolute top-[22%] left-[15%] w-6 h-6 text-[#7C3AED]/50 animate-pulse-soft pointer-events-none z-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z" />
        </svg>
        <svg className="hero-sparkle absolute top-[45%] left-[38%] w-4 h-4 text-[#7C3AED]/40 animate-pulse-soft pointer-events-none z-0" style={{ animationDelay: '1.5s' }} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z" />
        </svg>
        <svg className="hero-sparkle absolute top-[30%] right-[18%] w-5 h-5 text-davinci-gold/60 animate-pulse-soft pointer-events-none z-0" style={{ animationDelay: '0.8s' }} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z" />
        </svg>
        <svg className="hero-sparkle absolute bottom-[25%] left-[22%] w-4 h-4 text-davinci-gold/45 animate-pulse-soft pointer-events-none z-0" style={{ animationDelay: '2.2s' }} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z" />
        </svg>

        {/* Main Content Area */}
        <div className="w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10 pt-28 pb-16 px-4 sm:px-8 lg:max-w-7xl">
          {/* Left Column: Text & Buttons */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-8">
            <div className="font-mono text-[9px] text-[#7C3AED] tracking-[0.3em] uppercase hero-text-reveal font-extrabold">
              [ VENUSTA // AGENDA & SISTEMA DE GESTÃO PREMIUM ]
            </div>
            
            <h1 className="font-display text-4xl sm:text-6xl font-black tracking-[-0.04em] leading-[0.98] max-w-2xl mb-10 text-davinci-black select-none overflow-hidden">
              <span className="block hero-title-reveal">O Sistema Inteligente</span>
              <span className="block hero-title-reveal text-davinci-gold">Para Negócios de Beleza.</span>
            </h1>
            
            <p className="text-zinc-655 text-xs sm:text-sm max-w-xl mx-auto lg:mx-0 mb-12 font-medium leading-relaxed hero-text-reveal">
              Agenda inteligente em tempo real, clube de assinaturas recorrentes com Asaas e automações de atendimento pelo WhatsApp com IA. Projetado para máxima eficiência operacional.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 hero-text-reveal">
              <Link
                href="/register?plan=unlimited"
                className="w-full sm:w-auto bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs tracking-widest uppercase px-8 py-4 rounded-full shadow-[0_10px_25px_rgba(124,58,237,0.2)] transition-all duration-300 hover:scale-105"
              >
                Criar Conta
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto border border-zinc-250 hover:border-davinci-black bg-white/80 text-davinci-black font-bold text-xs tracking-widest uppercase px-8 py-4 rounded-full transition-all duration-300 hover:scale-105"
              >
                Conhecer Recursos
              </a>
            </div>
          </div>

          {/* Right Column: High-fidelity SaaS Mockup Illustration */}
          <div className="lg:col-span-5 hidden lg:block relative hero-illustration-reveal">
            <div className="relative">
              {/* Badge 1 (WhatsApp agendamento) floating on top-left of the image */}
              <div className="hero-badge-left absolute -top-6 -left-10 bg-white/90 backdrop-blur-md border border-zinc-200/50 px-4 py-3.5 rounded-[22px] shadow-[0_12px_30px_rgba(0,0,0,0.04)] animate-float-slow z-10 text-[9px] font-bold text-zinc-755 flex items-center gap-3">
                <div className="w-6.5 h-6.5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                  ✓
                </div>
                <div className="leading-tight text-left">
                  <p className="text-davinci-black">Agendamento via WhatsApp</p>
                  <p className="text-zinc-400 font-mono text-[7.5px] mt-0.5">Confirmado por IA • Há 1 min</p>
                </div>
              </div>

              {/* Badge 2 (Club Premium) floating on bottom-right of the image */}
              <div className="hero-badge-right absolute -bottom-6 -right-10 bg-white/90 backdrop-blur-md border border-zinc-200/50 px-4 py-3.5 rounded-[22px] shadow-[0_12px_30px_rgba(0,0,0,0.04)] animate-float-medium z-10 text-[9px] font-bold text-zinc-755 flex items-center gap-3">
                <div className="w-6.5 h-6.5 rounded-full bg-[#7C3AED]/10 flex items-center justify-center text-[#7C3AED]">
                  ★
                </div>
                <div className="leading-tight text-left">
                  <p className="text-davinci-black">Club Premium Ativo</p>
                  <p className="text-zinc-400 font-mono text-[7.5px] mt-0.5">Faturamento Recorrente • Asaas</p>
                </div>
              </div>

              {/* Clean Illustration Container */}
              <div className="relative overflow-hidden group">
                <img 
                  src="/hero_illustration.png" 
                  alt="Venusta SaaS Illustration" 
                  className="w-full h-auto object-contain opacity-95 transition-transform duration-700 group-hover:scale-103" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bouncing Scroll Indicator (Fades out dynamically on scroll) */}
        <div className="scroll-indicator absolute bottom-12 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 text-zinc-400 font-mono text-[9px] tracking-widest uppercase cursor-pointer pointer-events-none select-none z-0">
          <span>Rolar para Explorar</span>
          <div className="w-[1px] h-10 bg-zinc-200 relative overflow-hidden">
            <div className="indicator-bar absolute top-0 left-0 w-full h-4 bg-[#7C3AED]" />
          </div>
        </div>

        {/* Bottom Curve Wave Divider */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-0 pointer-events-none">
          <svg className="relative block w-full h-[60px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0 C150,90 350,120 600,120 C850,120 1050,90 1200,0 L1200,120 L0,120 Z" className="fill-zinc-50"></path>
          </svg>
        </div>
      </section>



      {/* Infinite Horizontal Ticker */}
      <div className="border-b border-zinc-200 bg-zinc-50 py-6 overflow-hidden">
        <div className="flex whitespace-nowrap gap-20 text-[10px] font-mono tracking-[0.3em] text-zinc-400 uppercase animate-[marquee_25s_linear_infinite]">
          <span>• AGENDA INTELIGENTE</span>
          <span>• CLUBES DE ASSINATURA</span>
          <span>• WHATSAPP FIDELIZAÇÃO</span>
          <span>• FINANCEIRO INTEGRADO</span>
          <span>• HIGH END ARCHITECTURE</span>
          <span>• GESTÃO DE EQUIPE</span>
          <span>• AGENDA INTELIGENTE</span>
          <span>• CLUBES DE ASSINATURA</span>
          <span>• WHATSAPP FIDELIZAÇÃO</span>
          <span>• FINANCEIRO INTEGRADO</span>
        </div>
      </div>

      {/* Features Grid */}
      <section id="features" className="py-32 px-8 border-b border-zinc-200 bg-zinc-50/50">
        <div className="max-w-7xl mx-auto">
          
          <div className="mb-24 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 scroll-reveal">
            <div>
              <span className="font-mono text-[9px] text-davinci-gold tracking-[0.25em] uppercase mb-4 block">[ 02 // RECURSOS ]</span>
              <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-davinci-black max-w-xl">
                Controle total sob uma nova perspectiva.
              </h2>
            </div>
            <p className="text-zinc-650 text-xs max-w-sm leading-relaxed">
              Desenvolvemos uma estrutura livre de distrações e baseada em performance, projetada para a produtividade da sua equipe.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 features-grid">
            
            {/* Feature 1 */}
            <div className="p-8 bg-white/60 backdrop-blur-md border border-zinc-250/30 rounded-[30px] hover:border-davinci-gold/40 hover:bg-white transition-all duration-300 shadow-xs hover:shadow-md hover:scale-[1.02] feature-card">
              <span className="font-mono text-[10px] text-davinci-gold mb-8 block">01 /</span>
              <h3 className="font-display text-md font-bold mb-3 text-davinci-black tracking-wide uppercase">Agenda Fluida</h3>
              <p className="text-zinc-600 text-xs leading-relaxed">
                Visualização limpa, agendamentos rápidos de alta performance e bloqueios automáticos com comissionamento instantâneo.
              </p>
            </div>
 
            {/* Feature 2 */}
            <div className="p-8 bg-white/60 backdrop-blur-md border border-zinc-250/30 rounded-[30px] hover:border-davinci-gold/40 hover:bg-white transition-all duration-300 shadow-xs hover:shadow-md hover:scale-[1.02] feature-card">
              <span className="font-mono text-[10px] text-davinci-gold mb-8 block">02 /</span>
              <h3 className="font-display text-md font-bold mb-3 text-davinci-black tracking-wide uppercase">WhatsApp IA</h3>
              <p className="text-zinc-600 text-xs leading-relaxed">
                Agendamento autônomo natural e atendimento 24/7 no WhatsApp com IA conversacional robusta.
              </p>
            </div>
 
            {/* Feature 3 */}
            <div className="p-8 bg-white/60 backdrop-blur-md border border-zinc-250/30 rounded-[30px] hover:border-davinci-gold/40 hover:bg-white transition-all duration-300 shadow-xs hover:shadow-md hover:scale-[1.02] feature-card">
              <span className="font-mono text-[10px] text-davinci-gold mb-8 block">03 /</span>
              <h3 className="font-display text-md font-bold mb-3 text-davinci-black tracking-wide uppercase">Clube de Assinaturas</h3>
              <p className="text-zinc-600 text-xs leading-relaxed">
                Planos recorrentes com débito automático no Pix ou Cartão. Cobranças automáticas de forma 100% integrada com a Asaas.
              </p>
            </div>
 
            {/* Feature 4 */}
            <div className="p-8 bg-white/60 backdrop-blur-md border border-zinc-250/30 rounded-[30px] hover:border-davinci-gold/40 hover:bg-white transition-all duration-300 shadow-xs hover:shadow-md hover:scale-[1.02] feature-card">
              <span className="font-mono text-[10px] text-davinci-gold mb-8 block">04 /</span>
              <h3 className="font-display text-md font-bold mb-3 text-davinci-black tracking-wide uppercase">Finanças de Precisão</h3>
              <p className="text-zinc-600 text-xs leading-relaxed">
                Análise profunda de ticket médio, frequência dos clientes no salão, faturamento líquido e desempenho de cada colaborador.
              </p>
            </div>
 
            {/* Feature 5 */}
            <div className="p-8 bg-white/60 backdrop-blur-md border border-zinc-250/30 rounded-[30px] hover:border-davinci-gold/40 hover:bg-white transition-all duration-300 shadow-xs hover:shadow-md hover:scale-[1.02] feature-card">
              <span className="font-mono text-[10px] text-davinci-gold mb-8 block">05 /</span>
              <h3 className="font-display text-md font-bold mb-3 text-davinci-black tracking-wide uppercase">Catálogo Digital</h3>
              <p className="text-zinc-600 text-xs leading-relaxed">
                Apresente serviços, produtos e combos online, permitindo que seus clientes façam agendamentos e pedidos de forma integrada.
              </p>
            </div>
 
            {/* Feature 6 */}
            <div className="p-8 bg-white/60 backdrop-blur-md border border-zinc-250/30 rounded-[30px] hover:border-davinci-gold/40 hover:bg-white transition-all duration-300 shadow-xs hover:shadow-md hover:scale-[1.02] feature-card">
              <span className="font-mono text-[10px] text-davinci-gold mb-8 block">06 /</span>
              <h3 className="font-display text-md font-bold mb-3 text-davinci-black tracking-wide uppercase">Comissões Práticas</h3>
              <p className="text-zinc-600 text-xs leading-relaxed">
                Cálculo e divisão automática das comissões de profissionais por serviço prestado, com relatórios transparentes para a equipe.
              </p>
            </div>
 
            {/* Feature 7 */}
            <div className="p-8 bg-white/60 backdrop-blur-md border border-zinc-250/30 rounded-[30px] hover:border-davinci-gold/40 hover:bg-white transition-all duration-300 shadow-xs hover:shadow-md hover:scale-[1.02] feature-card">
              <span className="font-mono text-[10px] text-davinci-gold mb-8 block">07 /</span>
              <h3 className="font-display text-md font-bold mb-3 text-davinci-black tracking-wide uppercase">Ficha do Cliente (CRM)</h3>
              <p className="text-zinc-600 text-xs leading-relaxed">
                Histórico completo de atendimentos, preferências de beleza, fórmulas químicas utilizadas, tags e controle de presença.
              </p>
            </div>
 
            {/* Feature 8 */}
            <div className="p-8 bg-white/60 backdrop-blur-md border border-zinc-250/30 rounded-[30px] hover:border-davinci-gold/40 hover:bg-white transition-all duration-300 shadow-xs hover:shadow-md hover:scale-[1.02] feature-card">
              <span className="font-mono text-[10px] text-davinci-gold mb-8 block">08 /</span>
              <h3 className="font-display text-md font-bold mb-3 text-davinci-black tracking-wide uppercase">Feedback Automático</h3>
              <p className="text-zinc-600 text-xs leading-relaxed">
                Após 2 horas do atendimento, o sistema envia uma pesquisa de satisfação via WhatsApp e calcula a nota média (NPS) do negócio.
              </p>
            </div>
 
          </div>
        </div>
      </section>

      {/* 3. PIN-SCROLL 3D PHONE EXPERIENCE */}
      <section id="experience" className="pin-scroll-sec h-[300vh] relative border-b border-zinc-200 bg-zinc-50/30">
        <div className="pin-scroll-inner h-screen w-full flex items-center justify-center overflow-hidden px-8">
          
          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Column: Flow Explanations */}
            <div className="space-y-12">
              <div>
                <span className="font-mono text-[9px] text-davinci-gold tracking-[0.25em] uppercase mb-4 block">[ 03 // WHATSAPP EXPERIENCE ]</span>
                <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-davinci-black mb-6">
                  Automação Conversacional com IA.
                </h2>
                <p className="text-zinc-655 text-xs max-w-md leading-relaxed">
                  Abaixo você confere o fluxo de atendimento em tempo real. Role a página para avançar a conversa.
                </p>
              </div>

              <div className="space-y-6 font-mono text-[11px] uppercase tracking-wider text-zinc-400 transition-all">
                <div className="exp-step-1 flex items-center gap-4">
                  <span>[01]</span> <span>Mensagem Inicial do Cliente</span>
                </div>
                <div className="exp-step-2 flex items-center gap-4">
                  <span>[02]</span> <span>Sugestão de Horários via IA</span>
                </div>
                <div className="exp-step-3 flex items-center gap-4">
                  <span>[03]</span> <span>Confirmação Conversacional</span>
                </div>
                <div className="exp-step-4 flex items-center gap-4">
                  <span>[04]</span> <span>Sucesso do Agendamento (Takeover)</span>
                </div>
              </div>
            </div>

            {/* Right Column: App Chat Mockup Container */}
            <div ref={phoneWrapperRef} className="flex justify-center items-center h-[580px] z-10 w-full">
              
              {/* Desktop App Chat Mockup (Flat & Steady) */}
              <div 
                ref={phoneRef}
                className="w-full max-w-[580px] h-[520px] bg-white border border-zinc-200/80 rounded-[36px] shadow-[0_20px_50px_rgba(0,0,0,0.06)] relative flex overflow-hidden origin-center"
              >
                {/* 1. Left Sidebar: WhatsApp contact list */}
                <div className="hidden sm:flex w-[160px] border-r border-zinc-200/80 bg-white flex-col shrink-0 select-none">
                  {/* Sidebar Header */}
                  <div className="h-11 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between px-2.5 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center font-bold text-[8px] text-emerald-800 shrink-0">
                        WA
                      </div>
                      <div className="leading-none">
                        <h4 className="text-[8px] font-bold text-davinci-black">WhatsApp Ativo</h4>
                        <span className="text-[6px] text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-0.5 mt-0.5">
                          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                          CONECTADO
                        </span>
                      </div>
                    </div>
                    <button className="text-[6px] bg-white border border-zinc-200 text-zinc-700 px-1 py-0.5 rounded font-bold cursor-default shadow-xs shrink-0">
                      + Novo
                    </button>
                  </div>

                  {/* Tabs */}
                  <div className="p-1 flex gap-1 bg-zinc-50/50 border-b border-zinc-200 shrink-0 overflow-x-hidden">
                    <span className="bg-[#7C3AED] text-white text-[5px] px-1 py-0.5 rounded font-bold">TODOS</span>
                    <span className="text-zinc-500 text-[5px] px-0.5 py-0.5 font-bold">NOVOS</span>
                    <span className="text-zinc-500 text-[5px] px-0.5 py-0.5 font-bold">AGENDANDO</span>
                  </div>

                  {/* Search */}
                  <div className="p-1.5 border-b border-zinc-200 shrink-0">
                    <div className="bg-zinc-100 rounded px-1.5 py-0.5 text-[7px] text-zinc-400 flex items-center gap-1">
                      <span>🔍</span>
                      <span>Pesquisar conversa...</span>
                    </div>
                  </div>

                  {/* Contact list scrollable */}
                  <div className="flex-1 overflow-y-auto p-1.5 space-y-1 bg-white">
                    {MOCK_CLIENTS.map((client, idx) => (
                      <div 
                        key={client.id}
                        onClick={() => setSelectedClientIndex(idx)}
                        className={`p-2 flex items-center gap-2 relative cursor-pointer hover:bg-zinc-50/80 rounded-[14px] transition-all ${
                          selectedClientIndex === idx ? 'bg-zinc-100/80 text-davinci-black font-semibold' : 'text-zinc-650'
                        }`}
                      >
                        <div className={`w-6.5 h-6.5 rounded-full flex items-center justify-center font-bold text-[8px] shrink-0 ${client.avatarBg}`}>
                          {client.initials}
                        </div>
                        <div className="leading-tight min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-[8px] font-bold text-davinci-black truncate">{client.name}</h4>
                            <span className="text-[5px] text-zinc-400 font-mono shrink-0">{client.time}</span>
                          </div>
                          <span className="text-[6px] text-zinc-400 block truncate">{client.phone}</span>
                          <span className={`inline-block text-[5px] font-extrabold px-1 rounded-sm mt-0.5 ${client.statusBg}`}>
                            {client.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Middle Main Chat Area */}
                <div className="flex-1 flex flex-col bg-[#efeae2] relative overflow-hidden"
                     style={{
                       backgroundColor: '#efeae2',
                       backgroundImage: 'radial-gradient(#dfdcd6 1.5px, transparent 1.5px)',
                       backgroundSize: '16px 16px'
                     }}>
                  
                  {/* Chat Header */}
                  <div className="h-11 bg-white border-b border-zinc-200/80 flex items-center justify-between px-3 shrink-0 relative z-10 select-none">
                    <div className="flex items-center gap-2">
                      <div className={`w-6.5 h-6.5 rounded-full flex items-center justify-center font-bold text-[8px] ${activeClient.avatarBg}`}>
                        {activeClient.initials}
                      </div>
                      <div className="leading-none">
                        <h4 className="text-[8px] font-bold text-davinci-black">{activeClient.name}</h4>
                        <span className="text-[6px] text-zinc-400 mt-0.5 block font-semibold">{activeClient.subTitle}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 text-zinc-400 text-[9px] cursor-default">
                      <span>ℹ️</span>
                      <span>⋮</span>
                    </div>
                  </div>

                  {/* Message History */}
                  <div className="chat-history-container flex-1 p-3 space-y-2.5 overflow-y-auto flex flex-col justify-start pb-4 relative z-10 font-sans text-[8px] leading-relaxed">
                    
                    {/* Message 0: Client Initial (Always visible on load) */}
                    <div className="flex justify-start">
                      <div className="bg-white text-zinc-800 p-2.5 rounded-[16px] rounded-tl-none border border-zinc-200/50 shadow-xs max-w-[85%] relative">
                        <p dangerouslySetInnerHTML={{ __html: activeClient.chat[0].text }} />
                        <span className="block text-[6px] text-zinc-400 text-right mt-1 font-mono">{activeClient.chat[0].time}</span>
                      </div>
                    </div>

                    {/* Message 1: IA Greeting + Link (Always visible on load) */}
                    <div className="flex justify-end">
                      <div className="bg-[#d9fdd3] text-zinc-800 p-2.5 rounded-[16px] rounded-tr-none shadow-xs max-w-[85%] relative border border-emerald-100">
                        <p dangerouslySetInnerHTML={{ __html: activeClient.chat[1].text }} />
                        <span className="block text-[6px] text-emerald-700/80 text-right mt-1 font-mono">{activeClient.chat[1].time} <span className="text-sky-500 font-bold ml-0.5">✓✓</span></span>
                      </div>
                    </div>

                    {/* Bubble 1: Client Message (Prefers chat) */}
                    <div className="chat-bubble-1 opacity-0 translate-y-2 flex justify-start">
                      <div className="bg-white text-zinc-800 p-2 rounded-[16px] rounded-tl-none border border-zinc-200/50 shadow-xs max-w-[85%] relative">
                        <p dangerouslySetInnerHTML={{ __html: activeClient.chat[2].text }} />
                        <span className="block text-[6px] text-zinc-400 text-right mt-1 font-mono">{activeClient.chat[2].time}</span>
                      </div>
                    </div>

                    {/* Bubble 2: IA Response (Options + Active subscription check) */}
                    <div className="chat-bubble-2 opacity-0 translate-y-2 flex justify-end">
                      <div className="bg-[#d9fdd3] text-zinc-800 p-2 rounded-[16px] rounded-tr-none shadow-xs max-w-[85%] relative border border-emerald-100">
                        <p dangerouslySetInnerHTML={{ __html: activeClient.chat[3].text }} />
                        <span className="block text-[6px] text-emerald-700/80 text-right mt-1 font-mono">{activeClient.chat[3].time} <span className="text-sky-500 font-bold ml-0.5">✓✓</span></span>
                      </div>
                    </div>

                    {/* Bubble 3: Client Response (Selects option) */}
                    <div className="chat-bubble-3 opacity-0 translate-y-2 flex justify-start">
                      <div className="bg-white text-zinc-800 p-2 rounded-[16px] rounded-tl-none border border-zinc-200/50 shadow-xs max-w-[85%] relative">
                        <p dangerouslySetInnerHTML={{ __html: activeClient.chat[4].text }} />
                        <span className="block text-[6px] text-zinc-400 text-right mt-1 font-mono">{activeClient.chat[4].time}</span>
                      </div>
                    </div>

                    {/* Bubble 4: IA Confirmation (Confirmation + 1 hour follow-up) */}
                    <div className="chat-bubble-4 opacity-0 translate-y-2 flex justify-end">
                      <div className="bg-[#d9fdd3] text-zinc-800 p-2 rounded-[16px] rounded-tr-none shadow-xs max-w-[85%] relative border border-emerald-100">
                        <p dangerouslySetInnerHTML={{ __html: activeClient.chat[5].text }} />
                        <span className="block text-[6px] text-emerald-700/80 text-right mt-1 font-mono">{activeClient.chat[5].time} <span className="text-sky-500 font-bold ml-0.5">✓✓</span></span>
                      </div>
                    </div>

                  </div>

                  {/* Chat Input Footer */}
                  <div className="h-10 bg-[#f0f2f5] border-t border-zinc-200/80 flex items-center px-2.5 gap-2 shrink-0 relative z-10 select-none">
                    <span className="text-zinc-400 text-[10px] cursor-default">📎</span>
                    <div className="flex-1 bg-white border border-zinc-200 rounded-full px-2.5 py-1 text-[7px] text-zinc-400 flex items-center justify-between">
                      <span>Mensagem...</span>
                      <span>😊</span>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-[#7C3AED] flex items-center justify-center text-white text-[8px] font-bold cursor-default">
                      ➔
                    </div>
                  </div>

                </div>

                {/* 3. Right Sidebar: Ficha do Cliente */}
                <div className="hidden md:flex w-[140px] border-l border-zinc-200 bg-white flex-col shrink-0 font-sans select-none">
                  {/* Ficha Header */}
                  <div className="h-11 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between px-2.5 shrink-0">
                    <span className="text-[7px] font-bold text-davinci-black tracking-wider uppercase">Ficha do Cliente</span>
                    <span className="text-[9px] text-zinc-400 cursor-default">✕</span>
                  </div>

                  {/* Ficha Content */}
                  <div className="flex-1 p-2 flex flex-col gap-2.5 overflow-y-auto">
                    
                    {/* Customer Profile Card */}
                    <div className="text-center py-0.5 border-b border-zinc-100 pb-2">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs mx-auto mb-1 ${activeClient.avatarBg}`}>
                        {activeClient.initials}
                      </div>
                      <h4 className="text-[8px] font-bold text-davinci-black leading-tight">{activeClient.name}</h4>
                      <span className="text-[6px] text-zinc-400 font-mono block">{activeClient.phone}</span>
                      
                      {/* Subscription Info */}
                      <span className={`inline-block border text-[5px] font-extrabold px-1 py-0.5 rounded mt-1.5 ${
                        activeClient.id === 3
                          ? 'bg-red-50 text-red-600 border-red-200/60'
                          : 'bg-purple-50 text-[#7C3AED] border-purple-200/60'
                      }`}>
                        {activeClient.subscription}
                      </span>
                    </div>

                    {/* Subscription Balance */}
                    <div className={`border rounded p-1.5 space-y-1 ${
                      activeClient.id === 3
                        ? 'bg-red-50/20 border-red-100'
                        : 'bg-purple-50/40 border-purple-100'
                    }`}>
                      <span className={`block text-[5px] font-bold uppercase tracking-wide ${
                        activeClient.id === 3 ? 'text-red-800' : 'text-purple-800'
                      }`}>
                        Saldo de Assinante
                      </span>
                      <div className="text-[6px] font-semibold text-zinc-700 leading-tight space-y-0.5">
                        {activeClient.balance.map((item, i) => (
                          <p key={i}>• {item}</p>
                        ))}
                      </div>
                    </div>

                    {/* Status Select Box */}
                    <div className="space-y-0.5">
                      <label className="block text-[5.5px] font-bold text-zinc-400 uppercase tracking-wide">Status da Conversa</label>
                      <div className="bg-white border border-zinc-200 rounded px-1.5 py-0.5 text-[6.5px] font-semibold text-zinc-750 flex items-center justify-between">
                        <span>{activeClient.status}</span>
                        <span className="text-[6px] text-zinc-400">▼</span>
                      </div>
                    </div>

                    {/* IA Chatbot Toggle */}
                    <div className="space-y-0.5">
                      <label className="block text-[5.5px] font-bold text-zinc-400 uppercase tracking-wide">Chatbot de IA</label>
                      <div className="flex items-center justify-between bg-zinc-50 p-1 rounded border border-zinc-200/50">
                        <span className="text-[6.5px] font-semibold text-zinc-650 font-medium">
                          {activeClient.id === 3 ? 'Desativado' : 'Ativado (Automático)'}
                        </span>
                        <div className={`w-5 h-2.5 rounded-full p-0.5 flex items-center transition-all ${
                          activeClient.id === 3 ? 'bg-zinc-300 justify-start' : 'bg-[#7C3AED] justify-end'
                        }`}>
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-none" />
                        </div>
                      </div>
                    </div>

                    {/* Services Offered list */}
                    <div className="space-y-1">
                      <label className="block text-[5.5px] font-bold text-zinc-400 uppercase tracking-wide">Serviços Oferecidos</label>
                      <div className="text-[6px] text-zinc-550 space-y-0.5 font-medium">
                        {activeClient.services.map((service, i) => (
                          <p key={i}>• {service}</p>
                        ))}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-1 pt-1 border-t border-zinc-100">
                      <div className="bg-zinc-50 border border-zinc-150 p-1.5 rounded-lg text-center">
                        <span className="block text-[4.5px] text-zinc-400 uppercase">Visitas</span>
                        <span className="block text-[7px] font-black text-davinci-black">{activeClient.visits}</span>
                      </div>
                      <div className="bg-zinc-50 border border-zinc-150 p-1.5 rounded-lg text-center">
                        <span className="block text-[4.5px] text-zinc-400 uppercase">T. Médio</span>
                        <span className="block text-[7px] font-black text-purple-650 font-mono">{activeClient.ticket}</span>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-8 border-b border-zinc-200 bg-zinc-50/50">
        <div className="max-w-5xl mx-auto">
          
          <div className="text-center mb-24 scroll-reveal">
            <span className="font-mono text-[9px] text-davinci-gold tracking-[0.25em] uppercase mb-4 block">[ 04 // PREÇOS ]</span>
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-davinci-black mb-4">
              Investimento claro e transparente.
            </h2>
            <p className="text-zinc-655 text-xs">
              Escolha a escala de recursos de que seu estabelecimento precisa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* Plan 1 */}
            <div className="border border-zinc-200 bg-background p-8 rounded-[36px] hover:border-zinc-350 transition-colors duration-300 flex flex-col justify-between scroll-reveal">
              <div>
                <span className="font-mono text-[9px] text-davinci-gold uppercase tracking-wider block mb-2">Plano Básico</span>
                <h3 className="font-display text-2xl font-bold text-davinci-black mb-6">Essencial</h3>
                
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-bold text-davinci-black">R$ 99,90</span>
                  <span className="font-mono text-[10px] text-zinc-400">/ mês</span>
                </div>

                <hr className="border-zinc-200 mb-8" />

                <ul className="space-y-4 text-xs text-zinc-600 font-semibold mb-12">
                  <li className="flex items-center gap-3">
                    <span className="text-davinci-gold">✓</span> Até 3 Profissionais Ativos
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-davinci-gold">✓</span> 1 Atendente Administrativo
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-davinci-gold">✓</span> Até 500 Clientes Cadastrados
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-davinci-gold">✓</span> Agenda e Gestão Financeira Completa
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-davinci-gold">✓</span> Lembretes de Confirmação no WhatsApp
                  </li>
                  <li className="flex items-center gap-3 text-zinc-400 line-through">
                    <span className="text-red-500/30">✗</span> Chatbot de IA do WhatsApp
                  </li>
                  <li className="flex items-center gap-3 text-zinc-400 line-through">
                    <span className="text-red-500/30">✗</span> Clube de Assinaturas (Asaas)
                  </li>
                </ul>
              </div>

              <Link
                href="/onboarding?plan=essential"
                className="border border-zinc-300 hover:border-davinci-black text-center text-davinci-black font-bold text-xs tracking-widest uppercase py-4 rounded-full transition-all duration-300 block"
              >
                Assinar Essencial
              </Link>
            </div>

            {/* Plan 2 */}
            <div className="border border-davinci-gold bg-background p-8 rounded-[36px] shadow-[0_0_40px_rgba(124,58,237,0.06)] flex flex-col justify-between scroll-reveal relative">
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-davinci-gold text-white font-extrabold text-[9px] uppercase tracking-widest px-3 py-1 rounded-full">
                COMPLETO
              </div>
              
              <div>
                <span className="font-mono text-[9px] text-davinci-gold uppercase tracking-wider block mb-2">Plano Premium</span>
                <h3 className="font-display text-2xl font-bold text-davinci-black mb-6">Absoluto</h3>
                
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-bold text-davinci-black">R$ 159,90</span>
                  <span className="font-mono text-[10px] text-zinc-400">/ mês</span>
                </div>

                <hr className="border-zinc-200 mb-8" />

                <ul className="space-y-4 text-xs text-zinc-650 font-semibold mb-12">
                  <li className="flex items-center gap-3">
                    <span className="text-davinci-gold">✓</span> <strong>Profissionais Ilimitados</strong>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-davinci-gold">✓</span> <strong>Atendentes Ilimitados</strong>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-davinci-gold">✓</span> <strong>Clientes Ilimitados</strong>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-davinci-gold">✓</span> Agenda e Gestão Financeira Completa
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-davinci-gold">✓</span> Chatbot IA Ativo 24h
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-davinci-gold">✓</span> Clube de Assinaturas (Asaas) Ativo
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-davinci-gold">✓</span> Suporte Prioritário VIP
                  </li>
                </ul>
              </div>

              <Link
                href="/onboarding?plan=unlimited"
                className="bg-davinci-gold hover:bg-davinci-gold-hover text-center text-white font-extrabold text-xs tracking-widest uppercase py-4 rounded-full transition-all duration-300 block"
              >
                Assinar Absoluto
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-zinc-50 py-20 px-8 text-center text-zinc-400 font-mono text-[10px] tracking-wider uppercase">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-sm tracking-[0.2em] text-davinci-black">VENUSTA</span>
            <span>- Desde 2026</span>
          </div>
          <div className="flex flex-col sm:items-end gap-1">
            <span>&copy; {new Date().getFullYear()} Venusta. Todos os direitos reservados.</span>
            <span className="text-[9px] text-zinc-500 font-bold">Criado por VTRX Solutions</span>
          </div>
        </div>
      </footer>

      {/* Ticker Animation Styling */}
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
