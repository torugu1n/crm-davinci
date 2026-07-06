import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany({
    include: {
      users: true,
    },
  });
  console.log('--- TENANTS & USERS ---');
  console.log(JSON.stringify(tenants, null, 2));
  
  const superAdmins = await prisma.user.findMany({
    where: { role: 'SUPER_ADMIN' }
  });
  console.log('--- SUPER ADMINS ---');
  console.log(JSON.stringify(superAdmins, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
