import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { formatCurrency, getBdToday } from "../../utils/formatters";
import * as teaApi from "../context/teaDb";

export default function CombinedShopBanner({ sales = [], teaOrders = [], onNavigateToTea }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const isInRange = (dStr) => {
    if (!dStr) return false;
    const dateOnly = dStr.slice(0, 10);
    if (startDate && dateOnly < startDate) return false;
    if (endDate && dateOnly > endDate) return false;
    return true;
  };

  const filteredSales = sales.filter(s => !s.deleted && (!startDate && !endDate ? true : isInRange(s.date || s.createdAt)));
  const filteredTea = teaOrders.filter(t => !t.deleted && (!startDate && !endDate ? true : isInRange(t.date || t.createdAt)));

  const mudiSales = filteredSales.reduce((sum, s) => sum + Number(s.paidAmount || s.totalAmount || 0), 0);
  const teaSales = filteredTea.reduce((sum, t) => sum + Number(t.paid || t.total || 0), 0);
  const totalShopSale = mudiSales + teaSales;

  return (
    <div className="card-custom p-3 mb-3 bg-white border border-success-subtle shadow-sm">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
        <span className="fw-bold" style={{ fontSize: "13px" }}>
          🏪 সম্পূর্ণ দোকান সারাংশ (মুদি + চা স্টল)
        </span>
        <div className="d-flex align-items-center gap-1">
          <input
            type="date"
            className="form-control form-control-sm py-0 px-1"
            style={{ fontSize: "11px", width: "115px" }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            title="শুরুর তারিখ"
          />
          <span className="text-muted" style={{ fontSize: "11px" }}>-</span>
          <input
            type="date"
            className="form-control form-control-sm py-0 px-1"
            style={{ fontSize: "11px", width: "115px" }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            title="শেষের তারিখ"
          />
          {(startDate || endDate) && (
            <button
              className="btn btn-sm btn-light border py-0 px-1.5"
              style={{ fontSize: "10px" }}
              onClick={() => { setStartDate(""); setEndDate(""); }}
              title="সব সময় (Overall)"
            >
              ×
            </button>
          )}
          <button
            className="btn btn-sm btn-outline-success py-0 px-2 ms-1"
            style={{ fontSize: "11px" }}
            onClick={onNavigateToTea}
          >
            🍵 চা স্টল যান
          </button>
        </div>
      </div>

      <div className="row g-2 text-center" style={{ fontSize: "12px" }}>
        <div className="col-4">
          <div className="p-2 border rounded bg-light">
            <div className="text-muted" style={{ fontSize: "11px" }}>মুদি বিক্রি ({filteredSales.length})</div>
            <div className="fw-bold text-primary">{formatCurrency(mudiSales)}</div>
          </div>
        </div>
        <div className="col-4">
          <div className="p-2 border rounded bg-light">
            <div className="text-muted" style={{ fontSize: "11px" }}>চা/সিগারেট ({filteredTea.length})</div>
            <div className="fw-bold text-success">{formatCurrency(teaSales)}</div>
          </div>
        </div>
        <div className="col-4">
          <div className="p-2 border rounded bg-success-subtle">
            <div className="text-muted" style={{ fontSize: "11px" }}>দোকানের মোট ক্যাশ</div>
            <div className="fw-bold text-success">{formatCurrency(totalShopSale)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
