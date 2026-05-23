'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';

export default function RootPage() {
  const router = useRouter();
  const token = useStore((state) => state.token);
  const user = useStore((state) => state.user);

  useEffect(() => {
    if (!token || !user) {
      router.push('/login');
    } else if (user.role === 'BARBER') {
      router.push('/barber');
    } else if (user.role === 'CLIENT') {
      router.push('/feedback/client-portal');
    } else {
      router.push('/dashboard');
    }
  }, [token, user, router]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="h-8 w-8 border-2 border-davinci-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
