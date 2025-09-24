"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Spinner, Card } from "react-bootstrap";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  useEffect(() => {
    const fetchMessages = async () => {
      if (!chatId || !userId) return;

      try {
        const res = await fetch(`/api/chats/${chatId}/messages?userId=${userId}`);
        if (!res.ok) throw new Error("Failed to fetch messages");
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [chatId, userId]);

  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center p-4">
        <Spinner animation="border" />
      </div>
    );

  // Parse **BoldTitle** inline but keep all text and line breaks
  const renderStructuredText = (text: string) => {
    const regex = /\*\*(.+?)\*\*:/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const before = text.slice(lastIndex, match.index);
      if (before) {
        parts.push(
          <span key={lastIndex} style={{ whiteSpace: "pre-wrap" }}>
            {before}
          </span>
        );
      }
      parts.push(
        <strong key={match.index}>{match[1]}:</strong>
      );
      lastIndex = match.index + match[0].length;
    }

    // Remaining text after last match
    const remaining = text.slice(lastIndex);
    if (remaining) {
      parts.push(
        <span key={lastIndex + 1} style={{ whiteSpace: "pre-wrap" }}>
          {remaining}
        </span>
      );
    }

    return <div style={{ whiteSpace: "pre-wrap" }}>{parts}</div>;
  };

  return (
    <div className="container py-4">
      <div className="d-flex flex-column gap-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`d-flex ${
              msg.role === "user" ? "justify-content-end" : "justify-content-start"
            }`}
          >
            <Card
              className={`shadow-sm ${
                msg.role === "user"
                  ? "bg-primary text-white text-end"
                  : "bg-light text-dark text-start"
              }`}
              style={{ maxWidth: "75%" }}
            >
              <Card.Header
                className={`fw-bold ${msg.role === "user" ? "border-light" : "border-dark"}`}
              >
                {msg.role === "user" ? "You" : "AI"}
              </Card.Header>
              <Card.Body>
                {msg.role === "assistant" ? (
                  renderStructuredText(msg.content)
                ) : (
                  <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
                )}
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
