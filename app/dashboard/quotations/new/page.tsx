"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Save, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { z } from "zod";

interface LineItem {
  id: string;
  description: string;
  uom: string;
  qty: number;
  unit_price: number;
}

const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  uom: z.string().min(1, "UOM is required"),
  qty: z.number().min(0.01, "Quantity must be > 0"),
  unit_price: z.number().min(0, "Unit price must be >= 0")
});

const quotationSchema = z.object({
  customerName: z.string().min(1, "Customer Name is required"),
  customerAddress: z.string().min(1, "Customer Address is required"),
  jobTitle: z.string().min(1, "Subject is required"),
  deliveryDate: z.string().min(1, "Date is required"),
});

export default function NewQuotationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form State
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  
  const [deliveryDate, setDeliveryDate] = useState("");
  
  useEffect(() => {
    setDeliveryDate(new Date().toISOString().split("T")[0]);
  }, []);

  const [items, setItems] = useState<LineItem[]>([
    { id: "1", description: "", uom: "Per kg", qty: 1, unit_price: 0 }
  ]);
  const [taxPercent, setTaxPercent] = useState<number>(18); // Default to 18% GST

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { id: Date.now().toString(), description: "", uom: "Per kg", qty: 1, unit_price: 0 }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      toast.error("You must have at least one line item.");
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + (item.qty * item.unit_price), 0);
  const taxAmount = subtotal * (taxPercent / 100);
  const cgst = taxAmount / 2;
  const sgst = taxAmount / 2;
  const totalAmount = subtotal + taxAmount;

  const validateForm = () => {
    try {
      quotationSchema.parse({
        customerName, customerAddress, jobTitle, deliveryDate
      });
      
      for (const item of items) {
        lineItemSchema.parse({
          description: item.description,
          uom: item.uom,
          qty: item.qty,
          unit_price: item.unit_price
        });
      }
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.issues?.forEach?.((e: any) => {
          if (e.path && e.path[0]) newErrors[e.path[0].toString()] = e.message;
        });
        setErrors(newErrors);
        toast.error("Please fill all required fields correctly.");
      }
      return false;
    }
  };

  const handleSave = async (status: 'draft' | 'sent') => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      // Create validUntil explicitly since we removed the field
      const validDate = new Date(deliveryDate);
      validDate.setDate(validDate.getDate() + 30); // Hardcoded validity as 30 days based on prompt

      const payload = {
        customer_name: customerName,
        customer_address: customerAddress,
        job_title: jobTitle,
        category: "General", // Required by DB schema
        delivery_date: deliveryDate,
        valid_until: validDate.toISOString().split("T")[0],
        
        items: items.map(({ description, uom, qty, unit_price }) => ({
          description, uom, qty, unit_price
        })),
        
        subtotal: Number(subtotal.toFixed(2)),
        tax_percent: taxPercent,
        tax_amount: Number(taxAmount.toFixed(2)),
        total_amount: Number(totalAmount.toFixed(2)),
        status: status,
      };

      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to save quotation");

      toast.success(`Quotation saved as ${status}.`);
      router.push('/dashboard/quotations');
    } catch (err: any) {
      toast.error(err.message || "Failed to save quotation.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/quotations" className="p-2 bg-white border border-card-border rounded-lg text-text-secondary hover:text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-primary">New Quotation</h1>
          <p className="text-sm text-text-secondary mt-1">Sunway Medical System Format</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form Sections */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* SECTION 1: Client Information */}
          <div className="bg-white border text-text-primary border-card-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-table-header border-b border-card-border">
              <h2 className="font-semibold text-primary">Quotation Details</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 md:col-span-1">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">To (Company/Hospital Name) *</label>
                <input 
                  type="text" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-accent outline-none ${errors.customerName ? 'border-danger' : 'border-card-border'}`}
                  placeholder="e.g. Gleneagles Global Hospital"
                />
                {errors.customerName && <p className="text-xs text-danger">{errors.customerName}</p>}
              </div>

              <div className="space-y-1.5 md:col-span-1">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Date *</label>
                <input 
                  type="date" 
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-accent outline-none ${errors.deliveryDate ? 'border-danger' : 'border-card-border'}`}
                />
                {errors.deliveryDate && <p className="text-xs text-danger">{errors.deliveryDate}</p>}
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Address *</label>
                <textarea 
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  rows={2}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-accent outline-none resize-none ${errors.customerAddress ? 'border-danger' : 'border-card-border'}`}
                  placeholder="e.g. Lakdikapool, Hyderabad, Telangana, 500036"
                />
                {errors.customerAddress && <p className="text-xs text-danger">{errors.customerAddress}</p>}
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Subject (Sub) *</label>
                <input 
                  type="text" 
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-accent outline-none ${errors.jobTitle ? 'border-danger' : 'border-card-border'}`}
                  placeholder="e.g. Quotation for Supply of Lead Sheet"
                />
                {errors.jobTitle && <p className="text-xs text-danger">{errors.jobTitle}</p>}
              </div>
            </div>
          </div>

          {/* SECTION 2: Line Items */}
          <div className="bg-white border text-text-primary border-card-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-table-header border-b border-card-border flex justify-between items-center">
              <h2 className="font-semibold text-primary">Line Items</h2>
            </div>
            
            <div className="p-0">

              {/* ── Desktop Table (md and up) ─────────────────────────────────────── */}
              <div className="hidden md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-text-secondary border-b border-card-border">
                    <tr>
                      <th className="px-3 py-3 font-semibold w-10 text-center">#</th>
                      <th className="px-3 py-3 font-semibold">Item Description</th>
                      <th className="px-3 py-3 font-semibold w-28">UOM / Display</th>
                      <th className="px-3 py-3 font-semibold w-24">Quantity</th>
                      <th className="px-3 py-3 font-semibold w-28">Unit Price (₹)</th>
                      <th className="px-3 py-3 font-semibold w-28 text-right">Total (₹)</th>
                      <th className="px-3 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-card-border">
                    {items.map((item, index) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-3 py-3 text-center text-text-secondary font-medium">{index + 1}</td>
                        <td className="px-3 py-3 min-w-[200px]">
                          <textarea
                            value={item.description}
                            onChange={(e) => updateItem(item.id, "description", e.target.value)}
                            className="w-full px-2 py-1.5 border border-card-border hover:border-accent focus:border-accent rounded-md outline-none bg-transparent resize-none text-sm"
                            placeholder="e.g. Lead Sheet 2mm, Total Weight: 1175 Kgs"
                            rows={2}
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="text"
                            value={item.uom}
                            onChange={(e) => updateItem(item.id, "uom", e.target.value)}
                            className="w-full px-2 py-1.5 border border-card-border hover:border-accent focus:border-accent rounded-md outline-none bg-transparent text-sm"
                            placeholder="Per kg"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.qty === 0 ? "" : item.qty}
                            onChange={(e) => updateItem(item.id, "qty", parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 border border-card-border hover:border-accent focus:border-accent rounded-md outline-none bg-transparent text-sm"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price === 0 ? "" : item.unit_price}
                            onChange={(e) => updateItem(item.id, "unit_price", parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 border border-card-border hover:border-accent focus:border-accent rounded-md outline-none bg-transparent text-sm"
                          />
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-primary">
                          ₹{(item.qty * item.unit_price).toFixed(2)}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1.5 text-slate-400 hover:text-danger hover:bg-red-50 rounded-md transition-colors"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile Card Stack (below md) ──────────────────────────────────── */}
              <div className="block md:hidden divide-y divide-card-border">
                {items.map((item, index) => (
                  <div key={item.id} className="p-4 space-y-3 bg-white">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Item #{index + 1}</span>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-danger hover:bg-red-50 rounded-md transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Item Description</label>
                      <textarea
                        value={item.description}
                        onChange={(e) => updateItem(item.id, "description", e.target.value)}
                        className="w-full px-3 py-2 border border-card-border hover:border-accent focus:border-accent rounded-md outline-none bg-transparent resize-none text-sm"
                        placeholder="e.g. Lead Sheet 2mm, Total Weight: 1175 Kgs"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">UOM / Display</label>
                        <input
                          type="text"
                          value={item.uom}
                          onChange={(e) => updateItem(item.id, "uom", e.target.value)}
                          className="w-full px-3 py-2 border border-card-border hover:border-accent focus:border-accent rounded-md outline-none bg-transparent text-sm"
                          placeholder="Per kg"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Quantity</label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.qty === 0 ? "" : item.qty}
                          onChange={(e) => updateItem(item.id, "qty", parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-card-border hover:border-accent focus:border-accent rounded-md outline-none bg-transparent text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Unit Price (₹)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price === 0 ? "" : item.unit_price}
                          onChange={(e) => updateItem(item.id, "unit_price", parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-card-border hover:border-accent focus:border-accent rounded-md outline-none bg-transparent text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Total (₹)</label>
                        <div className="px-3 py-2 bg-slate-50 border border-card-border rounded-md text-sm font-semibold text-primary">
                          ₹{(item.qty * item.unit_price).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-card-border bg-slate-50">
                <button
                  onClick={handleAddItem}
                  className="inline-flex items-center text-sm font-semibold text-primary hover:text-accent transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Line Item
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Totals & Actions */}
        <div className="space-y-6">
          <div className="bg-white border text-text-primary border-card-border rounded-xl shadow-sm p-6 sticky top-6">
            <h3 className="font-bold text-lg text-primary border-b border-card-border pb-4 mb-4">Summary</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-text-secondary items-center">
                <span>Subtotal</span>
                <span className="font-medium text-text-primary">₹ {subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-text-secondary items-center">
                <span>GST %</span>
                <select 
                  value={taxPercent} 
                  onChange={(e) => setTaxPercent(Number(e.target.value))}
                  className="px-2 py-1 border border-card-border rounded-md text-text-primary outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value={5}>5%</option>
                  <option value={18}>18%</option>
                </select>
              </div>

              {taxPercent > 0 && (
                <>
                  <div className="flex justify-between text-text-secondary items-center">
                    <span>CGST @{taxPercent/2}%</span>
                    <span className="font-medium text-text-primary">₹ {cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-text-secondary items-center">
                    <span>SGST @{taxPercent/2}%</span>
                    <span className="font-medium text-text-primary">₹ {sgst.toFixed(2)}</span>
                  </div>
                </>
              )}
              
              <div className="pt-4 mt-2 border-t border-card-border flex justify-between items-center">
                <span className="font-bold text-base text-primary">Total Amount</span>
                <span className="font-bold text-xl text-primary font-syne tracking-tight">₹ {totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <button
                onClick={() => handleSave('draft')}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save as Draft
              </button>
              <button
                onClick={() => handleSave('sent')}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg shadow-sm flex items-center justify-center transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Generate & Save
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
