import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { formatCurrency } from "../../utils/formatters";
import * as teaApi from "../context/teaDb";

export default function TeaReportSection({ startDate, endDate }) {
  const { currentUser, isLocalMode } = useAuth();
  const [teaOrders, setTeaOrders] = useState([]);
  const [teaExpenses, setTeaExpenses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const fetchTeaReports = async () => {
      setLoading(true);
      try {
        const [ords, exps] = await Promise.all([
          teaApi.getTeaOrders(currentUser.uid, isLocalMode),
          teaApi.getTeaExpenses(currentUser.uid, isLocalMode)
        ]);
        setTeaOrders(ords || []);
        setTeaExpenses(exps || []);
      } catch (e) {
        console.error("Failed to load tea report data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTeaReports();
  }, [currentUser, isLocalMode]);

  const isDateInRange = (dateStr) => {
    if (!dateStr) return false;
    return dateStr >= startDate && dateStr <= endDate;
  };

  const filteredOrders = teaOrders.filter(o => isDateInRange(o.date || o.createdAt?.slice(0, 10)));
  const filteredExpenses = teaExpenses.filter(e => isDateInRange(e.date || e.createdAt?.slice(0, 10)));

  const totalTeaSales = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalTeaCash = filteredOrders.reduce((sum, o) => sum + (o.paid || 0), 0);
  const totalTeaDue = filteredOrders.reduce((sum, o) => sum + (o.due || 0), 0);
  const totalTeaExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netTeaProfit = totalTeaSales - totalTeaExpenses;

  // Item counts
  const itemCounts = {};
  filteredOrders.forEach(ord => {
    ord.items?.forEach(it => {
      itemCounts[it.name] = (itemCounts[it.name] || 0) + (it.qty || 1);
    });
  });

  return (
    <div className="card-custom p-3 mb-4 bg-white border border-success-subtle">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold text-success mb-0">
          🍵 চা ও সিগারেট স্টল রিপোর্ট ({startDate} হতে {endDate})
        </h6>
        {loading && <small className="text-muted">লোড হচ্ছে...</small>}
      </div>

      <div className="row g-2 text-center mb-3" style={{ fontSize: "12px" }}>
        <div className="col-6 col-sm-3">
          <div className="p-2 border rounded bg-light">
            <div className="text-muted" style={{ fontSize: "11px" }}>মোট চা/সিগারেট বিক্রি</div>
            <div className="fw-bold text-success fs-6">{formatCurrency(totalTeaSales)}</div>
            <small className="text-muted">অর্ডার: {filteredOrders.length} টি</small>
          </div>
        </div>
        <div className="col-6 col-sm-3">
          <div className="p-2 border rounded bg-light">
            <div className="text-muted" style={{ fontSize: "11px" }}>দুধ/চিনি/গ্যাস খরচ</div>
            <div className="fw-bold text-danger fs-6">{formatCurrency(totalTeaExpenses)}</div>
            <small className="text-muted">এন্ট্রি: {filteredExpenses.length} টি</small>
          </div>
        </div>
        <div className="col-6 col-sm-3">
          <div className="p-2 border rounded bg-light">
            <div className="text-muted" style={{ fontSize: "11px" }}>চা স্টলের নিট লাভ</div>
            <div className={`fw-bold fs-6 ${netTeaProfit >= 0 ? "text-success" : "text-danger"}`}>
              {formatCurrency(netTeaProfit)}
            </div>
            <small className="text-muted">আয় - ব্যয়</small>
          </div>
        </div>
        <div className="col-6 col-sm-3">
          <div className="p-2 border rounded bg-light">
            <div className="text-muted" style={{ fontSize: "11px" }}>চা স্টলে নতুন বাকি</div>
            <div className="fw-bold text-danger fs-6">{formatCurrency(totalTeaDue)}</div>
            <small className="text-muted">নগদ: {formatCurrency(totalTeaCash)}</small>
          </div>
        </div>
      </div>

      {/* Top sold tea/cigarette items */}
      <div className="border rounded p-2 bg-light">
        <span className="fw-semibold" style={{ fontSize: "12px" }}>
          সবচেয়ে বেশি বিক্রি হওয়া চা, সিগারেট ও নাস্তা:
        </span>
        {Object.keys(itemCounts).length === 0 ? (
          <div className="text-muted py-1" style={{ fontSize: "11px" }}>এই সময়ে কোনো বিক্রি নেই</div>
        ) : (
          <div className="d-flex flex-wrap gap-2 mt-2">
            {Object.entries(itemCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([name, qty]) => (
                <span key={name} className="badge bg-white text-dark border p-1.5" style={{ fontSize: "11px" }}>
                  {name}: <strong className="text-success">{qty}</strong> টি/কাপ
                </span>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
