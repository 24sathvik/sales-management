import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Quotation } from "./types";
import { format } from "date-fns";

export const generateQuotationPDF = (quotation: Quotation) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Primary Navy: #1B2B4B, Accent Gold: #C9A84C
  const primaryColor: [number, number, number] = [27, 43, 75]; 
  const accentColor: [number, number, number] = [201, 168, 76]; 

  // HEADER BAR
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("ZyOps", 14, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Streamline your print business", 14, 28);

  // QUOTATION TITLE Right
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("QUOTATION", pageWidth - 14, 20, { align: "right" });
  
  doc.setFontSize(12);
  doc.text(quotation.quotation_number || "Draft", pageWidth - 14, 28, { align: "right" });
  
  doc.setFontSize(10);
  doc.text(`Date: ${format(new Date(quotation.created_at || new Date()), "dd/MM/yyyy")}`, pageWidth - 14, 34, { align: "right" });

  // BILLING DETAILS
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 14, 55);
  
  doc.setFont("helvetica", "normal");
  const billingY = 62;
  doc.text(quotation.customer_name || "", 14, billingY);
  doc.text([
    quotation.customer_phone || "",
    quotation.customer_email || ""
  ].filter(Boolean).join(" | "), 14, billingY + 6);
  if (quotation.customer_address) {
    const addressLines = doc.splitTextToSize(quotation.customer_address, 80);
    doc.text(addressLines, 14, billingY + 12);
  }

  // VALIDITY & STATUS Right
  doc.setFont("helvetica", "bold");
  doc.text("Valid Until:", pageWidth - 70, 55);
  doc.setFont("helvetica", "normal");
  doc.text(quotation.valid_until ? format(new Date(quotation.valid_until), "dd MMM yyyy") : "—", pageWidth - 14, 55, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.text("Status:", pageWidth - 70, 65);
  doc.setFont("helvetica", "normal");
  doc.text(quotation.status?.toUpperCase() || "", pageWidth - 14, 65, { align: "right" });

  // TABLE ITEMS
  const items = Array.isArray(quotation.items) ? quotation.items : [];
  
  const tableData = items.map((item: any, i: number) => [
    (i + 1).toString(),
    item.description || "",
    item.category || "",
    item.qty?.toString() || "0",
    `Rs ${Number(item.unit_price || 0).toFixed(2)}`,
    `Rs ${(Number(item.qty || 0) * Number(item.unit_price || 0)).toFixed(2)}`
  ]);

  let finalY = 0;

  autoTable(doc, {
    startY: 85,
    head: [["#", "Description", "Cat", "Qty", "Price", "Total"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [42, 63, 111], // Light Navy Tint
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // light grey bg
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 25 },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' }
    },
    didDrawPage: function(data) {
      finalY = data.cursor?.y || 0;
    }
  });

  // TOTALS SECTION
  const totalBoxY = finalY + 10;
  
  // Calculate raw subtotal from items if missing
  const subtotal = items.reduce((acc: number, item: any) => acc + (Number(item.qty)*Number(item.unit_price)), 0);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Subtotal:", pageWidth - 60, totalBoxY);
  doc.text(`Rs ${subtotal.toFixed(2)}`, pageWidth - 14, totalBoxY, { align: "right" });
  
  // If we had discount/tax logically stored, we'd add them here. 
  // Assuming total amount covers it:
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(...accentColor);
  doc.rect(pageWidth - 70, totalBoxY + 8, 56, 12, "F"); // Gold bg for total
  
  doc.setTextColor(255, 255, 255);
  doc.text("TOTAL:", pageWidth - 66, totalBoxY + 16);
  doc.text(`Rs ${Number(quotation.total_amount).toFixed(2)}`, pageWidth - 16, totalBoxY + 16, { align: "right" });

  // NOTES & FOOTER
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Notes:", 14, totalBoxY);
  doc.setFont("helvetica", "normal");
  
  if (quotation.notes) {
     const splitNotes = doc.splitTextToSize(quotation.notes, 100);
     doc.text(splitNotes, 14, totalBoxY + 6);
  }

  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 116, 139);
  doc.text("Thank you for your business!", 14, totalBoxY + 30);
  doc.text(`This quotation is valid until ${quotation.valid_until ? format(new Date(quotation.valid_until), "dd MMM yyyy") : "N/A"}`, 14, totalBoxY + 35);

  // SAVE
  const filename = `${quotation.quotation_number || 'Quotation'}.pdf`;
  doc.save(filename);
};

