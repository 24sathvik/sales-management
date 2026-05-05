const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:fVU5x7LroHcA1dTQ@db.icwebuepmihnpgxylifs.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const res = await client.query("SELECT column_name, column_default, is_nullable FROM information_schema.columns WHERE table_name = 'quotations';");
  console.log("Quotations table schema defaults:", res.rows);
  await client.end();
}

run().catch(console.error);
