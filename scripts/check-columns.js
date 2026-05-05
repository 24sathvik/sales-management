const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:fVU5x7LroHcA1dTQ@db.icwebuepmihnpgxylifs.supabase.co:5432/postgres?connection_limit=5&pool_timeout=30',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'WIPChecklist'`);
  console.log("Columns:", res.rows.map(r => r.column_name));
  await client.end();
}

run().catch(console.error);
