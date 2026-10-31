import React from "react";

export default function TeaPOSReceipt({ order, onClose }) {
  if (!order) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
      <div className="modal-dialog modal-sm modal-dialog-centered">
        <div className="modal-content text-center p-3" style={{ borderRadius: "14px" }}>
          <div className="border border-2 border-dark p-3 rounded bg-light mb-3">
            <h4 className="fw-bold mb-0">🍵 টোকেন #{order.tokenNo}</h4>
            <div className="text-muted" style={{ fontSize: "11px" }}>{order.date} • চা স্টল</div>
            <hr className="my-2" />
            
            <div className="text-start" style={{ fontSize: "12px" }}>
              {order.items?.map((it, idx) => (
                <div key={idx} className="d-flex justify-content-between mb-1">
                  <span>{it.name} x {it.qty}</span>
                  <span className="fw-bold">৳{it.price * it.qty}</span>
                </div>
              ))}
            </div>
            
            <hr className="my-2" />
            <div className="d-flex justify-content-between fw-bold">
              <span>মোট:</span>
              <span>৳{order.total}</span>
            </div>
            {order.due > 0 && (
              <div className="d-flex justify-content-between text-danger fw-bold" style={{ fontSize: "12px" }}>
                <span>বাকি ({order.customerName || "কাস্টমার"}):</span>
                <span>৳{order.due}</span>
              </div>
            )}
          </div>

          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary w-50 btn-sm" onClick={onClose}>
              বন্ধ করুন
            </button>
            <button className="btn btn-custom-primary w-50 btn-sm" onClick={() => window.print()}>
              <i className="bi bi-printer me-1"></i> প্রিন্ট
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
