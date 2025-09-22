"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Navbar() {
    const [loggedIn, setLoggedIn] = useState(false);
    const router = useRouter();

    // Check if user is logged in
    useEffect(() => {
        const token = localStorage.getItem("token");
        setLoggedIn(!!token);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        setLoggedIn(false);
        router.push("/login");
    };

    return (
        <nav className="navbar navbar-expand-lg bg-body-tertiary">
            <div className="container-fluid">
                <Link className="navbar-brand" href="/">Avaali Chatbot</Link>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        <li className="nav-item">
                            <Link className="nav-link" href="/">Home</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" href="/about">About</Link>
                        </li>
                    </ul>
                    <div className="d-flex">
                        {!loggedIn ? (
                            <>
                                <Link href="/login" className="btn btn-outline-primary me-2">Login</Link>
                                <Link href="/signup" className="btn btn-primary">Signup</Link>
                            </>
                        ) : (
                            <button onClick={handleLogout} className="btn btn-danger">Logout</button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
