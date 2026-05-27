export type StaffRole =
  | 'ADMIN'
  | 'ATTENDANT'
  | 'BARBER'
  | 'HAIRDRESSER'
  | 'MANICURE_PEDICURE';

export type AppRole = StaffRole | 'CLIENT';

export interface SessionUserLike {
  role: AppRole;
  roles?: string[];
}

const PROFESSIONAL_ROLES: StaffRole[] = ['BARBER', 'HAIRDRESSER', 'MANICURE_PEDICURE'];
const DASHBOARD_ROLES: StaffRole[] = ['ADMIN', 'ATTENDANT'];
export const ADMIN_ONLY_DASHBOARD_TABS = ['services', 'finance', 'users', 'employees', 'feedbacks'] as const;
export const ATTENDANT_DASHBOARD_TABS = ['calendar', 'crm', 'whatsapp', 'quick-replies'] as const;
export const ADMIN_DASHBOARD_TABS = [
  'calendar',
  'crm',
  'whatsapp',
  'quick-replies',
  'services',
  'finance',
  'users',
  'employees',
  'feedbacks',
] as const;

export type DashboardTab = (typeof ADMIN_DASHBOARD_TABS)[number];

export const ROLE_LABELS: Record<StaffRole, string> = {
  ADMIN: 'Administrador',
  ATTENDANT: 'Atendente',
  BARBER: 'Barbeiro',
  HAIRDRESSER: 'Cabeleireira(o)',
  MANICURE_PEDICURE: 'Manicure/Pedicure',
};

export function getUserRoles(user?: SessionUserLike | null) {
  if (!user) return [];
  return Array.from(new Set([user.role, ...(user.roles || [])].filter(Boolean))) as AppRole[];
}

export function hasAnyRole(user: SessionUserLike | null | undefined, roles: AppRole[]) {
  const userRoles = getUserRoles(user);
  return roles.some((role) => userRoles.includes(role));
}

export function isClientUser(user?: SessionUserLike | null) {
  return user?.role === 'CLIENT';
}

export function isProfessionalUser(user?: SessionUserLike | null) {
  return hasAnyRole(user, PROFESSIONAL_ROLES);
}

export function canAccessDashboard(user?: SessionUserLike | null) {
  return hasAnyRole(user, DASHBOARD_ROLES);
}

export function isAdminUser(user?: SessionUserLike | null) {
  return hasAnyRole(user, ['ADMIN']);
}

export function getAllowedDashboardTabs(user?: SessionUserLike | null): DashboardTab[] {
  if (isAdminUser(user)) return [...ADMIN_DASHBOARD_TABS];
  if (hasAnyRole(user, ['ATTENDANT'])) return [...ATTENDANT_DASHBOARD_TABS];
  return [];
}

export function canAccessDashboardTab(user: SessionUserLike | null | undefined, tab: string) {
  return getAllowedDashboardTabs(user).includes(tab as DashboardTab);
}

export function getPrimaryRoleLabel(user?: SessionUserLike | null) {
  if (!user || user.role === 'CLIENT') return 'Cliente';
  return ROLE_LABELS[user.role as StaffRole] || 'Usuário';
}

export function getRoleLabels(roles: string[] = []) {
  return roles.map((role) => ROLE_LABELS[role as StaffRole] || role);
}
