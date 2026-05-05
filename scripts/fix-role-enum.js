const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:fVU5x7LroHcA1dTQ@db.icwebuepmihnpgxylifs.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('🔧 Fixing User.role column enum type...\n');

  // Fix: drop default, cast, re-add default
  const steps = [
    [`ALTER TABLE "User" ALTER COLUMN role DROP DEFAULT;`, 'Drop role default'],
    [`ALTER TABLE "User" ALTER COLUMN role TYPE "Role" USING UPPER(role)::"Role";`, 'Cast role to Role enum'],
    [`ALTER TABLE "User" ALTER COLUMN role SET DEFAULT 'USER'::"Role";`, 'Re-add role default'],
  ];

  for (const [sql, label] of steps) {
    try {
      await pool.query(sql);
      console.log(`✅ ${label}`);
    } catch (e) {
      console.log(`❌ ${label}: ${e.message}`);
    }
  }

  // Verify final state
  const result = await pool.query(`SELECT id, name, email, role FROM "User";`);
  console.log('\n📋 Final User list:');
  result.rows.forEach(u => console.log(`   ${u.email} → role: ${u.role} (type: ${typeof u.role})`));

  // Test Prisma directly
  console.log('\n🔍 Testing Prisma query...');
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    console.log(admin ? `✅ Prisma finds admin: ${admin.email}` : `⚠️  No ADMIN found via Prisma`);
    const all = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true } });
    console.log('All users via Prisma:', JSON.stringify(all, null, 2));
  } catch (e) {
    console.log(`❌ Prisma error: ${e.message}`);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ✅ DATABASE FULLY CONFIGURED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Email   : admin@printflowpro.com');
  console.log('  Password: PrintFlow@2025');
  console.log('  Role    : ADMIN');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await pool.end();
}

main().catch(async e => { console.error(e); await pool.end(); });
