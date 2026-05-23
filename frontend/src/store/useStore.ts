import { create } from 'zustand';

interface UserSession {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  role: 'ADMIN' | 'ATTENDANT' | 'BARBER' | 'CLIENT';
  barberId?: string | null;
}

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
  activeClientForSimulator: { id: string; nome: string; telefone: string } | null;
  whatsappSimulatorOpen: boolean;
  mobileMenuOpen: boolean;
  notifications: ToastNotification[];
  setSession: (token: string, user: UserSession) => void;
  logout: () => void;
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
  activeClientForSimulator: null,
  whatsappSimulatorOpen: false,
  mobileMenuOpen: false,
  notifications: [],
  setSession: (token, user) => {
    localStorage.setItem('davinci_token', token);
    localStorage.setItem('davinci_user', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('davinci_token');
    localStorage.removeItem('davinci_user');
    set({ token: null, user: null, activeClientForSimulator: null });
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
