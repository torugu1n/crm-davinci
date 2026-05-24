'use client';

import React, { useState } from 'react';
import { Bell, Sparkles, X, Check, Menu } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const notifications = useStore((state) => state.notifications);
  const clearNotifications = useStore((state) => state.clearNotifications);
  const mobileMenuOpen = useStore((state) => state.mobileMenuOpen);
  const setMobileMenuOpen = useStore((state) => state.setMobileMenuOpen);
  const [showDropdown, setShowDropdown] = useState(false);

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <header className="h-20 bg-white/70 backdrop-blur-md border-b border-zinc-200/80 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-10">
      {/* Title / Path */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-white border border-davinci-gold/30 hover:border-davinci-gold text-davinci-gold lg:hidden cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Sparkles className="h-5 w-5 text-davinci-gold hidden sm:block" />
        <h1 className="text-sm sm:text-xl font-bold text-davinci-black uppercase tracking-wider">
          {title}
        </h1>
      </div>

      {/* Action / Notification Bell */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="relative p-2 rounded-full bg-white border border-zinc-200 hover:border-davinci-gold/50 text-davinci-gray hover:text-davinci-black transition-all cursor-pointer shadow-[0_2px_10px_rgba(197,168,128,0.06)]"
        >
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-davinci-gold border border-white animate-pulse" />
          )}
        </button>

        {/* Notifications Dropdown */}
        {showDropdown && (
          <div className="absolute right-0 mt-3 w-80 bg-white border border-zinc-200/80 rounded-xl shadow-xl z-50 overflow-hidden">
            {/* Header */}
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

            {/* List */}
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

            {/* Footer */}
            <div className="p-2 border-t border-zinc-100 bg-background text-center">
              <span className="text-[9px] text-davinci-gray uppercase tracking-widest font-medium">
                Monitoramento em tempo real ativo
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
