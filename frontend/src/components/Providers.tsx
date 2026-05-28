'use client';

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';

function getTenantIdentifier() {
  if (typeof window === 'undefined') return '';
  const host = window.location.hostname;
  
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    const parts = host.split('.');
    if (parts.length > 1 && parts[0] !== 'localhost' && parts[0] !== '127') return parts[0];
    return '';
  }
  
  if (host.includes('vtecsolutions.online')) {
    const parts = host.split('.');
    if (parts.length > 2) return parts[0];
    return '';
  }
  
  return host; // Custom Domain
}

export default function Providers({ children }: { children: React.ReactNode }) {
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

      // 2. Fetch tenant branding and name
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      originalFetch(`${apiUrl}/tenants/public/${identifier}`)
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Tenant branding resolution failed');
        })
        .then((tenant) => {
          if (tenant) {
            useStore.getState().setTenant(tenant);
            
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

            // Set dynamic CSS variables on document root
            const root = document.documentElement;
            root.style.setProperty('--primary-color', primary);

            // 1. Generate primary hover (darker if primary is light, lighter if primary is dark)
            const primaryIsLight = getLuminance(primary) > 0.5;
            const primaryHover = adjustColorBrightness(primary, primaryIsLight ? -25 : 25);
            root.style.setProperty('--primary-hover-color', primaryHover);
            root.style.setProperty('--primary-light-color', primary + '18'); // ~10% opacity

            // 2. Resolve contrast/adaptive secondary (text) and background colors
            const secondaryIsLight = getLuminance(secondary) > 0.6;

            if (secondaryIsLight) {
              // Secondary color is light (e.g. white, light gray, soft gold):
              // Use it as the page background
              root.style.setProperty('--background-color', secondary);
              
              // Card background: blend 6% primary color with 94% light secondary background
              const bgLight = mixColors(primary, secondary, 0.06);
              root.style.setProperty('--background-light-color', bgLight);
              
              // Text color MUST be dark to contrast with light background
              root.style.setProperty('--secondary-color', '#18181b'); // Dark charcoal
            } else {
              // Secondary color is dark:
              // Use it as the main text color (davinci-black)
              root.style.setProperty('--secondary-color', secondary);
              
              // Page background: blend 3% primary color with 97% white for a premium brand tint
              const brandBg = mixColors(primary, '#ffffff', 0.03);
              const brandBgLight = mixColors(primary, '#ffffff', 0.07);
              root.style.setProperty('--background-color', brandBg);
              root.style.setProperty('--background-light-color', brandBgLight);
            }
            
            // Update page title
            if (tenant.name) {
              document.title = `${tenant.name} - CRM & Agendamento`;
            }
          }
        })
        .catch((err) => {
          console.log('Unable to resolve tenant metadata or in demo mode:', err.message);
        });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
