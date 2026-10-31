import React, { useState } from "react";
import { useTea } from "../context/TeaContext";
import { useData } from "../../context/DataContext";
import { getBdToday } from "../../utils/formatters";

export default function TeaPOSCheckout({ cart, onComplete }) {
  const { placeOrder } = useTea();
  const { customers, addNewKhataEntry, products, updateProductItem } = useData();

  const [isDue, setIsDue] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [manualCustomerName, setManualCustomerName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const total = cart.reduce((acc, c) => acc + (c.price * c.qty), 0);

  // অটো স্টক রিডাকশন (যদি চা/সিগারেট আইটেমের সাথে মুদি পণ্য লিংক করা থাকে)
  const deductLinkedProductsStock = async () => {
    for (const item of cart) {
      if (item.linkedProductId) {
        const prod = products.find(p => p.id === item.linkedProductId);
        if (prod) {
          const newStock = Math.max(0, Number(prod.stock || 0) - Number(item.qty || 1));
          try {
            await updateProductItem(prod.id, { ...prod, stock: newStock });
          } catch (e) {
            console.error("Failed to deduct linked product stock:", e);
          }
        }
      }
    }
  };

  const handleCheckout = async (payType) => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      let custName = "নগদ কাস্টমার";
      let custId = null;

      if (payType === "due") {
        if (selectedCustomerId) {
          const cust = customers.find(c => c.id === selectedCustomerId);
          custName = cust ? cust.name : "কাস্টমার";
          custId = selectedCustomerId;
        } else {
          custName = manualCustomerName || "অজ্ঞাত বাকি";
        }
      }

      // ১. চা অর্ডার সংরক্ষণ
      const order = await placeOrder({
        items: cart,
        total,
        paid: payType === "cash" ? total : 0,
        due: payType === "due" ? total : 0,
        paymentMethod: payType === "cash" ? "নগদ" : "বাকি",
        customerId: custId,
        customerName: custName
      });

      // ২. লিংকড মুদি পণ্য থাকলে স্টক থেকে কেটে নেওয়া
      await deductLinkedProductsStock();

      // ৩. যদি বাকি হয় এবং কাস্টমার মুদি খাতার তালিকাভুক্ত হয়, তাহলে মূল খাতায় স্বয়ংক্রিয় এন্ট্রি
      if (payType === "due" && custId) {
        try {
          await addNewKhataEntry({
            partyId: custId,
            partyType: "customer",
            partyName: custName,
            type: "due",
            amount: total,
            description: `চা ও সিগারেট স্টল টোকেন #${order.tokenNo} (বাকি)`,
            date: getBdToday()
          });
        } catch (e) {
          console.error("Failed to record khata entry for tea due:", e);
        }
      }

      onComplete(order);
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.length === 0) return null;

  return (
    <div className="card-custom p-2 mb-3 bg-white border">
      {!isDue ? (
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-custom-primary flex-grow-1 py-2 fw-bold"
            disabled={submitting}
            onClick={() => handleCheckout("cash")}
          >
            <i className="bi bi-cash-stack me-1"></i> নগদ বিক্রি (৳{total})
          </button>
          <button
            type="button"
            className="btn btn-outline-danger py-2 px-3 fw-bold"
            disabled={submitting}
            onClick={() => setIsDue(true)}
          >
            বাকি
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-2">
            <label className="form-label mb-1" style={{ fontSize: "11px" }}>
              মুদি খাতার কাস্টমার নির্বাচন করুন:
            </label>
            <select
              className="form-select form-select-sm mb-1"
              value={selectedCustomerId}
              onChange={e => {
                setSelectedCustomerId(e.target.value);
                if (e.target.value) setManualCustomerName("");
              }}
            >
              <option value="">-- খাতার কাস্টমার বাছুন (ঐচ্ছিক) --</option>
              {customers?.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} (আগের বাকি: ৳{c.due || 0})
                </option>
              ))}
            </select>

            {!selectedCustomerId && (
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="অথবা নাম লিখে দিন (যেমন: করিম ভাই)"
                value={manualCustomerName}
                onChange={e => setManualCustomerName(e.target.value)}
              />
            )}
          </div>

          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-secondary w-50"
              onClick={() => setIsDue(false)}
            >
              বাতিল
            </button>
            <button
              className="btn btn-sm btn-danger w-50 fw-bold"
              disabled={submitting}
              onClick={() => handleCheckout("due")}
            >
              বাকি খাতা লিখুন (৳{total})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
