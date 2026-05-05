/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";
import { invoiceSchema } from "@/lib/validations";
import dynamic from "next/dynamic";

const PDFDownloadButton = dynamic(
  () => import("./PDFDownloadButton"),
  { ssr: false }
);

type FormValues = z.infer<typeof invoiceSchema>;

interface InvoiceItem {
  id: string;
  description: string;
  hsn: string;
  qty: number;
  rate: number;
  uom: string;
}

export function InvoiceForm({ initialData, invoiceId }: {
  initialData?: Partial<FormValues> & { invoiceNumber?: string, balance?: number };
  invoiceId?: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);

  // Custom Fields for Sunway Medical System
  const [customerAddress, setCustomerAddress] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [buyersOrderNo, setBuyersOrderNo] = useState("");
  const [despatchDocNo, setDespatchDocNo] = useState("");
  const [despatchDated, setDespatchDated] = useState("");
  const [despatchedThrough, setDespatchedThrough] = useState("");
  const [destination, setDestination] = useState("");
  const [termsOfDelivery, setTermsOfDelivery] = useState("");
  const [gstPercent, setGstPercent] = useState(5);
  
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "1", description: "", hsn: "", qty: 1, rate: 0, uom: "1 Nos" }
  ]);

  // Load existing complex payload if editing
  useEffect(() => {
    if (initialData?.additionalNotes) {
      try {
        const parsed = JSON.parse(initialData.additionalNotes);
        if (parsed.customerAddress) setCustomerAddress(parsed.customerAddress);
        if (parsed.deliveryNote) setDeliveryNote(parsed.deliveryNote);
        if (parsed.paymentTerms) setPaymentTerms(parsed.paymentTerms);
        if (parsed.buyersOrderNo) setBuyersOrderNo(parsed.buyersOrderNo);
        if (parsed.despatchDocNo) setDespatchDocNo(parsed.despatchDocNo);
        if (parsed.despatchDated) setDespatchDated(parsed.despatchDated);
        if (parsed.despatchedThrough) setDespatchedThrough(parsed.despatchedThrough);
        if (parsed.destination) setDestination(parsed.destination);
        if (parsed.termsOfDelivery) setTermsOfDelivery(parsed.termsOfDelivery);
        if (parsed.gstPercent !== undefined) setGstPercent(parsed.gstPercent);
        if (parsed.items && Array.isArray(parsed.items)) setItems(parsed.items);
      } catch (e) {
        console.error("Failed to parse additionalNotes", e);
      }
    }
  }, [initialData]);

  const { data: nextNumberData } = useQuery({
    queryKey: ["next-invoice-number"],
    queryFn: async () => {
      const res = await fetch("/api/invoices/next-number");
      if (!res.ok) throw new Error("Failed to fetch next number");
      return res.json();
    },
    enabled: !invoiceId, 
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(invoiceSchema) as any,
    defaultValues: (initialData as FormValues) || {
      date: new Date().toISOString().slice(0, 10),
      quantity: 1,
      unitRate: 0,
      advancePaid: false,
      packing: "WITHOUT_PACKING",
      contentConfirmedOn: new Date().toISOString().slice(0, 10),
      category: "General",
      modelNumber: "-",
      description: "Sunway Medical Invoice",
      estimatedDesignTime: "-",
      estimatedPrintTime: "-",
      invoiceNumber: initialData?.invoiceNumber ? Number(initialData.invoiceNumber) : undefined,
    } as any,
  });

  useEffect(() => {
    if (!invoiceId && nextNumberData?.nextNumber) {
      const current = getValues("invoiceNumber");
      if (!current) {
        setValue("invoiceNumber", nextNumberData.nextNumber, { shouldValidate: true });
      }
    }
  }, [nextNumberData, invoiceId, setValue]);

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + (item.qty * item.rate), 0);
  const totalAmount = subtotal + (subtotal * (gstPercent / 100));

  // Sync to Zod fields dynamically
  useEffect(() => {
    setValue("unitRate", Number(totalAmount.toFixed(2)));
    setValue("quantity", 1);
  }, [totalAmount, setValue]);

  const advPaid = useWatch({ control, name: "advancePaid" });
  const advAmount = useWatch({ control, name: "advanceAmount" }) || 0;
  const balance = advPaid ? totalAmount - Number(advAmount) : totalAmount;

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { id: Date.now().toString(), description: "", hsn: "", qty: 1, rate: 0, uom: "1 Nos" }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      toast.error("You must have at least one item.");
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Pack the complex data into additionalNotes
      const complexData = {
        customerAddress,
        deliveryNote,
        paymentTerms,
        buyersOrderNo,
        despatchDocNo,
        despatchDated,
        despatchedThrough,
        destination,
        termsOfDelivery,
        gstPercent,
        items
      };
      data.additionalNotes = JSON.stringify(complexData);

      const url = invoiceId ? `/api/invoices/${invoiceId}` : "/api/invoices";
      const method = invoiceId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(invoiceId ? "Invoice updated" : "Invoice generated");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      router.push("/dashboard/invoices");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save invoice.");
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const rawInvNumber = useWatch({ control, name: "invoiceNumber" });
  const formattedInvoiceNumber = rawInvNumber ? `INV-${String(rawInvNumber).padStart(4, "0")}` : (invoiceId ? "Loading..." : (nextNumberData?.formattedNextNumber || "Loading..."));

  // PDF Preview Data Object
  const currentFormData = useWatch({ control });
  const pdfData = {
    ...currentFormData,
    customerName: currentFormData.customerName || "",
    phone: currentFormData.phone || "",
    invoiceNumber: rawInvNumber || "",
    date: currentFormData.date || new Date().toISOString().slice(0, 10),
    // Attach complex parsed data for the PDF generator
    complexData: {
        customerAddress,
        deliveryNote,
        paymentTerms,
        buyersOrderNo,
        despatchDocNo,
        despatchDated,
        despatchedThrough,
        destination,
        termsOfDelivery,
        gstPercent,
        items
    }
  };

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d as any))} className="space-y-8 pb-12 w-full max-w-5xl mx-auto animate-in fade-in duration-300">
      <div className="flex justify-between items-center pb-4 border-b">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-brand-forest">
              {invoiceId ? "Edit Invoice" : "New Invoice"}
            </h2>
            <div className="flex items-center gap-1 bg-brand-cream/30 border border-brand-border px-2 py-1 rounded-md">
              <span className="text-xl font-bold text-brand-forest">INV-</span>
              <input
                type="number"
                {...register("invoiceNumber", { valueAsNumber: true })}
                className="w-20 bg-transparent text-xl font-bold text-brand-forest focus:outline-none focus:ring-0"
              />
            </div>
          </div>
          {errors.invoiceNumber && <p className="text-xs text-destructive mt-1">{errors.invoiceNumber.message}</p>}
        </div>
        <div className="flex gap-3">
          {mounted && invoiceId && (
            <PDFDownloadButton pdfData={pdfData as any} invoiceNumber={formattedInvoiceNumber} />
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold shadow-md transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #1C3A2A 0%, #2D5A3D 100%)', color: '#FFFFFF' }}
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {invoiceId ? "Update Invoice" : "Generate Invoice"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Buyer Details */}
        <div className="bg-card border rounded-lg shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-brand-forest border-b pb-2">Buyer Details</h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase">Customer / Buyer Name *</label>
              <input {...register("customerName")} className="w-full px-3 py-2 border rounded-md text-sm focus:ring-1 outline-none" />
              {errors.customerName && <p className="text-xs text-destructive">{errors.customerName.message}</p>}
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase">Phone Number *</label>
              <input {...register("phone")} placeholder="10-digit number" className="w-full px-3 py-2 border rounded-md text-sm focus:ring-1 outline-none" />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase">Customer Address</label>
              <textarea value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-md text-sm focus:ring-1 outline-none resize-none" />
            </div>
          </div>
        </div>

        {/* Invoice Metadata */}
        <div className="bg-card border rounded-lg shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-brand-forest border-b pb-2">Invoice Meta</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase">Date *</label>
              <input type="date" {...register("date", { valueAsDate: true })} className="w-full px-3 py-2 border rounded-md text-sm focus:ring-1 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase">Delivery Note</label>
              <input type="text" value={deliveryNote} onChange={e => setDeliveryNote(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm focus:ring-1 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase">Terms of Payment</label>
              <input type="text" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm focus:ring-1 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase">Buyer's Order No.</label>
              <input type="text" value={buyersOrderNo} onChange={e => setBuyersOrderNo(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm focus:ring-1 outline-none" />
            </div>
          </div>
        </div>

        {/* Dispatch Details */}
        <div className="bg-card border rounded-lg shadow-sm p-5 space-y-4 lg:col-span-2">
          <h3 className="font-semibold text-brand-forest border-b pb-2">Dispatch Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase">Despatch Doc No.</label>
              <input type="text" value={despatchDocNo} onChange={e => setDespatchDocNo(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm focus:ring-1 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase">Dated</label>
              <input type="text" value={despatchDated} onChange={e => setDespatchDated(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm focus:ring-1 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase">Despatched Through</label>
              <input type="text" value={despatchedThrough} onChange={e => setDespatchedThrough(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm focus:ring-1 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase">Destination</label>
              <input type="text" value={destination} onChange={e => setDestination(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm focus:ring-1 outline-none" />
            </div>
            <div className="space-y-1 md:col-span-4">
              <label className="text-xs font-semibold uppercase">Terms of Delivery</label>
              <input type="text" value={termsOfDelivery} onChange={e => setTermsOfDelivery(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm focus:ring-1 outline-none" />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-card border rounded-lg shadow-sm overflow-hidden lg:col-span-2">
          <div className="px-5 py-4 bg-muted/30 border-b flex justify-between items-center">
            <h3 className="font-semibold text-brand-forest">Description of Goods</h3>
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold">GST Rate (%)</label>
              <input type="number" min="0" max="100" value={gstPercent} onChange={e => setGstPercent(Number(e.target.value))} className="w-16 px-2 py-1 border rounded text-sm text-center" />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-2 font-semibold w-12 text-center">#</th>
                  <th className="px-4 py-2 font-semibold">Description</th>
                  <th className="px-4 py-2 font-semibold w-32">HSN Code</th>
                  <th className="px-4 py-2 font-semibold w-24">Quantity</th>
                  <th className="px-4 py-2 font-semibold w-28">Rate (₹)</th>
                  <th className="px-4 py-2 font-semibold w-24">Per</th>
                  <th className="px-4 py-2 font-semibold w-32 text-right">Amount</th>
                  <th className="px-4 py-2 font-semibold w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-2 text-center font-medium">{index + 1}</td>
                    <td className="px-4 py-2">
                      <textarea
                        value={item.description}
                        onChange={(e) => updateItem(item.id, "description", e.target.value)}
                        className="w-full px-2 py-1 border rounded-md text-sm outline-none resize-none"
                        rows={2}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input type="text" value={item.hsn} onChange={(e) => updateItem(item.id, "hsn", e.target.value)} className="w-full px-2 py-1 border rounded-md text-sm outline-none" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" min="0" step="0.01" value={item.qty === 0 ? "" : item.qty} onChange={(e) => updateItem(item.id, "qty", parseFloat(e.target.value) || 0)} className="w-full px-2 py-1 border rounded-md text-sm outline-none" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" min="0" step="0.01" value={item.rate === 0 ? "" : item.rate} onChange={(e) => updateItem(item.id, "rate", parseFloat(e.target.value) || 0)} className="w-full px-2 py-1 border rounded-md text-sm outline-none" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="text" value={item.uom} onChange={(e) => updateItem(item.id, "uom", e.target.value)} className="w-full px-2 py-1 border rounded-md text-sm outline-none" />
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-brand-forest">
                      {(item.qty * item.rate).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button type="button" onClick={() => handleRemoveItem(item.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t bg-slate-50 flex justify-between items-center">
            <button type="button" onClick={handleAddItem} className="inline-flex items-center text-sm font-semibold text-brand-forest hover:opacity-80">
              <Plus className="w-4 h-4 mr-1" /> Add Line Item
            </button>
            <div className="text-right space-y-1 text-sm">
              <p>Subtotal: <span className="font-semibold">₹{subtotal.toFixed(2)}</span></p>
              <p>GST @{gstPercent}%: <span className="font-semibold">₹{(subtotal * (gstPercent/100)).toFixed(2)}</span></p>
              <p className="text-lg font-bold text-brand-forest pt-1">Total: ₹{totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Legacy Payment Block (required for Prisma logic) */}
        <div className="bg-card border rounded-lg shadow-sm p-5 space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold flex items-center gap-2">
                <input type="checkbox" {...register("advancePaid")} className="h-4 w-4 rounded text-brand-forest" />
                Mark Invoice as Partially / Fully Paid (Internal Ledger)
              </label>
            </div>

            {advPaid && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Paid Amount (₹)</label>
                  <input type="number" step="0.01" {...register("advanceAmount", { valueAsNumber: true })} className="flex h-10 w-full rounded-md border px-3 text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Mode</label>
                  <select {...register("advanceMode")} className="flex h-10 w-full rounded-md border px-3 text-sm">
                     <option value="">Select Mode</option>
                     <option value="ONLINE">Online</option>
                     <option value="CASH">Cash</option>
                  </select>
                </div>
              </div>
            )}

            <div className="pt-2 border-t mt-4 flex justify-between items-center">
              <span className="font-medium text-sm">Balance Due</span>
              {!advPaid ? (
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">Unpaid (₹{totalAmount.toFixed(2)})</span>
              ) : (
                <span className="font-bold text-brand-forest flex items-center gap-2">
                  ₹{balance.toFixed(2)}
                  {balance <= 0 && <span className="text-green-600 text-xs">(Paid)</span>}
                </span>
              )}
            </div>
        </div>

      </div>
    </form>
  );
}
