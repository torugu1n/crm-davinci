import type { DemoPersona } from '@/store/useStore';

export interface DemoAuthResult {
  access_token: string;
  user?: any;
  client?: any;
}

export const DEMO_PERSONAS: Record<
  DemoPersona,
  {
    label: string;
    description: string;
    destination: string;
    loginType: 'staff' | 'client';
    credentials:
      | { login: string; senha: string }
      | { nome: string; telefone: string; aniversario?: string };
  }
> = {
  admin: {
    label: 'Administrador',
    description: 'Painel gerencial com agenda, catálogo, metas, auditoria, equipe e feedbacks.',
    destination: '/dashboard?tab=calendar',
    loginType: 'staff',
    credentials: { login: 'demo1', senha: 'demo1' },
  },
  attendant: {
    label: 'Atendente',
    description: 'Painel de recepção com agenda, clientes, WhatsApp e respostas rápidas.',
    destination: '/dashboard?tab=calendar',
    loginType: 'staff',
    credentials: { login: 'atendente1', senha: 'atendente1' },
  },
  professional: {
    label: 'Profissional',
    description: 'Painel operacional com agenda diária, comissão e ficha de clientes.',
    destination: '/profissional?tab=overview',
    loginType: 'staff',
    credentials: { login: 'barbeiro1', senha: 'barbeiro1' },
  },
  client: {
    label: 'Cliente',
    description: 'Portal para agendamento, perfil e histórico de atendimento.',
    destination: '/feedback/client-portal',
    loginType: 'client',
    credentials: {
      nome: 'Clara Vasconcelos',
      telefone: '(86) 98888-7777',
      aniversario: '15/09',
    },
  },
};

export async function authenticateDemoPersona(persona: DemoPersona, apiUrl: string): Promise<DemoAuthResult> {
  const profile = DEMO_PERSONAS[persona];

  if (profile.loginType === 'staff') {
    const credentials = profile.credentials as { login: string; senha: string };
    const res = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: credentials.login,
        senha: credentials.senha,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Não foi possível iniciar o modo demo.');
    }

    return data;
  }

  const credentials = profile.credentials as { nome: string; telefone: string; aniversario?: string };
  const res = await fetch(`${apiUrl}/auth/client`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Não foi possível iniciar o modo demo.');
  }

  return data;
}
