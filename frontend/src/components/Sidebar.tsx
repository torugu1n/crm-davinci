'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  DollarSign,
  MessageSquare,
  Star,
  Scissors,
  UserCog,
  ShieldCheck,
  Zap,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Settings,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { canAccessDashboardTab } from '@/lib/auth';
import { getLogoUrl } from '@/lib/logo-helper';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useStore((state) => state.user);
  const tenant = useStore((state) => state.tenant);
  const mobileMenuOpen = useStore((state) => state.mobileMenuOpen);
  const setMobileMenuOpen = useStore((state) => state.setMobileMenuOpen);

  const [logoFailed, setLogoFailed] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [tenant?.logoUrl]);

  // Keep Reports submenu open if active tab is reports
  useEffect(() => {
    if (activeTab === 'reports') {
      setReportsOpen(true);
    }
  }, [activeTab]);

  const allMenuItems = [
    { id: 'calendar', label: 'Agenda', icon: Calendar },
    { id: 'crm', label: 'Meus Clientes', icon: Users },
    { id: 'whatsapp', label: 'Atendimento', icon: MessageSquare },
    { id: 'quick-replies', label: 'Respostas Rápidas', icon: Zap },
    { id: 'services', label: 'Serviços & Produtos', icon: Scissors },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
    { id: 'finance', label: 'Financeiro', icon: DollarSign },
    { id: 'users', label: 'Usuários & Permissões', icon: ShieldCheck },
    { id: 'employees', label: 'Equipe', icon: UserCog },
    { id: 'feedbacks', label: 'Feedbacks & Ratings', icon: Star },
    { id: 'settings', label: 'Configurações', icon: Settings },
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
        className={`w-64 bg-white border-r border-zinc-200/80 flex flex-col h-screen fixed left-0 top-0 z-40 lg:z-20 transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Logo */}
        <div className="p-6 border-b border-zinc-200/80 flex items-center gap-3 shrink-0">
          {tenant?.logoUrl && !logoFailed ? (
            <img
              src={getLogoUrl(tenant.logoUrl)}
              alt={tenant.name || 'Logo'}
              className="h-9 w-9 object-contain rounded bg-zinc-50/50 border border-zinc-200/60 p-0.5"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <div className="p-2 rounded-lg bg-background border border-davinci-gold/20">
              <Scissors className="h-5 w-5 text-davinci-gold" />
            </div>
          )}
          <div>
            <h2 className="text-sm font-bold text-davinci-black uppercase tracking-wider truncate max-w-[140px]">
              {tenant?.name || 'Gestão de Beleza'}
            </h2>
            <p className="text-[8px] text-davinci-gold uppercase tracking-[0.05em] font-semibold">
              {tenant?.name ? 'Estabelecimento Parceiro' : 'Salões, barbearias e estética'}
            </p>
          </div>
        </div>

        {/* Nav List */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            if (item.id === 'reports') {
              const currentSubtab = searchParams.get('subtab') || 'financial';
              return (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={() => {
                      setReportsOpen(!reportsOpen);
                      router.push(`/dashboard?tab=reports&subtab=${currentSubtab}`);
                      setActiveTab('reports');
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-davinci-gold/5 text-davinci-gold font-semibold border-l-2 border-davinci-gold pl-3'
                        : 'text-davinci-gray hover:text-davinci-black hover:bg-davinci-gold/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-davinci-gold' : 'text-davinci-gray'}`} />
                      {item.label}
                    </div>
                    {reportsOpen ? (
                      <ChevronDown className="h-4 w-4 text-davinci-gray" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-davinci-gray" />
                    )}
                  </button>
                  {reportsOpen && (
                    <div className="pl-4 space-y-1.5 pt-1 border-l border-zinc-200/80 ml-5">
                      {[
                        { id: 'financial', label: 'Financeiro' },
                        { id: 'appointments', label: 'Atendimentos' },
                        { id: 'clients', label: 'Clientes' },
                      ].map((sub) => {
                        const isSubActive = isActive && (searchParams.get('subtab') || 'financial') === sub.id;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => {
                              router.push(`/dashboard?tab=reports&subtab=${sub.id}`);
                              setActiveTab('reports');
                              setMobileMenuOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-all cursor-pointer ${
                              isSubActive
                                ? 'text-davinci-gold bg-davinci-gold/10 font-bold border-l border-davinci-gold pl-2.5'
                                : 'text-davinci-gray hover:text-davinci-black hover:bg-zinc-50 font-medium'
                            }`}
                          >
                            {sub.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                  router.push(`/dashboard?tab=${item.id}`);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  isActive
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
