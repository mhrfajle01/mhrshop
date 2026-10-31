import React, { useState } from "react";
import { useTea } from "../context/TeaContext";
import TeaSummaryCard from "./TeaSummaryCard";
import { getBdToday } from "../../utils/formatters";

export default function TeaDailySummary() {
  const { orders } = useTea();
  const [selectedDate, setSelectedDate] = useState(getBdToday());

  const filteredOrders = orders.filter(o => (o.date || o.createdAt?.slice(0, 10)) === selectedDate);
  const totalSales = filteredOrders.reduce((acc, o) => acc + (o.total || 0), 0);
  const totalCash = filteredOrders.reduce((acc, o) => acc + (o.paid || 0), 0);
  const totalDue = filteredOrders.reduce((acc, o) => acc + (o.due || 0), 0);

  // Item counts
  const itemCounts = {};
  filteredOrders.forEach(ord => {
    ord.items?.forEach(it => {
      itemCounts[it.name] = (itemCounts[it.name] || 0) + (it.qty || 1);
    });
  });

  return (
    <div className="p-2">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0">📊 দৈনিক চা স্টল হিসাব</h6>
        <input
          type="date"
          className="form-control form-control-sm w-auto"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
        />
      </div>

      <div className="row g-2 mb-3">
        <div className="col-12 col-sm-4">
          <TeaSummaryCard
            title="মোট বিক্রি"
            amount={totalSales}
            icon="bi-cash-coin"
            bgClass="bg-success-subtle text-success"
            subtext={`${filteredOrders.length} টি অর্ডার/টোকেন`}
          />
        </div>
        <div className="col-6 col-sm-4">
          <TeaSummaryCard
            title="নগদ আদায়"
            amount={totalCash}
            icon="bi-wallet2"
            bgClass="bg-primary-subtle text-primary"
          />
        </div>
        <div className="col-6 col-sm-4">
          <TeaSummaryCard
            title="বাকি"
            amount={totalDue}
            icon="bi-hourglass-split"
            bgClass="bg-danger-subtle text-danger"
          />
        </div>
      </div>

      {/* Item sales breakdown */}
      <div className="card-custom p-3">
        <div className="fw-bold mb-2" style={{ fontSize: "13px" }}>কাপ ও নাস্তা বিক্রয় বিবরণী:</div>
        {Object.keys(itemCounts).length === 0 ? (
          <div className="text-muted text-center py-2" style={{ fontSize: "12px" }}>এই তারিখে কোনো বিক্রি নেই</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm mb-0" style={{ fontSize: "13px" }}>
              <tbody>
                {Object.entries(itemCounts).map(([name, qty]) => (
                  <tr key={name}>
                    <td>{name}</td>
                    <td className="text-end fw-bold">{qty} টি/কাপ</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
