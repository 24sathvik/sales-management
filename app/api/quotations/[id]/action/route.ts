import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await req.json();
    const { id } = params;

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'rejected';

    if (action === 'reject') {
      const { data, error } = await supabaseAdmin
        .from('quotations')
        .update({ status: newStatus })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return NextResponse.json({ success: true, data, message: "Quotation rejected successfully." });
    }

    // --- ACCEPT WORKFLOW ---
    // 1. Fetch Quotation DB Document
    const { data: quotation, error: fetchErr } = await supabaseAdmin
      .from('quotations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !quotation) {
      throw new Error("Quotation not found");
    }
    if (quotation.status === 'accepted' && quotation.invoice_id) {
       return NextResponse.json({ success: false, error: "Quotation is already invoiced." }, { status: 400 });
    }

    // 2. Parse Items for combined description
    const items = typeof quotation.items === 'string' ? JSON.parse(quotation.items) : (quotation.items || []);
    const consolidatedDescription = items.map((i: any) => `${i.qty}x ${i.description}`).join(' | ') || "Quotation Approved Job";

    // 3. Initiate Transaction identically to Native Invoice Generations
    const invoiceResult = await prisma.$transaction(async (tx: any) => {
      // Find proper sequencing override logic (matching invoices api logic exactly)
      const latestInv = await tx.invoice.findFirst({
        orderBy: { invoiceNumber: "desc" },
        select: { invoiceNumber: true },
      });
      const nextInvoiceNumber = (latestInv?.invoiceNumber || 0) + 1;

      // Calculate total quantity from items — must be an Int for Prisma
      const totalQtyRaw = items.reduce((acc: number, item: any) => acc + (Number(item.qty) || 0), 0);
      const totalQty = Math.round(totalQtyRaw > 0 ? totalQtyRaw : 1);
      const toleranceQty = Math.floor(totalQty * 0.95);

      const advancePaid = Number(quotation.advance_required) > 0;
      const advanceAmount = advancePaid ? Number(quotation.advance_required) : null;
      const balance = Number(quotation.total_amount) - (advanceAmount || 0);
      const unitRate = totalQty > 0 ? Number(quotation.total_amount) / totalQty : Number(quotation.total_amount);

      // Map quotation items to the invoice PDF format (matching InvoiceForm complexData structure)
      const invoiceItems = items.map((i: any) => ({
        id: String(Math.random()),
        description: i.description || "",
        hsn: i.hsn || "",
        qty: Number(i.qty) || 1,
        rate: Number(i.unit_price) || 0,
        uom: i.uom || "1 Nos",
      }));

      // Build additionalNotes as JSON payload consumed by the invoice PDF generator
      const complexData = {
        customerAddress: quotation.customer_address || "",
        deliveryNote: "",
        paymentTerms: "100% Advance Payment",
        buyersOrderNo: "",
        despatchDocNo: "",
        despatchDated: "",
        despatchedThrough: "",
        destination: "",
        termsOfDelivery: "",
        gstPercent: Number(quotation.tax_percent) || 5,
        items: invoiceItems,
      };

      // Build Base Payload for Prisma
      const createData = {
        invoiceNumber: nextInvoiceNumber,
        customerName: quotation.customer_name,
        phone: quotation.customer_phone || "00000",
        brideName: "",
        groomName: "",
        category: quotation.category || "General",
        modelNumber: quotation.quotation_number || "",
        description: quotation.job_title || consolidatedDescription,
        date: new Date(),
        quantity: totalQty,
        toleranceQuantity: toleranceQty,
        unitRate: unitRate,
        totalAmount: Number(quotation.total_amount),
        advancePaid: advancePaid,
        advanceAmount: advanceAmount,
        advanceMode: advancePaid ? "CASH" : null,
        balance: balance,
        balancePaid: balance <= 0,
        balanceMode: null,
        estimatedDesignTime: "TBD",
        estimatedPrintTime: "TBD",
        packing: "WITHOUT_PACKING",
        printingColor: quotation.printing_color || null,
        finalDeliveryDate: quotation.delivery_date ? new Date(quotation.delivery_date) : null,
        assigneeId: session.user.id,
        createdById: session.user.id,
        status: "ACTIVE",
        additionalNotes: JSON.stringify(complexData),
      };

      // Construct native Invoice object
      const invoice = await tx.invoice.create({ data: createData });
      const formattedNumber = `INV-${String(invoice.invoiceNumber).padStart(4, "0")}`;

      const cardBaseParams = {
        invoiceId: invoice.id,
        invoiceNumber: formattedNumber,
        description: consolidatedDescription,
        quantity: 1,
        customerName: quotation.customer_name,
        order: 0,
      };

      // Generate Kanban/WIP Tracking arrays automatically 
      await tx.wIPCard.create({
        data: {
          ...cardBaseParams,
          phase: "RAW_MATERIALS",
          checklists: { create: { phase: "RAW_MATERIALS", invoiceId: invoice.id } }
        }
      });
      await tx.wIPCard.create({
        data: {
          ...cardBaseParams,
          phase: "DESIGN",
          checklists: { create: { phase: "DESIGN", invoiceId: invoice.id } }
        }
      });

      return invoice;
    });

    // 4. Back-sync final Success Flag & Link to original Quotation DB Row
    const { data: updatedQuotation, error: updateErr } = await supabaseAdmin
      .from('quotations')
      .update({ 
        status: newStatus,
        invoice_id: invoiceResult.id 
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    return NextResponse.json({ 
      success: true, 
      data: updatedQuotation, 
      message: "Quotation accepted & Invoice generated!" 
    });

  } catch (error: any) {
    console.error("Quotation Action Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process quotation action" },
      { status: 500 }
    );
  }
}
