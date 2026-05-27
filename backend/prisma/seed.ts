import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o seeding do banco de dados com foco unissex e feminino...');

  // 1. Limpar banco de dados anterior
  await prisma.productCommission.deleteMany({});
  await prisma.feedback.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.workSchedule.deleteMany({});
  await prisma.agendaBlock.deleteMany({});
  await prisma.barber.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.quickReply.deleteMany({});
  await prisma.goal.deleteMany({});
  await prisma.auditLog.deleteMany({});

  // 2. Criar Serviços com foco em Salão Premium (Foco Feminino + Cortes Masculinos)
  const corteFeminino = await prisma.service.create({
    data: { nome: 'Corte Feminino Premium', preco: 180.0, duracao: 60 },
  });
  const escova = await prisma.service.create({
    data: { nome: 'Escova & Hidratação Imperial', preco: 120.0, duracao: 45 },
  });
  const coloracao = await prisma.service.create({
    data: { nome: 'Coloração & Mechas Da Vinci', preco: 280.0, duracao: 120 },
  });
  const corteMasculino = await prisma.service.create({
    data: { nome: 'Corte Masculino Premium', preco: 90.0, duracao: 45 },
  });
  const barba = await prisma.service.create({
    data: { nome: 'Barba & Toalha Quente', preco: 60.0, duracao: 30 },
  });
  const manicure = await prisma.service.create({
    data: { nome: 'Manicure & Pedicure Premium', preco: 85.0, duracao: 60 },
  });

  console.log('Serviços criados com sucesso!');

  const prodShampoo = await prisma.product.create({
    data: {
      nome: 'Shampoo Repair Da Vinci',
      preco: 89.9,
      descricao: 'Shampoo de tratamento para manutenção premium pós-coloração e hidratação.',
      commissionRate: 10.0,
    },
  });

  const prodMascara = await prisma.product.create({
    data: {
      nome: 'Máscara Nutritiva Imperial',
      preco: 129.9,
      descricao: 'Máscara capilar de nutrição intensa para uso semanal.',
      commissionRate: 12.0,
    },
  });

  const prodPomada = await prisma.product.create({
    data: {
      nome: 'Pomada Matte Signature',
      preco: 59.9,
      descricao: 'Pomada de fixação média com acabamento seco para penteados masculinos.',
      commissionRate: 8.0,
    },
  });

  const prodOleo = await prisma.product.create({
    data: {
      nome: 'Óleo Finalizador Golden Touch',
      preco: 74.9,
      descricao: 'Óleo leve para brilho e controle de frizz sem pesar nos fios.',
      commissionRate: 15.0,
    },
  });

  console.log('Produtos criados com sucesso!');

  // Senhas hash
  const adminSenha = await bcrypt.hash('admin1', 10);
  const demoSenha = await bcrypt.hash('demo1', 10);
  const atendenteSenha = await bcrypt.hash('atendente1', 10);
  const barber1Senha = await bcrypt.hash('barbeiro1', 10);
  const hairdresser1Senha = await bcrypt.hash('cabeleireira1', 10);
  const manicure2Senha = await bcrypt.hash('manicure2', 10);

  // 3. Criar Usuários (Incluindo estilistas masculinos e femininos)
  const userAdmin = await prisma.user.create({
    data: {
      nome: 'Administrador 1',
      email: 'admin1@salao.com',
      senha: adminSenha,
      role: 'ADMIN',
    },
  });

  const userAtendente = await prisma.user.create({
    data: {
      nome: 'Atendente 1',
      email: 'atendente1@salao.com',
      senha: atendenteSenha,
      role: 'ATTENDANT',
    },
  });

  await prisma.user.create({
    data: {
      nome: 'Conta Demo',
      email: 'demo1@salao.com',
      senha: demoSenha,
      role: 'ADMIN',
      roles: ['ADMIN'],
    },
  });

  const userAlessandro = await prisma.user.create({
    data: {
      nome: 'Barbeiro 1',
      email: 'barbeiro1@salao.com',
      senha: barber1Senha,
      role: 'BARBER',
      roles: ['BARBER'],
    },
  });

  const userMarcus = await prisma.user.create({
    data: {
      nome: 'Cabeleireira 1',
      email: 'cabeleireira1@salao.com',
      senha: hairdresser1Senha,
      role: 'HAIRDRESSER',
      roles: ['HAIRDRESSER'],
    },
  });

  const userMariana = await prisma.user.create({
    data: {
      nome: 'Manicure 2',
      email: 'manicure2@salao.com',
      senha: manicure2Senha,
      role: 'MANICURE_PEDICURE',
      roles: ['MANICURE_PEDICURE'],
    },
  });

  console.log('Usuários criados com sucesso!');

  // 4. Criar Profissionais (Barbers/Stylists)
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

  // Criar comissões customizadas de produtos
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

  console.log('Profissionais cadastrados com sucesso!');

  // 5. Criar Clientes CRM (Foco misto, predominantemente feminino)
  const client1 = await prisma.client.create({
    data: {
      nome: 'Clara Vasconcelos',
      telefone: '11988887777',
      aniversario: '15/09',
      observacoes: 'Prefere chá de camomila morno. Faz coloração a cada 3 meses. Evitar secador excessivamente quente.',
      preferences: 'Corte Long Bob, luzes mel, finalização com ondas suaves.',
      frequency: 6,
      ticketMedio: 220.0,
      chatStatus: 'CONFIRMED',
      origem: 'WhatsApp',
    },
  });

  const client2 = await prisma.client.create({
    data: {
      nome: 'Juliana Martins',
      telefone: '11977776666',
      aniversario: '22/01',
      observacoes: 'Cabelo cacheado 3B. Gosta de espumante brut durante os procedimentos longos.',
      preferences: 'Corte em camadas para dar volume, hidratação profunda sem sulfatos.',
      frequency: 4,
      ticketMedio: 150.0,
      chatStatus: 'BOOKING',
      origem: 'Instagram',
    },
  });

  const client3 = await prisma.client.create({
    data: {
      nome: 'Beatriz Rocha',
      telefone: '11966665555',
      aniversario: '08/04',
      observacoes: 'Gosta de silêncio e discrição no atendimento.',
      preferences: 'Corte Pixie moderno com nuca limpa, coloração tom ruivo acobreado.',
      frequency: 3,
      ticketMedio: 190.0,
      chatStatus: 'NEW',
      origem: 'Indicação',
    },
  });

  const client4 = await prisma.client.create({
    data: {
      nome: 'Enzo Rossi',
      telefone: '11955554444',
      aniversario: '30/11',
      observacoes: 'Prefere café expresso curto e sem açúcar. Corte com máquina e tesoura.',
      preferences: 'Corte masculino clássico com laterais disfarçadas na máquina 2.',
      frequency: 8,
      ticketMedio: 90.0,
      chatStatus: 'COMPLETED',
      origem: 'WhatsApp',
    },
  });

  const client5 = await prisma.client.create({
    data: {
      nome: 'Lucas Silva',
      telefone: '11944443333',
      aniversario: '12/07',
      observacoes: 'Sensibilidade na pele ao fazer a barba. Usar loção pós-barba de calêndula.',
      preferences: 'Corte masculino degradê médio, barba apenas aparada e desenhada.',
      frequency: 5,
      ticketMedio: 110.0,
      chatStatus: 'CONFIRMED',
      origem: 'Google',
    },
  });

  console.log('Clientes CRM cadastrados com sucesso!');

  // 6. Criar Histórico de Agendamentos Concluídos (para gráficos)
  const pastDates = [
    new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 dias atrás
    new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 dias atrás
    new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 dias atrás
    new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 dias atrás
    new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // ontem
  ];

  const app1 = await prisma.appointment.create({
    data: {
      clientId: client1.id,
      barberId: professional3.id,
      serviceId: coloracao.id,
      data: new Date(pastDates[0].setHours(10, 0, 0, 0)),
      status: 'COMPLETED',
      valor: coloracao.preco,
    },
  });

  const app2 = await prisma.appointment.create({
    data: {
      clientId: client2.id,
      barberId: professional2.id,
      serviceId: corteFeminino.id,
      data: new Date(pastDates[1].setHours(14, 0, 0, 0)),
      status: 'COMPLETED',
      valor: corteFeminino.preco,
    },
  });

  const app3 = await prisma.appointment.create({
    data: {
      clientId: client3.id,
      barberId: professional3.id,
      serviceId: escova.id,
      data: new Date(pastDates[2].setHours(16, 0, 0, 0)),
      status: 'COMPLETED',
      valor: escova.preco,
    },
  });

  const app4 = await prisma.appointment.create({
    data: {
      clientId: client4.id,
      barberId: professional1.id,
      serviceId: corteMasculino.id,
      data: new Date(pastDates[3].setHours(11, 0, 0, 0)),
      status: 'COMPLETED',
      valor: corteMasculino.preco,
    },
  });

  const app5 = await prisma.appointment.create({
    data: {
      clientId: client5.id,
      barberId: professional1.id,
      serviceId: corteMasculino.id,
      data: new Date(pastDates[4].setHours(15, 0, 0, 0)),
      status: 'COMPLETED',
      valor: corteMasculino.preco,
    },
  });

  console.log('Agendamentos passados concluídos criados!');

  // 7. Criar Feedbacks
  await prisma.feedback.create({
    data: {
      appointmentId: app1.id,
      nota: 5,
      comentario: 'Coloração impecável com a Mariana. O tom de mechas mel ficou fantástico!',
      ratingBarber: 5,
      ratingEnv: 5,
      ratingPunctual: '5',
    },
  });

  await prisma.feedback.create({
    data: {
      appointmentId: app2.id,
      nota: 5,
      comentario: 'Corte feminino moderno, adorei o visagismo sugerido pelo Marcus.',
      ratingBarber: 5,
      ratingEnv: 5,
      ratingPunctual: '5',
    },
  });

  await prisma.feedback.create({
    data: {
      appointmentId: app3.id,
      nota: 5,
      comentario: 'A escova com hidratação dura dias, atendimento espetacular com chás aromáticos.',
      ratingBarber: 5,
      ratingEnv: 5,
      ratingPunctual: '5',
    },
  });

  console.log('Feedbacks dos atendimentos passados gerados!');

  // 8. Criar Agendamentos de Hoje/Amanhã
  const hoje = new Date();
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);

  // Hoje
  await prisma.appointment.create({
    data: {
      clientId: client1.id,
      barberId: professional3.id,
      serviceId: escova.id,
      data: new Date(hoje.setHours(10, 0, 0, 0)),
      status: 'CONFIRMED',
      valor: escova.preco,
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
    },
  });

  await prisma.appointment.create({
    data: {
      clientId: client3.id,
      barberId: professional2.id,
      serviceId: corteFeminino.id,
      data: new Date(hoje.setHours(15, 0, 0, 0)),
      status: 'CHECKED_IN',
      valor: corteFeminino.preco,
    },
  });

  // Amanhã
  await prisma.appointment.create({
    data: {
      clientId: client4.id,
      barberId: professional1.id,
      serviceId: corteMasculino.id,
      data: new Date(amanha.setHours(14, 0, 0, 0)),
      status: 'SCHEDULED',
      valor: corteMasculino.preco,
    },
  });

  await prisma.appointment.create({
    data: {
      clientId: client5.id,
      barberId: professional1.id,
      serviceId: corteMasculino.id,
      data: new Date(amanha.setHours(11, 0, 0, 0)),
      status: 'SCHEDULED',
      valor: corteMasculino.preco,
    },
  });

  console.log('Agendamentos de hoje/amanhã inseridos!');

  // 9. Criar Conversas do WhatsApp
  await prisma.message.create({
    data: {
      clientId: client1.id,
      mensagem: 'Olá! Quero agendar uma escova e hidratação para a próxima terça.',
      tipo: 'RECEIVED',
    },
  });

  await prisma.message.create({
    data: {
      clientId: client1.id,
      mensagem: 'Com certeza Clara! Agendamos com a Mariana às 10:00. Combinado?',
      tipo: 'SENT',
    },
  });

  await prisma.message.create({
    data: {
      clientId: client1.id,
      mensagem: 'Perfeito! Obrigado pelo retorno rápido.',
      tipo: 'RECEIVED',
    },
  });

  console.log('Mensagens iniciais do simulador gravadas!');

  // 10. Criar Grades de Trabalho Semanais (Segunda a Sábado, 09h às 20h, almoço 12h-13h)
  const pros = [professional1.id, professional2.id, professional3.id];
  for (const proId of pros) {
    // 0 = Domingo (inativo), 1 a 6 = Segunda a Sábado
    for (let day = 0; day <= 6; day++) {
      await prisma.workSchedule.create({
        data: {
          barberId: proId,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '20:00',
          breakStart: '12:00',
          breakEnd: '13:00',
          active: day !== 0, // Domingo inativo por padrão
        },
      });
    }
  }
  console.log('Grades de trabalho semanais criadas!');

  // 11. Criar Indisponibilidade/Bloqueio temporário (ex: Almoço ou Férias)
  await prisma.agendaBlock.create({
    data: {
      barberId: professional1.id,
      titulo: 'Bloqueio de Almoço',
      dataInicio: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 12, 0, 0),
      dataFim: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 13, 0, 0),
    },
  });
  console.log('Bloqueio de agenda de teste criado!');

  // 12. Criar Respostas Rápidas
  await prisma.quickReply.createMany({
    data: [
      {
        titulo: 'Confirmação',
        conteudo: 'Olá! Confirmamos seu horário agendado para hoje no salão Da Vinci. Aguardamos sua visita!',
      },
      {
        titulo: 'Boas-vindas',
        conteudo: 'Olá! Seja muito bem-vindo(a) ao Da Vinci Premium. Como posso te ajudar hoje?',
      },
      {
        titulo: 'Atraso',
        conteudo: 'Olá! Tivemos um pequeno imprevisto na agenda de hoje e seu atendimento pode atrasar cerca de 10 minutos. Tudo bem para você?',
      },
    ],
  });
  console.log('Modelos de respostas rápidas criados!');

  // 13. Criar Metas do Mês
  const dataInicioMeta = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const dataFimMeta = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);
  
  await prisma.goal.create({
    data: {
      titulo: 'Meta de Faturamento Mensal',
      tipo: 'BILLING',
      valorAlvo: 15000.0,
      valorAtual: 900.0, // Faturamento simulado atual
      dataInicio: dataInicioMeta,
      dataFim: dataFimMeta,
    },
  });

  await prisma.goal.create({
    data: {
      titulo: 'Meta de Atendimentos Mensal',
      tipo: 'SERVICES',
      valorAlvo: 100.0,
      valorAtual: 25.0,
      dataInicio: dataInicioMeta,
      dataFim: dataFimMeta,
    },
  });
  console.log('Metas financeiras/operacionais criadas!');

  // 14. Criar Logs de Auditoria
  await prisma.auditLog.createMany({
    data: [
      {
        usuario: 'Administrador 1',
        acao: 'Cadastro de Profissional',
        detalhes: 'Profissional Manicure 2 cadastrado com sucesso no sistema.',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        usuario: 'Atendente 1',
        acao: 'Agendamento Criado',
        detalhes: 'Agendamento criado para Clara Vasconcelos no dia ' + hoje.toLocaleDateString(),
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        usuario: 'Administrador 1',
        acao: 'Alteração de Comissão',
        detalhes: 'Comissão do produto Shampoo Repair alterada para 20% para a profissional Manicure 2.',
        createdAt: new Date(),
      },
    ],
  });
  console.log('Logs de auditoria iniciais gravados!');

  console.log('Seeding concluído com total sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro durante o seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
