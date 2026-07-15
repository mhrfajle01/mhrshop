import React, { useEffect, useRef, useState } from "react";
import { useData } from "../context/DataContext";
import { useRouter } from "../context/RouterContext";
import { formatCurrency, formatDate } from "../utils/formatters";
import dayjs from "dayjs";
import Chart from "chart.js/auto";
import SalesInvoice from "../components/SalesInvoice";
import CopyableText from "../components/CopyableText";

export default function Dashboard() {
  const { 
    products, 
    customers, 
    suppliers, 
    expenses, 
    sales, 
    purchases, 
    khata, 
    activities, 
    loading 
  } = useData();
  const { navigateTo } = useRouter();
  
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Accordion drawer toggle states
  const [showCashBreakdown, setShowCashBreakdown] = useState(false);
  const [showTodaySalesList, setShowTodaySalesList] = useState(false);
  const [showTodayPurchasesList, setShowTodayPurchasesList] = useState(false);
  const [showPeriodExpensesList, setShowPeriodExpensesList] = useState(false);
  const [showPeriodProfitBreakdown, setShowPeriodProfitBreakdown] = useState(false);
  const [showLowStockList, setShowLowStockList] = useState(false);
  const [showHighRiskDues, setShowHighRiskDues] = useState(false);
  
  const [selectedSale, setSelectedSale] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [dashboardPeriod, setDashboardPeriod] = useState("today");
  const [openingFloat, setOpeningFloat] = useState(() => Number(localStorage.getItem("cash_opening_float") || 0));
  const [toastConfig, setToastConfig] = useState({ show: false, message: "" });

  // Compute stats
  const todayStr = dayjs().format("YYYY-MM-DD");

  const handleCopyDailyBlueprint = () => {
    const todayStrVal = dayjs().format("YYYY-MM-DD");
    const todaySalesDocs = sales.filter(s => !s.deleted && s.date === todayStrVal);
    const todaySalesCash = todaySalesDocs.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
    const todaySalesDues = todaySalesDocs.reduce((acc, s) => acc + (s.dueAmount || 0), 0);

    const todayPurchasesDocs = purchases.filter(p => !p.deleted && p.date === todayStrVal);
    const todayPurchasesCash = todayPurchasesDocs.reduce((acc, p) => acc + (p.paidAmount || 0), 0);
    const todayPurchasesDues = todayPurchasesDocs.reduce((acc, p) => acc + (p.dueAmount || 0), 0);

    const todayExpensesDocs = expenses.filter(e => !e.deleted && e.date === todayStrVal);
    const todayExpensesTotal = todayExpensesDocs.reduce((acc, e) => acc + (e.amount || 0), 0);

    const todayKhataCustomerPayments = khata.filter(k => !k.deleted && k.date === todayStrVal && k.partyType === "customer" && k.type === "payment").reduce((acc, k) => acc + (k.amount || 0), 0);
    const todayKhataCustomerDues = khata.filter(k => !k.deleted && k.date === todayStrVal && k.partyType === "customer" && k.type === "due" && !(k.description || "").includes("বিক্রয় রসিদ")).reduce((acc, k) => acc + (k.amount || 0), 0);
    const todayKhataSupplierPayments = khata.filter(k => !k.deleted && k.date === todayStrVal && k.partyType === "supplier" && k.type === "payment").reduce((acc, k) => acc + (k.amount || 0), 0);
    const todayKhataSupplierDues = khata.filter(k => !k.deleted && k.date === todayStrVal && k.partyType === "supplier" && k.type === "due" && !(k.description || "").includes("ক্রয় রসিদ")).reduce((acc, k) => acc + (k.amount || 0), 0);

    const todayCashReceived = todaySalesCash + todayKhataCustomerPayments;
    const todayCashPaid = todayPurchasesCash + todayKhataSupplierPayments + todayExpensesTotal;
    const todayNetCashHand = todayCashReceived - todayCashPaid;

    const openingFloatVal = Number(localStorage.getItem("cash_opening_float") || 0);
    const expectedDrawerCash = openingFloatVal + todayNetCashHand;

    const netCustomerDueChange = (todaySalesDues + todayKhataCustomerDues) - todayKhataCustomerPayments;
    const netSupplierDueChange = (todayPurchasesDues + todayKhataSupplierDues) - todayKhataSupplierPayments;

    const text = `তারিখ: ${formatDate(todayStrVal, "DD MMMM YYYY")}
--------------------------------------------
১. ক্যাশ ড্রয়ার বিবরণী (Cash Drawer Statement)
--------------------------------------------
(+) প্রারম্ভিক ক্যাশ ফ্লোট (Opening Cash): ${formatCurrency(openingFloatVal)}
(+) নগদ ও ক্যাশ বিক্রয় (Cash Sales): ${formatCurrency(todaySalesCash)}
(+) কাস্টমার থেকে বকেয়া আদায় (Payment In): ${formatCurrency(todayKhataCustomerPayments)}
(-) পাইকারি নগদ ক্রয় (Wholesale Paid): ${formatCurrency(todayPurchasesCash)}
(-) সাপ্লায়ারকে বকেয়া পরিশোধ (Payment Out): ${formatCurrency(todayKhataSupplierPayments)}
(-) দোকান পরিচালন খরচ (Operating Expenses): ${formatCurrency(todayExpensesTotal)}
--------------------------------------------
(=) নিট ক্যাশ ফ্লো (Net Cash Flow): ${formatCurrency(todayNetCashHand)}
(=) বাক্সে নগদ থাকা উচিত (Closing Cash): ${formatCurrency(expectedDrawerCash)}

--------------------------------------------
২. কাস্টমার বকেয়া বিবরণী (Customer Credit Ledger)
--------------------------------------------
(+) আজকের নতুন বাকি বিক্রয় (Invoice Credit): ${formatCurrency(todaySalesDues)}
(+) ম্যানুয়াল বাকি খাতা এন্ট্রি (Khata Dues): ${formatCurrency(todayKhataCustomerDues)}
(-) কাস্টমার থেকে বকেয়া আদায় (Dues Collected): ${formatCurrency(todayKhataCustomerPayments)}
--------------------------------------------
(=) নিট কাস্টমার বকেয়া পরিবর্তন (Net Due Change): ${formatCurrency(netCustomerDueChange)}

--------------------------------------------
৩. সাপ্লায়ার দেনা বিবরণী (Supplier Accounts Payable)
--------------------------------------------
(+) আজকের নতুন মহাজন বাকি ক্রয় (Invoice Credit): ${formatCurrency(todayPurchasesDues)}
(+) ম্যানুয়াল মহাজন দেনা এন্ট্রি (Khata Dues): ${formatCurrency(todayKhataSupplierDues)}
(-) মহাজন বকেয়া দেনাশোধ (Dues Paid): ${formatCurrency(todayKhataSupplierPayments)}
--------------------------------------------
(=) নিট মহাজন দেনা পরিবর্তন (Net Payable Change): ${formatCurrency(netSupplierDueChange)}`;

    navigator.clipboard.writeText(text);
    
    setToastConfig({
      show: true,
      message: "আজকের হিসেব ব্লুপ্রিন্ট ক্লিপবোর্ডে কপি করা হয়েছে!"
    });
    setTimeout(() => {
      setToastConfig({ show: false, message: "" });
    }, 3000);
  };
  
  // Get date range for the active dashboardPeriod
  const getPeriodDates = (period) => {
    const today = dayjs().format("YYYY-MM-DD");
    if (period === "today") {
      return { start: today, end: today };
    } else if (period === "yesterday") {
      const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");
      return { start: yesterday, end: yesterday };
    } else if (period === "week") {
      const startOfWeek = dayjs().startOf("week").format("YYYY-MM-DD");
      return { start: startOfWeek, end: today };
    } else if (period === "month") {
      const startOfMonth = dayjs().startOf("month").format("YYYY-MM-DD");
      return { start: startOfMonth, end: today };
    }
    return { start: today, end: today };
  };

  const isDateInPeriod = (dateStr) => {
    const { start, end } = getPeriodDates(dashboardPeriod);
    return dateStr >= start && dateStr <= end;
  };

  const getPeriodLabel = (period, suffix) => {
    const labels = {
      today: "Today's",
      yesterday: "Yesterday's",
      week: "This Week's",
      month: "This Month's"
    };
    return `${labels[period] || "Today's"} ${suffix}`;
  };
  
  // Period Cash Flow calculations
  const todaySalesPaid = sales.filter(s => isDateInPeriod(s.date)).reduce((acc, s) => acc + s.paidAmount, 0);
  const todayPurchasesPaid = purchases.filter(p => isDateInPeriod(p.date)).reduce((acc, p) => acc + p.paidAmount, 0);
  const todayExpensesPaid = expenses.filter(e => isDateInPeriod(e.date)).reduce((acc, e) => acc + e.amount, 0);
  const todayCustomerKhataReceived = khata
    .filter(k => isDateInPeriod(k.date) && k.partyType === "customer" && k.type === "payment")
    .reduce((acc, k) => acc + k.amount, 0);
  const todaySupplierKhataPaid = khata
    .filter(k => isDateInPeriod(k.date) && k.partyType === "supplier" && k.type === "payment")
    .reduce((acc, k) => acc + k.amount, 0);

  const todayCashInflow = todaySalesPaid + todayCustomerKhataReceived;
  const todayCashOutflow = todayPurchasesPaid + todaySupplierKhataPaid + todayExpensesPaid;
  const todayNetCashFlow = todayCashInflow - todayCashOutflow;

  // Filter period sales, purchases, expenses list
  const todaySalesRecords = sales.filter(s => isDateInPeriod(s.date));
  const todayPurchasesRecords = purchases.filter(p => isDateInPeriod(p.date));
  const todayExpensesRecords = expenses.filter(e => isDateInPeriod(e.date));
  
  // Period Sales value
  const todaySalesVal = sales
    .filter(s => isDateInPeriod(s.date))
    .reduce((acc, s) => acc + s.payableAmount, 0);

  // Period Purchase value
  const todayPurchaseVal = purchases
    .filter(p => isDateInPeriod(p.date))
    .reduce((acc, p) => acc + p.totalAmount, 0);

  // Period Expense value
  const todayExpenseVal = expenses
    .filter(e => isDateInPeriod(e.date))
    .reduce((acc, e) => acc + e.amount, 0);

  // Period Profit: Sales Gross Profit - Expenses
  let todayGrossProfit = 0;
  todaySalesRecords.forEach(sale => {
    sale.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      const buyPrice = item.purchasePrice || (prod ? prod.purchasePrice : 0);
      const profitPerItem = item.sellingPrice - buyPrice;
      todayGrossProfit += profitPerItem * item.quantity;
    });
  });
  const todayNetProfit = todayGrossProfit - todayExpenseVal;

  // Cumulative Cash In Hand Calculation (All-time drawer balance)
  const totalSalesPaid = sales.reduce((acc, s) => acc + s.paidAmount, 0);
  const totalPurchasesPaid = purchases.reduce((acc, p) => acc + p.paidAmount, 0);
  const totalExpensesPaid = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalKhataCustomerReceived = khata
    .filter(k => k.partyType === "customer" && k.type === "payment")
    .reduce((acc, k) => acc + k.amount, 0);
  const totalKhataSupplierPaid = khata
    .filter(k => k.partyType === "supplier" && k.type === "payment")
    .reduce((acc, k) => acc + k.amount, 0);

  const cashInHand = openingFloat + (totalSalesPaid + totalKhataCustomerReceived) - 
                     (totalPurchasesPaid + totalKhataSupplierPaid + totalExpensesPaid);

  // Total Due Balance
  const totalCustomerDue = customers.reduce((acc, c) => acc + (c.due || 0), 0);
  const totalSupplierDue = suppliers.reduce((acc, s) => acc + (s.due || 0), 0);

  // Low Stock Items
  const lowStockCount = products.filter(p => p.stock <= (p.minStock || 0)).length;

  // Recent Activities
  const recentActivities = activities.slice(0, 5);

  // Chart Rendering: Last 7 Days Sales
  useEffect(() => {
    if (loading || sales.length === 0 || !chartRef.current) return;

    // Destroy old chart to avoid leaks
    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    const last7Days = Array.from({ length: 7 })
      .map((_, i) => dayjs().subtract(i, "day").format("YYYY-MM-DD"))
      .reverse();

    const salesData = last7Days.map(date => {
      return sales
        .filter(s => s.date === date)
        .reduce((acc, s) => acc + s.payableAmount, 0);
    });

    const labels = last7Days.map(date => dayjs(date).format("DD MMM"));

    const ctx = chartRef.current.getContext("2d");
    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Daily Sales (৳)",
            data: salesData,
            backgroundColor: "#198754",
            borderRadius: 6,
            barThickness: 16
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

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [sales, loading]);

  if (loading) {
    return (
      <div className="main-content d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      {/* Title with Period Filter */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4 no-print">
        <div>
          <h2 className="h4 mb-1">Dashboard</h2>
          <p className="text-muted fs-7 mb-0">ব্যবসায়িক হিসাব-নিকাশ এবং সংক্ষিপ্ত চিত্র ({dashboardPeriod === "today" ? "আজকের চিত্র" : dashboardPeriod === "yesterday" ? "গতকালের চিত্র" : dashboardPeriod === "week" ? "সাপ্তাহিক চিত্র" : "মাসিক চিত্র"})</p>
        </div>
        <div className="btn-group btn-group-sm bg-white border rounded shadow-sm w-100 w-sm-auto justify-content-between" role="group" aria-label="Period switcher">
          {["today", "yesterday", "week", "month"].map((p) => (
            <button
              key={p}
              type="button"
              className={`btn btn-sm btn-custom py-1.5 flex-grow-1 flex-sm-grow-0 px-2.5 font-monospace text-capitalize ${dashboardPeriod === p ? "btn-success text-white" : "btn-light text-secondary border-0"}`}
              style={{ borderRadius: "6px", fontSize: "11px", fontWeight: "600" }}
              onClick={() => {
                setDashboardPeriod(p);
                // Close lists to avoid confusion
                setShowTodaySalesList(false);
                setShowTodayPurchasesList(false);
                setShowPeriodExpensesList(false);
                setShowPeriodProfitBreakdown(false);
                setShowCashBreakdown(false);
                setShowLowStockList(false);
                setShowHighRiskDues(false);
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Main KPI Stats Block */}
      <div className="card-custom bg-success text-white mb-3">
        <div className="row text-center py-2">
          <div 
            className="col-6 border-end border-white-50 cursor-pointer pointer-active" 
            onClick={() => {
              setShowTodaySalesList(!showTodaySalesList);
              setShowCashBreakdown(false);
              setShowTodayPurchasesList(false);
              setShowPeriodExpensesList(false);
              setShowPeriodProfitBreakdown(false);
              setShowLowStockList(false);
              setShowHighRiskDues(false);
            }}
            style={{ cursor: "pointer" }}
          >
            <small className="opacity-75 fs-8 text-uppercase d-flex align-items-center justify-content-center gap-1">
              {getPeriodLabel(dashboardPeriod, "Sales")} <i className={`bi ${showTodaySalesList ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
            </small>
            <h3 className="m-0 fw-bold">{formatCurrency(todaySalesVal)}</h3>
          </div>
          <div 
            className="col-6 cursor-pointer pointer-active" 
            onClick={() => {
              setShowCashBreakdown(!showCashBreakdown);
              setShowTodaySalesList(false);
              setShowTodayPurchasesList(false);
              setShowPeriodExpensesList(false);
              setShowPeriodProfitBreakdown(false);
              setShowLowStockList(false);
              setShowHighRiskDues(false);
            }}
            style={{ cursor: "pointer" }}
          >
            <small className="opacity-75 fs-8 text-uppercase d-flex align-items-center justify-content-center gap-1">
              Cash in Hand <i className={`bi ${showCashBreakdown ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
            </small>
            <h3 className="m-0 fw-bold">{formatCurrency(cashInHand)}</h3>
          </div>
        </div>
      </div>

      {/* DYNAMIC ACCORDION: Cash in Hand Breakdown */}
      {showCashBreakdown && (
        <div className="card-custom bg-white border border-success-subtle p-3 mb-3 no-print">
          <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
            <h5 className="h6 fw-bold text-success m-0 font-monospace">Cash Drawer Breakdown (ক্যাশ বিবরণী)</h5>
            <button className="btn-close" style={{ fontSize: "10px" }} onClick={() => setShowCashBreakdown(false)}></button>
          </div>
          
          <div className="fs-7 font-monospace">
            {/* Period Cash Flow */}
            <div className="fw-semibold text-muted border-bottom pb-1 mb-2">{getPeriodLabel(dashboardPeriod, "Flow")} (ক্যাশ প্রবাহ)</div>
            <div className="d-flex justify-content-between mb-1">
              <span>(+) Sales Cash (বিক্রয় নগদ):</span>
              <span className="text-success">{formatCurrency(todaySalesPaid)}</span>
            </div>
            <div className="d-flex justify-content-between mb-1">
              <span>(+) Customer Dues Coll. (বকেয়া আদায়):</span>
              <span className="text-success">{formatCurrency(todayCustomerKhataReceived)}</span>
            </div>
            <div className="d-flex justify-content-between mb-1">
              <span>(-) Purchases Cash Paid (ক্রয় নগদ):</span>
              <span className="text-danger">{formatCurrency(todayPurchasesPaid)}</span>
            </div>
            <div className="d-flex justify-content-between mb-1">
              <span>(-) Supplier Dues Paid (দেনাশোধ):</span>
              <span className="text-danger">{formatCurrency(todaySupplierKhataPaid)}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span>(-) Operating Expenses (দোকান খরচ):</span>
              <span className="text-danger">{formatCurrency(todayExpensesPaid)}</span>
            </div>
            <div className="d-flex justify-content-between fw-bold border-top pt-1 text-dark mb-3">
              <span>Net Flow (নিট ক্যাশ):</span>
              <span className={todayNetCashFlow >= 0 ? "text-success" : "text-danger"}>{formatCurrency(todayNetCashFlow)}</span>
            </div>

            {/* Overall Cumulative Cash */}
            <div className="fw-semibold text-muted border-bottom pb-1 mb-2 d-flex justify-content-between align-items-center">
              <span>Overall Drawer (মোট ড্রয়ার ক্যাশ)</span>
              <button 
                className="btn btn-link p-0 fs-8 text-success text-decoration-none font-monospace fw-bold"
                onClick={() => {
                  const floatInput = prompt("Enter Opening Cash Float (প্রারম্ভিক ক্যাশ লিখুন):", openingFloat);
                  if (floatInput !== null) {
                    const val = Number(floatInput) || 0;
                    localStorage.setItem("cash_opening_float", val);
                    setOpeningFloat(val);
                  }
                }}
              >
                <i className="bi bi-pencil-square"></i> Set Float
              </button>
            </div>
            <div className="d-flex justify-content-between mb-1">
              <span>(+) Opening Cash Float (প্রারম্ভিক ক্যাশ):</span>
              <span className="text-success">{formatCurrency(openingFloat)}</span>
            </div>
            <div className="d-flex justify-content-between mb-1">
              <span>(+) Total Sales Cash (বিক্রয় ক্যাশ):</span>
              <span className="text-success">{formatCurrency(totalSalesPaid)}</span>
            </div>
            <div className="d-flex justify-content-between mb-1">
              <span>(+) Total Customer Dues Coll. (বকেয়া আদায়):</span>
              <span className="text-success">{formatCurrency(totalKhataCustomerReceived)}</span>
            </div>
            <div className="d-flex justify-content-between mb-1">
              <span>(-) Total Purchases Paid (ক্রয় পরিশোধ):</span>
              <span className="text-danger">{formatCurrency(totalPurchasesPaid)}</span>
            </div>
            <div className="d-flex justify-content-between mb-1">
              <span>(-) Total Supplier Payments (মহাজন পরিশোধ):</span>
              <span className="text-danger">{formatCurrency(totalKhataSupplierPaid)}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span>(-) Total Shop Expenses (মোট খরচ):</span>
              <span className="text-danger">{formatCurrency(totalExpensesPaid)}</span>
            </div>
            <div className="d-flex justify-content-between fw-bold border-top pt-1 text-success fs-6">
              <span>Cash in Hand (অবশিষ্ট ক্যাশ):</span>
              <span>{formatCurrency(cashInHand)}</span>
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC ACCORDION: Period Sales List */}
      {showTodaySalesList && (
        <div className="card-custom bg-white border border-success-subtle p-3 mb-3 no-print">
          <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
            <h5 className="h6 fw-bold text-success m-0 font-monospace">{getPeriodLabel(dashboardPeriod, "Invoices")} (বিক্রয় বিবরণী)</h5>
            <button className="btn-close" style={{ fontSize: "10px" }} onClick={() => setShowTodaySalesList(false)}></button>
          </div>
          
          {todaySalesRecords.length === 0 ? (
            <div className="text-center text-muted fs-8 py-3">নির্বাচিত সময়ের মধ্যে কোনো বিক্রয় রসিদ তৈরি হয়নি।</div>
          ) : (
            <div style={{ maxHeight: "250px", overflowY: "auto" }}>
              {todaySalesRecords.map((sale) => (
                <div key={sale.id} className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                  <div>
                    <div className="fw-semibold fs-7 text-success">
                      <CopyableText text={sale.invoiceNumber} />
                    </div>
                    <small className="text-muted fs-9">
                      {sale.customerName || "খুচরা কাস্টমার"} • {sale.paymentMethod}
                    </small>
                  </div>
                  <div className="text-end d-flex align-items-center gap-2">
                    <div>
                      <div className="fw-bold fs-7">{formatCurrency(sale.payableAmount)}</div>
                      {sale.dueAmount > 0 && <small className="badge bg-danger-subtle text-danger fs-9 px-1">Due: {formatCurrency(sale.dueAmount)}</small>}
                    </div>
                    <button 
                      className="btn btn-sm btn-outline-success p-1 py-0.5 fs-8 font-monospace"
                      onClick={() => {
                        setSelectedSale(sale);
                        const modalEl = document.getElementById("invoiceModal");
                        if (modalEl) {
                          const modal = new window.bootstrap.Modal(modalEl);
                          modal.show();
                        }
                      }}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DYNAMIC ACCORDION: Period Purchases List */}
      {showTodayPurchasesList && (
        <div className="card-custom bg-white border border-success-subtle p-3 mb-3 no-print">
          <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
            <h5 className="h6 fw-bold text-success m-0 font-monospace">{getPeriodLabel(dashboardPeriod, "Purchases")} (ক্রয় চালানসমূহ)</h5>
            <button className="btn-close" style={{ fontSize: "10px" }} onClick={() => setShowTodayPurchasesList(false)}></button>
          </div>
          
          {todayPurchasesRecords.length === 0 ? (
            <div className="text-center text-muted fs-8 py-3">নির্বাচিত সময়ের মধ্যে কোনো ক্রয় চালান তৈরি হয়নি।</div>
          ) : (
            <div style={{ maxHeight: "250px", overflowY: "auto" }}>
              {todayPurchasesRecords.map((pur) => (
                <div key={pur.id} className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                  <div>
                    <div className="fw-semibold fs-7 text-success">
                      <CopyableText text={pur.invoiceNumber} />
                    </div>
                    <small className="text-muted fs-9">
                      {pur.supplierName || "বেনামী সাপ্লায়ার"}
                    </small>
                  </div>
                  <div className="text-end d-flex align-items-center gap-2">
                    <div>
                      <div className="fw-bold fs-7">{formatCurrency(pur.totalAmount)}</div>
                      {pur.dueAmount > 0 && <small className="badge bg-danger-subtle text-danger fs-9 px-1">Due: {formatCurrency(pur.dueAmount)}</small>}
                    </div>
                    <button 
                      className="btn btn-sm btn-outline-success p-1 py-0.5 fs-8 font-monospace"
                      onClick={() => {
                        setSelectedPurchase(pur);
                        const modalEl = document.getElementById("purchaseModalDashboard");
                        if (modalEl) {
                          const modal = new window.bootstrap.Modal(modalEl);
                          modal.show();
                        }
                      }}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DYNAMIC ACCORDION: Period Expenses List */}
      {showPeriodExpensesList && (
        <div className="card-custom bg-white border border-danger-subtle p-3 mb-3 no-print">
          <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
            <h5 className="h6 fw-bold text-danger m-0 font-monospace">{getPeriodLabel(dashboardPeriod, "Expenses")} (খরচের বিবরণী)</h5>
            <button className="btn-close" style={{ fontSize: "10px" }} onClick={() => setShowPeriodExpensesList(false)}></button>
          </div>
          
          {todayExpensesRecords.length === 0 ? (
            <div className="text-center text-muted fs-8 py-3">নির্বাচিত সময়ের মধ্যে কোনো খরচ রেকর্ড করা হয়নি।</div>
          ) : (
            <div style={{ maxHeight: "250px", overflowY: "auto" }}>
              {todayExpensesRecords.map((exp) => (
                <div key={exp.id} className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                  <div>
                    <div className="fw-semibold fs-7 text-dark">{exp.category}</div>
                    <small className="text-muted fs-9">
                      {dayjs(exp.date).format("DD MMM YYYY")} • {exp.description || "দোকান খরচ"}
                    </small>
                  </div>
                  <div className="text-end">
                    <div className="fw-bold fs-7 text-danger">{formatCurrency(exp.amount)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DYNAMIC ACCORDION: Period Profit Breakdown */}
      {showPeriodProfitBreakdown && (
        <div className="card-custom bg-white border border-success-subtle p-3 mb-3 no-print">
          <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
            <h5 className="h6 fw-bold text-success m-0 font-monospace">{getPeriodLabel(dashboardPeriod, "Profit Details")} (লাভের বিবরণী)</h5>
            <button className="btn-close" style={{ fontSize: "10px" }} onClick={() => setShowPeriodProfitBreakdown(false)}></button>
          </div>
          <div className="fs-7 font-monospace">
            <div className="d-flex justify-content-between fw-bold mb-2 border-bottom pb-1 text-secondary fs-8">
              <span>SOURCE / INVOICE</span>
              <span className="text-end">NET PROFIT</span>
            </div>
            <div style={{ maxHeight: "200px", overflowY: "auto" }} className="mb-3">
              {todaySalesRecords.length === 0 && todayExpensesRecords.length === 0 ? (
                <div className="text-center text-muted fs-8 py-3">কোনো বিক্রয় বা খরচ নেই।</div>
              ) : (
                <>
                  {todaySalesRecords.map((sale) => {
                    let costPriceTotal = 0;
                    sale.items.forEach(item => {
                      const prod = products.find(p => p.id === item.productId);
                      const buyPrice = item.purchasePrice || (prod ? prod.purchasePrice : 0);
                      costPriceTotal += buyPrice * item.quantity;
                    });
                    const profit = sale.payableAmount - costPriceTotal;
                    return (
                      <div key={sale.id} className="d-flex justify-content-between align-items-center py-1 border-bottom border-light">
                        <div>
                          <CopyableText text={sale.invoiceNumber} className="text-success fw-semibold" />
                          <small className="text-muted d-block" style={{ fontSize: "10px" }}>{sale.customerName || "খুচরা কাস্টমার"}</small>
                        </div>
                        <span className="fw-semibold text-success">+{formatCurrency(profit)}</span>
                      </div>
                    );
                  })}
                  {todayExpensesRecords.map((exp) => (
                    <div key={exp.id} className="d-flex justify-content-between align-items-center py-1 border-bottom border-light">
                      <div>
                        <span className="text-danger fw-semibold">{exp.category}</span>
                        <small className="text-muted d-block" style={{ fontSize: "10px" }}>{exp.description || "খরচ"}</small>
                      </div>
                      <span className="fw-semibold text-danger">-{formatCurrency(exp.amount)}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
            <div className="border-top pt-2">
              <div className="d-flex justify-content-between text-muted fs-8">
                <span>Total Gross Sales Profit (বিক্রয় লাভ):</span>
                <span className="text-success">+{formatCurrency(todayGrossProfit)}</span>
              </div>
              <div className="d-flex justify-content-between text-muted fs-8">
                <span>Total Period Expenses (মোট খরচ):</span>
                <span className="text-danger">-{formatCurrency(todayExpenseVal)}</span>
              </div>
              <div className="d-flex justify-content-between fw-bold border-top pt-1 mt-1 text-dark fs-6">
                <span>Net Profit (নিট লাভ):</span>
                <span className={todayNetProfit >= 0 ? "text-success" : "text-danger"}>{formatCurrency(todayNetProfit)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC ACCORDION: Low Stock Alerts List */}
      {showLowStockList && (
        <div className="card-custom bg-white border border-danger-subtle p-3 mb-3 no-print">
          <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
            <h5 className="h6 fw-bold text-danger m-0 font-monospace">Low Stock Products (কম স্টক পণ্যসমূহ)</h5>
            <button className="btn-close" style={{ fontSize: "10px" }} onClick={() => setShowLowStockList(false)}></button>
          </div>
          
          {products.filter(p => p.stock <= (p.minStock || 0)).length === 0 ? (
            <div className="text-center text-muted fs-8 py-3">বর্তমানে কোনো পণ্যের স্টক কম নেই।</div>
          ) : (
            <div style={{ maxHeight: "250px", overflowY: "auto" }}>
              {products.filter(p => p.stock <= (p.minStock || 0)).map((prod) => (
                <div key={prod.id} className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                  <div>
                    <div className="fw-semibold fs-7 text-dark">{prod.name}</div>
                    <small className="text-danger fw-semibold fs-9">
                      Stock: {prod.stock} {prod.unit} (Limit: {prod.minStock || 5})
                    </small>
                  </div>
                  <button 
                    className="btn btn-sm btn-outline-success p-1 py-0.5 fs-8 font-monospace"
                    onClick={() => navigateTo("/purchases/new", { productId: prod.id })}
                  >
                    <i className="bi bi-bag-plus"></i> Re-order
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DYNAMIC ACCORDION: High-Risk Customer Dues List */}
      {showHighRiskDues && (
        <div className="card-custom bg-white border border-warning-subtle p-3 mb-3 no-print">
          <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
            <h5 className="h6 fw-bold text-warning m-0 font-monospace">Top Debtor Balances (শীর্ষ বকেয়া খাতাসমূহ)</h5>
            <button className="btn-close" style={{ fontSize: "10px" }} onClick={() => setShowHighRiskDues(false)}></button>
          </div>
          
          {customers.filter(c => (c.due || 0) > 0).length === 0 ? (
            <div className="text-center text-muted fs-8 py-3">বর্তমানে কোনো বকেয়া খাতা নেই।</div>
          ) : (
            <div style={{ maxHeight: "250px", overflowY: "auto" }}>
              {customers
                .filter(c => (c.due || 0) > 0)
                .sort((a, b) => (b.due || 0) - (a.due || 0))
                .slice(0, 5)
                .map((cust) => (
                  <div key={cust.id} className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                    <div>
                      <div className="fw-semibold fs-7 text-dark">{cust.name}</div>
                      {cust.phone && <small className="text-muted font-monospace fs-9">{cust.phone}</small>}
                    </div>
                    <div className="text-end d-flex align-items-center gap-2">
                      <span className="fw-bold fs-7 text-danger">{formatCurrency(cust.due)}</span>
                      <button 
                        className="btn btn-sm btn-outline-success p-1 py-0.5 fs-8 font-monospace"
                        onClick={() => navigateTo("/khata", { partyId: cust.id, type: "customer" })}
                      >
                        Ledger
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="row g-3 mb-4">
        <div className="col-6">
          <div 
            className="card-custom bg-white border border-light p-3 h-100 cursor-pointer pointer-active"
            onClick={() => {
              setShowTodayPurchasesList(!showTodayPurchasesList);
              setShowTodaySalesList(false);
              setShowPeriodExpensesList(false);
              setShowPeriodProfitBreakdown(false);
              setShowCashBreakdown(false);
              setShowLowStockList(false);
              setShowHighRiskDues(false);
            }}
            style={{ cursor: "pointer" }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="fs-8 text-muted text-uppercase d-flex align-items-center gap-1">
                {getPeriodLabel(dashboardPeriod, "Purchase")} <i className={`bi ${showTodayPurchasesList ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
              </span>
              <div className="bg-light text-success rounded-circle p-1" style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="bi bi-bag-plus-fill fs-7"></i>
              </div>
            </div>
            <h5 className="m-0 fw-bold text-dark">{formatCurrency(todayPurchaseVal)}</h5>
          </div>
        </div>
        
        <div className="col-6">
          <div 
            className="card-custom bg-white border border-light p-3 h-100 cursor-pointer pointer-active"
            onClick={() => {
              setShowPeriodExpensesList(!showPeriodExpensesList);
              setShowTodaySalesList(false);
              setShowTodayPurchasesList(false);
              setShowPeriodProfitBreakdown(false);
              setShowCashBreakdown(false);
              setShowLowStockList(false);
              setShowHighRiskDues(false);
            }}
            style={{ cursor: "pointer" }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="fs-8 text-muted text-uppercase d-flex align-items-center gap-1">
                {getPeriodLabel(dashboardPeriod, "Expense")} <i className={`bi ${showPeriodExpensesList ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
              </span>
              <div className="bg-light text-danger rounded-circle p-1" style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="bi bi-calculator-fill fs-7"></i>
              </div>
            </div>
            <h5 className="m-0 fw-bold text-dark">{formatCurrency(todayExpenseVal)}</h5>
          </div>
        </div>

        <div className="col-6">
          <div 
            className="card-custom bg-white border border-light p-3 h-100 cursor-pointer pointer-active"
            onClick={() => {
              setShowPeriodProfitBreakdown(!showPeriodProfitBreakdown);
              setShowTodaySalesList(false);
              setShowTodayPurchasesList(false);
              setShowPeriodExpensesList(false);
              setShowCashBreakdown(false);
              setShowLowStockList(false);
              setShowHighRiskDues(false);
            }}
            style={{ cursor: "pointer" }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="fs-8 text-muted text-uppercase d-flex align-items-center gap-1">
                {getPeriodLabel(dashboardPeriod, "Profit")} <i className={`bi ${showPeriodProfitBreakdown ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
              </span>
              <div className="bg-light text-primary-custom rounded-circle p-1" style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="bi bi-cash-stack fs-7"></i>
              </div>
            </div>
            <h5 className={`m-0 fw-bold ${todayNetProfit >= 0 ? "text-success" : "text-danger"}`}>
              {formatCurrency(todayNetProfit)}
            </h5>
          </div>
        </div>

        <div className="col-6">
          <div 
            className="card-custom bg-white border border-light p-3 h-100 cursor-pointer pointer-active" 
            onClick={() => {
              setShowHighRiskDues(!showHighRiskDues);
              setShowTodaySalesList(false);
              setShowTodayPurchasesList(false);
              setShowPeriodExpensesList(false);
              setShowPeriodProfitBreakdown(false);
              setShowLowStockList(false);
              setShowCashBreakdown(false);
            }} 
            style={{ cursor: "pointer" }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="fs-8 text-muted text-uppercase d-flex align-items-center gap-1">
                Total Customer Due <i className={`bi ${showHighRiskDues ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
              </span>
              <div className="bg-light text-warning rounded-circle p-1" style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="bi bi-exclamation-circle-fill fs-7"></i>
              </div>
            </div>
            <h5 className="m-0 fw-bold text-warning">{formatCurrency(totalCustomerDue)}</h5>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="mb-4">
        <h4 className="h6 text-muted text-uppercase mb-3 font-monospace">Quick Actions</h4>
        <div className="row g-3">
          <div className="col-3">
            <div className="card-quick-action" onClick={() => navigateTo("/sales/new")}>
              <i className="bi bi-cart-plus-fill text-success"></i>
              <span className="fs-8">New Sale</span>
            </div>
          </div>
          <div className="col-3">
            <div className="card-quick-action" onClick={() => navigateTo("/purchases/new")}>
              <i className="bi bi-bag-plus-fill text-success"></i>
              <span className="fs-8">New Purchase</span>
            </div>
          </div>
          <div className="col-3">
            <div className="card-quick-action" onClick={() => navigateTo("/products")}>
              <i className="bi bi-box-seam-fill text-success"></i>
              <span className="fs-8">Products</span>
            </div>
          </div>
          <div className="col-3">
            <div className="card-quick-action" onClick={() => navigateTo("/khata")}>
              <i className="bi bi-person-fill-check text-success"></i>
              <span className="fs-8">Khata</span>
            </div>
          </div>
          <div className="col-3">
            <div className="card-quick-action" onClick={() => navigateTo("/expenses")}>
              <i className="bi bi-calculator-fill text-success"></i>
              <span className="fs-8">Expense</span>
            </div>
          </div>
          <div className="col-3">
            <div className="card-quick-action" onClick={() => navigateTo("/suppliers")}>
              <i className="bi bi-people-fill text-success"></i>
              <span className="fs-8">Suppliers</span>
            </div>
          </div>
          <div className="col-3">
            <div className="card-quick-action" onClick={() => navigateTo("/customers")}>
              <i className="bi bi-person-badge-fill text-success"></i>
              <span className="fs-8">Customers</span>
            </div>
          </div>
          <div className="col-3">
            <div className="card-quick-action" onClick={() => navigateTo("/purchases")}>
              <i className="bi bi-receipt text-success"></i>
              <span className="fs-8">Purchases</span>
            </div>
          </div>
          <div className="col-3">
            <div className="card-quick-action" onClick={handleCopyDailyBlueprint} title="Copy Today's Daily Hisab Blueprint">
              <i className="bi bi-file-earmark-text-fill text-primary"></i>
              <span className="fs-8">Hisab Blueprint</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Alerts & Stats */}
      <div className="row g-3 mb-4">
        <div 
          className="col-6 cursor-pointer pointer-active" 
          onClick={() => {
            setShowLowStockList(!showLowStockList);
            setShowTodaySalesList(false);
            setShowTodayPurchasesList(false);
            setShowPeriodExpensesList(false);
            setShowPeriodProfitBreakdown(false);
            setShowCashBreakdown(false);
            setShowHighRiskDues(false);
          }}
          style={{ cursor: "pointer" }}
        >
          <div className="card-custom bg-white border border-light p-3 d-flex align-items-center gap-3">
            <div className="rounded-circle bg-danger-subtle text-danger p-2 fs-5" style={{ width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="bi bi-arrow-down-circle"></i>
            </div>
            <div>
              <h5 className="m-0 fw-bold">{lowStockCount}</h5>
              <small className="text-muted fs-8 d-flex align-items-center gap-1">
                Low Stock <i className={`bi ${showLowStockList ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
              </small>
            </div>
          </div>
        </div>

        <div className="col-6">
          <div className="card-custom bg-white border border-light p-3 d-flex align-items-center gap-3">
            <div className="rounded-circle bg-info-subtle text-info p-2 fs-5" style={{ width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="bi bi-people"></i>
            </div>
            <div>
              <h5 className="m-0 fw-bold">{customers.length}</h5>
              <small className="text-muted fs-8">Total Customers</small>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="card-custom bg-white border border-light mb-4">
        <h4 className="h6 text-muted text-uppercase mb-3 font-monospace">Sales Performance (7 Days)</h4>
        {sales.length === 0 ? (
          <div className="text-center py-4 text-muted fs-7">
            <i className="bi bi-bar-chart-steps fs-2 mb-2 d-block"></i>
            কোনো বিক্রয় রেকর্ড নেই। চার্ট প্রদর্শনের জন্য বিক্রয় শুরু করুন।
          </div>
        ) : (
          <div style={{ height: "180px", position: "relative" }}>
            <canvas ref={chartRef}></canvas>
          </div>
        )}
      </div>

      {/* Recent Activities Section */}
      <div className="card-custom bg-white border border-light p-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="h6 text-muted text-uppercase m-0 font-monospace">Recent Activities</h4>
          <span className="badge bg-light text-dark fs-8">{activities.length} total</span>
        </div>
        
        {recentActivities.length === 0 ? (
          <div className="text-center py-3 text-muted fs-8">
            কোনো সাম্প্রতিক কার্যক্রম নেই।
          </div>
        ) : (
          <div className="timeline fs-7">
            {recentActivities.map((act, idx) => (
              <div className="d-flex align-items-start gap-2 mb-2 pb-2 border-bottom border-light" key={act.id || idx}>
                <div className="text-success mt-0.5">
                  {act.action === "Create" && <i className="bi bi-plus-circle-fill"></i>}
                  {act.action === "Update" && <i className="bi bi-pencil-fill text-warning"></i>}
                  {act.action === "Delete" && <i className="bi bi-trash-fill text-danger"></i>}
                  {act.action === "Restore" && <i className="bi bi-cloud-arrow-up-fill text-info"></i>}
                </div>
                <div className="w-100">
                  <div className="text-dark">{act.details}</div>
                  <small className="text-muted fs-8">
                    {dayjs(act.timestamp).format("DD MMM, hh:mm A")}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoice Details Modal */}
      <div 
        className="modal fade no-print" 
        id="invoiceModal" 
        tabIndex="-1" 
        aria-labelledby="invoiceModalLabel" 
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "16px" }}>
            <div className="modal-header border-bottom border-light bg-light" style={{ borderTopLeftRadius: "16px", borderTopRightRadius: "16px" }}>
              <h5 className="modal-title font-monospace" id="invoiceModalLabel">Sales Invoice Details</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body p-0">
              {selectedSale && <SalesInvoice sale={selectedSale} />}
            </div>
            <div className="modal-footer border-top border-light bg-light" style={{ borderBottomLeftRadius: "16px", borderBottomRightRadius: "16px" }}>
              <button 
                type="button" 
                className="btn btn-custom btn-custom-secondary font-monospace" 
                data-bs-dismiss="modal"
              >
                Close
              </button>
              <button 
                type="button" 
                className="btn btn-custom btn-custom-primary font-monospace"
                onClick={() => {
                  window.print();
                }}
              >
                <i className="bi bi-printer"></i> Print
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Details Modal */}
      <div 
        className="modal fade no-print" 
        id="purchaseModalDashboard" 
        tabIndex="-1" 
        aria-labelledby="purchaseModalDashboardLabel" 
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "16px" }}>
            <div className="modal-header border-bottom border-light bg-light" style={{ borderTopLeftRadius: "16px", borderTopRightRadius: "16px" }}>
              <h5 className="modal-title font-monospace" id="purchaseModalDashboardLabel">Purchase Invoice Details</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body p-4">
              {selectedPurchase && (
                <div>
                  <div className="mb-3 text-center border-bottom pb-2">
                    <h5 className="fw-bold">{selectedPurchase.supplierName || "বেনামী সাপ্লায়ার"}</h5>
                    <p className="text-muted m-0 fs-8">চালান নং: <CopyableText text={selectedPurchase.invoiceNumber} /></p>
                    <p className="text-muted m-0 fs-8">তারিখ: {dayjs(selectedPurchase.date).format("DD MMMM YYYY")}</p>
                  </div>
                  
                  <h6 className="text-muted text-uppercase fs-8 font-monospace mb-2">Purchased Items</h6>
                  <ul className="list-group list-group-flush mb-3">
                    {selectedPurchase.items.map((item, idx) => (
                      <li className="list-group-item d-flex justify-content-between align-items-center px-0 fs-7" key={idx}>
                        <div>
                          <div className="fw-semibold">{item.productName}</div>
                          <small className="text-muted">ক্রয়মূল্য: {formatCurrency(item.purchasePrice)}</small>
                        </div>
                        <span className="badge bg-secondary font-monospace">{item.quantity} {item.unit}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="border-top pt-2">
                    <div className="d-flex justify-content-between fs-7 mb-1 font-monospace">
                      <span className="text-muted">Total Bill:</span>
                      <span className="fw-bold">{formatCurrency(selectedPurchase.totalAmount)}</span>
                    </div>
                    <div className="d-flex justify-content-between fs-7 mb-1 font-monospace text-success">
                      <span>Paid Amount:</span>
                      <span className="fw-bold">{formatCurrency(selectedPurchase.paidAmount)}</span>
                    </div>
                    {selectedPurchase.dueAmount > 0 && (
                      <div className="d-flex justify-content-between fs-7 text-danger font-monospace border-top pt-1 mt-1">
                        <span>Due to Supplier:</span>
                        <span className="fw-bold">{formatCurrency(selectedPurchase.dueAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer border-top border-light bg-light" style={{ borderBottomLeftRadius: "16px", borderBottomRightRadius: "16px" }}>
              <button 
                type="button" 
                className="btn btn-custom btn-custom-secondary font-monospace" 
                data-bs-dismiss="modal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden print container that shows only in @media print */}
      {selectedSale && (
        <div className="d-none d-print-block printable-invoice">
          <SalesInvoice sale={selectedSale} />
        </div>
      )}

      {/* Toast Notification for Clipboard Copy */}
      {toastConfig.show && (
        <div 
          className="position-fixed bottom-4 start-50 translate-middle-x bg-dark text-white px-3 py-2 rounded-3 shadow-lg d-flex align-items-center gap-2 animate-fade-in no-print" 
          style={{ zIndex: 1050, bottom: "80px" }}
        >
          <i className="bi bi-check-circle-fill text-success"></i>
          <span className="fs-7 fw-medium">{toastConfig.message}</span>
        </div>
      )}
    </div>
  );
}
