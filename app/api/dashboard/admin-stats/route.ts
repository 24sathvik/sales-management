export const dynamic = "force-dynamic";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-error";

export async function GET(req: Request) {
  try {
    const session = await auth();
    requireRole(session, "ADMIN"); // Protected
    
    const rateLimitResponse = checkRateLimit(req, session?.user?.id || null, 50);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(req.url);
    const numMonths = parseInt(searchParams.get("months") || "12");
    const catStartStr = searchParams.get("catStart");
    const catEndStr = searchParams.get("catEnd");
    
    const now = new Date();

    // Compute single date range covering all N months
    const rangeStart = new Date(now.getFullYear(), now.getMonth() - numMonths + 1, 1);

    // Category Distribution date range
    const catStart = catStartStr ? new Date(catStartStr) : rangeStart;
    const catEnd = catEndStr ? (() => { const d = new Date(catEndStr); d.setHours(23, 59, 59, 999); return d; })() : now;

    // Build the OR array for monthly expenses
    const expenseOrList = [];
    for (let i = 0; i < numMonths; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        expenseOrList.push({ month: d.getMonth() + 1, year: d.getFullYear() });
    }

    // Fetch ALL invoices, categories, purchases, and expenses in one parallel shot
    const [allInvoices, categoriesAggr, allPurchases, allExpenses] = await Promise.all([
      (prisma.invoice as any).findMany({
        where: { createdAt: { gte: rangeStart, lte: now }, deletedAt: null },
        select: { createdAt: true },
      }),
      (prisma.invoice as any).groupBy({
        by: ['category'],
        where: { createdAt: { gte: catStart, lte: catEnd }, deletedAt: null },
        _sum: { totalAmount: true },
      }),
      (prisma.purchase as any).findMany({
        where: { deletedAt: null, completedAt: { gte: rangeStart, lte: now } },
        select: { billValue: true, totalProductionCost: true, completedAt: true },
      }),
      (prisma.monthlyExpense as any).findMany({
        where: { deletedAt: null, OR: expenseOrList },
        select: { amount: true, month: true, year: true },
      })
    ]);

    // Bucket invoice data by month in JS
    const monthlyData = [];
    for (let i = numMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();

      const monthKey = d.toLocaleString("en-IN", { month: "short", year: "numeric" });
      
      const mPurchases = allPurchases.filter((p: any) => {
        const t = new Date(p.completedAt).getTime();
        return t >= mStart && t < mEnd;
      });
      const mExps = allExpenses.filter((e: any) => e.month === (d.getMonth() + 1) && e.year === d.getFullYear());

      // Use same formula as accounts/summary: grossProfit = billValue - totalProductionCost
      const mGrossRevenue = mPurchases.reduce((s: number, p: any) => s + Number(p.billValue || 0), 0);
      const mProductionCost = mPurchases.reduce((s: number, p: any) => s + Number(p.totalProductionCost || 0), 0);
      const mGrossProfit = mGrossRevenue - mProductionCost;
      const mExpTotal = mExps.reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
      
      const netProfit = mGrossProfit - mExpTotal;

      const monthInvoices = allInvoices.filter((inv: any) => {
        const t = new Date(inv.createdAt).getTime();
        return t >= mStart && t < mEnd;
      });

      monthlyData.push({
        month: monthKey,
        totalInvoices: monthInvoices.length,
        // Use purchase.billValue as revenue — identical to accounts/summary
        revenue: mGrossRevenue,
        netProfit,
      });
    }

    const categoryDistribution = categoriesAggr
      .map((c: any) => ({
        name: c.category || "Uncategorized",
        value: Number(c._sum.totalAmount || 0)
      }))
      .filter((c: any) => c.value > 0)
      .sort((a: any, b: any) => b.value - a.value);

    return NextResponse.json({ 
      success: true, 
      data: {
        monthlyData,
        categoryDistribution
      } 
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
