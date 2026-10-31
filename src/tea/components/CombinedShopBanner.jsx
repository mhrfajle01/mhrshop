import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { formatCurrency, getBdToday } from "../../utils/formatters";
import * as teaApi from "../context/teaDb";

export default function CombinedShopBanner({ mudiSalesToday, mudiProfitToday, onNavigateToTea }) {
  const { currentUser, isLocalMode } = useAuth();
  const [teaCashToday, setTeaCashToday] = useState(0);
  const [teaOrdersToday, setTeaOrdersToday] = useState(0);

  useEffect(() => {
    if (!currentUser) return;
    const loadTodayTea = async () => {
      try {
        const ords = await teaApi.getTeaOrders(currentUser.uid, isLocalMode);
        const todayStr = getBdToday();
        const todayOrds = ords.filter(o => (o.date || o.createdAt?.slice(0, 10)) === todayStr);
        const cash = todayOrds.reduce((sum, o) => sum + (o.paid || 0), 0);
        setTeaCashToday(cash);
        setTeaOrdersToday(todayOrds.length);
      } catch (e) {
        console.error("Failed to load today tea sales for banner:", e);
      }
    };
    loadTodayTea();
  }, [currentUser, isLocalMode]);

  const totalShopSale = (mudiSalesToday || 0) + teaCashToday;

  return (
    <div className="card-custom p-3 mb-3 bg-white border border-success-subtle shadow-sm">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="fw-bold" style={{ fontSize: "13px" }}>
          🏪 সম্পূর্ণ দোকান সারাংশ (মুদি + চা স্টল)
        </span>
        <button
          className="btn btn-sm btn-outline-success py-0 px-2"
          style={{ fontSize: "11px" }}
          onClick={onNavigateToTea}
        >
          🍵 চা স্টল যান
        </button>
      </div>

      <div className="row g-2 text-center" style={{ fontSize: "12px" }}>
        <div className="col-4">
          <div className="p-2 border rounded bg-light">
            <div className="text-muted" style={{ fontSize: "11px" }}>মুদি বিক্রি</div>
            <div className="fw-bold text-primary">{formatCurrency(mudiSalesToday || 0)}</div>
          </div>
        </div>
        <div className="col-4">
          <div className="p-2 border rounded bg-light">
            <div className="text-muted" style={{ fontSize: "11px" }}>চা/সিগারেট ({teaOrdersToday})</div>
            <div className="fw-bold text-success">{formatCurrency(teaCashToday)}</div>
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
