'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, User as UserIcon, Mail, Lock, ShieldCheck, Sparkles, Calendar } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { canAccessDashboard, isProfessionalUser } from '@/lib/auth';
import BrandLogo from '@/components/BrandLogo';

export default function LoginPage() {
  const router = useRouter();
  const setSession = useStore((state) => state.setSession);

  const [activeTab, setActiveTab] = useState<'client' | 'staff'>('client');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states
  const [clientNome, setClientNome] = useState('');
  const [clientTelefone, setClientTelefone] = useState('');
  const [clientAniversario, setClientAniversario] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffSenha, setStaffSenha] = useState('');

  // Canvas ref for floating particles
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      alpha: number;
      fadeSpeed: number;
    }> = [];

    const createParticle = () => {
      return {
        x: Math.random() * width,
        y: height + 10,
        size: Math.random() * 2 + 1,
        speedY: -(Math.random() * 0.7 + 0.3),
        speedX: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.5 + 0.2,
        fadeSpeed: Math.random() * 0.002 + 0.001,
      };
    };

    // Pre-populate particles
    for (let i = 0; i < 40; i++) {
      const p = createParticle();
      p.y = Math.random() * height;
      particles.push(p);
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Create new particles occasionally
      if (particles.length < 60 && Math.random() < 0.1) {
        particles.push(createParticle());
      }

      particles.forEach((p, index) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.alpha -= p.fadeSpeed;

        if (p.alpha <= 0 || p.y < -10) {
          particles[index] = createParticle();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(198, 161, 91, ${p.alpha})`;
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001')}/auth/client`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: clientNome, telefone: clientTelefone, aniversario: clientAniversario }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao realizar login');

      setSession(data.access_token, data.client);
      localStorage.setItem('davinci_client_id', data.client.id);
      router.push(`/feedback/client-portal`);
    } catch (err: any) {
      setError(err.message || 'Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001')}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: staffEmail, senha: staffSenha }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Credenciais inválidas');

      setSession(data.access_token, data.user);

      if (canAccessDashboard(data.user)) {
        router.push(`/dashboard`);
      } else if (isProfessionalUser(data.user)) {
        router.push(`/profissional`);
      } else {
        router.push(`/dashboard`);
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-background flex flex-col lg:flex-row overflow-hidden">
      {/* Background Particles */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Radial ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle_at_center,rgba(197,168,128,0.06)_0%,transparent_70%)] pointer-events-none z-0" />

      {/* HERO SECTION (Left) */}
      <div className="relative flex-1 lg:flex-[1.2] flex flex-col justify-between p-8 lg:p-16 z-10 border-b lg:border-b-0 lg:border-r border-zinc-200/85 bg-[radial-gradient(circle_at_top_left,rgba(197,168,128,0.04),transparent_45%)]">
        {/* Top logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <BrandLogo iconSize="lg" textSize="lg" />
        </motion.div>

        {/* Hero content */}
        <div className="my-auto py-12 lg:py-0 space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-4"
          >
            <span className="px-3 py-1 rounded-full bg-davinci-gold/10 border border-davinci-gold/30 text-davinci-gold text-[10px] font-bold uppercase tracking-widest inline-block">
              Gestão Profissional
            </span>
            <h1 className="text-4xl lg:text-6xl font-black text-davinci-black leading-tight uppercase">
              Gestão Completa <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-davinci-gold to-davinci-black">Para Seu Negócio de Beleza</span>
            </h1>
            <p className="text-sm lg:text-md text-davinci-gray font-semibold max-w-lg leading-relaxed">
              Centralize atendimento, agenda, catálogo e relacionamento com clientes em uma plataforma pensada para salões, barbearias e clínicas de estética.
            </p>
          </motion.div>

          {/* Feature list */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.15
                }
              }
            }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-zinc-200/80"
          >
            {[
              {
                title: "Agenda Inteligente",
                desc: "Organize horários, disponibilidade e atendimentos em tempo real.",
                icon: Calendar,
              },
              {
                title: "Atendimento Digital",
                desc: "Converse com clientes, confirme horários e acompanhe solicitações.",
                icon: Sparkles,
              },
              {
                title: "Operação Integrada",
                desc: "Acompanhe equipe, performance e histórico em um só lugar.",
                icon: ShieldCheck,
              }
            ].map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={idx}
                  variants={{
                    hidden: { opacity: 0, y: 15 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  transition={{ duration: 0.5 }}
                  className="space-y-2 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-davinci-gold/10 border border-davinci-gold/20 flex items-center justify-center group-hover:border-davinci-gold/50 transition-colors">
                    <Icon className="h-4 w-4 text-davinci-gold" />
                  </div>
                  <h3 className="text-xs font-bold text-davinci-black uppercase tracking-wider">
                    {feat.title}
                  </h3>
                  <p className="text-[10px] text-davinci-gray font-semibold leading-relaxed">
                    {feat.desc}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Footer info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="space-y-1 text-[9px] text-davinci-gray font-bold uppercase tracking-widest hidden lg:block"
        >
          <div>© 2026 Beauty CRM. Todos os direitos reservados.</div>
          <div className="text-davinci-gold">Desenvolvido por VTRX Solutions</div>
        </motion.div>
      </div>

      {/* LOGIN CARD SECTION (Right) */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16 z-10 bg-background/90 lg:bg-transparent">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-xl border border-zinc-200/80"
        >
          {/* Tabs */}
          <div className="flex border-b border-zinc-200 bg-zinc-50/50">
            <button
              onClick={() => {
                setActiveTab('client');
                setError('');
              }}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'client'
                ? 'text-davinci-gold border-b-2 border-davinci-gold bg-davinci-gold/5'
                : 'text-davinci-gray hover:text-davinci-black hover:bg-davinci-gold/2'
                }`}
            >
              Portal do Cliente
            </button>
            <button
              onClick={() => {
                setActiveTab('staff');
                setError('');
              }}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'staff'
                ? 'text-davinci-gold border-b-2 border-davinci-gold bg-davinci-gold/5'
                : 'text-davinci-gray hover:text-davinci-black hover:bg-davinci-gold/2'
                }`}
            >
              Acesso Staff
            </button>
          </div>

          <div className="p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'client' ? (
                <motion.form
                  key="client"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  onSubmit={handleClientLogin}
                  className="space-y-5"
                >
                  <p className="text-xs text-davinci-gray leading-relaxed text-center font-semibold">
                    Acesse com seu nome e telefone para agendar serviços e acompanhar seu histórico de atendimento.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-davinci-black uppercase tracking-wider mb-2">
                        Seu Nome
                      </label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-davinci-gray" />
                        <input
                          type="text"
                          required
                          value={clientNome}
                          onChange={(e) => setClientNome(e.target.value)}
                          placeholder="Digite seu nome completo"
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-davinci-black focus:outline-none focus:border-davinci-gold transition-colors text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-davinci-black uppercase tracking-wider mb-2">
                        WhatsApp / Celular
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-davinci-gray" />
                        <input
                          type="tel"
                          required
                          value={clientTelefone}
                          onChange={(e) => setClientTelefone(e.target.value)}
                          placeholder="Ex: 11 98888-7777"
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-davinci-black focus:outline-none focus:border-davinci-gold transition-colors text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-davinci-black uppercase tracking-wider mb-2">
                        Data de Aniversário
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-davinci-gray" />
                        <input
                          type="text"
                          value={clientAniversario}
                          onChange={(e) => setClientAniversario(e.target.value)}
                          placeholder="Ex: 15/09 (Opcional)"
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-davinci-black focus:outline-none focus:border-davinci-gold transition-colors text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {error && <div className="text-red-500 text-[11px] text-center font-bold">{error}</div>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gold-gradient rounded-lg text-davinci-black font-bold text-xs uppercase tracking-widest hover:scale-[1.01] active:scale-[0.99] transition-transform shadow-[0_4px_20px_rgba(197,168,128,0.25)] flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                  >
                    {loading ? (
                      <div className="h-4 w-4 border-2 border-davinci-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        Entrar no Portal
                        <Sparkles className="h-4 w-4 text-davinci-black" />
                      </>
                    )}
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="staff"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  onSubmit={handleStaffLogin}
                  className="space-y-5"
                >
                  <p className="text-xs text-davinci-gray leading-relaxed text-center font-semibold">
                    Acesso da equipe para administradores, recepção e profissionais do estabelecimento.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-davinci-black uppercase tracking-wider mb-2">
                        E-mail Corporativo
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-davinci-gray" />
                        <input
                          type="email"
                          required
                          value={staffEmail}
                          onChange={(e) => setStaffEmail(e.target.value)}
                          placeholder="atendente1@salao.com"
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-davinci-black focus:outline-none focus:border-davinci-gold transition-colors text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-davinci-black uppercase tracking-wider mb-2">
                        Senha de Acesso
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-davinci-gray" />
                        <input
                          type="password"
                          required
                          value={staffSenha}
                          onChange={(e) => setStaffSenha(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-davinci-black focus:outline-none focus:border-davinci-gold transition-colors text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {error && <div className="text-red-500 text-[11px] text-center font-bold">{error}</div>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gold-gradient rounded-lg text-davinci-black font-bold text-xs uppercase tracking-widest hover:scale-[1.01] active:scale-[0.99] transition-transform shadow-[0_4px_20px_rgba(197,168,128,0.25)] flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                  >
                    {loading ? (
                      <div className="h-4 w-4 border-2 border-davinci-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        Entrar no Sistema
                        <ShieldCheck className="h-4 w-4 text-davinci-black" />
                      </>
                    )}
                  </button>

                  <div className="text-center text-[9px] text-davinci-gray font-bold uppercase tracking-wider mt-4">
                    Consulte as credenciais padrão no manual do sistema.
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
