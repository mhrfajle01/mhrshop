import React, { useEffect, useRef, useState } from "react";
import { useData } from "../context/DataContext";
import { useRouter } from "../context/RouterContext";
import { formatCurrency } from "../utils/formatters";
import dayjs from "dayjs";
import Chart from "chart.js/auto";
import SalesInvoice from "../components/SalesInvoice";

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
  const [selectedSale, setSelectedSale] = useState(null);

  // Compute stats
  const todayStr = dayjs().format("YYYY-MM-DD");
  
  // Today's Cash Flow calculations
  const todaySalesPaid = sales.filter(s => s.date === todayStr).reduce((acc, s) => acc + s.paidAmount, 0);
  const todayPurchasesPaid = purchases.filter(p => p.date === todayStr).reduce((acc, p) => acc + p.paidAmount, 0);
  const todayExpensesPaid = expenses.filter(e => e.date === todayStr).reduce((acc, e) => acc + e.amount, 0);
  const todayCustomerKhataReceived = khata
    .filter(k => k.date === todayStr && k.partyType === "customer" && k.type === "payment")
    .reduce((acc, k) => acc + k.amount, 0);
  const todaySupplierKhataPaid = khata
    .filter(k => k.date === todayStr && k.partyType === "supplier" && k.type === "payment")
    .reduce((acc, k) => acc + k.amount, 0);

  const todayCashInflow = todaySalesPaid + todayCustomerKhataReceived;
  const todayCashOutflow = todayPurchasesPaid + todaySupplierKhataPaid + todayExpensesPaid;
  const todayNetCashFlow = todayCashInflow - todayCashOutflow;

  // Filter today's sales list
  const todaySalesRecords = sales.filter(s => s.date === todayStr);
  
  // Today's Sales
  const todaySalesVal = sales
    .filter(s => s.date === todayStr)
    .reduce((acc, s) => acc + s.payableAmount, 0);

  // Today's Purchase
  const todayPurchaseVal = purchases
    .filter(p => p.date === todayStr)
    .reduce((acc, p) => acc + p.totalAmount, 0);

  // Today's Expense
  const todayExpenseVal = expenses
    .filter(e => e.date === todayStr)
    .reduce((acc, e) => acc + e.amount, 0);

  // Today's Net Profit: Sales Gross Profit - Today's Expenses
  const todaySalesList = sales.filter(s => s.date === todayStr);
  let todayGrossProfit = 0;
  todaySalesList.forEach(sale => {
    sale.items.forEach(item => {
      // Find corresponding product to get purchase price if not cached in sale item
      const prod = products.find(p => p.id === item.productId);
      const buyPrice = item.purchasePrice || (prod ? prod.purchasePrice : 0);
      const profitPerItem = item.sellingPrice - buyPrice;
      todayGrossProfit += profitPerItem * item.quantity;
    });
  });
  const todayNetProfit = todayGrossProfit - todayExpenseVal;

  // Cash In Hand Calculation
  const totalSalesPaid = sales.reduce((acc, s) => acc + s.paidAmount, 0);
  const totalPurchasesPaid = purchases.reduce((acc, p) => acc + p.paidAmount, 0);
  const totalExpensesPaid = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalKhataCustomerReceived = khata
    .filter(k => k.partyType === "customer" && k.type === "payment")
    .reduce((acc, k) => acc + k.amount, 0);
  const totalKhataSupplierPaid = khata
    .filter(k => k.partyType === "supplier" && k.type === "payment")
    .reduce((acc, k) => acc + k.amount, 0);

  const cashInHand = (totalSalesPaid + totalKhataCustomerReceived) - 
                     (totalPurchasesPaid + totalKhataSupplierPaid + totalExpensesPaid);

  // Total Due Balance
  const totalCustomerDue = customers.reduce((acc, c) => acc + (c.due || 0), 0);
  const totalSupplierDue = suppliers.reduce((acc, s) => acc + (s.due || 0), 0);

  // Low Stock Items
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

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
      {/* Title */}
      <div className="mb-4">
        <h2 className="h4 mb-1">Dashboard</h2>
        <p className="text-muted fs-7">আজকের ব্যবসার হিসাব-নিকাশ এবং সংক্ষিপ্ত চিত্র</p>
      </div>

      {/* Main KPI Stats Block */}
      <div className="card-custom bg-success text-white mb-3">
        <div className="row text-center py-2">
          <div 
            className="col-6 border-end border-white-50 cursor-pointer pointer-active" 
            onClick={() => {
              setShowTodaySalesList(!showTodaySalesList);
              setShowCashBreakdown(false);
            }}
            style={{ cursor: "pointer" }}
          >
            <small className="opacity-75 fs-8 text-uppercase d-flex align-items-center justify-content-center gap-1">
              Today's Sales <i className={`bi ${showTodaySalesList ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
            </small>
            <h3 className="m-0 fw-bold">{formatCurrency(todaySalesVal)}</h3>
          </div>
          <div 
            className="col-6 cursor-pointer pointer-active" 
            onClick={() => {
              setShowCashBreakdown(!showCashBreakdown);
              setShowTodaySalesList(false);
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
            {/* Today's Cash Flow */}
            <div className="fw-semibold text-muted border-bottom pb-1 mb-2">Today's Flow (আজকের ক্যাশ প্রবাহ)</div>
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
              <span>Net Flow (আজকের নিট ক্যাশ):</span>
              <span className={todayNetCashFlow >= 0 ? "text-success" : "text-danger"}>{formatCurrency(todayNetCashFlow)}</span>
            </div>

            {/* Overall Cumulative Cash */}
            <div className="fw-semibold text-muted border-bottom pb-1 mb-2">Overall Drawer (মোট ড্রয়ার ক্যাশ)</div>
            <div className="d-flex justify-content-between mb-1">
              <span>Total Sales Cash (বিক্রয় ক্যাশ):</span>
              <span className="text-success">{formatCurrency(totalSalesPaid)}</span>
            </div>
            <div className="d-flex justify-content-between mb-1">
              <span>Total Customer Dues Coll. (বকেয়া আদায়):</span>
              <span className="text-success">{formatCurrency(totalKhataCustomerReceived)}</span>
            </div>
            <div className="d-flex justify-content-between mb-1">
              <span>Total Purchases Paid (ক্রয় পরিশোধ):</span>
              <span className="text-danger">{formatCurrency(totalPurchasesPaid)}</span>
            </div>
            <div className="d-flex justify-content-between mb-1">
              <span>Total Supplier Payments (মহাজন পরিশোধ):</span>
              <span className="text-danger">{formatCurrency(totalKhataSupplierPaid)}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span>Total Shop Expenses (মোট খরচ):</span>
              <span className="text-danger">{formatCurrency(totalExpensesPaid)}</span>
            </div>
            <div className="d-flex justify-content-between fw-bold border-top pt-1 text-success fs-6">
              <span>Cash in Hand (অবশিষ্ট ক্যাশ):</span>
              <span>{formatCurrency(cashInHand)}</span>
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC ACCORDION: Today's Sales List */}
      {showTodaySalesList && (
        <div className="card-custom bg-white border border-success-subtle p-3 mb-3 no-print">
          <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
            <h5 className="h6 fw-bold text-success m-0 font-monospace">Today's Invoices (আজকের বিক্রয় রসিদসমূহ)</h5>
            <button className="btn-close" style={{ fontSize: "10px" }} onClick={() => setShowTodaySalesList(false)}></button>
          </div>
          
          {todaySalesRecords.length === 0 ? (
            <div className="text-center text-muted fs-8 py-3">আজকে এখন পর্যন্ত কোনো বিক্রয় রসিদ তৈরি হয়নি।</div>
          ) : (
            <div style={{ maxHeight: "250px", overflowY: "auto" }}>
              {todaySalesRecords.map((sale) => (
                <div key={sale.id} className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                  <div>
                    <div className="fw-semibold fs-7 font-monospace text-success">{sale.invoiceNumber}</div>
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

      {/* Stats Grid */}
      <div className="row g-3 mb-4">
        <div className="col-6">
          <div className="card-custom bg-white border border-light p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="fs-8 text-muted text-uppercase">Today's Purchase</span>
              <div className="bg-light text-success rounded-circle p-1" style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="bi bi-bag-plus-fill fs-7"></i>
              </div>
            </div>
            <h5 className="m-0 fw-bold text-dark">{formatCurrency(todayPurchaseVal)}</h5>
          </div>
        </div>
        
        <div className="col-6">
          <div className="card-custom bg-white border border-light p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="fs-8 text-muted text-uppercase">Today's Expense</span>
              <div className="bg-light text-danger rounded-circle p-1" style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="bi bi-calculator-fill fs-7"></i>
              </div>
            </div>
            <h5 className="m-0 fw-bold text-dark">{formatCurrency(todayExpenseVal)}</h5>
          </div>
        </div>

        <div className="col-6">
          <div className="card-custom bg-white border border-light p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="fs-8 text-muted text-uppercase">Today's Profit</span>
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
          <div className="card-custom bg-white border border-light p-3 h-100" onClick={() => navigateTo("/khata")} style={{ cursor: "pointer" }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="fs-8 text-muted text-uppercase">Total Customer Due</span>
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
            <div className="card-quick-action" onClick={() => navigateTo("/products")}>
              <i className="bi bi-plus-circle-fill text-success"></i>
              <span className="fs-8">Add Prod</span>
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
        </div>
      </div>

      {/* Stock Alerts & Stats */}
      <div className="row g-3 mb-4">
        <div className="col-6" onClick={() => navigateTo("/products")} style={{ cursor: "pointer" }}>
          <div className="card-custom bg-white border border-light p-3 d-flex align-items-center gap-3">
            <div className="rounded-circle bg-danger-subtle text-danger p-2 fs-5" style={{ width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="bi bi-arrow-down-circle"></i>
            </div>
            <div>
              <h5 className="m-0 fw-bold">{lowStockCount}</h5>
              <small className="text-muted fs-8">Low Stock Items</small>
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

      {/* Hidden print container that shows only in @media print */}
      {selectedSale && (
        <div className="d-none d-print-block printable-invoice">
          <SalesInvoice sale={selectedSale} />
        </div>
      )}
    </div>
  );
}
