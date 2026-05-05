import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { requireAuth } from "@/lib/auth-utils";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function InvoicesPage() {
  const user = await requireAuth();
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-syne tracking-tight text-brand-forest">Invoices</h1>
        <Link 
          href="/dashboard/invoices/new" 
          className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold shadow-md transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #1C3A2A 0%, #2D5A3D 100%)', color: '#FFFFFF' }}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Invoice
        </Link>
      </div>
      
      <InvoiceTable currentUserRole={user.role} />
    </div>
  );
}
