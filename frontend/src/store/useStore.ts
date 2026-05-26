import { create } from 'zustand';
import type { AppRole } from '@/lib/auth';

interface UserSession {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  role: AppRole;
  roles?: string[];
  isActive?: boolean;
  barberId?: string | null;
}

export type DemoPersona = 'admin' | 'attendant' | 'professional' | 'client';

interface ToastNotification {
  id: string;
  title: string;
  description: string;
  type: 'success' | 'info' | 'error' | 'warning';
  timestamp: Date;
}

interface StoreState {
  token: string | null;
  user: UserSession | null;
  demoMode: boolean;
  demoPersona: DemoPersona | null;
  activeClientForSimulator: { id: string; nome: string; telefone: string } | null;
  whatsappSimulatorOpen: boolean;
  mobileMenuOpen: boolean;
  notifications: ToastNotification[];
  tourActive: boolean;
  tourStep: number;
  setSession: (token: string, user: UserSession) => void;
  logout: () => void;
  setDemoMode: (enabled: boolean, persona?: DemoPersona | null) => void;
  setTourActive: (active: boolean) => void;
  setTourStep: (step: number) => void;
  setActiveClientForSimulator: (client: { id: string; nome: string; telefone: string } | null) => void;
  setWhatsappSimulatorOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  addNotification: (notification: Omit<ToastNotification, 'id' | 'timestamp'>) => void;
  clearNotifications: () => void;
}

export const useStore = create<StoreState>((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('davinci_token') : null,
  user: typeof window !== 'undefined' ? (() => {
    const stored = localStorage.getItem('davinci_user');
    return stored ? JSON.parse(stored) : null;
  })() : null,
  demoMode: typeof window !== 'undefined' ? localStorage.getItem('davinci_demo_mode') === 'true' : false,
  demoPersona: typeof window !== 'undefined' ? (localStorage.getItem('davinci_demo_persona') as DemoPersona | null) : null,
  activeClientForSimulator: null,
  whatsappSimulatorOpen: false,
  mobileMenuOpen: false,
  notifications: [],
  tourActive: typeof window !== 'undefined' ? localStorage.getItem('davinci_tour_active') === 'true' : false,
  tourStep: typeof window !== 'undefined' ? parseInt(localStorage.getItem('davinci_tour_step') || '0', 10) : 0,
  setSession: (token, user) => {
    localStorage.setItem('davinci_token', token);
    localStorage.setItem('davinci_user', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('davinci_token');
    localStorage.removeItem('davinci_user');
    localStorage.removeItem('davinci_demo_mode');
    localStorage.removeItem('davinci_demo_persona');
    localStorage.removeItem('davinci_tour_active');
    localStorage.removeItem('davinci_tour_step');
    set({
      token: null,
      user: null,
      demoMode: false,
      demoPersona: null,
      activeClientForSimulator: null,
      tourActive: false,
      tourStep: 0,
    });
  },
  setDemoMode: (enabled, persona = null) => {
    if (enabled) {
      localStorage.setItem('davinci_demo_mode', 'true');
      if (persona) {
        localStorage.setItem('davinci_demo_persona', persona);
        localStorage.setItem('davinci_tour_active', 'true');
        localStorage.setItem('davinci_tour_step', '0');
      } else {
        localStorage.removeItem('davinci_demo_persona');
        localStorage.removeItem('davinci_tour_active');
        localStorage.removeItem('davinci_tour_step');
      }
    } else {
      localStorage.removeItem('davinci_demo_mode');
      localStorage.removeItem('davinci_demo_persona');
      localStorage.removeItem('davinci_tour_active');
      localStorage.removeItem('davinci_tour_step');
    }

    set({
      demoMode: enabled,
      demoPersona: enabled ? persona : null,
      tourActive: enabled && !!persona,
      tourStep: 0,
    });
  },
  setTourActive: (active) => {
    if (active) {
      localStorage.setItem('davinci_tour_active', 'true');
    } else {
      localStorage.removeItem('davinci_tour_active');
    }
    set({ tourActive: active });
  },
  setTourStep: (step) => {
    localStorage.setItem('davinci_tour_step', step.toString());
    set({ tourStep: step });
  },
  setActiveClientForSimulator: (client) => set({ activeClientForSimulator: client }),
  setWhatsappSimulatorOpen: (open) => set({ whatsappSimulatorOpen: open }),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  addNotification: (notif) =>
    set((state) => {
      const newNotif = {
        ...notif,
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date(),
      };
      // Manter no máximo 10 notificações no histórico
      return { notifications: [newNotif, ...state.notifications].slice(0, 10) };
    }),
  clearNotifications: () => set({ notifications: [] }),
}));
