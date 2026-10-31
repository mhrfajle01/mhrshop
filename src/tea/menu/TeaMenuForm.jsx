import React, { useState } from "react";
import { useTea } from "../context/TeaContext";
import { useData } from "../../context/DataContext";

export default function TeaMenuForm({ editItem, onClose }) {
  const { addMenuItem, updateMenuItem } = useTea();
  const { products } = useData();

  const [name, setName] = useState(editItem ? editItem.name : "");
  const [price, setPrice] = useState(editItem ? editItem.price : "");
  const [category, setCategory] = useState(editItem ? editItem.category : "চা");
  const [unit, setUnit] = useState(editItem ? editItem.unit : "কাপ");
  const [linkedProductId, setLinkedProductId] = useState(editItem ? (editItem.linkedProductId || "") : "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price) return;
    setSubmitting(true);
    try {
      const payload = {
        name,
        price: Number(price),
        category,
        unit,
        linkedProductId: linkedProductId || null
      };
      if (editItem) {
        await updateMenuItem(editItem.id, payload);
      } else {
        await addMenuItem({ ...payload, active: true });
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
              {editItem ? "আইটেম সম্পাদনা" : "নতুন চা/সিগারেট/নাস্তা আইটেম"}
            </h6>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">আইটেমের নাম</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="যেমন: বেনসন সিগারেট, দুধ চা, সমুচা"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="row">
                <div className="col-6 mb-3">
                  <label className="form-label">বিক্রি মূল্য (৳)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="18"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="col-6 mb-3">
                  <label className="form-label">একক (Unit)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="শলা, কাপ, পিস"
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">ক্যাটাগরি</label>
                <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="চা">চা / কফি</option>
                  <option value="সিগারেট">সিগারেট (Cigarette)</option>
                  <option value="নাস্তা">নাস্তা / স্ন্যাক্স</option>
                  <option value="বিস্কুট">বিস্কুট / বেকারি</option>
                  <option value="অন্যান্য">অন্যান্য</option>
                </select>
              </div>

              {/* মুদি প্রোডাক্টের সাথে ইনভেন্টরি লিংক (সিগারেট/বিস্কুটের স্টক কাটার জন্য) */}
              <div className="mb-3 p-2 border rounded bg-light">
                <label className="form-label text-success mb-1" style={{ fontSize: "11px" }}>
                  🔗 মুদি ইনভেন্টরির সাথে লিংক (ঐচ্ছিক):
                </label>
                <select
                  className="form-select form-select-sm"
                  value={linkedProductId}
                  onChange={e => setLinkedProductId(e.target.value)}
                >
                  <option value="">কোনো মুদি পণ্যের সাথে লিংক নেই</option>
                  {products?.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (মুজদ: {p.stock} {p.unit})
                    </option>
                  ))}
                </select>
                <small className="text-muted" style={{ fontSize: "10px" }}>
                  * লিংক করলে চা POS-এ বিক্রি হলে মুদির স্টক থেকে স্বয়ংক্রিয়ভাবে ১টি করে কমে যাবে।
                </small>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>বাতিল</button>
              <button type="submit" className="btn btn-custom-primary btn-sm" disabled={submitting}>
                {submitting ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
