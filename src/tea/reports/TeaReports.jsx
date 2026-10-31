import React, { useState } from "react";
import TeaDailySummary from "../summary/TeaDailySummary";
import TeaCreditList from "./TeaCreditList";

export default function TeaReports() {
  const [tab, setTab] = useState("summary");

  return (
    <div className="p-2">
      <div className="btn-group w-100 mb-2" role="group">
        <button
          className={`btn btn-sm ${tab === "summary" ? "btn-success" : "btn-outline-secondary"}`}
          onClick={() => setTab("summary")}
        >
          দৈনিক হিসাব
        </button>
        <button
          className={`btn btn-sm ${tab === "credit" ? "btn-success" : "btn-outline-secondary"}`}
          onClick={() => setTab("credit")}
        >
          বাকি তালিকা
        </button>
      </div>

      {tab === "summary" && <TeaDailySummary />}
      {tab === "credit" && <TeaCreditList />}
    </div>
  );
}
