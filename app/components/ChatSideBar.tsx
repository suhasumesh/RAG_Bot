"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ListGroup, Spinner } from "react-bootstrap";
import { usePathname, useRouter } from "next/navigation";
import { getUserId } from "../../utils/user"; // util to get userId from localStorage

interface Chat {
    _id: string;
    title: string;
    createdAt?: string;
}

export default function ChatSidebar() {
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    const pathname = usePathname();
    const router = useRouter();

    // Check for userId on mount
    useEffect(() => {
        const id = getUserId();
        if (!id) {
            router.replace("/login"); // redirect to login if no userId
            return;
        }
        setUserId(id);
    }, [router]);

    // Fetch chats only if userId exists
    useEffect(() => {
        if (!userId) return;

        async function fetchChats() {
            try {
                const res = await fetch(`/api/chats?userId=${userId}`);
                if (!res.ok) throw new Error("Failed to fetch chats");
                const data: Chat[] = await res.json();

                // Sort by most recent creation time
                data.sort((a, b) => {
                    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return bTime - aTime;
                });

                setChats(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        fetchChats();
        const interval = setInterval(fetchChats, 30000);
        return () => clearInterval(interval);
    }, [userId]);

    // Conditionally render nothing if user is not logged in yet
    if (!userId) return null;

    return (
        <aside
            className="d-flex flex-column bg-light border-end"
            style={{ width: "280px", height: "100vh" }}
        >
            <div className="p-3 border-bottom">
                <h5 className="mb-0">My Chats</h5>
            </div>

            <div className="flex-grow-1 overflow-auto">
                {loading ? (
                    <div className="d-flex justify-content-center align-items-center p-3">
                        <Spinner animation="border" size="sm" />
                    </div>
                ) : chats.length === 0 ? (
                    <p className="text-muted p-3">No chats yet</p>
                ) : (
                    <ListGroup variant="flush">
                        {chats.map((chat) => {
                            const isActive = pathname === `/chat/${chat._id}`;
                            return (
                                <ListGroup.Item
                                    key={chat._id}
                                    action
                                    as={Link}
                                    href={`/chat/${chat._id}`}
                                    className={`text-truncate ${isActive ? "bg-primary text-white" : ""}`}
                                    title={chat.title || "Untitled Chat"}
                                >
                                    {chat.title || "Untitled Chat"}
                                </ListGroup.Item>
                            );
                        })}
                    </ListGroup>
                )}
            </div>

            <div className="p-3 border-top small text-muted text-center">
                Inspired by ChatGPT
            </div>
        </aside>
    );
}
