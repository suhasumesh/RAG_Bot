// components/ChatSidebar.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ListGroup, Spinner } from "react-bootstrap";

export default function ChatSidebar() {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChats() {
      try {
        const res = await fetch("/api/chats");
        const data = await res.json();
        setChats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchChats();
  }, []);

  return (
    <aside className="d-flex flex-column bg-light border-end" style={{ width: "280px", height: "100vh" }}>
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
            {chats.map((chat) => (
              <ListGroup.Item
                key={chat._id}
                action
                as={Link}
                href={`/chat/${chat._id}`}
                className="text-truncate"
              >
                {chat.title}
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </div>

      <div className="p-3 border-top small text-muted text-center">
        Inspired by ChatGPT
      </div>
    </aside>
  );
}
