const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://postgres:ncwFypplTAIUpgFbIvNebAmTgEYpNdbr@kodama.proxy.rlwy.net:40457/railway',
      },
    },
  });

  try {
    const users = await prisma.user.findMany({
      include: { barber: true },
    });

    console.log('Testing passwords for all users:');
    for (const user of users) {
      // Test common passwords
      const possiblePasswords = [
        'admin1',
        'demo1',
        'atendente1',
        'barbeiro1',
        'cabeleireira1',
        'manicure2',
        'admin',
        'atendente',
        'profissional1',
        'profissional'
      ];

      let found = null;
      for (const p of possiblePasswords) {
        if (await bcrypt.compare(p, user.senha)) {
          found = p;
          break;
        }
      }

      console.log(`User: ${user.nome} (${user.email}), Role: ${user.role}, IsActive: ${user.isActive}`);
      console.log(`  Password comparison matches: ${found ? found : 'NO MATCH IN POSSIBLE LIST'}`);
      console.log(`  Hashed password: ${user.senha}`);
    }
  } catch (err) {
    console.error('Error testing:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
