import * as XLSX from "xlsx";

/**
 * Export JSON data to Excel spreadsheet (.xlsx) - Standard
 */
export const exportToExcel = (jsonData, sheetName, fileName) => {
  if (!Array.isArray(jsonData) || jsonData.length === 0) {
    alert("এক্সেল এক্সপোর্ট করার জন্য কোনো ডাটা পাওয়া যায়নি।");
    return;
  }

  try {
    const worksheet = XLSX.utils.json_to_sheet(jsonData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  } catch (error) {
    console.error("Excel generation failed:", error);
    alert("এক্সেল ফাইল তৈরি করতে সমস্যা হয়েছে।");
  }
};

/**
 * Export an enhanced performance report to Excel with financial summary blocks
 */
export const exportEnhancedReportToExcel = (summary, salesList, startDate, endDate, fileName) => {
  try {
    const workbook = XLSX.utils.book_new();
    
    // Prepare Array-of-Arrays data structure
    const dataRows = [
      ["SHOP KHATA PRO - BUSINESS PERFORMANCE REPORT"],
      [`Report Period: ${startDate} to ${endDate}`],
      [`Generated at: ${new Date().toLocaleString()}`],
      [],
      ["FINANCIAL KEY METRICS (আর্থিক সারসংক্ষেপ)"],
      ["Metric Name", "Amount (BDT / ৳)"],
      ["Total Sales Collected (মোট নগদ/বকেয়া বিক্রয়)", summary.totalSales],
      ["Total Purchase costs (পণ্য ক্রয়ের খরচ)", summary.totalPurchases],
      ["Total Operating Expenses (অন্যান্য দোকান খরচ)", summary.totalExpenses],
      ["Calculated Net Profit (মোট নিট লাভ)", summary.netProfit],
      ["Net Profit Margin (%)", summary.profitMargin + "%"],
      [],
      ["DETAILED TRANSACTIONS LIST (বিক্রয় বিবরণী)"],
      ["Invoice Number", "Date", "Customer Name", "Total Amount (৳)", "Discount (৳)", "Paid Amount (৳)", "Due Amount (৳)", "Payment Method"]
    ];

    // Append table rows
    salesList.forEach(s => {
      dataRows.push([
        s.invoiceNumber,
        s.date,
        s.customerName || "Retail Client (খুচরা ক্রেতা)",
        s.totalAmount || 0,
        s.discount || 0,
        s.paidAmount || 0,
        s.dueAmount || 0,
        s.paymentMethod || "Cash"
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(dataRows);
    
    // Simple column widths configuration for readability
    worksheet["!cols"] = [
      { wch: 22 }, // Invoice
      { wch: 12 }, // Date
      { wch: 25 }, // Customer Name
      { wch: 15 }, // Total
      { wch: 12 }, // Discount
      { wch: 15 }, // Paid
      { wch: 15 }, // Due
      { wch: 15 }  // Method
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Business Performance");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  } catch (error) {
    console.error("Enhanced Excel generation failed:", error);
    alert("উন্নত এক্সেল ফাইল তৈরি করতে ব্যর্থ হয়েছে।");
  }
};

/**
 * Export combined Mudi + Tea Stall report to Excel (multi-sheet workbook)
 */
export const exportCombinedReportToExcel = (mudiSummary, teaSummary, salesList, teaOrders, teaExpenses, startDate, endDate, fileName) => {
  try {
    const workbook = XLSX.utils.book_new();

    // Combined totals
    const combinedTotalSales = (mudiSummary.totalSales || 0) + (teaSummary.totalSales || 0);
    const combinedExpenses = (mudiSummary.totalExpenses || 0) + (teaSummary.totalExpenses || 0);
    const combinedProfit = (mudiSummary.netProfit || 0) + (teaSummary.netProfit || 0);
    const combinedDues = (mudiSummary.totalDues || 0) + (teaSummary.totalDues || 0);
    const combinedMargin = combinedTotalSales > 0 ? ((combinedProfit / combinedTotalSales) * 100).toFixed(1) : "0.0";

    // ── Sheet 1: Combined Summary ──
    const summaryRows = [
      ["SHOP KHATA PRO - মুদি ও চা স্টল সমন্বিত আর্থিক প্রতিবেদন"],
      [`রিপোর্ট সময়কাল: ${startDate} থেকে ${endDate}`],
      [`তৈরির তারিখ: ${new Date().toLocaleString()}`],
      [],
      ["বিবরণ (Metric)", "মুদি দোকান (৳)", "চা ও সিগারেট স্টল (৳)", "সর্বমোট (৳)"],
      ["মোট বিক্রয় (Total Sales)", mudiSummary.totalSales, teaSummary.totalSales, combinedTotalSales],
      ["পণ্য ক্রয় (Purchases)", mudiSummary.totalPurchases, "—", mudiSummary.totalPurchases],
      ["পরিচালন খরচ (Expenses)", mudiSummary.totalExpenses, teaSummary.totalExpenses, combinedExpenses],
      ["নিট লাভ (Net Profit)", mudiSummary.netProfit, teaSummary.netProfit, combinedProfit],
      ["বকেয়া/বাকি (Dues)", mudiSummary.totalDues, teaSummary.totalDues, combinedDues],
      ["নিট লাভের হার (Margin %)", mudiSummary.profitMargin + "%", teaSummary.profitMargin + "%", combinedMargin + "%"],
      [],
      ["📊 ব্যবসায়িক মূল্যায়ন"],
      [`মুদি দোকানে মোট ${salesList.length} টি ইনভয়েস এবং চা স্টলে মোট ${teaOrders.length} টি অর্ডার সম্পন্ন হয়েছে।`],
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(summaryRows);
    ws1["!cols"] = [{ wch: 35 }, { wch: 20 }, { wch: 25 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(workbook, ws1, "Combined Summary");

    // ── Sheet 2: Mudi Transactions ──
    const mudiRows = [
      ["মুদি দোকান বিক্রয় বিবরণী (Mudi Shop Invoices)"],
      [`সময়কাল: ${startDate} থেকে ${endDate}`],
      [],
      ["Invoice No", "তারিখ", "কাস্টমার", "মোট মূল্য (৳)", "ছাড় (৳)", "পরিশোধ (৳)", "বকেয়া (৳)", "পেমেন্ট"]
    ];
    salesList.forEach(s => {
      mudiRows.push([
        s.invoiceNumber, s.date, s.customerName || "খুচরা ক্রেতা",
        s.totalAmount || 0, s.discount || 0, s.paidAmount || 0, s.dueAmount || 0, s.paymentMethod || "Cash"
      ]);
    });
    const ws2 = XLSX.utils.aoa_to_sheet(mudiRows);
    ws2["!cols"] = [{ wch: 20 }, { wch: 12 }, { wch: 22 }, { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(workbook, ws2, "Mudi Transactions");

    // ── Sheet 3: Tea Stall Orders & Expenses ──
    const teaRows = [
      ["চা ও সিগারেট স্টল অর্ডার ও খরচ বিবরণী"],
      [`সময়কাল: ${startDate} থেকে ${endDate}`],
      [],
      ["— চা স্টল অর্ডার তালিকা —"],
      ["তারিখ", "আইটেমসমূহ", "মোট (৳)", "নগদ (৳)", "বাকি (৳)", "গ্রাহক"]
    ];
    teaOrders.forEach(o => {
      const itemNames = o.items?.map(i => `${i.name} x${i.qty || 1}`).join(", ") || "—";
      teaRows.push([
        o.date || o.createdAt?.slice(0, 10) || "", itemNames,
        o.total || 0, o.paid || 0, o.due || 0, o.customerName || "—"
      ]);
    });

    teaRows.push([], ["— চা স্টলের কাঁচামাল ও খরচ তালিকা —"], ["তারিখ", "বিবরণ", "পরিমাণ (৳)"]);
    teaExpenses.forEach(e => {
      teaRows.push([
        e.date || e.createdAt?.slice(0, 10) || "", e.name || e.description || "—", e.amount || 0
      ]);
    });

    const ws3 = XLSX.utils.aoa_to_sheet(teaRows);
    ws3["!cols"] = [{ wch: 14 }, { wch: 40 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(workbook, ws3, "Tea Stall");

    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  } catch (error) {
    console.error("Combined Excel generation failed:", error);
    alert("সমন্বিত এক্সেল ফাইল তৈরি করতে ব্যর্থ হয়েছে।");
  }
};
