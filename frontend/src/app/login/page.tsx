'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, User as UserIcon, Mail, Lock, ShieldCheck, Sparkles, Calendar, CheckCircle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { canAccessDashboard, isProfessionalUser, isClientUser } from '@/lib/auth';
import BrandLogo from '@/components/BrandLogo';
import { getLogoUrl } from '@/lib/logo-helper';
import { createSupabaseClient } from '@/lib/supabaseClient';

/* ─── Helpers ─────────────────────────────────────────────────────────── */
function getTenantIdentifier() {
  if (typeof window === 'undefined') return '';
  const host = window.location.hostname;
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    const parts = host.split('.');
    if (parts.length > 1 && parts[0] !== 'localhost' && parts[0] !== '127') {
      const subdomain = parts[0];
      if (['www', 'app', 'localhost'].includes(subdomain)) return 'venusta';
      return subdomain;
    }
    return 'venusta';
  }
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'appvenusta.com.br';
  const basePartsCount = baseDomain.split('.').length;
  if (host.includes(baseDomain)) {
    const parts = host.split('.');
    if (parts.length > basePartsCount) {
      const subdomain = parts[0];
      if (['www', 'app', 'localhost'].includes(subdomain)) return 'venusta';
      return subdomain;
    }
    return 'venusta';
  }
  // Custom Domain
  if (!['www', 'app', 'localhost'].includes(host)) {
    return host;
  }
  return 'venusta';
}

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

function getContrastColor(hexColor: string) {
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) return '#ffffff';
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#18181b' : '#ffffff';
}

function getRgbaColor(hexColor: string, alpha: number) {
  const hex = hexColor.replace('#', '');
  let r = 24, g = 24, b = 27; // default dark zinc
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ─── Theme definitions per loginStyle ────────────────────────────────── */
type LoginStyle = 'split' | 'centered' | 'minimalist' | 'glassmorphism' | 'bubblegum' | 'brutalist';

function getThemeStyles(style: LoginStyle) {
  const themes: Record<LoginStyle, Record<string, string>> = {
    split: {
      card: 'w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-xl border border-zinc-200/80 z-10',
      body: 'p-8 md:p-10',
      label: 'block text-[10px] font-bold text-davinci-black uppercase tracking-wider mb-2',
      input: 'w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-davinci-black focus:outline-none focus:border-davinci-gold focus:ring-1 focus:ring-davinci-gold/30 transition-colors text-xs',
      inputIcon: 'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-davinci-gray',
      textMuted: 'text-xs text-davinci-gray leading-relaxed text-center font-semibold mb-5',
      btnSubmit: 'w-full py-3.5 bg-gold-gradient rounded-full text-zinc-950 font-bold text-xs uppercase tracking-widest hover:scale-[1.01] active:scale-[0.99] transition-transform shadow-[0_4px_20px_rgba(197,168,128,0.25)] flex items-center justify-center gap-1.5 cursor-pointer mt-2',
      btnSubmitIcon: 'text-zinc-950',
    },
    centered: {
      card: 'w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-xl border border-zinc-200/80 z-10',
      body: 'p-8 md:p-10',
      label: 'block text-[10px] font-bold text-davinci-black uppercase tracking-wider mb-2',
      input: 'w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-davinci-black focus:outline-none focus:border-davinci-gold focus:ring-1 focus:ring-davinci-gold/30 transition-colors text-xs',
      inputIcon: 'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-davinci-gray',
      textMuted: 'text-xs text-davinci-gray leading-relaxed text-center font-semibold mb-5',
      btnSubmit: 'w-full py-3.5 bg-gold-gradient rounded-full text-zinc-950 font-bold text-xs uppercase tracking-widest hover:scale-[1.01] active:scale-[0.99] transition-transform shadow-[0_4px_20px_rgba(197,168,128,0.25)] flex items-center justify-center gap-1.5 cursor-pointer mt-2',
      btnSubmitIcon: 'text-zinc-950',
    },
    minimalist: {
      card: 'w-full max-w-md bg-zinc-900/85 rounded-[30px] overflow-hidden shadow-[0_24px_50px_-12px_rgba(0,0,0,0.6)] border border-zinc-800/85 backdrop-blur-xl z-10',
      body: 'p-8 md:p-10',
      label: 'block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2',
      input: 'w-full pl-10 pr-4 py-2.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-davinci-gold focus:ring-1 focus:ring-davinci-gold/30 transition-all text-xs',
      inputIcon: 'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500',
      textMuted: 'text-xs text-zinc-400 leading-relaxed text-center font-semibold mb-5',
      btnSubmit: 'w-full py-3.5 bg-gold-gradient rounded-full text-zinc-950 font-bold text-xs uppercase tracking-widest hover:scale-[1.01] active:scale-[0.99] transition-transform shadow-[0_4px_20px_rgba(197,168,128,0.25)] flex items-center justify-center gap-1.5 cursor-pointer mt-2',
      btnSubmitIcon: 'text-zinc-950',
    },
    glassmorphism: {
      card: 'w-full max-w-md bg-white/10 rounded-2xl overflow-hidden shadow-[0_24px_50px_-12px_rgba(0,0,0,0.5)] border border-white/20 backdrop-blur-xl z-10',
      body: 'p-8 md:p-10',
      label: 'block text-[10px] font-bold text-white/80 uppercase tracking-wider mb-2',
      input: 'w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-davinci-gold focus:bg-white/15 focus:ring-1 focus:ring-davinci-gold/30 transition-all text-xs',
      inputIcon: 'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50',
      textMuted: 'text-xs text-white/70 leading-relaxed text-center font-semibold mb-5',
      btnSubmit: 'w-full py-3.5 bg-[linear-gradient(135deg,rgba(197,168,128,0.95),rgba(197,168,128,0.7))] border border-white/10 rounded-xl text-zinc-950 font-bold text-xs uppercase tracking-widest hover:scale-[1.01] active:scale-[0.99] transition-all shadow-[0_4px_20px_rgba(197,168,128,0.15)] flex items-center justify-center gap-1.5 cursor-pointer mt-2',
      btnSubmitIcon: 'text-zinc-950',
    },
    bubblegum: {
      card: 'w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border-2 border-pink-200/60 z-10',
      body: 'p-8 md:p-10',
      label: 'block text-[10px] font-bold text-violet-600 uppercase tracking-wider mb-2',
      input: 'w-full pl-10 pr-4 py-2.5 bg-pink-50 border border-pink-200 rounded-2xl text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-300/40 transition-all text-xs',
      inputIcon: 'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-pink-400',
      textMuted: 'text-xs text-violet-500 leading-relaxed text-center font-semibold mb-5',
      btnSubmit: 'w-full py-3.5 bg-gradient-to-r from-pink-400 via-violet-400 to-purple-500 rounded-full text-white font-bold text-xs uppercase tracking-widest hover:scale-[1.01] active:scale-[0.99] transition-all shadow-[0_4px_20px_rgba(168,85,247,0.3)] flex items-center justify-center gap-1.5 cursor-pointer mt-2',
      btnSubmitIcon: 'text-white',
    },
    brutalist: {
      card: 'w-full max-w-md bg-white rounded-none overflow-hidden border-2 border-black z-10 shadow-[6px_6px_0px_#000]',
      body: 'p-8 md:p-10',
      label: 'block text-[10px] font-black text-black uppercase tracking-wider mb-2',
      input: 'w-full pl-10 pr-4 py-2.5 bg-white border-2 border-black rounded-none text-black placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-black transition-all text-xs font-mono',
      inputIcon: 'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black',
      textMuted: 'text-xs text-zinc-600 leading-relaxed text-center font-bold mb-5 font-mono',
      btnSubmit: 'w-full py-3.5 bg-black rounded-none text-white font-black text-xs uppercase tracking-widest hover:bg-zinc-800 active:translate-y-[2px] transition-all shadow-[4px_4px_0px_rgba(0,0,0,0.4)] flex items-center justify-center gap-1.5 cursor-pointer mt-2',
      btnSubmitIcon: 'text-white',
    },
  };
  return themes[style] || themes.split;
}

/* ─── Main Component ───────────────────────────────────────────────────── */
export default function LoginPage() {
  const router = useRouter();
  const setSession = useStore((state) => state.setSession);
  const setDemoMode = useStore((state) => state.setDemoMode);
  const tenant = useStore((state) => state.tenant);
  const token = useStore((state) => state.token);
  const user = useStore((state) => state.user);
  const [isMounted, setIsMounted] = useState(false);

  const identifier = typeof window !== 'undefined' ? getTenantIdentifier() : '';
  const isMainDomain = !identifier || identifier === 'venusta' || (tenant && tenant.subdomain === 'venusta');
  const loginStyle: LoginStyle = isMainDomain ? 'split' : ((tenant?.loginStyle as LoginStyle) || 'split');
  const styles = getThemeStyles(loginStyle);

  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'client' | 'staff'>(isMainDomain ? 'staff' : 'client');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [clientNome, setClientNome] = useState('');
  const [clientTelefone, setClientTelefone] = useState('');
  const [clientAniversario, setClientAniversario] = useState('');
  const [clientStep, setClientStep] = useState<'input' | 'otp'>('input');
  const [otpCode, setOtpCode] = useState('');
  const [simulatedOtpCode, setSimulatedOtpCode] = useState('');
  const [staffLogin, setStaffLogin] = useState('');
  const [staffSenha, setStaffSenha] = useState('');
  // serviceId enviado pelo catálogo via querystring
  const [pendingServiceId, setPendingServiceId] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-redirect authenticated users
  useEffect(() => {
    if (token && user) {
      if (user.role === 'SUPER_ADMIN') router.push('/superadmin');
      else if (isClientUser(user)) {
        // Preserva serviceId se o cliente veio do catálogo
        const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const sid = params?.get('serviceId') || '';
        router.push(sid ? `/feedback/client-portal?serviceId=${sid}` : '/feedback/client-portal');
      }
      else if (isProfessionalUser(user) && !canAccessDashboard(user)) router.push('/profissional');
      else if (!user.tenantId) {
        const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const plan = params?.get('plan') || '';
        router.push(plan ? `/onboarding?plan=${plan}` : '/onboarding');
      }
      else router.push('/dashboard');
    }
  }, [token, user, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('registered') === 'true') {
        setSuccessMessage('Sua conta foi criada com sucesso! Faça login para continuar.');
      }
      // Captura serviceId enviado pelo catálogo
      const sid = params.get('serviceId');
      if (sid) setPendingServiceId(sid);
    }
  }, []);

  // Refresh tenant on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const identifier = getTenantIdentifier();
    if (identifier) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      fetch(`${apiUrl}/tenants/public/${identifier}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => { if (data) useStore.getState().setTenant(data); })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (isMainDomain) setActiveTab('staff');
    else setActiveTab('client');
  }, [tenant, isMainDomain]);

  // Particle canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    const onResize = () => { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);
    const particles: Array<{ x: number; y: number; size: number; speedY: number; speedX: number; alpha: number; fadeSpeed: number }> = [];
    const mkParticle = () => ({ x: Math.random() * width, y: height + 10, size: Math.random() * 2 + 1, speedY: -(Math.random() * 0.7 + 0.3), speedX: (Math.random() - 0.5) * 0.4, alpha: Math.random() * 0.5 + 0.2, fadeSpeed: Math.random() * 0.002 + 0.001 });
    for (let i = 0; i < 40; i++) { const p = mkParticle(); p.y = Math.random() * height; particles.push(p); }
    const particleColor = isMainDomain ? 'rgba(124, 58, 237, 0.15)' : loginStyle === 'minimalist' || loginStyle === 'glassmorphism' ? 'rgba(197, 168, 128, 0.4)' : loginStyle === 'bubblegum' ? 'rgba(236, 72, 153, 0.2)' : loginStyle === 'brutalist' ? 'rgba(0,0,0,0.08)' : 'rgba(197, 168, 128, 0.2)';
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      if (particles.length < 60 && Math.random() < 0.1) particles.push(mkParticle());
      particles.forEach((p, i) => {
        p.y += p.speedY; p.x += p.speedX; p.alpha -= p.fadeSpeed;
        if (p.alpha <= 0 || p.y < -10) { particles[i] = mkParticle(); return; }
        ctx.save(); ctx.globalAlpha = p.alpha; ctx.fillStyle = particleColor;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      });
      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(animId); };
  }, [loginStyle, isMainDomain]);

  // Check mounting and authentication to prevent flash of login layout
  if (!isMounted || (token && user)) {
    return null;
  }

  /* ── Handlers ─────────────────────────────────────────────────────── */
  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    if (!clientNome || !clientTelefone) { setError('Nome e telefone são obrigatórios'); setLoading(false); return; }
    try {
      const cleanPhone = clientTelefone.replace(/\D/g, '');
      if (cleanPhone.length < 10) { setError('Telefone inválido'); setLoading(false); return; }
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (tenant?.subdomain) headers['x-tenant-subdomain'] = tenant.subdomain;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/auth/request-otp`, {
        method: 'POST', headers,
        body: JSON.stringify({ nome: clientNome, telefone: clientTelefone, aniversario: clientAniversario || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao enviar código');
      setSimulatedOtpCode(data.simulatedCode || '');
      setClientStep('otp');
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    if (!otpCode || otpCode.length !== 6) { setError('O código deve conter 6 dígitos'); setLoading(false); return; }
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (tenant?.subdomain) headers['x-tenant-subdomain'] = tenant.subdomain;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/auth/verify-otp`, {
        method: 'POST', headers, body: JSON.stringify({ telefone: clientTelefone, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Código incorreto ou expirado');
      setSession(data.access_token, data.client);
      // Preserva o contexto do serviço selecionado no catálogo
      const redirectUrl = pendingServiceId
        ? `/feedback/client-portal?serviceId=${pendingServiceId}`
        : '/feedback/client-portal';
      router.push(redirectUrl);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const supabase = createSupabaseClient();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const resolveRes = await fetch(`${apiUrl}/auth/resolve-identifier?identifier=${encodeURIComponent(staffLogin)}`);
      const resolveData = await resolveRes.json();
      const email = resolveData.email || staffLogin.trim().toLowerCase();
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: staffSenha,
      });

      if (authError) {
        throw new Error(authError.message || 'Credenciais inválidas');
      }

      if (!authData.session) {
        throw new Error('Sessão não pôde ser estabelecida.');
      }

      // Fetch user details from public.users table in Supabase
      const { data: publicUser, error: publicUserError } = await supabase
        .from('users')
        .select(`
          id,
          nome,
          email,
          role,
          roles,
          is_active,
          tenant_id,
          tenant:tenant (
            subdomain
          ),
          barbers (
            id
          )
        `)
        .eq('id', authData.user.id)
        .single();

      if (publicUserError || !publicUser) {
        throw new Error('Dados de perfil do usuário não encontrados no banco.');
      }

      const formattedUser = {
        id: publicUser.id,
        nome: publicUser.nome,
        email: publicUser.email,
        role: publicUser.role,
        roles: publicUser.roles || [],
        isActive: publicUser.is_active,
        barberId: publicUser.barbers?.[0]?.id || null,
        tenantId: publicUser.tenant_id,
        subdomain: (publicUser.tenant as any)?.subdomain || null,
      };

      const userSubdomain = formattedUser.subdomain;
      const currentSubdomain = getTenantIdentifier();
      if (userSubdomain && userSubdomain !== currentSubdomain && userSubdomain !== 'venusta' && userSubdomain !== 'davinci') {
        const protocol = window.location.protocol;
        const host = window.location.host;
        let targetHost = host;
        if (host.includes('localhost') || host.includes('127.0.0.1')) {
          const hostParts = host.split(':');
          const port = hostParts[1] ? `:${hostParts[1]}` : '';
          targetHost = `${userSubdomain}.localhost${port}`;
        } else {
          const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'appvenusta.com.br';
          targetHost = `${userSubdomain}.${baseDomain}`;
        }
        window.location.href = `${protocol}//${targetHost}/login?token=${authData.session.access_token}&user=${encodeURIComponent(JSON.stringify(formattedUser))}`;
        return;
      }

      setSession(authData.session.access_token, formattedUser);
      if (formattedUser.role === 'SUPER_ADMIN') router.push('/superadmin');
      else router.push('/dashboard');
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  /* ── Form Card ─────────────────────────────────────────────────────── */
  const renderFormCard = () => (
    <div className={styles.card}>
      <div className={styles.body}>
        {successMessage && (
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 text-purple-700 rounded-2xl flex items-start gap-3 text-xs font-semibold shadow-sm">
            <CheckCircle className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-purple-800">Cadastro Realizado!</p>
              <p className="text-purple-600/90 leading-relaxed font-medium">Sua conta foi criada. Faça login para continuar.</p>
            </div>
          </div>
        )}
        <AnimatePresence mode="wait">
          {activeTab === 'client' ? (
            <AnimatePresence mode="wait">
              {clientStep === 'input' ? (
                <motion.form key="client-input" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} onSubmit={handleClientLogin} className="space-y-5">
                  <div className="space-y-4">
                    <div>
                      <label className={styles.label}>Seu Nome</label>
                      <div className="relative"><UserIcon className={styles.inputIcon} /><input type="text" required value={clientNome} onChange={(e) => setClientNome(e.target.value)} placeholder="Digite seu nome completo" className={styles.input} /></div>
                    </div>
                    <div>
                      <label className={styles.label}>WhatsApp / Celular</label>
                      <div className="relative"><Phone className={styles.inputIcon} /><input type="tel" required value={clientTelefone} onChange={(e) => setClientTelefone(formatPhoneInput(e.target.value))} placeholder="Ex: (86) 98888-7777" className={styles.input} /></div>
                    </div>
                    <div>
                      <label className={styles.label}>Data de Aniversário</label>
                      <div className="relative"><Calendar className={styles.inputIcon} /><input type="text" value={clientAniversario} onChange={(e) => setClientAniversario(formatBirthdayInput(e.target.value))} placeholder="Ex: 15/09 (Opcional)" className={styles.input} /></div>
                    </div>
                  </div>
                  {error && <div className="text-red-500 text-[11px] text-center font-bold">{error}</div>}
                  <button type="submit" disabled={loading} className={styles.btnSubmit}>
                    {loading ? <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <span>Enviar Código de Acesso</span>}
                  </button>
                </motion.form>
              ) : (
                <motion.form key="client-otp" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} onSubmit={handleVerifyOtp} className="space-y-5">
                  <p className={styles.textMuted}>Insira o código de 6 dígitos enviado para <strong>{clientTelefone}</strong>.</p>
                  {simulatedOtpCode && (
                    <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-700 rounded-xl text-center font-bold">
                      <span className="text-[9px] uppercase tracking-wider text-purple-600 block">Código (Simulação)</span>
                      <p className="text-lg tracking-widest font-black">{simulatedOtpCode}</p>
                    </div>
                  )}
                  <div>
                    <label className={styles.label}>Código de Acesso (6 dígitos)</label>
                    <div className="relative"><ShieldCheck className={styles.inputIcon} /><input type="text" required maxLength={6} value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} placeholder="Ex: 123456" className={`${styles.input} tracking-[0.5em] text-center font-extrabold text-sm`} /></div>
                  </div>
                  {error && <div className="text-red-500 text-[11px] text-center font-bold">{error}</div>}
                  <button type="submit" disabled={loading} className={styles.btnSubmit}>
                    {loading ? <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <span>Verificar Código</span>}
                  </button>
                  <button type="button" onClick={() => { setClientStep('input'); setOtpCode(''); setSimulatedOtpCode(''); setError(''); }} className="w-full text-center text-[10px] text-zinc-500 hover:text-davinci-gold font-bold uppercase tracking-wider mt-1 bg-transparent border-0 cursor-pointer transition-colors">
                    Alterar telefone / nome
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          ) : (
            <motion.form key="staff" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} onSubmit={handleStaffLogin} className="space-y-5">
              <div className="space-y-4">
                <div>
                  <label className={styles.label}>Usuário de Acesso</label>
                  <div className="relative"><Mail className={styles.inputIcon} /><input type="text" required value={staffLogin} onChange={(e) => setStaffLogin(e.target.value)} placeholder="usuario" className={styles.input} /></div>
                </div>
                <div>
                  <label className={styles.label}>Senha de Acesso</label>
                  <div className="relative"><Lock className={styles.inputIcon} /><input type="password" required value={staffSenha} onChange={(e) => setStaffSenha(e.target.value)} placeholder="senha" className={styles.input} /></div>
                </div>
              </div>
              {error && <div className="text-red-500 text-[11px] text-center font-bold">{error}</div>}
              <button type="submit" disabled={loading} className={styles.btnSubmit}>
                {loading ? <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <span>Entrar</span>}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  /* ── Shared Tab bar ─────────────────────────────────────────────────── */
  const renderTabs = (lightMode: boolean) => {
    if (isMainDomain) return null;
    return (
      <div className={`flex rounded-full p-1 mb-6 ${lightMode ? 'bg-zinc-100 border border-zinc-200' : 'bg-zinc-900/60 border border-zinc-800'}`}>
        {(['client', 'staff'] as const).map((tab) => (
          <button key={tab} onClick={() => { setActiveTab(tab); setError(''); }}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer ${
              activeTab === tab ? (lightMode ? 'bg-white text-davinci-black shadow' : 'bg-zinc-800 text-davinci-gold shadow') : (lightMode ? 'text-zinc-500 hover:text-zinc-700' : 'text-zinc-500 hover:text-zinc-300')
            }`}>
            {tab === 'client' ? 'Portal do Cliente' : 'Acesso Staff'}
          </button>
        ))}
      </div>
    );
  };

  /* ── Tenant brand helpers ─────────────────────────────────────────── */
  const primaryColor = tenant?.primaryColor || '#C5A880';
  const secondaryColor = tenant?.secondaryColor || '#18181b';
  const tenantName = tenant?.name || 'Estabelecimento';
  const tenantLogo = tenant?.logoUrl ? getLogoUrl(tenant.logoUrl) : null;

  const TenantBrand = ({ textColor = 'inherit' }: { textColor?: string }) => (
    <div className="flex flex-col items-center gap-2">
      {tenantLogo ? <img src={tenantLogo} alt={tenantName} className="h-12 w-auto object-contain" /> : (
        <div className="h-12 w-12 rounded-xl flex items-center justify-center text-xl font-black shadow-lg" style={{ backgroundColor: primaryColor, color: secondaryColor }}>
          {tenantName.charAt(0).toUpperCase()}
        </div>
      )}
      <span className="font-extrabold text-sm uppercase tracking-wider" style={{ color: textColor }}>{tenantName}</span>
    </div>
  );

  /* ─────────────────────────────────────────────────────────────────────
     MAIN SaaS DOMAIN — white/purple split (platform branding)
  ──────────────────────────────────────────────────────────────────────*/
  if (isMainDomain) {
    return (
      <div className="min-h-screen w-full relative flex flex-col md:flex-row overflow-hidden bg-[#FAF9FF]">
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />
        {/* Left Column */}
        <div className="hidden md:flex md:w-[46%] lg:w-[50%] relative flex-col justify-between p-12 lg:p-16 text-zinc-800 overflow-hidden border-r border-zinc-200/80 bg-gradient-to-br from-[#F5F3FF] via-[#FAF9FF] to-[#EDE9FE] z-10 md:h-screen md:max-h-screen">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,rgba(124,58,237,0.05)_0%,transparent_60%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_75%,transparent_100%)] opacity-50 pointer-events-none z-0" />
          <Link href="/" className="cursor-pointer transition-opacity hover:opacity-90 z-10 relative mb-8 block w-fit">
            <span className="font-outfit text-2xl font-extrabold tracking-wider bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent font-display">
              VENUSTA
            </span>
          </Link>
          <div className="my-auto space-y-8 relative z-10 flex flex-col justify-center">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="flex flex-col items-start space-y-4">
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-zinc-900">Gestão Inteligente &amp; Automação para Negócios de Beleza.</h1>
              <p className="text-zinc-600 text-xs max-w-md leading-relaxed font-semibold">Agenda inteligente em tempo real, clube de assinaturas recorrentes com Asaas e automações de atendimento pelo WhatsApp com IA.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }} className="relative w-full overflow-hidden flex items-center justify-center rounded-[24px]">
              <img src="/login_hero.png" alt="Venusta Platform" className="w-full max-h-[46vh] object-contain transition-transform duration-700 hover:scale-[1.02] select-none pointer-events-none" />
            </motion.div>
          </div>
          <div className="text-[9px] text-zinc-400 font-bold tracking-widest uppercase border-t border-zinc-200/60 pt-4 z-10 relative">Plataforma Venusta • 2026</div>
        </div>
        {/* Right Column */}
        <div className="flex-1 flex flex-col justify-between p-8 md:p-12 lg:p-16 min-h-screen bg-[#FAF9FF] relative z-10 md:h-screen md:max-h-screen overflow-hidden">
          <div className="flex md:hidden items-center justify-between w-full border-b border-zinc-200/60 pb-4">
            <Link href="/" className="cursor-pointer transition-opacity hover:opacity-90">
              <span className="font-outfit text-xl font-extrabold tracking-wider bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                VENUSTA
              </span>
            </Link>
            <span className="text-[8px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border text-purple-600 bg-purple-500/10 border-purple-500/20">Staff</span>
          </div>
          <div className="my-auto w-full flex flex-col items-center justify-center">
            <div className="text-center mb-8 space-y-2">
              <h2 className="text-2xl font-black text-davinci-black tracking-tight">Acesse sua conta</h2>
              <p className="text-zinc-500 text-xs max-w-xs mx-auto font-medium">Entre com suas credenciais de equipe para acessar o painel administrativo.</p>
            </div>
            <div className="w-full flex justify-center">{renderFormCard()}</div>
          </div>
          <div className="text-[10px] text-zinc-400 flex flex-col sm:flex-row items-center justify-between border-t border-zinc-200/60 pt-4 gap-2">
            <span>© {new Date().getFullYear()} Venusta. Todos os direitos reservados.</span>
            <span className="font-bold text-zinc-500 uppercase tracking-wider">Criado por VTRX Solutions</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-10 select-none relative overflow-hidden bg-zinc-50" style={{ backgroundColor: getRgbaColor(secondaryColor, 0.05) }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .tenant-input:focus {
          border-color: ${primaryColor} !important;
          box-shadow: 0 0 0 1px ${getRgbaColor(primaryColor, 0.3)} !important;
        }
      `}} />

      {/* Background soft blur shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] rounded-full blur-3xl opacity-30 pointer-events-none" style={{ background: `radial-gradient(circle, ${primaryColor} 0%, transparent 70%)` }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: `radial-gradient(circle, ${primaryColor} 0%, transparent 70%)` }} />

      {/* Main Premium Card */}
      <div className="w-full max-w-4xl bg-white rounded-[32px] overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.08)] border border-zinc-200/50 flex flex-col md:flex-row min-h-[580px] z-10 relative">
        
        {/* Left Visual Panel (Hidden on Mobile) */}
        <div className="hidden md:flex md:w-[48%] relative flex-col justify-between p-12 overflow-hidden shrink-0" style={{ backgroundColor: secondaryColor, color: getContrastColor(secondaryColor) }}>
          {/* Overlapping Diagonal Capsules (Print 2 style) */}
          <div className="absolute inset-0 overflow-hidden opacity-15 pointer-events-none">
            <div className="absolute top-[15%] left-[-10px] w-[90px] h-[300px] rounded-full rotate-[45deg]" style={{ background: `linear-gradient(180deg, ${primaryColor}, transparent)` }} />
            <div className="absolute top-[-5%] left-[110px] w-[110px] h-[400px] rounded-full rotate-[45deg]" style={{ background: `linear-gradient(180deg, ${primaryColor}, transparent)` }} />
            <div className="absolute top-[35%] left-[-30px] w-[80px] h-[250px] rounded-full rotate-[45deg]" style={{ background: `linear-gradient(180deg, ${primaryColor}, transparent)` }} />
          </div>

          {/* Glowing brand circle (Print 3 style) */}
          <div className="absolute top-[25%] right-[-40px] w-[180px] h-[180px] rounded-full blur-2xl opacity-40 pointer-events-none" style={{ background: `radial-gradient(circle, ${primaryColor} 0%, transparent 70%)` }} />

          {/* Top Brand Name */}
          <div className="z-10 flex items-center gap-2">
            {tenantLogo ? (
              <img src={tenantLogo} alt={tenantName} className="h-9 w-auto object-contain" />
            ) : (
              <div className="h-9 w-9 rounded-lg flex items-center justify-center text-sm font-black shadow-md" style={{ backgroundColor: primaryColor, color: getContrastColor(primaryColor) }}>
                {tenantName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-outfit font-black text-xs uppercase tracking-widest" style={{ color: primaryColor }}>{tenantName}</span>
          </div>

          {/* Middle Typography */}
          <div className="my-auto space-y-4 z-10">
            <span className="text-[9px] font-bold uppercase tracking-[0.3em]" style={{ color: primaryColor }}>Portal Exclusivo</span>
            <h1 className="text-3xl lg:text-4xl font-outfit font-extrabold uppercase leading-none tracking-tight">
              Viva sua<br />
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${getContrastColor(secondaryColor)})` }}>melhor</span><br />
              versão.
            </h1>
            <p className="text-[10px] font-medium opacity-70 leading-relaxed max-w-[240px]">
              Agende seus atendimentos de beleza e bem-estar com seus profissionais favoritos de forma simples e rápida.
            </p>
          </div>

          {/* Bottom Credit */}
          <div className="text-[8px] font-bold uppercase tracking-widest opacity-40 z-10">
            Powered by Venusta
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="flex-1 p-8 sm:p-12 lg:p-16 flex flex-col justify-between bg-white relative">
          {/* Mobile Header (Hidden on md+) */}
          <div className="flex md:hidden items-center justify-between border-b border-zinc-150 pb-4 mb-4 select-none">
            <div className="flex items-center gap-2">
              {tenantLogo ? (
                <img src={tenantLogo} alt={tenantName} className="h-8 w-auto object-contain" />
              ) : (
                <div className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-black" style={{ backgroundColor: primaryColor, color: getContrastColor(primaryColor) }}>
                  {tenantName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-outfit font-black text-xs uppercase tracking-widest text-zinc-800">{tenantName}</span>
            </div>
            <span className="text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 text-zinc-500 border border-zinc-200">
              Cliente
            </span>
          </div>

          {/* Middle Content */}
          <div className="my-auto w-full max-w-sm mx-auto space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-outfit font-extrabold tracking-tight text-zinc-900">Entrar no Portal</h2>
              <p className="text-zinc-500 text-xs font-medium">Informe seu nome e telefone para receber seu código de acesso por WhatsApp.</p>
            </div>

            {/* Success message banner */}
            {successMessage && (
              <div className="p-3 bg-purple-50 border border-purple-100 text-purple-700 rounded-xl flex items-start gap-2.5 text-[11px] font-semibold leading-relaxed">
                <CheckCircle className="h-4.5 w-4.5 text-purple-600 shrink-0" />
                <div>
                  <p className="font-bold">Cadastro Realizado!</p>
                  <p className="text-purple-600/90 font-medium">Faça login com seu telefone para continuar.</p>
                </div>
              </div>
            )}

            {/* OTP Verification form or Login form */}
            <AnimatePresence mode="wait">
              {clientStep === 'input' ? (
                <motion.form key="client-input" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} onSubmit={handleClientLogin} className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Seu Nome</label>
                      <div className="relative">
                        <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <input
                          type="text"
                          required
                          value={clientNome}
                          onChange={(e) => setClientNome(e.target.value)}
                          placeholder="Ex: Ana Maria"
                          className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none tenant-input transition-all font-medium"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">WhatsApp / Celular</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <input
                          type="tel"
                          required
                          value={clientTelefone}
                          onChange={(e) => setClientTelefone(formatPhoneInput(e.target.value))}
                          placeholder="Ex: (86) 99999-8888"
                          className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none tenant-input transition-all font-mono font-medium"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Aniversário (Dia/Mês)</label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <input
                          type="text"
                          value={clientAniversario}
                          onChange={(e) => setClientAniversario(formatBirthdayInput(e.target.value))}
                          placeholder="Ex: 19/05 (Opcional)"
                          className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none tenant-input transition-all font-mono font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {error && <div className="text-rose-500 text-[10px] text-center font-bold">{error}</div>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-4"
                    style={{ backgroundColor: primaryColor, color: getContrastColor(primaryColor), boxShadow: `0 10px 25px ${getRgbaColor(primaryColor, 0.2)}` }}
                  >
                    {loading ? (
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>Solicitar Código</span>
                    )}
                  </button>
                </motion.form>
              ) : (
                <motion.form key="client-otp" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} onSubmit={handleVerifyOtp} className="space-y-4">
                  <p className="text-zinc-500 text-xs text-center leading-relaxed">
                    Insira o código de 6 dígitos que enviamos para o número <strong>{clientTelefone}</strong>.
                  </p>
                  
                  {simulatedOtpCode && (
                    <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-700 rounded-xl text-center font-bold">
                      <span className="text-[9px] uppercase tracking-wider text-purple-600 block">Código (Simulação)</span>
                      <p className="text-lg tracking-widest font-black">{simulatedOtpCode}</p>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider text-center">Código de Acesso</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="Ex: 123456"
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-center font-mono font-black text-sm tracking-[0.5em] focus:outline-none tenant-input transition-all text-zinc-800"
                      />
                    </div>
                  </div>

                  {error && <div className="text-rose-500 text-[10px] text-center font-bold">{error}</div>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-4"
                    style={{ backgroundColor: primaryColor, color: getContrastColor(primaryColor), boxShadow: `0 10px 25px ${getRgbaColor(primaryColor, 0.2)}` }}
                  >
                    {loading ? (
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>Verificar Código</span>
                    )}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setClientStep('input'); setOtpCode(''); setSimulatedOtpCode(''); setError(''); }} 
                    className="w-full text-center text-[10px] text-zinc-400 hover:text-zinc-600 font-bold uppercase tracking-wider mt-2 bg-transparent border-0 cursor-pointer transition-colors"
                  >
                    Alterar telefone / nome
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Footer Credit */}
          <div className="text-[9px] text-zinc-400 flex flex-col sm:flex-row items-center justify-between border-t border-zinc-100 pt-4 gap-2 text-center sm:text-left mt-8 select-none">
            <span>© {new Date().getFullYear()} {tenantName}</span>
            <span className="font-bold text-zinc-500 uppercase tracking-wider">Criado por VTRX Solutions</span>
          </div>
        </div>

      </div>
    </div>
  );
}