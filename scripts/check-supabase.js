const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://icwebuepmihnpgxylifs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imljd2VidWVwbWlobnBneHlsaWZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg0MDgwMiwiZXhwIjoyMDkxNDE2ODAyfQ.IU4fGZWtj4-nq0aqYo4mMOQyJRCaFTQSbPbheywR5So',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  console.log('=== Checking Supabase DB tables ===\n');

  // Check profiles table
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
  console.log('Profiles:', profiles?.length ?? 0, pErr ? '❌ ' + pErr.message : '✅');
  if (profiles?.length) console.log(JSON.stringify(profiles, null, 2));

  // Check quotations table
  const { data: quotations, error: qErr } = await supabase.from('quotations').select('id, quotation_number, customer_name, status').limit(5);
  console.log('\nQuotations:', quotations?.length ?? 0, qErr ? '❌ ' + qErr.message : '✅');

  // Check invoices table  
  const { data: invoices, error: iErr } = await supabase.from('invoices').select('id, invoice_number, customer_name, status').limit(5);
  console.log('Invoices:', invoices?.length ?? 0, iErr ? '❌ ' + iErr.message : '✅');

  // Check wip_cards
  const { data: wip, error: wErr } = await supabase.from('wip_cards').select('id, stage, from_quotation').limit(5);
  console.log('WIP Cards:', wip?.length ?? 0, wErr ? '❌ ' + wErr.message : '✅');

  // Check final_check_protocols
  const { data: fc, error: fcErr } = await supabase.from('final_check_protocols').select('id').limit(5);
  console.log('Final Check Protocols:', fc?.length ?? 0, fcErr ? '❌ ' + fcErr.message : '✅');

  // Check transactions
  const { data: tx, error: txErr } = await supabase.from('transactions').select('id').limit(5);
  console.log('Transactions:', tx?.length ?? 0, txErr ? '❌ ' + txErr.message : '✅');

  // Check account_credits and account_debits
  const { data: cr, error: crErr } = await supabase.from('account_credits').select('id').limit(5);
  console.log('Account Credits:', cr?.length ?? 0, crErr ? '❌ ' + crErr.message : '✅');

  const { data: db, error: dbErr } = await supabase.from('account_debits').select('id').limit(5);
  console.log('Account Debits:', db?.length ?? 0, dbErr ? '❌ ' + dbErr.message : '✅');

  // Check auth users via admin API
  const { data: authUsers, error: authErr } = await supabase.auth.admin.listUsers();
  console.log('\n=== Supabase Auth Users ===');
  if (authErr) {
    console.log('❌ Error:', authErr.message);
  } else {
    console.log('Auth users found:', authUsers?.users?.length ?? 0);
    authUsers?.users?.forEach(u => {
      console.log(' -', u.email, '| Role in meta:', u.user_metadata?.role, '| Profile role: checking...');
    });
  }
}

main().catch(console.error);
