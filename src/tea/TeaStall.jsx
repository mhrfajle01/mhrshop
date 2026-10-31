import React, { useState } from "react";
import { TeaProvider } from "./context/TeaContext";
import TeaPOS from "./pos/TeaPOS";
import TeaMenuList from "./menu/TeaMenuList";
import TeaMaterialsList from "./materials/TeaMaterialsList";
import TeaReports from "./reports/TeaReports";

function TeaStallContent() {
  const [activeTab, setActiveTab] = useState("pos");

  const navItems = [
    { id: "pos", label: "POS", icon: "bi-cup-hot-fill" },
    { id: "menu", label: "মেনু", icon: "bi-list-ul" },
    { id: "materials", label: "কাঁচামাল", icon: "bi-box-seam" },
    { id: "reports", label: "রিপোর্ট", icon: "bi-graph-up" }
  ];

  return (
    <div className="main-content p-2" style={{ maxWidth: "480px", margin: "0 auto" }}>
      {/* Top 4 Tab Navigation */}
      <div className="d-flex border-bottom bg-white rounded-top shadow-sm mb-2 overflow-auto">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`btn flex-grow-1 py-2 fw-semibold border-0 rounded-0 text-nowrap ${
              activeTab === item.id ? "text-success border-bottom border-success border-3" : "text-muted"
            }`}
            style={{ fontSize: "12px", padding: "6px 8px" }}
            onClick={() => setActiveTab(item.id)}
          >
            <i className={`bi ${item.icon} me-1`}></i> {item.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === "pos" && <TeaPOS />}
      {activeTab === "menu" && <TeaMenuList />}
      {activeTab === "materials" && <TeaMaterialsList />}
      {activeTab === "reports" && <TeaReports />}
    </div>
  );
}

export default function TeaStall() {
  return (
    <TeaProvider>
      <TeaStallContent />
    </TeaProvider>
  );
}
