import React from "react";

export default function TeaPOSCart({ cart, onUpdateQty, onRemove, onClear }) {
  if (cart.length === 0) {
    return (
      <div className="text-center text-muted py-3 border rounded bg-light" style={{ fontSize: "13px" }}>
        চা/নাস্তা সিলেক্ট করুন
      </div>
    );
  }

  const subtotal = cart.reduce((acc, c) => acc + (c.price * c.qty), 0);

  return (
    <div className="border rounded p-2 bg-white mb-2">
      <div className="d-flex justify-content-between align-items-center mb-1">
        <span className="fw-bold" style={{ fontSize: "12px" }}>চলতি অর্ডার ({cart.length})</span>
        <button className="btn btn-sm text-danger p-0 border-0" onClick={onClear} style={{ fontSize: "11px" }}>
          মুছুন
        </button>
      </div>

      <div className="overflow-auto" style={{ maxHeight: "150px" }}>
        {cart.map(item => (
          <div key={item.id} className="d-flex justify-content-between align-items-center py-1 border-bottom">
            <div className="text-truncate me-2" style={{ maxWidth: "120px", fontSize: "12px" }}>
              {item.name}
            </div>
            <div className="d-flex align-items-center gap-1">
              <button
                className="btn btn-sm btn-outline-secondary py-0 px-2"
                onClick={() => onUpdateQty(item.id, item.qty - 1)}
              >-</button>
              <span className="fw-bold px-1" style={{ fontSize: "12px" }}>{item.qty}</span>
              <button
                className="btn btn-sm btn-outline-secondary py-0 px-2"
                onClick={() => onUpdateQty(item.id, item.qty + 1)}
              >+</button>
              <span className="fw-semibold ms-2" style={{ fontSize: "12px", width: "45px", textAlign: "right" }}>
                ৳{item.price * item.qty}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="d-flex justify-content-between align-items-center pt-2 mt-1 border-top">
        <span className="fw-bold" style={{ fontSize: "14px" }}>মোট টাকা:</span>
        <span className="fw-bold text-success" style={{ fontSize: "16px" }}>৳{subtotal}</span>
      </div>
    </div>
  );
}
