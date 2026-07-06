import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function test() {
  console.log('Iniciando script de verificação de criação de administrador...');

  // 1. Obter a Barbearia Vip no banco
  const vipTenant = await prisma.tenant.findUnique({
    where: { subdomain: 'barbearia-vip' },
    include: { users: true },
  });

  if (!vipTenant) {
    console.error('Barbearia Vip não encontrada! Certifique-se de que a semeação foi realizada ou a barbearia existe.');
    return;
  }

  console.log('Barbearia Vip encontrada. Usuários atuais:', vipTenant.users);

  // 2. Definir dados do Admin
  const adminEmail = 'owner-vip@appvenusta.com.br';
  const adminName = 'Dono Barbearia VIP';
  const adminPassword = 'vippassword123';

  // Obter token do Super Admin simulando chamada local ou simulando update via service
  // Como estamos testando o serviço diretamente, vamos emular a lógica do update
  console.log('Executando fluxo de atualização do Tenant no banco para associar administrador...');
  
  // Vamos apagar qualquer usuário anterior com o mesmo e-mail para não quebrar a restrição de unique
  await prisma.user.deleteMany({
    where: { email: adminEmail }
  });

  // Chamar o update da nossa service por código para verificar que a lógica do NestJS TenantsService.update funciona
  const { TenantsService } = require('./tenants/tenants.service');
  const service = new TenantsService(prisma);

  const updatedTenant = await service.update(vipTenant.id, {
    adminName,
    adminEmail,
    adminPassword,
  });

  console.log('Tenant atualizado com sucesso via TenantsService!');

  // Buscar novamente com usuários
  const reloadedTenant = await prisma.tenant.findUnique({
    where: { id: vipTenant.id },
    include: { users: true },
  });

  console.log('Tenant após atualização:', JSON.stringify(reloadedTenant, null, 2));

  if (reloadedTenant && reloadedTenant.users.length > 0) {
    const adminUser = reloadedTenant.users[0];
    console.log('SUCESSO: Administrador principal criado:', adminUser.email);
    
    // Validar se a senha foi hasheada com bcrypt
    const match = await bcrypt.compare(adminPassword, adminUser.senha);
    console.log('Validação da senha com bcrypt:', match ? 'CORRETA' : 'INCORRETA');
  } else {
    console.error('FALHA: Nenhum administrador foi associado ao tenant!');
  }
}

test().catch(console.error).finally(() => prisma.$disconnect());
