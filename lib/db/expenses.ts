import { supabaseAdmin } from '../supabase'
import { Expense } from '../types'

export async function getExpenses() {
  const { data, error } = await supabaseAdmin
    .from('expenses')
    .select('*')
    .order('expense_year', { ascending: false })
    .order('expense_month', { ascending: false })
  
  if (error) throw error
  return data as Expense[]
}

export async function getExpenseById(id: string) {
  const { data, error } = await supabaseAdmin
    .from('expenses')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as Expense
}

export async function createExpense(expense: Partial<Expense>) {
  const { data, error } = await supabaseAdmin
    .from('expenses')
    .insert([expense])
    .select()
    .single()
  
  if (error) throw error
  return data as Expense
}

export async function updateExpense(id: string, updates: Partial<Expense>) {
  const { data, error } = await supabaseAdmin
    .from('expenses')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as Expense
}

export async function deleteExpense(id: string) {
  const { error } = await supabaseAdmin
    .from('expenses')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  return true
}
