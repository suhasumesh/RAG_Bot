"use client";
import { useState } from "react";
import { AuthProvider } from "../context/AuthContext";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/users/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) setAlert({ type: "success", message: data.message });
      else setAlert({ type: "error", message: data.error });
    } catch (err) {
      setAlert({ type: "error", message: "Server error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthProvider skipRedirect>

    
    <form onSubmit={handleSendOTP}>
      <h3>Forgot Password</h3>
      {alert && <div className={`alert ${alert.type === "success" ? "alert-success" : "alert-danger"}`}>{alert.message}</div>}
      <input type="email" placeholder="Enter your registered email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <button type="submit" disabled={loading}>{loading ? "Sending OTP..." : "Send OTP"}</button>
    </form>
    </AuthProvider>
  );
}
