export const dynamic = "force-dynamic";
/* eslint-disable @typescript-eslint/no-explicit-any */
// SECURITY CHECKLIST:
// - [x] Authentication (NextAuth auth())
// - [x] Role-Based Access Control (requireRole ADMIN)
// - [x] Input Validation (N/A)
// - [x] SQL Injection protection (Prisma ORM)
// - [x] Rate Limiting
// - [x] Unified Error Handler (handleApiError)

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { getCurrentCounterBalance } from "@/lib/accounts-utils";

export async function GET(req: Request) {
  try {
    const session = await auth();
    requireRole(session, "ADMIN");
    const rateLimitResponse = checkRateLimit(req, session?.user?.id || null, 100);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(now.getFullYear()));

    const monthStart = new Date(year, month - 1, 1);
    const nextMonthStart = new Date(year, month, 1);

    // --- Purchases this month ---
    const purchases = await (prisma as any).purchase.findMany({
      where: { deletedAt: null, completedAt: { gte: monthStart, lt: nextMonthStart } },
      select: { billValue: true, totalProductionCost: true, profit: true },
    });

    const grossRevenue = purchases.reduce((s: number, p: any) => s + Number(p.billValue), 0);
    const totalProductionCost = purchases.reduce((s: number, p: any) => s + Number(p.totalProductionCost), 0);
    const grossProfit = grossRevenue - totalProductionCost;

    // --- Monthly Expenses this month ---
    const expensesRaw = await (prisma as any).monthlyExpense.findMany({
      where: { month, year, deletedAt: null },
      select: { category: true, amount: true },
    });

    const expenseMap: Record<string, number> = {
      rent: 0, salary: 0, electricity: 0, fuel: 0, internet: 0, misc: 0, other: 0,
    };
    let totalExpenses = 0;
    for (const e of expensesRaw) {
      const cat = e.category.toLowerCase();
      expenseMap[cat] = (expenseMap[cat] || 0) + Number(e.amount);
      totalExpenses += Number(e.amount);
    }

    const netProfit = grossProfit - totalExpenses;
    const netProfitPercentage = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

    // --- Receivables ---
    const openInvoices = await (prisma as any).invoice.findMany({
      where: { balancePaid: false, deletedAt: null, status: "ACTIVE" },
      select: { balance: true },
    });
    const receivables = openInvoices.reduce((s: number, i: any) => s + Number(i.balance || 0), 0);

    // --- Counter Balance ---
    const counterBalance = await getCurrentCounterBalance();

    // --- Last 12 months trend ---
    const elevenMonthsAgo = new Date(year, month - 12, 1);
    
    const [allPurchases, allExpenses] = await Promise.all([
      (prisma as any).purchase.findMany({
        where: { deletedAt: null, completedAt: { gte: elevenMonthsAgo, lt: nextMonthStart } },
        select: { billValue: true, profit: true, completedAt: true },
      }),
      (prisma as any).monthlyExpense.findMany({
        where: { deletedAt: null, OR: Array.from({ length: 12 }).map((_, i) => {
          const d = new Date(year, month - 12 + i, 1);
          return { month: d.getMonth() + 1, year: d.getFullYear() };
        })},
        select: { amount: true, month: true, year: true },
      })
    ]);

    const monthlySales = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      
      const mStart = new Date(y, m - 1, 1).getTime();
      const mNextStart = new Date(y, m, 1).getTime();

      const mPurchases = allPurchases.filter((p: any) => {
        const t = new Date(p.completedAt).getTime();
        return t >= mStart && t < mNextStart;
      });
      const mExps = allExpenses.filter((e: any) => e.month === m && e.year === y);

      const mRevenue = mPurchases.reduce((s: number, p: any) => s + Number(p.billValue), 0);
      const mGrossProfit = mPurchases.reduce((s: number, p: any) => s + Number(p.profit), 0);
      const mExpTotal = mExps.reduce((s: number, e: any) => s + Number(e.amount), 0);

      monthlySales.push({
        month: d.toLocaleString("en-IN", { month: "short", year: "numeric" }),
        revenue: mRevenue,
        profit: mGrossProfit - mExpTotal,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        grossRevenue,
        totalProductionCost,
        grossProfit,
        expenses: {
          rent: expenseMap.rent,
          salaries: expenseMap.salary,
          electricity: expenseMap.electricity,
          fuel: expenseMap.fuel,
          internet: expenseMap.internet,
          misc: expenseMap.misc + expenseMap.other,
          total: totalExpenses,
        },
        netProfit,
        netProfitPercentage,
        receivables,
        counterBalance,
        monthlySales,
      }
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
