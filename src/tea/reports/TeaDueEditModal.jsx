import React, { useState } from "react";
import ReactDOM from "react-dom";
import { useTea } from "../context/TeaContext";

export default function TeaDueEditModal({ order, onClose }) {
  const { updateOrder } = useTea();
  const [customerName, setCustomerName] = useState(order.customerName || "");
  const [dueAmount, setDueAmount] = useState(order.due || 0);
  const [paidAmount, setPaidAmount] = useState(order.paid || 0);
  const [submitting, setSubmitting] = useState(false);

  const handleClose = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onClose();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const newDue = Math.max(0, Number(dueAmount));
      const newPaid = Math.max(0, Number(paidAmount));
      await updateOrder(order.id, {
        ...order,
        customerName: customerName.trim() || "কাস্টমার",
        due: newDue,
        paid: newPaid,
        total: newDue + newPaid,
        paymentMethod: newDue === 0 ? "নগদ" : "বাকি"
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const modalContent = (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{
        backgroundColor: "rgba(0,0,0,0.65)",
        zIndex: 99999
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose(e);
      }}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        style={{ maxWidth: "340px", margin: "16px auto", padding: "0 12px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content shadow-lg border-0" style={{ borderRadius: "16px", overflow: "hidden" }}>
          <div className="modal-header py-2 px-3 bg-light border-bottom">
            <h6 className="modal-title fw-bold mb-0" style={{ fontSize: "14px" }}>
              ✏️ বাকি সম্পাদন (টোকেন #{order.tokenNo})
            </h6>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={handleClose}
            ></button>
          </div>

          <form onSubmit={handleSave}>
            <div className="modal-body p-3">
              <div className="mb-2">
                <label className="form-label" style={{ fontSize: "12px" }}>কাস্টমারের নাম</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  required
                />
              </div>

              <div className="row g-2 mb-2">
                <div className="col-6">
                  <label className="form-label text-danger" style={{ fontSize: "12px" }}>বাকি টাকা (৳)</label>
                  <input
                    type="number"
                    className="form-control form-control-sm font-monospace fw-bold"
                    value={dueAmount}
                    onChange={e => setDueAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="form-label text-success" style={{ fontSize: "12px" }}>নগদ পরিশোধ (৳)</label>
                  <input
                    type="number"
                    className="form-control form-control-sm font-monospace"
                    value={paidAmount}
                    onChange={e => setPaidAmount(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="button"
                className="btn btn-sm btn-outline-success w-100 py-1 mb-2"
                style={{ fontSize: "11px" }}
                onClick={() => {
                  setPaidAmount((Number(paidAmount) + Number(dueAmount)).toString());
                  setDueAmount(0);
                }}
              >
                <i className="bi bi-check2-circle me-1"></i> পুরো বাকি পরিশোধ চিহ্নিত করুন
              </button>
            </div>

            <div className="modal-footer py-2 px-3 bg-light border-top d-flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-secondary flex-fill"
                onClick={handleClose}
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="btn btn-sm btn-custom-primary flex-fill"
                disabled={submitting}
              >
                {submitting ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
