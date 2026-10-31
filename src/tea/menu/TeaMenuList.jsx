import React, { useState } from "react";
import { useTea } from "../context/TeaContext";
import { useModal } from "../../context/ModalContext";
import TeaMenuForm from "./TeaMenuForm";

export default function TeaMenuList() {
  const { menuItems, removeMenuItem } = useTea();
  const { showConfirm } = useModal();
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedCat, setSelectedCat] = useState("All");

  const categories = ["All", "চা", "নাস্তা", "বিস্কুট", "অন্যান্য"];
  const filtered = selectedCat === "All" 
    ? menuItems 
    : menuItems.filter(i => i.category === selectedCat);

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0">📋 চা মেনু তালিকা ({menuItems.length})</h6>
        <button className="btn btn-sm btn-custom-primary" onClick={() => { setEditingItem(null); setShowForm(true); }}>
          <i className="bi bi-plus-lg me-1"></i> নতুন আইটেম
        </button>
      </div>

      <div className="d-flex overflow-auto pb-2 mb-2">
        {categories.map(cat => (
          <span
            key={cat}
            className={`category-pill ${selectedCat === cat ? "active" : ""}`}
            onClick={() => setSelectedCat(cat)}
          >
            {cat === "All" ? "সবগুলো" : cat}
          </span>
        ))}
      </div>

      <div className="row g-2">
        {filtered.map(item => (
          <div key={item.id} className="col-12 col-sm-6">
            <div className="card-custom p-3 d-flex justify-content-between align-items-center mb-0">
              <div>
                <div className="fw-bold">{item.name}</div>
                <small className="text-muted">৳{item.price} / {item.unit || "কাপ"} • {item.category}</small>
              </div>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-light border"
                  onClick={() => { setEditingItem(item); setShowForm(true); }}
                >
                  <i className="bi bi-pencil"></i>
                </button>
                <button
                  className="btn btn-sm btn-light border text-danger"
                  onClick={async () => {
                    const ok = await showConfirm(`"${item.name}" ডিলিট করবেন?`, "আইটেম ডিলিট", true);
                    if (ok) removeMenuItem(item.id);
                  }}
                >
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <TeaMenuForm
          editItem={editingItem}
          onClose={() => { setShowForm(false); setEditingItem(null); }}
        />
      )}
    </div>
  );
}
