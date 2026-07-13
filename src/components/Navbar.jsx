import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "../context/RouterContext";

export default function Navbar() {
  const { currentUser, logout, isLocalMode } = useAuth();
  const { navigateTo } = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  if (!currentUser) return null;

  const handleNavigate = (path) => {
    setDropdownOpen(false);
    navigateTo(path);
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
  };

  return (
    <header className="app-header d-flex justify-content-between align-items-center no-print">
      <div 
        className="d-flex align-items-center gap-2 cursor-pointer" 
        onClick={() => handleNavigate("/")}
        style={{ cursor: "pointer" }}
      >
        <i className="bi bi-shop-window fs-4 text-success"></i>
        <div>
          <h1 className="h6 m-0 text-success font-monospace fw-bold">Shop Khata Pro</h1>
          <small className="fs-8 text-muted">{currentUser.displayName}</small>
        </div>
      </div>
      
      <div className="d-flex align-items-center gap-2">
        {/* Connection status indicator */}
        {isLocalMode ? (
          <span 
            className="badge bg-warning text-dark d-flex align-items-center gap-1 badge-custom"
            title="ডাটা শুধুমাত্র লোকাল ব্রাউজারে সংরক্ষিত হচ্ছে।"
            style={{ cursor: "help" }}
          >
            <i className="bi bi-cloud-slash-fill"></i>
            <span className="d-none d-sm-inline">Offline (Local)</span>
          </span>
        ) : !isOnline ? (
          <span 
            className="badge bg-danger text-white d-flex align-items-center gap-1 badge-custom"
            title="ইন্টারনেট নেই! ডাটা লোকাল মেমরিতে সেভ হচ্ছে এবং নেট আসলে অটো-সিঙ্ক হবে।"
            style={{ cursor: "help" }}
          >
            <i className="bi bi-wifi-off"></i>
            <span className="d-none d-sm-inline">Offline (Auto-Sync)</span>
          </span>
        ) : (
          <span 
            className="badge bg-success text-white d-flex align-items-center gap-1 badge-custom"
            title="ডাটা ক্লাউডে সুরক্ষিতভাবে সিঙ্ক হচ্ছে।"
          >
            <i className="bi bi-cloud-check-fill"></i>
            <span className="d-none d-sm-inline">Synced</span>
          </span>
        )}

        {/* User profile dropdown button */}
        <div className="dropdown">
          <button 
            className="btn btn-sm btn-link text-secondary p-0 border-0 dropdown-toggle d-flex align-items-center gap-1"
            type="button" 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-expanded={dropdownOpen}
          >
            <i className="bi bi-person-circle fs-5 text-dark"></i>
          </button>
          
          <ul 
            className={`dropdown-menu dropdown-menu-end shadow border-0 mt-2 ${dropdownOpen ? "show" : ""}`}
            style={{ 
              display: dropdownOpen ? "block" : "none",
              position: "absolute",
              right: 0,
              zIndex: 1050
            }}
          >
            <li className="px-3 py-2 border-bottom">
              <div className="fw-bold text-dark">{currentUser.displayName}</div>
              <small className="text-muted text-break">{currentUser.email}</small>
            </li>
            <li>
              <button 
                className="dropdown-item py-2 d-flex align-items-center gap-2 text-dark" 
                onClick={() => handleNavigate("/settings")}
              >
                <i className="bi bi-gear text-secondary"></i> Settings
              </button>
            </li>
            <li>
              <hr className="dropdown-divider my-1" />
            </li>
            <li>
              <button 
                className="dropdown-item py-2 text-danger d-flex align-items-center gap-2" 
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-right"></i> Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
