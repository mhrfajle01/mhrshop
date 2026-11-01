import React from "react";
import { useRouter } from "../context/RouterContext";
import { useAuth } from "../context/AuthContext";

export default function BottomNav() {
  const { currentUser } = useAuth();
  const { currentView, navigateTo } = useRouter();

  if (!currentUser) return null;

  return (
    <nav className="bottom-nav no-print">
      <div 
        className={`bottom-nav-item ${currentView === "dashboard" ? "active" : ""}`}
        onClick={() => navigateTo("/")}
      >
        <i className="bi bi-grid-1x2-fill"></i>
        <span>Dashboard</span>
      </div>

      <div 
        className={`bottom-nav-item ${currentView === "sales" || currentView === "sales-new" ? "active" : ""}`}
        onClick={() => navigateTo("/sales")}
      >
        <i className="bi bi-cart-fill"></i>
        <span>Sales</span>
      </div>

      <div 
        className={`bottom-nav-item ${currentView === "day-close" ? "active text-warning" : ""}`}
        onClick={() => navigateTo("/day-close")}
      >
        <i className="bi bi-moon-stars-fill"></i>
        <span>Day Close</span>
      </div>

      <div 
        className={`bottom-nav-item ${currentView === "tea-stall" ? "active" : ""}`}
        onClick={() => navigateTo("/tea-stall")}
      >
        <i className="bi bi-cup-hot-fill"></i>
        <span>চা স্টল</span>
      </div>

      <div 
        className={`bottom-nav-item ${currentView === "products" || currentView === "categories" ? "active" : ""}`}
        onClick={() => navigateTo("/products")}
      >
        <i className="bi bi-box-seam-fill"></i>
        <span>Products</span>
      </div>

      <div 
        className={`bottom-nav-item ${currentView === "khata" ? "active" : ""}`}
        onClick={() => navigateTo("/khata")}
      >
        <i className="bi bi-book-fill"></i>
        <span>Khata</span>
      </div>

      <div 
        className={`bottom-nav-item ${currentView === "capital-assets" ? "active text-success" : ""}`}
        onClick={() => navigateTo("/capital-assets")}
      >
        <i className="bi bi-bank2"></i>
        <span>মূলধন</span>
      </div>

      <div 
        className={`bottom-nav-item ${currentView === "reports" ? "active" : ""}`}
        onClick={() => navigateTo("/reports")}
      >
        <i className="bi bi-graph-up-arrow"></i>
        <span>Reports</span>
      </div>
    </nav>
  );
}
