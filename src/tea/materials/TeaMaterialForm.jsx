import React, { useState } from "react";
import { useTea } from "../context/TeaContext";

export default function TeaMaterialForm({ editItem, onClose }) {
  const { addMaterial, updateMaterial, addExpense } = useTea();
  const [name, setName] = useState(editItem ? editItem.name : "");
  const [stock, setStock] = useState(editItem ? editItem.stock : "");
  const [unit, setUnit] = useState(editItem ? editItem.unit : "কেজি");
  const [minStock, setMinStock] = useState(editItem ? editItem.minStock : "2");
  const [costPrice, setCostPrice] = useState(editItem ? (editItem.costPrice || "") : "");
  const [isPurchaseExpense, setIsPurchaseExpense] = useState(!editItem); // নতুন ক্রয়ের ক্ষেত্রে ডিফল্ট অন
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return;
    setSubmitting(true);
    try {
      const payload = {
        name,
        stock: Number(stock || 0),
        unit,
        minStock: Number(minStock || 0),
        costPrice: Number(costPrice || 0)
      };
      if (editItem) {
        await updateMaterial(editItem.id, payload);
      } else {
        await addMaterial(payload);
        // কাঁচামাল ক্রয়ের খরচ ক্যাশ ড্রয়ার/Expense-এ রেকর্ড
        if (isPurchaseExpense && Number(costPrice) > 0) {
          await addExpense({
            title: `কাঁচামাল ক্রয়: ${name} (${stock} ${unit})`,
            amount: Number(costPrice),
            category: "কাঁচামাল"
          });
        }
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" style={{ borderRadius: "14px" }}>
          <div className="modal-header">
            <h6 className="modal-title fw-bold">
              {editItem ? "কাঁচামাল আপডেট" : "নতুন কাঁচামাল যোগ"}
            </h6>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">নাম</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="যেমন: চা পাতা, চিনি, তরল দুধ, গ্যাস"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div className="row">
                <div className="col-6 mb-3">
                  <label className="form-label">বর্তমান মজুদ</label>
                  <input
                    type="number"
                    step="any"
                    className="form-control"
                    placeholder="5"
                    value={stock}
                    onChange={e => setStock(e.target.value)}
                  />
                </div>
                <div className="col-6 mb-3">
                  <label className="form-label">একক (Unit)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="কেজি, লিটার, সিলিন্ডার"
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-6 mb-3">
                  <label className="form-label">সতর্কতা লেভেল (Low Alert)</label>
                  <input
                    type="number"
                    step="any"
                    className="form-control"
                    placeholder="2"
                    value={minStock}
                    onChange={e => setMinStock(e.target.value)}
                  />
                </div>
                <div className="col-6 mb-3">
                  <label className="form-label">ক্রয়মূল্য / খরচ (৳)</label>
                  <input
                    type="number"
                    step="any"
                    className="form-control"
                    placeholder="যেমন: ৫০০"
                    value={costPrice}
                    onChange={e => setCostPrice(e.target.value)}
                  />
                </div>
              </div>

              {!editItem && (
                <div className="form-check form-switch mb-2 bg-light p-2 rounded">
                  <input
                    className="form-check-input ms-0 me-2"
                    type="checkbox"
                    id="expSwitch"
                    checked={isPurchaseExpense}
                    onChange={e => setIsPurchaseExpense(e.target.checked)}
                  />
                  <label className="form-check-label small fw-semibold" htmlFor="expSwitch">
                    দোকানের ড্রয়ার খরচ (Expense)-এ যুক্ত করুন
                  </label>
                  <small className="d-block text-muted" style={{ fontSize: "11px" }}>
                    অন থাকলে ক্রয়মূল্য স্বয়ংক্রিয়ভাবে ক্যাশ ড্রয়ার খরচ হিসেবে রেকর্ড হবে
                  </small>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>বাতিল</button>
              <button type="submit" className="btn btn-custom-primary btn-sm" disabled={submitting}>
                সংরক্ষণ করুন
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
