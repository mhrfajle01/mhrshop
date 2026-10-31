import React, { useState } from "react";
import { useTea } from "../context/TeaContext";

export default function TeaMaterialForm({ editItem, onClose }) {
  const { addMaterial, updateMaterial } = useTea();
  const [name, setName] = useState(editItem ? editItem.name : "");
  const [stock, setStock] = useState(editItem ? editItem.stock : "");
  const [unit, setUnit] = useState(editItem ? editItem.unit : "কেজি");
  const [minStock, setMinStock] = useState(editItem ? editItem.minStock : "2");
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
        minStock: Number(minStock || 0)
      };
      if (editItem) {
        await updateMaterial(editItem.id, payload);
      } else {
        await addMaterial(payload);
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
              <div className="mb-3">
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
