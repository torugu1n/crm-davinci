'use client';

import React, { useState } from 'react';
import { Bell, ChevronDown, LogOut, Menu, Sparkles } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { getPrimaryRoleLabel } from '@/lib/auth';

interface HeaderProps {
  title: string;
  subtitle?: string;
  avatarUrl?: string | null;
  rightSlot?: React.ReactNode;
}

export default function Header({ title, subtitle, avatarUrl, rightSlot }: HeaderProps) {
  const router = useRouter();
  const notifications = useStore((state) => state.notifications);
  const clearNotifications = useStore((state) => state.clearNotifications);
  const mobileMenuOpen = useStore((state) => state.mobileMenuOpen);
  const setMobileMenuOpen = useStore((state) => state.setMobileMenuOpen);
  const user = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    setShowAccountMenu(false);
    router.push('/login');
  };

  return (
    <header className="h-20 bg-white/70 backdrop-blur-md border-b border-zinc-200/80 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-white border border-davinci-gold/30 hover:border-davinci-gold text-davinci-gold lg:hidden cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Sparkles className="h-5 w-5 text-davinci-gold hidden sm:block" />
        <div>
          <h1 className="text-sm sm:text-xl font-bold text-davinci-black uppercase tracking-wider">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[10px] text-davinci-gray mt-1 font-medium">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {rightSlot}

        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowAccountMenu(false);
            }}
            className="relative p-2 rounded-full bg-white border border-zinc-200 hover:border-davinci-gold/50 text-davinci-gray hover:text-davinci-black transition-all cursor-pointer shadow-[0_2px_10px_rgba(197,168,128,0.06)]"
          >
            <Bell className="h-5 w-5" />
            {notifications.length > 0 && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-davinci-gold border border-white animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-zinc-200/80 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="p-4 border-b border-zinc-200/80 flex items-center justify-between bg-background">
                <span className="text-xs font-bold text-davinci-black uppercase tracking-wider flex items-center gap-1.5">
                  Notificações
                  {notifications.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-davinci-gold/20 text-davinci-gold text-[10px]">
                      {notifications.length}
                    </span>
                  )}
                </span>
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="text-[10px] text-davinci-gold hover:underline cursor-pointer font-medium"
                  >
                    Limpar tudo
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-zinc-100">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-davinci-gray font-light">
                    Nenhuma notificação recebida no momento.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className="p-4 hover:bg-background transition-colors">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs font-semibold text-davinci-black">{notif.title}</h4>
                        <span className="text-[9px] text-davinci-gray font-light">
                          {formatTime(notif.timestamp)}
                        </span>
                      </div>
                      <p className="text-[11px] text-davinci-gray mt-1 leading-relaxed">
                        {notif.description}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-zinc-100 bg-background text-center">
                <span className="text-[9px] text-davinci-gray uppercase tracking-widest font-medium">
                  Monitoramento em tempo real ativo
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowAccountMenu(!showAccountMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 pl-2 pr-3 py-2 rounded-full bg-white border border-zinc-200 hover:border-davinci-gold/50 transition-all cursor-pointer shadow-[0_2px_10px_rgba(197,168,128,0.06)]"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user?.nome || 'Usuário'}
                className="w-9 h-9 rounded-full object-cover border border-davinci-gold/20"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-davinci-gold/10 border border-davinci-gold/20 flex items-center justify-center font-bold text-davinci-gold text-sm">
                {user?.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div className="hidden md:block text-left min-w-0">
              <div className="text-xs font-semibold text-davinci-black truncate max-w-[140px]">
                {user?.nome || 'Usuário'}
              </div>
              <div className="text-[9px] text-davinci-gold uppercase tracking-wider font-semibold">
                {getPrimaryRoleLabel(user)}
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-davinci-gray" />
          </button>

          {showAccountMenu && (
            <div className="absolute right-0 mt-3 w-64 bg-white border border-zinc-200/80 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="p-4 bg-background border-b border-zinc-200/80">
                <div className="text-sm font-semibold text-davinci-black">{user?.nome || 'Usuário'}</div>
                <div className="text-[10px] text-davinci-gold uppercase tracking-widest font-semibold mt-1">
                  {getPrimaryRoleLabel(user)}
                </div>
                {user?.email && (
                  <div className="text-[11px] text-davinci-gray mt-2 break-all">{user.email}</div>
                )}
              </div>
              <div className="p-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/5 transition-colors text-xs font-medium cursor-pointer"
                >
                  <LogOut className="h-4.5 w-4.5" />
                  Sair da Conta
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
