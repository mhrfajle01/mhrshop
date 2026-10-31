import React, { useState } from "react";
import { useData } from "../context/DataContext";
import { useRouter } from "../context/RouterContext";
import { formatCurrency, formatDate } from "../utils/formatters";
import { useModal } from "../context/ModalContext";
import SalesInvoice from "../components/SalesInvoice";
import CopyableText from "../components/CopyableText";
import TeaPOSReceipt from "../tea/pos/TeaPOSReceipt";

export default function Sales() {
  const { sales = [], teaOrders = [], deleteSaleItem, loading } = useData();
  const { navigateTo } = useRouter();
  const { showAlert, showConfirm } = useModal();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSale, setSelectedSale] = useState(null); // for showing detailed printable invoice in Modal
  const [selectedTeaOrder, setSelectedTeaOrder] = useState(null);
  const [salesTypeFilter, setSalesTypeFilter] = useState("all"); // 'all' | 'mudi' | 'tea'

  const handlePrint = (sale) => {
    setSelectedSale(sale);
    // Trigger modal print after brief delay so modal DOM loads
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleDelete = async (id, invNum) => {
    const ok = await showConfirm(`রসিদ নং "${invNum}" ডিলিট করলে পণ্যসমূহের স্টক আগের অবস্থানে ফিরিয়ে নেওয়া (Reverse) হবে। আপনি কি নিশ্চিত?`, "বিক্রয় রসিদ ডিলিট", true);
    if (ok) {
      try {
        await deleteSaleItem(id);
        await showAlert("বিক্রয় রসিদটি বাতিল ও ডিলিট করা হয়েছে।", "সফল");
      } catch (err) {
        await showAlert("ডিলিট করতে সমস্যা হয়েছে।", "সমস্যা");
      }
    }
  };

  // Unified Sales List Mapping
  const unifiedSales = [];

  if (salesTypeFilter !== "tea") {
    sales.forEach(s => {
      unifiedSales.push({
        id: s.id,
        origId: s.id,
        type: "mudi",
        invoiceNumber: s.invoiceNumber,
        date: s.date,
        customerName: s.customerName || "খুচরা ক্রেতা",
        paymentMethod: s.paymentMethod,
        payableAmount: s.payableAmount,
        paidAmount: s.paidAmount,
        dueAmount: s.dueAmount,
        itemsSummary: s.items?.map(it => it.name).join(", "),
        raw: s
      });
    });
  }

  if (salesTypeFilter !== "mudi") {
    teaOrders.filter(t => !t.deleted).forEach(t => {
      unifiedSales.push({
        id: "tea-" + t.id,
        origId: t.id,
        type: "tea",
        invoiceNumber: `TEA-#${t.tokenNo}`,
        date: t.date || t.createdAt?.slice(0, 10),
        customerName: t.customerName || "চা স্টল কাস্টমার",
        paymentMethod: t.paymentMethod || "নগদ",
        payableAmount: t.total,
        paidAmount: t.paid,
        dueAmount: t.due,
        itemsSummary: t.items?.map(it => `${it.name} (${it.qty})`).join(", "),
        raw: t
      });
    });
  }

  // Sort by date/createdAt descending
  unifiedSales.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  // Filter Sales
  const filteredSales = unifiedSales.filter(sale => {
    const term = searchQuery.toLowerCase();
    return (
      sale.invoiceNumber.toLowerCase().includes(term) ||
      (sale.customerName && sale.customerName.toLowerCase().includes(term)) ||
      (sale.itemsSummary && sale.itemsSummary.toLowerCase().includes(term))
    );
  });

  return (
    <div className="main-content">
      {/* Title */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3 no-print">
        <div>
          <h2 className="h4 mb-0">Sales (বিক্রয় রেজিস্ট্রি)</h2>
          <p className="text-muted fs-8 mb-0">মুদি দোকান ও চা স্টলের সমন্বিত বিক্রয় তালিকা</p>
        </div>
        <div className="d-flex gap-2">
          <div className="btn-group btn-group-sm bg-light border p-0.5 rounded shadow-sm" role="group">
            <button
              type="button"
              className={`btn btn-sm py-1 px-2 fw-semibold ${salesTypeFilter === "all" ? "btn-success text-white" : "btn-light text-muted border-0"}`}
              style={{ fontSize: "11px", borderRadius: "4px" }}
              onClick={() => setSalesTypeFilter("all")}
            >
              সব ({unifiedSales.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm py-1 px-2 fw-semibold ${salesTypeFilter === "mudi" ? "btn-success text-white" : "btn-light text-muted border-0"}`}
              style={{ fontSize: "11px", borderRadius: "4px" }}
              onClick={() => setSalesTypeFilter("mudi")}
            >
              🛒 মুদি ({sales.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm py-1 px-2 fw-semibold ${salesTypeFilter === "tea" ? "btn-success text-white" : "btn-light text-muted border-0"}`}
              style={{ fontSize: "11px", borderRadius: "4px" }}
              onClick={() => setSalesTypeFilter("tea")}
            >
              🍵 চা স্টল ({teaOrders.filter(t => !t.deleted).length})
            </button>
          </div>
          <button 
            className="btn btn-sm btn-custom btn-custom-primary font-monospace py-1"
            onClick={() => navigateTo("/sales/new")}
          >
            <i className="bi bi-cart-plus"></i> New Sale
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-container no-print">
        <i className="bi bi-search"></i>
        <input 
          type="text" 
          className="form-control" 
          placeholder="রসিদ নম্বর অথবা কাস্টমারের নাম দিয়ে খুঁজুন..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Sales Table list */}
      <div className="card-custom bg-white border border-light p-0 no-print">
        <div className="p-3 border-bottom border-light d-flex justify-content-between align-items-center">
          <h4 className="h6 text-muted m-0 font-monospace">Invoice Records</h4>
          <span className="badge bg-light text-dark fs-8">{filteredSales.length} Invoices</span>
        </div>

        {filteredSales.length === 0 ? (
          <div className="text-center py-5 text-muted fs-7">
            কোনো বিক্রয় রসিদ পাওয়া যায়নি।
          </div>
        ) : (
          <div className="table-responsive-custom">
            <table className="table table-custom align-middle">
              <thead>
                <tr>
                  <th scope="col" className="font-monospace">Invoice / Date</th>
                  <th scope="col" className="font-monospace">Customer</th>
                  <th scope="col" className="text-end font-monospace">Total</th>
                  <th scope="col" className="text-end font-monospace">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id}>
                    <td>
                      <div className="fw-semibold text-success d-flex align-items-center gap-1" style={{ fontSize: "13px" }}>
                        {sale.type === "tea" ? (
                          <span className="badge bg-success-subtle text-success fs-9 border border-success-subtle">🍵 চা স্টল</span>
                        ) : (
                          <span className="badge bg-primary-subtle text-primary fs-9 border border-primary-subtle">🛒 মুদি</span>
                        )}
                        <CopyableText text={sale.invoiceNumber} />
                      </div>
                      <small className="text-muted" style={{ fontSize: "11px" }}>
                        {formatDate(sale.date, "DD MMM YYYY")}
                      </small>
                    </td>
                    <td>
                      <div className="fw-semibold">{sale.customerName || "খুচরা ক্রেতা"}</div>
                      <span className="badge bg-light text-dark border fs-9 mt-1">
                        {sale.paymentMethod}
                      </span>
                      {sale.dueAmount > 0 && (
                        <span className="badge bg-danger-subtle text-danger ms-1 fs-9">
                          Due: {formatCurrency(sale.dueAmount)}
                        </span>
                      )}
                      {sale.itemsSummary && (
                        <small className="text-muted d-block text-truncate" style={{ maxWidth: "180px", fontSize: "10px" }}>
                          {sale.itemsSummary}
                        </small>
                      )}
                    </td>
                    <td className="text-end">
                      <div className="fw-bold">{formatCurrency(sale.payableAmount)}</div>
                      <small className="text-muted fs-9" style={{ fontSize: "10px" }}>
                        Paid: {formatCurrency(sale.paidAmount)}
                      </small>
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-1">
                        <button 
                          className="btn btn-sm btn-outline-success p-1"
                          onClick={() => {
                            if (sale.type === "tea") {
                              setSelectedTeaOrder(sale.raw);
                            } else {
                              setSelectedSale(sale.raw);
                              const modalEl = document.getElementById("invoiceModal");
                              if (modalEl) {
                                const modal = new window.bootstrap.Modal(modalEl);
                                modal.show();
                              }
                            }
                          }}
                          title="View Invoice"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-primary p-1"
                          onClick={() => {
                            if (sale.type === "tea") {
                              setSelectedTeaOrder(sale.raw);
                            } else {
                              handlePrint(sale.raw);
                            }
                          }}
                          title="Print"
                        >
                          <i className="bi bi-printer"></i>
                        </button>
                        {sale.type === "mudi" && (
                          <button 
                            className="btn btn-sm btn-outline-danger p-1"
                            onClick={() => handleDelete(sale.origId, sale.invoiceNumber)}
                            title="Delete / Reverse"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {/* Tea POS Receipt Modal */}
      {selectedTeaOrder && (
        <TeaPOSReceipt
          order={selectedTeaOrder}
          onClose={() => setSelectedTeaOrder(null)}
        />
      )}

      {/* Hidden print container that shows only in @media print */}
      {selectedSale && (
        <div className="d-none d-print-block printable-invoice">
          <SalesInvoice sale={selectedSale} />
        </div>
      )}
    </div>
  );
}
