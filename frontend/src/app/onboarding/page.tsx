'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Building, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Store Session
  const token = useStore((state) => state.token);
  const user = useStore((state) => state.user);
  const setSession = useStore((state) => state.setSession);
  const setTenant = useStore((state) => state.setTenant);

  // Wizard steps: 1: Plan, 2: Salon Details, 3: Success
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  // Form Data
  const [saasPlan, setSaasPlan] = useState<'BASIC' | 'UNLIMITED'>('BASIC');
  const [salonName, setSalonName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#C5A880');
  const [secondaryColor, setSecondaryColor] = useState('#18181b');
  const [footerPhone, setFooterPhone] = useState('');
  const [footerSlogan, setFooterSlogan] = useState('A arte do cuidado profissional.');
  const [footerAddress, setFooterAddress] = useState('Rua Principal, 100 - Centro');
  const [footerHours, setFooterHours] = useState('Segunda a Sábado, das 09:00 às 20:00');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Guard routing logic
  useEffect(() => {
    if (isMounted) {
      // If not logged in, redirect to register
      if (!token || !user) {
        router.replace('/register');
        return;
      }
      // If already has tenant, and we aren't displaying the success step, redirect to dashboard
      if (user.tenantId && step !== 3) {
        router.replace('/dashboard');
        return;
      }
    }
  }, [token, user, step, router, isMounted]);

  // Load plan from query param on mount
  useEffect(() => {
    const planParam = searchParams.get('plan');
    if (planParam === 'unlimited') {
      setSaasPlan('UNLIMITED');
    } else {
      setSaasPlan('BASIC');
    }
  }, [searchParams]);

  // Slugify salon name to subdomain
  useEffect(() => {
    if (step === 2 && subdomain === '') {
      const slug = salonName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/[^a-z0-9\s-]/g, '') // remove special characters
        .trim()
        .replace(/\s+/g, '-'); // replace spaces with hyphens
      setSubdomain(slug);
    }
  }, [salonName, step, subdomain]);

  if (!isMounted || !token || !user) {
    return null;
  }

  const handleNext = () => {
    setError('');
    setStep(step + 1);
  };

  const handlePrev = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!salonName || !subdomain) {
      setError('Por favor, preencha o nome e o subdomínio do salão.');
      setLoading(false);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const response = await fetch(`${apiUrl}/tenants/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: salonName,
          subdomain,
          primaryColor,
          secondaryColor,
          footerPhone,
          footerSlogan,
          footerAddress,
          footerHours,
          saasPlan,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao realizar configuração do estabelecimento.');
      }

      // Update the user session in Zustand store to include the tenantId
      if (user) {
        const updatedUser = { ...user, tenantId: data.id };
        setSession(token!, updatedUser);
        setTenant(data);
      }

      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Build the login URL dynamically
  const getSubdomainLoginUrl = () => {
    if (typeof window === 'undefined') return '';
    const host = window.location.hostname;
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      return `http://${subdomain}.localhost:${window.location.port || '3000'}/login`;
    }
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'appvenusta.com.br';
    return `https://${subdomain}.${baseDomain}/login`;
  };

  const getSubdomainDisplayUrl = () => {
    if (typeof window === 'undefined') return '';
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'appvenusta.com.br';
    return `${subdomain}.${baseDomain}`;
  };

  return (
    <div className="min-h-screen bg-background text-davinci-black flex flex-col justify-between selection:bg-davinci-gold selection:text-white font-sans relative">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.04),transparent_50%)] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-zinc-200 bg-background py-6 px-8 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-outfit text-2xl font-extrabold tracking-wider bg-gold-gradient bg-clip-text text-transparent">
              VENUSTA
            </span>
          </Link>
          <span className="text-xs text-zinc-400">
            Olá, {user?.nome || 'Administrador'}
          </span>
        </div>
      </header>

      {/* Main wizard */}
      <main className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-2xl bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-2xl p-8 lg:p-12">
          
          {/* Progress Indicator */}
          {step < 3 && (
            <div className="mb-10">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                <span className={step === 1 ? 'text-davinci-gold' : ''}>1. Plano</span>
                <span className={step === 2 ? 'text-davinci-gold' : ''}>2. Estabelecimento</span>
              </div>
              <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gold-gradient rounded-full"
                  animate={{ width: `${(step / 2) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* Step 1: Plan Selection */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="font-outfit text-2xl font-extrabold flex items-center gap-2 mb-2 text-davinci-black">
                    <Sparkles className="text-davinci-gold h-6 w-6" /> Selecione o seu plano
                  </h2>
                  <p className="text-sm text-zinc-500">Escolha o plano ideal para as necessidades da sua empresa.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  {/* Basic Card */}
                  <div 
                    onClick={() => setSaasPlan('BASIC')}
                    className={`p-6 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      saasPlan === 'BASIC' 
                        ? 'border-davinci-gold bg-davinci-gold/5 shadow-[0_0_15px_rgba(124,58,237,0.1)]' 
                        : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100/70 hover:border-zinc-300'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-bold text-lg text-davinci-black">Essencial</span>
                        {saasPlan === 'BASIC' && <span className="text-davinci-gold">●</span>}
                      </div>
                      <div className="text-2xl font-black text-davinci-black mb-4">R$ 69,90 <span className="text-xs text-zinc-400">/mês</span></div>
                      <ul className="text-xs text-zinc-500 space-y-2">
                        <li>• Até 3 Profissionais Ativos</li>
                        <li>• 1 Atendente Administrativo</li>
                        <li>• Até 500 Clientes Cadastrados</li>
                        <li>• WhatsApp Lembretes e Confirmações</li>
                        <li className="text-red-500/70">• Chatbot de IA desativado</li>
                      </ul>
                    </div>
                  </div>

                  {/* Unlimited Card */}
                  <div 
                    onClick={() => setSaasPlan('UNLIMITED')}
                    className={`p-6 rounded-xl border cursor-pointer transition-all flex flex-col justify-between relative ${
                      saasPlan === 'UNLIMITED' 
                        ? 'border-davinci-gold bg-davinci-gold/5 shadow-[0_0_20px_rgba(124,58,237,0.15)]' 
                        : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100/70 hover:border-zinc-300'
                    }`}
                  >
                    <div className="absolute top-0 right-4 -translate-y-1/2 bg-davinci-gold text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded">
                      Completo
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-bold text-lg text-davinci-black">Absoluto</span>
                        {saasPlan === 'UNLIMITED' && <span className="text-davinci-gold">●</span>}
                      </div>
                      <div className="text-2xl font-black text-davinci-black mb-4">R$ 99,90 <span className="text-xs text-zinc-400">/mês</span></div>
                      <ul className="text-xs text-zinc-500 space-y-2">
                        <li>• <strong>Profissionais Ilimitados</strong></li>
                        <li>• <strong>Atendentes Ilimitados</strong></li>
                        <li>• <strong>Clientes Ilimitados</strong></li>
                        <li>• Chatbot IA Ativo</li>
                        <li>• Clube de Assinaturas (Asaas)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-zinc-200">
                  <button
                    onClick={handleNext}
                    className="bg-gold-gradient text-white font-bold px-6 py-3 rounded-lg flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-transform"
                  >
                    Próximo Passo <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Salon Configuration */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="font-outfit text-2xl font-extrabold flex items-center gap-2 mb-2 text-davinci-black">
                    <Building className="text-davinci-gold h-6 w-6" /> Detalhes do Estabelecimento
                  </h2>
                  <p className="text-sm text-zinc-500">Configure o nome, endereço, subdomínio e as cores da marca.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Nome do Estabelecimento</label>
                      <input
                        type="text"
                        required
                        value={salonName}
                        onChange={(e) => setSalonName(e.target.value)}
                        placeholder="Ex: Salão DaVinci"
                        className="w-full bg-white border border-zinc-200 focus:border-davinci-gold focus:outline-none rounded-lg px-4 py-2.5 text-sm text-davinci-black placeholder-zinc-400 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Subdomínio Exclusivo</label>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          required
                          value={subdomain}
                          onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                          placeholder="salao-davinci"
                          className="w-full bg-white border border-zinc-200 focus:border-davinci-gold focus:outline-none rounded-lg pl-4 pr-32 py-2.5 text-sm text-davinci-black placeholder-zinc-400 transition-colors font-mono"
                        />
                        <span className="absolute right-3 text-xs text-zinc-400 font-semibold pointer-events-none">
                          .{process.env.NEXT_PUBLIC_BASE_DOMAIN || 'appvenusta.com.br'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Cor Primária (Gold/Destaque)</label>
                      <div className="flex items-center gap-3 bg-white border border-zinc-200 rounded-lg p-2">
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent"
                        />
                        <span className="text-xs font-mono">{primaryColor}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-550 uppercase tracking-wider mb-2">Cor Secundária (Fundo Escuro)</label>
                      <div className="flex items-center gap-3 bg-white border border-zinc-200 rounded-lg p-2">
                        <input
                          type="color"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent"
                        />
                        <span className="text-xs font-mono">{secondaryColor}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Telefone de Contato</label>
                      <input
                        type="text"
                        value={footerPhone}
                        onChange={(e) => setFooterPhone(e.target.value)}
                        placeholder="Ex: (86) 98888-7777"
                        className="w-full bg-white border border-zinc-200 focus:border-davinci-gold focus:outline-none rounded-lg px-4 py-2.5 text-sm text-davinci-black placeholder-zinc-400 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Slogan</label>
                      <input
                        type="text"
                        value={footerSlogan}
                        onChange={(e) => setFooterSlogan(e.target.value)}
                        className="w-full bg-white border border-zinc-200 focus:border-davinci-gold focus:outline-none rounded-lg px-4 py-2.5 text-sm text-davinci-black placeholder-zinc-400 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Endereço Completo</label>
                    <input
                      type="text"
                      value={footerAddress}
                      onChange={(e) => setFooterAddress(e.target.value)}
                      className="w-full bg-white border border-zinc-200 focus:border-davinci-gold focus:outline-none rounded-lg px-4 py-2.5 text-sm text-davinci-black placeholder-zinc-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Horários de Funcionamento</label>
                    <input
                      type="text"
                      value={footerHours}
                      onChange={(e) => setFooterHours(e.target.value)}
                      className="w-full bg-white border border-zinc-200 focus:border-davinci-gold focus:outline-none rounded-lg px-4 py-2.5 text-sm text-davinci-black placeholder-zinc-400 transition-colors"
                    />
                  </div>

                  {error && <div className="text-red-500 text-xs font-semibold text-center">{error}</div>}

                  <div className="flex justify-between pt-6 border-t border-zinc-200">
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="border border-zinc-200 hover:bg-zinc-50 text-zinc-550 font-bold px-5 py-3 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" /> Voltar
                    </button>
                    
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-gold-gradient text-white font-extrabold px-8 py-3 rounded-lg flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          Finalizar Configuração <CheckCircle className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Step 3: Success Screen */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 py-6"
              >
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-500 mb-2">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="font-outfit text-3xl font-black text-davinci-black uppercase">Salão Configurado!</h2>
                  <p className="text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
                    Parabéns! O seu estabelecimento foi criado com sucesso no plano <strong className="text-davinci-gold">{saasPlan === 'BASIC' ? 'Essencial' : 'Absoluto'}</strong>.
                  </p>
                </div>

                <div className="p-5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3 max-w-md mx-auto text-left">
                  <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Endereço de Acesso Exclusivo:</div>
                  <div className="text-sm font-mono font-bold text-davinci-gold bg-white p-3 rounded border border-davinci-gold/20 flex items-center justify-between">
                    <span>{getSubdomainDisplayUrl()}</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-normal">
                    💡 <strong>Nota Importante:</strong> Todas as informações fornecidas (slogan, endereço, horários, cores) foram configuradas com padrões iniciais e podem ser modificadas a qualquer momento diretamente no seu painel administrativo.
                  </p>
                </div>

                <div className="pt-4 max-w-md mx-auto">
                  <a
                    href={getSubdomainLoginUrl()}
                    className="w-full bg-gold-gradient text-white font-extrabold py-4 rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all text-center block text-sm shadow-[0_4px_25px_rgba(197,168,128,0.25)]"
                  >
                    Acessar Painel do Salão
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-zinc-50 py-8 px-6 text-xs text-zinc-400">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <span>&copy; {new Date().getFullYear()} Venusta. Todos os direitos reservados.</span>
          <span className="font-bold text-zinc-500 uppercase tracking-wider text-[9px]">Criado por VTRX Solutions</span>
        </div>
      </footer>
    </div>
  );
}
