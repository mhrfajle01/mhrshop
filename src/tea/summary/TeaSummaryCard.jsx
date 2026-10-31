import React from "react";

export default function TeaSummaryCard({ title, amount, icon, bgClass, subtext }) {
  return (
    <div className="card-custom p-3 d-flex align-items-center gap-3 mb-2">
      <div className={`rounded-circle d-flex align-items-center justify-content-center ${bgClass}`} style={{ width: "42px", height: "42px" }}>
        <i className={`bi ${icon} fs-5`}></i>
      </div>
      <div className="flex-grow-1">
        <div className="text-muted" style={{ fontSize: "12px" }}>{title}</div>
        <div className="fw-bold" style={{ fontSize: "16px" }}>৳{amount}</div>
        {subtext && <small className="text-muted" style={{ fontSize: "11px" }}>{subtext}</small>}
      </div>
    </div>
  );
}
