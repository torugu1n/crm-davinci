'use client';
import { useStore } from '@/store/useStore';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RootClientPage from './RootClientPage';
import { canAccessDashboard, isProfessionalUser, isClientUser } from '@/lib/auth';

function getTenantIdentifier() {
  if (typeof window === 'undefined') return null;
  const host = window.location.hostname;
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'appvenusta.com.br';

  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    const parts = host.split('.');
    if (parts.length > 1 && parts[0] !== 'localhost' && parts[0] !== '127') {
      const subdomain = parts[0];
      if (['www', 'app', 'localhost'].includes(subdomain)) return null;
      return subdomain;
    }
    return null; // main domain
  }

  if (host.includes(baseDomain)) {
    const basePartsCount = baseDomain.split('.').length;
    const parts = host.split('.');
    if (parts.length > basePartsCount) {
      const subdomain = parts[0];
      if (['www', 'app', 'localhost'].includes(subdomain)) return null;
      return subdomain;
    }
    return null; // main domain
  }

  // Custom domain — mirror middleware.ts else branch
  if (!['www', 'app', 'localhost'].includes(host)) {
    return host;
  }

  return null;
}

export default function Page() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [isSubdomain, setIsSubdomain] = useState(false);
  const token = useStore((state) => state.token);
  const user = useStore((state) => state.user);
  // Use global store for mobile menu state to keep header, sidebar, and overlay in sync
  const mobileMenuOpen = useStore((state) => state.mobileMenuOpen);
  const setMobileMenuOpen = useStore((state) => state.setMobileMenuOpen);

  useEffect(() => {
    const identifier = getTenantIdentifier();
    if (!identifier) {
      setIsSubdomain(false);
      setReady(true);
      return;
    }

    setIsSubdomain(true);

    // If already logged in, redirect directly to the app instead of going through /login
    if (token && user) {
      if (user.role === 'SUPER_ADMIN') {
        router.replace('/superadmin');
      } else if (isClientUser(user)) {
        router.replace('/feedback/client-portal');
      } else if (isProfessionalUser(user) && !canAccessDashboard(user)) {
        router.replace('/profissional');
      } else if (!user.tenantId) {
        router.replace('/onboarding');
      } else {
        router.replace('/dashboard');
      }
      return;
    }

    // Fetch tenant config to know where to redirect
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    fetch(`${apiUrl}/tenants/public/${identifier}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const target = data?.rootRedirect === 'catalogo' ? '/catalogo' : '/login';
        router.replace(target);
      })
      .catch(() => {
        router.replace('/login');
      });
  }, [router, token, user]);

  if (isSubdomain) {
    // Redirect in progress — show minimal loader
    return (
      <div className="min-h-screen bg-white flex items-center justify-center relative z-10">
        <div className="h-6 w-6 border-2 border-zinc-200 border-t-zinc-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!ready) return null;

  return <RootClientPage />;
}
