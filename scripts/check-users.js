const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:fVU5x7LroHcA1dTQ@db.icwebuepmihnpgxylifs.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const res = await client.query(`SELECT id, email, role FROM profiles LIMIT 5;`);
  console.log("Profiles:", res.rows);
  
  const res2 = await client.query(`SELECT id, email, role FROM "User" LIMIT 5;`);
  console.log("Users:", res2.rows);
  
  await client.end();
}

run().catch(console.error);
