import React, { useState } from "react";

export default function TeaCashDrawerGuide({ date, todayCashSales, todayExpenses }) {
  const [openingFloat, setOpeningFloat] = useState(() => {
    return Number(localStorage.getItem(`tea_opening_float_${date}`) || 0);
  });

  const handleFloatChange = (val) => {
    const num = Number(val || 0);
    setOpeningFloat(num);
    localStorage.setItem(`tea_opening_float_${date}`, num.toString());
  };

  const expectedDrawerCash = openingFloat + todayCashSales - todayExpenses;
  const todayProfit = todayCashSales - todayExpenses;

  return (
    <div className="card-custom p-3 mb-3 bg-white border">
      <div className="fw-bold mb-2" style={{ fontSize: "13px" }}>
        💵 ক্যাশ ড্রয়ার মিলকরণ (Cash Drawer Balance)
      </div>

      <div className="input-group input-group-sm mb-2">
        <span className="input-group-text" style={{ fontSize: "12px" }}>সকালের ভাঙতি ক্যাশ:</span>
        <input
          type="number"
          className="form-control"
          placeholder="যেমন: ৫০০"
          value={openingFloat || ""}
          onChange={e => handleFloatChange(e.target.value)}
        />
      </div>

      <div className="p-2 border rounded bg-light" style={{ fontSize: "12px" }}>
        <div className="d-flex justify-content-between mb-1">
          <span>(+) সকালের ভাঙতি টাকা:</span>
          <span>৳{openingFloat}</span>
        </div>
        <div className="d-flex justify-content-between mb-1 text-success">
          <span>(+) সারাদিনের নগদ বিক্রি:</span>
          <span>+ ৳{todayCashSales}</span>
        </div>
        <div className="d-flex justify-content-between mb-1 text-danger">
          <span>(-) চা পাতার/দুধের খরচ:</span>
          <span>- ৳{todayExpenses}</span>
        </div>
        <hr className="my-1" />
        <div className="d-flex justify-content-between fw-bold text-primary">
          <span>রাতের ড্রয়ারে নগদ ক্যাশ থাকা লাগবে:</span>
          <span style={{ fontSize: "14px" }}>৳{expectedDrawerCash}</span>
        </div>
      </div>

      <div className="mt-2 text-center" style={{ fontSize: "12px" }}>
        আজকের চা স্টল নিট লাভ:{" "}
        <strong className={todayProfit >= 0 ? "text-success" : "text-danger"}>
          ৳{todayProfit}
        </strong>
      </div>
    </div>
  );
}
