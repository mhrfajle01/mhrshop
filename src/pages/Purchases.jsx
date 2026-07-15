import React, { useState } from "react";
import { useData } from "../context/DataContext";
import { useRouter } from "../context/RouterContext";
import { formatCurrency, formatDate } from "../utils/formatters";
import CopyableText from "../components/CopyableText";

export default function Purchases() {
  const { purchases, deletePurchaseItem, loading } = useData();
  const { navigateTo } = useRouter();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  // Filter Purchases
  const filteredPurchases = purchases.filter(p => {
    const term = searchQuery.toLowerCase();
    return (
      p.invoiceNumber.toLowerCase().includes(term) ||
      (p.supplierName && p.supplierName.toLowerCase().includes(term))
    );
  });

  return (
    <div className="main-content">
      {/* Title */}
      <div className="d-flex justify-content-between align-items-center mb-4 no-print">
        <div>
          <h2 className="h4 mb-1">Purchases</h2>
          <p className="text-muted fs-7">পণ্যের ক্রয় ও সরবরাহকারী চালানের বিবরণী</p>
        </div>
        <button 
          className="btn btn-sm btn-custom btn-custom-primary font-monospace"
          onClick={() => navigateTo("/purchases/new")}
        >
          <i className="bi bi-bag-plus"></i> New Purchase
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-container no-print">
        <i className="bi bi-search"></i>
        <input 
          type="text" 
          className="form-control" 
          placeholder="ক্রয় রসিদ নম্বর অথবা সাপ্লায়ারের নাম..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Purchases list */}
      <div className="card-custom bg-white border border-light p-0 no-print">
        <div className="p-3 border-bottom border-light d-flex justify-content-between align-items-center">
          <h4 className="h6 text-muted m-0 font-monospace">Purchase Records</h4>
          <span className="badge bg-light text-dark fs-8">{filteredPurchases.length} Records</span>
        </div>

        {filteredPurchases.length === 0 ? (
          <div className="text-center py-5 text-muted fs-7">
            কোনো ক্রয় রসিদ পাওয়া যায়নি।
          </div>
        ) : (
          <div className="table-responsive-custom">
            <table className="table table-custom align-middle">
              <thead>
                <tr>
                  <th scope="col" className="font-monospace">Invoice / Date</th>
                  <th scope="col" className="font-monospace">Supplier</th>
                  <th scope="col" className="text-end font-monospace">Total</th>
                  <th scope="col" className="text-end font-monospace">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.map((pur) => (
                  <tr key={pur.id}>
                    <td>
                      <div className="fw-semibold text-dark font-monospace" style={{ fontSize: "13px" }}>
                        <CopyableText text={pur.invoiceNumber} />
                      </div>
                      <small className="text-muted" style={{ fontSize: "11px" }}>
                        {formatDate(pur.date, "DD/MM/YYYY")}
                      </small>
                    </td>
                    <td>
                      <div className="fw-semibold">{pur.supplierName || "বেনামী সাপ্লায়ার"}</div>
                      {pur.dueAmount > 0 ? (
                        <span className="badge bg-danger-subtle text-danger fs-9">
                          Due
                        </span>
                      ) : (
                        <span className="badge bg-success-subtle text-success fs-9">
                          Paid
                        </span>
                      )}
                    </td>
                    <td className="text-end">
                      <div className="fw-bold">{formatCurrency(pur.totalAmount)}</div>
                      <small className="text-muted fs-9" style={{ fontSize: "10px" }}>
                        Paid: {formatCurrency(pur.paidAmount)}
                      </small>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1">
                        <button 
                          className="btn btn-sm btn-outline-success p-1"
                          onClick={() => {
                            setSelectedPurchase(pur);
                            const modalEl = document.getElementById("purchaseModal");
                            if (modalEl) {
                              const modal = new window.bootstrap.Modal(modalEl);
                              modal.show();
                            }
                          }}
                          title="View details"
                        >
                          <i className="bi bi-eye"></i> View
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger p-1"
                          onClick={() => {
                            if (window.confirm(`আপনি কি ক্রয় রসিদ "${pur.invoiceNumber}" মুছে ফেলতে চান?`)) {
                              deletePurchaseItem(pur.id);
                            }
                          }}
                          title="Delete invoice"
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

      {/* Details Modal */}
      <div 
        className="modal fade no-print" 
        id="purchaseModal" 
        tabIndex="-1" 
        aria-labelledby="purchaseModalLabel" 
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "16px" }}>
            <div className="modal-header border-bottom border-light bg-light" style={{ borderTopLeftRadius: "16px", borderTopRightRadius: "16px" }}>
              <h5 className="modal-title font-monospace" id="purchaseModalLabel">Purchase Invoice Details</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body p-4">
              {selectedPurchase && (
                <div>
                  <div className="mb-3 text-center border-bottom pb-2">
                    <h5 className="fw-bold">{selectedPurchase.supplierName || "বেনামী সাপ্লায়ার"}</h5>
                    <p className="text-muted m-0 fs-8">চালান নং: <CopyableText text={selectedPurchase.invoiceNumber} /></p>
                    <p className="text-muted m-0 fs-8">তারিখ: {formatDate(selectedPurchase.date, "DD MMMM YYYY")}</p>
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
    </div>
  );
}
