import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "../context/RouterContext";

export default function Login() {
  const { login, isLocalMode } = useAuth();
  const { navigateTo } = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("অনুগ্রহ করে ইমেইল এবং পাসওয়ার্ড উভয়ই প্রদান করুন।");
      return;
    }

    try {
      setError("");
      setLoading(true);
      const res = await login(email, password);
      setLoading(false);
      if (!res.success) {
        setError(res.error || "লগইন করতে ব্যর্থ হয়েছে।");
      } else {
        navigateTo("/");
      }
    } catch (err) {
      setLoading(false);
      setError("একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। আবার চেষ্টা করুন।");
    }
  };

  return (
    <div className="main-content d-flex flex-column justify-content-center align-items-center py-5" style={{ minHeight: "calc(100vh - 64px)" }}>
      <div className="w-100 text-center mb-4">
        <div className="bg-success text-white d-inline-flex align-items-center justify-content-center rounded-circle p-3 mb-2" style={{ width: "64px", height: "64px" }}>
          <i className="bi bi-shop-window fs-2"></i>
        </div>
        <h2 className="fw-bold text-success font-monospace">Shop Khata Pro</h2>
        <p className="text-muted fs-7">সহজ ডিজিটাল হিসাব খাতা ও ক্যাশ ক্যাশিয়ার সিস্টেম</p>
      </div>

      <div className="card-custom w-100 shadow-sm border border-light p-4" style={{ maxWidth: "420px" }}>
        <h3 className="h5 text-center mb-4 font-monospace">User Login</h3>
        
        {error && (
          <div className="alert alert-danger py-2 fs-7 mb-3" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label text-muted fs-7 font-monospace">Email Address</label>
            <input 
              type="email" 
              className="form-control form-control-lg fs-6" 
              placeholder="যেমন: name@shop.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
            <div className="form-text text-muted fs-8">অ্যাকাউন্টের জন্য ব্যবহৃত ইমেইল আইডি দিন।</div>
          </div>

          <div className="mb-4">
            <div className="d-flex justify-content-between">
              <label className="form-label text-muted fs-7 font-monospace">Password</label>
              <button 
                type="button" 
                className="btn btn-link p-0 text-decoration-none fs-8 text-success font-monospace"
                onClick={() => navigateTo("/forgot-password")}
                tabIndex="-1"
              >
                Forgot Password?
              </button>
            </div>
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                className="form-control form-control-lg fs-6" 
                placeholder="পাসওয়ার্ড লিখুন"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                <i className={showPassword ? "bi bi-eye-slash-fill" : "bi bi-eye-fill"}></i>
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-custom btn-custom-primary w-100 btn-lg text-uppercase font-monospace"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Logging in...
              </>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right"></i> Login
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-4">
          <p className="text-muted fs-7">
            নতুন ইউজার?{" "}
            <button 
              className="btn btn-link p-0 text-decoration-none fw-bold text-success font-monospace"
              onClick={() => navigateTo("/register")}
            >
              Register Shop
            </button>
          </p>
        </div>
      </div>

      {isLocalMode && (
        <div className="alert alert-warning border-warning-subtle text-dark fs-8 p-3 rounded-3 mt-3 w-100" style={{ maxWidth: "420px" }}>
          <i className="bi bi-info-circle-fill me-2 text-warning fs-6"></i>
          <strong>স্থানীয় মোড সক্রিয় (Offline Sandbox):</strong> ক্লাউড এনভায়রনমেন্ট কনফিগারেশন অনুপস্থিত থাকায় অ্যাপটি ডেমো মোডে চলবে। আপনার সকল ডাটা ব্রাউজারের লোকালাইজড মেমরিতে নিরাপদে থাকবে। সিঙ্ক করতে সেটিংস থেকে ফায়ারবেস ইন্টিগ্রেট করুন।
        </div>
      )}
    </div>
  );
}
