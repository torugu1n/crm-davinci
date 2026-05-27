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
            
            // Set dynamic CSS variables
            const root = document.documentElement;
            root.style.setProperty('--primary-color', tenant.primaryColor);
            root.style.setProperty('--primary-hover-color', tenant.primaryColor + 'D0'); // slight transparency for hover
            root.style.setProperty('--primary-light-color', tenant.primaryColor + '20'); // 12% opacity
            root.style.setProperty('--secondary-color', tenant.secondaryColor);
            
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
