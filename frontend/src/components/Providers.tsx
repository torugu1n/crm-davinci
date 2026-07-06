'use client';

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';

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

export default function Providers({ children }: { children: React.ReactNode }) {
  const [isSuperadminRoute, setIsSuperadminRoute] = useState(false);
  const [mainDomainUrl, setMainDomainUrl] = useState('http://venusta.localhost:3000/login');
  const [isMounted, setIsMounted] = useState(false);
  const [brandingLoading, setBrandingLoading] = useState(true);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            staleTime: 5 * 60 * 1000,
            gcTime: 30 * 60 * 1000,
          },
        },
      }),
  );

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      setIsSuperadminRoute(window.location.pathname.startsWith('/superadmin'));
      
      // Capture and store token and user credentials passed in query parameters for unified login redirect
      const searchParams = new URLSearchParams(window.location.search);
      const queryToken = searchParams.get('token');
      const queryUserStr = searchParams.get('user');
      
      if (queryToken && queryUserStr) {
        try {
          const queryUser = JSON.parse(queryUserStr);
          localStorage.setItem('venusta_token', queryToken);
          localStorage.setItem('venusta_user', queryUserStr);
          useStore.getState().setSession(queryToken, queryUser);
          
          // Clear query params from the URL bar to keep it clean
          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete('token');
          cleanUrl.searchParams.delete('user');
          window.history.replaceState({}, document.title, cleanUrl.pathname + cleanUrl.search);
        } catch (e) {
          console.error('Unified login session transfer failed:', e);
        }
      }

      const host = window.location.host;
      const protocol = window.location.protocol;
      if (host.includes('localhost') || host.includes('127.0.0.1')) {
        setMainDomainUrl(`${protocol}//venusta.localhost:3000/login`);
      } else {
        const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'appvenusta.com.br';
        setMainDomainUrl(`${protocol}//venusta.${baseDomain}/login`);
      }
    }

    const identifier = getTenantIdentifier();
    if (identifier) {
      // 1. Monkeypatch window.fetch to automatically append active tenant header
      const originalFetch = window.fetch;
      window.fetch = function (input, init) {
        init = init || {};
        const headers = init.headers || {};
        
        if (headers instanceof Headers) {
          headers.set('x-tenant-subdomain', identifier);
        } else if (Array.isArray(headers)) {
          // Check if header is already there
          if (!headers.some(h => h[0].toLowerCase() === 'x-tenant-subdomain')) {
            headers.push(['x-tenant-subdomain', identifier]);
          }
        } else {
          headers['x-tenant-subdomain'] = identifier;
        }
        
        init.headers = headers;
        return originalFetch.call(this, input, init);
      };

      // 2. Fetch tenant branding and name (only if it's not the main domain 'venusta')
      if (identifier !== 'venusta') {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
        originalFetch(`${apiUrl}/tenants/public/${identifier}`)
          .then((res) => {
            if (res.ok) return res.json();
            throw new Error('Tenant branding resolution failed');
          })
          .then((data) => {
            if (data) {
              useStore.getState().setTenant(data);
            }
          })
          .catch((err) => {
            console.log('Unable to resolve tenant metadata or in demo mode:', err.message);
          })
          .finally(() => {
            setBrandingLoading(false);
          });
      } else {
        setBrandingLoading(false);
      }
    } else {
      setBrandingLoading(false);
    }
  }, []);

  // Update dynamic CSS variables and page title whenever tenant changes
  const tenant = useStore((state) => state.tenant);

  useEffect(() => {
    if (!tenant) return;

    // Helper functions for adaptive color resolution
    const getLuminance = (hex: string) => {
      const cleanHex = hex.replace('#', '').trim();
      if (cleanHex.length !== 6) return 0.5;
      const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
      const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
      const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
      const a = [r, g, b].map((v) => {
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    };

    const adjustColorBrightness = (hex: string, percent: number) => {
      const cleanHex = hex.replace('#', '').trim();
      if (cleanHex.length !== 6) return hex;
      let R = parseInt(cleanHex.substring(0, 2), 16);
      let G = parseInt(cleanHex.substring(2, 4), 16);
      let B = parseInt(cleanHex.substring(4, 6), 16);
      R = Math.max(0, Math.min(255, R + percent));
      G = Math.max(0, Math.min(255, G + percent));
      B = Math.max(0, Math.min(255, B + percent));
      const rHex = R.toString(16).padStart(2, '0');
      const gHex = G.toString(16).padStart(2, '0');
      const bHex = B.toString(16).padStart(2, '0');
      return `#${rHex}${gHex}${bHex}`;
    };

    const mixColors = (color1: string, color2: string, weight: number) => {
      const clean1 = color1.replace('#', '').trim();
      const clean2 = color2.replace('#', '').trim();
      if (clean1.length !== 6 || clean2.length !== 6) return color1;
      const r1 = parseInt(clean1.substring(0, 2), 16);
      const g1 = parseInt(clean1.substring(2, 4), 16);
      const b1 = parseInt(clean1.substring(4, 6), 16);
      const r2 = parseInt(clean2.substring(0, 2), 16);
      const g2 = parseInt(clean2.substring(2, 4), 16);
      const b2 = parseInt(clean2.substring(4, 6), 16);
      const R = Math.round(r1 * weight + r2 * (1 - weight));
      const G = Math.round(g1 * weight + g2 * (1 - weight));
      const B = Math.round(b1 * weight + b2 * (1 - weight));
      const rHex = R.toString(16).padStart(2, '0');
      const gHex = G.toString(16).padStart(2, '0');
      const bHex = B.toString(16).padStart(2, '0');
      return `#${rHex}${gHex}${bHex}`;
    };

    const primary = tenant.primaryColor || '#C5A880';
    const secondary = tenant.secondaryColor || '#18181b';
    const background = tenant.backgroundColor || '#FAF9FF';

    // Set dynamic CSS variables on document root
    const root = document.documentElement;
    root.style.setProperty('--primary-color', primary);

    // Extract RGB components for primary color to handle Tailwind opacity utilities
    const cleanPrimary = primary.replace('#', '').trim();
    let rVal = 197, gVal = 168, bVal = 128;
    if (cleanPrimary.length === 6) {
      rVal = parseInt(cleanPrimary.substring(0, 2), 16);
      gVal = parseInt(cleanPrimary.substring(2, 4), 16);
      bVal = parseInt(cleanPrimary.substring(4, 6), 16);
    }
    root.style.setProperty('--primary-color-rgb', `${rVal}, ${gVal}, ${bVal}`);

    // 1. Generate primary hover (darker if primary is light, lighter if primary is dark)
    const primaryIsLight = getLuminance(primary) > 0.5;
    const primaryHover = adjustColorBrightness(primary, primaryIsLight ? -25 : 25);
    root.style.setProperty('--primary-hover-color', primaryHover);
    
    // Generate a lighter solid version of primary color by blending 25% primary with 75% white
    const primaryLight = mixColors(primary, '#ffffff', 0.25);
    root.style.setProperty('--primary-light-color', primaryLight);

    // Resolve primary contrast color (e.g. text color on primary background)
    const primaryContrast = getLuminance(primary) > 0.5 ? '#18181b' : '#ffffff';
    root.style.setProperty('--primary-contrast-color', primaryContrast);

    // 2. Resolve background and text colors to mathematically guarantee contrast
    const backgroundIsLight = getLuminance(background) > 0.5;

    let resolvedBg = background;
    let resolvedBgLight = '';
    let resolvedText = '';
    let resolvedTextContrast = '';

    if (backgroundIsLight) {
      // Light Mode
      resolvedBgLight = mixColors(primary, background, 0.06);
      resolvedText = getLuminance(secondary) < 0.45 ? secondary : '#1C1917';
      resolvedTextContrast = '#FFFFFF';
      root.setAttribute('data-theme', 'light');
    } else {
      // Dark Mode
      resolvedBgLight = mixColors(primary, background, 0.08);
      // Ensure resolvedBgLight is still dark enough
      if (getLuminance(resolvedBgLight) > 0.4) {
        resolvedBgLight = adjustColorBrightness(background, 15);
      }
      resolvedText = '#FAF9F6'; // off-white
      resolvedTextContrast = '#18181b';
      root.setAttribute('data-theme', 'dark');
    }

    root.style.setProperty('--background-color', resolvedBg);
    root.style.setProperty('--background-light-color', resolvedBgLight);
    root.style.setProperty('--secondary-color', resolvedText);
    root.style.setProperty('--secondary-contrast-color', resolvedTextContrast);

    // Extract RGB components for resolvedBgLight to handle translucent dark-mode layers (e.g. header overlay)
    const cleanBgLight = resolvedBgLight.replace('#', '').trim();
    let bgR = 255, bgG = 255, bgB = 255;
    if (cleanBgLight.length === 6) {
      bgR = parseInt(cleanBgLight.substring(0, 2), 16);
      bgG = parseInt(cleanBgLight.substring(2, 4), 16);
      bgB = parseInt(cleanBgLight.substring(4, 6), 16);
    }
    root.style.setProperty('--background-light-color-rgb', `${bgR}, ${bgG}, ${bgB}`);
    
    // Update page title
    if (tenant.name) {
      document.title = tenant.name === 'Venusta' ? 'Venusta - Gestão & Agendamento' : `${tenant.name} - Gestão & Agendamento`;
    }
  }, [tenant]);

  if (!isMounted) return null;

  if (brandingLoading && !isSuperadminRoute) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
        {/* Neutral background glow nodes */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-zinc-800/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-zinc-800/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col items-center gap-4 z-10 select-none">
          <div className="h-10 w-10 border-2 border-zinc-800 border-t-zinc-400 rounded-full animate-spin" />
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.25em] animate-pulse">
            Carregando Estabelecimento...
          </span>
        </div>
      </div>
    );
  }

  if (tenant && tenant.active === false && !isSuperadminRoute) {
    return (
      <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex items-center justify-center p-6 font-sans relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#C5A880]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-md w-full border border-zinc-800 rounded-2xl text-center relative z-10 shadow-2xl backdrop-blur-xl bg-zinc-950/40 p-8">
          <div className="h-16 w-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 animate-pulse">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold font-outfit text-white mb-3">Acesso Suspenso</h1>
          <p className="text-zinc-400 text-sm leading-relaxed mb-6">
            O estabelecimento <span className="text-white font-semibold">{tenant.name}</span> está temporariamente desativado pelo administrador do sistema.
          </p>
          
          <div className="p-4 bg-zinc-900/30 border border-zinc-800/80 rounded-xl mb-6 text-xs text-zinc-500 text-left space-y-1">
            <span className="block font-semibold text-zinc-400">O que fazer?</span>
            <span className="block">• Se você é um cliente, tente agendar mais tarde ou entre em contato diretamente com o estabelecimento.</span>
            <span className="block">• Se você é o proprietário, entre em contato com o suporte técnico para regularizar seu acesso.</span>
          </div>

          <a 
            href={mainDomainUrl}
            className="inline-flex w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg transition duration-200 justify-center font-medium border border-zinc-800 text-sm cursor-pointer"
          >
            Ir para Portal Principal
          </a>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
