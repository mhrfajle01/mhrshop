import React, { useState } from "react";
import { useTea } from "../context/TeaContext";
import { useModal } from "../../context/ModalContext";
import TeaMaterialForm from "./TeaMaterialForm";

export default function TeaMaterialsList() {
  const { materials, removeMaterial, updateMaterial } = useTea();
  const { showConfirm } = useModal();
  const [showForm, setShowForm] = useState(false);
  const [editingMat, setEditingMat] = useState(null);

  const handleQuickAdjust = async (mat, delta) => {
    const newStock = Math.max(0, Number(((mat.stock || 0) + delta).toFixed(3)));
    await updateMaterial(mat.id, { ...mat, stock: newStock });
  };

  const handleWastage = async (mat) => {
    const qtyStr = window.prompt(`"${mat.name}" কত ${mat.unit} অপচয় বা নষ্ট হয়েছে?`, "০.৫");
    if (!qtyStr) return;
    const qty = parseFloat(qtyStr);
    if (!isNaN(qty) && qty > 0) {
      const newStock = Math.max(0, Number(((mat.stock || 0) - qty).toFixed(3)));
      await updateMaterial(mat.id, { ...mat, stock: newStock });
      alert(`"${mat.name}" থেকে ${qty} ${mat.unit} অপচয় হিসেবে স্টক কমানো হয়েছে।`);
    }
  };

  return (
    <div className="p-2">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0">🌿 কাঁচামাল স্টক ({materials.length})</h6>
        <button className="btn btn-sm btn-custom-primary" onClick={() => { setEditingMat(null); setShowForm(true); }}>
          <i className="bi bi-plus-lg me-1"></i> নতুন যোগ
        </button>
      </div>

      {materials.length === 0 ? (
        <div className="text-center text-muted py-4 border rounded bg-light">
          কোনো কাঁচামাল যোগ করা হয়নি। যোগ করুন: চা পাতা, চিনি, দুধ ইত্যাদি।
        </div>
      ) : (
        <div className="row g-2">
          {materials.map(mat => {
            const isLow = mat.stock <= mat.minStock;
            return (
              <div key={mat.id} className="col-12 col-sm-6">
                <div className="card-custom p-3 mb-0">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <div className="fw-bold">{mat.name}</div>
                      <small className={isLow ? "text-danger fw-bold" : "text-muted"}>
                        মজুদ: {mat.stock} {mat.unit} {isLow && "(কম আছে!)"}
                      </small>
                    </div>
                    <div className="d-flex gap-1">
                      <button className="btn btn-sm btn-outline-warning p-1" title="নষ্ট / অপচয় (Wastage)" onClick={() => handleWastage(mat)}>
                        <i className="bi bi-exclamation-triangle" style={{ fontSize: "11px" }}></i> অপচয়
                      </button>
                      <button className="btn btn-sm btn-light border p-1" onClick={() => { setEditingMat(mat); setShowForm(true); }}>
                        <i className="bi bi-pencil" style={{ fontSize: "11px" }}></i>
                      </button>
                      <button className="btn btn-sm btn-light border text-danger p-1" onClick={async () => {
                        const ok = await showConfirm(`"${mat.name}" ডিলিট করবেন?`, "কাঁচামাল ডিলিট", true);
                        if (ok) removeMaterial(mat.id);
                      }}>
                        <i className="bi bi-trash" style={{ fontSize: "11px" }}></i>
                      </button>
                    </div>
                  </div>

                  {/* Quick +/- Stock entry (KG & Gram Support) */}
                  <div className="d-flex flex-column gap-1 pt-2 border-top">
                    <div className="d-flex align-items-center justify-content-between">
                      <span style={{ fontSize: "11px" }} className="text-muted">কেজি আপডেট:</span>
                      <div className="d-flex gap-1">
                        <button className="btn btn-sm btn-outline-danger py-0 px-1.5" style={{ fontSize: "11px" }} onClick={() => handleQuickAdjust(mat, -1)}>-১ কেজি</button>
                        <button className="btn btn-sm btn-outline-success py-0 px-1.5" style={{ fontSize: "11px" }} onClick={() => handleQuickAdjust(mat, 1)}>+১ কেজি</button>
                        <button className="btn btn-sm btn-outline-success py-0 px-1.5" style={{ fontSize: "11px" }} onClick={() => handleQuickAdjust(mat, 5)}>+৫ কেজি</button>
                      </div>
                    </div>
                    {/* Gram adjustment for tea leaves / sugar */}
                    <div className="d-flex align-items-center justify-content-between">
                      <span style={{ fontSize: "11px" }} className="text-muted">ব্যবহার (গ্রাম):</span>
                      <div className="d-flex gap-1">
                        <button className="btn btn-sm btn-light border text-danger py-0 px-1.5" style={{ fontSize: "10px" }} onClick={() => handleQuickAdjust(mat, -0.1)}>-১০০ গ্রাম</button>
                        <button className="btn btn-sm btn-light border text-danger py-0 px-1.5" style={{ fontSize: "10px" }} onClick={() => handleQuickAdjust(mat, -0.25)}>-২৫০ গ্রাম</button>
                        <button className="btn btn-sm btn-light border text-danger py-0 px-1.5" style={{ fontSize: "10px" }} onClick={() => handleQuickAdjust(mat, -0.4)}>-৪০০ গ্রাম</button>
                        <button className="btn btn-sm btn-light border text-danger py-0 px-1.5" style={{ fontSize: "10px" }} onClick={() => handleQuickAdjust(mat, -0.5)}>-৫০০ গ্রাম</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <TeaMaterialForm
          editItem={editingMat}
          onClose={() => { setShowForm(false); setEditingMat(null); }}
        />
      )}
    </div>
  );
}
