import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useModal } from "../context/ModalContext";
import { formatCurrency, formatDate } from "../utils/formatters";
import dayjs from "dayjs";

export default function CapitalAssets() {
  const { currentUser } = useAuth();
  const { products, customers = [], suppliers = [], sales = [], purchases = [], expenses = [], loading: dataLoading } = useData();
  const { showAlert, showConfirm } = useModal();

  const [activeTab, setActiveTab] = useState("capital"); // 'capital', 'assets', 'balancesheet'
  const [capitals, setCapitals] = useState([]);
  const [assets, setAssets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Capital Form State
  const [capType, setCapType] = useState("deposit"); // 'deposit' (বিনিয়োগ) or 'withdraw' (উত্তোলন)
  const [capAmount, setCapAmount] = useState("");
  const [capSource, setCapSource] = useState("ক্যাশ");
  const [capNote, setCapNote] = useState("");
  const [capDate, setCapDate] = useState(dayjs().format("YYYY-MM-DD"));

  // Asset Form State
  const [assetName, setAssetName] = useState("");
  const [assetCost, setAssetCost] = useState("");
  const [assetCategory, setAssetCategory] = useState("আসবাবপত্র");
  const [assetDate, setAssetDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [assetNote, setAssetNote] = useState("");

  const uid = currentUser?.uid || "guest";
  const capitalStorageKey = `mhr_capital_${uid}`;
  const assetStorageKey = `mhr_assets_${uid}`;

  // Load local data
  useEffect(() => {
    try {
      const savedCaps = JSON.parse(localStorage.getItem(capitalStorageKey) || "[]");
      const savedAssets = JSON.parse(localStorage.getItem(assetStorageKey) || "[]");
      setCapitals(savedCaps);
      setAssets(savedAssets);
    } catch (e) {
      console.error(e);
    }
  }, [uid]);

  const saveCapitalsToStorage = (updated) => {
    setCapitals(updated);
    localStorage.setItem(capitalStorageKey, JSON.stringify(updated));
  };

  const saveAssetsToStorage = (updated) => {
    setAssets(updated);
    localStorage.setItem(assetStorageKey, JSON.stringify(updated));
  };

  // Calculations
  const totalInvested = capitals
    .filter(c => c.type === "deposit")
    .reduce((sum, c) => sum + Number(c.amount || 0), 0);

  const totalWithdrawn = capitals
    .filter(c => c.type === "withdraw")
    .reduce((sum, c) => sum + Number(c.amount || 0), 0);

  const netCapital = totalInvested - totalWithdrawn;

  const totalAssetsValue = assets.reduce((sum, a) => sum + Number(a.cost || 0), 0);

  // Inventory value from products
  const totalStockValue = (products || []).reduce((sum, p) => {
    const stock = Number(p.stock || p.stockQuantity || 0);
    const buyPrice = Number(p.buyingPrice || p.purchasePrice || p.costPrice || 0);
    return sum + (stock * buyPrice);
  }, 0);

  // Phase 3: Balance Sheet calculations
  const totalCustomerReceivables = (customers || []).reduce((sum, c) => sum + Math.max(0, Number(c.balance || c.due || 0)), 0);
  const totalSupplierPayables = (suppliers || []).reduce((sum, s) => sum + Math.max(0, Number(s.balance || s.due || 0)), 0);

  // Total Business Assets & Liabilities
  const totalBusinessAssets = totalStockValue + totalAssetsValue + totalCustomerReceivables;
  const netBusinessEquity = totalBusinessAssets - totalSupplierPayables;

  // Form Handlers
  const handleAddNew = () => {
    setEditingId(null);
    if (activeTab === "capital") {
      setCapType("deposit");
      setCapAmount("");
      setCapSource("ক্যাশ");
      setCapNote("");
      setCapDate(dayjs().format("YYYY-MM-DD"));
    } else {
      setAssetName("");
      setAssetCost("");
      setAssetCategory("আসবাবপত্র");
      setAssetDate(dayjs().format("YYYY-MM-DD"));
      setAssetNote("");
    }
    setShowForm(true);
  };

  const handleEditCapital = (item) => {
    setEditingId(item.id);
    setCapType(item.type || "deposit");
    setCapAmount(item.amount || "");
    setCapSource(item.source || "ক্যাশ");
    setCapNote(item.note || "");
    setCapDate(item.date || dayjs().format("YYYY-MM-DD"));
    setShowForm(true);
  };

  const handleEditAsset = (item) => {
    setEditingId(item.id);
    setAssetName(item.name || "");
    setAssetCost(item.cost || "");
    setAssetCategory(item.category || "আসবাবপত্র");
    setAssetDate(item.date || dayjs().format("YYYY-MM-DD"));
    setAssetNote(item.note || "");
    setShowForm(true);
  };

  const handleSaveCapital = (e) => {
    e.preventDefault();
    if (!capAmount || Number(capAmount) <= 0) {
      showAlert("ভুল ইনপুট", "সঠিক টাকার পরিমাণ দিন।", "warning");
      return;
    }

    if (editingId) {
      const updated = capitals.map(c => 
        c.id === editingId 
          ? { ...c, type: capType, amount: Number(capAmount), source: capSource, note: capNote, date: capDate }
          : c
      );
      saveCapitalsToStorage(updated);
      showAlert("সফল", "মূলধন তথ্য আপডেট হয়েছে!", "success");
    } else {
      const newItem = {
        id: Date.now().toString(),
        type: capType,
        amount: Number(capAmount),
        source: capSource,
        note: capNote,
        date: capDate,
        createdAt: new Date().toISOString()
      };
      saveCapitalsToStorage([newItem, ...capitals]);
      showAlert("সফল", "নতুন মূলধন রেকর্ড যোগ হয়েছে!", "success");
    }
    setShowForm(false);
  };

  const handleSaveAsset = (e) => {
    e.preventDefault();
    if (!assetName.trim()) {
      showAlert("ভুল ইনপুট", "সম্পদের নাম দিন।", "warning");
      return;
    }
    if (!assetCost || Number(assetCost) <= 0) {
      showAlert("ভুল ইনপুট", "সঠিক মূল্য দিন।", "warning");
      return;
    }

    if (editingId) {
      const updated = assets.map(a => 
        a.id === editingId 
          ? { ...a, name: assetName, cost: Number(assetCost), category: assetCategory, note: assetNote, date: assetDate }
          : a
      );
      saveAssetsToStorage(updated);
      showAlert("সফল", "সম্পদের তথ্য আপডেট হয়েছে!", "success");
    } else {
      const newItem = {
        id: Date.now().toString(),
        name: assetName,
        cost: Number(assetCost),
        category: assetCategory,
        note: assetNote,
        date: assetDate,
        createdAt: new Date().toISOString()
      };
      saveAssetsToStorage([newItem, ...assets]);
      showAlert("সফল", "নতুন সম্পদ যোগ হয়েছে!", "success");
    }
    setShowForm(false);
  };

  const handleDeleteCapital = async (id) => {
    const ok = await showConfirm("মুছে ফেলা নিশ্চিত করুন", "আপনি কি এই মূলধন এন্ট্রি মুছে ফেলতে চান?");
    if (ok) {
      const updated = capitals.filter(c => c.id !== id);
      saveCapitalsToStorage(updated);
      showAlert("মুছে ফেলা হয়েছে", "এন্ট্রি মুছে ফেলা হয়েছে।", "info");
    }
  };

  const handleDeleteAsset = async (id) => {
    const ok = await showConfirm("মুছে ফেলা নিশ্চিত করুন", "আপনি কি এই সম্পদ মুছে ফেলতে চান?");
    if (ok) {
      const updated = assets.filter(a => a.id !== id);
      saveAssetsToStorage(updated);
      showAlert("মুছে ফেলা হয়েছে", "সম্পদ মুছে ফেলা হয়েছে।", "info");
    }
  };

  return (
    <div className="container py-3">
      {/* Header & Overview */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 className="fw-bold mb-0 text-success">
            <i className="bi bi-bank2 me-2"></i>মূলধন ও সম্পদ হিসাব
          </h4>
          <small className="text-muted">দোকানের শুরু ও চলতি মূলধন এবং আসবাবপত্রের হিসাব</small>
        </div>
        {!showForm && (
          <button className="btn btn-success btn-sm d-flex align-items-center gap-1" onClick={handleAddNew}>
            <i className="bi bi-plus-lg"></i>
            <span>{activeTab === "capital" ? "মূলধন যোগ" : "সম্পদ যোগ"}</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="row g-2 mb-3">
        <div className="col-4">
          <div className="card border-0 shadow-sm bg-primary text-white p-2 text-center rounded-3">
            <small className="text-light">মোট বর্তমান মূলধন</small>
            <h6 className="fw-bold mb-0">{formatCurrency(netCapital)}</h6>
          </div>
        </div>
        <div className="col-4">
          <div className="card border-0 shadow-sm bg-info text-white p-2 text-center rounded-3">
            <small className="text-light">স্থায়ী সম্পদ/আসবাবপত্র</small>
            <h6 className="fw-bold mb-0">{formatCurrency(totalAssetsValue)}</h6>
          </div>
        </div>
        <div className="col-4">
          <div className="card border-0 shadow-sm bg-success text-white p-2 text-center rounded-3">
            <small className="text-light">বর্তমান মালামাল/স্টক</small>
            <h6 className="fw-bold mb-0">{formatCurrency(totalStockValue)}</h6>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-pills mb-3 border-bottom pb-2">
        <li className="nav-item">
          <button 
            className={`nav-link py-1 px-3 me-2 ${activeTab === "capital" ? "active bg-success text-white" : "text-dark"}`}
            onClick={() => { setActiveTab("capital"); setShowForm(false); }}
          >
            <i className="bi bi-cash-stack me-1"></i> মূলধন লেজার
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link py-1 px-3 me-2 ${activeTab === "assets" ? "active bg-success text-white" : "text-dark"}`}
            onClick={() => { setActiveTab("assets"); setShowForm(false); }}
          >
            <i className="bi bi-lamp me-1"></i> আসবাবপত্র ও সরঞ্জাম
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link py-1 px-3 ${activeTab === "balancesheet" ? "active bg-success text-white" : "text-dark"}`}
            onClick={() => { setActiveTab("balancesheet"); setShowForm(false); }}
          >
            <i className="bi bi-journal-bookmark me-1"></i> ব্যালেন্স শিট (সম্পদ ও দায়)
          </button>
        </li>
      </ul>

      {/* Form Modal / Inline */}
      {showForm && (
        <div className="card shadow-sm border-0 mb-3 p-3 bg-light">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="fw-bold m-0">
              {editingId ? "সম্পাদনা করুন" : activeTab === "capital" ? "নতুন মূলধন ইনপুট" : "নতুন সম্পদ ইনপুট"}
            </h6>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowForm(false)}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {activeTab === "capital" ? (
            <form onSubmit={handleSaveCapital}>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label small mb-1">ধরণ</label>
                  <select 
                    className="form-select form-select-sm" 
                    value={capType} 
                    onChange={e => setCapType(e.target.value)}
                  >
                    <option value="deposit">মূলধন বিনিয়োগ (+)</option>
                    <option value="withdraw">মালিকের উত্তোলন (-)</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label small mb-1">তারিখ</label>
                  <input 
                    type="date" 
                    className="form-control form-control-sm" 
                    value={capDate} 
                    onChange={e => setCapDate(e.target.value)} 
                    required 
                  />
                </div>
                <div className="col-6">
                  <label className="form-label small mb-1">টাকার পরিমাণ (৳)</label>
                  <input 
                    type="number" 
                    className="form-control form-control-sm" 
                    placeholder="যেমন: 50000" 
                    value={capAmount} 
                    onChange={e => setCapAmount(e.target.value)} 
                    required 
                  />
                </div>
                <div className="col-6">
                  <label className="form-label small mb-1">মাধ্যম</label>
                  <select 
                    className="form-select form-select-sm" 
                    value={capSource} 
                    onChange={e => setCapSource(e.target.value)}
                  >
                    <option value="ক্যাশ">নগদ ক্যাশ</option>
                    <option value="ব্যাংক">ব্যাংক অ্যাকাউন্ট</option>
                    <option value="বিকাশ/নগদ">বিকাশ / নগদ</option>
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label small mb-1">বিবরণ / নোট</label>
                  <input 
                    type="text" 
                    className="form-control form-control-sm" 
                    placeholder="যেমন: দোকান শুরুর প্রাথমিক পুঁজি বা ব্যাংক লোন" 
                    value={capNote} 
                    onChange={e => setCapNote(e.target.value)} 
                  />
                </div>
              </div>
              <div className="mt-3 d-flex gap-2 justify-content-end">
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowForm(false)}>বাতিল</button>
                <button type="submit" className="btn btn-sm btn-success">সংরক্ষণ করুন</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSaveAsset}>
              <div className="row g-2">
                <div className="col-12 col-md-6">
                  <label className="form-label small mb-1">সম্পদ / মালামালের নাম</label>
                  <input 
                    type="text" 
                    className="form-control form-control-sm" 
                    placeholder="যেমন: ক্যাশ কাউন্টার, ফ্রিজ, ফ্যান, ডিসপ্লে র্যাক" 
                    value={assetName} 
                    onChange={e => setAssetName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label small mb-1">ক্যাটাগরি</label>
                  <select 
                    className="form-select form-select-sm" 
                    value={assetCategory} 
                    onChange={e => setAssetCategory(e.target.value)}
                  >
                    <option value="আসবাবপত্র">আসবাবপত্র (Furniture)</option>
                    <option value="ইলেকট্রনিক্স">ইলেকট্রনিক্স / মেশিন</option>
                    <option value="ডেকোরেশন">দোকান ডেকোরেশন</option>
                    <option value="অন্যান্য">অন্যান্য স্থায়ী সম্পদ</option>
                  </select>
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label small mb-1">ক্রয়মূল্য (৳)</label>
                  <input 
                    type="number" 
                    className="form-control form-control-sm" 
                    placeholder="যেমন: 15000" 
                    value={assetCost} 
                    onChange={e => setAssetCost(e.target.value)} 
                    required 
                  />
                </div>
                <div className="col-6">
                  <label className="form-label small mb-1">কেনার তারিখ</label>
                  <input 
                    type="date" 
                    className="form-control form-control-sm" 
                    value={assetDate} 
                    onChange={e => setAssetDate(e.target.value)} 
                    required 
                  />
                </div>
                <div className="col-6">
                  <label className="form-label small mb-1">নোট / কন্ডিশন</label>
                  <input 
                    type="text" 
                    className="form-control form-control-sm" 
                    placeholder="যেমন: নতুন কেনা / সেকেন্ড হ্যান্ড" 
                    value={assetNote} 
                    onChange={e => setAssetNote(e.target.value)} 
                  />
                </div>
              </div>
              <div className="mt-3 d-flex gap-2 justify-content-end">
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowForm(false)}>বাতিল</button>
                <button type="submit" className="btn btn-sm btn-success">সংরক্ষণ করুন</button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* List Display */}
      {activeTab === "capital" ? (
        <div className="card shadow-sm border-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr className="small">
                  <th>তারিখ</th>
                  <th>ধরণ</th>
                  <th>মাধ্যম</th>
                  <th>বিবরণ</th>
                  <th className="text-end">পরিমাণ</th>
                  <th className="text-center" style={{ width: "80px" }}>অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {capitals.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted small">
                      কোনো মূলধনের হিসাব এখনো যুক্ত করা হয়নি।
                    </td>
                  </tr>
                ) : (
                  capitals.map((c) => (
                    <tr key={c.id}>
                      <td className="small">{formatDate(c.date)}</td>
                      <td>
                        <span className={`badge ${c.type === "deposit" ? "bg-success" : "bg-danger"}`}>
                          {c.type === "deposit" ? "বিনিয়োগ (+)" : "উত্তোলন (-)"}
                        </span>
                      </td>
                      <td className="small">{c.source}</td>
                      <td className="small text-muted">{c.note || "-"}</td>
                      <td className={`text-end fw-bold ${c.type === "deposit" ? "text-success" : "text-danger"}`}>
                        {c.type === "deposit" ? "+" : "-"} {formatCurrency(c.amount)}
                      </td>
                      <td className="text-center">
                        <button className="btn btn-sm btn-link text-primary p-0 me-2" onClick={() => handleEditCapital(c)}>
                          <i className="bi bi-pencil-square"></i>
                        </button>
                        <button className="btn btn-sm btn-link text-danger p-0" onClick={() => handleDeleteCapital(c.id)}>
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === "assets" ? (
        <div className="card shadow-sm border-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr className="small">
                  <th>কেনার তারিখ</th>
                  <th>সম্পদের নাম</th>
                  <th>ক্যাটাগরি</th>
                  <th>নোট</th>
                  <th className="text-end">মূল্য</th>
                  <th className="text-center" style={{ width: "80px" }}>অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {assets.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted small">
                      কোনো আসবাবপত্র বা সরঞ্জাম এখনো যুক্ত করা হয়নি।
                    </td>
                  </tr>
                ) : (
                  assets.map((a) => (
                    <tr key={a.id}>
                      <td className="small">{formatDate(a.date)}</td>
                      <td className="fw-semibold small">{a.name}</td>
                      <td><span className="badge bg-secondary">{a.category}</span></td>
                      <td className="small text-muted">{a.note || "-"}</td>
                      <td className="text-end fw-bold text-dark">{formatCurrency(a.cost)}</td>
                      <td className="text-center">
                        <button className="btn btn-sm btn-link text-primary p-0 me-2" onClick={() => handleEditAsset(a)}>
                          <i className="bi bi-pencil-square"></i>
                        </button>
                        <button className="btn btn-sm btn-link text-danger p-0" onClick={() => handleDeleteAsset(a.id)}>
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Phase 3: Balance Sheet Tab */
        <div className="card shadow-sm border-0 p-3">
          <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
            <h6 className="fw-bold m-0 text-dark">
              <i className="bi bi-scale me-2 text-primary"></i>ব্যালেন্স শিট ও আর্থিক স্বাস্থ্য (Balance Sheet)
            </h6>
            <span className="badge bg-light text-dark border">রিয়েল-টাইম হিসাব</span>
          </div>

          <div className="row g-3">
            {/* Assets Column */}
            <div className="col-md-6">
              <div className="card border-0 bg-light p-3 h-100">
                <h6 className="fw-bold text-success border-bottom pb-2 mb-2">
                  <i className="bi bi-plus-circle me-1"></i> মোট সম্পদ (Total Assets)
                </h6>
                <div className="d-flex justify-content-between py-1 border-bottom border-white">
                  <span className="small text-muted">১. দোকানে থাকা মালামাল (স্টক):</span>
                  <span className="fw-semibold">{formatCurrency(totalStockValue)}</span>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom border-white">
                  <span className="small text-muted">২. স্থায়ী সম্পদ ও আসবাবপত্র:</span>
                  <span className="fw-semibold">{formatCurrency(totalAssetsValue)}</span>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom border-white">
                  <span className="small text-muted">৩. কাস্টমারদের কাছে বাকি (পাওনা):</span>
                  <span className="fw-semibold">{formatCurrency(totalCustomerReceivables)}</span>
                </div>
                <div className="d-flex justify-content-between pt-3 mt-auto">
                  <span className="fw-bold text-dark">মোট সম্পদ:</span>
                  <span className="fw-bold text-success fs-6">{formatCurrency(totalBusinessAssets)}</span>
                </div>
              </div>
            </div>

            {/* Liabilities & Equity Column */}
            <div className="col-md-6">
              <div className="card border-0 bg-light p-3 h-100">
                <h6 className="fw-bold text-danger border-bottom pb-2 mb-2">
                  <i className="bi bi-dash-circle me-1"></i> মোট দেনা ও মূলধন (Liabilities & Equity)
                </h6>
                <div className="d-flex justify-content-between py-1 border-bottom border-white">
                  <span className="small text-muted">১. মহাজন/সাপ্লায়ার দেনা (Payables):</span>
                  <span className="fw-semibold text-danger">(-) {formatCurrency(totalSupplierPayables)}</span>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom border-white">
                  <span className="small text-muted">২. প্রারম্ভিক/রেকর্ডকৃত মূলধন:</span>
                  <span className="fw-semibold">{formatCurrency(netCapital)}</span>
                </div>
                <div className="d-flex justify-content-between pt-3 mt-auto">
                  <span className="fw-bold text-dark">প্রকৃত দোকানের নেট মূল্য (Net Worth):</span>
                  <span className="fw-bold text-primary fs-6">{formatCurrency(netBusinessEquity)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
