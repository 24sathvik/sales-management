const fs = require('fs');
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:fVU5x7LroHcA1dTQ@db.icwebuepmihnpgxylifs.supabase.co:5432/postgres?connection_limit=5&pool_timeout=30',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();

  const schemaStr = fs.readFileSync('prisma/schema.prisma', 'utf8');
  const checklistDef = schemaStr.split('model WIPChecklist {')[1].split('}')[0];
  
  const lines = checklistDef.split('\n');
  const fieldsToFix = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('@@') || trimmed.includes('@relation') || !trimmed.includes('Boolean')) {
      continue;
    }
    
    // e.g. "rm_billNumberVerified        Boolean @default(false)"
    const fieldMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s+Boolean/);
    if (fieldMatch) {
      const camelCaseName = fieldMatch[1];
      const lowerCaseName = camelCaseName.toLowerCase();
      
      // if it has uppercase characters (camelCase), we need to rename it from lowercase
      if (camelCaseName !== lowerCaseName) {
        fieldsToFix.push({ lowerCaseName, camelCaseName });
      }
    }
  }

  console.log(`Found ${fieldsToFix.length} columns to rename.`);
  
  for (const { lowerCaseName, camelCaseName } of fieldsToFix) {
    try {
      // Ignore errors if it's already renamed
      await client.query(`ALTER TABLE "WIPChecklist" RENAME COLUMN ${lowerCaseName} TO "${camelCaseName}";`);
      console.log(`Renamed ${lowerCaseName} -> "${camelCaseName}"`);
    } catch (e) {
      // console.log(`Skipped ${camelCaseName}: ${e.message}`);
    }
  }
  
  console.log("Database column casing aligned with Prisma expectations.");

  await client.end();
}

run().catch(console.error);
