"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Table, Spinner, Button, Alert } from "react-bootstrap";

interface User {
    _id: string;
    email: string;
    role: string;
    isAdminApproved: boolean;
    createdAt: string;
}

export default function AdminDashboard() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    useEffect(() => {
        // Check role
        const role = localStorage.getItem("role");
        const token = localStorage.getItem("token"); // user JWT token
        if (!token || role !== "admin") {
            router.replace("/login"); // redirect non-admin users
            return;
        }

        // Fetch users
        const fetchUsers = async () => {
            try {
                const res = await fetch("/api/admin/users", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error("Failed to fetch users");
                const data = await res.json();
                setUsers(data);
            } catch (err: any) {
                setError(err.message || "Failed to load users");
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [router]);

    const toggleApproval = async (userId: string, approve: boolean) => {
        setError(null);
        setSuccessMsg(null);
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const res = await fetch(`/api/admin/users/${userId}/approve`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ approve }),
            });

            if (!res.ok) throw new Error("Failed to update user");

            const updatedUser = await res.json();
            setUsers((prev) =>
                prev.map((u) => (u._id === userId ? updatedUser : u))
            );

            setSuccessMsg(
                approve ? "User approved successfully" : "User access revoked"
            );
        } catch (err: any) {
            setError(err.message || "Failed to update user");
        }
    };

    if (loading)
        return (
            <div className="d-flex justify-content-center align-items-center p-4">
                <Spinner animation="border" />
            </div>
        );

    return (
        <div className="container py-4">
            <h3 className="mb-4">Admin Dashboard - User Management</h3>

            {error && <Alert variant="danger">{error}</Alert>}
            {successMsg && <Alert variant="success">{successMsg}</Alert>}
    {/* // Inside your AdminDashboard component, above or below the table */}

            <Button
                className="mb-3"
                variant="primary"
                onClick={async () => {
                    setError(null);
                    setSuccessMsg(null);
                    const token = localStorage.getItem("token");
                    if (!token) return;

                    try {
                        const res = await fetch("/api/admin/users/export", {
                            method: "POST",
                            headers: { Authorization: `Bearer ${token}` },
                        });

                        if (!res.ok) throw new Error("Failed to export user data");

                        setSuccessMsg("User data exported and sent to admin email successfully!");
                    } catch (err: any) {
                        setError(err.message || "Failed to export user data");
                    }
                }}
            >
                Export User Data
            </Button>

            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Approved</th>
                        <th>Created At</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user._id}>
                            <td>{user.email}</td>
                            <td>{user.role}</td>
                            <td>{user.isAdminApproved ? "Yes" : "No"}</td>
                            <td>{new Date(user.createdAt).toLocaleString()}</td>
                            <td>
                                <Button
                                    size="sm"
                                    variant={user.isAdminApproved ? "danger" : "success"}
                                    onClick={() =>
                                        toggleApproval(user._id, !user.isAdminApproved)
                                    }
                                >
                                    {user.isAdminApproved ? "Revoke Access" : "Approve"}
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
}
