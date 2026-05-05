"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { TeamPerformance } from "@/components/dashboard/TeamPerformance";
import { AdminAnalytics } from "@/components/dashboard/AdminAnalytics";
import { ZyOpsAdvisor } from "@/components/dashboard/ZyOpsAdvisor";
import {
  StatCard,
  StatCardPct,
  UrgentDeliveriesPanel,
  WIPSummaryBar,
  RecentInvoicesTable,
  RecentQuotationsCard,
  FinalCheckStatus,
  DashboardSkeleton,
} from "@/components/dashboard/DashboardComponents";
import {
  FileText,
  TrendingUp,
  Clock,
  AlertTriangle,
  Layers,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { RefreshButton } from "@/components/dashboard/RefreshButton";

export default function DashboardPage() {
  const { data: session } = useSession();

  const currentMonth = new Date().toISOString().slice(0, 7);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["dashboard-stats", currentMonth],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/stats?month=${currentMonth}`);
      if (!res.ok) throw new Error("Failed to load dashboard");
      const json = await res.json();
      return json.success ? json.data : json;
    },
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  // Fetch quotations separately from Supabase
  const { data: quotationsData } = useQuery({
    queryKey: ["dashboard-quotations", session?.user?.id],
    queryFn: async () => {
      let query = supabase
        .from("quotations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
        
      if (session?.user?.role !== "ADMIN" && session?.user?.id) {
        query = query.eq("created_by", session.user.id);
      }
      
      const { data: quotations } = await query;
      return quotations || [];
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const { data: quotationStats } = useQuery({
    queryKey: ["dashboard-quotation-stats", currentMonth, session?.user?.id],
    queryFn: async () => {
      const startOfMonth = `${currentMonth}-01`;
      let query = supabase
        .from("quotations")
        .select("status, created_at")
        .gte("created_at", startOfMonth);

      if (session?.user?.role !== "ADMIN" && session?.user?.id) {
        query = query.eq("created_by", session.user.id);
      }

      const { data: allQuotations } = await query;

      const all = allQuotations || [];
      const total = all.length;
      const sent = all.filter((q) => q.status === "sent").length;
      const accepted = all.filter((q) => q.status === "accepted").length;
      const conversionRate =
        total > 0 ? ((accepted / total) * 100).toFixed(1) : "0.0";
      return { total, sent, conversionRate };
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Dashboard</h1>
          <p className="text-sm text-text-secondary mt-1">
            ZyOps operational overview at a glance.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          title="Refresh Stats"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <DashboardSkeleton />
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 text-sm font-medium">
          Failed to load dashboard stats. Please try refreshing.
        </div>
      ) : (
        <>
          {/* 6 Stat Cards: 3 per row × 2 rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <StatCard
              label="Total Invoices"
              value={data.stats.totalInvoices}
              icon={FileText}
              accentClass="bg-indigo-700"
              href="/dashboard/invoices"
            />
            <StatCard
              label="Active Invoices"
              value={data.stats.activeInvoices}
              icon={TrendingUp}
              accentClass="bg-blue-600"
              href="/dashboard/invoices?filter=active"
            />
            <StatCard
              label="Deliveries This Week"
              value={data.stats.deliveriesThisWeek}
              icon={Clock}
              accentClass="bg-green-600"
              subLabel="Due within 7 days"
              href="/dashboard/invoices?filter=deliveries"
            />
            <StatCard
              label="Overdue Invoices"
              value={data.stats.overdueInvoices}
              icon={AlertTriangle}
              accentClass={data.stats.overdueInvoices > 0 ? "bg-red-600" : "bg-slate-400"}
              subLabel="Past delivery date"
              href="/dashboard/invoices?filter=overdue"
              isDanger={true}
            />
            <StatCard
              label="Total Quotations"
              value={quotationStats?.total ?? 0}
              icon={FileText}
              accentClass="bg-purple-600"
              subLabel={quotationStats?.sent ? `${quotationStats.sent} pending response` : undefined}
              href="/dashboard/quotations"
            />
            <StatCardPct
              label="Conversion Rate"
              value={Number(quotationStats?.conversionRate ?? 0)}
              icon={TrendingUp}
              accentClass="bg-amber-600"
              subLabel="Quotations to Invoices"
            />
          </div>

          {/* Row: Urgent + WIP Pipeline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm p-6">
              <UrgentDeliveriesPanel deliveries={data.urgentDeliveries} />
            </div>

            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold font-syne text-slate-800">WIP Pipeline</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{data.stats.totalWip} total items</p>
                </div>
                <Link
                  href="/dashboard/work-in-progress"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  Board <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <WIPSummaryBar phases={data.wipPhases} total={data.stats.totalWip} />
            </div>
          </div>

          {/* Row: Recent Invoices + Recent Quotations + Final Check */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Invoices */}
            <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold font-syne text-slate-800">Recent Invoices</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Last 10 created</p>
                </div>
                <Link
                  href="/dashboard/invoices"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <RecentInvoicesTable invoices={data.recentInvoices} />
            </div>

            {/* Right column: Recent Quotations + Final Check */}
            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold font-syne text-slate-800">Recent Quotations</h2>
                  <Link
                    href="/dashboard/quotations"
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    View All <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <RecentQuotationsCard quotations={quotationsData || []} />
              </div>

              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h2 className="text-base font-bold font-syne text-slate-800 mb-4">Final Check Status</h2>
                <FinalCheckStatus
                  pending={data.finalCheck.pending}
                  completedThisMonth={data.finalCheck.completedThisMonth}
                />
              </div>
            </div>
          </div>

          {/* Team Performance + Admin Analytics */}
          <TeamPerformance />
          {session?.user?.role === "ADMIN" && <AdminAnalytics />}

          {/* AI Sales Advisor Section */}
          <ZyOpsAdvisor />
        </>
      )}
    </div>
  );
}

