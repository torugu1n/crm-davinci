import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // CONFIGURAÇÃO DOS DADOS DO NOVO SUPER ADMIN
  const email = 'seu-email@dominio.com'.toLowerCase().trim();
  const senha = 'sua-senha-segura'; 
  const nome = 'Super Admin Vtec';

  const existing = await prisma.user.findUnique({
    where: { email }
  });

  if (existing) {
    console.log(`Erro: Já existe um usuário com o e-mail "${email}".`);
    return;
  }

  const hashedPassword = await bcrypt.hash(senha, 10);

  const user = await prisma.user.create({
    data: {
      nome,
      email,
      senha: hashedPassword,
      role: 'SUPER_ADMIN',
      roles: ['SUPER_ADMIN'],
      tenantId: null,
    },
  });

  console.log('Super Admin criado com sucesso no banco!');
  console.log('ID:', user.id);
  console.log('E-mail:', user.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
