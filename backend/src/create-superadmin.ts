import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'victorhugo@vtecsolutions.online'.toLowerCase().trim();
  const senha = 'Torugo123%'; 
  const nome = 'Victor Hugo';

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

  console.log('Super Admin criado com sucesso no banco local!');
  console.log('ID:', user.id);
  console.log('E-mail:', user.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
