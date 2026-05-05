import { supabaseAdmin } from '../supabase'
import { AccountCredit, AccountDebit } from '../types'

export async function getAccountCredits() {
  const { data, error } = await supabaseAdmin
    .from('account_credits')
    .select('*')
    .order('credit_date', { ascending: false })
  
  if (error) throw error
  return data as AccountCredit[]
}

export async function createAccountCredit(credit: Partial<AccountCredit>) {
  const { data, error } = await supabaseAdmin
    .from('account_credits')
    .insert([credit])
    .select()
    .single()
  
  if (error) throw error
  return data as AccountCredit
}

export async function getAccountDebits() {
  const { data, error } = await supabaseAdmin
    .from('account_debits')
    .select('*')
    .order('debit_date', { ascending: false })
  
  if (error) throw error
  return data as AccountDebit[]
}

export async function createAccountDebit(debit: Partial<AccountDebit>) {
  const { data, error } = await supabaseAdmin
    .from('account_debits')
    .insert([debit])
    .select()
    .single()
  
  if (error) throw error
  return data as AccountDebit
}
