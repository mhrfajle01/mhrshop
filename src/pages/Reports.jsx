import React, { useState, useEffect, useRef } from "react";
import { useData } from "../context/DataContext";
import { formatCurrency, formatDate } from "../utils/formatters";
import { exportToExcel, exportEnhancedReportToExcel } from "../utils/excelGenerator";
import dayjs from "dayjs";
import Chart from "chart.js/auto";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export default function Reports() {
  const { sales = [], purchases = [], expenses = [], products = [], loading } = useData();
  const [errorBoundary, setErrorBoundary] = useState(null);

  // Date filters: 'today' | 'yesterday' | 'week' | 'month' | 'custom'
  const [filterType, setFilterType] = useState("week");
  const [startDate, setStartDate] = useState(dayjs().subtract(7, "day").format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(dayjs().format("YYYY-MM-DD"));

  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Set date ranges automatically on filterType change
  useEffect(() => {
    try {
      const today = dayjs().format("YYYY-MM-DD");
      if (filterType === "today") {
        setStartDate(today);
        setEndDate(today);
      } else if (filterType === "yesterday") {
        const yest = dayjs().subtract(1, "day").format("YYYY-MM-DD");
        setStartDate(yest);
        setEndDate(yest);
      } else if (filterType === "week") {
        setStartDate(dayjs().subtract(6, "day").format("YYYY-MM-DD"));
        setEndDate(today);
      } else if (filterType === "month") {
        setStartDate(dayjs().startOf("month").format("YYYY-MM-DD"));
        setEndDate(today);
      }
    } catch (e) {
      setErrorBoundary(e);
    }
  }, [filterType]);

  // Compute reports datasets based on date filter
  const isDateInRange = (dateStr) => {
    if (!dateStr) return false;
    return dateStr >= startDate && dateStr <= endDate;
  };

  const filteredSales = sales ? sales.filter(s => isDateInRange(s.date)) : [];
  const filteredPurchases = purchases ? purchases.filter(p => isDateInRange(p.date)) : [];
  const filteredExpenses = expenses ? expenses.filter(e => isDateInRange(e.date)) : [];

  // Calculations summaries
  const totalSalesVal = filteredSales.reduce((acc, s) => acc + (s.payableAmount || 0), 0);
  const totalPurchaseVal = filteredPurchases.reduce((acc, p) => acc + (p.totalAmount || 0), 0);
  const totalExpenseVal = filteredExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const totalDuesVal = filteredSales.reduce((acc, s) => acc + (s.dueAmount || 0), 0);

  // Profit Calculation: Sales Gross Profit (Selling Price - Buy Price) - Expenses
  let grossProfitVal = 0;
  try {
    filteredSales.forEach(sale => {
      if (sale && sale.items && Array.isArray(sale.items)) {
        sale.items.forEach(item => {
          if (item) {
            const prod = products ? products.find(p => p.id === item.productId) : null;
            const buyPrice = item.purchasePrice || (prod ? prod.purchasePrice : 0);
            grossProfitVal += ((item.sellingPrice || 0) - buyPrice) * (item.quantity || 0);
          }
        });
      }
    });
  } catch (err) {
    console.error("Gross profit computation failed:", err);
  }
  const netProfitVal = grossProfitVal - totalExpenseVal;

  // Key Ratios
  const profitMargin = totalSalesVal > 0 ? ((netProfitVal / totalSalesVal) * 100).toFixed(1) : "0.0";
  const expenseRatio = totalSalesVal > 0 ? ((totalExpenseVal / totalSalesVal) * 100).toFixed(1) : "0.0";
  const dueRatio = totalSalesVal > 0 ? ((totalDuesVal / totalSalesVal) * 100).toFixed(1) : "0.0";

  // Chart Rendering
  useEffect(() => {
    if (loading || !chartRef.current) return;

    try {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }

      const ctx = chartRef.current.getContext("2d");
      if (!ctx) return;

      chartInstance.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels: ["Total Sales", "Total Purchase", "Total Expense", "Net Profit"],
          datasets: [
            {
              data: [totalSalesVal, totalPurchaseVal, totalExpenseVal, netProfitVal],
              backgroundColor: ["#059669", "#06b6d4", "#ef4444", "#f59e0b"],
              borderRadius: 8
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              grid: { color: "#f1f5f9" },
              ticks: { font: { size: 10 } }
            },
            x: {
              grid: { display: false },
              ticks: { font: { size: 10 } }
            }
          }
        }
      });
    } catch (e) {
      console.error("Chart creation error:", e);
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [totalSalesVal, totalPurchaseVal, totalExpenseVal, netProfitVal, loading]);

  if (errorBoundary) {
    return (
      <div className="main-content p-4 border border-danger-subtle bg-danger-subtle rounded-3 text-danger">
        <h4 className="fw-bold">Reports Screen Crash (ক্র্যাশ ডিটেইলস):</h4>
        <p className="fs-8">পর্দায় প্রদর্শিত ত্রুটিটি সমাধান করতে অনুগ্রহ করে নিচের লেখাটি দেখুন:</p>
        <pre className="p-3 bg-white text-dark rounded border fs-8 text-wrap overflow-auto" style={{ maxHeight: "300px" }}>
          {errorBoundary.stack || errorBoundary.message || String(errorBoundary)}
        </pre>
        <button className="btn btn-danger font-monospace mt-2" onClick={() => window.location.reload()}>
          Reload Page
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="main-content d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Export functions
  const handleExportExcel = () => {
    const summary = {
      totalSales: totalSalesVal,
      totalPurchases: totalPurchaseVal,
      totalExpenses: totalExpenseVal,
      netProfit: netProfitVal,
      profitMargin: profitMargin
    };
    exportEnhancedReportToExcel(summary, filteredSales, startDate, endDate, `ShopKhataPro_Report_${startDate}_to_${endDate}`);
  };

  const handleExportPDF = async () => {
    try {
      const element = document.getElementById("pdf-report-template");
      if (!element) return;
      
      alert("PDF ফাইল তৈরি করা হচ্ছে, অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করুন...");
      
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210; // A4 size in mm
      const pageHeight = 297; // A4 size in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`ShopKhataPro_PerformanceReport_${startDate}_to_${endDate}.pdf`);
    } catch (err) {
      console.error(err);
      alert("PDF তৈরি করতে সমস্যা হয়েছে: " + err.message);
    }
  };

  // Safe wrapper for return layout to catch potential render anomalies
  try {
    return (
      <div className="main-content">
        {/* Title */}
        <div className="mb-4 no-print">
          <h2 className="h4 mb-1">Reports & Analytics</h2>
          <p className="text-muted fs-7">ব্যবসায়িক লাভ-ক্ষতি ও বিক্রয় রিপোর্টের বিশ্লেষণ</p>
        </div>

        {/* Date Range selectors */}
        <div className="card-custom bg-white border border-light p-3 mb-4 no-print">
          <h4 className="h6 text-muted text-uppercase mb-3 font-monospace">Date Filter</h4>
          
          {/* Quick filters pills */}
          <div className="btn-group btn-group-sm w-100 mb-3" role="group">
            {["today", "yesterday", "week", "month", "custom"].map((type) => (
              <React.Fragment key={type}>
                <input 
                  type="radio" 
                  className="btn-check" 
                  name="filterType" 
                  id={`filter-${type}`} 
                  checked={filterType === type}
                  onChange={() => setFilterType(type)}
                />
                <label className="btn btn-outline-success font-monospace text-capitalize" htmlFor={`filter-${type}`}>
                  {type}
                </label>
              </React.Fragment>
            ))}
          </div>

          {/* Custom date range inputs */}
          {filterType === "custom" && (
            <div className="row g-2">
              <div className="col-6">
                <label className="form-label text-muted fs-8 font-monospace">Start Date</label>
                <input 
                  type="date" 
                  className="form-control form-control-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="col-6">
                <label className="form-label text-muted fs-8 font-monospace">End Date</label>
                <input 
                  type="date" 
                  className="form-control form-control-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Financial KPI stats grid */}
        <div className="row g-3 mb-4 no-print">
          <div className="col-6">
            <div className="card-custom bg-success text-white p-3 h-100">
              <small className="opacity-75 fs-8 text-uppercase">Sales (বিক্রয়)</small>
              <h4 className="m-0 fw-bold">{formatCurrency(totalSalesVal)}</h4>
            </div>
          </div>

          <div className="col-6">
            <div className="card-custom bg-info text-white p-3 h-100">
              <small className="opacity-75 fs-8 text-uppercase">Purchases (ক্রয়)</small>
              <h4 className="m-0 fw-bold">{formatCurrency(totalPurchaseVal)}</h4>
            </div>
          </div>

          <div className="col-6">
            <div className="card-custom bg-danger text-white p-3 h-100">
              <small className="opacity-75 fs-8 text-uppercase">Expenses (খরচ)</small>
              <h4 className="m-0 fw-bold">{formatCurrency(totalExpenseVal)}</h4>
            </div>
          </div>

          <div className="col-6">
            <div className="card-custom bg-warning text-dark p-3 h-100">
              <small className="opacity-75 fs-8 text-uppercase">Net Profit (লাভ)</small>
              <h4 className={`m-0 fw-bold ${netProfitVal >= 0 ? "text-success-emphasis" : "text-danger-emphasis"}`}>
                {formatCurrency(netProfitVal)}
              </h4>
            </div>
          </div>
        </div>

        {/* Dynamic Financial Advisory Briefing */}
        <div className="card-custom bg-white border border-success-subtle p-3 mb-4 no-print">
          <h4 className="h6 text-success text-uppercase mb-3 font-monospace d-flex align-items-center gap-1">
            <i className="bi bi-lightbulb-fill"></i> Financial Advisory (ব্যবসায়িক পরামর্শ)
          </h4>
          <div className="fs-7 text-dark" style={{ lineHeight: "1.6" }}>
            {totalSalesVal === 0 ? (
              <p className="text-muted m-0">এই সময়ে কোনো বিক্রয় সংঘটিত হয়নি। পরামর্শ পেতে নতুন পণ্য বিক্রয় নথিভুক্ত করুন।</p>
            ) : (
              <div>
                <p className="mb-2">
                  ১. এই সময়ে আপনার দোকানে মোট বিক্রয় হয়েছে <strong>{formatCurrency(totalSalesVal)}</strong> এবং দোকান পরিচালন ও ক্রয়ের যাবতীয় খরচ বাদ দিয়ে আপনার আসল মুনাফা বা নিট লাভ হয়েছে <strong>{formatCurrency(netProfitVal)}</strong>।
                </p>
                <p className="mb-2">
                  ২. বিক্রয়ের বিপরীতে আপনার নিট লাভের হার <strong>{profitMargin}%</strong>। {
                    netProfitVal < 0 
                      ? "⚠️ আপনার ব্যবসা বর্তমানে লোকসানে রয়েছে। পণ্য বিক্রয়মূল্য পুনর্নির্ধারণ করা অথবা পরিচালনা খরচ কমানো প্রয়োজন।" 
                      : Number(profitMargin) >= 20 
                        ? "🎉 এটি একটি খুচরা দোকানের জন্য অত্যন্ত ভালো মুনাফার হার! এই ধারা বজায় রাখুন।" 
                        : "💼 এটি একটি স্বাভাবিক মুনাফার হার। লাভ আরেকটু বাড়াতে ক্রয়ের ব্যয় ও দোকান খরচ নিয়ন্ত্রণে জোর দিন।"
                  }
                </p>
                <p className="mb-2">
                  ৩. আপনার পরিচালন খরচের হার <strong>{expenseRatio}%</strong>। {
                    Number(expenseRatio) >= 15 
                      ? "⚠️ আপনার বিক্রয়ের তুলনায় দোকানের পরিচালনা খরচ কিছুটা বেশি। অযথা দোকান খরচ নিয়ন্ত্রণে মনোযোগী হোন।" 
                      : "✅ আপনার পরিচালনা খরচ নিয়ন্ত্রণে রয়েছে।"
                  }
                </p>
                <p className="mb-0">
                  ৪. মোট বিক্রয়ের মধ্যে <strong>{dueRatio}%</strong> টাকা বাজারে বকেয়া আটকে আছে (বকেয়া পরিমাণ: <strong>{formatCurrency(totalDuesVal)}</strong>)। {
                    Number(dueRatio) >= 15 
                      ? "⚠️ আপনার বাজারে বকেয়া বিক্রয়ের হার অনেক বেশি। দ্রুত কাস্টমারদের থেকে বকেয়া আদায় করার চেষ্টা করুন, তা না হলে ক্যাশ সংকটের ঝুঁকি তৈরি হতে পারে।" 
                      : "✅ বকেয়া বিক্রয়ের হার সীমার মধ্যে রয়েছে। ক্যাশ প্রবাহ ভালো রয়েছে।"
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Charts Section */}
        <div className="card-custom bg-white border border-light mb-4 no-print">
          <h4 className="h6 text-muted text-uppercase mb-3 font-monospace">Statement Analytics Chart</h4>
          <div style={{ height: "200px", position: "relative" }}>
            <canvas ref={chartRef}></canvas>
          </div>
        </div>

        {/* Export operations */}
        <div className="card-custom bg-white border border-light p-3 mb-4 no-print">
          <h4 className="h6 text-muted text-uppercase mb-3 font-monospace">Export Report</h4>
          <div className="d-flex gap-2">
            <button 
              type="button" 
              className="btn btn-custom btn-custom-primary flex-grow-1 font-monospace"
              onClick={handleExportPDF}
              disabled={filteredSales.length === 0}
            >
              <i className="bi bi-file-earmark-pdf"></i> Export PDF (Bangla)
            </button>
            <button 
              type="button" 
              className="btn btn-custom btn-custom-secondary flex-grow-1 font-monospace"
              onClick={handleExportExcel}
              disabled={filteredSales.length === 0}
            >
              <i className="bi bi-file-earmark-spreadsheet"></i> Export Excel
            </button>
          </div>
        </div>

        {/* Statement Table list of Sales in period */}
        <div className="card-custom bg-white border border-light p-0">
          <div className="p-3 border-bottom border-light">
            <h4 className="h6 text-muted m-0 font-monospace">Period Invoices ({filteredSales.length})</h4>
          </div>

          {filteredSales.length === 0 ? (
            <div className="text-center py-5 text-muted fs-8">
              এই তারিখের মধ্যে কোনো বিক্রয় সংগঠিত হয়নি।
            </div>
          ) : (
            <div className="table-responsive-custom">
              <table className="table table-custom align-middle">
                <thead>
                  <tr>
                    <th scope="col" className="font-monospace">Date / Invoice</th>
                    <th scope="col" className="font-monospace">Customer</th>
                    <th scope="col" className="text-end font-monospace">Payable</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((sale) => (
                    <tr key={sale.id}>
                      <td>
                        <div className="fw-semibold font-monospace fs-8">{sale.invoiceNumber}</div>
                        <small className="text-muted fs-9">{formatDate(sale.date, "DD MMM YYYY")}</small>
                      </td>
                      <td>
                        <div className="fw-semibold fs-8">{sale.customerName || "খুচরা কাস্টমার"}</div>
                        <span className="badge bg-light text-secondary border fs-9" style={{ fontSize: "9px" }}>{sale.paymentMethod}</span>
                      </td>
                      <td className="text-end fw-bold font-monospace fs-8">
                        {formatCurrency(sale.payableAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Hidden A4 printable report layout for HTML2Canvas PDF Export */}
        <div 
          id="pdf-report-template" 
          style={{
            position: "absolute",
            left: "-9999px",
            top: "-9999px",
            width: "790px",
            padding: "45px",
            background: "white",
            color: "#0f172a",
            fontFamily: "Arial, Helvetica, sans-serif"
          }}
        >
          <div style={{ borderBottom: "3px solid #059669", paddingBottom: "12px", marginBottom: "25px" }}>
            <h2 style={{ color: "#059669", margin: "0 0 5px 0", fontSize: "28px", fontFamily: "inherit" }}>SHOP KHATA PRO</h2>
            <p style={{ margin: 0, fontSize: "13px", color: "#475569" }}>ব্যবসার কার্যক্ষমতা, লাভ-ক্ষতি ও পরামর্শ বিশ্লেষণ বিবরণী</p>
            <p style={{ margin: "6px 0 0 0", fontSize: "13px", color: "#334155", fontWeight: "bold" }}>রিপোর্ট সময়কাল: {startDate} থেকে {endDate}</p>
          </div>

          <h4 style={{ margin: "0 0 10px 0", color: "#0f172a", fontSize: "16px", borderBottom: "1px solid #cbd5e1", paddingBottom: "6px" }}>১. আর্থিক ফলাফল সারসংক্ষেপ (Financial Summary)</h4>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px", fontSize: "13px" }}>
            <tbody>
              <tr style={{ background: "#f8fafc" }}>
                <td style={{ padding: "10px", border: "1px solid #e2e8f0" }}>মোট বিক্রয় পরিমাণ (Total Sales Collected)</td>
                <td style={{ padding: "10px", border: "1px solid #e2e8f0", fontWeight: "bold", textAlign: "right" }}>{formatCurrency(totalSalesVal)}</td>
              </tr>
              <tr>
                <td style={{ padding: "10px", border: "1px solid #e2e8f0" }}>মোট পণ্য ক্রয় খরচ (Total Purchases)</td>
                <td style={{ padding: "10px", border: "1px solid #e2e8f0", fontWeight: "bold", textAlign: "right" }}>{formatCurrency(totalPurchaseVal)}</td>
              </tr>
              <tr style={{ background: "#f8fafc" }}>
                <td style={{ padding: "10px", border: "1px solid #e2e8f0" }}>অন্যান্য দোকান পরিচালন খরচ (Total Expenses)</td>
                <td style={{ padding: "10px", border: "1px solid #e2e8f0", fontWeight: "bold", textAlign: "right" }}>{formatCurrency(totalExpenseVal)}</td>
              </tr>
              <tr style={{ background: "#f0fdf4", color: "#166534" }}>
                <td style={{ padding: "10px", border: "1px solid #e2e8f0", fontWeight: "bold" }}>ব্যবসায়িক নিট লাভ (Net Profit)</td>
                <td style={{ padding: "10px", border: "1px solid #e2e8f0", fontWeight: "bold", textAlign: "right" }}>{formatCurrency(netProfitVal)}</td>
              </tr>
            </tbody>
          </table>

          <h4 style={{ margin: "0 0 10px 0", color: "#0f172a", fontSize: "16px", borderBottom: "1px solid #cbd5e1", paddingBottom: "6px" }}>২. ব্যবসায়িক পরামর্শ ও অনুপাত বিশ্লেষণ (Advisor Briefing)</h4>
          <div style={{ background: "#f8fafc", borderLeft: "4px solid #059669", padding: "15px", marginBottom: "30px", fontSize: "13px", lineHeight: "1.7" }}>
            <div style={{ marginBottom: "8px" }}>• নির্বাচিত সময়ে আপনার মোট বিক্রয় <strong>{formatCurrency(totalSalesVal)}</strong> এবং দোকান পরিচালন ও ক্রয়ের যাবতীয় খরচ বাদ দিয়ে নিট প্রফিট হয়েছে <strong>{formatCurrency(netProfitVal)}</strong>।</div>
            <div style={{ marginBottom: "8px" }}>• বিক্রয়ের বিপরীতে নিট লাভের হার <strong>{profitMargin}%</strong>। {
              netProfitVal < 0 
                ? "সতর্কতা: আপনার ব্যবসা লোকসানে চলছে! খরচের পরিমাণ বিক্রয় লভ্যাংশকে ছাড়িয়ে গেছে।" 
                : Number(profitMargin) >= 20 
                  ? "এটি একটি খুচরা দোকানের জন্য অত্যন্ত ভালো মুনাফার হার! এই ধারা বজায় রাখুন।" 
                  : "যা স্বাভাবিক সীমার মধ্যে আছে। মুনাফা বাড়াতে দোকান পরিচালনা ব্যয় নিয়ন্ত্রণ করতে পারেন।"
            }</div>
            <div style={{ marginBottom: "8px" }}>• দোকান খরচ অনুপাত <strong>{expenseRatio}%</strong>। {
              Number(expenseRatio) >= 15 
                ? "খরচ বিক্রয়ের তুলনায় বেশি হচ্ছে, তাই পরিচালনা খরচ কমানোর পরামর্শ দেওয়া যাচ্ছে।" 
                : "পরিচালনা খরচ নিয়ন্ত্রণে রয়েছে।"
            }</div>
            <div>• বকেয়া বিক্রয়ের হার <strong>{dueRatio}%</strong> (মোট বকেয়া: <strong>{formatCurrency(totalDuesVal)}</strong>)। {
              Number(dueRatio) >= 15 
                ? "বাজারে বকেয়া বিক্রয়ের হার অনেক বেশি। দ্রুত বকেয়া আদায়ের তাগিদ দিন, নতুবা ক্যাশ সংকটের ঝুঁকি তৈরি হতে পারে।" 
                : "বকেয়া সীমার মধ্যে রয়েছে।"
            }</div>
          </div>

          <h4 style={{ margin: "0 0 10px 0", color: "#0f172a", fontSize: "16px", borderBottom: "1px solid #cbd5e1", paddingBottom: "6px" }}>৩. বিক্রয় বিবরণী তালিকা (Invoices Registry)</h4>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                <th style={{ padding: "8px", border: "1px solid #cbd5e1" }}>রসিদ নম্বর</th>
                <th style={{ padding: "8px", border: "1px solid #cbd5e1" }}>তারিখ</th>
                <th style={{ padding: "8px", border: "1px solid #cbd5e1" }}>কাস্টমার</th>
                <th style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>মোট মূল্য (৳)</th>
                <th style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>পরিশোধ (৳)</th>
                <th style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>বকেয়া (৳)</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.slice(0, 25).map(s => (
                <tr key={s.id}>
                  <td style={{ padding: "8px", border: "1px solid #e2e8f0" }}>{s.invoiceNumber}</td>
                  <td style={{ padding: "8px", border: "1px solid #e2e8f0" }}>{formatDate(s.date, "DD/MM/YYYY")}</td>
                  <td style={{ padding: "8px", border: "1px solid #e2e8f0" }}>{s.customerName || "খুচরা ক্রেতা"}</td>
                  <td style={{ padding: "8px", border: "1px solid #e2e8f0", textAlign: "right" }}>{s.payableAmount}</td>
                  <td style={{ padding: "8px", border: "1px solid #e2e8f0", textAlign: "right" }}>{s.paidAmount}</td>
                  <td style={{ padding: "8px", border: "1px solid #e2e8f0", textAlign: "right" }}>{s.dueAmount}</td>
                </tr>
              ))}
              {filteredSales.length > 25 && (
                <tr>
                  <td colSpan="6" style={{ padding: "8px", border: "1px solid #e2e8f0", textAlign: "center", fontStyle: "italic", color: "#64748b" }}>
                    ...এবং আরও {filteredSales.length - 25} টি বিক্রয় রসিদ সংক্ষেপিত করা হয়েছে।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          <div style={{ marginTop: "40px", borderTop: "1px solid #cbd5e1", paddingTop: "15px", textAlign: "center", fontSize: "11px", color: "#64748b" }}>
            রিপোর্টটি <strong>Shop Khata Pro</strong> দ্বারা সুরক্ষিতভাবে প্রস্তুতকৃত। জেনারেট হওয়ার তারিখ: {new Date().toLocaleString()}
          </div>
        </div>
      </div>
    );
  } catch (err) {
    console.error("Render block failed:", err);
    setErrorBoundary(err);
    return null;
  }
}
