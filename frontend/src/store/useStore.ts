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
  tenantId?: string | null;
}

export type DemoPersona = 'admin' | 'attendant' | 'professional' | 'client';

interface ToastNotification {
  id: string;
  title: string;
  description: string;
  type: 'success' | 'info' | 'error' | 'warning';
  timestamp: Date;
}

export interface TenantInfo {
  id: string;
  name: string;
  subdomain: string;
  customDomain?: string | null;
  logoUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor?: string | null;
  active?: boolean;
  loginStyle?: string | null;
  rootRedirect?: string | null;
  users?: Array<{ id: string; nome: string; email: string }>;
  footerSlogan?: string | null;
  footerInstagram?: string | null;
  footerWhatsapp?: string | null;
  footerFacebook?: string | null;
  footerHours?: string | null;
  footerAddress?: string | null;
  footerPhone?: string | null;
  footerEmail?: string | null;
  footerCopyright?: string | null;
  footerPoweredBy?: string | null;
  subscriptionModuleEnabled?: boolean;
  gatewayProvider?: string | null;
  gatewayApiKey?: string | null;
  gatewayWebhookSecret?: string | null;
  trialEndsAt?: string | null;
  subscriptionStatus?: string;
  asaasCustomerId?: string | null;
  asaasSubscriptionId?: string | null;
  saasPlan?: string;
}

interface StoreState {
  token: string | null;
  user: UserSession | null;
  tenant: TenantInfo | null;
  demoMode: boolean;
  demoPersona: DemoPersona | null;
  activeClientForSimulator: { id: string; nome: string; telefone: string } | null;
  whatsappSimulatorOpen: boolean;
  mobileMenuOpen: boolean;
  notifications: ToastNotification[];
  setSession: (token: string, user: UserSession) => void;
  setTenant: (tenant: TenantInfo | null) => void;
  logout: () => void;
  setDemoMode: (enabled: boolean, persona?: DemoPersona | null) => void;
  setActiveClientForSimulator: (client: { id: string; nome: string; telefone: string } | null) => void;
  setWhatsappSimulatorOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  addNotification: (notification: Omit<ToastNotification, 'id' | 'timestamp'>) => void;
  clearNotifications: () => void;
}

export const useStore = create<StoreState>((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('venusta_token') : null,
  user: typeof window !== 'undefined' ? (() => {
    const stored = localStorage.getItem('venusta_user');
    return stored ? JSON.parse(stored) : null;
  })() : null,
  tenant: null,
  demoMode: typeof window !== 'undefined' ? localStorage.getItem('venusta_demo_mode') === 'true' : false,
  demoPersona: typeof window !== 'undefined' ? (localStorage.getItem('venusta_demo_persona') as DemoPersona | null) : null,
  activeClientForSimulator: null,
  whatsappSimulatorOpen: false,
  mobileMenuOpen: false,
  notifications: [],
  setSession: (token, user) => {
    localStorage.setItem('venusta_token', token);
    localStorage.setItem('venusta_user', JSON.stringify(user));
    set({ token, user });
  },
  setTenant: (tenant) => set({ tenant }),
  logout: () => {
    localStorage.removeItem('venusta_token');
    localStorage.removeItem('venusta_user');
    localStorage.removeItem('venusta_demo_mode');
    localStorage.removeItem('venusta_demo_persona');
    set({
      token: null,
      user: null,
      demoMode: false,
      demoPersona: null,
      activeClientForSimulator: null,
    });
  },
  setDemoMode: (enabled, persona = null) => {
    if (enabled) {
      localStorage.setItem('venusta_demo_mode', 'true');
      if (persona) {
        localStorage.setItem('venusta_demo_persona', persona);
      } else {
        localStorage.removeItem('venusta_demo_persona');
      }
    } else {
      localStorage.removeItem('venusta_demo_mode');
      localStorage.removeItem('venusta_demo_persona');
    }

    set({
      demoMode: enabled,
      demoPersona: enabled ? persona : null,
    });
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
