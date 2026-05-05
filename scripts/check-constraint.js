const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:fVU5x7LroHcA1dTQ@db.icwebuepmihnpgxylifs.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const res = await client.query(`SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'quotations_created_by_fkey'`);
  console.log("Constraint definition:", res.rows);
  await client.end();
}

run().catch(console.error);
