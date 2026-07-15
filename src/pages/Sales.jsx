import React, { useState } from "react";
import { useData } from "../context/DataContext";
import { useRouter } from "../context/RouterContext";
import { formatCurrency, formatDate } from "../utils/formatters";
import SalesInvoice from "../components/SalesInvoice";
import CopyableText from "../components/CopyableText";

export default function Sales() {
  const { sales, deleteSaleItem, loading } = useData();
  const { navigateTo } = useRouter();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSale, setSelectedSale] = useState(null); // for showing detailed printable invoice in Modal

  const handlePrint = (sale) => {
    setSelectedSale(sale);
    // Trigger modal print after brief delay so modal DOM loads
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleDelete = async (id, invNum) => {
    if (window.confirm(`রসিদ নং "${invNum}" ডিলিট করলে পণ্যসমূহের স্টক আগের অবস্থানে ফিরিয়ে নেওয়া (Reverse) হবে। আপনি কি নিশ্চিত?`)) {
      try {
        await deleteSaleItem(id);
        alert("বিক্রয় রসিদটি বাতিল ও ডিলিট করা হয়েছে।");
      } catch (err) {
        alert("ডিলিট করতে সমস্যা হয়েছে।");
      }
    }
  };

  // Filter Sales
  const filteredSales = sales.filter(sale => {
    const term = searchQuery.toLowerCase();
    return (
      sale.invoiceNumber.toLowerCase().includes(term) ||
      (sale.customerName && sale.customerName.toLowerCase().includes(term))
    );
  });

  return (
    <div className="main-content">
      {/* Title */}
      <div className="d-flex justify-content-between align-items-center mb-4 no-print">
        <div>
          <h2 className="h4 mb-1">Sales</h2>
          <p className="text-muted fs-7">বিক্রয় রসিদ ও চালানের ইতিহাস</p>
        </div>
        <button 
          className="btn btn-sm btn-custom btn-custom-primary font-monospace"
          onClick={() => navigateTo("/sales/new")}
        >
          <i className="bi bi-cart-plus"></i> New Sale
        </button>
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
                      <div className="fw-semibold text-success" style={{ fontSize: "13px" }}>
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
                          Due
                        </span>
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
                            setSelectedSale(sale);
                            // Show modal programmatically using Bootstrap API
                            const modalEl = document.getElementById("invoiceModal");
                            if (modalEl) {
                              const modal = new window.bootstrap.Modal(modalEl);
                              modal.show();
                            }
                          }}
                          title="View Invoice"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-primary p-1"
                          onClick={() => handlePrint(sale)}
                          title="Print"
                        >
                          <i className="bi bi-printer"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger p-1"
                          onClick={() => handleDelete(sale.id, sale.invoiceNumber)}
                          title="Delete / Reverse"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
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

      {/* Hidden print container that shows only in @media print */}
      {selectedSale && (
        <div className="d-none d-print-block printable-invoice">
          <SalesInvoice sale={selectedSale} />
        </div>
      )}
    </div>
  );
}
