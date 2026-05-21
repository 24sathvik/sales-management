export async function generateQuotationPdf(data: any) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Colors
  const colors = {
    blue: [24, 116, 205], // Sunway Medical System Blue
    black: [0, 0, 0],
  };

  const drawText = (text: string, x: number, y: number, size: number, weight: "normal" | "bold", color: number[], align: "left" | "center" | "right" = "left") => {
    doc.setFont("helvetica", weight);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(text, x, y, { align });
  };

  // --- HEADER ---
  let currentY = 15;
  drawText("SUNWAY MEDICAL SYSTEM", pageWidth / 2, currentY, 22, "bold", colors.blue, "center");
  
  currentY += 6;
  drawText("2-2-647/71, CENTRAL EXCISE COLONY, BAGH AMBERPET, HYDERABAD", pageWidth / 2, currentY, 10, "bold", colors.blue, "center");
  
  currentY += 5;
  drawText("Contact No: 9885565911 email Id: sunwaymedicalsystem123@gmail.com", pageWidth / 2, currentY, 10, "bold", colors.blue, "center");

  // Dashed line
  currentY += 3;
  doc.setDrawColor(colors.blue[0], colors.blue[1], colors.blue[2]);
  doc.setLineWidth(0.5);
  doc.setLineDashPattern([2, 1], 0);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  doc.setLineDashPattern([], 0); // reset

  // Title
  currentY += 8;
  drawText("QUOTATION", pageWidth / 2, currentY, 12, "bold", colors.black, "center");

  // --- TOP INFO TABLE ---
  currentY += 5;
  const tableY = currentY;
  
  autoTable(doc, {
    startY: tableY,
    theme: 'plain',
    styles: { 
      font: 'helvetica', 
      fontSize: 10, 
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
      cellPadding: 2,
    },
    body: [
      [
        { content: `To\n${data.customer_name || ""}\n${data.customer_address || ""}`, styles: { halign: 'left', minCellHeight: 25, cellWidth: 'auto' } },
        { content: `Date: ${data.delivery_date || ""}\n\n${data.quotation_number || "SMS-192"}`, styles: { halign: 'left', cellWidth: 60 } }
      ]
    ],
    columnStyles: {
      0: { borderRightWidth: 0.5 }
    },
    margin: { left: margin, right: margin }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // --- BODY TEXT ---
  drawText(`Sub: ${data.job_title || "Quotation"}`, margin + 10, currentY, 11, "normal", colors.black);
  
  currentY += 8;
  drawText("Dear Sir,", margin, currentY, 11, "normal", colors.black);
  
  currentY += 5;
  const introText = "Thank you very much for your interest in our products. With reference to your Enquiry and as\ndesired, we are now submitting here below our Quotation.";
  doc.text(introText, margin, currentY);

  currentY += 10;

  // --- ITEMS TABLE ---
  const tableData: any[] = [];
  
  const items = Array.isArray(data.items) ? data.items : [];
  
  items.forEach((item: any, index: number) => {
    tableData.push([
      index + 1,
      item.description || "",
      item.unit_price || 0,
      `${item.qty != null ? item.qty : ""} ${item.uom || "Per kg"}`.trim(),
      (item.qty * item.unit_price).toFixed(2)
    ]);
  });

  // Totals
  const subtotal = data.subtotal || 0;
  const taxPercent = data.tax_percent !== undefined ? data.tax_percent : 18;
  const cgst = data.tax_amount ? data.tax_amount / 2 : subtotal * (taxPercent / 100) / 2;
  const sgst = data.tax_amount ? data.tax_amount / 2 : subtotal * (taxPercent / 100) / 2;
  const total = data.total_amount || (subtotal + cgst + sgst);

  if (taxPercent > 0) {
    tableData.push(["", { content: `CGST @${taxPercent/2}%`, styles: { fontStyle: 'bold', halign: 'right' } }, "", "", cgst.toFixed(2)]);
    tableData.push(["", { content: `SGST @${taxPercent/2}%`, styles: { fontStyle: 'bold', halign: 'right' } }, "", "", sgst.toFixed(2)]);
  }
  
  tableData.push(["", { content: "TOTAL", styles: { fontStyle: 'bold', halign: 'right' } }, "", "", { content: `Rs. ${total.toFixed(2)}`, styles: { fontStyle: 'bold' } }]);

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    styles: { 
      font: 'helvetica', 
      fontSize: 10,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { halign: 'left', cellWidth: 'auto' },
      2: { halign: 'center', cellWidth: 25 },
      3: { halign: 'center', cellWidth: 25 },
      4: { halign: 'right', cellWidth: 35 },
    },
    head: [['S.No', 'ITEM DESCRIPTION', 'Unit Price', 'Qty', 'Total Price']],
    body: tableData,
    margin: { left: margin, right: margin }
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // --- FOOTER INFO ---
  
  // Left side terms
  doc.setFont("helvetica", "bold");
  doc.text("Payment:", margin, currentY);
  doc.setFont("helvetica", "normal");
  doc.text("100% Advance Payment along with Purchase Order.", margin + 18, currentY);

  currentY += 5;
  doc.setFont("helvetica", "bold");
  doc.text("Validity:", margin, currentY);
  doc.setFont("helvetica", "normal");
  doc.text("This offer is valid for a period of 30 days only.", margin + 16, currentY);

  currentY += 5;
  doc.setFont("helvetica", "bold");
  doc.text("GSTNO:", margin, currentY);
  doc.setFont("helvetica", "normal");
  doc.text("36AHDPP2509F1ZK", margin + 16, currentY);

  currentY += 5;
  doc.setFont("helvetica", "bold");
  doc.text("Delivery:", margin, currentY);
  doc.setFont("helvetica", "normal");
  doc.text("Within 10 days from the date of receipt of payment.", margin + 17, currentY);

  // Bank Details Box (Moved down below terms to prevent any X-axis collision)
  const bankBoxY = currentY + 10;
  const bankBoxWidth = 90; // Increased width to 90mm
  const bankBoxX = pageWidth - margin - bankBoxWidth;
  
  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  // Increase box height to 28 to fit 5 lines comfortably
  doc.rect(bankBoxX, bankBoxY - 2, bankBoxWidth, 28);
  
  let by = bankBoxY + 3;
  // Center the "Bank Details" title
  doc.setFont("helvetica", "bold");
  doc.text("Bank Details", bankBoxX + (bankBoxWidth / 2), by, { align: "center" });
  
  const labelX = bankBoxX + 3;
  const valueX = bankBoxX + 32; // Increased offset to 32mm so it clears 'Account Name:' completely

  by += 5;
  doc.setFont("helvetica", "bold");
  doc.text("Account Name:", labelX, by);
  doc.setFont("helvetica", "normal");
  doc.text("Sunway Medical System", valueX, by);
  
  by += 5;
  doc.setFont("helvetica", "bold");
  doc.text("Bank Name:", labelX, by);
  doc.setFont("helvetica", "normal");
  doc.text("Axis Bank", valueX, by);

  by += 5;
  doc.setFont("helvetica", "bold");
  doc.text("A/c No:", labelX, by);
  doc.setFont("helvetica", "normal");
  doc.text("919020033293328", valueX, by);
  
  by += 5;
  doc.setFont("helvetica", "bold");
  doc.text("IFSC Code:", labelX, by);
  doc.setFont("helvetica", "normal");
  doc.text("UTIB0004188", valueX, by);

  // Guarantee the "Thanking you" text is printed comfortably below the box
  currentY = Math.max(currentY + 10, bankBoxY - 2 + 28 + 8);
  doc.setFont("helvetica", "bold");
  doc.text("Thanking you and assuring you of our best attention at all times we remain.", margin, currentY);

  // --- SIGNATURE AND STAMP ---
  currentY += 15;
  doc.text("Yours faithfully", margin, currentY);
  
  const stampY = currentY + 5;
  
  try {
    // Attempt to load stamp image from the public folder
    const stampRes = await fetch(window.location.origin + '/stamp.png.jpeg');
    if (stampRes.ok) {
      const stampBlob = await stampRes.blob();
      const reader = new FileReader();
      const stampBase64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(stampBlob);
      });
      // Add the circular stamp image
      doc.addImage(stampBase64, 'JPEG', margin, stampY, 35, 35);
    }
  } catch (e) {
    console.log("Could not load stamp.png.jpeg. Proceeding without it.");
  }
  
  doc.text("For Sunway Medical System", margin, stampY + 40);

  // --- OUTPUT ---
  const fileName = `Quotation_${data.quotation_number || "SMS"}.pdf`;
  doc.save(fileName);
  return true;
}

