import React, { useState } from "react";
import { useTea } from "../context/TeaContext";
import TeaPOSGrid from "./TeaPOSGrid";
import TeaPOSCart from "./TeaPOSCart";
import TeaPOSCheckout from "./TeaPOSCheckout";
import TeaPOSReceipt from "./TeaPOSReceipt";
import TeaRecentOrders from "./TeaRecentOrders";

export default function TeaPOS() {
  const { menuItems } = useTea();
  const [cart, setCart] = useState([]);
  const [selectedCat, setSelectedCat] = useState("All");
  const [receiptOrder, setReceiptOrder] = useState(null);

  const categories = ["All", "চা", "সিগারেট", "নাস্তা", "বিস্কুট", "অন্যান্য"];
  const activeItems = menuItems.filter(i => i.active !== false);
  const filtered = selectedCat === "All" 
    ? activeItems 
    : activeItems.filter(i => i.category === selectedCat);

  const handleAddToCart = (item) => {
    setCart(prev => {
      const exist = prev.find(c => c.id === item.id);
      if (exist) {
        return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, {
        id: item.id,
        name: item.name,
        price: item.price,
        qty: 1,
        linkedProductId: item.linkedProductId || null
      }];
    });
  };

  const handleUpdateQty = (id, newQty) => {
    if (newQty <= 0) {
      setCart(prev => prev.filter(c => c.id !== id));
    } else {
      setCart(prev => prev.map(c => c.id === id ? { ...c, qty: newQty } : c));
    }
  };

  const handleCompleteSale = (order) => {
    setCart([]);
    setReceiptOrder(order);
  };

  return (
    <div className="p-2">
      {/* Category Pills */}
      <div className="d-flex overflow-auto pb-1 mb-2">
        {categories.map(cat => (
          <span
            key={cat}
            className={`category-pill ${selectedCat === cat ? "active" : ""}`}
            onClick={() => setSelectedCat(cat)}
            style={{ fontSize: "12px", padding: "4px 12px", cursor: "pointer" }}
          >
            {cat === "All" ? "সব" : cat}
          </span>
        ))}
      </div>

      {/* POS Item Tap Grid */}
      <div className="mb-3">
        <TeaPOSGrid
          items={filtered}
          cart={cart}
          onAddToCart={handleAddToCart}
        />
      </div>

      {/* Current Cart & Quick Checkout */}
      <TeaPOSCart
        cart={cart}
        onUpdateQty={handleUpdateQty}
        onRemove={id => handleUpdateQty(id, 0)}
        onClear={() => setCart([])}
      />

      <TeaPOSCheckout
        cart={cart}
        onComplete={handleCompleteSale}
      />

      {/* Recent Orders List for accidental tap cancellation */}
      <TeaRecentOrders />

      {/* Token Receipt Modal */}
      {receiptOrder && (
        <TeaPOSReceipt
          order={receiptOrder}
          onClose={() => setReceiptOrder(null)}
        />
      )}
    </div>
  );
}
