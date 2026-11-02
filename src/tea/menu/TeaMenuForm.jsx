import React, { useState } from "react";
import { useTea } from "../context/TeaContext";
import { useData } from "../../context/DataContext";

export default function TeaMenuForm({ editItem, onClose }) {
  const { addMenuItem, updateMenuItem, materials = [] } = useTea();
  const { products } = useData();

  const [name, setName] = useState(editItem ? editItem.name : "");
  const [price, setPrice] = useState(editItem ? editItem.price : "");
  const [category, setCategory] = useState(editItem ? editItem.category : "চা");
  const [unit, setUnit] = useState(editItem ? editItem.unit : "কাপ");
  const [linkedProductId, setLinkedProductId] = useState(editItem ? (editItem.linkedProductId || "") : "");
  const [recipes, setRecipes] = useState(editItem?.recipes || []);
  const [submitting, setSubmitting] = useState(false);

  const handleAddRecipeRow = () => {
    if (materials.length === 0) return;
    setRecipes([...recipes, { materialId: materials[0].id, amount: "", unit: "গ্রাম" }]);
  };

  const handleUpdateRecipe = (index, field, value) => {
    const updated = [...recipes];
    updated[index][field] = value;
    setRecipes(updated);
  };

  const handleRemoveRecipe = (index) => {
    setRecipes(recipes.filter((_, i) => i !== index));
  };

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
        linkedProductId: linkedProductId || null,
        recipes: recipes.filter(r => r.materialId && Number(r.amount) > 0)
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

              {/* কাঁচামাল রেসিপি কনফিগারেশন (ইউজার নিজে সিলেক্ট করবেন প্রতি কাপে কতটুকু কাঁচামাল লাগবে) */}
              <div className="mb-3 p-2 border rounded bg-light">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label text-success mb-0 small fw-bold">
                    🌿 কাঁচামাল খরচ রেসিপি (ঐচ্ছিক):
                  </label>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline-success py-0 px-2"
                    style={{ fontSize: "11px" }}
                    onClick={handleAddRecipeRow}
                  >
                    + কাঁচামাল যোগ
                  </button>
                </div>
                <small className="text-muted d-block mb-2" style={{ fontSize: "10px" }}>
                  * প্রতি ১ {unit || "কাপ"} তৈরিতে কোন কাঁচামাল কতটুকু (গ্রাম/মিলি/কেজি) খরচ হবে তা সেট করুন।
                </small>

                {recipes.length === 0 ? (
                  <div className="text-muted small text-center py-1">কোনো কাঁচামাল যুক্ত করা হয়নি</div>
                ) : (
                  recipes.map((rec, idx) => (
                    <div key={idx} className="d-flex gap-1 align-items-center mb-1">
                      <select
                        className="form-select form-select-sm"
                        style={{ fontSize: "11px", flex: 2 }}
                        value={rec.materialId}
                        onChange={e => handleUpdateRecipe(idx, "materialId", e.target.value)}
                      >
                        {materials.map(m => (
                          <option key={m.id} value={m.id}>{m.name} ({m.stock} {m.unit})</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="any"
                        placeholder="পরিমাণ"
                        className="form-control form-control-sm text-center"
                        style={{ fontSize: "11px", flex: 1 }}
                        value={rec.amount}
                        onChange={e => handleUpdateRecipe(idx, "amount", e.target.value)}
                      />
                      <select
                        className="form-select form-select-sm"
                        style={{ fontSize: "11px", width: "70px" }}
                        value={rec.unit || "গ্রাম"}
                        onChange={e => handleUpdateRecipe(idx, "unit", e.target.value)}
                      >
                        <option value="গ্রাম">গ্রাম</option>
                        <option value="মিলি">মিলি</option>
                        <option value="কেজি">কেজি</option>
                        <option value="লিটার">লিটার</option>
                        <option value="পিস">পিস</option>
                      </select>
                      <button
                        type="button"
                        className="btn btn-sm text-danger p-0 px-1"
                        onClick={() => handleRemoveRecipe(idx)}
                      >
                        <i className="bi bi-x-circle"></i>
                      </button>
                    </div>
                  ))
                )}
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
