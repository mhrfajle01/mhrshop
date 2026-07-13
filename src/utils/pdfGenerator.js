import { jsPDF } from "jspdf";

/**
 * Generate a clean PDF report for Sales, Purchases or Expenses
 * @param {String} title Title of the report
 * @param {Array<String>} headers Table columns headings
 * @param {Array<Array<String>>} rows Table content rows
 * @param {Object} summary Summary stats to print at top (labels and values)
 * @param {String} fileName Download file name
 */
export const exportToPDF = (title, headers, rows, summary = {}, fileName = "report") => {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 20;

    // Report Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(25, 135, 84); // Green primary theme
    doc.text("SHOP KHATA PRO", margin, y);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth - margin - 55, y);
    
    y += 8;
    doc.setDrawColor(200);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    
    // Sub-title
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(33);
    doc.text(title.toUpperCase(), margin, y);

    // Summary block (KPI values)
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(50);
    
    Object.keys(summary).forEach((key) => {
      doc.text(`${key}:  ${summary[key]}`, margin, y);
      y += 5;
    });

    y += 5;
    // Table Draw logic
    doc.setDrawColor(220);
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y, pageWidth - (margin * 2), 8, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(50);
    
    const colWidth = (pageWidth - (margin * 2)) / headers.length;
    
    // Header row
    headers.forEach((h, idx) => {
      doc.text(h, margin + (idx * colWidth) + 2, y + 5);
    });
    
    y += 8;
    doc.setFont("helvetica", "normal");
    
    // Data rows
    rows.forEach((row, rowIdx) => {
      // Page break check
      if (y > 270) {
        doc.addPage();
        y = 20;
        
        // Redraw header on new page
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, y, pageWidth - (margin * 2), 8, "F");
        doc.setFont("helvetica", "bold");
        headers.forEach((h, idx) => {
          doc.text(h, margin + (idx * colWidth) + 2, y + 5);
        });
        y += 8;
        doc.setFont("helvetica", "normal");
      }

      // Draw subtle grid lines
      doc.line(margin, y, pageWidth - margin, y);
      
      row.forEach((cell, cellIdx) => {
        const text = String(cell || "");
        doc.text(text, margin + (cellIdx * colWidth) + 2, y + 5);
      });
      
      y += 7;
    });
    
    doc.line(margin, y, pageWidth - margin, y);

    // Download PDF
    doc.save(`${fileName}.pdf`);
  } catch (error) {
    console.error("PDF generation failed:", error);
    alert("PDF রিসিট তৈরি করতে সমস্যা হয়েছে।");
  }
};
