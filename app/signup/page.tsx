"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faEnvelope, faLock, faKey } from "@fortawesome/free-solid-svg-icons";
import { AuthProvider } from "../context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    companyAddress: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (res.ok) {
      alert("✅ Registration successful!");
      router.push("/login");
    } else {
      alert(data.error || "Registration failed");
    }
  };

  return (
    <>
      {/* <AuthProvider skipRedirect> */}


        <section className="vh-80 container-fluid" style={{ backgroundColor: "#eee" }}>
          <div className="container h-100">
            <div className="row d-flex justify-content-center align-items-center h-100">
              <div className="col-lg-12 col-xl-12">
                <div className="card text-black" style={{ borderRadius: "25px" }}>
                  <div className="card-body p-md-5">
                    <div className="row justify-content-center">
                      <div className="col-md-10 col-lg-6 col-xl-5 order-2 order-lg-1">
                        <p className="text-center h1 fw-bold mb-5 mx-1 mx-md-4 mt-4">Sign Up</p>
                        <form className="mx-1 mx-md-4" onSubmit={handleRegister}>
                          {/* First Name */}
                          <div className="d-flex flex-row align-items-center mb-4">
                            <FontAwesomeIcon icon={faUser} className="me-3 fa-fw" />
                            <div className="form-outline flex-fill mb-0">
                              <input
                                type="text"
                                name="firstName"
                                className="form-control"
                                placeholder="First Name"
                                value={form.firstName}
                                onChange={handleChange}
                                required
                              />
                            </div>
                          </div>

                          {/* Last Name */}
                          <div className="d-flex flex-row align-items-center mb-4">
                            <FontAwesomeIcon icon={faUser} className="me-3 fa-fw" />
                            <div className="form-outline flex-fill mb-0">
                              <input
                                type="text"
                                name="lastName"
                                className="form-control"
                                placeholder="Last Name"
                                value={form.lastName}
                                onChange={handleChange}
                                required
                              />
                            </div>
                          </div>

                          {/* Company Name */}
                          <div className="d-flex flex-row align-items-center mb-4">
                            <FontAwesomeIcon icon={faEnvelope} className="me-3 fa-fw" />
                            <div className="form-outline flex-fill mb-0">
                              <input
                                type="text"
                                name="companyName"
                                className="form-control"
                                placeholder="Company Name"
                                value={form.companyName}
                                onChange={handleChange}
                                required
                              />
                            </div>
                          </div>

                          {/* Company Address */}
                          <div className="d-flex flex-row align-items-center mb-4">
                            <FontAwesomeIcon icon={faEnvelope} className="me-3 fa-fw" />
                            <div className="form-outline flex-fill mb-0">
                              <input
                                type="text"
                                name="companyAddress"
                                className="form-control"
                                placeholder="Company Address"
                                value={form.companyAddress}
                                onChange={handleChange}
                                required
                              />
                            </div>
                          </div>

                          {/* Phone */}
                          <div className="d-flex flex-row align-items-center mb-4">
                            <FontAwesomeIcon icon={faUser} className="me-3 fa-fw" />
                            <div className="form-outline flex-fill mb-0">
                              <input
                                type="tel"
                                name="phone"
                                className="form-control"
                                placeholder="Phone"
                                value={form.phone}
                                onChange={handleChange}
                                required
                              />
                            </div>
                          </div>

                          {/* Email */}
                          <div className="d-flex flex-row align-items-center mb-4">
                            <FontAwesomeIcon icon={faEnvelope} className="me-3 fa-fw" />
                            <div className="form-outline flex-fill mb-0">
                              <input
                                type="email"
                                name="email"
                                className="form-control"
                                placeholder="Email"
                                value={form.email}
                                onChange={handleChange}
                                required
                              />
                            </div>
                          </div>

                          {/* Password */}
                          <div className="d-flex flex-row align-items-center mb-4">
                            <FontAwesomeIcon icon={faLock} className="me-3 fa-fw" />
                            <div className="form-outline flex-fill mb-0">
                              <input
                                type="password"
                                name="password"
                                className="form-control"
                                placeholder="Password"
                                value={form.password}
                                onChange={handleChange}
                                required
                              />
                            </div>
                          </div>

                          {/* Confirm Password */}
                          <div className="d-flex flex-row align-items-center mb-4">
                            <FontAwesomeIcon icon={faKey} className="me-3 fa-fw" />
                            <div className="form-outline flex-fill mb-0">
                              <input
                                type="password"
                                name="confirmPassword"
                                className="form-control"
                                placeholder="Confirm Password"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                required
                              />
                            </div>
                          </div>

                          {/* Terms Checkbox */}
                          <div className="form-check d-flex justify-content-center mb-5">
                            <input
                              className="form-check-input me-2"
                              type="checkbox"
                              value=""
                              id="termsCheck"
                              required
                            />
                            <label className="form-check-label" htmlFor="termsCheck">
                              I agree all statements in <a href="#!">Terms of service</a>
                            </label>
                          </div>

                          {/* Register Button */}
                          <div className="d-flex justify-content-center mx-4 mb-3 mb-lg-4">
                            <button type="submit" className="btn btn-primary btn-lg">
                              Register
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* Right Image */}
                      <div className="col-md-10 col-lg-6 col-xl-7 d-flex align-items-center order-1 order-lg-2">
                        <img
                          src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-registration/draw1.webp"
                          className="img-fluid"
                          alt="Signup illustration"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      {/* </AuthProvider> */}
    </>
  );
}
