import React, { useState, useEffect } from "react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import * as teaApi from "../tea/context/teaDb";
import { DEFAULT_TEA_MENU } from "../tea/menu/TeaMenuPresets";
import { formatCurrency, getBdToday } from "../utils/formatters";

export default function DayClose() {
  const { products, sales, expenses, teaOrders = [], teaExpenses = [], addSale, addExpense, updateProduct } = useData();
  const { currentUser, isLocalMode } = useAuth();

  const [activeTab, setActiveTab] = useState("cash"); // 'cash' | 'quick-items' | 'inventory'
  
  // Tea items state
  const [teaMenu, setTeaMenu] = useState([]);
  const [teaCounts, setTeaCounts] = useState({});
  const [mudiCounts, setMudiCounts] = useState({});

  // Cash reconciliation inputs
  const [cashInHand, setCashInHand] = useState("");
  const [digitalPaid, setDigitalPaid] = useState("");
  const [todayDue, setTodayDue] = useState("");
  const [todayExpense, setTodayExpense] = useState("");
  const [expenseTitle, setExpenseTitle] = useState("রাত শেষের দোকান খরচ");
  const [openingCash, setOpeningCash] = useState("");

  // Cash denomination counter
  const [showDenom, setShowDenom] = useState(false);
  const [notes, setNotes] = useState({ 1000: "", 500: "", 200: "", 100: "", 50: "", 20: "", 10: "" });

  // Reverse inventory: { [productId]: remainingStock }
  const [inventoryRemains, setInventoryRemains] = useState({});
  const [statusMsg, setStatusMsg] = useState("");

  const todayStr = getBdToday();

  // Load tea menu items
  useEffect(() => {
    async function loadMenu() {
      if (!currentUser) return;
      try {
        let items = await teaApi.getTeaMenuItems(currentUser.uid, isLocalMode);
        if (!items || items.length === 0) items = DEFAULT_TEA_MENU;
        setTeaMenu(items);
      } catch {
        setTeaMenu(DEFAULT_TEA_MENU);
      }
    }
    loadMenu();
  }, [currentUser, isLocalMode]);

  // Recorded stats from both Mudi and Tea today
  const mudiSalesToday = sales.filter(s => (s.date || s.createdAt?.slice(0, 10)) === todayStr && !s.deleted);
  const mudiSalesTotal = mudiSalesToday.reduce((sum, s) => sum + Number(s.totalAmount || s.total || s.payableAmount || 0), 0);
  
  const teaSalesToday = teaOrders.filter(t => (t.date || t.createdAt?.slice(0, 10)) === todayStr && !t.deleted);
  const teaSalesTotal = teaSalesToday.reduce((sum, t) => sum + Number(t.total || 0), 0);

  const totalSystemSalesRecorded = mudiSalesTotal + teaSalesTotal;

  const mudiExpensesToday = expenses.filter(e => (e.date || e.createdAt?.slice(0, 10)) === todayStr && !e.deleted);
  const mudiExpensesTotal = mudiExpensesToday.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const teaExpensesToday = teaExpenses.filter(e => (e.date || e.createdAt?.slice(0, 10)) === todayStr && !e.deleted);
  const teaExpensesTotal = teaExpensesToday.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const totalSystemExpensesRecorded = mudiExpensesTotal + teaExpensesTotal;

  // Denomination notes calculator
  const handleNoteChange = (denom, qty) => {
    const updated = { ...notes, [denom]: qty };
    setNotes(updated);
    const sum = Object.entries(updated).reduce((acc, [d, q]) => acc + (Number(d) * (parseInt(q, 10) || 0)), 0);
    if (sum > 0) setCashInHand(sum.toString());
  };

  // Reconciled cash calculation:
  // Reconciled Sales = Cash In Hand + Digital + Due Given + Expenses - Opening Cash
  const valCash = parseFloat(cashInHand) || 0;
  const valDigital = parseFloat(digitalPaid) || 0;
  const valDue = parseFloat(todayDue) || 0;
  const valExp = parseFloat(todayExpense) || 0;
  const valOpening = parseFloat(openingCash) || 0;

  const totalCalculatedDaySales = Math.max(0, valCash + valDigital + valDue + valExp - valOpening);
  const discrepancy = (valCash > 0 || valDigital > 0) ? (totalCalculatedDaySales - totalSystemSalesRecorded) : 0;

  // 1. Unified Cash Day Close Save
  const handleSaveCashClose = async () => {
    try {
      if (valCash === 0 && valDigital === 0 && valDue === 0) {
        alert("অনুগ্রহ করে নগদ ক্যাশ বা ডিজিটাল টাকার পরিমাণ দিন!");
        return;
      }

      // If discrepancy exists, record missing sales entry
      if (discrepancy > 0) {
        await addSale({
          invoiceNo: `DC-${Date.now().toString().slice(-6)}`,
          date: todayStr,
          customerName: "সারাদিনের অনিবন্ধিত খরিদ্দার (Night Close)",
          items: [{
            productId: "general_close",
            name: "অনিবন্ধিত মোট বিক্রি (মুদি ও চা)",
            price: discrepancy,
            quantity: 1,
            total: discrepancy
          }],
          subTotal: discrepancy,
          totalAmount: discrepancy,
          paidAmount: Math.max(0, discrepancy - valDue),
          dueAmount: valDue,
          paymentMethod: valDigital > 0 ? "Digital/Cash" : "Cash",
          status: valDue > 0 ? "Partial" : "Paid",
          note: "সারাদিনের সার্বিক ক্যাশ হিসাব মিলিয়ে স্বয়ংক্রিয় এন্ট্রি"
        });
      }

      // If unrecorded expenses exist
      if (valExp > 0 && valExp !== totalSystemExpensesRecorded) {
        const extraExpense = Math.max(0, valExp - totalSystemExpensesRecorded);
        if (extraExpense > 0) {
          await addExpense({
            title: expenseTitle || "সারাদিনের দোকান খরচ",
            amount: extraExpense,
            category: "General Expense",
            date: todayStr,
            note: "Day Close থেকে সমন্বিত"
          });
        }
      }

      setStatusMsg("আজকের পুরো দোকানের সার্বিক হিসাব ও ক্যাশ সফলভাবে সংরক্ষিত হয়েছে!");
      setTimeout(() => setStatusMsg(""), 3500);
    } catch (err) {
      alert("সংরক্ষণে সমস্যা হয়েছে: " + err.message);
    }
  };

  // 2. Unified Quick Items Save (Both Tea Stall items & Mudi products)
  const handleSaveQuickItems = async () => {
    try {
      // Collect tea items
      const selectedTeaItems = teaMenu
        .filter(item => (teaCounts[item.id] || 0) > 0)
        .map(item => ({
          id: item.id,
          name: item.name,
          price: Number(item.price || 0),
          qty: teaCounts[item.id],
          subtotal: teaCounts[item.id] * Number(item.price || 0)
        }));

      // Collect mudi products
      const selectedMudiItems = products
        .filter(prod => (mudiCounts[prod.id] || 0) > 0)
        .map(prod => ({
          productId: prod.id,
          name: prod.name,
          price: Number(prod.price || prod.sellingPrice || 0),
          quantity: mudiCounts[prod.id],
          total: mudiCounts[prod.id] * Number(prod.price || prod.sellingPrice || 0)
        }));

      if (selectedTeaItems.length === 0 && selectedMudiItems.length === 0) {
        alert("অনুগ্রহ করে বিক্রিত চা বা মুদি পণ্যের সংখ্যা ইনপুট দিন!");
        return;
      }

      // Save Tea Stall order if any
      if (selectedTeaItems.length > 0) {
        const teaTotal = selectedTeaItems.reduce((acc, it) => acc + it.subtotal, 0);
        await teaApi.addTeaOrder(currentUser.uid, isLocalMode, {
          items: selectedTeaItems,
          total: teaTotal,
          paid: teaTotal,
          due: 0,
          paymentMethod: "নগদ",
          date: todayStr,
          tokenNo: teaOrders.length + 1,
          note: "Day Close থেকে এককালীন চা স্টল এন্ট্রি"
        });
      }

      // Save Mudi Sale if any
      if (selectedMudiItems.length > 0) {
        const mudiTotal = selectedMudiItems.reduce((acc, it) => acc + it.total, 0);
        await addSale({
          invoiceNo: `QS-${Date.now().toString().slice(-6)}`,
          date: todayStr,
          customerName: "কুইক কাউন্টার খরিদ্দার",
          items: selectedMudiItems,
          subTotal: mudiTotal,
          totalAmount: mudiTotal,
          paidAmount: mudiTotal,
          dueAmount: 0,
          paymentMethod: "Cash",
          status: "Paid",
          note: "Day Close থেকে কুইক মুদি পণ্য এন্ট্রি"
        });

        // Update product stock
        for (const it of selectedMudiItems) {
          const orig = products.find(p => p.id === it.productId);
          if (orig) {
            const curr = Number(orig.stock || orig.quantity || 0);
            await updateProduct(orig.id, { ...orig, stock: Math.max(0, curr - it.quantity) });
          }
        }
      }

      setTeaCounts({});
      setMudiCounts({});
      setStatusMsg("চা ও মুদি পণ্যের এককালীন বিক্রি ও স্টক সফলভাবে সংরক্ষিত হয়েছে!");
      setTimeout(() => setStatusMsg(""), 3500);
    } catch (err) {
      alert("সংরক্ষণে ব্যর্থ: " + err.message);
    }
  };

  // 3. Save Reverse Inventory
  const handleSaveInventory = async () => {
    try {
      const adjustedItems = [];
      let calculatedSalesFromStock = 0;

      for (const prod of products) {
        const remaining = inventoryRemains[prod.id];
        if (remaining !== undefined && remaining !== "") {
          const remVal = parseFloat(remaining) || 0;
          const currentStock = parseFloat(prod.stock || prod.quantity || 0);
          const soldQty = Math.max(0, currentStock - remVal);

          if (soldQty > 0) {
            adjustedItems.push({
              productId: prod.id,
              name: prod.name,
              price: Number(prod.price || prod.sellingPrice || 0),
              quantity: soldQty,
              total: soldQty * Number(prod.price || prod.sellingPrice || 0)
            });
            calculatedSalesFromStock += soldQty * Number(prod.price || prod.sellingPrice || 0);
            await updateProduct(prod.id, { ...prod, stock: remVal, quantity: remVal });
          }
        }
      }

      if (adjustedItems.length > 0) {
        await addSale({
          invoiceNo: `STK-${Date.now().toString().slice(-6)}`,
          date: todayStr,
          customerName: "স্টক ব্যালেন্সিং খরিদ্দার",
          items: adjustedItems,
          subTotal: calculatedSalesFromStock,
          totalAmount: calculatedSalesFromStock,
          paidAmount: calculatedSalesFromStock,
          dueAmount: 0,
          paymentMethod: "Cash",
          status: "Paid",
          note: "রাতের অবশিষ্ট স্টক মিলিয়ে স্বয়ংক্রিয় বিক্রয় রেকর্ড"
        });
        setStatusMsg(`${adjustedItems.length} টি পণ্যের অবশিষ্ট স্টক অনুযায়ী বিক্রি আপডেট হয়েছে!`);
      } else {
        alert("কোনো পণ্যের অবশিষ্ট স্টক পরিবর্তন করা হয়নি!");
      }
      setTimeout(() => setStatusMsg(""), 3500);
    } catch (err) {
      alert("স্টক আপডেটে সমস্যা: " + err.message);
    }
  };

  return (
    <div className="container-fluid py-3" style={{ maxWidth: "680px" }}>
      {/* Header */}
      <div className="card shadow-sm border-0 mb-3">
        <div className="card-body p-3">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h5 className="mb-0 fw-bold text-success">
                <i className="bi bi-moon-stars-fill me-2 text-warning"></i>
                সারাদিনের হিসাব ও স্টক ক্লোজিং (Unified Day Close)
              </h5>
              <small className="text-muted">চা স্টল + মুদি দোকান সহ পুরো ব্যবসার রাতের ১টি সমন্বিত হিসাব</small>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="d-flex border-top bg-light">
          <button
            className={`btn flex-grow-1 rounded-0 py-2 fw-semibold ${activeTab === "cash" ? "btn-white text-success border-bottom border-success border-3 bg-white" : "text-muted"}`}
            onClick={() => setActiveTab("cash")}
          >
            <i className="bi bi-cash-stack me-1"></i> ১. ক্যাশ ও টাকা মেলান
          </button>
          <button
            className={`btn flex-grow-1 rounded-0 py-2 fw-semibold ${activeTab === "quick-items" ? "btn-white text-success border-bottom border-success border-3 bg-white" : "text-muted"}`}
            onClick={() => setActiveTab("quick-items")}
          >
            <i className="bi bi-cup-hot-fill me-1"></i> ২. চা ও মুদি বিক্রি এন্ট্রি
          </button>
          <button
            className={`btn flex-grow-1 rounded-0 py-2 fw-semibold ${activeTab === "inventory" ? "btn-white text-success border-bottom border-success border-3 bg-white" : "text-muted"}`}
            onClick={() => setActiveTab("inventory")}
          >
            <i className="bi bi-boxes me-1"></i> ৩. অবশিষ্ট স্টক দেখে হিসাব
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="alert alert-success d-flex align-items-center py-2 px-3 shadow-sm mb-3">
          <i className="bi bi-check-circle-fill me-2 fs-5"></i>
          <div>{statusMsg}</div>
        </div>
      )}

      {/* Tab 1: Cash Reconciliation */}
      {activeTab === "cash" && (
        <div className="card shadow-sm border-0 p-3 mb-4">
          <div className="row g-2 mb-3">
            <div className="col-6">
              <div className="bg-light p-2 rounded text-center">
                <small className="text-muted d-block">রেকর্ডকৃত বিক্রি (মুদি+চা)</small>
                <span className="fw-bold text-dark fs-6">{formatCurrency(totalSystemSalesRecorded)}</span>
                <div className="text-muted" style={{ fontSize: "10px" }}>
                  মুদি: {formatCurrency(mudiSalesTotal)} • চা: {formatCurrency(teaSalesTotal)}
                </div>
              </div>
            </div>
            <div className="col-6">
              <div className="bg-light p-2 rounded text-center">
                <small className="text-muted d-block">রেকর্ডকৃত মোট খরচ</small>
                <span className="fw-bold text-danger fs-6">{formatCurrency(totalSystemExpensesRecorded)}</span>
                <div className="text-muted" style={{ fontSize: "10px" }}>
                  মুদি: {formatCurrency(mudiExpensesTotal)} • চা: {formatCurrency(teaExpensesTotal)}
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-1">
            <label className="form-label fw-bold small mb-0">১. রাতে ক্যাশ ড্রয়ারে নগদ কত টাকা আছে?</label>
            <button
              type="button"
              className="btn btn-outline-success btn-sm py-0 px-2"
              style={{ fontSize: "12px" }}
              onClick={() => setShowDenom(!showDenom)}
            >
              {showDenom ? "নোট গোনা বন্ধ করুন" : "নোট ক্যালকুলেটর"}
            </button>
          </div>

          {showDenom && (
            <div className="bg-light border rounded p-2 mb-3">
              <div className="row g-1 text-center small">
                {[1000, 500, 200, 100, 50, 20, 10].map(d => (
                  <div key={d} className="col-3 col-sm">
                    <span className="text-muted" style={{ fontSize: "11px" }}>৳{d}</span>
                    <input
                      type="number"
                      placeholder="কয়টি"
                      className="form-control form-control-sm text-center py-0"
                      value={notes[d]}
                      onChange={(e) => handleNoteChange(d, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="input-group mb-3">
            <span className="input-group-text bg-white">৳ নগদ ড্রয়ার ক্যাশ</span>
            <input
              type="number"
              className="form-control fs-5 fw-bold text-success"
              placeholder="0.00"
              value={cashInHand}
              onChange={(e) => setCashInHand(e.target.value)}
            />
          </div>

          <div className="row g-2 mb-3">
            <div className="col-sm-6">
              <label className="form-label small mb-1">২. বিকাশ / নগদ / অনলাইন কালেকশন:</label>
              <input
                type="number"
                className="form-control form-control-sm"
                placeholder="৳ ডিজিটাল টাকা"
                value={digitalPaid}
                onChange={(e) => setDigitalPaid(e.target.value)}
              />
            </div>
            <div className="col-sm-6">
              <label className="form-label small mb-1">৩. আজ মোট বাকি দেওয়া হয়েছে:</label>
              <input
                type="number"
                className="form-control form-control-sm"
                placeholder="৳ বাকি বিক্রি"
                value={todayDue}
                onChange={(e) => setTodayDue(e.target.value)}
              />
            </div>
          </div>

          <div className="row g-2 mb-3">
            <div className="col-sm-6">
              <label className="form-label small mb-1">৪. সারাদিনের মোট দোকান খরচ:</label>
              <input
                type="number"
                className="form-control form-control-sm"
                placeholder="৳ নাস্তা/দুধ/ভ্যানভাড়া"
                value={todayExpense}
                onChange={(e) => setTodayExpense(e.target.value)}
              />
            </div>
            <div className="col-sm-6">
              <label className="form-label small mb-1">৫. সকালের শুরুর ক্যাশ (Float):</label>
              <input
                type="number"
                className="form-control form-control-sm"
                placeholder="৳ প্রারম্ভিক ক্যাশ"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
              />
            </div>
          </div>

          {/* Reconcile Summary */}
          <div className="card bg-light border-0 p-3 mb-3">
            <div className="d-flex justify-content-between mb-1">
              <span className="text-muted small">হাতে নগদ + ডিজিটাল + বাকি + খরচ = মোট বিক্রি:</span>
              <span className="fw-bold text-primary">{formatCurrency(totalCalculatedDaySales)}</span>
            </div>

            {totalCalculatedDaySales > 0 && (
              <div className="d-flex justify-content-between border-top pt-2 mt-1">
                <span className="small fw-semibold">
                  {discrepancy > 0 ? "অনিবন্ধিত বিক্রি (যুক্ত হবে):" : discrepancy < 0 ? "পার্থক্য (ঘাটতি):" : "হিসাব সম্পূর্ণ মিলেছে:"}
                </span>
                <span className={`fw-bold ${discrepancy > 0 ? "text-success" : discrepancy < 0 ? "text-danger" : "text-muted"}`}>
                  {discrepancy > 0 ? `+${formatCurrency(discrepancy)}` : formatCurrency(discrepancy)}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="btn btn-success w-100 py-2 fw-semibold"
            onClick={handleSaveCashClose}
          >
            <i className="bi bi-check2-circle me-1"></i> সারাদিনের ক্যাশ ও হিসাব ক্লোজ করুন
          </button>
        </div>
      )}

      {/* Tab 2: Combined Quick Items (Tea + Mudi) */}
      {activeTab === "quick-items" && (
        <div className="card shadow-sm border-0 p-3 mb-4">
          {/* Tea Stall Items */}
          <div className="mb-4">
            <h6 className="fw-bold text-success border-bottom pb-1 mb-2 d-flex align-items-center">
              <i className="bi bi-cup-hot-fill me-2 text-danger"></i> চা স্টল আইটেম (আজ কয় কাপ বিক্রি হয়েছে?)
            </h6>
            <div className="list-group mb-2" style={{ maxHeight: "220px", overflowY: "auto" }}>
              {teaMenu.map(item => {
                const qty = teaCounts[item.id] || "";
                return (
                  <div key={item.id} className="list-group-item d-flex align-items-center justify-content-between p-2">
                    <div className="me-2 text-truncate">
                      <span className="fw-semibold d-block text-truncate">{item.name}</span>
                      <small className="text-muted">{formatCurrency(item.price)} / {item.unit || "কাপ"}</small>
                    </div>
                    <div className="d-flex align-items-center gap-1">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary px-2 py-0"
                        onClick={() => {
                          const cur = parseInt(qty, 10) || 0;
                          setTeaCounts({ ...teaCounts, [item.id]: Math.max(0, cur - 1) });
                        }}
                      >-</button>
                      <input
                        type="number"
                        min="0"
                        className="form-control form-control-sm text-center px-1"
                        style={{ width: "65px" }}
                        placeholder="0"
                        value={qty}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                          setTeaCounts({ ...teaCounts, [item.id]: val });
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary px-2 py-0"
                        onClick={() => {
                          const cur = parseInt(qty, 10) || 0;
                          setTeaCounts({ ...teaCounts, [item.id]: cur + 1 });
                        }}
                      >+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mudi Store Items */}
          <div className="mb-3">
            <h6 className="fw-bold text-primary border-bottom pb-1 mb-2 d-flex align-items-center">
              <i className="bi bi-shop me-2 text-primary"></i> মুদি দোকানের পণ্য বিক্রি
            </h6>
            <div className="list-group mb-2" style={{ maxHeight: "220px", overflowY: "auto" }}>
              {products.map(p => {
                const qty = mudiCounts[p.id] || "";
                return (
                  <div key={p.id} className="list-group-item d-flex align-items-center justify-content-between p-2">
                    <div className="me-2 text-truncate">
                      <span className="fw-semibold d-block text-truncate">{p.name}</span>
                      <small className="text-muted">{formatCurrency(p.price || p.sellingPrice || 0)}</small>
                    </div>
                    <div className="d-flex align-items-center gap-1">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary px-2 py-0"
                        onClick={() => {
                          const cur = parseInt(qty, 10) || 0;
                          setMudiCounts({ ...mudiCounts, [p.id]: Math.max(0, cur - 1) });
                        }}
                      >-</button>
                      <input
                        type="number"
                        min="0"
                        className="form-control form-control-sm text-center px-1"
                        style={{ width: "65px" }}
                        placeholder="0"
                        value={qty}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                          setMudiCounts({ ...mudiCounts, [p.id]: val });
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary px-2 py-0"
                        onClick={() => {
                          const cur = parseInt(qty, 10) || 0;
                          setMudiCounts({ ...mudiCounts, [p.id]: cur + 1 });
                        }}
                      >+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-success w-100 py-2 fw-semibold"
            onClick={handleSaveQuickItems}
          >
            <i className="bi bi-cart-check me-1"></i> এক ক্লিকে চা ও মুদি বিক্রি সেভ করুন
          </button>
        </div>
      )}

      {/* Tab 3: Reverse Inventory Calculation */}
      {activeTab === "inventory" && (
        <div className="card shadow-sm border-0 p-3 mb-4">
          <p className="text-muted small mb-2">
            দোকান বন্ধের সময় গুদাম বা তাকে কয়টি পণ্য অবশিষ্ট আছে লিখে দিন। সিস্টেম স্বয়ংক্রিয়ভাবে বিক্রির পরিমাণ ও টাকা হিসাব করবে:
          </p>

          <div className="list-group mb-3" style={{ maxHeight: "350px", overflowY: "auto" }}>
            {products.map(p => {
              const currentStock = Number(p.stock || p.quantity || 0);
              const remaining = inventoryRemains[p.id] !== undefined ? inventoryRemains[p.id] : "";
              const remNum = parseFloat(remaining);
              const sold = (!isNaN(remNum) && remNum <= currentStock) ? (currentStock - remNum) : 0;

              return (
                <div key={p.id} className="list-group-item d-flex align-items-center justify-content-between p-2">
                  <div className="text-truncate me-2" style={{ maxWidth: "220px" }}>
                    <div className="fw-semibold text-truncate">{p.name}</div>
                    <small className="text-muted">
                      বর্তমান স্টক: <span className="fw-bold">{currentStock}</span> | মূল্য: {formatCurrency(p.price || p.sellingPrice || 0)}
                    </small>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      className="form-control form-control-sm text-center px-1"
                      style={{ width: "80px" }}
                      placeholder="অবশিষ্ট"
                      value={remaining}
                      onChange={(e) => setInventoryRemains({ ...inventoryRemains, [p.id]: e.target.value })}
                    />
                    {sold > 0 && (
                      <span className="badge bg-success-subtle text-success small text-nowrap">
                        বিক্রি: {sold}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="btn btn-primary w-100 py-2 fw-semibold"
            onClick={handleSaveInventory}
          >
            <i className="bi bi-box-arrow-down me-1"></i> অবশিষ্ট স্টক অনুযায়ী বিক্রি ও স্টক সেভ করুন
          </button>
        </div>
      )}
    </div>
  );
}
