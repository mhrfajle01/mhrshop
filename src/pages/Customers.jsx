import React, { useState } from "react";
import { useData } from "../context/DataContext";
import { useRouter } from "../context/RouterContext";
import { formatCurrency } from "../utils/formatters";

export default function Customers() {
  const { 
    customers, 
    addNewCustomer, 
    updateCustomerItem, 
    deleteCustomerItem, 
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

  const handleEdit = (cust) => {
    setEditingId(cust.id);
    setName(cust.name);
    setPhone(cust.phone || "");
    setAddress(cust.address || "");
    setInitialDue(cust.due || "0");
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
      setError("কাস্টমারের নাম প্রদান করা আবশ্যক।");
      return;
    }

    const customerData = {
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      due: Number(initialDue || 0)
    };

    try {
      if (editingId) {
        // Keep current due but update other details. In a real scenario, editing initial due might recalculate or just keep it.
        // We'll update the fields passed in.
        await updateCustomerItem(editingId, customerData);
        setSuccess("কাস্টমার প্রোফাইল আপডেট করা হয়েছে।");
      } else {
        await addNewCustomer(customerData);
        setSuccess("নতুন কাস্টমার প্রোফাইল তৈরি করা হয়েছে।");
      }

      setTimeout(() => setSuccess(""), 3000);
      setMode("list");
    } catch (err) {
      setError("সংরক্ষণ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    }
  };

  const handleDelete = async (id, custName) => {
    if (window.confirm(`আপনি কি সত্যিই "${custName}" কাস্টমারটি মুছে ফেলতে চান?`)) {
      try {
        await deleteCustomerItem(id, custName);
        setSuccess("কাস্টমার প্রোফাইল মুছে ফেলা হয়েছে।");
        setTimeout(() => setSuccess(""), 3000);
      } catch (err) {
        alert("কাস্টমার মুছতে ব্যর্থ হয়েছে।");
      }
    }
  };

  // Filter
  const filteredCustomers = customers.filter(cust => {
    const term = searchQuery.toLowerCase();
    return (
      cust.name.toLowerCase().includes(term) ||
      (cust.phone && cust.phone.includes(term))
    );
  });

  const totalOutstandingDue = filteredCustomers.reduce((acc, c) => acc + (c.due || 0), 0);

  return (
    <div className="main-content">
      {/* Title */}
      <div className="d-flex justify-content-between align-items-center mb-4 no-print">
        <div>
          <h2 className="h4 mb-1">Customers</h2>
          <p className="text-muted fs-7">ক্রেতাদের তালিকা ও বাকী খাতা</p>
        </div>

        {mode === "list" ? (
          <button 
            className="btn btn-sm btn-custom btn-custom-primary font-monospace"
            onClick={handleAddNew}
          >
            <i className="bi bi-person-plus"></i> Add Customer
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
            {editingId ? "Update Customer Profile" : "Create Customer Profile"}
          </h3>

          {error && <div className="alert alert-danger py-2 fs-7 mb-3">{error}</div>}

          <form onSubmit={handleSave}>
            <div className="mb-3">
              <label className="form-label text-muted fs-7 font-monospace">Customer Name</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="যেমন: জনাব রহমান"
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
                placeholder="বাসা/গ্রাম, এলাকা, শহর"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            {editingId === null && (
              <div className="mb-4">
                <label className="form-label text-muted fs-7 font-monospace">Opening Due Balance (৳)</label>
                <input 
                  type="number" 
                  className="form-control font-monospace" 
                  placeholder="পূর্ববর্তী বকেয়া (থাকলে)"
                  value={initialDue}
                  onChange={(e) => setInitialDue(e.target.value)}
                />
                <div className="form-text text-muted fs-8">ইতিপূর্বের বকেয়া হিসাব শুরু করার জন্য যোগ করুন।</div>
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
              placeholder="কাস্টমারের নাম অথবা ফোন নম্বর..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Running total outstanding customer due */}
          <div className="card-custom bg-warning-subtle text-dark border border-light py-2 text-center mb-3 no-print">
            <small className="fs-8 text-uppercase text-muted">Total Customers Outstanding Due</small>
            <h4 className="m-0 fw-bold text-warning-emphasis">{formatCurrency(totalOutstandingDue)}</h4>
          </div>

          {/* Customer list table */}
          <div className="card-custom bg-white border border-light p-0">
            <div className="p-3 border-bottom border-light d-flex justify-content-between align-items-center">
              <h4 className="h6 text-muted m-0 font-monospace">Customer Registry</h4>
              <span className="badge bg-light text-dark fs-8">{filteredCustomers.length} Persons</span>
            </div>

            {filteredCustomers.length === 0 ? (
              <div className="text-center py-5 text-muted fs-7">
                কোনো ক্রেতার তথ্য খুঁজে পাওয়া যায়নি।
              </div>
            ) : (
              <div className="table-responsive-custom">
                <table className="table table-custom align-middle">
                  <thead>
                    <tr>
                      <th scope="col" className="font-monospace">Customer Info</th>
                      <th scope="col" className="text-end font-monospace">Due Balance</th>
                      <th scope="col" className="text-end font-monospace no-print">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((cust) => (
                      <tr key={cust.id}>
                        <td>
                          <div className="fw-semibold">{cust.name}</div>
                          {cust.phone && (
                            <small className="text-muted d-block font-monospace" style={{ fontSize: "11px" }}>
                              <i className="bi bi-telephone"></i> {cust.phone}
                            </small>
                          )}
                          {cust.address && (
                            <small className="text-muted d-block text-truncate" style={{ maxWidth: "160px", fontSize: "11px" }}>
                              <i className="bi bi-geo-alt"></i> {cust.address}
                            </small>
                          )}
                        </td>
                        <td className="text-end fw-bold font-monospace">
                          <span className={cust.due > 0 ? "text-danger" : "text-success"}>
                            {formatCurrency(cust.due)}
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
                                  onClick={() => navigateTo("/khata", { partyId: cust.id, type: "customer" })}
                                >
                                  <i className="bi bi-book me-2 text-success"></i> Open Ledger (খাতা)
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item py-2" onClick={() => handleEdit(cust)}>
                                  <i className="bi bi-pencil me-2 text-warning"></i> Edit Details
                                </button>
                              </li>
                              <li>
                                <hr className="dropdown-divider my-1" />
                              </li>
                              <li>
                                <button 
                                  className="dropdown-item py-2 text-danger" 
                                  onClick={() => handleDelete(cust.id, cust.name)}
                                >
                                  <i className="bi bi-trash me-2"></i> Delete Customer
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
    </div>
  );
}
