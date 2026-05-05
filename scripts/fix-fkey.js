const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:fVU5x7LroHcA1dTQ@db.icwebuepmihnpgxylifs.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  
  console.log("Dropping old constraint...");
  await client.query(`ALTER TABLE quotations DROP CONSTRAINT IF EXISTS quotations_created_by_fkey;`);
  
  console.log("Changing column type to match User table (TEXT)...");
  await client.query(`ALTER TABLE quotations ALTER COLUMN created_by TYPE TEXT USING created_by::text;`);

  console.log("Adding new constraint to User table...");
  await client.query(`
    ALTER TABLE quotations 
    ADD CONSTRAINT quotations_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES "User"(id) ON DELETE SET NULL;
  `);

  console.log("Constraint updated successfully.");
  await client.end();
}

run().catch(console.error);
