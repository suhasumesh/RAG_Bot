"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebookF, faTwitter, faLinkedinIn, faGoogle } from "@fortawesome/free-brands-svg-icons";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [alert, setAlert] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        setAlert({ type: "success", message: "Login successful! Redirecting..." });
        router.push("/chatbot");
        setTimeout(() => window.location.reload(), 1000);
      } else {
        // Handle different error messages from backend
        let msg = data.error || "Login failed";
        if (msg.includes("locked")) msg = "Your account is locked. Please check your email or contact admin.";
        if (msg.includes("approve")) msg = "Your account is pending admin approval.";
        setAlert({ type: "error", message: msg });
      }
    } catch (err) {
      setAlert({ type: "error", message: "Server error. Please try again later." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
              <form onSubmit={handleLogin}>
                {/* Alert box */}
                {alert && (
                  <div
                    className={`alert ${
                      alert.type === "success"
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

                {/* Social login buttons */}
                <div className="d-flex flex-row align-items-center justify-content-center justify-content-lg-start">
                  <p className="lead fw-normal mb-0 me-3">Sign in with</p>
                  <button type="button" className="btn btn-primary btn-floating mx-1">
                    <FontAwesomeIcon icon={faFacebookF} />
                  </button>
                  <button type="button" className="btn btn-primary btn-floating mx-1">
                    <FontAwesomeIcon icon={faGoogle} />
                  </button>
                  <button type="button" className="btn btn-primary btn-floating mx-1">
                    <FontAwesomeIcon icon={faLinkedinIn} />
                  </button>
                </div>

                <div className="divider d-flex align-items-center my-4">
                  <p className="text-center fw-bold mx-3 mb-0">Or</p>
                </div>

                {/* Email input */}
                <div className="form-outline mb-4">
                  <input
                    type="email"
                    id="form3Example3"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="form-control form-control-lg"
                    placeholder="Enter a valid email address"
                    required
                  />
                  <label className="form-label" htmlFor="form3Example3">
                    Email address
                  </label>
                </div>

                {/* Password input */}
                <div className="form-outline mb-3">
                  <input
                    type="password"
                    id="form3Example4"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="form-control form-control-lg"
                    placeholder="Enter password"
                    required
                  />
                  <label className="form-label" htmlFor="form3Example4">
                    Password
                  </label>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="form-check mb-0">
                    <input
                      className="form-check-input me-2"
                      type="checkbox"
                      value=""
                      id="rememberMe"
                    />
                    <label className="form-check-label" htmlFor="rememberMe">
                      Remember me
                    </label>
                  </div>
                  <a href="#!" className="text-body">
                    Forgot password?
                  </a>
                </div>

                {/* Submit button */}
                <div className="text-center text-lg-start mt-4 pt-2">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Login"}
                  </button>
                  <p className="small fw-bold mt-2 pt-1 mb-0">
                    Don't have an account?{" "}
                    <a href="/signup" className="link-danger">
                      Register
                    </a>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .divider:after,
        .divider:before {
          content: "";
          flex: 1;
          height: 1px;
          background: #eee;
        }
        .h-custom {
          height: calc(100% - 73px);
        }
        @media (max-width: 450px) {
          .h-custom {
            height: 100%;
          }
        }
      `}</style>
    </>
  );
}
