'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, User as UserIcon, Mail, Lock, ShieldCheck, Sparkles, Calendar } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { canAccessDashboard, isProfessionalUser } from '@/lib/auth';
import BrandLogo from '@/components/BrandLogo';

function formatPhoneInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatBirthdayInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);

  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

const themeStyles = {
  split: {
    card: "w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-xl border border-zinc-200/80 z-10",
    tabHeader: "flex border-b border-zinc-200 bg-zinc-50/50",
    tabActive: "flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-davinci-gold border-b-2 border-davinci-gold bg-davinci-gold/5",
    tabInactive: "flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-davinci-gray hover:text-davinci-black hover:bg-davinci-gold/2",
    body: "p-8",
    label: "block text-[10px] font-bold text-davinci-black uppercase tracking-wider mb-2",
    input: "w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-davinci-black focus:outline-none focus:border-davinci-gold transition-colors text-xs",
    inputIcon: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-davinci-gray",
    textMuted: "text-xs text-davinci-gray leading-relaxed text-center font-semibold mb-5",
    btnSubmit: "w-full py-3 bg-gold-gradient rounded-lg text-davinci-black font-bold text-xs uppercase tracking-widest hover:scale-[1.01] active:scale-[0.99] transition-transform shadow-[0_4px_20px_rgba(197,168,128,0.25)] flex items-center justify-center gap-1.5 cursor-pointer mt-2",
    btnSubmitIcon: "text-davinci-black",
  },
  centered: {
    card: "w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-xl border border-zinc-200/80 z-10",
    tabHeader: "flex border-b border-zinc-200 bg-zinc-50/50",
    tabActive: "flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-davinci-gold border-b-2 border-davinci-gold bg-davinci-gold/5",
    tabInactive: "flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-davinci-gray hover:text-davinci-black hover:bg-davinci-gold/2",
    body: "p-8",
    label: "block text-[10px] font-bold text-davinci-black uppercase tracking-wider mb-2",
    input: "w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-davinci-black focus:outline-none focus:border-davinci-gold transition-colors text-xs",
    inputIcon: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-davinci-gray",
    textMuted: "text-xs text-davinci-gray leading-relaxed text-center font-semibold mb-5",
    btnSubmit: "w-full py-3 bg-gold-gradient rounded-lg text-davinci-black font-bold text-xs uppercase tracking-widest hover:scale-[1.01] active:scale-[0.99] transition-transform shadow-[0_4px_20px_rgba(197,168,128,0.25)] flex items-center justify-center gap-1.5 cursor-pointer mt-2",
    btnSubmitIcon: "text-davinci-black",
  },
  minimalist: {
    card: "w-full max-w-md bg-zinc-900/60 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800/85 backdrop-blur-md z-10",
    tabHeader: "flex border-b border-zinc-800/65 bg-zinc-950/40",
    tabActive: "flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-davinci-gold border-b-2 border-davinci-gold bg-white/2",
    tabInactive: "flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-zinc-500 hover:text-white hover:bg-white/1",
    body: "p-8",
    label: "block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2",
    input: "w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-davinci-gold focus:ring-1 focus:ring-davinci-gold/30 transition-all text-xs",
    inputIcon: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500",
    textMuted: "text-xs text-zinc-400 leading-relaxed text-center font-semibold mb-5",
    btnSubmit: "w-full py-3 bg-davinci-gold rounded-lg text-zinc-950 font-bold text-xs uppercase tracking-widest hover:bg-[#D5B890] transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2",
    btnSubmitIcon: "text-zinc-950",
  },
  glassmorphism: {
    card: "w-full max-w-md bg-white/10 rounded-2xl overflow-hidden shadow-[0_24px_50px_-12px_rgba(0,0,0,0.5)] border border-white/20 backdrop-blur-xl z-10",
    tabHeader: "flex border-b border-white/10 bg-white/5",
    tabActive: "flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-davinci-gold border-b-2 border-davinci-gold bg-white/10",
    tabInactive: "flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-white/60 hover:text-white hover:bg-white/5",
    body: "p-8",
    label: "block text-[10px] font-bold text-white/80 uppercase tracking-wider mb-2",
    input: "w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-davinci-gold focus:bg-white/15 focus:ring-1 focus:ring-davinci-gold/30 transition-all text-xs",
    inputIcon: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50",
    textMuted: "text-xs text-white/70 leading-relaxed text-center font-semibold mb-5",
    btnSubmit: "w-full py-3 bg-[linear-gradient(135deg,rgba(197,168,128,0.95),rgba(197,168,128,0.7))] border border-white/10 rounded-lg text-zinc-950 font-bold text-xs uppercase tracking-widest hover:scale-[1.01] active:scale-[0.99] transition-all shadow-[0_4px_20px_rgba(197,168,128,0.15)] flex items-center justify-center gap-1.5 cursor-pointer mt-2",
    btnSubmitIcon: "text-zinc-950",
  }
};

export default function LoginPage() {
  const router = useRouter();
  const setSession = useStore((state) => state.setSession);
  const setDemoMode = useStore((state) => state.setDemoMode);
  const tenant = useStore((state) => state.tenant);
  
  const loginStyle = (tenant?.loginStyle || 'split') as 'split' | 'centered' | 'minimalist' | 'glassmorphism';
  const styles = themeStyles[loginStyle] || themeStyles.split;

  const [activeTab, setActiveTab] = useState<'client' | 'staff'>('client');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states
  const [clientNome, setClientNome] = useState('');
  const [clientTelefone, setClientTelefone] = useState('');
  const [clientAniversario, setClientAniversario] = useState('');
  const [staffLogin, setStaffLogin] = useState('');
  const [staffSenha, setStaffSenha] = useState('');

  // Canvas ref for floating particles
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load/Refresh active tenant configurations on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const getTenantIdentifier = () => {
      const host = window.location.hostname;
      if (host.includes('localhost') || host.includes('127.0.0.1')) {
        const parts = host.split('.');
        if (parts.length > 1 && parts[0] !== 'localhost' && parts[0] !== '127') return parts[0];
        return 'davinci';
      }
      const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'vtecsolutions.online';
      const basePartsCount = baseDomain.split('.').length;
      if (host.includes(baseDomain)) {
        const parts = host.split('.');
        if (parts.length > basePartsCount) return parts[0];
        return 'davinci';
      }
      return host;
    };

    const identifier = getTenantIdentifier();
    if (identifier) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      fetch(`${apiUrl}/tenants/public/${identifier}`)
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Branding resolution failed');
        })
        .then((data) => {
          if (data) {
            useStore.getState().setTenant(data);
          }
        })
        .catch((err) => {
          console.log('Error refreshing tenant on login mount:', err.message);
        });
    }
  }, []);

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
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = loginStyle === 'minimalist' || loginStyle === 'glassmorphism' ? 'rgba(197, 168, 128, 0.4)' : 'rgba(197, 168, 128, 0.2)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [loginStyle]);

  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!clientNome || !clientTelefone) {
      setError('Nome e telefone são obrigatórios');
      setLoading(false);
      return;
    }

    try {
      const cleanPhone = clientTelefone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        setError('Telefone inválido');
        setLoading(false);
        return;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (tenant?.subdomain) {
        headers['x-tenant-subdomain'] = tenant.subdomain;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/auth/client`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          nome: clientNome,
          telefone: clientTelefone,
          aniversario: clientAniversario || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Erro no login de cliente');
      }

      setSession(data.access_token, data.client);
      router.push('/feedback/client-portal');
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
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (tenant?.subdomain) {
        headers['x-tenant-subdomain'] = tenant.subdomain;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/auth/login`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: staffLogin,
          senha: staffSenha,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Credenciais inválidas');
      }

      setSession(data.access_token, data.user);

      if (data.user.role === 'SUPER_ADMIN') {
        router.push('/superadmin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const renderFormCardContent = () => (
    <div className={styles.card}>
      {/* Tabs */}
      <div className={styles.tabHeader}>
        <button
          onClick={() => {
            setActiveTab('client');
            setError('');
          }}
          data-demo-title="Acesso do cliente"
          data-demo-description="Clique aqui para demonstrar o portal do cliente, com agendamento, escolha de profissional e histórico de atendimento."
          className={activeTab === 'client' ? styles.tabActive : styles.tabInactive}
        >
          Portal do Cliente
        </button>
        <button
          onClick={() => {
            setActiveTab('staff');
            setError('');
          }}
          data-demo-title="Acesso da equipe"
          data-demo-description="Clique aqui para apresentar o fluxo interno de recepção, administração e profissionais do estabelecimento."
          className={activeTab === 'staff' ? styles.tabActive : styles.tabInactive}
        >
          Acesso Staff
        </button>
      </div>

      <div className={styles.body}>
        <AnimatePresence mode="wait">
          {activeTab === 'client' ? (
            <motion.form
              key="client"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              onSubmit={handleClientLogin}
              className="space-y-5"
              data-demo-title="Formulário do portal do cliente"
              data-demo-description="Este formulário abre o portal premium do cliente e já prepara o cadastro com nome, telefone e aniversário."
            >
              <p className={styles.textMuted}>
                Acesse com seu nome e telefone para agendar serviços e acompanhar seu histórico de atendimento no <strong>{tenant?.name || 'estabelecimento'}</strong>.
              </p>

              <div className="space-y-4">
                <div>
                  <label className={styles.label}>
                    Seu Nome
                  </label>
                  <div className="relative">
                    <UserIcon className={styles.inputIcon} />
                    <input
                      type="text"
                      required
                      value={clientNome}
                      onChange={(e) => setClientNome(e.target.value)}
                      placeholder="Digite seu nome completo"
                      className={styles.input}
                    />
                  </div>
                </div>

                <div>
                  <label className={styles.label}>
                    WhatsApp / Celular
                  </label>
                  <div className="relative">
                    <Phone className={styles.inputIcon} />
                    <input
                      type="tel"
                      required
                      value={clientTelefone}
                      onChange={(e) => setClientTelefone(formatPhoneInput(e.target.value))}
                      placeholder="Ex: (86) 98888-7777"
                      className={styles.input}
                    />
                  </div>
                </div>

                <div>
                  <label className={styles.label}>
                    Data de Aniversário
                  </label>
                  <div className="relative">
                    <Calendar className={styles.inputIcon} />
                    <input
                      type="text"
                      value={clientAniversario}
                      onChange={(e) => setClientAniversario(formatBirthdayInput(e.target.value))}
                      placeholder="Ex: 15/09 (Opcional)"
                      className={styles.input}
                    />
                  </div>
                </div>
              </div>

              {error && <div className="text-red-500 text-[11px] text-center font-bold">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className={styles.btnSubmit}
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-davinci-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Entrar no Portal
                    <Sparkles className="h-4.5 w-4.5" />
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
              data-demo-title="Formulário da equipe"
              data-demo-description="Este acesso leva cada perfil para o ambiente correto: dashboard administrativo, recepção ou painel do profissional."
            >
              <p className={styles.textMuted}>
                Acesso da equipe para administradores, recepção e profissionais do <strong>{tenant?.name || 'estabelecimento'}</strong>.
              </p>

              <div className="space-y-4">
                <div>
                  <label className={styles.label}>
                    Usuário de Acesso
                  </label>
                  <div className="relative">
                    <Mail className={styles.inputIcon} />
                    <input
                      type="text"
                      required
                      value={staffLogin}
                      onChange={(e) => setStaffLogin(e.target.value)}
                      placeholder="usuario"
                      className={styles.input}
                    />
                  </div>
                </div>

                <div>
                  <label className={styles.label}>
                    Senha de Acesso
                  </label>
                  <div className="relative">
                    <Lock className={styles.inputIcon} />
                    <input
                      type="password"
                      required
                      value={staffSenha}
                      onChange={(e) => setStaffSenha(e.target.value)}
                      placeholder="Sua Senha"
                      className={styles.input}
                    />
                  </div>
                </div>
              </div>

              {error && <div className="text-red-500 text-[11px] text-center font-bold">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className={styles.btnSubmit}
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-davinci-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Entrar
                    <ShieldCheck className="h-4.5 w-4.5" />
                  </>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  // 1. SPLIT LAYOUT (Default theme)
  const renderSplitLayout = () => (
    <div className="relative min-h-screen w-full bg-background flex flex-col lg:flex-row overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle_at_center,rgba(197,168,128,0.06)_0%,transparent_70%)] pointer-events-none z-0" />

      {/* HERO SECTION (Left) */}
      <div className="relative flex-1 lg:flex-[1.2] flex flex-col justify-between p-8 lg:p-16 z-10 border-b lg:border-b-0 lg:border-r border-zinc-200/85 bg-[radial-gradient(circle_at_top_left,rgba(197,168,128,0.04),transparent_45%)]">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <BrandLogo iconSize="lg" textSize="lg" />
        </motion.div>

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
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-davinci-gold to-davinci-black">Para seu salão ou barbearia</span>
            </h1>
            <p className="text-sm lg:text-md text-davinci-gray font-semibold max-w-lg leading-relaxed">
              Centralize agendamento, catálogo e relacionamento no <strong>{tenant?.name || 'CRM DaVinci'}</strong>.
            </p>
          </motion.div>

          {/* Feature List */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-zinc-200/80"
          >
            {[
              { title: "Agenda Inteligente", desc: "Organize horários e atendimentos em tempo real.", icon: Calendar },
              { title: "Atendimento Digital", desc: "Comunicação unificada e alertas automatizados.", icon: Sparkles },
              { title: "Operação Integrada", desc: "Controle financeiro e comissões da equipe.", icon: ShieldCheck }
            ].map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={idx}
                  variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.5 }}
                  className="space-y-2 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-davinci-gold/10 border border-davinci-gold/20 flex items-center justify-center group-hover:border-davinci-gold/50 transition-colors">
                    <Icon className="h-4 w-4 text-davinci-gold" />
                  </div>
                  <h3 className="text-xs font-bold text-davinci-black uppercase tracking-wider">{feat.title}</h3>
                  <p className="text-[10px] text-davinci-gray font-semibold leading-relaxed">{feat.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.5 }} className="space-y-1 text-[9px] text-davinci-gray font-bold uppercase tracking-widest hidden lg:block">
          <div>{tenant?.footerCopyright || `© 2026 ${tenant?.name || 'Gestão de Beleza'}. Todos os direitos reservados.`}</div>
          <div className="text-davinci-gold">{tenant?.footerPoweredBy || 'Desenvolvido por VTRX Solutions'}</div>
        </motion.div>
      </div>

      {/* LOGIN CARD SECTION */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16 z-10 bg-background/90 lg:bg-transparent">
        <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="w-full">
          {renderFormCardContent()}
        </motion.div>
      </div>
    </div>
  );

  // 2. CENTERED CLASSIC LAYOUT (Fundo Claro)
  const renderCenteredLayout = () => (
    <div className="relative min-h-screen w-full bg-zinc-50/50 flex flex-col items-center justify-center p-6 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gold-gradient" />
      
      {/* Soft Ambient Radial Lights */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle_at_center,rgba(197,168,128,0.05)_0%,transparent_70%)] pointer-events-none z-0" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle_at_center,rgba(197,168,128,0.05)_0%,transparent_70%)] pointer-events-none z-0" />

      {/* Hero Headings above card */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center text-center mb-8 space-y-3 z-10"
      >
        <BrandLogo iconSize="lg" textSize="lg" subtitle={tenant?.name ? 'Estabelecimento Parceiro' : undefined} className="justify-center" />
        <h1 className="text-2xl font-black text-davinci-black uppercase tracking-wide leading-none mt-2">
          {tenant?.name || 'DaVinci CRM'}
        </h1>
        <p className="text-[10px] text-davinci-gold uppercase font-bold tracking-widest bg-davinci-gold/10 px-3 py-1 rounded-full border border-davinci-gold/25 leading-none">
          Portal de Atendimento & Agendamento
        </p>
      </motion.div>

      {/* Login Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ duration: 0.6, delay: 0.1 }}
        className="w-full flex justify-center z-10"
      >
        {renderFormCardContent()}
      </motion.div>

      {/* Footer */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.4 }}
        className="mt-8 text-center text-[9px] text-davinci-gray font-bold uppercase tracking-widest z-10 space-y-1"
      >
        <div>{tenant?.footerCopyright || `© 2026 ${tenant?.name || 'DaVinci CRM'}. Todos os direitos reservados.`}</div>
        <div className="text-davinci-gold">{tenant?.footerPoweredBy || 'Parceiro Oficial VTRX Solutions'}</div>
      </motion.div>
    </div>
  );

  // 3. MINIMALIST DARK LAYOUT (Dark Mode)
  const renderMinimalistLayout = () => (
    <div className="relative min-h-screen w-full bg-[#09090b] text-[#fafafa] flex flex-col items-center justify-center p-6 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />
      
      {/* Dark Ambient Radial Spots */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle_at_center,rgba(197,168,128,0.03)_0%,transparent_75%)] pointer-events-none z-0" />

      {/* Header section above card */}
      <motion.div 
        initial={{ opacity: 0, y: -15 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center text-center mb-8 space-y-3 z-10"
      >
        <BrandLogo iconSize="lg" textSize="lg" subtitle={tenant?.name ? 'Painel de Acesso' : undefined} className="justify-center text-white" />
        <h1 className="text-2xl font-black text-white uppercase tracking-wider mt-2">
          {tenant?.name || 'CRM DaVinci'}
        </h1>
        <div className="h-[1px] w-12 bg-davinci-gold/30 mt-1" />
      </motion.div>

      {/* Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.6, delay: 0.15 }}
        className="w-full flex justify-center z-10"
      >
        {renderFormCardContent()}
      </motion.div>

      {/* Footer */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.4 }}
        className="mt-10 text-center text-[9px] text-zinc-500 font-bold uppercase tracking-widest z-10 space-y-1"
      >
        <div>{tenant?.footerCopyright || `© 2026 ${tenant?.name || 'DaVinci CRM'}. Todos os direitos reservados.`}</div>
        <div className="text-davinci-gold/80">{tenant?.footerPoweredBy || 'Desenvolvido por VTRX Solutions'}</div>
      </motion.div>
    </div>
  );

  // 4. GLASSMORPHISM GLOW LAYOUT (Futuristic Glass)
  const renderGlassmorphismLayout = () => (
    <div className="relative min-h-screen w-full bg-[#0b0c10] text-[#fafafa] flex flex-col items-center justify-center p-6 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Large Colorful Floating Spheres in Background */}
      <motion.div
        animate={{
          x: [0, 45, -20, 0],
          y: [0, -60, 40, 0],
          scale: [1, 1.05, 0.95, 1],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/4 right-1/4 w-80 h-80 rounded-full bg-davinci-gold/15 blur-3xl pointer-events-none z-0"
      />
      <motion.div
        animate={{
          x: [0, -35, 45, 0],
          y: [0, 50, -50, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none z-0"
      />
      <motion.div
        animate={{
          x: [0, 30, -30, 0],
          y: [0, 30, -30, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-2/3 right-1/3 w-72 h-72 rounded-full bg-pink-500/8 blur-3xl pointer-events-none z-0"
      />

      {/* Header section above card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center text-center mb-8 space-y-2 z-10"
      >
        <BrandLogo iconSize="lg" textSize="lg" subtitle={tenant?.name ? 'Experiência Premium' : undefined} className="justify-center text-white" />
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-[#E4CFAD] to-zinc-400 uppercase tracking-widest mt-3 leading-none">
          {tenant?.name || 'CRM DaVinci'}
        </h1>
        <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-semibold">Exclusivo & Conectado</p>
      </motion.div>

      {/* Glassmorphic Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.8, delay: 0.2 }}
        className="w-full flex justify-center z-10"
      >
        {renderFormCardContent()}
      </motion.div>

      {/* Footer */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.5 }}
        className="mt-10 text-center text-[9px] text-zinc-400 font-bold uppercase tracking-widest z-10 space-y-1"
      >
        <div>{tenant?.footerCopyright || `© 2026 ${tenant?.name || 'CRM DaVinci'}. Todos os direitos autorais.`}</div>
        <div className="text-transparent bg-clip-text bg-gradient-to-r from-davinci-gold to-zinc-400">{tenant?.footerPoweredBy || 'Powered by VTRX Solutions'}</div>
      </motion.div>
    </div>
  );

  // SWITCH LAYOUT ON STYLE SELECTOR
  if (loginStyle === 'centered') {
    return renderCenteredLayout();
  } else if (loginStyle === 'minimalist') {
    return renderMinimalistLayout();
  } else if (loginStyle === 'glassmorphism') {
    return renderGlassmorphismLayout();
  } else {
    return renderSplitLayout(); // Default 'split'
  }
}
