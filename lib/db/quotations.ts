import { supabaseAdmin } from '../supabase'
import { Quotation } from '../types'

export async function getQuotations() {
  const { data, error } = await supabaseAdmin
    .from('quotations')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as Quotation[]
}

export async function getQuotationById(id: string) {
  const { data, error } = await supabaseAdmin
    .from('quotations')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as Quotation
}

export async function createQuotation(quotation: Partial<Quotation>) {
  const { data, error } = await supabaseAdmin
    .from('quotations')
    .insert([quotation])
    .select()
    .single()
  
  if (error) throw error
  return data as Quotation
}

export async function updateQuotation(id: string, updates: Partial<Quotation>) {
  const { data, error } = await supabaseAdmin
    .from('quotations')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as Quotation
}

export async function deleteQuotation(id: string) {
  const { error } = await supabaseAdmin
    .from('quotations')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  return true
}
