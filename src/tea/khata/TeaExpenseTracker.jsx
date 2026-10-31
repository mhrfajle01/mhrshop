import React, { useState } from "react";
import { useTea } from "../context/TeaContext";

export default function TeaExpenseTracker({ selectedDate }) {
  const { expenses, addExpense, removeExpense } = useTea();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("দুধ");
  const [showAdd, setShowAdd] = useState(false);

  const filteredExpenses = expenses.filter(e => (e.date || e.createdAt?.slice(0, 10)) === selectedDate);
  const totalExpenseToday = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!amount) return;
    await addExpense({
      title: title || category,
      category,
      amount: Number(amount),
      date: selectedDate
    });
    setTitle("");
    setAmount("");
    setShowAdd(false);
  };

  return (
    <div className="card-custom p-3 mb-3 bg-white border">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="fw-bold" style={{ fontSize: "13px" }}>
          ☕ চা স্টলের দৈনিক খরচ (দুধ, চিনি, গ্যাস)
        </span>
        <button
          className="btn btn-sm btn-custom-primary py-0 px-2"
          style={{ fontSize: "11px" }}
          onClick={() => setShowAdd(!showAdd)}
        >
          {showAdd ? "বাতিল" : "+ খরচ লিখুন"}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="p-2 border rounded bg-light mb-2">
          <div className="row g-2 mb-2">
            <div className="col-5">
              <select className="form-select form-select-sm" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="দুধ">দুধ</option>
                <option value="চিনি/পাতা">চিনি ও পাতা</option>
                <option value="গ্যাস">গ্যাস সিলিন্ডার</option>
                <option value="নাস্তা/বিস্কুট">নাস্তা ক্রয়</option>
                <option value="অন্যান্য">অন্যান্য</option>
              </select>
            </div>
            <div className="col-4">
              <input
                type="number"
                placeholder="টাকা ৳"
                className="form-control form-control-sm"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="col-3">
              <button type="submit" className="btn btn-sm btn-success w-100">সেভ</button>
            </div>
          </div>
          <input
            type="text"
            placeholder="বিবরণ (ঐচ্ছিক, যেমন: ৪ লিটার তরল দুধ)"
            className="form-control form-control-sm"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </form>
      )}

      {filteredExpenses.length === 0 ? (
        <div className="text-muted text-center py-2" style={{ fontSize: "11px" }}>
          এই তারিখে কোনো খরচ লেখা হয়নি
        </div>
      ) : (
        <div className="table-responsive" style={{ maxHeight: "150px" }}>
          <table className="table table-sm mb-0" style={{ fontSize: "12px" }}>
            <tbody>
              {filteredExpenses.map(exp => (
                <tr key={exp.id}>
                  <td>
                    <strong>[{exp.category}]</strong> {exp.title}
                  </td>
                  <td className="text-end text-danger fw-bold">৳{exp.amount}</td>
                  <td style={{ width: "30px" }} className="text-end">
                    <i
                      className="bi bi-x-circle text-danger pointer"
                      onClick={() => removeExpense(exp.id)}
                    ></i>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center pt-2 mt-1 border-top" style={{ fontSize: "12px" }}>
        <span>দিনের মোট খরচ:</span>
        <span className="fw-bold text-danger">৳{totalExpenseToday}</span>
      </div>
    </div>
  );
}
