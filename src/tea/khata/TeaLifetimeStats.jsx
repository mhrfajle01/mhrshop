import React, { useState } from "react";
import { useTea } from "../context/TeaContext";

export default function TeaLifetimeStats() {
  const { orders, expenses, khataSettings, updateKhataSettings } = useTea();
  const [editingCapital, setEditingCapital] = useState(false);
  const [capitalInput, setCapitalInput] = useState(khataSettings?.initialCapital || 0);

  const totalSales = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalCashCollected = orders.reduce((sum, o) => sum + (o.paid || 0), 0);
  const totalDuePending = orders.reduce((sum, o) => sum + (o.due || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netLifetimeProfit = totalSales - totalExpenses;

  const handleSaveCapital = async () => {
    await updateKhataSettings({
      ...khataSettings,
      initialCapital: Number(capitalInput || 0)
    });
    setEditingCapital(false);
  };

  return (
    <div className="card-custom p-3 mb-3 bg-white border">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="fw-bold" style={{ fontSize: "14px" }}>
          🏛️ চা স্টলের অল-ওভার হিসাব (Lifetime)
        </span>
        <button
          className="btn btn-sm btn-outline-secondary py-0 px-2"
          style={{ fontSize: "11px" }}
          onClick={() => {
            setCapitalInput(khataSettings?.initialCapital || 0);
            setEditingCapital(!editingCapital);
          }}
        >
          {editingCapital ? "বাতিল" : "মূলধন সেট"}
        </button>
      </div>

      {editingCapital && (
        <div className="input-group input-group-sm mb-2">
          <span className="input-group-text">স্টল শুরুর মূলধন ৳</span>
          <input
            type="number"
            className="form-control"
            value={capitalInput}
            onChange={e => setCapitalInput(e.target.value)}
          />
          <button className="btn btn-success" onClick={handleSaveCapital}>সেভ</button>
        </div>
      )}

      <div className="row g-2 text-center" style={{ fontSize: "12px" }}>
        <div className="col-4">
          <div className="p-2 border rounded bg-light">
            <div className="text-muted">শুরুর মূলধন</div>
            <div className="fw-bold text-primary">৳{khataSettings?.initialCapital || 0}</div>
          </div>
        </div>
        <div className="col-4">
          <div className="p-2 border rounded bg-light">
            <div className="text-muted">সর্বমোট বিক্রি</div>
            <div className="fw-bold text-success">৳{totalSales}</div>
          </div>
        </div>
        <div className="col-4">
          <div className="p-2 border rounded bg-light">
            <div className="text-muted">সর্বমোট খরচ</div>
            <div className="fw-bold text-danger">৳{totalExpenses}</div>
          </div>
        </div>
        <div className="col-6">
          <div className="p-2 border rounded bg-light">
            <div className="text-muted">নগদ ক্যাশ আদায়</div>
            <div className="fw-bold">৳{totalCashCollected}</div>
          </div>
        </div>
        <div className="col-6">
          <div className="p-2 border rounded bg-light">
            <div className="text-muted">বাজারে মোট বাকি</div>
            <div className="fw-bold text-danger">৳{totalDuePending}</div>
          </div>
        </div>
      </div>

      <div className="mt-2 p-2 bg-success-subtle rounded text-center">
        <span style={{ fontSize: "12px" }}>শুরু থেকে আজ পর্যন্ত নিট লাভ: </span>
        <span className="fw-bold text-success" style={{ fontSize: "15px" }}>৳{netLifetimeProfit}</span>
      </div>
    </div>
  );
}
