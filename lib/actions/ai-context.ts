import { supabase } from "@/lib/supabase";

export async function fetchAIContext() {
  try {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);

    // Get Invoices
    const { data: invoices } = await supabase.from('invoices').select('*');
    // Get Quotations
    const { data: quotations } = await supabase.from('quotations').select('*');
    // Get WIP
    const { data: wipCards } = await supabase.from('wip_cards').select('*');

    const invs = invoices || [];
    const quos = quotations || [];
    const wips = wipCards || [];

    // Calculations
    const totalInvoices = invs.length;
    const activeInvoices = invs.filter(i => i.status === 'active').length;
    
    // Simulate overdue (delivery_date < today and status active)
    const todayStr = now.toISOString().split('T')[0];
    const overdueInvoices = invs.filter(i => i.status === 'active' && i.delivery_date && i.delivery_date < todayStr).length;

    // Financials
    const grossRevenue = invs.reduce((acc, i) => acc + Number(i.bill_value || 0), 0);
    const pendingReceivables = invs.reduce((acc, i) => acc + Number(i.balance_due || 0), 0);
    
    // Simulated industry averages based on gross if actual costs aren't explicitly tracked per item
    // In actual production, we might sum up raw_material entries.
    const productionCosts = grossRevenue * 0.58; // approx 58% COGS
    const grossProfit = grossRevenue - productionCosts;
    const netProfit = grossProfit - (grossRevenue * 0.15); // minus overheads
    
    // Quotations Analysis
    const totalQuotations = quos.length;
    const acceptedQuos = quos.filter(q => q.status === 'accepted').length;
    const conversionRate = totalQuotations > 0 ? Math.round((acceptedQuos / totalQuotations) * 100) : 0;

    // WIP
    const activeWipItems = wips.filter(w => w.phase !== 'COMPLETED').length;

    return {
      grossRevenue,
      productionCosts,
      grossProfit,
      netProfit,
      totalInvoices,
      activeInvoices,
      overdueInvoices,
      pendingReceivables,
      totalQuotations,
      conversionRate,
      activeWipItems,
      currentMonth,
      counterBalance: pendingReceivables
    };
  } catch (error) {
    console.error("AI Context fetch failed:", error);
    // Return sensible fallback to not break AI
    return {
      grossRevenue: 0, productionCosts: 0, grossProfit: 0, netProfit: 0,
      totalInvoices: 0, activeInvoices: 0, overdueInvoices: 0,
      pendingReceivables: 0, totalQuotations: 0, conversionRate: 0,
      activeWipItems: 0, currentMonth: "Unknown", counterBalance: 0
    };
  }
}
