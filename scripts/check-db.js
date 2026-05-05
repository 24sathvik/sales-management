const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check existing users
  const users = await prisma.user.findMany({ 
    select: { id: true, name: true, email: true, role: true, createdAt: true }
  });
  console.log('=== USERS IN DB ===');
  console.log(JSON.stringify(users, null, 2));
  
  // Check admin user exists
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }});
  console.log('\n=== ADMIN EXISTS:', !!admin, '===');
  if (admin) {
    console.log('Admin email:', admin.email);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
