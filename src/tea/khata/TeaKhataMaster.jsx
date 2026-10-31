import React, { useState } from "react";
import { useTea } from "../context/TeaContext";
import TeaLifetimeStats from "./TeaLifetimeStats";
import TeaExpenseTracker from "./TeaExpenseTracker";
import TeaCashDrawerGuide from "./TeaCashDrawerGuide";
import TeaPhysicalNotebook from "./TeaPhysicalNotebook";

export default function TeaKhataMaster() {
  const { orders, expenses } = useTea();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  const filteredOrders = orders.filter(o => (o.date || o.createdAt?.slice(0, 10)) === selectedDate);
  const filteredExpenses = expenses.filter(e => (e.date || e.createdAt?.slice(0, 10)) === selectedDate);

  const cashSales = filteredOrders.reduce((sum, o) => sum + (o.paid || 0), 0);
  const dueSales = filteredOrders.reduce((sum, o) => sum + (o.due || 0), 0);
  const totalExpense = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const openingFloat = Number(localStorage.getItem(`tea_opening_float_${selectedDate}`) || 0);
  const expectedCash = openingFloat + cashSales - totalExpense;
  const netProfit = cashSales - totalExpense;

  const itemCounts = {};
  filteredOrders.forEach(ord => {
    ord.items?.forEach(it => {
      itemCounts[it.name] = (itemCounts[it.name] || 0) + (it.qty || 1);
    });
  });

  return (
    <div className="p-2">
      {/* Date selector header */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="fw-bold text-success" style={{ fontSize: "14px" }}>
          📒 চা স্টল খাতা ও গাইড
        </span>
        <input
          type="date"
          className="form-control form-control-sm w-auto"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
        />
      </div>

      {/* 1. Lifetime Overview */}
      <TeaLifetimeStats />

      {/* 2. Today's Expenses */}
      <TeaExpenseTracker selectedDate={selectedDate} />

      {/* 3. Cash Drawer Balance Check */}
      <TeaCashDrawerGuide
        date={selectedDate}
        todayCashSales={cashSales}
        todayExpenses={totalExpense}
      />

      {/* 4. Physical Notebook Blueprint */}
      <TeaPhysicalNotebook
        date={selectedDate}
        openingFloat={openingFloat}
        cashSales={cashSales}
        dueSales={dueSales}
        totalExpense={totalExpense}
        expectedCash={expectedCash}
        netProfit={netProfit}
        itemCounts={itemCounts}
      />
    </div>
  );
}
