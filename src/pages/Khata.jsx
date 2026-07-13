import React, { useState, useEffect } from "react";
import { useData } from "../context/DataContext";
import { useRouter } from "../context/RouterContext";
import { formatCurrency, formatDate } from "../utils/formatters";
import dayjs from "dayjs";

export default function Khata() {
  const { 
    khata, 
    customers, 
    suppliers, 
    addNewKhataEntry, 
    deleteKhataItem,
    loading 
  } = useData();
  const { routeParams, navigateTo } = useRouter();

  // Selected Account IDs
  const [activeAccountId, setActiveAccountId] = useState(null);
  const [activeAccountType, setActiveAccountType] = useState("customer");
  const [activeTab, setActiveTab] = useState("customer"); // 'customer' | 'supplier'

  // Derive activeAccount dynamically from context lists to keep values live
  const activeAccountRaw = activeAccountType === "customer"
    ? customers.find(c => c.id === activeAccountId)
    : suppliers.find(s => s.id === activeAccountId);
    
  const activeAccount = activeAccountRaw ? { ...activeAccountRaw, type: activeAccountType } : null;

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");
  
  // Ledger Trans Form State
  const [showPayForm, setShowPayForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [transType, setTransType] = useState("payment"); // 'payment' (collected/paid) | 'due' (added due)
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [transDate, setTransDate] = useState(dayjs().format("YYYY-MM-DD"));
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Re-route redirection handler: if redirected from customer/supplier list with partyId
  useEffect(() => {
    if (routeParams?.partyId && routeParams?.type) {
      const type = routeParams.type;
      const partyId = routeParams.partyId;
      
      setActiveAccountType(type);
      setActiveAccountId(partyId);
      setActiveTab(type);
    }
  }, [routeParams]);

  const handleSelectAccount = (account, type) => {
    setActiveAccountId(account.id);
    setActiveAccountType(type);
    setShowPayForm(false);
    setError("");
    setSuccess("");
  };

  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setError("");
    setSuccess("");

    if (!amount || Number(amount) <= 0) {
      setError("টাকার পরিমাণ সঠিক নয়।");
      return;
    }

    const transData = {
      partyId: activeAccount.id,
      partyType: activeAccount.type,
      partyName: activeAccount.name,
      type: transType, // 'payment' or 'due'
      amount: Number(amount),
      description: description.trim() || (transType === "payment" ? "হিসাব পরিশোধ (নগদ)" : "বাকী বিক্রয় হিসাব"),
      date: transDate
    };

    try {
      setIsSaving(true);
      await addNewKhataEntry(transData);
      setSuccess("খাতা এন্ট্রি সফলভাবে সম্পন্ন হয়েছে।");
      setAmount("");
      setDescription("");
      
      setTimeout(() => {
        setSuccess("");
        setShowPayForm(false);
      }, 2000);
    } catch (err) {
      setError("সংরক্ষণ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setIsSaving(false);
    }
  };

  // Close ledger and return to list
  const handleBackToList = () => {
    setActiveAccountId(null);
    setShowPayForm(false);
    // Clear route parameters from URL hash
    window.location.hash = "#/khata";
  };

  // Get current active transactions list
  const accountTransactions = activeAccount
    ? khata.filter(k => k.partyId === activeAccount.id)
    : [];

  // Filter master lists
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.phone && c.phone.includes(searchQuery))
  );

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.phone && s.phone.includes(searchQuery))
  );

  return (
    <div className="main-content">
      {/* Title */}
      <div className="d-flex justify-content-between align-items-center mb-4 no-print">
        <div>
          <h2 className="h4 mb-1">Khata Ledger</h2>
          <p className="text-muted fs-7">বকেয়া হিসাব ও দেনা-পাওনা খতিয়ান</p>
        </div>
        
        {activeAccount && (
          <button 
            className="btn btn-sm btn-custom btn-custom-secondary font-monospace"
            onClick={handleBackToList}
          >
            <i className="bi bi-arrow-left"></i> Back to List
          </button>
        )}
      </div>

      {/* VIEW 1: Account statement details */}
      {activeAccount ? (
        <div>
          {/* Header Card Summary */}
          <div className="card-custom bg-white border border-light p-3 mb-4">
            <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-3">
              <div>
                <span className={`badge ${activeAccount.type === "customer" ? "bg-success" : "bg-danger"} mb-1`}>
                  {activeAccount.type === "customer" ? "Customer" : "Supplier"}
                </span>
                <h4 className="m-0 fw-bold">{activeAccount.name}</h4>
                {activeAccount.phone && <small className="text-muted font-monospace"><i className="bi bi-telephone"></i> {activeAccount.phone}</small>}
              </div>
              <div className="text-end">
                <small className="text-muted fs-8 text-uppercase">Net Balance Due</small>
                <h3 className={`m-0 fw-bold ${activeAccount.due > 0 ? "text-danger" : "text-success"}`}>
                  {formatCurrency(activeAccount.due)}
                </h3>
              </div>
            </div>

            {/* Print or Add payments triggers */}
            <div className="d-flex gap-2 no-print">
              <button 
                className="btn btn-custom btn-custom-primary flex-grow-1 font-monospace"
                onClick={() => setShowPayForm(!showPayForm)}
              >
                <i className="bi bi-cash-coin"></i> Record Payment
              </button>
              <button 
                className="btn btn-custom btn-custom-secondary font-monospace"
                onClick={() => window.print()}
              >
                <i className="bi bi-printer"></i> Print Statement
              </button>
            </div>
          </div>

          {/* Payment Form block */}
          {showPayForm && (
            <div className="card-custom bg-white border border-light mb-4 no-print">
              <h5 className="h6 text-muted text-uppercase mb-3 font-monospace">Record Transaction</h5>
              
              {error && <div className="alert alert-danger py-2 fs-7 mb-3">{error}</div>}
              {success && <div className="alert alert-success py-2 fs-7 mb-3">{success}</div>}

              <form onSubmit={handleSaveTransaction}>
                <div className="mb-3">
                  <label className="form-label text-muted fs-8 font-monospace">Transaction Type</label>
                  <div className="btn-group w-100" role="group">
                    <input 
                      type="radio" 
                      className="btn-check" 
                      name="transType" 
                      id="transPay" 
                      checked={transType === "payment"}
                      onChange={() => setTransType("payment")}
                    />
                    <label className="btn btn-outline-success font-monospace" htmlFor="transPay">
                      {activeAccount.type === "customer" ? "Receive Payment (জমা)" : "Make Payment (পরিশোধ)"}
                    </label>

                    <input 
                      type="radio" 
                      className="btn-check" 
                      name="transType" 
                      id="transDue" 
                      checked={transType === "due"}
                      onChange={() => setTransType("due")}
                    />
                    <label className="btn btn-outline-danger font-monospace" htmlFor="transDue">
                      Add Due (বাকী বৃদ্ধি)
                    </label>
                  </div>
                </div>

                <div className="row">
                  <div className="col-6 mb-3">
                    <label className="form-label text-muted fs-8 font-monospace">Amount (৳)</label>
                    <input 
                      type="number" 
                      className="form-control font-monospace"
                      placeholder="টাকার পরিমাণ"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-6 mb-3">
                    <label className="form-label text-muted fs-8 font-monospace">Date</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={transDate}
                      onChange={(e) => setTransDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label text-muted fs-8 font-monospace">Description (Optional)</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder={transType === "payment" ? "জমা সংগ্রহ করা হলো" : "বাকী খাতা এন্ট্রি"}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="d-flex gap-2">
                  <button 
                    type="submit" 
                    className="btn btn-custom btn-custom-primary flex-grow-1 font-monospace"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        Save Transaction
                      </>
                    )}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-custom btn-custom-secondary font-monospace"
                    onClick={() => setShowPayForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Statement Transaction History */}
          <div className="card-custom bg-white border border-light p-0">
            <div className="p-3 border-bottom border-light">
              <h5 className="h6 text-muted m-0 font-monospace">Ledger Statement History</h5>
            </div>

            {accountTransactions.length === 0 ? (
              <div className="text-center py-5 text-muted fs-8">
                এই খতিয়ানে এখনো কোনো লেনদেন নথিভুক্ত নেই।
              </div>
            ) : (
              <div className="table-responsive-custom">
                <table className="table table-custom align-middle">
                  <thead>
                    <tr>
                      <th scope="col" className="font-monospace">Date / Description</th>
                      <th scope="col" className="text-end font-monospace">Credit (জমা)</th>
                      <th scope="col" className="text-end font-monospace">Debit (বাকী)</th>
                      <th scope="col" className="text-end font-monospace no-print">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accountTransactions.map((item) => (
                      <tr key={item.id} className={item.type === "due" ? "table-danger-subtle" : "table-success-subtle"}>
                        <td>
                          <div className="fw-semibold fs-7 text-wrap">{item.description}</div>
                          <small className="text-muted font-monospace" style={{ fontSize: "11px" }}>
                            {formatDate(item.date, "DD/MM/YYYY")}
                          </small>
                        </td>
                        <td className="text-end font-monospace text-success fw-bold">
                          {item.type === "payment" ? formatCurrency(item.amount) : "-"}
                        </td>
                        <td className="text-end font-monospace text-danger fw-bold">
                          {item.type === "due" ? formatCurrency(item.amount) : "-"}
                        </td>
                        <td className="text-end no-print">
                          <button
                            className="btn btn-sm btn-link text-danger p-0 border-0"
                            onClick={() => {
                              if (window.confirm(`আপনি কি সত্যিই ৳${item.amount} মূল্যের এই লেনদেনটি মুছে ফেলতে চান? এটি কাস্টমার/সাপ্লায়ারের বকেয়া ব্যালেন্স পুনর্নির্ধারণ করবে।`)) {
                                deleteKhataItem(item.id);
                              }
                            }}
                            title="Delete Ledger Entry"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Hidden statement layout for printing */}
          <div className="d-none d-print-block printable-invoice py-4">
            <div className="text-center mb-4 pb-2 border-bottom">
              <h3>{activeAccount.type === "customer" ? "কাস্টমার খতিয়ান" : "সাপ্লায়ার খতিয়ান"}</h3>
              <h4>{activeAccount.name}</h4>
              {activeAccount.phone && <p>মোবাইল: {activeAccount.phone}</p>}
              <p>রিপোর্ট প্রিন্টের তারিখ: {dayjs().format("DD/MM/YYYY")}</p>
              <h5 className="mt-2 text-danger">বর্তমান বকেয়া: {formatCurrency(activeAccount.due)}</h5>
            </div>
            
            <table className="table table-bordered table-sm">
              <thead>
                <tr>
                  <th>তারিখ</th>
                  <th>বিবরণ</th>
                  <th className="text-end">জমা (৳)</th>
                  <th className="text-end">বাকী (৳)</th>
                </tr>
              </thead>
              <tbody>
                {accountTransactions.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.date, "DD/MM/YYYY")}</td>
                    <td>{item.description}</td>
                    <td className="text-end">{item.type === "payment" ? formatCurrency(item.amount) : "-"}</td>
                    <td className="text-end">{item.type === "due" ? formatCurrency(item.amount) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VIEW 2: Ledger Lists directory */
        <>
          {/* Master Tabs */}
          <ul className="nav nav-pills nav-fill mb-3 bg-light p-1 rounded no-print" role="tablist">
            <li className="nav-item">
              <button 
                className={`nav-link font-monospace py-2 rounded-2 ${activeTab === "customer" ? "active bg-success text-white" : "text-secondary"}`}
                onClick={() => setActiveTab("customer")}
              >
                Customer Khata
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link font-monospace py-2 rounded-2 ${activeTab === "supplier" ? "active bg-success text-white" : "text-secondary"}`}
                onClick={() => setActiveTab("supplier")}
              >
                Supplier Khata
              </button>
            </li>
          </ul>

          {/* Search bar */}
          <div className="search-container no-print">
            <i className="bi bi-search"></i>
            <input 
              type="text" 
              className="form-control" 
              placeholder={activeTab === "customer" ? "কাস্টমারের নাম অথবা ফোন দিয়ে খুঁজুন..." : "সাপ্লায়ারের নাম অথবা ফোন দিয়ে খুঁজুন..."} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Accounts list directory cards */}
          {activeTab === "customer" ? (
            <div className="card-custom bg-white border border-light p-0">
              <div className="p-3 border-bottom border-light">
                <h5 className="h6 text-muted m-0 font-monospace">Outstanding Receivables</h5>
              </div>

              {filteredCustomers.length === 0 ? (
                <div className="text-center py-4 text-muted fs-8">কোনো কাস্টমার খাতা পাওয়া যায়নি।</div>
              ) : (
                <div className="list-group list-group-flush">
                  {filteredCustomers.map(cust => (
                    <div 
                      key={cust.id} 
                      className="list-group-item d-flex justify-content-between align-items-center py-3 px-3 cursor-pointer pointer-active"
                      onClick={() => handleSelectAccount(cust, "customer")}
                    >
                      <div>
                        <div className="fw-semibold fs-7">{cust.name}</div>
                        {cust.phone && <small className="text-muted font-monospace fs-9">{cust.phone}</small>}
                      </div>
                      <div className="text-end d-flex align-items-center gap-2">
                        <span className={`fw-bold font-monospace fs-7 ${cust.due > 0 ? "text-danger" : "text-success"}`}>
                          {formatCurrency(cust.due)}
                        </span>
                        <i className="bi bi-chevron-right text-muted fs-7"></i>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="card-custom bg-white border border-light p-0">
              <div className="p-3 border-bottom border-light">
                <h5 className="h6 text-muted m-0 font-monospace">Outstanding Payables</h5>
              </div>

              {filteredSuppliers.length === 0 ? (
                <div className="text-center py-4 text-muted fs-8">কোনো সাপ্লায়ার খাতা পাওয়া যায়নি।</div>
              ) : (
                <div className="list-group list-group-flush">
                  {filteredSuppliers.map(supp => (
                    <div 
                      key={supp.id} 
                      className="list-group-item d-flex justify-content-between align-items-center py-3 px-3 cursor-pointer pointer-active"
                      onClick={() => handleSelectAccount(supp, "supplier")}
                    >
                      <div>
                        <div className="fw-semibold fs-7">{supp.name}</div>
                        {supp.phone && <small className="text-muted font-monospace fs-9">{supp.phone}</small>}
                      </div>
                      <div className="text-end d-flex align-items-center gap-2">
                        <span className={`fw-bold font-monospace fs-7 ${supp.due > 0 ? "text-danger" : "text-success"}`}>
                          {formatCurrency(supp.due)}
                        </span>
                        <i className="bi bi-chevron-right text-muted fs-7"></i>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
