import { supabaseAdmin } from "@/lib/supabase";
import { startOfMonth as getStartOfMonth, endOfMonth as getEndOfMonth, addHours, subDays, startOfWeek, endOfWeek, isWithinInterval, startOfDay } from "date-fns";
import { cache } from "react";

export const getDashboardStats = cache(async (month: number, year: number) => {
  const startOfMonth = new Date(year, month - 1, 1).toISOString();
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
  
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  // Run in parallel
  const [invoiceStats, quotationStats, wipStats] = await Promise.all([
    supabaseAdmin
      .from('invoices')
      .select('id, status, finalDeliveryDate:finalDeliveryDate')
      .gte('createdAt', startOfMonth)
      .lte('createdAt', endOfMonth)
      .is('deletedAt', null),
    
    supabaseAdmin
      .from('quotations')
      .select('id, status')
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfMonth),
    
    supabaseAdmin
      .from('wip_cards')
      .select('id, phase')
      .is('deletedAt', null)
  ]);

  const invoices = invoiceStats.data || [];
  const quotations = quotationStats.data || [];
  const wipCards = wipStats.data || [];

  const activeInvoices = invoices.filter(i => i.status === 'ACTIVE');
  const closedInvoices = invoices.filter(i => i.status === 'CLOSED');
  
  // Deliveries this week (using finalDeliveryDate)
  const deliveriesThisWeek = activeInvoices.filter(i => {
    if (!i.finalDeliveryDate) return false;
    const delDate = new Date(i.finalDeliveryDate);
    return isWithinInterval(delDate, { start: weekStart, end: weekEnd });
  }).length;

  const overdueInvoices = activeInvoices.filter(i => {
    if (!i.finalDeliveryDate) return false;
    return new Date(i.finalDeliveryDate) < startOfDay(today);
  }).length;

  const pendingQuotations = quotations.filter(q => q.status === 'sent' || q.status === 'draft').length;
  const acceptedQuotations = quotations.filter(q => q.status === 'accepted').length;
  const totalQuotations = quotations.length;
  
  const wipByStage = {
    RAW_MATERIALS: wipCards.filter(w => w.phase === 'RAW_MATERIALS').length,
    DESIGN: wipCards.filter(w => w.phase === 'DESIGN').length,
    PRINTING: wipCards.filter(w => w.phase === 'PRINTING').length,
    POST_PRINTING: wipCards.filter(w => w.phase === 'POST_PRINTING').length,
    PAYMENT_PENDING: wipCards.filter(w => w.phase === 'PAYMENT_PENDING').length,
  };

  return {
    totalInvoices: invoices.length,
    activeInvoices: activeInvoices.length,
    closedInvoices: closedInvoices.length,
    overdueInvoices,
    deliveriesThisWeek,
    totalQuotations,
    pendingQuotations,
    acceptedQuotations,
    conversionRate: totalQuotations > 0 ? Math.round((acceptedQuotations / totalQuotations) * 100) : 0,
    activeWipItems: wipCards.length,
    wipByStage
  };
});

export const getFinancialSummary = cache(async (month: number, year: number) => {
  const startOfMonth = new Date(year, month - 1, 1).toISOString();
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

  const [counterTx, purchases, expenses] = await Promise.all([
    supabaseAdmin
      .from('counter_transactions')
      .select('amount, type')
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)
      .is('deletedAt', null),
      
    supabaseAdmin
      .from('purchases')
      .select('totalProductionCost')
      .gte('completedAt', startOfMonth)
      .lte('completedAt', endOfMonth)
      .is('deletedAt', null),
      
    supabaseAdmin
      .from('monthly_expenses')
      .select('amount')
      .eq('month', month)
      .eq('year', year)
      .is('deletedAt', null)
  ]);

  const transactions = counterTx.data || [];
  const prodPurchases = purchases.data || [];
  const monthlyExp = expenses.data || [];

  const grossRevenue = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const productionCosts = prodPurchases
    .reduce((sum, p) => sum + Number(p.totalProductionCost || 0), 0);
    
  const operatingExpenses = monthlyExp
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const netProfit = grossRevenue - (productionCosts + operatingExpenses);
  const profitMargin = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 100) : 0;

  return {
    grossRevenue,
    productionCosts,
    operatingExpenses,
    netProfit,
    profitMargin
  };
});

export const getUrgentDeliveries = cache(async () => {
  const today = new Date();
  const twoDaysFromNow = addHours(today, 48).toISOString();
  const yesterday = subDays(today, 1).toISOString(); // Include slightly overdue to be safe

  const { data } = await supabaseAdmin
    .from('invoices')
    .select(`
      id, 
      invoiceNumber, 
      customerName, 
      finalDeliveryDate, 
      status,
      assignee:users!invoices_assigneeId_fkey(name)
    `)
    .eq('status', 'ACTIVE')
    .lte('finalDeliveryDate', twoDaysFromNow)
    .gte('finalDeliveryDate', yesterday)
    .is('deletedAt', null)
    .order('finalDeliveryDate', { ascending: true })
    .limit(10);

  return data || [];
});

export const getRecentInvoices = cache(async () => {
  const { data } = await supabaseAdmin
    .from('invoices')
    .select(`
      id, 
      invoiceNumber, 
      customerName, 
      totalAmount, 
      finalDeliveryDate, 
      status,
      category,
      assignee:users!invoices_assigneeId_fkey(name)
    `)
    .is('deletedAt', null)
    .order('createdAt', { ascending: false })
    .limit(8);

  return data || [];
});

export const getRecentQuotations = cache(async () => {
  const { data } = await supabaseAdmin
    .from('quotations')
    .select('id, quotation_number, customer_name, total_amount, status, valid_until, invoice_id')
    .order('created_at', { ascending: false })
    .limit(5);

  return data || [];
});
