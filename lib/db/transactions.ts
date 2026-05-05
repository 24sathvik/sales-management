import { supabaseAdmin } from '../supabase'
import { Transaction } from '../types'

export async function getTransactions() {
  const { data, error } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .order('transaction_date', { ascending: false })
  
  if (error) throw error
  return data as Transaction[]
}

export async function getTransactionById(id: string) {
  const { data, error } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as Transaction
}

export async function createTransaction(transaction: Partial<Transaction>) {
  const { data, error } = await supabaseAdmin
    .from('transactions')
    .insert([transaction])
    .select()
    .single()
  
  if (error) throw error
  return data as Transaction
}

export async function updateTransaction(id: string, updates: Partial<Transaction>) {
  const { data, error } = await supabaseAdmin
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as Transaction
}

export async function deleteTransaction(id: string) {
  const { error } = await supabaseAdmin
    .from('transactions')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  return true
}
