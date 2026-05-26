'use client';

import React from 'react';
import { Calendar, Users, DollarSign, MessageSquare, Star, Scissors, UserCog, ShieldCheck } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { canAccessDashboardTab } from '@/lib/auth';
import BrandLogo from '@/components/BrandLogo';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const user = useStore((state) => state.user);
  const mobileMenuOpen = useStore((state) => state.mobileMenuOpen);
  const setMobileMenuOpen = useStore((state) => state.setMobileMenuOpen);

  const allMenuItems = [
    { id: 'calendar', label: 'Agenda', icon: Calendar },
    { id: 'crm', label: 'Meus Clientes', icon: Users },
    { id: 'whatsapp', label: 'Mensagens WhatsApp', icon: MessageSquare },
    { id: 'services', label: 'Serviços & Produtos', icon: Scissors },
    { id: 'finance', label: 'Financeiro', icon: DollarSign },
    { id: 'users', label: 'Usuários & Permissões', icon: ShieldCheck },
    { id: 'employees', label: 'Equipe', icon: UserCog },
    { id: 'feedbacks', label: 'Feedbacks & Ratings', icon: Star },
  ];
  const menuItems = allMenuItems.filter((item) => canAccessDashboardTab(user, item.id));

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden transition-all duration-300"
        />
      )}

      <aside
        className={`w-64 bg-white border-r border-zinc-200/80 flex flex-col h-screen fixed left-0 top-0 z-40 lg:z-20 transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        {/* Brand Logo */}
        <div className="p-6 border-b border-zinc-200/80">
          <BrandLogo
            subtitle="Salões, barbearias e estética"
            iconSize="md"
            textSize="md"
          />
        </div>

        {/* Nav List */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${isActive
                    ? 'bg-davinci-gold/10 text-davinci-gold border-l-2 border-davinci-gold pl-3 font-semibold'
                    : 'text-davinci-gray hover:text-davinci-black hover:bg-davinci-gold/5'
                  }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-davinci-gold' : 'text-davinci-gray'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
