import { supabaseAdmin } from '../supabase'
import { Invoice } from '../types'

export async function getInvoices() {
  const { data, error } = await supabaseAdmin
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as Invoice[]
}

export async function getInvoiceById(id: string) {
  const { data, error } = await supabaseAdmin
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as Invoice
}

export async function createInvoice(invoice: Partial<Invoice>) {
  const { data, error } = await supabaseAdmin
    .from('invoices')
    .insert([invoice])
    .select()
    .single()
  
  if (error) throw error
  return data as Invoice
}

export async function updateInvoice(id: string, updates: Partial<Invoice>) {
  const { data, error } = await supabaseAdmin
    .from('invoices')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as Invoice
}

export async function deleteInvoice(id: string) {
  const { error } = await supabaseAdmin
    .from('invoices')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  return true
}
