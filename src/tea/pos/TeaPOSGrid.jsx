import React from "react";

export default function TeaPOSGrid({ items, onAddToCart, cart }) {
  const getItemQty = (id) => {
    const found = cart.find(c => c.id === id);
    return found ? found.qty : 0;
  };

  return (
    <div className="row g-2">
      {items.map(item => {
        const qty = getItemQty(item.id);
        return (
          <div key={item.id} className="col-4 col-sm-3">
            <button
              type="button"
              className={`w-100 p-2 text-center rounded border d-flex flex-column align-items-center justify-content-center position-relative ${
                qty > 0 ? "border-success bg-success-subtle" : "border-secondary-subtle bg-white"
              }`}
              style={{ minHeight: "85px", cursor: "pointer", transition: "all 0.15s ease" }}
              onClick={() => onAddToCart(item)}
            >
              {qty > 0 && (
                <span className="position-absolute top-0 end-0 badge rounded-pill bg-success m-1" style={{ fontSize: "10px" }}>
                  {qty}
                </span>
              )}
              <div className="fw-semibold text-truncate w-100" style={{ fontSize: "12px", lineHeight: "1.2" }}>
                {item.name}
              </div>
              <div className="text-success fw-bold mt-1" style={{ fontSize: "13px" }}>
                ৳{item.price}
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}
