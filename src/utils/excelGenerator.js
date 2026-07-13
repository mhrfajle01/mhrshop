import * as XLSX from "xlsx";

/**
 * Export JSON data to Excel spreadsheet (.xlsx) - Standard
 */
export const exportToExcel = (jsonData, sheetName, fileName) => {
  if (!Array.isArray(jsonData) || jsonData.length === 0) {
    alert("এক্সেল এক্সপোর্ট করার জন্য কোনো ডাটা পাওয়া যায়নি।");
    return;
  }

  try {
    const worksheet = XLSX.utils.json_to_sheet(jsonData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  } catch (error) {
    console.error("Excel generation failed:", error);
    alert("এক্সেল ফাইল তৈরি করতে সমস্যা হয়েছে।");
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
      ["Total Sales Collected (মোট নগদ/বকেয়া বিক্রয়)", summary.totalSales],
      ["Total Purchase costs (পণ্য ক্রয়ের খরচ)", summary.totalPurchases],
      ["Total Operating Expenses (অন্যান্য দোকান খরচ)", summary.totalExpenses],
      ["Calculated Net Profit (মোট নিট লাভ)", summary.netProfit],
      ["Net Profit Margin (%)", summary.profitMargin + "%"],
      [],
      ["DETAILED TRANSACTIONS LIST (বিক্রয় বিবরণী)"],
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
    alert("উন্নত এক্সেল ফাইল তৈরি করতে ব্যর্থ হয়েছে।");
  }
};
