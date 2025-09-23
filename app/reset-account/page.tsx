"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token") || "";

    const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
    const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [tokenValid, setTokenValid] = useState<boolean | null>(null);

    // Verify token on page load
    useEffect(() => {
        if (!token) {
            setTokenValid(false);
            setAlert({ type: "error", message: "No token provided" });
            return;
        }

        const verifyToken = async () => {
            try {
                const res = await fetch("/api/auth/users/verify-reset-token", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                });
                const data = await res.json();
                setTokenValid(data.valid);
                if (!data.valid) setAlert({ type: "error", message: data.error });
            } catch {
                setTokenValid(false);
                setAlert({ type: "error", message: "Server error. Please try again later." });
            }
        };

        verifyToken();
    }, [token]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAlert(null);

        if (form.newPassword !== form.confirmPassword) {
            setAlert({ type: "error", message: "Passwords do not match" });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/auth/users/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword: form.newPassword }),
            });
            const data = await res.json();

            if (res.ok) {
                setAlert({ type: "success", message: "Password reset successful. Redirecting to login..." });
                setTimeout(() => router.push("/login"), 3000);
            } else {
                setAlert({ type: "error", message: data.error || "Something went wrong" });
            }
        } catch {
            setAlert({ type: "error", message: "Server error. Please try again later." });
        } finally {
            setLoading(false);
        }
    };

    if (tokenValid === null) return <div className="alert alert-warning" role="alert"> Loading...</div>;
    if (!tokenValid) return <div className="alert alert-warning" role="alert">
        {alert?.message || "Invalid or expired token."}
    </div>

    return (
        <section className="vh-100">
            <div className="container-fluid h-custom">
                <div className="row d-flex justify-content-center align-items-center h-100">
                    {/* Image side */}
                    <div className="col-md-9 col-lg-6 col-xl-5">
                        <img
                            src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/draw2.webp"
                            className="img-fluid"
                            alt="Sample image"
                        />
                    </div>

                    {/* Form side */}
                    <div className="col-md-8 col-lg-6 col-xl-4 offset-xl-1">
                        <form onSubmit={handleSubmit}>
                            {alert && (
                                <div
                                    className={`alert ${alert.type === "success"
                                        ? "alert-success"
                                        : alert.type === "error"
                                            ? "alert-danger"
                                            : "alert-primary"
                                        }`}
                                    role="alert"
                                >
                                    {alert.message}
                                </div>
                            )}

                            <h3 className="mb-4">Reset Password</h3>

                            <div className="form-outline mb-4">
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={form.newPassword}
                                    onChange={handleChange}
                                    className="form-control form-control-lg"
                                    placeholder="New Password"
                                    required
                                />
                                <label className="form-label">New Password</label>
                            </div>

                            <div className="form-outline mb-4">
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    className="form-control form-control-lg"
                                    placeholder="Confirm Password"
                                    required
                                />
                                <label className="form-label">Confirm Password</label>
                            </div>

                            <div className="text-center text-lg-start mt-4 pt-2">
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-lg"
                                    style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
                                    disabled={loading}
                                >
                                    {loading ? "Submitting..." : "Reset Password"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .h-custom {
          height: calc(100% - 73px);
        }
        @media (max-width: 450px) {
          .h-custom {
            height: 100%;
          }
        }
      `}</style>
        </section>
    );
}
