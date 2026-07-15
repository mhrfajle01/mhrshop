import React, { useState } from "react";
import { useData } from "../context/DataContext";
import { useRouter } from "../context/RouterContext";
import { formatCurrency, formatDate } from "../utils/formatters";
import dayjs from "dayjs";
import { CopyableTextParser } from "../components/CopyableText";

export default function Suppliers() {
  const { 
    suppliers, 
    purchases,
    khata,
    addNewSupplier, 
    updateSupplierItem, 
    deleteSupplierItem, 
    addNewKhataEntry,
    loading 
  } = useData();
  const { navigateTo } = useRouter();

  // Mode: 'list' or 'form'
  const [mode, setMode] = useState("list");
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [initialDue, setInitialDue] = useState("0");

  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Ledger Profile Drawer/Modal State
  const [activeLedgerSupplier, setActiveLedgerSupplier] = useState(null);
  const [ledgerPaymentAmount, setLedgerPaymentAmount] = useState("");
  const [ledgerPaymentDesc, setLedgerPaymentDesc] = useState("");
  const [ledgerPaymentDate, setLedgerPaymentDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [paymentSuccess, setPaymentSuccess] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  const handleEdit = (supp) => {
    setEditingId(supp.id);
    setName(supp.name);
    setPhone(supp.phone || "");
    setAddress(supp.address || "");
    setInitialDue(supp.due || "0");
    setError("");
    setMode("form");
  };

  const handleAddNew = () => {
    setEditingId(null);
    setName("");
    setPhone("");
    setAddress("");
    setInitialDue("0");
    setError("");
    setMode("form");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("সরবরাহকারীর নাম প্রদান করা আবশ্যক।");
      return;
    }

    const supplierData = {
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      due: Number(initialDue || 0)
    };

    try {
      if (editingId) {
        await updateSupplierItem(editingId, supplierData);
        setSuccess("সাপ্লায়ার প্রোফাইল আপডেট করা হয়েছে।");
      } else {
        await addNewSupplier(supplierData);
        setSuccess("নতুন সাপ্লায়ার প্রোফাইল তৈরি করা হয়েছে।");
      }

      setTimeout(() => setSuccess(""), 3000);
      setMode("list");
    } catch (err) {
      setError("সংরক্ষণ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`আপনি কি সত্যিই "${name}" সাপ্লায়ার মুছে ফেলতে চান?`)) {
      try {
        await deleteSupplierItem(id, name);
        setSuccess("সাপ্লায়ার প্রোফাইল মুছে ফেলা হয়েছে।");
        setTimeout(() => setSuccess(""), 3000);
      } catch (err) {
        alert("সাপ্লায়ার মুছতে ব্যর্থ হয়েছে।");
      }
    }
  };

  const handleSaveLedgerPayment = async (e) => {
    e.preventDefault();
    if (isSavingPayment || !activeLedgerSupplier) return;
    setPaymentError("");
    setPaymentSuccess("");

    const payAmt = Number(ledgerPaymentAmount);
    if (!payAmt || payAmt <= 0) {
      setPaymentError("অনুগ্রহ করে পরিশোধের সঠিক পরিমাণ লিখুন।");
      return;
    }

    try {
      setIsSavingPayment(true);
      await addNewKhataEntry({
        partyId: activeLedgerSupplier.id,
        partyType: "supplier",
        partyName: activeLedgerSupplier.name,
        type: "payment", // paid to supplier
        amount: payAmt,
        description: ledgerPaymentDesc.trim() || "মহাজন পরিশোধ (সাপ্লায়ার খাতা থেকে সরাসরি পরিশোধ)",
        date: ledgerPaymentDate
      });
      setIsSavingPayment(false);
      setLedgerPaymentAmount("");
      setLedgerPaymentDesc("");
      setPaymentSuccess("৳" + payAmt + " পরিশোধ সফলভাবে রেকর্ড করা হয়েছে।");
    } catch (err) {
      setIsSavingPayment(false);
      setPaymentError("পরিশোধ রেকর্ড করতে ব্যর্থ হয়েছে।");
    }
  };

  const getLedgerRecords = (supplier) => {
    if (!supplier) return [];
    
    // Get purchases for this supplier
    const supplierPurchases = purchases
      .filter(p => !p.deleted && p.supplierId === supplier.id)
      .map(p => ({
        id: p.id,
        date: p.date,
        type: "purchase",
        label: `ক্রয় চালান: ${p.invoiceNumber}`,
        debit: p.totalAmount, // we owe (added due)
        credit: p.paidAmount, // we paid at purchase
        raw: p
      }));

    // Get khata ledger entries for this supplier
    const supplierKhata = khata
      .filter(k => !k.deleted && k.partyId === supplier.id && k.partyType === "supplier")
      .map(k => ({
        id: k.id,
        date: k.date,
        type: k.type, // 'due' or 'payment'
        label: k.description || (k.type === "payment" ? "নগদ পরিশোধ" : "বকেয়া যোগ"),
        debit: k.type === "due" ? k.amount : 0,
        credit: k.type === "payment" ? k.amount : 0,
        raw: k
      }));

    // Combine and sort by date descending
    return [...supplierPurchases, ...supplierKhata].sort((a, b) => b.date.localeCompare(a.date));
  };

  // Filter
  const filteredSuppliers = suppliers.filter(supp => {
    const term = searchQuery.toLowerCase();
    return (
      supp.name.toLowerCase().includes(term) ||
      (supp.phone && supp.phone.includes(term))
    );
  });

  const totalOutstandingDue = filteredSuppliers.reduce((acc, s) => acc + (s.due || 0), 0);

  return (
    <div className="main-content">
      {/* Title */}
      <div className="d-flex justify-content-between align-items-center mb-4 no-print">
        <div>
          <h2 className="h4 mb-1">Suppliers</h2>
          <p className="text-muted fs-7">সরবরাহকারীদের তালিকা ও দেনা খাতা</p>
        </div>

        {mode === "list" ? (
          <button 
            className="btn btn-sm btn-custom btn-custom-primary font-monospace"
            onClick={handleAddNew}
          >
            <i className="bi bi-person-plus"></i> Add Supplier
          </button>
        ) : (
          <button 
            className="btn btn-sm btn-custom btn-custom-secondary font-monospace"
            onClick={() => setMode("list")}
          >
            <i className="bi bi-arrow-left"></i> Back
          </button>
        )}
      </div>

      {success && <div className="alert alert-success py-2 fs-7 mb-3 no-print">{success}</div>}

      {/* Editor Form Mode */}
      {mode === "form" && (
        <div className="card-custom bg-white border border-light no-print">
          <h3 className="h6 text-muted text-uppercase mb-3 font-monospace">
            {editingId ? "Update Supplier Profile" : "Create Supplier Profile"}
          </h3>

          {error && <div className="alert alert-danger py-2 fs-7 mb-3">{error}</div>}

          <form onSubmit={handleSave}>
            <div className="mb-3">
              <label className="form-label text-muted fs-7 font-monospace">Supplier Name</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="যেমন: আড়তদার জনাব আশরাফ"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label text-muted fs-7 font-monospace">Phone Number</label>
              <input 
                type="text" 
                className="form-control font-monospace" 
                placeholder="যেমন: 01712345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label text-muted fs-7 font-monospace">Address (Optional)</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="সাপ্লায়ার অফিসের ঠিকানা"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            {editingId === null && (
              <div className="mb-4">
                <label className="form-label text-muted fs-7 font-monospace">Opening Payable Due (৳)</label>
                <input 
                  type="number" 
                  className="form-control font-monospace" 
                  placeholder="পূর্ববর্তী পাওনা/দেনা (থাকলে)"
                  value={initialDue}
                  onChange={(e) => setInitialDue(e.target.value)}
                />
                <div className="form-text text-muted fs-8">সাপ্লায়ার আমাদের কাছে পূর্বের পাওনা টাকা থাকলে যোগ করুন।</div>
              </div>
            )}

            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-custom btn-custom-primary flex-grow-1 font-monospace">
                <i className="bi bi-check-circle"></i> Save Profile
              </button>
              <button 
                type="button" 
                className="btn btn-custom btn-custom-secondary font-monospace"
                onClick={() => setMode("list")}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List Mode */}
      {mode === "list" && (
        <>
          {/* Search bar */}
          <div className="search-container no-print">
            <i className="bi bi-search"></i>
            <input 
              type="text" 
              className="form-control" 
              placeholder="সাপ্লায়ারের নাম অথবা ফোন নম্বর..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Running total outstanding supplier due */}
          <div className="card-custom bg-danger-subtle text-dark border border-light py-2 text-center mb-3 no-print">
            <small className="fs-8 text-uppercase text-muted">Total Outstanding Supplier Payable</small>
            <h4 className="m-0 fw-bold text-danger-emphasis">{formatCurrency(totalOutstandingDue)}</h4>
          </div>

          {/* Supplier list table */}
          <div className="card-custom bg-white border border-light p-0">
            <div className="p-3 border-bottom border-light d-flex justify-content-between align-items-center">
              <h4 className="h6 text-muted m-0 font-monospace">Supplier Registry</h4>
              <span className="badge bg-light text-dark fs-8">{filteredSuppliers.length} Wholesalers</span>
            </div>

            {filteredSuppliers.length === 0 ? (
              <div className="text-center py-5 text-muted fs-7">
                কোনো সরবরাহকারীর তথ্য খুঁজে পাওয়া যায়নি।
              </div>
            ) : (
              <div className="table-responsive-custom">
                <table className="table table-custom align-middle">
                  <thead>
                    <tr>
                      <th scope="col" className="font-monospace">Supplier Info</th>
                      <th scope="col" className="text-end font-monospace">We Owe (দেনা)</th>
                      <th scope="col" className="text-end font-monospace no-print">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSuppliers.map((supp) => (
                      <tr key={supp.id}>
                        <td 
                          onClick={() => {
                            setActiveLedgerSupplier(supp);
                            setPaymentSuccess("");
                            setPaymentError("");
                            const modalEl = document.getElementById("supplierLedgerModal");
                            if (modalEl) {
                              const modal = new window.bootstrap.Modal(modalEl);
                              modal.show();
                            }
                          }}
                          style={{ cursor: "pointer" }}
                          className="pointer-active"
                          title="Click to view ledger profile"
                        >
                          <div className="fw-semibold text-success d-flex align-items-center gap-1">
                            {supp.name} <i className="bi bi-info-circle fs-9 text-muted"></i>
                          </div>
                          {supp.phone && (
                            <small className="text-muted d-block font-monospace" style={{ fontSize: "11px" }}>
                              <i className="bi bi-telephone"></i> {supp.phone}
                            </small>
                          )}
                          {supp.address && (
                            <small className="text-muted d-block text-truncate" style={{ maxWidth: "160px", fontSize: "11px" }}>
                              <i className="bi bi-geo-alt"></i> {supp.address}
                            </small>
                          )}
                        </td>
                        <td className="text-end fw-bold font-monospace">
                          <span className={supp.due > 0 ? "text-danger" : "text-success"}>
                            {formatCurrency(supp.due)}
                          </span>
                        </td>
                        <td className="text-end no-print">
                          <div className="dropdown">
                            <button 
                              className="btn btn-sm btn-link text-secondary p-1 border-0 dropdown-toggle" 
                              type="button" 
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                            >
                              <i className="bi bi-three-dots-vertical"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow border-0 py-1">
                              <li>
                                <button 
                                  className="dropdown-item py-2" 
                                  onClick={() => {
                                    setActiveLedgerSupplier(supp);
                                    setPaymentSuccess("");
                                    setPaymentError("");
                                    const modalEl = document.getElementById("supplierLedgerModal");
                                    if (modalEl) {
                                      const modal = new window.bootstrap.Modal(modalEl);
                                      modal.show();
                                    }
                                  }}
                                >
                                  <i className="bi bi-person-lines-fill me-2 text-success"></i> View Ledger Profile
                                </button>
                              </li>
                              <li>
                                <button 
                                  className="dropdown-item py-2" 
                                  onClick={() => navigateTo("/khata", { partyId: supp.id, type: "supplier" })}
                                >
                                  <i className="bi bi-book me-2 text-secondary"></i> Open Full Khata
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item py-2" onClick={() => handleEdit(supp)}>
                                  <i className="bi bi-pencil me-2 text-warning"></i> Edit Details
                                </button>
                              </li>
                              <li>
                                <hr className="dropdown-divider my-1" />
                              </li>
                              <li>
                                <button 
                                  className="dropdown-item py-2 text-danger" 
                                  onClick={() => handleDelete(supp.id, supp.name)}
                                >
                                  <i className="bi bi-trash me-2"></i> Delete Supplier
                                </button>
                              </li>
                            </ul>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Supplier Ledger Profile Modal */}
      <div 
        className="modal fade no-print" 
        id="supplierLedgerModal" 
        tabIndex="-1" 
        aria-labelledby="supplierLedgerModalLabel" 
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "16px" }}>
            <div className="modal-header border-bottom border-light bg-light" style={{ borderTopLeftRadius: "16px", borderTopRightRadius: "16px" }}>
              <h5 className="modal-title font-monospace" id="supplierLedgerModalLabel">Supplier Ledger Profile (মহাজন খতিয়ান)</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body p-4">
              {activeLedgerSupplier && (() => {
                const liveSupplier = suppliers.find(s => s.id === activeLedgerSupplier.id) || activeLedgerSupplier;
                const records = getLedgerRecords(liveSupplier);
                
                return (
                  <div className="row g-3">
                    {/* Left Column: Info Summary & Record Payment */}
                    <div className="col-12 col-md-5 border-end border-light pe-md-4">
                      <div className="mb-4">
                        <h5 className="fw-bold m-0 text-success">{liveSupplier.name}</h5>
                        {liveSupplier.phone && <p className="text-muted m-0 fs-8 font-monospace"><i className="bi bi-telephone"></i> {liveSupplier.phone}</p>}
                        {liveSupplier.address && <p className="text-muted m-0 fs-8"><i className="bi bi-geo-alt"></i> {liveSupplier.address}</p>}
                      </div>

                      <div className="card-custom bg-danger-subtle border-0 py-2 px-3 text-center mb-4">
                        <small className="fs-9 text-uppercase text-muted fw-semibold">Current Balance We Owe</small>
                        <h4 className="m-0 fw-bold text-danger">{formatCurrency(liveSupplier.due || 0)}</h4>
                      </div>

                      {/* Payment Form */}
                      <form onSubmit={handleSaveLedgerPayment} className="card-custom bg-light border-0 p-3">
                        <h6 className="fw-bold mb-3 font-monospace fs-7 text-dark">Record Payment (টাকা পরিশোধ)</h6>
                        
                        {paymentSuccess && <div className="alert alert-success py-1.5 fs-8 mb-2">{paymentSuccess}</div>}
                        {paymentError && <div className="alert alert-danger py-1.5 fs-8 mb-2">{paymentError}</div>}

                        <div className="mb-2">
                          <label className="form-label fs-9 text-muted font-monospace m-0">Payment Amount (৳) *</label>
                          <input 
                            type="number" 
                            className="form-control form-control-sm font-monospace fw-bold text-success"
                            placeholder="পরিশোধের পরিমাণ"
                            required
                            value={ledgerPaymentAmount}
                            onChange={(e) => setLedgerPaymentAmount(e.target.value)}
                          />
                        </div>

                        <div className="mb-2">
                          <label className="form-label fs-9 text-muted font-monospace m-0">Payment Date</label>
                          <input 
                            type="date" 
                            className="form-control form-control-sm"
                            value={ledgerPaymentDate}
                            onChange={(e) => setLedgerPaymentDate(e.target.value)}
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label fs-9 text-muted font-monospace m-0">Remarks / Note</label>
                          <input 
                            type="text" 
                            className="form-control form-control-sm fs-8"
                            placeholder="যেমন: ক্যাশ পেমেন্ট"
                            value={ledgerPaymentDesc}
                            onChange={(e) => setLedgerPaymentDesc(e.target.value)}
                          />
                        </div>

                        <button 
                          type="submit" 
                          className="btn btn-sm btn-success w-100 font-monospace py-1.5"
                          disabled={isSavingPayment}
                        >
                          {isSavingPayment ? "Saving..." : "Save Payment"}
                        </button>
                      </form>
                    </div>

                    {/* Right Column: Ledger Entry History Table */}
                    <div className="col-12 col-md-7 ps-md-3">
                      <h6 className="fw-bold mb-3 font-monospace fs-7 text-muted text-uppercase">Transaction History</h6>
                      
                      {records.length === 0 ? (
                        <div className="text-center text-muted fs-8 py-5">এই সাপ্লায়ারের কোনো লেনদেন রেকর্ড পাওয়া যায়নি।</div>
                      ) : (
                        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                          <table className="table table-sm align-middle fs-8">
                            <thead>
                              <tr className="table-light">
                                <th scope="col" className="font-monospace">Date</th>
                                <th scope="col" className="font-monospace">Details</th>
                                <th scope="col" className="text-end font-monospace text-danger">Debit (+)</th>
                                <th scope="col" className="text-end font-monospace text-success">Credit (-)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {records.map((r, idx) => (
                                <tr key={r.id || idx}>
                                  <td className="font-monospace text-muted">{dayjs(r.date).format("DD/MM/YY")}</td>
                                  <td className="text-wrap" style={{ maxWidth: "150px" }}>
                                    <div className="fw-semibold text-dark">
                                      <CopyableTextParser text={r.label} />
                                    </div>
                                  </td>
                                  <td className="text-end text-danger font-monospace">
                                    {r.debit > 0 ? `+${formatCurrency(r.debit)}` : "-"}
                                  </td>
                                  <td className="text-end text-success font-monospace">
                                    {r.credit > 0 ? `-${formatCurrency(r.credit)}` : "-"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="modal-footer border-top border-light bg-light" style={{ borderBottomLeftRadius: "16px", borderBottomRightRadius: "16px" }}>
              <button 
                type="button" 
                className="btn btn-custom btn-custom-secondary font-monospace py-1.5" 
                data-bs-dismiss="modal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
