'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Sparkles, User, Mail, Lock, Phone, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { createSupabaseClient } from '@/lib/supabaseClient';

function formatPhoneInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useStore((state) => state.setSession);
  const token = useStore((state) => state.token);
  const user = useStore((state) => state.user);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form Fields
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [simulatedCode, setSimulatedCode] = useState('');

  // DDI Selector Fields
  const [ddi, setDdi] = useState('+55');
  const [flag, setFlag] = useState('🇧🇷');

  const ddiOptions = [
    { code: '+55', flag: '🇧🇷', label: 'Brasil' },
    { code: '+1', flag: '🇺🇸', label: 'EUA' },
    { code: '+351', flag: '🇵🇹', label: 'Portugal' },
    { code: '+34', flag: '🇪🇸', label: 'Espanha' },
    { code: '+54', flag: '🇦🇷', label: 'Argentina' },
    { code: '+598', flag: '🇺🇾', label: 'Uruguai' },
    { code: '+595', flag: '🇵🇾', label: 'Paraguai' },
    { code: '+56', flag: '🇨🇱', label: 'Chile' },
  ];

  // Verification Code
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);

  // Redirect if already logged in and has tenant
  useEffect(() => {
    if (token && user) {
      if (user.role === 'SUPER_ADMIN') {
        router.replace('/superadmin');
      } else if (user.tenantId) {
        router.replace('/dashboard');
      } else {
        router.replace('/onboarding');
      }
    }
  }, [token, user, router]);

  const handleEmailChange = (val: string) => {
    setEmail(val);
    setCodeSent(false);
    setEmailVerified(false);
    setVerificationCode('');
    setError('');
  };

  const sendCode = async () => {
    if (!nome || !email || !senha || !telefone) {
      setError('Por favor, preencha todos os campos do formulário.');
      return;
    }
    if (senha.length < 6) {
      setError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }
    setError('');
    setVerificationLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/auth/send-verification-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Erro ao enviar código de verificação');
      }
      setCodeSent(true);
      if (data.simulated && data.code) {
        setSimulatedCode(data.code);
        setSuccess('Modo Simulado: utilize o código exibido abaixo para validar.');
      } else {
        setSimulatedCode('');
        setSuccess('Código de verificação enviado para o seu e-mail!');
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar com o servidor.');
    } finally {
      setVerificationLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationCode) {
      setError('Por favor, insira o código de verificação.');
      return;
    }
    setError('');
    setVerificationLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/auth/verify-verification-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Código de verificação incorreto ou expirado');
      }
      setEmailVerified(true);
      setSuccess('E-mail verificado com sucesso!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Código inválido.');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!emailVerified) {
      setError('Você precisa verificar seu e-mail com o código antes de registrar.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseClient();
      
      // 1. Sign up the user in Supabase Auth first
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: {
            nome,
            telefone: `${ddi}${telefone.replace(/\D/g, '')}`,
          }
        }
      });

      if (signUpError) {
        throw new Error(signUpError.message || 'Erro ao realizar o cadastro no serviço de autenticação.');
      }

      const supabaseUserId = signUpData.user?.id;
      if (!supabaseUserId) {
        throw new Error('Erro ao obter identificador único do usuário de autenticação.');
      }

      // 2. Call the NestJS backend register endpoint to link the matching UUID in database
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: supabaseUserId, // Link the matching UUID
          nome,
          email,
          telefone: `${ddi}${telefone.replace(/\D/g, '')}`,
          senha,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Erro ao realizar o registro no banco de dados principal.');
      }

      // Redirect to login screen after successful registration, propagating the plan if present
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const plan = params?.get('plan') || '';
      router.push(plan ? `/login?registered=true&plan=${plan}` : '/login?registered=true');
    } catch (err: any) {
      setError(err.message || 'Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9FF] text-zinc-800 flex flex-col md:flex-row font-sans relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Left Column: Premium Welcome/Features */}
      <div className="hidden md:flex md:w-[46%] lg:w-[50%] p-12 lg:p-16 flex-col justify-center relative z-10 border-r border-zinc-200/80 bg-gradient-to-br from-[#F5F3FF] via-[#FAF9FF] to-[#EDE9FE] md:h-screen md:max-h-screen">
        <div className="space-y-6 flex-1 flex flex-col justify-center">
          <Link href="/" className="flex items-center gap-2 group mb-4">
            <span className="font-outfit text-2xl font-extrabold tracking-wider bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              VENUSTA
            </span>
          </Link>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/20 bg-purple-500/5 text-xs text-purple-600 font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" /> Comece Grátis por 7 dias
            </div>
            
            <h1 className="text-3xl lg:text-4xl font-extrabold font-outfit uppercase tracking-tight leading-none text-zinc-900 max-w-lg">
              CRIE SUA CONTA E VEJA A MÁGICA ACONTECER
            </h1>
            
            <p className="text-xs text-zinc-655 leading-relaxed max-w-md font-semibold font-sans">
              Organize seus horários, automatize confirmações por WhatsApp, reduza faltas e gerencie suas comissões de forma premium.
            </p>
          </div>

          {/* Account Creation Image & Floating Badges */}
          <div className="relative w-full max-w-md mx-auto mt-10 py-4 select-none">
            
            {/* Badge 1: Email Verification */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                y: [0, -6, 0]
              }}
              transition={{
                y: {
                  repeat: Infinity,
                  duration: 5,
                  ease: "easeInOut"
                },
                default: { duration: 0.6 }
              }}
              className="absolute -top-3 left-[-10px] bg-white/95 backdrop-blur-md border border-zinc-200/50 px-4 py-3 rounded-[22px] shadow-[0_12px_30px_rgba(0,0,0,0.06)] z-20 text-[9px] font-bold text-zinc-700 flex items-center gap-3"
            >
              <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                <CheckCircle className="h-4 w-4" />
              </div>
              <div className="leading-tight text-left">
                <p className="text-zinc-900">E-mail verificado</p>
                <p className="text-zinc-400 font-mono text-[7.5px] mt-0.5">Resend OTP 6 dígitos</p>
              </div>
            </motion.div>

            {/* Badge 2: No Card Needed */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                y: [0, 6, 0]
              }}
              transition={{
                y: {
                  repeat: Infinity,
                  duration: 6,
                  ease: "easeInOut",
                  delay: 0.5
                },
                default: { duration: 0.6, delay: 0.2 }
              }}
              className="absolute top-[40%] right-[-15px] bg-white/95 backdrop-blur-md border border-zinc-200/50 px-4 py-3 rounded-[22px] shadow-[0_12px_30px_rgba(0,0,0,0.06)] z-20 text-[9px] font-bold text-zinc-700 flex items-center gap-3"
            >
              <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                <CheckCircle className="h-4 w-4" />
              </div>
              <div className="leading-tight text-left">
                <p className="text-zinc-900">Sem cartão de crédito</p>
                <p className="text-zinc-400 font-mono text-[7.5px] mt-0.5">Teste grátis por 7 dias</p>
              </div>
            </motion.div>

            {/* Badge 3: 2-minute Setup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                y: [0, -5, 0]
              }}
              transition={{
                y: {
                  repeat: Infinity,
                  duration: 5.5,
                  ease: "easeInOut",
                  delay: 1.0
                },
                default: { duration: 0.6, delay: 0.4 }
              }}
              className="absolute -bottom-3 left-[15px] bg-white/95 backdrop-blur-md border border-zinc-200/50 px-4 py-3 rounded-[22px] shadow-[0_12px_30px_rgba(0,0,0,0.06)] z-20 text-[9px] font-bold text-zinc-700 flex items-center gap-3"
            >
              <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                <CheckCircle className="h-4 w-4" />
              </div>
              <div className="leading-tight text-left">
                <p className="text-zinc-900">Setup em 2 minutos</p>
                <p className="text-zinc-400 font-mono text-[7.5px] mt-0.5">Domínio & cores customizados</p>
              </div>
            </motion.div>

            {/* Illustration Container */}
            <div className="relative overflow-hidden rounded-[24px] border border-zinc-200/40 shadow-lg bg-white/40 p-1">
              <img 
                src="/register_hero.png" 
                alt="Venusta Platform Register Illustration" 
                className="w-full max-h-[36vh] object-contain transition-transform duration-700 hover:scale-[1.02] pointer-events-none rounded-[20px]" 
              />
            </div>

          </div>
        </div>
      </div>

      {/* Right Column: Registration Card Form */}
      <div className="flex-1 flex flex-col justify-between p-8 md:p-12 lg:p-16 relative z-10 md:h-screen md:max-h-screen overflow-y-auto">
        
        {/* Mobile Header (Hidden on md+) */}
        <div className="flex md:hidden items-center justify-between w-full border-b border-zinc-200/60 pb-4 mb-6">
          <span className="font-outfit text-xl font-extrabold tracking-wider bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            VENUSTA
          </span>
          <span className="text-[8px] text-purple-600 uppercase font-bold tracking-widest bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
            Registro
          </span>
        </div>

        {/* Center Form Container */}
        <div className="my-auto w-full flex flex-col items-center justify-center">
          <div className="text-center mb-6 space-y-2">
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Criar Minha Conta</h2>
            <p className="text-zinc-655 text-xs max-w-xs mx-auto font-medium">Preencha seus dados para iniciar o teste gratuito do sistema.</p>
          </div>

          <div className="w-full max-w-md bg-white border border-zinc-200/80 rounded-[30px] overflow-hidden shadow-xl p-8 lg:p-10 z-10">
            <form onSubmit={handleRegister} className="space-y-4">
              
              {/* Owner Name */}
              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Carlos Eduardo"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-450 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600/30 transition text-xs"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">E-mail Comercial</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="seuemail@comercial.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-455 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600/30 transition text-xs font-mono"
                  />
                </div>
              </div>

              {/* WhatsApp */}
              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">WhatsApp / Celular</label>
                <div className="relative flex items-center">
                  <Phone className="absolute left-3 h-4 w-4 text-zinc-400 pointer-events-none" />
                  
                  {/* Styled DDI selector wrapper */}
                  <div className="absolute left-9 flex items-center gap-1 cursor-pointer hover:bg-zinc-100/50 py-1 px-1.5 rounded transition">
                    <span className="text-sm select-none">{flag}</span>
                    <span className="text-[11px] font-bold text-zinc-650 font-mono">{ddi}</span>
                    <select
                      value={ddi}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDdi(val);
                        const selected = ddiOptions.find(o => o.code === val);
                        if (selected) setFlag(selected.flag);
                      }}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    >
                      {ddiOptions.map((opt) => (
                        <option key={opt.code} value={opt.code}>
                          {opt.flag} {opt.label} ({opt.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <span className="absolute left-[84px] h-4 w-[1px] bg-zinc-200 pointer-events-none" />
                  
                  <input
                    type="tel"
                    required
                    value={telefone}
                    onChange={(e) => setTelefone(formatPhoneInput(e.target.value))}
                    placeholder="(86) 99999-8888"
                    className="w-full pl-[96px] pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600/30 transition text-xs font-mono"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Senha de Acesso</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="password"
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-450 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600/30 transition text-xs"
                  />
                </div>
              </div>

              {/* Verification Code Box */}
              {codeSent && !emailVerified && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-purple-500/5 border border-purple-500/20 text-purple-700 rounded-xl space-y-3 mt-4"
                >
                  {simulatedCode && (
                    <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-700 rounded-xl space-y-1 text-center font-bold">
                      <span className="text-[9px] uppercase tracking-wider text-purple-650 block font-outfit">Código Enviado (Simulação)</span>
                      <p className="text-lg tracking-widest font-black font-mono">{simulatedCode}</p>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-purple-650 uppercase tracking-wider">Código de Verificação (6 dígitos)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        className="flex-1 bg-white border border-zinc-250 focus:border-purple-600 focus:ring-1 focus:ring-purple-600/30 focus:outline-none rounded-lg px-3 py-2 text-xs text-zinc-900 text-center font-mono tracking-widest"
                      />
                      <button
                        type="button"
                        onClick={verifyCode}
                        disabled={verificationLoading}
                        className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold px-4 py-2 rounded-lg text-xs transition disabled:opacity-50"
                      >
                        {verificationLoading ? 'Verificando...' : 'Confirmar'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Error or Success Messages */}
              {error && <div className="text-rose-500 text-xs font-semibold text-center">{error}</div>}
              {success && <div className="text-emerald-600 text-xs font-semibold text-center">{success}</div>}

              {/* Button Actions */}
              <div className="pt-2 space-y-4">
                {!emailVerified ? (
                  <button
                    type="button"
                    onClick={sendCode}
                    disabled={verificationLoading}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full text-white font-bold text-xs uppercase tracking-widest hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {verificationLoading ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : codeSent ? (
                      'Reenviar Código de Verificação'
                    ) : (
                      'Validar E-mail para Registrar'
                    )}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full text-white font-bold text-xs uppercase tracking-widest hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {loading ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        Criar Minha Conta Grátis <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )}

                <p className="text-center text-xs text-zinc-500 font-semibold">
                  Já possui uma conta?{' '}
                  <Link href="/login" className="text-purple-600 hover:underline font-bold">
                    Faça login
                  </Link>
                </p>
              </div>

            </form>
          </div>
        </div>

        {/* Bottom footer credit */}
        <div className="text-[10px] text-zinc-405 flex flex-col sm:flex-row items-center justify-between border-t border-zinc-200/60 pt-4 mt-6 gap-2 text-center sm:text-left">
          <span>&copy; {new Date().getFullYear()} Venusta. Todos os direitos reservados.</span>
          <span className="flex items-center gap-1 font-bold text-zinc-500 uppercase tracking-wider">
            Criado por VTRX Solutions
          </span>
        </div>

      </div>
    </div>
  );
}
