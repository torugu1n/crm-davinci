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

export const DEMO_TOUR_CONTENT: Record<
  DemoPersona,
  {
    title: string;
    intro: string;
    steps: Array<{ title: string; description: string; href: string; cta: string; selector: string }>;
  }
> = {
  admin: {
    title: 'Roteiro do Administrador',
    intro: 'Use o modo admin para apresentar cada módulo novo separadamente: agenda, catálogo, comissões, metas, auditoria, equipe e permissões.',
    steps: [
      {
        title: 'Agenda Inteligente',
        description: 'Visão gerencial de toda a operação. Acompanhe horários, status de presença, bloqueios e o fluxo dos profissionais em tempo real.',
        href: '/dashboard?tab=calendar',
        cta: 'Abrir agenda',
        selector: '#dashboard-tab-content-calendar',
      },
      {
        title: 'Gestão de Clientes',
        description: 'Banco de dados centralizado. Veja o histórico de visitas, ticket médio e preferências de cada cliente para estruturar campanhas de marketing.',
        href: '/dashboard?tab=crm',
        cta: 'Abrir Clientes',
        selector: '#dashboard-tab-content-crm',
      },
      {
        title: 'WhatsApp e Confirmações',
        description: 'Canal de atendimento integrado. Demonstre conversas, confirmação de horários, criação de agendamento pelo chat e continuidade do relacionamento.',
        href: '/dashboard?tab=whatsapp',
        cta: 'Abrir WhatsApp',
        selector: '#dashboard-tab-content-whatsapp',
      },
      {
        title: 'Respostas Rápidas',
        description: 'Modelos prontos para acelerar o atendimento. A recepção reutiliza mensagens de confirmação, boas-vindas e aviso de atraso sem digitar tudo de novo.',
        href: '/dashboard?tab=quick-replies',
        cta: 'Abrir respostas',
        selector: '#dashboard-tab-content-quick-replies',
      },
      {
        title: 'Serviços por Profissional',
        description: 'Cadastro de serviços com duração, preço e vínculo aos profissionais que realmente executam cada atendimento.',
        href: '/dashboard?tab=services&catalogSubTab=services',
        cta: 'Abrir serviços',
        selector: '#dashboard-tab-content-services',
      },
      {
        title: 'Comissões Variáveis de Serviço',
        description: 'Comissões específicas por serviço e profissional. A conta demo já traz serviços vinculados e percentuais diferentes para mostrar o controle operacional.',
        href: '/dashboard?tab=services&catalogSubTab=services',
        cta: 'Ver comissões',
        selector: '#dashboard-tab-content-services',
      },
      {
        title: 'Produtos e Comissões',
        description: 'Vitrine de produtos com preço, descrição, comissão padrão e comissão customizada por profissional quando necessário.',
        href: '/dashboard?tab=services&catalogSubTab=products',
        cta: 'Abrir produtos',
        selector: '#dashboard-tab-content-services',
      },
      {
        title: 'Equipe de Profissionais',
        description: 'Gestão da equipe interna. Cada profissional tem categoria, comissão padrão, especialidades, mini bio e serviços habilitados para o portal.',
        href: '/dashboard?tab=employees',
        cta: 'Abrir equipe',
        selector: '#dashboard-tab-content-employees',
      },
      {
        title: 'Usuários e Permissões',
        description: 'Controle de acessos do sistema. Cadastre e-mails de acesso e determine o papel do funcionário (Admin, Atendente ou Barbeiro) na casa.',
        href: '/dashboard?tab=users',
        cta: 'Abrir usuários',
        selector: '#dashboard-tab-content-users',
      },
      {
        title: 'Visão Financeira',
        description: 'Acompanhe faturamento diário, semanal e mensal, comissões estimadas, ranking de produtividade e distribuição de receita por profissional.',
        href: '/dashboard?tab=finance&financeSubTab=overview',
        cta: 'Abrir financeiro',
        selector: '#dashboard-tab-content-finance',
      },
      {
        title: 'Metas Corporativas',
        description: 'Metas mensais de faturamento e volume de atendimentos. A demo já vem com alvos cadastrados e progresso preenchido para apresentação.',
        href: '/dashboard?tab=finance&financeSubTab=goals',
        cta: 'Abrir metas',
        selector: '#dashboard-tab-content-finance',
      },
      {
        title: 'Logs de Auditoria',
        description: 'Rastreamento de ações sensíveis, como criação de serviço, alteração de comissão, cancelamentos e mudanças de preço.',
        href: '/dashboard?tab=finance&financeSubTab=audit',
        cta: 'Abrir auditoria',
        selector: '#dashboard-tab-content-finance',
      },
      {
        title: 'Feedbacks e Avaliações',
        description: 'Controle de qualidade de atendimento. Acompanhe a pontuação média dada pelos clientes para a recepção e para cada profissional.',
        href: '/dashboard?tab=feedbacks',
        cta: 'Abrir feedbacks',
        selector: '#dashboard-tab-content-feedbacks',
      },
    ],
  },
  attendant: {
    title: 'Roteiro da Recepção',
    intro: 'Mostre como a recepção organiza a operação diária sem acesso às áreas administrativas.',
    steps: [
      {
        title: 'Agenda do Dia',
        description: 'Operação da recepção. Controle a fila de chegada, faça novos agendamentos, adicione encaixes e mude status de andamento.',
        href: '/dashboard?tab=calendar',
        cta: 'Abrir agenda',
        selector: '#dashboard-tab-content-calendar',
      },
      {
        title: 'Clientes da Casa',
        description: 'Apoio à recepção. Consulte dados de contato, ticket de consumo, datas de aniversário e observações importantes antes do cliente entrar.',
        href: '/dashboard?tab=crm',
        cta: 'Abrir clientes',
        selector: '#dashboard-tab-content-crm',
      },
      {
        title: 'Disparos de WhatsApp',
        description: 'Canal de relacionamento ativo. Dispare confirmações manuais, acompanhe a conversa e registre solicitações vindas do WhatsApp.',
        href: '/dashboard?tab=whatsapp',
        cta: 'Abrir WhatsApp',
        selector: '#dashboard-tab-content-whatsapp',
      },
      {
        title: 'Respostas Rápidas',
        description: 'Biblioteca de mensagens prontas para confirmação, boas-vindas e avisos de atraso. O atendente usa esses modelos para padronizar o contato.',
        href: '/dashboard?tab=quick-replies',
        cta: 'Abrir respostas',
        selector: '#dashboard-tab-content-quick-replies',
      },
    ],
  },
  professional: {
    title: 'Roteiro do Profissional',
    intro: 'Mostre o painel focado em execução: agenda, clientes do dia e andamento dos atendimentos.',
    steps: [
      {
        title: 'Operação do dia',
        description: 'Painel operacional do barbeiro. Monitore o próximo cliente da fila, faturamento e a sua comissão acumulada para o dia atual.',
        href: '/profissional?tab=overview',
        cta: 'Abrir operação',
        selector: '#professional-tab-content-overview',
      },
      {
        title: 'Agenda do profissional',
        description: 'Fila de execução diária. Controle o fluxo de status de cada serviço (Confirmar, Iniciar, Finalizar) mantendo a recepção sempre atualizada.',
        href: '/profissional?tab=schedule',
        cta: 'Abrir agenda',
        selector: '#professional-tab-content-schedule',
      },
      {
        title: 'Clientes de hoje',
        description: 'Ficha técnica do cliente. Acesse preferências de estilo de corte, alergias e observações registradas para garantir a fidelidade do atendimento.',
        href: '/profissional?tab=clients',
        cta: 'Abrir clientes',
        selector: '#professional-tab-content-clients',
      },
    ],
  },
  client: {
    title: 'Roteiro do Cliente',
    intro: 'Use o portal do cliente para mostrar autoatendimento com visual premium e fluxo de reserva.',
    steps: [
      {
        title: 'Portal premium',
        description: 'Apresente os dados do cliente, contato e histórico como extensão da experiência da marca.',
        href: '/feedback/client-portal',
        cta: 'Abrir portal',
        selector: '#client-portal-root',
      },
      {
        title: 'Escolha do profissional',
        description: 'Mostre os cards visuais com foto, função e mini bio para apoiar a decisão do cliente.',
        href: '/feedback/client-portal#booking',
        cta: 'Ir para agendamento',
        selector: '#client-portal-booking',
      },
      {
        title: 'Catálogo público',
        description: 'Complete a demonstração com a vitrine de serviços e produtos do estabelecimento.',
        href: '/catalogo',
        cta: 'Abrir catálogo',
        selector: '#catalog-root',
      },
    ],
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
