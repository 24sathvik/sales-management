import { supabaseAdmin } from '../supabase'
import { FinalCheckProtocol } from '../types'

export async function getFinalCheckProtocols() {
  const { data, error } = await supabaseAdmin
    .from('final_check_protocols')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as FinalCheckProtocol[]
}

export async function getFinalCheckByInvoiceId(invoice_id: string) {
  const { data, error } = await supabaseAdmin
    .from('final_check_protocols')
    .select('*')
    .eq('invoice_id', invoice_id)
    .single()
  
  if (error) throw error
  return data as FinalCheckProtocol
}

export async function createFinalCheckProtocol(protocol: Partial<FinalCheckProtocol>) {
  const { data, error } = await supabaseAdmin
    .from('final_check_protocols')
    .insert([protocol])
    .select()
    .single()
  
  if (error) throw error
  return data as FinalCheckProtocol
}

export async function updateFinalCheckProtocol(invoice_id: string, updates: Partial<FinalCheckProtocol>) {
  const { data, error } = await supabaseAdmin
    .from('final_check_protocols')
    .update(updates)
    .eq('invoice_id', invoice_id)
    .select()
    .single()
  
  if (error) throw error
  return data as FinalCheckProtocol
}
