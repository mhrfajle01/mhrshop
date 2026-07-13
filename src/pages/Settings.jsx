import React, { useState, useEffect } from "react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "../context/RouterContext";
import { formatCurrency, formatDate } from "../utils/formatters";
import dayjs from "dayjs";

export default function Settings() {
  const { 
    settings, 
    updateShopInfo, 
    backupData, 
    restoreData, 
    loading,
    sales = [],
    purchases = [],
    expenses = [],
    products = [],
    customers = [],
    suppliers = [],
    khata = [],
    addNewCustomer,
    addNewSupplier,
    addNewKhataEntry,
    triggerFactoryReset
  } = useData();
  const { isLocalMode } = useAuth();
  const { navigateTo } = useRouter();

  // Active Tab state: 'shop' | 'manual-profile' | 'hisab-guide' | 'backup-reset'
  const [activeSettingsTab, setActiveSettingsTab] = useState("shop");

  // Shop Info Form state
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [currency, setCurrency] = useState("৳");
  const [taxPercent, setTaxPercent] = useState("0");
  const [footerNote, setFooterNote] = useState("");

  // Manual Profile Creation Form State
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [manualRole, setManualRole] = useState("customer"); // 'customer' | 'supplier'
  const [manualOpeningBalance, setManualOpeningBalance] = useState("0");

  // Factory Reset Form state
  const [resetChecked, setResetChecked] = useState(false);
  const [resetVerification, setResetVerification] = useState("");

  // Custom Modal State: null | { type: 'alert'|'confirm'|'danger'|'success'|'info', title, message, onConfirm, onCancel }
  const [modalConfig, setModalConfig] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Sync settings on load
  useEffect(() => {
    if (settings) {
      setShopName(settings.shopName || "আমার দোকান");
      setOwnerName(settings.ownerName || "মালিক");
      setPhone(settings.phone || "017XXXXXXXX");
      setAddress(settings.address || "বাংলাদেশ");
      setCurrency(settings.currency || "৳");
      setTaxPercent((settings.taxPercent || 0).toString());
      setFooterNote(settings.footerNote || "আবার আসবেন, ধন্যবাদ!");
    }
  }, [settings]);

  // Handle saving shop profile
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!shopName.trim()) {
      setError("দোকানের নাম খালি রাখা যাবে না।");
      return;
    }

    const newSettings = {
      shopName: shopName.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      currency,
      taxPercent: Number(taxPercent || 0),
      footerNote: footerNote.trim()
    };

    try {
      await updateShopInfo(newSettings);
      setSuccess("দোকানের প্রোফাইল সফলভাবে আপডেট করা হয়েছে।");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("সেটিংস সংরক্ষণ করতে ব্যর্থ হয়েছে।");
    }
  };

  // Handle manual customer/supplier profile setup
  const handleCreateManualProfile = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!manualName.trim()) {
      setError("প্রোফাইলের নাম আবশ্যক।");
      return;
    }

    try {
      const balance = Number(manualOpeningBalance || 0);
      if (balance < 0) {
        setError("ওপেনিং ব্যালেন্স ঋণাত্মক হতে পারবে না।");
        return;
      }

      let createdProfile = null;
      if (manualRole === "customer") {
        createdProfile = await addNewCustomer({
          name: manualName.trim(),
          phone: manualPhone.trim(),
          address: manualAddress.trim(),
          due: balance
        });
      } else {
        createdProfile = await addNewSupplier({
          name: manualName.trim(),
          phone: manualPhone.trim(),
          address: manualAddress.trim(),
          due: balance
        });
      }

      // Automatically register the opening balance inside khata ledger!
      if (balance > 0 && createdProfile && createdProfile.id) {
        await addNewKhataEntry({
          partyId: createdProfile.id,
          partyType: manualRole,
          partyName: manualName.trim(),
          type: "due",
          amount: balance,
          description: "প্রারম্ভিক খাতা চালুর বকেয়া (Opening Balance)",
          date: dayjs().format("YYYY-MM-DD")
        });
      }

      setSuccess(`ম্যানুয়াল ${manualRole === "customer" ? "কাস্টমার" : "সাপ্লায়ার"} প্রোফাইল সফলভাবে তৈরি হয়েছে!`);
      
      // Reset form
      setManualName("");
      setManualPhone("");
      setManualAddress("");
      setManualOpeningBalance("0");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError("ম্যানুয়াল প্রোফাইল তৈরি করতে সমস্যা হয়েছে।");
    }
  };

  // Trigger JSON database backups with Custom Modal
  const handleBackup = async () => {
    try {
      const data = await backupData();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", `ShopKhataPro_Backup_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      
      setModalConfig({
        type: "success",
        title: "ব্যাকআপ ফাইল তৈরি সম্পন্ন (Backup Success)",
        message: "আপনার দোকানের ব্যাকআপ ফাইলটি সফলভাবে ডাউনলোড করা হয়েছে। ডাটা রিস্টোর বা নিরাপদে রাখতে এই ফাইলটি সংরক্ষণ করুন।"
      });
    } catch (e) {
      console.error(e);
      setModalConfig({
        type: "danger",
        title: "ব্যাকআপ ব্যর্থ",
        message: "ডাটা ব্যাকআপ ফাইল জেনারেট করতে কারিগরি সমস্যা হয়েছে।"
      });
    }
  };

  // Restore database backups with Custom Modal
  const handleRestore = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.onload = async (event) => {
      try {
        const parsedData = JSON.parse(event.target.result);
        if (!parsedData.products || !parsedData.categories) {
          setModalConfig({
            type: "danger",
            title: "ত্রুটিপূর্ণ ফাইল ফরম্যাট",
            message: "নির্বাচিত ফাইলটি সঠিক ব্যাকআপ ফাইল নয়। সঠিক JSON ফাইল নির্বাচন করুন।"
          });
          return;
        }

        setModalConfig({
          type: "confirm",
          title: "রিস্টোর ওভাররাইট নিশ্চিতকরণ (Restore Confirm)",
          message: "ব্যাকআপ রিস্টোর করলে আপনার বর্তমান সমস্ত পণ্যতালিকা, কাস্টমার প্রোফাইল ও খাতা ডায়েরির রেকর্ড সম্পূর্ণ মুছে গিয়ে ব্যাকআপের ডাটা ওভাররাইট হয়ে যাবে। আপনি কি নিশ্চিত?",
          onConfirm: async () => {
            const res = await restoreData(parsedData);
            if (res.success) {
              setModalConfig({
                type: "success",
                title: "রিস্টোর সফল (Restore Complete)",
                message: "আপনার ব্যাকআপ সফলভাবে রিস্টোর হয়েছে। মূল স্ক্রিনে ফিরে যাওয়া হচ্ছে।",
                onConfirm: () => navigateTo("/")
              });
            } else {
              setModalConfig({
                type: "danger",
                title: "রিস্টোর ব্যর্থ",
                message: res.error || "ডাটা রিস্টোর করতে ব্যর্থ হয়েছে।"
              });
            }
          }
        });
      } catch (err) {
        setModalConfig({
          type: "danger",
          title: "ফাইল রিডিং সমস্যা",
          message: "ব্যাকআপ ফাইলটি পড়তে ব্যর্থ হয়েছে। সঠিক ফাইল নির্বাচন করুন।"
        });
      }
    };
    fileReader.readAsText(file);
  };

  // Trigger Factory Reset with Custom Danger Modal
  const handleFactoryResetSubmit = (e) => {
    e.preventDefault();
    if (!resetChecked) {
      setModalConfig({
        type: "info",
        title: "নিশ্চিতকরণ প্রয়োজন",
        message: "ফ্যাক্টরি রিসেট করতে অনুগ্রহ করে নিশ্চিতকরণ সম্মতি চেক বক্সে টিক দিন।"
      });
      return;
    }
    if (resetVerification.trim() !== "RESET MY SHOP") {
      setModalConfig({
        type: "danger",
        title: "ভেরিফিকেশন মিলছে না",
        message: 'অনুগ্রহ করে ভেরিফিকেশন বক্সে হুবহু "RESET MY SHOP" শব্দটি বড় হাতের অক্ষরে লিখুন।'
      });
      return;
    }

    setModalConfig({
      type: "danger",
      title: "⚠️ চূড়ান্ত ফ্যাক্টরি রিসেট (ডাটা ডিলেট)",
      message: "আপনি কি নিশ্চিতভাবে আপনার দোকানের সমস্ত ডিজিটাল ডাটা চিরতরে মুছে দিতে চান? এটি করলে আপনার পণ্যতালিকা, কাস্টমার লেজার ডায়েরি এবং সমস্ত হিসাব চিরদিনের জন্য মুছে যাবে এবং এটি আর ফিরে পাওয়া যাবে না!",
      onConfirm: async () => {
        try {
          await triggerFactoryReset();
          setModalConfig({
            type: "success",
            title: "ফ্যাক্টরি রিসেট সফল",
            message: "আপনার দোকানের সকল হিসেব ও ফাইল রিসেট করা হয়েছে। সফ্টওয়্যারটি রি-ইনিশিয়ালাইজ করা হচ্ছে।",
            onConfirm: () => window.location.reload()
          });
        } catch (err) {
          setModalConfig({
            type: "danger",
            title: "রিসেট ব্যর্থ",
            message: "ডাটা মুছতে কারিগরি জটিলতা হয়েছে: " + err.message
          });
        }
      }
    });
  };

  // --- Dynamic Live Business Stats for Physical Khata Advisor ---
  const todayStr = dayjs().format("YYYY-MM-DD");
  const thisMonthStr = dayjs().format("YYYY-MM");
  const monthNameBangla = dayjs().format("MMMM YYYY");

  // Today's cash dynamics
  const todaySalesDocs = sales.filter(s => !s.deleted && s.date === todayStr);
  const todaySalesCash = todaySalesDocs.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
  const todaySalesDues = todaySalesDocs.reduce((acc, s) => acc + (s.dueAmount || 0), 0);

  const todayPurchasesDocs = purchases.filter(p => !p.deleted && p.date === todayStr);
  const todayPurchasesCash = todayPurchasesDocs.reduce((acc, p) => acc + (p.paidAmount || 0), 0);

  const todayExpensesDocs = expenses.filter(e => !e.deleted && e.date === todayStr);
  const todayExpensesTotal = todayExpensesDocs.reduce((acc, e) => acc + (e.amount || 0), 0);

  const todayKhataCustomerPayments = khata.filter(k => !k.deleted && k.date === todayStr && k.partyType === "customer" && k.type === "payment").reduce((acc, k) => acc + (k.amount || 0), 0);
  const todayKhataCustomerDues = khata.filter(k => !k.deleted && k.date === todayStr && k.partyType === "customer" && k.type === "due").reduce((acc, k) => acc + (k.amount || 0), 0);
  const todayKhataSupplierPayments = khata.filter(k => !k.deleted && k.date === todayStr && k.partyType === "supplier" && k.type === "payment").reduce((acc, k) => acc + (k.amount || 0), 0);

  const todayCashReceived = todaySalesCash + todayKhataCustomerPayments;
  const todayCashPaid = todayPurchasesCash + todayKhataSupplierPayments + todayExpensesTotal;
  const todayNetCashHand = todayCashReceived - todayCashPaid;

  // Monthly stats
  const monthSalesDocs = sales.filter(s => !s.deleted && s.date.startsWith(thisMonthStr));
  const monthSalesTotal = monthSalesDocs.reduce((acc, s) => acc + (s.payableAmount || 0), 0);
  const monthExpensesDocs = expenses.filter(e => !e.deleted && e.date.startsWith(thisMonthStr));
  const monthExpensesTotal = monthExpensesDocs.reduce((acc, e) => acc + (e.amount || 0), 0);

  // Month Profit Estimate
  let monthGrossProfit = 0;
  monthSalesDocs.forEach(sale => {
    if (sale.items) {
      sale.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const buyPrice = item.purchasePrice || (prod ? prod.purchasePrice : 0);
        monthGrossProfit += ((item.sellingPrice || 0) - buyPrice) * (item.quantity || 0);
      });
    }
  });
  const monthNetProfit = monthGrossProfit - monthExpensesTotal;

  // Copy blueprint functionality
  const handleCopyDailyBlueprint = () => {
    const text = `তারিখ: ${formatDate(todayStr, "DD MMMM YYYY")}
-----------------------------
১. মোট ক্যাশ জমা (Received Cash):
- ক্যাশ বিক্রয়: ${formatCurrency(todaySalesCash)}
- কাস্টমার বাকি আদায়: ${formatCurrency(todayKhataCustomerPayments)}
মোট ক্যাশ সংগ্রহ: ${formatCurrency(todayCashReceived)}

২. মোট ক্যাশ খরচ (Paid Cash):
- পাইকারি ক্রয় পেমেন্ট: ${formatCurrency(todayPurchasesCash)}
- সাপ্লায়ারকে পেমেন্ট: ${formatCurrency(todayKhataSupplierPayments)}
- দোকান পরিচালন খরচ: ${formatCurrency(todayExpensesTotal)}
মোট ক্যাশ প্রদান: ${formatCurrency(todayCashPaid)}

৩. ক্যাশবাক্স ক্লোজিং (Cash in Hand):
আজকের নেট ক্যাশ ব্যালেন্স: ${formatCurrency(todayNetCashHand)}

৪. আজকের নতুন বাকি (New Dues Added):
কাস্টমারদের আজকের নতুন বাকি: ${formatCurrency(todaySalesDues + todayKhataCustomerDues)}`;

    navigator.clipboard.writeText(text);
    setModalConfig({
      type: "success",
      title: "কপি সম্পন্ন (Clipboard Copied)",
      message: "দৈনিক কাগজে খাতা লেখার হিসেব বিবরণী আপনার মোবাইলের মেমরিতে কপি করা হয়েছে। ডায়েরি খোলার পর আপনি এটি দেখে সহজে লিখতে পারবেন।"
    });
  };

  // Render Layout
  return (
    <div className="main-content">
      {/* Title */}
      <div className="mb-4">
        <h2 className="h4 mb-1">Configuration Dashboard</h2>
        <p className="text-muted fs-7">দোকান সেটিংস, ম্যানুয়াল খাতা প্রোফাইল ও দৈনিক হিসাব ক্লোজিং</p>
      </div>

      {success && <div className="alert alert-success py-2 fs-7 mb-3">{success}</div>}
      {error && <div className="alert alert-danger py-2 fs-7 mb-3">{error}</div>}

      {/* Tabs navigation */}
      <div className="card-custom bg-white border border-light p-2 mb-4">
        <div className="nav nav-pills d-flex gap-1" id="settings-tab-nav" role="tablist">
          <button 
            type="button" 
            className={`nav-link flex-grow-1 py-2 font-monospace fs-8 text-nowrap ${activeSettingsTab === "shop" ? "active bg-success text-white" : "text-secondary"}`}
            onClick={() => setActiveSettingsTab("shop")}
          >
            <i className="bi bi-gear-fill"></i> Profile Info
          </button>
          
          <button 
            type="button" 
            className={`nav-link flex-grow-1 py-2 font-monospace fs-8 text-nowrap ${activeSettingsTab === "manual-profile" ? "active bg-success text-white" : "text-secondary"}`}
            onClick={() => setActiveSettingsTab("manual-profile")}
          >
            <i className="bi bi-person-plus-fill"></i> Add Manual Profile
          </button>
          
          <button 
            type="button" 
            className={`nav-link flex-grow-1 py-2 font-monospace fs-8 text-nowrap ${activeSettingsTab === "hisab-guide" ? "active bg-success text-white" : "text-secondary"}`}
            onClick={() => setActiveSettingsTab("hisab-guide")}
          >
            <i className="bi bi-journal-richtext"></i> Physical Hisab Guide
          </button>

          <button 
            type="button" 
            className={`nav-link flex-grow-1 py-2 font-monospace fs-8 text-nowrap ${activeSettingsTab === "backup-reset" ? "active bg-success text-white" : "text-secondary"}`}
            onClick={() => setActiveSettingsTab("backup-reset")}
          >
            <i className="bi bi-shield-fill-check"></i> Backup & Reset
          </button>
        </div>
      </div>

      {/* TAB CONTENT: 1. SHOP SETTINGS */}
      {activeSettingsTab === "shop" && (
        <div className="card-custom bg-white border border-light p-3">
          <h3 className="h6 text-muted text-uppercase mb-3 font-monospace">Shop Information</h3>
          
          <form onSubmit={handleSaveSettings}>
            <div className="mb-3">
              <label className="form-label text-muted fs-8 font-monospace">Shop Name</label>
              <input 
                type="text" 
                className="form-control"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label text-muted fs-8 font-monospace">Owner Name</label>
              <input 
                type="text" 
                className="form-control"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                required
              />
            </div>

            <div className="row">
              <div className="col-6 mb-3">
                <label className="form-label text-muted fs-8 font-monospace">Phone Number</label>
                <input 
                  type="text" 
                  className="form-control font-monospace"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div className="col-6 mb-3">
                <label className="form-label text-muted fs-8 font-monospace">Invoice Currency</label>
                <select 
                  className="form-select"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="৳">Taka (৳)</option>
                  <option value="$">Dollar ($)</option>
                  <option value="Rs">Rupee (Rs)</option>
                </select>
              </div>
            </div>

            <div className="row">
              <div className="col-6 mb-3">
                <label className="form-label text-muted fs-8 font-monospace">VAT / Tax Rate (%)</label>
                <input 
                  type="number" 
                  step="0.1"
                  className="form-control font-monospace"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(e.target.value)}
                />
              </div>
              <div className="col-6 mb-3">
                <label className="form-label text-muted fs-8 font-monospace">Address</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label text-muted fs-8 font-monospace">Receipt Footer Note</label>
              <input 
                type="text" 
                className="form-control"
                value={footerNote}
                onChange={(e) => setFooterNote(e.target.value)}
              />
              <div className="form-text text-muted fs-9">রসিদের নিচে প্রিন্ট হওয়া বিদায়ী বার্তা।</div>
            </div>

            <button 
              type="submit" 
              className="btn btn-custom btn-custom-primary w-100 font-monospace text-uppercase"
              disabled={loading}
            >
              Save Settings
            </button>
          </form>
        </div>
      )}

      {/* TAB CONTENT: 2. MANUAL PROFILE CREATION */}
      {activeSettingsTab === "manual-profile" && (
        <div className="card-custom bg-white border border-light p-3">
          <h3 className="h6 text-muted text-uppercase mb-1 font-monospace">Manual Profile Setup</h3>
          <p className="text-muted fs-8 mb-3">কাগজের খাতা থেকে ডিজিটাল অ্যাপে নতুন কাস্টমার/সাপ্লায়ারের পূর্ববর্তী প্রারম্ভিক বকেয়া দিয়ে খাতা চালু করুন।</p>
          
          <form onSubmit={handleCreateManualProfile}>
            <div className="mb-3">
              <label className="form-label text-muted fs-8 font-monospace">Profile Type (খাতার ধরণ)</label>
              <div className="d-flex gap-3">
                <div className="form-check">
                  <input 
                    className="form-check-input" 
                    type="radio" 
                    name="manualRole" 
                    id="roleCustomer" 
                    checked={manualRole === "customer"}
                    onChange={() => setManualRole("customer")}
                  />
                  <label className="form-check-label fs-8 fw-semibold" htmlFor="roleCustomer">
                    Customer (ক্রেতা)
                  </label>
                </div>
                <div className="form-check">
                  <input 
                    className="form-check-input" 
                    type="radio" 
                    name="manualRole" 
                    id="roleSupplier" 
                    checked={manualRole === "supplier"}
                    onChange={() => setManualRole("supplier")}
                  />
                  <label className="form-check-label fs-8 fw-semibold" htmlFor="roleSupplier">
                    Supplier (পাইকার/মহাজন)
                  </label>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label text-muted fs-8 font-monospace">Full Name (নাম)</label>
              <input 
                type="text" 
                className="form-control"
                placeholder="যেমন: মোঃ আবদুর রহমান"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                required
              />
            </div>

            <div className="row">
              <div className="col-12 col-sm-6 mb-3">
                <label className="form-label text-muted fs-8 font-monospace">Phone (মোবাইল নম্বর)</label>
                <input 
                  type="text" 
                  className="form-control font-monospace"
                  placeholder="যেমন: 01712345678"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                />
              </div>

              <div className="col-12 col-sm-6 mb-3">
                <label className="form-label text-muted fs-8 font-monospace">Opening Due Balance (৳ প্রারম্ভিক বকেয়া)</label>
                <input 
                  type="number" 
                  className="form-control font-monospace"
                  placeholder="যেমন: 5000"
                  value={manualOpeningBalance}
                  onChange={(e) => setManualOpeningBalance(e.target.value)}
                  min="0"
                />
                <div className="form-text text-muted fs-9">কাগজের খাতার বর্তমান মোট বকেয়া এখানে দিন, এটি স্বয়ংক্রিয়ভাবে লেজারে সেড হবে।</div>
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label text-muted fs-8 font-monospace">Address (ঠিকানা)</label>
              <input 
                type="text" 
                className="form-control"
                placeholder="যেমন: চকবাজার, ঢাকা"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-custom btn-custom-primary w-100 font-monospace text-uppercase"
              disabled={loading}
            >
              Initialize Profile & Ledger
            </button>
          </form>
        </div>
      )}

      {/* TAB CONTENT: 3. DYNAMIC HISAB GUIDE (HIGH READABILITY LEDGER DESIGN) */}
      {activeSettingsTab === "hisab-guide" && (
        <div className="hisab-guide-section animate__animated animate__fadeIn">
          {/* Dynamic Daily Entry copy card */}
          <div className="card-custom bg-white border border-success p-3 mb-4">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h4 className="h6 text-success text-uppercase m-0 font-monospace fw-bold d-flex align-items-center gap-1">
                  <i className="bi bi-file-earmark-text-fill"></i> Today's Daily Hisab Blueprint
                </h4>
                <small className="text-muted fs-8">আজকের কাগজের ডায়েরি বা খাতা মেলানোর বিবরণী</small>
              </div>
              <button 
                type="button" 
                className="btn btn-sm btn-outline-success font-monospace px-3"
                style={{ fontSize: "11px" }}
                onClick={handleCopyDailyBlueprint}
              >
                <i className="bi bi-clipboard"></i> কপি করুন
              </button>
            </div>

            {/* High Readability Paper Skin Sheet */}
            <div 
              className="p-4 rounded border position-relative shadow-sm" 
              style={{ 
                backgroundColor: "#fdfbf7", 
                borderColor: "#e9dfd0", 
                fontFamily: "Outfit, Arial, sans-serif",
                color: "#1e293b"
              }}
            >
              {/* Paper Lines background simulation */}
              <div className="d-flex justify-content-between align-items-center pb-2 mb-3 border-bottom border-secondary-subtle">
                <span className="fw-bold fs-6 text-success"><i className="bi bi-calendar3"></i> খাতা এন্ট্রি: {formatDate(todayStr, "DD MMMM YYYY")}</span>
                <span className="badge bg-success-subtle text-success fs-9 border border-success-subtle">দৈনিক ব্লুপ্রিন্ট</span>
              </div>

              {/* 1. Received Cash Block */}
              <div className="mb-4">
                <h5 className="h7 text-dark fw-bold border-bottom pb-1 mb-2 d-flex align-items-center gap-1">
                  <i className="bi bi-plus-circle text-success"></i> ১. ক্যাশ জমা (নগদ আদায়সমূহ)
                </h5>
                <div className="d-flex justify-content-between py-1 fs-7">
                  <span>নগদ ও ক্যাশ বিক্রয় (Cash Sales)</span>
                  <span className="fw-bold text-success font-monospace">+{formatCurrency(todaySalesCash)}</span>
                </div>
                <div className="d-flex justify-content-between py-1 fs-7 border-bottom border-light">
                  <span>কাস্টমার থেকে বকেয়া আদায় (Payment In)</span>
                  <span className="fw-bold text-success font-monospace">+{formatCurrency(todayKhataCustomerPayments)}</span>
                </div>
                <div className="d-flex justify-content-between py-2 fs-7 fw-bold" style={{ backgroundColor: "#f1fbf3", padding: "0 8px", borderRadius: "4px" }}>
                  <span className="text-success">মোট সংগ্রহকৃত ক্যাশ টাকা (Total In)</span>
                  <span className="font-monospace text-success">{formatCurrency(todayCashReceived)}</span>
                </div>
              </div>

              {/* 2. Paid Cash Block */}
              <div className="mb-4">
                <h5 className="h7 text-dark fw-bold border-bottom pb-1 mb-2 d-flex align-items-center gap-1">
                  <i className="bi bi-dash-circle text-danger"></i> ২. ক্যাশ খরচ (নগদ প্রদানসমূহ)
                </h5>
                <div className="d-flex justify-content-between py-1 fs-7">
                  <span>পাইকারি ক্রয় নগদ পরিশোধ (Wholesale)</span>
                  <span className="fw-bold text-danger font-monospace">-{formatCurrency(todayPurchasesCash)}</span>
                </div>
                <div className="d-flex justify-content-between py-1 fs-7">
                  <span>সাপ্লায়ারকে বকেয়া প্রদান (Payment Out)</span>
                  <span className="fw-bold text-danger font-monospace">-{formatCurrency(todayKhataSupplierPayments)}</span>
                </div>
                <div className="d-flex justify-content-between py-1 fs-7 border-bottom border-light">
                  <span>দোকানের পরিচালন ও বিবিধ খরচ (Expenses)</span>
                  <span className="fw-bold text-danger font-monospace">-{formatCurrency(todayExpensesTotal)}</span>
                </div>
                <div className="d-flex justify-content-between py-2 fs-7 fw-bold" style={{ backgroundColor: "#fef2f2", padding: "0 8px", borderRadius: "4px" }}>
                  <span className="text-danger">মোট খরচকৃত ক্যাশ টাকা (Total Out)</span>
                  <span className="font-monospace text-danger">{formatCurrency(todayCashPaid)}</span>
                </div>
              </div>

              {/* 3. Cash in Hand closing */}
              <div className="mb-4">
                <h5 className="h7 text-dark fw-bold border-bottom pb-1 mb-2 d-flex align-items-center gap-1">
                  <i className="bi bi-wallet2 text-primary"></i> ৩. ক্যাশবাক্স ক্লোজিং (নগদ ব্যালেন্স)
                </h5>
                <div className="d-flex justify-content-between align-items-center py-2 px-2 fw-bold rounded" style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
                  <span className="text-primary fs-7">বাক্সে নগদ থাকা উচিত (Cash in Hand)</span>
                  <span className="fs-6 font-monospace text-primary">{formatCurrency(todayNetCashHand)}</span>
                </div>
                <div className="text-muted fs-9 mt-1 italic text-end">
                  *{todayNetCashHand >= 0 ? "আজকের ক্যাশ বাক্সে অতিরিক্ত ৳" + todayNetCashHand + " জমা হবে।" : "ক্যাশ ঘাটতি: বাক্সে ৳" + Math.abs(todayNetCashHand) + " কম থাকতে হবে।"}
                </div>
              </div>

              {/* 4. Due Additions */}
              <div>
                <h5 className="h7 text-dark fw-bold border-bottom pb-1 mb-2 d-flex align-items-center gap-1">
                  <i className="bi bi-journal-x text-warning"></i> ৪. বাকি বিক্রয় হিসাব (Credit Ledger)
                </h5>
                <div className="d-flex justify-content-between py-1 fs-7">
                  <span>আজকের রসিদ বাকি বিক্রয়</span>
                  <span className="fw-semibold font-monospace">{formatCurrency(todaySalesDues)}</span>
                </div>
                <div className="d-flex justify-content-between py-1 fs-7 border-bottom border-light">
                  <span>লেজার খাতার নতুন বাকি এন্ট্রি</span>
                  <span className="fw-semibold font-monospace">{formatCurrency(todayKhataCustomerDues)}</span>
                </div>
                <div className="d-flex justify-content-between py-2 fs-7 fw-bold text-secondary">
                  <span>কাস্টমারদের মোট নতুন বাকি ঋণ</span>
                  <span className="font-monospace text-dark">{formatCurrency(todaySalesDues + todayKhataCustomerDues)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Monthly Entry copy card */}
          <div className="card-custom bg-white border border-info p-3 mb-4">
            <h4 className="h6 text-info text-uppercase mb-3 font-monospace d-flex align-items-center gap-1">
              <i className="bi bi-calendar2-check-fill"></i> Monthly Closing Statement (মাসিক ক্লোজিং)
            </h4>
            
            <div className="p-3 bg-light rounded border fs-7 text-dark" style={{ fontFamily: "Outfit, sans-serif" }}>
              <div className="fw-bold mb-2 pb-1 border-bottom"><i className="bi bi-bookmark-star-fill text-info"></i> মাসিক খাতা ক্লোজিং বিবরণী: {monthNameBangla}</div>
              <div className="d-flex justify-content-between py-1">
                <span>১. মোট বিক্রয় পরিমাণ (নগদ + বকেয়া):</span>
                <span className="fw-bold font-monospace">{formatCurrency(monthSalesTotal)}</span>
              </div>
              <div className="d-flex justify-content-between py-1">
                <span>২. মোট অন্যান্য দোকান খরচ (Expenses):</span>
                <span className="fw-bold font-monospace text-danger">{formatCurrency(monthExpensesTotal)}</span>
              </div>
              <div className="d-flex justify-content-between py-1 border-bottom pb-2">
                <span>৩. আনুমানিক নিট মুনাফা (Net Profit):</span>
                <span className={`fw-bold font-monospace ${monthNetProfit >= 0 ? "text-success" : "text-danger"}`}>{formatCurrency(monthNetProfit)}</span>
              </div>
              <div className="fs-9 text-muted mt-2 italic text-center">
                *উক্ত মাসে বিক্রয়ের বিপরীতে আপনার আনুমানিক নিট মুনাফা বা প্রফিটের হার হচ্ছে <strong>{monthSalesTotal > 0 ? ((monthNetProfit / monthSalesTotal) * 100).toFixed(1) : 0}%</strong>।
              </div>
            </div>
          </div>

          {/* Static A to Z Guide details */}
          <div className="card-custom bg-white border border-light p-3">
            <h4 className="h6 text-muted text-uppercase mb-3 font-monospace">A to Z Manual Khata Writing Guide (ম্যানুয়াল খাতা লেখার নিয়ম)</h4>
            
            <div className="accordion accordion-flush" id="manualGuideAccordion">
              <div className="accordion-item">
                <h5 className="accordion-header" id="flush-headingOne">
                  <button className="accordion-button collapsed fs-8 fw-bold py-2 px-0 text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseOne">
                    ১. ক্যাশ খাতা (Daily Cash Register) কিভাবে লিখবেন?
                  </button>
                </h5>
                <div id="flush-collapseOne" className="accordion-collapse collapse" data-bs-parent="#manualGuideAccordion">
                  <div className="accordion-body px-0 fs-7 text-secondary" style={{ lineHeight: "1.6" }}>
                    প্রতিদিন দোকান খোলার সময় ক্যাশবাক্সের শুরুর টাকা (Opening Balance) গুনুন। দিনের শেষে ক্যাশ বিক্রয় এবং কাস্টমার আদায় যোগ করুন। এরপর সাপ্লায়ারকে পেমেন্ট ও দোকান খরচ বিয়োগ করুন। ক্যাশবাক্সের বর্তমান টাকা আর খাতায় লেখা ক্লোজিং ক্যাশ হুবহু মিলতে হবে। কোনো গরমিল থাকলে তা সাথে সাথে চিহ্নিত করুন।
                  </div>
                </div>
              </div>

              <div className="accordion-item">
                <h5 className="accordion-header" id="flush-headingTwo">
                  <button className="accordion-button collapsed fs-8 fw-bold py-2 px-0 text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseTwo">
                    ২. কাস্টমার ও সাপ্লায়ারের বাকি খতিয়ান (Dues Ledger)
                  </button>
                </h5>
                <div id="flush-collapseTwo" className="accordion-collapse collapse" data-bs-parent="#manualGuideAccordion">
                  <div className="accordion-body px-0 fs-7 text-secondary" style={{ lineHeight: "1.6" }}>
                    প্রত্যেক নিয়মিত বাকি নেওয়া কাস্টমারের জন্য ডায়েরিতে আলাদা পৃষ্ঠা বরাদ্দ রাখুন। কাস্টমার নতুন বাকিতে জিনিস নিলে দাম ও পণ্যের নাম সহ "বকেয়া (+)" কলামে লিখুন। কাস্টমার টাকা ফেরত দিলে তা "জমা (-)" কলামে লিখে বর্তমান বকেয়া (Due Balance) নামিয়ে রাখুন।
                  </div>
                </div>
              </div>

              <div className="accordion-item">
                <h5 className="accordion-header" id="flush-headingThree">
                  <button className="accordion-button collapsed fs-8 fw-bold py-2 px-0 text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseThree">
                    ৩. লাভ-ক্ষতি ও মাসিক লাভ বের করার নিয়ম
                  </button>
                </h5>
                <div id="flush-collapseThree" className="accordion-collapse collapse" data-bs-parent="#manualGuideAccordion">
                  <div className="accordion-body px-0 fs-7 text-secondary" style={{ lineHeight: "1.6" }}>
                    মাস শেষে লাভ বের করার জন্য: **বিক্রয়কৃত পণ্যের মোট বিক্রয়মূল্য - পণ্যগুলোর ক্রয়মূল্য = মোট লাভ (Gross Profit)**। এরপর এই মোট লাভ থেকে দোকানের ভাড়া, কর্মচারীর বেতন, বিদ্যুৎ বিল এবং অন্যান্য আনুষঙ্গিক পরিচালন খরচ বিয়োগ করলে আপনি **আসল নিট লাভ (Net Profit)** পাবেন।
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. BACKUP, RECOVERY & RESET */}
      {activeSettingsTab === "backup-reset" && (
        <div>
          {/* Backup and Restore Tools */}
          <div className="card-custom bg-white border border-light p-3 mb-4">
            <h3 className="h6 text-muted text-uppercase mb-3 font-monospace">Backup & Restore</h3>
            <p className="text-muted fs-8 mb-3">আপনার দোকানের সমস্ত ডাটা এক্সপোর্ট করে ফাইল সংরক্ষণ করতে পারেন অথবা পূর্বে সংরক্ষিত ব্যাকআপ রিস্টোর করতে পারেন।</p>

            <div className="d-flex flex-column gap-2">
              <button 
                type="button" 
                className="btn btn-custom btn-custom-secondary font-monospace"
                onClick={handleBackup}
              >
                <i className="bi bi-download"></i> Backup Data (JSON)
              </button>
              
              <div className="border-top my-2"></div>
              
              <label className="form-label text-muted fs-8 font-monospace m-0">Restore Backup File</label>
              <input 
                type="file" 
                accept=".json" 
                className="form-control form-control-sm"
                onChange={handleRestore}
              />
              <small className="text-muted fs-9">সতর্কতা: রিস্টোর করলে বর্তমান সমস্ত ক্যাশ ও কাস্টমার লেজার রিপ্লেস হবে।</small>
            </div>
          </div>

          {/* Recycle Bin Section */}
          <div className="card-custom bg-white border border-light p-3 mb-4">
            <h3 className="h6 text-muted text-uppercase mb-3 font-monospace">Data Recovery</h3>
            <p className="text-muted fs-8 mb-3">মুছে ফেলা ক্যাটাগরি, প্রোডাক্ট, কাস্টমার প্রোফাইল এবং হিসাবপত্র পুনরুদ্ধার করার জন্য রিসাইকেল বিন বা ট্র্যাশ সেকশন ব্যবহার করুন।</p>

            <button 
              type="button" 
              className="btn btn-custom btn-custom-danger w-100 font-monospace text-uppercase text-white d-flex align-items-center justify-content-center gap-2"
              onClick={() => navigateTo("/trash")}
              style={{ backgroundColor: "#dc3545", border: "none" }}
            >
              <i className="bi bi-trash3"></i> View Trash / Recycle Bin
            </button>
          </div>

          {/* Dangerous Zone: Factory Reset */}
          <div className="card-custom border border-danger-subtle bg-danger-subtle p-3 mb-4">
            <h3 className="h6 text-danger text-uppercase mb-2 font-monospace fw-bold">Danger Zone (ফ্যাক্টরি রিসেট)</h3>
            <p className="fs-8 text-danger-emphasis mb-3">
              <strong>সতর্কতা:</strong> ফ্যাক্টরি রিসেট করলে আপনার দোকানের সমস্ত ডাটা (পণ্য, কাস্টমার, সাপ্লায়ার, বিক্রয়, খরচ এবং সমস্ত হিসাব) <strong>চিরতরে মুছে যাবে</strong> এবং এটি আর ফেরত পাওয়া যাবে না!
            </p>

            <form onSubmit={handleFactoryResetSubmit}>
              <div className="form-check mb-3">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="resetConfirmCheck" 
                  checked={resetChecked}
                  onChange={(e) => setResetChecked(e.target.checked)}
                />
                <label className="form-check-label fs-8 text-dark fw-bold" htmlFor="resetConfirmCheck">
                  আমি নিশ্চিত যে আমি আমার দোকানের সমস্ত ডাটাবেজ মুছে দিতে চাই।
                </label>
              </div>

              {resetChecked && (
                <div className="mb-3">
                  <label className="form-label text-dark fs-8 font-monospace fw-bold">নিচে <strong>RESET MY SHOP</strong> লিখুন:</label>
                  <input 
                    type="text" 
                    className="form-control form-control-sm font-monospace border-danger text-danger"
                    placeholder="RESET MY SHOP"
                    value={resetVerification}
                    onChange={(e) => setResetVerification(e.target.value)}
                    required
                  />
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-danger w-100 font-monospace text-uppercase text-white"
                disabled={loading || !resetChecked || resetVerification.trim() !== "RESET MY SHOP"}
                style={{ background: "#dc3545" }}
              >
                <i className="bi bi-exclamation-triangle-fill"></i> Confirm Factory Reset (সব মুছে ফেলুন)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Cloud Integration configuration alert */}
      {isLocalMode && (
        <div className="alert alert-warning border-warning-subtle text-dark fs-8 p-3 rounded-3 mb-4">
          <h6 className="fw-bold"><i className="bi bi-cloud-slash-fill"></i> Cloud Sync integration</h6>
          ক্লাউডে ডাটা নিরাপদ রাখতে এবং একাধিক ডিভাইস থেকে অ্যাক্সেস করতে হলে, ফায়ারবেস প্রজেক্ট প্যারামিটার সেটআপ করুন। আপনার ডিরেক্টরির `.env` ফাইলে ফায়ারবেস কী-সমূহ পেস্ট করে রিলোড দিন।
        </div>
      )}

      {/* About Dev info */}
      <div className="card-custom bg-light border border-light p-3 mb-2 text-center text-secondary">
        <h4 className="h6 fw-bold m-0 font-monospace text-success">Shop Khata Pro</h4>
        <small className="d-block fs-8 mb-2">Version 1.2.0 (Custom Dialogs Ready)</small>
        <p className="fs-9 text-muted m-0">Designed for Bangladeshi Small Businesses</p>
        <p className="fs-9 text-muted m-0">Developed with React 19, Firebase & Bootstrap 5</p>
        <small className="fs-9 d-block mt-2 opacity-50">© 2026 Shop Khata Pro. All Rights Reserved.</small>
      </div>

      {/* CUSTOM OVERLAY DIALOG MODAL (Alert & Confirm Overrides) */}
      {modalConfig && (
        <div 
          className="custom-modal-overlay d-flex justify-content-center align-items-center animate__animated animate__fadeIn"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.7)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            padding: "20px"
          }}
        >
          <div 
            className="card-custom bg-white p-4 shadow-lg border border-light animate__animated animate__zoomIn animate__faster" 
            style={{ 
              maxWidth: "460px", 
              width: "100%",
              borderRadius: "12px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            }}
          >
            {/* Modal Title */}
            <h4 
              className="h6 fw-bold mb-3 d-flex align-items-center gap-2" 
              style={{ 
                color: modalConfig.type === "danger" ? "#dc3545" : 
                       modalConfig.type === "success" ? "#198754" : 
                       modalConfig.type === "info" ? "#0dcaf0" : "#0f172a",
                fontFamily: "Outfit, sans-serif"
              }}
            >
              {modalConfig.type === "danger" && <i className="bi bi-exclamation-triangle-fill fs-5 text-danger"></i>}
              {modalConfig.type === "success" && <i className="bi bi-check-circle-fill fs-5 text-success"></i>}
              {modalConfig.type === "info" && <i className="bi bi-info-circle-fill fs-5 text-info"></i>}
              {modalConfig.type === "confirm" && <i className="bi bi-question-circle-fill fs-5 text-primary"></i>}
              {modalConfig.title}
            </h4>
            
            {/* Modal Body message */}
            <p 
              className="fs-7 text-secondary mb-4" 
              style={{ 
                lineHeight: "1.6",
                fontFamily: "inherit"
              }}
            >
              {modalConfig.message}
            </p>
            
            {/* Modal Actions */}
            <div className="d-flex justify-content-end gap-2">
              {modalConfig.type === "confirm" || modalConfig.type === "danger" ? (
                <>
                  <button 
                    type="button" 
                    className="btn btn-sm btn-light border px-3 font-monospace fs-8"
                    onClick={() => {
                      if (modalConfig.onCancel) modalConfig.onCancel();
                      setModalConfig(null);
                    }}
                  >
                    বাতিল (Cancel)
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-sm text-white px-3 font-monospace fs-8"
                    style={{ 
                      backgroundColor: modalConfig.type === "danger" ? "#dc3545" : "#198754",
                      border: "none"
                    }}
                    onClick={() => {
                      if (modalConfig.onConfirm) modalConfig.onConfirm();
                      setModalConfig(null);
                    }}
                  >
                    নিশ্চিত (Confirm)
                  </button>
                </>
              ) : (
                <button 
                  type="button" 
                  className="btn btn-sm text-white px-4 font-monospace fs-8"
                  style={{ 
                    backgroundColor: "#198754",
                    border: "none"
                  }}
                  onClick={() => {
                    if (modalConfig.onConfirm) modalConfig.onConfirm();
                    setModalConfig(null);
                  }}
                >
                  ঠিক আছে (OK)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
