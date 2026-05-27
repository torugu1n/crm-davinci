import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o seeding do banco de dados multitenant...');

  // 1. Criar ou obter o Tenant Padrão "davinci"
  let tenantDaVinci = await prisma.tenant.findUnique({
    where: { subdomain: 'davinci' },
  });

  if (!tenantDaVinci) {
    tenantDaVinci = await prisma.tenant.create({
      data: {
        name: 'DaVinci Premium',
        subdomain: 'davinci',
        primaryColor: '#C5A880',
        secondaryColor: '#18181b',
      },
    });
    console.log('Tenant padrão "davinci" criado.');
  }

  // 2. Criar ou obter o Super Admin
  const superAdminEmail = 'superadmin@vtecsolutions.online';
  let superUser = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  });

  if (!superUser) {
    const superAdminSenha = await bcrypt.hash('superadminvtec', 10);
    superUser = await prisma.user.create({
      data: {
        nome: 'Super Admin Vtec',
        email: superAdminEmail,
        senha: superAdminSenha,
        role: 'SUPER_ADMIN',
        roles: ['SUPER_ADMIN'],
        tenantId: null, // Super admin não é associado a um tenant de barbearia
      },
    });
    console.log('Usuário Super Admin criado com sucesso!');
  }

  // 3. Migrar registros existentes que estão sem tenantId
  console.log('Corrigindo registros órfãos sem tenantId...');
  await prisma.user.updateMany({
    where: { tenantId: null, NOT: { role: 'SUPER_ADMIN' } },
    data: { tenantId: tenantDaVinci.id },
  });
  await prisma.client.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenantDaVinci.id },
  });
  await prisma.service.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenantDaVinci.id },
  });
  await prisma.product.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenantDaVinci.id },
  });
  await prisma.appointment.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenantDaVinci.id },
  });
  await prisma.quickReply.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenantDaVinci.id },
  });
  await prisma.goal.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenantDaVinci.id },
  });
  await prisma.auditLog.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenantDaVinci.id },
  });
  console.log('Registros existentes vinculados ao tenant padrão.');

  // 4. Se o banco de dados estiver limpo (sem serviços), criar dados de demonstração
  const serviceCount = await prisma.service.count();
  if (serviceCount === 0) {
    console.log('Inserindo dados de demonstração...');

    // Criar Serviços
    const corteFeminino = await prisma.service.create({
      data: { nome: 'Corte Feminino Premium', preco: 180.0, duracao: 60, tenantId: tenantDaVinci.id },
    });
    const escova = await prisma.service.create({
      data: { nome: 'Escova & Hidratação Imperial', preco: 120.0, duracao: 45, tenantId: tenantDaVinci.id },
    });
    const coloracao = await prisma.service.create({
      data: { nome: 'Coloração & Mechas Da Vinci', preco: 280.0, duracao: 120, tenantId: tenantDaVinci.id },
    });
    const corteMasculino = await prisma.service.create({
      data: { nome: 'Corte Masculino Premium', preco: 90.0, duracao: 45, tenantId: tenantDaVinci.id },
    });
    const barba = await prisma.service.create({
      data: { nome: 'Barba & Toalha Quente', preco: 60.0, duracao: 30, tenantId: tenantDaVinci.id },
    });
    const manicure = await prisma.service.create({
      data: { nome: 'Manicure & Pedicure Premium', preco: 85.0, duracao: 60, tenantId: tenantDaVinci.id },
    });

    // Criar Produtos
    const prodShampoo = await prisma.product.create({
      data: {
        nome: 'Shampoo Repair Da Vinci',
        preco: 89.9,
        descricao: 'Shampoo de tratamento para manutenção premium pós-coloração e hidratação.',
        commissionRate: 10.0,
        tenantId: tenantDaVinci.id,
      },
    });

    const prodMascara = await prisma.product.create({
      data: {
        nome: 'Máscara Capilar Imperial',
        preco: 129.9,
        descricao: 'Máscara capilar de nutrição intensa para uso semanal.',
        commissionRate: 12.0,
        tenantId: tenantDaVinci.id,
      },
    });

    const prodPomada = await prisma.product.create({
      data: {
        nome: 'Pomada Matte Signature',
        preco: 59.9,
        descricao: 'Pomada de fixação média com acabamento seco para penteados masculinos.',
        commissionRate: 8.0,
        tenantId: tenantDaVinci.id,
      },
    });

    // Senhas hash
    const adminSenha = await bcrypt.hash('admin1', 10);
    const atendenteSenha = await bcrypt.hash('atendente1', 10);
    const barber1Senha = await bcrypt.hash('barbeiro1', 10);
    const hairdresser1Senha = await bcrypt.hash('cabeleireira1', 10);
    const manicure2Senha = await bcrypt.hash('manicure2', 10);

    // Criar Usuários
    const userAdmin = await prisma.user.create({
      data: {
        nome: 'Administrador 1',
        email: 'admin1@salao.com',
        senha: adminSenha,
        role: 'ADMIN',
        roles: ['ADMIN'],
        tenantId: tenantDaVinci.id,
      },
    });

    const userAtendente = await prisma.user.create({
      data: {
        nome: 'Atendente 1',
        email: 'atendente1@salao.com',
        senha: atendenteSenha,
        role: 'ATTENDANT',
        roles: ['ATTENDANT'],
        tenantId: tenantDaVinci.id,
      },
    });

    const userAlessandro = await prisma.user.create({
      data: {
        nome: 'Barbeiro 1',
        email: 'barbeiro1@salao.com',
        senha: barber1Senha,
        role: 'BARBER',
        roles: ['BARBER'],
        tenantId: tenantDaVinci.id,
      },
    });

    const userMarcus = await prisma.user.create({
      data: {
        nome: 'Cabeleireira 1',
        email: 'cabeleireira1@salao.com',
        senha: hairdresser1Senha,
        role: 'HAIRDRESSER',
        roles: ['HAIRDRESSER'],
        tenantId: tenantDaVinci.id,
      },
    });

    const userMariana = await prisma.user.create({
      data: {
        nome: 'Manicure 2',
        email: 'manicure2@salao.com',
        senha: manicure2Senha,
        role: 'MANICURE_PEDICURE',
        roles: ['MANICURE_PEDICURE'],
        tenantId: tenantDaVinci.id,
      },
    });

    // Criar Profissionais (Barbers/Stylists)
    const professional1 = await prisma.barber.create({
      data: {
        userId: userAlessandro.id,
        categoria: 'BARBER',
        especialidade: 'Cortes masculinos premium, degradê baixo, visagismo e barboterapia.',
        notaMedia: 4.95,
        services: {
          connect: [{ id: corteMasculino.id }, { id: barba.id }],
        },
      },
    });

    const professional2 = await prisma.barber.create({
      data: {
        userId: userMarcus.id,
        categoria: 'HAIRDRESSER',
        especialidade: 'Cortes unissex clássicos, escovas de alta performance e modelagem.',
        notaMedia: 4.88,
        services: {
          connect: [{ id: corteFeminino.id }, { id: escova.id }, { id: corteMasculino.id }],
        },
      },
    });

    const professional3 = await prisma.barber.create({
      data: {
        userId: userMariana.id,
        categoria: 'MANICURE_PEDICURE',
        especialidade: 'Estilista de mechas, coloração avançada, tratamentos capilares e cortes femininos.',
        notaMedia: 4.98,
        services: {
          connect: [{ id: coloracao.id }, { id: manicure.id }],
        },
      },
    });

    // Comissões customizadas
    await prisma.productCommission.create({
      data: {
        productId: prodShampoo.id,
        barberId: professional3.id,
        commissionRate: 20.0,
      },
    });

    await prisma.productCommission.create({
      data: {
        productId: prodPomada.id,
        barberId: professional1.id,
        commissionRate: 15.0,
      },
    });

    await prisma.serviceCommission.create({
      data: {
        serviceId: coloracao.id,
        barberId: professional3.id,
        commissionRate: 60.0,
      },
    });

    // Criar Clientes
    const client1 = await prisma.client.create({
      data: {
        nome: 'Clara Vasconcelos',
        telefone: '11988887777',
        aniversario: '15/09',
        observacoes: 'Prefere chá de camomila morno. Faz coloração a cada 3 meses.',
        preferences: 'Corte Long Bob, luzes mel.',
        frequency: 6,
        ticketMedio: 220.0,
        chatStatus: 'CONFIRMED',
        origem: 'WhatsApp',
        tenantId: tenantDaVinci.id,
      },
    });

    const client2 = await prisma.client.create({
      data: {
        nome: 'Juliana Martins',
        telefone: '11977776666',
        aniversario: '22/01',
        preferences: 'Corte em camadas para dar volume.',
        frequency: 4,
        ticketMedio: 150.0,
        chatStatus: 'BOOKING',
        origem: 'Instagram',
        tenantId: tenantDaVinci.id,
      },
    });

    const client3 = await prisma.client.create({
      data: {
        nome: 'Beatriz Rocha',
        telefone: '11966665555',
        aniversario: '08/04',
        preferences: 'Corte Pixie moderno com nuca limpa.',
        frequency: 3,
        ticketMedio: 190.0,
        chatStatus: 'NEW',
        origem: 'Indicação',
        tenantId: tenantDaVinci.id,
      },
    });

    // Criar Agendamentos
    const hoje = new Date();
    await prisma.appointment.create({
      data: {
        clientId: client1.id,
        barberId: professional3.id,
        serviceId: escova.id,
        data: new Date(hoje.setHours(10, 0, 0, 0)),
        status: 'CONFIRMED',
        valor: escova.preco,
        tenantId: tenantDaVinci.id,
      },
    });

    await prisma.appointment.create({
      data: {
        clientId: client2.id,
        barberId: professional3.id,
        serviceId: coloracao.id,
        data: new Date(hoje.setHours(13, 0, 0, 0)),
        status: 'IN_PROGRESS',
        valor: coloracao.preco,
        tenantId: tenantDaVinci.id,
      },
    });

    // Criar Respostas Rápidas
    await prisma.quickReply.createMany({
      data: [
        {
          titulo: 'Confirmação',
          conteudo: 'Olá! Confirmamos seu horário agendado para hoje no salão Da Vinci.',
          tenantId: tenantDaVinci.id,
        },
        {
          titulo: 'Boas-vindas',
          conteudo: 'Olá! Seja muito bem-vindo(a) ao Da Vinci Premium. Como posso ajudar?',
          tenantId: tenantDaVinci.id,
        },
      ],
    });

    // Criar Grades de Trabalho
    const pros = [professional1.id, professional2.id, professional3.id];
    for (const proId of pros) {
      for (let day = 0; day <= 6; day++) {
        await prisma.workSchedule.create({
          data: {
            barberId: proId,
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '20:00',
            breakStart: '12:00',
            breakEnd: '13:00',
            active: day !== 0,
          },
        });
      }
    }

    console.log('Dados de demonstração inseridos.');
  }

  console.log('Seeding concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro durante o seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
