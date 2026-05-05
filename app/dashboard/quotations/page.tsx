"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Search, Plus, FileText, Eye, CheckCircle, XCircle, Download, Trash2, Calendar, Filter, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Quotation } from "@/lib/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadQuotations = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/quotations");
      const json = await res.json();
      
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load quotations");
      }
      let q = json.data || [];
      if (statusFilter !== "all") {
        q = q.filter((item: Quotation) => item.status === statusFilter);
      }
      setQuotations(q);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load quotations";
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, [statusFilter]);

  const handleAction = async (id: string, action: 'accept' | 'reject') => {
    try {
      const res = await fetch(`/api/quotations/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || `Failed to ${action}`);
      toast.success(data.message || `Quotation ${action}ed successfully`);
      loadQuotations();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : `Failed to ${action} quotation`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quotation? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/quotations/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete");
      toast.success("Quotation deleted successfully");
      loadQuotations();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete quotation");
    }
  };

  const handleDownload = async (quotation: Quotation) => {
    try {
      setDownloadingId(quotation.id);
      const { generateQuotationPdf } = await import("@/lib/pdf/generateQuotationPdf");
      await generateQuotationPdf(quotation);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredData = quotations.filter((q) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      q.customer_name?.toLowerCase().includes(term) ||
      q.quotation_number?.toLowerCase().includes(term)
    );
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-100 text-gray-700 border-gray-200";
      case "sent": return "bg-blue-100 text-blue-700 border-blue-200";
      case "accepted": return "bg-green-100 text-green-700 border-green-200";
      case "rejected": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const isExpired = (validUntil?: string | null) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date(new Date().setHours(0,0,0,0));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Quotations</h1>
          <p className="text-sm text-text-secondary mt-1">
            Create and manage customer quotations
          </p>
        </div>
        <Link 
          href="/dashboard/quotations/new"
          className="bg-accent hover:bg-accent-dark text-white shadow-sm flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 gap-2 shrink-0"
        >
          <Plus className="w-5 h-5 shrink-0" />
          <span>New Quotation</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-card border border-card-border rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by customer or QUO number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-sm transition-all text-text-primary bg-white"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border rounded-lg whitespace-nowrap">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm text-left">
            <thead className="bg-table-header text-text-secondary font-medium border-b border-card-border">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Quotation No</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4 whitespace-nowrap">Items</th>
                <th className="px-6 py-4 whitespace-nowrap">Total Amount</th>
                <th className="px-6 py-4 whitespace-nowrap">Valid Until</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border bg-white text-text-primary relative">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                      <p>Loading quotations...</p>
                    </div>
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={7}>
                    <ErrorState message={loadError} onRetry={loadQuotations} />
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={<FileText />}
                      title="No quotations found"
                      description={searchTerm || statusFilter !== "all"
                        ? "Try adjusting your filters to find what you're looking for."
                        : "You haven't created any quotations yet. Start by creating your first one."}
                      actionLabel={!searchTerm && statusFilter === "all" ? "New Quotation" : undefined}
                      onAction={!searchTerm && statusFilter === "all" ? () => window.location.href = "/dashboard/quotations/new" : undefined}
                    />
                  </td>
                </tr>
              ) : (
                filteredData.map((q) => {
                  const rowStyle = q.status === 'accepted' ? 'bg-green-50/40 hover:bg-green-50' : q.status === 'rejected' ? 'bg-red-50/40 hover:bg-red-50' : 'hover:bg-table-hover';
                  return (
                  <tr key={q.id} className={`${rowStyle} transition-colors group`}>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-primary">

                      {q.quotation_number || "Draft"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-text-primary">{q.customer_name}</div>
                      {q.customer_email && <div className="text-xs text-text-muted mt-0.5">{q.customer_email}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-text-secondary">
                      {Array.isArray(q.items) ? q.items.length : 0} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold">
                      ₹{Number(q.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {q.valid_until ? (
                        <div className={`flex items-center gap-1.5 ${isExpired(q.valid_until) ? 'text-danger font-medium' : 'text-text-secondary'}`}>
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(q.valid_until), "dd MMM yyyy")}
                        </div>
                      ) : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(q.status)}`}>
                        {getStatusLabel(q.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100">
                        <Link 
                          href={`/dashboard/quotations/${q.id}`}
                          className="p-1.5 text-text-secondary hover:text-primary hover:bg-slate-100 rounded-md transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        
                        <button 
                          onClick={() => handleDownload(q)}
                          disabled={downloadingId === q.id}
                          className="p-1.5 text-text-secondary hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
                          title="Download PDF"
                        >
                          {downloadingId === q.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        </button>
                        
                        {q.status === 'accepted' ? (
                           <Link 
                              href={q.invoice_id ? `/dashboard/invoices/${q.invoice_id}` : `/dashboard/invoices`} 
                              className="px-2 py-1 bg-green-100 text-green-700 hover:bg-green-200 text-xs font-semibold rounded transition-colors ml-1"
                           >
                              View Invoice →
                           </Link>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleAction(q.id, 'accept')}
                              className="p-1.5 text-text-secondary hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                              title="Accept Quotation"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleAction(q.id, 'reject')}
                              className="p-1.5 text-text-secondary hover:text-danger hover:bg-red-50 rounded-md transition-colors"
                              title="Reject Quotation"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(q.id)}
                              className="p-1.5 text-text-secondary hover:text-danger hover:bg-red-50 rounded-md transition-colors"
                              title="Delete Quotation"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder if needed */}
        {filteredData.length > 0 && (
          <div className="px-6 py-4 border-t border-card-border bg-slate-50 flex items-center justify-between">
            <span className="text-sm text-text-secondary">
              Showing <span className="font-medium text-text-primary">{filteredData.length}</span> quotations
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
