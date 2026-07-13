import React, { useState } from "react";
import { useData } from "../context/DataContext";
import { formatCurrency, formatDate } from "../utils/formatters";
import dayjs from "dayjs";

export default function Expenses() {
  const { expenses, addNewExpense, updateExpenseItem, deleteExpenseItem, loading } = useData();

  // Navigation page state: 'list' or 'form'
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [category, setCategory] = useState("Miscellaneous");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));

  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleEdit = (exp) => {
    setEditingId(exp.id);
    setCategory(exp.category || "Miscellaneous");
    setAmount(exp.amount || "");
    setDescription(exp.description || "");
    setDate(exp.date || dayjs().format("YYYY-MM-DD"));
    setError("");
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setCategory("Miscellaneous");
    setAmount("");
    setDescription("");
    setDate(dayjs().format("YYYY-MM-DD"));
    setError("");
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!amount || Number(amount) <= 0) {
      setError("খরচের পরিমাণ শূন্যের চেয়ে বড় হওয়া আবশ্যক।");
      return;
    }

    const expenseData = {
      category,
      amount: Number(amount),
      description: description.trim(),
      date
    };

    try {
      if (editingId) {
        await updateExpenseItem(editingId, expenseData);
        setSuccess("খরচ সফলভাবে আপডেট করা হয়েছে।");
      } else {
        await addNewExpense(expenseData);
        setSuccess("নতুন খরচ রেকর্ড করা হয়েছে।");
      }

      setTimeout(() => setSuccess(""), 3000);
      setShowForm(false);
    } catch (err) {
      setError("খরচ সেভ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    }
  };

  const handleDelete = async (id, amt) => {
    if (window.confirm(`আপনি কি সত্যিই ৳${amt} পরিমাণের এই খরচটি মুছে ফেলতে চান?`)) {
      try {
        await deleteExpenseItem(id, amt);
        setSuccess("খরচ ডিলিট করা হয়েছে।");
        setTimeout(() => setSuccess(""), 3000);
      } catch (err) {
        alert("ডিলিট করতে ব্যর্থ হয়েছে।");
      }
    }
  };

  // Filter Expenses
  const filteredExpenses = expenses.filter(exp => {
    const term = searchQuery.toLowerCase();
    return (
      exp.category.toLowerCase().includes(term) ||
      (exp.description && exp.description.toLowerCase().includes(term))
    );
  });

  const totalFilteredExpense = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="main-content">
      {/* Title */}
      <div className="d-flex justify-content-between align-items-center mb-4 no-print">
        <div>
          <h2 className="h4 mb-1">Expenses</h2>
          <p className="text-muted fs-7">দোকানের যাবতীয় খরচ হিসাব খাতা</p>
        </div>
        
        {!showForm ? (
          <button 
            className="btn btn-sm btn-custom btn-custom-primary font-monospace"
            onClick={handleAddNew}
          >
            <i className="bi bi-plus-circle"></i> Add Expense
          </button>
        ) : (
          <button 
            className="btn btn-sm btn-custom btn-custom-secondary font-monospace"
            onClick={() => setShowForm(false)}
          >
            <i className="bi bi-arrow-left"></i> Back
          </button>
        )}
      </div>

      {success && <div className="alert alert-success py-2 fs-7 mb-3 no-print">{success}</div>}

      {/* Editor Form Mode */}
      {showForm && (
        <div className="card-custom bg-white border border-light no-print">
          <h3 className="h6 text-muted text-uppercase mb-3 font-monospace">
            {editingId ? "Update Expense Log" : "Record New Expense"}
          </h3>

          {error && <div className="alert alert-danger py-2 fs-7 mb-3">{error}</div>}

          <form onSubmit={handleSave}>
            <div className="mb-3">
              <label className="form-label text-muted fs-7 font-monospace">Expense Category</label>
              <select 
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Miscellaneous">Miscellaneous (বিবিধ খরচ)</option>
                <option value="Rent">Shop Rent (দোকান ভাড়া)</option>
                <option value="Electricity">Electricity Bill (বিদ্যুৎ বিল)</option>
                <option value="Salary">Staff Salary (কর্মচারী বেতন)</option>
                <option value="Transportation">Transportation (যাতায়াত ও ভাড়া)</option>
                <option value="Entertainment">Entertainment (আপ্যায়ন খরচ)</option>
                <option value="Internet">Internet Bill (ইন্টারনেট/মোবাইল রিচার্জ)</option>
              </select>
            </div>

            <div className="row">
              <div className="col-6 mb-3">
                <label className="form-label text-muted fs-7 font-monospace">Amount (৳)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="form-control font-monospace" 
                  placeholder="টাকার পরিমাণ"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="col-6 mb-3">
                <label className="form-label text-muted fs-7 font-monospace">Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label text-muted fs-7 font-monospace">Description (Optional)</label>
              <textarea 
                className="form-control no-resize" 
                rows="3"
                placeholder="খরচের বিবরণ বা বিস্তারিত লিখুন"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>

            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-custom btn-custom-primary flex-grow-1 font-monospace">
                <i className="bi bi-check-circle"></i> Save Expense
              </button>
              <button 
                type="button" 
                className="btn btn-custom btn-custom-secondary font-monospace"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List Mode */}
      {!showForm && (
        <>
          {/* Search bar */}
          <div className="search-container no-print">
            <i className="bi bi-search"></i>
            <input 
              type="text" 
              className="form-control" 
              placeholder="শ্রেণী অথবা বিবরণ দিয়ে খুঁজুন..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Running total for queried items */}
          <div className="card-custom bg-danger-subtle border border-light py-2 text-center text-danger mb-3 no-print">
            <small className="fs-8 text-uppercase">Total Filtered Expense</small>
            <h4 className="m-0 fw-bold">{formatCurrency(totalFilteredExpense)}</h4>
          </div>

          {/* Table list */}
          <div className="card-custom bg-white border border-light p-0">
            <div className="p-3 border-bottom border-light d-flex justify-content-between align-items-center">
              <h4 className="h6 text-muted m-0 font-monospace">Expense Ledger</h4>
              <span className="badge bg-light text-dark fs-8">{filteredExpenses.length} Records</span>
            </div>

            {filteredExpenses.length === 0 ? (
              <div className="text-center py-5 text-muted fs-7">
                কোনো খরচের রেকর্ড খুঁজে পাওয়া যায়নি।
              </div>
            ) : (
              <div className="table-responsive-custom">
                <table className="table table-custom align-middle">
                  <thead>
                    <tr>
                      <th scope="col" className="font-monospace">Date / Category</th>
                      <th scope="col" className="text-end font-monospace">Amount</th>
                      <th scope="col" className="text-end font-monospace no-print">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map((exp) => (
                      <tr key={exp.id}>
                        <td>
                          <div className="fw-semibold text-danger">{exp.category}</div>
                          {exp.description && (
                            <small className="text-muted d-block text-wrap text-truncate" style={{ maxWidth: "180px", fontSize: "12px" }}>
                              {exp.description}
                            </small>
                          )}
                          <small className="text-muted font-monospace" style={{ fontSize: "11px" }}>
                            {formatDate(exp.date, "DD/MM/YYYY")}
                          </small>
                        </td>
                        <td className="text-end fw-bold font-monospace">
                          {formatCurrency(exp.amount)}
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
                                <button className="dropdown-item py-2" onClick={() => handleEdit(exp)}>
                                  <i className="bi bi-pencil me-2 text-warning"></i> Edit
                                </button>
                              </li>
                              <li>
                                <hr className="dropdown-divider my-1" />
                              </li>
                              <li>
                                <button 
                                  className="dropdown-item py-2 text-danger" 
                                  onClick={() => handleDelete(exp.id, exp.amount)}
                                >
                                  <i className="bi bi-trash me-2"></i> Delete
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
