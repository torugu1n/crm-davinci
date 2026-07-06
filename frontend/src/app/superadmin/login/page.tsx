'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectSuperAdminLoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="h-8 w-8 border-2 border-davinci-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
