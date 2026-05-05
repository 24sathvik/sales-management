import { supabaseAdmin } from '../supabase'
import { Purchase } from '../types'

export async function getPurchases() {
  const { data, error } = await supabaseAdmin
    .from('purchases')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as Purchase[]
}

export async function getPurchaseById(id: string) {
  const { data, error } = await supabaseAdmin
    .from('purchases')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as Purchase
}

export async function createPurchase(purchase: Partial<Purchase>) {
  const { data, error } = await supabaseAdmin
    .from('purchases')
    .insert([purchase])
    .select()
    .single()
  
  if (error) throw error
  return data as Purchase
}

export async function updatePurchase(id: string, updates: Partial<Purchase>) {
  const { data, error } = await supabaseAdmin
    .from('purchases')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as Purchase
}

export async function deletePurchase(id: string) {
  const { error } = await supabaseAdmin
    .from('purchases')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  return true
}
