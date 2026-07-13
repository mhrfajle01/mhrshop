import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "../context/RouterContext";

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const { navigateTo } = useRouter();

  const [email, setEmail] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email) {
      setErrorMsg("অনুগ্রহ করে আপনার ইমেইল প্রদান করুন।");
      return;
    }

    try {
      setLoading(true);
      const res = await resetPassword(email);
      setLoading(false);
      if (res.success) {
        setSuccessMsg(res.message || "পাসওয়ার্ড পুনরায় সেট করার লিংক আপনার ইমেইলে প্রেরণ করা হয়েছে। অনুগ্রহ করে ইমেইল ইনবক্স (অথবা স্প্যাম ফোল্ডার) চেক করুন।");
      } else {
        setErrorMsg(res.error || "পাসওয়ার্ড রিসেট রিকোয়েস্ট ব্যর্থ হয়েছে।");
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg("সার্ভারে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।");
    }
  };

  return (
    <div className="main-content d-flex flex-column justify-content-center align-items-center py-5" style={{ minHeight: "calc(100vh - 64px)" }}>
      <div className="card-custom w-100 shadow-sm border border-light p-4" style={{ maxWidth: "420px" }}>
        <h3 className="h5 text-center mb-2 font-monospace">Reset Password</h3>
        <p className="text-muted text-center fs-7 mb-4">আপনার নিবন্ধিত ইমেইলে পাসওয়ার্ড রি-সেট করার লিংক পাঠানো হবে</p>
        
        {errorMsg && (
          <div className="alert alert-danger py-2 fs-7 mb-3 text-center" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success py-3 fs-7 mb-3 text-start" role="alert">
            <i className="bi bi-check-circle-fill me-2 fs-6"></i>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="form-label text-muted fs-7 font-monospace">Registered Email Address</label>
            <input 
              type="email" 
              className="form-control fs-6" 
              placeholder="যেমন: name@shop.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-custom btn-custom-primary w-100 btn-lg text-uppercase font-monospace mb-3"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Sending...
              </>
            ) : (
              <>
                <i className="bi bi-envelope-send"></i> Send Reset Link
              </>
            )}
          </button>
        </form>

        <button 
          className="btn btn-custom btn-custom-secondary w-100 font-monospace text-uppercase"
          onClick={() => navigateTo("/login")}
        >
          <i className="bi bi-arrow-left"></i> Back to Login
        </button>
      </div>
    </div>
  );
}
