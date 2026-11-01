import React, { useState, useEffect, useRef } from "react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { formatCurrency, formatDate } from "../utils/formatters";
import { exportToExcel, exportEnhancedReportToExcel, exportCombinedReportToExcel } from "../utils/excelGenerator";
import dayjs from "dayjs";
import CopyableText from "../components/CopyableText";
import Chart from "chart.js/auto";
import TeaReportSection from "../tea/reports/TeaReportSection";
import * as teaApi from "../tea/context/teaDb";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export default function Reports() {
  const { currentUser, isLocalMode } = useAuth();
  const { sales = [], purchases = [], expenses = [], products = [], loading } = useData();
  const [errorBoundary, setErrorBoundary] = useState(null);

  // Business view selector: 'combined' | 'mudi' | 'tea'
  const [businessView, setBusinessView] = useState("combined");

  // Tea stall data for combined analytics
  const [teaOrders, setTeaOrders] = useState([]);
  const [teaExpenses, setTeaExpenses] = useState([]);

  // Date filters: 'today' | 'yesterday' | 'week' | 'month' | 'custom'
  const [filterType, setFilterType] = useState("week");
  const [startDate, setStartDate] = useState(dayjs().subtract(7, "day").format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(dayjs().format("YYYY-MM-DD"));

  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Fetch tea stall records
  useEffect(() => {
    if (!currentUser) return;
    teaApi.getTeaOrders(currentUser.uid, isLocalMode)
      .then(ords => setTeaOrders(ords || []))
      .catch(e => console.error("Tea orders fetch error:", e));

    teaApi.getTeaExpenses(currentUser.uid, isLocalMode)
      .then(exps => setTeaExpenses(exps || []))
      .catch(e => console.error("Tea expenses fetch error:", e));
  }, [currentUser, isLocalMode]);

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

  // Tea filtered data
  const filteredTeaOrders = teaOrders.filter(o => isDateInRange(o.date || o.createdAt?.slice(0, 10)));
  const filteredTeaExpenses = teaExpenses.filter(e => isDateInRange(e.date || e.createdAt?.slice(0, 10)));

  // Mudi calculations
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

  // Tea calculations
  const totalTeaSales = filteredTeaOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalTeaExpenses = filteredTeaExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalTeaDues = filteredTeaOrders.reduce((sum, o) => sum + (o.due || 0), 0);
  const netTeaProfit = totalTeaSales - totalTeaExpenses;

  // Active Metrics depending on businessView ('combined' | 'mudi' | 'tea')
  const activeSales = businessView === "combined" ? totalSalesVal + totalTeaSales : (businessView === "tea" ? totalTeaSales : totalSalesVal);
  const activePurchases = businessView === "tea" ? 0 : totalPurchaseVal;
  const activeExpenses = businessView === "combined" ? totalExpenseVal + totalTeaExpenses : (businessView === "tea" ? totalTeaExpenses : totalExpenseVal);
  const activeNetProfit = businessView === "combined" ? netProfitVal + netTeaProfit : (businessView === "tea" ? netTeaProfit : netProfitVal);
  const activeDues = businessView === "combined" ? totalDuesVal + totalTeaDues : (businessView === "tea" ? totalTeaDues : totalDuesVal);

  // Key Ratios
  const profitMargin = activeSales > 0 ? ((activeNetProfit / activeSales) * 100).toFixed(1) : "0.0";
  const expenseRatio = activeSales > 0 ? ((activeExpenses / activeSales) * 100).toFixed(1) : "0.0";
  const dueRatio = activeSales > 0 ? ((activeDues / activeSales) * 100).toFixed(1) : "0.0";

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
          labels: ["Total Sales", "Purchase", "Expense", "Net Profit"],
          datasets: [
            {
              data: [activeSales, activePurchases, activeExpenses, activeNetProfit],
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
  }, [activeSales, activePurchases, activeExpenses, activeNetProfit, loading]);

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
    const teaMargin = totalTeaSales > 0 ? ((netTeaProfit / totalTeaSales) * 100).toFixed(1) : "0.0";

    if (businessView === "combined" || businessView === "tea") {
      const mudiSummary = {
        totalSales: totalSalesVal,
        totalPurchases: totalPurchaseVal,
        totalExpenses: totalExpenseVal,
        netProfit: netProfitVal,
        totalDues: totalDuesVal,
        profitMargin: totalSalesVal > 0 ? ((netProfitVal / totalSalesVal) * 100).toFixed(1) : "0.0"
      };
      const teaSummary = {
        totalSales: totalTeaSales,
        totalExpenses: totalTeaExpenses,
        netProfit: netTeaProfit,
        totalDues: totalTeaDues,
        profitMargin: teaMargin
      };
      exportCombinedReportToExcel(
        mudiSummary, teaSummary, filteredSales, filteredTeaOrders, filteredTeaExpenses,
        startDate, endDate, `ShopKhataPro_Combined_${startDate}_to_${endDate}`
      );
    } else {
      const summary = {
        totalSales: totalSalesVal,
        totalPurchases: totalPurchaseVal,
        totalExpenses: totalExpenseVal,
        netProfit: netProfitVal,
        profitMargin: totalSalesVal > 0 ? ((netProfitVal / totalSalesVal) * 100).toFixed(1) : "0.0"
      };
      exportEnhancedReportToExcel(summary, filteredSales, startDate, endDate, `ShopKhataPro_Mudi_${startDate}_to_${endDate}`);
    }
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
        {/* Title & Business Scope Selector */}
        <div className="mb-4 no-print">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
            <div>
              <h2 className="h4 mb-1">Reports & Analytics</h2>
              <p className="text-muted fs-7 mb-0">ব্যবসায়িক লাভ-ক্ষতি ও যৌথ বিক্রয় রিপোর্টের বিশ্লেষণ</p>
            </div>
            {/* View Scope Tabs */}
            <div className="btn-group btn-group-sm" role="group">
              <button 
                type="button" 
                className={`btn ${businessView === "combined" ? "btn-success" : "btn-outline-secondary"}`}
                onClick={() => setBusinessView("combined")}
              >
                🏪 সমন্বিত (মুদি + চা স্টল)
              </button>
              <button 
                type="button" 
                className={`btn ${businessView === "mudi" ? "btn-success" : "btn-outline-secondary"}`}
                onClick={() => setBusinessView("mudi")}
              >
                🛒 শুধু মুদি
              </button>
              <button 
                type="button" 
                className={`btn ${businessView === "tea" ? "btn-success" : "btn-outline-secondary"}`}
                onClick={() => setBusinessView("tea")}
              >
                🍵 শুধু চা স্টল
              </button>
            </div>
          </div>
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
          <div className="col-6 col-md-3">
            <div className="card-custom bg-success text-white p-3 h-100">
              <small className="opacity-75 fs-8 text-uppercase">Sales (বিক্রয়)</small>
              <h4 className="m-0 fw-bold">{formatCurrency(activeSales)}</h4>
              {businessView === "combined" && (
                <div className="fs-9 opacity-75 mt-1">মুদি: {formatCurrency(totalSalesVal)} | চা: {formatCurrency(totalTeaSales)}</div>
              )}
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="card-custom bg-info text-white p-3 h-100">
              <small className="opacity-75 fs-8 text-uppercase">Purchases (ক্রয়)</small>
              <h4 className="m-0 fw-bold">{formatCurrency(activePurchases)}</h4>
              {businessView === "combined" && (
                <div className="fs-9 opacity-75 mt-1">মুদি ইনভেন্টরি পারচেজ</div>
              )}
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="card-custom bg-danger text-white p-3 h-100">
              <small className="opacity-75 fs-8 text-uppercase">Expenses (খরচ)</small>
              <h4 className="m-0 fw-bold">{formatCurrency(activeExpenses)}</h4>
              {businessView === "combined" && (
                <div className="fs-9 opacity-75 mt-1">দোকান: {formatCurrency(totalExpenseVal)} | চা/দুধ/গ্যাস: {formatCurrency(totalTeaExpenses)}</div>
              )}
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="card-custom bg-warning text-dark p-3 h-100">
              <small className="opacity-75 fs-8 text-uppercase">Net Profit (লাভ)</small>
              <h4 className={`m-0 fw-bold ${activeNetProfit >= 0 ? "text-success-emphasis" : "text-danger-emphasis"}`}>
                {formatCurrency(activeNetProfit)}
              </h4>
              {businessView === "combined" && (
                <div className="fs-9 opacity-75 mt-1">মুদি: {formatCurrency(netProfitVal)} | চা: {formatCurrency(netTeaProfit)}</div>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Financial Advisory Briefing */}
        <div className="card-custom bg-white border border-success-subtle p-3 mb-4 no-print">
          <h4 className="h6 text-success text-uppercase mb-3 font-monospace d-flex align-items-center gap-1">
            <i className="bi bi-lightbulb-fill"></i> Financial Advisory ({businessView === "combined" ? "যৌথ পরামর্শ" : businessView === "tea" ? "চা স্টল পরামর্শ" : "মুদি পরামর্শ"})
          </h4>
          <div className="fs-7 text-dark" style={{ lineHeight: "1.6" }}>
            {activeSales === 0 ? (
              <p className="text-muted m-0">এই সময়ে কোনো বিক্রয় সংঘটিত হয়নি। পরামর্শ পেতে নতুন পণ্য বিক্রয় নথিভুক্ত করুন।</p>
            ) : (
              <div>
                <p className="mb-2">
                  ১. এই সময়ে আপনার মোট বিক্রয় হয়েছে <strong>{formatCurrency(activeSales)}</strong> এবং যাবতীয় খরচ বাদ দিয়ে আসল নিট লাভ হয়েছে <strong>{formatCurrency(activeNetProfit)}</strong>।
                  {businessView === "combined" && (
                    <span className="text-muted d-block fs-8 mt-1">
                      (যার মধ্যে মুদি বিক্রয় {formatCurrency(totalSalesVal)} ও লাভ {formatCurrency(netProfitVal)}, এবং চা স্টল বিক্রয় {formatCurrency(totalTeaSales)} ও লাভ {formatCurrency(netTeaProfit)})
                    </span>
                  )}
                </p>
                <p className="mb-2">
                  ২. বিক্রয়ের বিপরীতে নিট লাভের হার <strong>{profitMargin}%</strong>। {
                    activeNetProfit < 0 
                      ? "⚠️ আপনার ব্যবসা বর্তমানে লোকসানে রয়েছে। বিক্রয়মূল্য পুনর্নির্ধারণ করা অথবা পরিচালনা খরচ কমানো প্রয়োজন।" 
                      : Number(profitMargin) >= 20 
                        ? "🎉 এটি একটি খুচরা ব্যবসার জন্য অত্যন্ত ভালো মুনাফার হার! এই ধারা বজায় রাখুন।" 
                        : "💼 এটি একটি স্বাভাবিক মুনাফার হার। লাভ বাড়াতে ব্যয় নিয়ন্ত্রণে জোর দিন।"
                  }
                </p>
                <p className="mb-2">
                  ৩. আপনার পরিচালন খরচের হার <strong>{expenseRatio}%</strong>। {
                    Number(expenseRatio) >= 15 
                      ? "⚠️ বিক্রয়ের তুলনায় পরিচালনা খরচ কিছুটা বেশি। খরচ নিয়ন্ত্রণে মনোযোগী হোন।" 
                      : "✅ আপনার পরিচালনা খরচ নিয়ন্ত্রণে রয়েছে।"
                  }
                </p>
                <p className="mb-0">
                  ৪. মোট বিক্রয়ের মধ্যে <strong>{dueRatio}%</strong> টাকা বাজারে বকেয়া আটকে আছে (বকেয়া পরিমাণ: <strong>{formatCurrency(activeDues)}</strong>)। {
                    Number(dueRatio) >= 15 
                      ? "⚠️ আপনার বাকি বা খাতার বকেয়া বিক্রয়ের হার বেশি। দ্রুত বকেয়া আদায়ের চেষ্টা করুন।" 
                      : "✅ বকেয়া বিক্রয়ের হার স্বাভাবিক সীমার মধ্যে রয়েছে।"
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

        {/* Integrated Tea & Cigarette Stall Report Section */}
        {businessView !== "mudi" && (
          <TeaReportSection startDate={startDate} endDate={endDate} />
        )}

        {/* Export operations */}
        <div className="card-custom bg-white border border-light p-3 mb-4 no-print">
          <h4 className="h6 text-muted text-uppercase mb-3 font-monospace">
            Export Report {businessView === "combined" ? "(সমন্বিত)" : businessView === "tea" ? "(চা স্টল)" : "(মুদি)"}
          </h4>
          <div className="d-flex gap-2">
            <button 
              type="button" 
              className="btn btn-custom btn-custom-primary flex-grow-1 font-monospace"
              onClick={handleExportPDF}
              disabled={filteredSales.length === 0 && filteredTeaOrders.length === 0}
            >
              <i className="bi bi-file-earmark-pdf"></i> {businessView === "combined" ? "Combined PDF" : "Export PDF"}
            </button>
            <button 
              type="button" 
              className="btn btn-custom btn-custom-secondary flex-grow-1 font-monospace"
              onClick={handleExportExcel}
              disabled={filteredSales.length === 0 && filteredTeaOrders.length === 0}
            >
              <i className="bi bi-file-earmark-spreadsheet"></i> {businessView === "combined" ? "Combined Excel" : "Export Excel"}
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
                        <div className="fw-semibold fs-8">
                          <CopyableText text={sale.invoiceNumber} />
                        </div>
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
            <p style={{ margin: 0, fontSize: "13px", color: "#475569" }}>মুদি দোকান ও চা স্টল — সমন্বিত আর্থিক প্রতিবেদন</p>
            <p style={{ margin: "6px 0 0 0", fontSize: "13px", color: "#334155", fontWeight: "bold" }}>রিপোর্ট সময়কাল: {startDate} থেকে {endDate}</p>
          </div>

          {/* Section 1: Combined Financial Comparison Table */}
          <h4 style={{ margin: "0 0 10px 0", color: "#0f172a", fontSize: "16px", borderBottom: "1px solid #cbd5e1", paddingBottom: "6px" }}>১. সমন্বিত আর্থিক সারসংক্ষেপ (Combined Financial Summary)</h4>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "25px", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                <th style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "left" }}>বিবরণ</th>
                <th style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>মুদি দোকান (৳)</th>
                <th style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>চা ও সিগারেট স্টল (৳)</th>
                <th style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right", fontWeight: "bold" }}>সর্বমোট (৳)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: "#f8fafc" }}>
                <td style={{ padding: "8px", border: "1px solid #e2e8f0" }}>মোট বিক্রয় (Total Sales)</td>
                <td style={{ padding: "8px", border: "1px solid #e2e8f0", textAlign: "right" }}>{formatCurrency(totalSalesVal)}</td>
                <td style={{ padding: "8px", border: "1px solid #e2e8f0", textAlign: "right" }}>{formatCurrency(totalTeaSales)}</td>
                <td style={{ padding: "8px", border: "1px solid #e2e8f0", textAlign: "right", fontWeight: "bold" }}>{formatCurrency(totalSalesVal + totalTeaSales)}</td>
              </tr>
              <tr>
                <td style={{ padding: "8px", border: "1px solid #e2e8f0" }}>পণ্য ক্রয় (Purchases)</td>
                <td style={{ padding: "8px", border: "1px solid #e2e8f0", textAlign: "right" }}>{formatCurrency(totalPurchaseVal)}</td>
                <td style={{ padding: "8px", border: "1px solid #e2e8f0", textAlign: "right", color: "#94a3b8" }}>—</td>
                <td style={{ padding: "8px", border: "1px solid #e2e8f0", textAlign: "right", fontWeight: "bold" }}>{formatCurrency(totalPurchaseVal)}</td>
              </tr>
              <tr style={{ background: "#f8fafc" }}>
                <td style={{ padding: "8px", border: "1px solid #e2e8f0" }}>পরিচালন খরচ (Expenses)</td>
                <td style={{ padding: "8px", border: "1px solid #e2e8f0", textAlign: "right" }}>{formatCurrency(totalExpenseVal)}</td>
                <td style={{ padding: "8px", border: "1px solid #e2e8f0", textAlign: "right" }}>{formatCurrency(totalTeaExpenses)}</td>
                <td style={{ padding: "8px", border: "1px solid #e2e8f0", textAlign: "right", fontWeight: "bold" }}>{formatCurrency(totalExpenseVal + totalTeaExpenses)}</td>
              </tr>
              <tr style={{ background: "#f0fdf4" }}>
                <td style={{ padding: "8px", border: "1px solid #e2e8f0", fontWeight: "bold", color: "#166534" }}>নিট লাভ (Net Profit)</td>
                <td style={{ padding: "8px", border: "1px solid #e2e8f0", textAlign: "right", fontWeight: "bold" }}>{formatCurrency(netProfitVal)}</td>
                <td style={{ padding: "8px", border: "1px solid #e2e8f0", textAlign: "right", fontWeight: "bold" }}>{formatCurrency(netTeaProfit)}</td>
                <td style={{ padding: "8px", border: "1px solid #e2e8f0", textAlign: "right", fontWeight: "bold", color: "#166534" }}>{formatCurrency(netProfitVal + netTeaProfit)}</td>
              </tr>
              <tr>
                <td style={{ padding: "8px", border: "1px solid #e2e8f0" }}>বকেয়া/বাকি (Dues)</td>
                <td style={{ padding: "8px", border: "1px solid #e2e8f0", textAlign: "right" }}>{formatCurrency(totalDuesVal)}</td>
                <td style={{ padding: "8px", border: "1px solid #e2e8f0", textAlign: "right" }}>{formatCurrency(totalTeaDues)}</td>
                <td style={{ padding: "8px", border: "1px solid #e2e8f0", textAlign: "right", fontWeight: "bold" }}>{formatCurrency(totalDuesVal + totalTeaDues)}</td>
              </tr>
            </tbody>
          </table>

          {/* Section 2: Combined Advisory */}
          <h4 style={{ margin: "0 0 10px 0", color: "#0f172a", fontSize: "16px", borderBottom: "1px solid #cbd5e1", paddingBottom: "6px" }}>২. সমন্বিত ব্যবসায়িক পরামর্শ (Combined Advisory)</h4>
          <div style={{ background: "#f8fafc", borderLeft: "4px solid #059669", padding: "15px", marginBottom: "25px", fontSize: "12px", lineHeight: "1.7" }}>
            <div style={{ marginBottom: "8px" }}>• সর্বমোট বিক্রয় <strong>{formatCurrency(totalSalesVal + totalTeaSales)}</strong> (মুদি: {formatCurrency(totalSalesVal)}, চা স্টল: {formatCurrency(totalTeaSales)})। সকল খরচ বাদে যৌথ নিট মুনাফা <strong>{formatCurrency(netProfitVal + netTeaProfit)}</strong>।</div>
            <div style={{ marginBottom: "8px" }}>• যৌথ লাভের হার <strong>{profitMargin}%</strong>। {
              activeNetProfit < 0 
                ? "সতর্কতা: আপনার ব্যবসা লোকসানে চলছে!" 
                : Number(profitMargin) >= 20 
                  ? "এটি অত্যন্ত ভালো মুনাফার হার!" 
                  : "স্বাভাবিক মুনাফার হার। খরচ নিয়ন্ত্রণে মনোযোগী হোন।"
            }</div>
            <div>• মোট বকেয়া <strong>{formatCurrency(totalDuesVal + totalTeaDues)}</strong> (মুদি: {formatCurrency(totalDuesVal)}, চা: {formatCurrency(totalTeaDues)})।</div>
          </div>

          {/* Section 3: Tea Stall Orders */}
          <h4 style={{ margin: "0 0 10px 0", color: "#0f172a", fontSize: "16px", borderBottom: "1px solid #cbd5e1", paddingBottom: "6px" }}>৩. চা ও সিগারেট স্টল অর্ডার ({filteredTeaOrders.length} টি)</h4>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "25px", fontSize: "11px" }}>
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                <th style={{ padding: "7px", border: "1px solid #cbd5e1", textAlign: "left" }}>তারিখ</th>
                <th style={{ padding: "7px", border: "1px solid #cbd5e1", textAlign: "left" }}>আইটেম</th>
                <th style={{ padding: "7px", border: "1px solid #cbd5e1", textAlign: "right" }}>মোট (৳)</th>
                <th style={{ padding: "7px", border: "1px solid #cbd5e1", textAlign: "right" }}>নগদ (৳)</th>
                <th style={{ padding: "7px", border: "1px solid #cbd5e1", textAlign: "right" }}>বাকি (৳)</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeaOrders.slice(0, 20).map((o, idx) => (
                <tr key={o.id || idx} style={idx % 2 === 0 ? { background: "#f8fafc" } : {}}>
                  <td style={{ padding: "6px", border: "1px solid #e2e8f0" }}>{o.date || o.createdAt?.slice(0, 10)}</td>
                  <td style={{ padding: "6px", border: "1px solid #e2e8f0" }}>{o.items?.map(i => `${i.name} x${i.qty || 1}`).join(", ") || "—"}</td>
                  <td style={{ padding: "6px", border: "1px solid #e2e8f0", textAlign: "right" }}>{o.total || 0}</td>
                  <td style={{ padding: "6px", border: "1px solid #e2e8f0", textAlign: "right" }}>{o.paid || 0}</td>
                  <td style={{ padding: "6px", border: "1px solid #e2e8f0", textAlign: "right" }}>{o.due || 0}</td>
                </tr>
              ))}
              {filteredTeaOrders.length > 20 && (
                <tr>
                  <td colSpan="5" style={{ padding: "6px", border: "1px solid #e2e8f0", textAlign: "center", fontStyle: "italic", color: "#64748b" }}>
                    ...এবং আরও {filteredTeaOrders.length - 20} টি অর্ডার সংক্ষেপিত।
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Section 4: Mudi Invoices */}
          <h4 style={{ margin: "0 0 10px 0", color: "#0f172a", fontSize: "16px", borderBottom: "1px solid #cbd5e1", paddingBottom: "6px" }}>৪. মুদি দোকান বিক্রয় বিবরণী ({filteredSales.length} টি ইনভয়েস)</h4>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                <th style={{ padding: "8px", border: "1px solid #cbd5e1" }}>রসিদ নম্বর</th>
                <th style={{ padding: "8px", border: "1px solid #cbd5e1" }}>তারিখ</th>
                <th style={{ padding: "8px", border: "1px solid #cbd5e1" }}>কাস্টমার</th>
                <th style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>মোট মূল্য (৳)</th>
                <th style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>পরিশোধ (৳)</th>
                <th style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>বকেয়া (৳)</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.slice(0, 25).map(s => (
                <tr key={s.id}>
                  <td style={{ padding: "8px", border: "1px solid #e2e8f0" }}>
                    <CopyableText text={s.invoiceNumber} />
                  </td>
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
                    ...এবং আরও {filteredSales.length - 25} টি বিক্রয় রসিদ সংক্ষেপিত করা হয়েছে।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          <div style={{ marginTop: "40px", borderTop: "1px solid #cbd5e1", paddingTop: "15px", textAlign: "center", fontSize: "11px", color: "#64748b" }}>
            রিপোর্টটি <strong>Shop Khata Pro</strong> দ্বারা সুরক্ষিতভাবে প্রস্তুতকৃত। জেনারেট হওয়ার তারিখ: {new Date().toLocaleString()}
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
