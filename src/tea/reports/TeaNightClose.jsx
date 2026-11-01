import React, { useState } from "react";
import { useTea } from "../context/TeaContext";
import { getBdToday, formatCurrency } from "../../utils/formatters";

export default function TeaNightClose() {
  const { menuItems, placeOrder, addExpense } = useTea();

  // Mode: 'items' (Fast item count) or 'cash' (Cash-first reconciliation)
  const [mode, setMode] = useState("items");
  const [itemQuantities, setItemQuantities] = useState({});
  const [cashInHand, setCashInHand] = useState("");
  const [dueAmount, setDueAmount] = useState("");
  const [dailyExpense, setDailyExpense] = useState("");
  const [expenseNote, setExpenseNote] = useState("রাতের হিসাব - খরচ");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Note Counter (optional quick helper)
  const [notes, setNotes] = useState({ 500: "", 100: "", 50: "", 20: "", 10: "" });
  const [showNoteCalc, setShowNoteCalc] = useState(false);

  const handleQtyChange = (itemId, val) => {
    const qty = Math.max(0, parseInt(val, 10) || 0);
    setItemQuantities(prev => ({ ...prev, [itemId]: qty }));
  };

  const handleNoteChange = (denom, val) => {
    const updated = { ...notes, [denom]: val };
    setNotes(updated);
    const totalCash = Object.entries(updated).reduce(
      (sum, [d, count]) => sum + (Number(d) * (parseInt(count, 10) || 0)),
      0
    );
    if (totalCash > 0) setCashInHand(totalCash.toString());
  };

  // Calculations
  const calculatedItemsTotal = menuItems.reduce((sum, item) => {
    const qty = itemQuantities[item.id] || 0;
    return sum + (qty * Number(item.price || 0));
  }, 0);

  const enteredCash = parseFloat(cashInHand) || 0;
  const enteredDue = parseFloat(dueAmount) || 0;
  const enteredExpense = parseFloat(dailyExpense) || 0;
  const totalReconciledSales = enteredCash + enteredDue + enteredExpense;

  const discrepancy = enteredCash > 0 ? (totalReconciledSales - calculatedItemsTotal) : 0;

  const handleSaveNightClose = async () => {
    const selectedItems = menuItems
      .filter(item => (itemQuantities[item.id] || 0) > 0)
      .map(item => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: itemQuantities[item.id],
        subtotal: itemQuantities[item.id] * Number(item.price)
      }));

    if (selectedItems.length === 0 && enteredCash === 0) {
      alert("অনুগ্রহ করে বিক্রিত আইটেম বা নগদ টাকার পরিমাণ লিখুন!");
      return;
    }

    // 1. If items were specified, place batch order
    if (selectedItems.length > 0) {
      await placeOrder({
        items: selectedItems,
        total: calculatedItemsTotal,
        paymentType: enteredDue > 0 ? "partial" : "cash",
        paidAmount: enteredDue > 0 ? Math.max(0, calculatedItemsTotal - enteredDue) : calculatedItemsTotal,
        dueAmount: enteredDue,
        note: "রাত শেষের মোট হিসাব (Night Close)"
      });
    } else if (enteredCash > 0) {
      // Just cash total entry as single consolidated sale
      await placeOrder({
        items: [{ id: "lump_sum", name: "সারাদিনের মোট বিক্রি", price: totalReconciledSales, quantity: 1, subtotal: totalReconciledSales }],
        total: totalReconciledSales,
        paymentType: enteredDue > 0 ? "partial" : "cash",
        paidAmount: enteredCash,
        dueAmount: enteredDue,
        note: "এককালীন রাতের ক্যাশ ক্লোজিং"
      });
    }

    // 2. If expense recorded, save expense
    if (enteredExpense > 0) {
      await addExpense({
        title: expenseNote || "দৈনিক খরচ",
        amount: enteredExpense,
        date: getBdToday(),
        category: "দোকান খরচ"
      });
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setItemQuantities({});
      setCashInHand("");
      setDueAmount("");
      setDailyExpense("");
      setNotes({ 500: "", 100: "", 50: "", 20: "", 10: "" });
    }, 2500);
  };

  return (
    <div className="card shadow-sm border-0 p-3 mb-4">
      <div className="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom">
        <h6 className="fw-bold mb-0 text-primary">
          <i className="bi bi-moon-stars-fill me-2 text-warning"></i>
          রাতের হিসাব ও স্টক ক্লোজিং
        </h6>
        <div className="btn-group btn-group-sm">
          <button
            className={`btn ${mode === "items" ? "btn-primary" : "btn-outline-primary"} py-0 px-2`}
            onClick={() => setMode("items")}
          >
            আইটেম বিক্রি
          </button>
          <button
            className={`btn ${mode === "cash" ? "btn-primary" : "btn-outline-primary"} py-0 px-2`}
            onClick={() => setMode("cash")}
          >
            ক্যাশ রিকনসাইল
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="alert alert-success py-2 px-3 small text-center mb-3">
          <i className="bi bi-check-circle-fill me-1"></i>
          আজকের হিসাব সফলভাবে সংরক্ষিত হয়েছে!
        </div>
      )}

      {/* Tab: Fast Item Counter */}
      {mode === "items" && (
        <div>
          <p className="text-muted small mb-2">
            সারাদিনে কয় কাপ চা বা আইটেম বিক্রি হয়েছে দ্রুত লিখে ফেলুন:
          </p>
          <div className="list-group mb-3" style={{ maxHeight: "250px", overflowY: "auto" }}>
            {menuItems.map(item => {
              const qty = itemQuantities[item.id] || "";
              return (
                <div key={item.id} className="list-group-item d-flex align-items-center justify-content-between p-2">
                  <div className="me-2 text-truncate">
                    <span className="fw-semibold d-block text-truncate">{item.name}</span>
                    <small className="text-muted">{formatCurrency(item.price)}</small>
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary px-2 py-0"
                      onClick={() => handleQtyChange(item.id, (parseInt(qty, 10) || 0) - 1)}
                    >-</button>
                    <input
                      type="number"
                      min="0"
                      className="form-control form-control-sm text-center px-1"
                      style={{ width: "65px" }}
                      placeholder="0"
                      value={qty}
                      onChange={(e) => handleQtyChange(item.id, e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary px-2 py-0"
                      onClick={() => handleQtyChange(item.id, (parseInt(qty, 10) || 0) + 1)}
                    >+</button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-light p-2 rounded mb-3 d-flex justify-content-between align-items-center">
            <span className="text-muted small">আইটেম অনুযায়ী বিক্রি:</span>
            <span className="fw-bold text-success fs-6">{formatCurrency(calculatedItemsTotal)}</span>
          </div>
        </div>
      )}

      {/* Tab: Cash & Expenses */}
      {mode === "cash" && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-1">
            <label className="form-label small fw-bold mb-0">ক্যাশবাক্সে নগদ টাকা:</label>
            <button
              type="button"
              className="btn btn-link btn-sm p-0 text-decoration-none"
              style={{ fontSize: "11px" }}
              onClick={() => setShowNoteCalc(!showNoteCalc)}
            >
              {showNoteCalc ? "নোট গোনা বন্ধ করুন" : "নোট ক্যালকুলেটর"}
            </button>
          </div>

          {showNoteCalc && (
            <div className="bg-light p-2 rounded mb-2 border">
              <div className="row g-1 text-center small">
                {[500, 100, 50, 20, 10].map(denom => (
                  <div key={denom} className="col-4 col-sm">
                    <span className="text-muted" style={{ fontSize: "10px" }}>৳{denom}</span>
                    <input
                      type="number"
                      placeholder="সংখ্যা"
                      className="form-control form-control-sm text-center py-0"
                      value={notes[denom]}
                      onChange={(e) => handleNoteChange(denom, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="input-group input-group-sm mb-2">
            <span className="input-group-text">৳</span>
            <input
              type="number"
              className="form-control"
              placeholder="মোট নগদ ক্যাশ"
              value={cashInHand}
              onChange={(e) => setCashInHand(e.target.value)}
            />
          </div>

          <div className="row g-2 mb-2">
            <div className="col-6">
              <label className="form-label small mb-0">আজকের বাকি:</label>
              <input
                type="number"
                className="form-control form-control-sm"
                placeholder="৳ বাকি"
                value={dueAmount}
                onChange={(e) => setDueAmount(e.target.value)}
              />
            </div>
            <div className="col-6">
              <label className="form-label small mb-0">আজকের খরচ:</label>
              <input
                type="number"
                className="form-control form-control-sm"
                placeholder="৳ খরচ"
                value={dailyExpense}
                onChange={(e) => setDailyExpense(e.target.value)}
              />
            </div>
          </div>

          {enteredExpense > 0 && (
            <input
              type="text"
              className="form-control form-control-sm mb-2"
              placeholder="খরচের বিবরণ (যেমন: দুধ/চিনি কেনা)"
              value={expenseNote}
              onChange={(e) => setExpenseNote(e.target.value)}
            />
          )}

          <div className="card bg-light border-0 p-2 mb-2">
            <div className="d-flex justify-content-between small mb-1">
              <span>নগদ ক্যাশ + বাকি + খরচ:</span>
              <span className="fw-bold text-primary">{formatCurrency(totalReconciledSales)}</span>
            </div>
            {calculatedItemsTotal > 0 && enteredCash > 0 && (
              <div className="d-flex justify-content-between small border-top pt-1 text-muted">
                <span>আইটেম গণনার সাথে পার্থক্য:</span>
                <span className={discrepancy === 0 ? "text-success fw-bold" : discrepancy > 0 ? "text-primary" : "text-danger"}>
                  {discrepancy > 0 ? `+${formatCurrency(discrepancy)}` : formatCurrency(discrepancy)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Button */}
      <button
        type="button"
        className="btn btn-success w-100 py-2 fw-semibold"
        onClick={handleSaveNightClose}
      >
        <i className="bi bi-check2-circle me-1"></i> আজকের হিসাব সংরক্ষণ করুন
      </button>
    </div>
  );
}
