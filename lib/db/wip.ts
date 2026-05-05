import { supabaseAdmin } from '../supabase'
import { WipCard, PipelineStage } from '../types'

export async function getWipCards() {
  const { data, error } = await supabaseAdmin
    .from('wip_cards')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as WipCard[]
}

export async function getWipCardByInvoiceId(invoice_id: string) {
  const { data, error } = await supabaseAdmin
    .from('wip_cards')
    .select('*')
    .eq('invoice_id', invoice_id)
    .single()
  
  if (error) throw error
  return data as WipCard
}

export async function createWipCard(wipCard: Partial<WipCard>) {
  const { data, error } = await supabaseAdmin
    .from('wip_cards')
    .insert([wipCard])
    .select()
    .single()
  
  if (error) throw error
  return data as WipCard
}

export async function updateWipStage(invoice_id: string, stage: PipelineStage, progress_current?: number) {
  const updates: Partial<WipCard> = { stage }
  if (progress_current !== undefined) {
    updates.progress_current = progress_current
  }

  const { data, error } = await supabaseAdmin
    .from('wip_cards')
    .update(updates)
    .eq('invoice_id', invoice_id)
    .select()
    .single()
  
  if (error) throw error
  return data as WipCard
}
