const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:fVU5x7LroHcA1dTQ@db.icwebuepmihnpgxylifs.supabase.co:5432/postgres?connection_limit=5&pool_timeout=30',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const res = await client.query(`SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' and tablename = 'quotations'`);
  console.log("RLS Enabled:", res.rows);
  
  const res2 = await client.query(`SELECT * FROM pg_policies WHERE tablename = 'quotations';`);
  console.log("Policies:", res2.rows);

  const res3 = await client.query(`SELECT count(*) FROM quotations;`);
  console.log("Total Quotations in DB:", res3.rows);

  await client.end();
}

run().catch(console.error);
