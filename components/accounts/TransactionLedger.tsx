/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);
}

const TYPE_STYLES: Record<string, string> = {
  CREDIT: "bg-green-100 text-green-700 border-green-200",
  DEBIT: "bg-red-100 text-red-700 border-red-200",
};
const MODE_STYLES: Record<string, string> = {
  CASH: "bg-amber-100 text-amber-700",
  ONLINE: "bg-blue-100 text-blue-700",
  UPI: "bg-purple-100 text-purple-700",
  BANK_TRANSFER: "bg-indigo-100 text-indigo-700",
};

function getTxnType(t: any) {
  if (t.category === "INVOICE_ADVANCE") return "Advance";
  if (t.category === "INVOICE_BALANCE") return t.description?.toLowerCase().includes("partial") ? "Partial Payment" : "Balance Payment";
  if (t.category === "INVOICE_FULL_PAYMENT") return "Full Payment";
  return t.category.replace(/_/g, " ");
}

export function TransactionLedger() {
  const [modeTab, setModeTab] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const params = new URLSearchParams();
  if (modeTab !== "ALL") params.set("mode", modeTab);
  if (typeFilter) params.set("type", typeFilter);
  if (search) params.set("search", search);
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  params.set("page", String(page));
  params.set("limit", "50");

  const { data, isLoading } = useQuery({
    queryKey: ["accounts-transactions", params.toString()],
    queryFn: async () => {
      const res = await fetch(`/api/accounts/transactions?${params.toString()}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 15000,
  });

  const transactions: any[] = data?.data?.transactions || [];
  const totals = data?.data?.totals || {};
  const pagination = data?.data?.pagination || {};

  return (
    <div className="bg-white rounded-xl border border-brand-border shadow-sm overflow-hidden">
      <div className="p-4 border-b border-brand-border space-y-3">
        <h2 className="text-base font-bold text-brand-forest">Transaction Ledger</h2>

        {/* Mode Tabs */}
        <div className="flex gap-1 bg-brand-cream rounded-lg p-1 w-fit">
          {["ALL", "CASH", "ONLINE", "UPI"].map(tab => (
            <button key={tab} onClick={() => { setModeTab(tab); setPage(1); }}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${modeTab === tab ? "bg-brand-forest text-white shadow-sm" : "text-brand-muted hover:text-brand-forest"}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-2">
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            className="h-9 px-3 text-xs bg-brand-cream border border-brand-border rounded-lg outline-none">
            <option value="">All Types</option>
            <option value="CREDIT">Credits</option>
            <option value="DEBIT">Debits</option>
          </select>
          <input type="text" placeholder="Search description / invoice…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="h-9 px-3 text-xs bg-brand-cream border border-brand-border rounded-lg outline-none flex-1 min-w-[180px]"
          />
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="h-9 px-3 text-xs bg-brand-cream border border-brand-border rounded-lg outline-none" />
          <span className="text-brand-muted text-xs self-center">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="h-9 px-3 text-xs bg-brand-cream border border-brand-border rounded-lg outline-none" />
        </div>

        {/* Totals bar */}
        {totals && (
          <div className="flex flex-wrap gap-4 text-xs font-semibold">
            <span className="text-green-600">Credits: {fmt(totals.totalCredits || 0)}</span>
            <span className="text-slate-400">|</span>
            <span className="text-red-500">Debits: {fmt(totals.totalDebits || 0)}</span>
            <span className="text-slate-400">|</span>
            <span className={totals.netBalance >= 0 ? "text-brand-forest" : "text-red-600"}>
              Net: {fmt(totals.netBalance || 0)}
            </span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-10"><Loader2 className="w-7 h-7 animate-spin text-brand-forest" /></div>
      ) : transactions.length === 0 ? (
        <div className="p-8 text-center text-brand-muted text-sm">No transactions found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: "900px" }}>
            <thead className="bg-brand-cream text-brand-forest sticky top-0">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-bold">Invoice Number</th>
                <th className="px-3 py-2.5 text-left text-xs font-bold">Client / Party Name</th>
                <th className="px-3 py-2.5 text-left text-xs font-bold">Recorded By</th>
                <th className="px-3 py-2.5 text-left text-xs font-bold">Date</th>
                <th className="px-3 py-2.5 text-left text-xs font-bold">Mode of Payment</th>
                <th className="px-3 py-2.5 text-left text-xs font-bold">Transaction Type</th>
                <th className="px-3 py-2.5 text-right text-xs font-bold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t: any) => (
                <tr key={t.id}
                  className={`border-t border-brand-border/40 border-l-4 ${t.type === "CREDIT" ? "border-l-green-400 hover:bg-green-50/30" : "border-l-red-400 hover:bg-red-50/30"} transition-colors`}>
                  <td className="px-3 py-2.5 text-xs font-mono text-brand-forest font-bold">{t.invoiceNumber || "—"}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-700 font-medium">{t.invoice?.customerName || "—"}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-600 truncate max-w-[120px]" title={t.user?.name || "System"}>
                    {t.user?.name?.split(" ")[0] || "System"}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-brand-muted whitespace-nowrap">
                    {format(new Date(t.date), "dd MMM yyyy")}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${MODE_STYLES[t.mode] || "bg-slate-100 text-slate-600"}`}>
                      {t.mode}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold capitalize ${TYPE_STYLES[t.type] || ""}`}>
                      {getTxnType(t)}
                    </span>
                  </td>
                  <td className={`px-3 py-2.5 text-right font-bold text-sm ${t.type === "CREDIT" ? "text-green-600" : "text-red-500"}`}>
                    {t.type === "CREDIT" ? "+" : "−"}{fmt(Number(t.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.total > 50 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-brand-border bg-brand-cream/30">
          <span className="text-xs text-brand-muted">Showing {((page - 1) * 50) + 1}–{Math.min(page * 50, pagination.total)} of {pagination.total}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 text-xs border border-brand-border rounded-lg disabled:opacity-40 hover:bg-white transition-colors">←</button>
            <button disabled={page * 50 >= pagination.total} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 text-xs border border-brand-border rounded-lg disabled:opacity-40 hover:bg-white transition-colors">→</button>
          </div>
        </div>
      )}

    </div>
  );
}
