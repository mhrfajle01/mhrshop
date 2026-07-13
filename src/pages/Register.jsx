import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "../context/RouterContext";

export default function Register() {
  const { register } = useAuth();
  const { navigateTo } = useRouter();

  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!shopName || !email || !password || !confirmPassword) {
      setError("অনুগ্রহ করে সকল ঘর পূরণ করুন।");
      return;
    }

    if (password.length < 6) {
      setError("পাসওয়ার্ড অবশ্যই কমপক্ষে ৬ অক্ষরের হতে হবে।");
      return;
    }

    if (password !== confirmPassword) {
      setError("উভয় পাসওয়ার্ড মিলছে না। অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।");
      return;
    }

    try {
      setLoading(true);
      const res = await register(email, password, shopName);
      setLoading(false);
      if (!res.success) {
        setError(res.error || "রেজিস্ট্রেশন সম্পূর্ণ করতে ব্যর্থ হয়েছে।");
      } else {
        navigateTo("/");
      }
    } catch (err) {
      setLoading(false);
      setError("রেজিস্ট্রেশন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    }
  };

  return (
    <div className="main-content d-flex flex-column justify-content-center align-items-center py-5" style={{ minHeight: "calc(100vh - 64px)" }}>
      <div className="w-100 text-center mb-4">
        <h2 className="fw-bold text-success font-monospace">Shop Khata Pro</h2>
        <p className="text-muted fs-7">সহজেই অ্যাকাউন্ট খুলে ডিজিটাল খাতা ব্যবহার শুরু করুন</p>
      </div>

      <div className="card-custom w-100 shadow-sm border border-light p-4" style={{ maxWidth: "420px" }}>
        <h3 className="h5 text-center mb-4 font-monospace">Register Shop</h3>
        
        {error && (
          <div className="alert alert-danger py-2 fs-7 mb-3" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label text-muted fs-7 font-monospace">Shop Name</label>
            <input 
              type="text" 
              className="form-control fs-6" 
              placeholder="যেমন: ভাই ভাই স্টোর"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              disabled={loading}
              required
            />
            <div className="form-text text-muted fs-8">রসিদ ও চালানে এই নামটি প্রদর্শিত হবে।</div>
          </div>

          <div className="mb-3">
            <label className="form-label text-muted fs-7 font-monospace">Email Address</label>
            <input 
              type="email" 
              className="form-control fs-6" 
              placeholder="যেমন: name@shop.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
            <div className="form-text text-muted fs-8">লগইন করতে এবং ডাটা সুরক্ষায় এটি ব্যবহৃত হবে।</div>
          </div>

          <div className="mb-3">
            <label className="form-label text-muted fs-7 font-monospace">Password</label>
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                className="form-control fs-6" 
                placeholder="কমপক্ষে ৬ সংখ্যার পাসওয়ার্ড"
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

          <div className="mb-4">
            <label className="form-label text-muted fs-7 font-monospace">Confirm Password</label>
            <div className="password-input-wrapper">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                className="form-control fs-6" 
                placeholder="পাসওয়ার্ডটি আবার লিখুন"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex="-1"
              >
                <i className={showConfirmPassword ? "bi bi-eye-slash-fill" : "bi bi-eye-fill"}></i>
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
                Registering...
              </>
            ) : (
              <>
                <i className="bi bi-person-plus"></i> Register
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-4">
          <p className="text-muted fs-7">
            ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
            <button 
              className="btn btn-link p-0 text-decoration-none fw-bold text-success font-monospace"
              onClick={() => navigateTo("/login")}
            >
              Login Here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
