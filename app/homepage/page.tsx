"use client";

import { useState } from "react";
import { Card, Button, Collapse } from "react-bootstrap";

const examples = [
  "Extract data from PDFs and populate ERP systems",
  "Schedule repetitive report generation and distribution",
  "Analyze financial data and suggest workflow optimizations",
  "Decide which process steps can be automated without human intervention",
  "Provide insights on process efficiency for human review",
  "Suggest improvements in business workflows",
  "Draft customer support emails with AI suggestions",
];

export default function HomePage() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const toggleExample = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <div className="container mt-5 min-vh-100">
      <h1 className="text-center mb-4">Welcome to Avaali Chatbot</h1>
      <p className="lead text-center mb-5">
        Avaali Bot is your AI assistant for automating RPA tasks, answering queries, and providing insights.
        Login or Signup to get started with your personal AI chatbot experience.
      </p>

      <h3 className="mb-3 text-center">💡 Fun Examples: What you can ask</h3>
      <div className="row g-3 justify-content-center">
        {examples.map((ex, idx) => (
          <div key={idx} className="col-12 col-md-6 col-lg-4">
            <Card className="shadow-sm h-100">
              <Card.Body>
                <Card.Title className="mb-3">Example #{idx + 1}</Card.Title>
                <Card.Text>{ex}</Card.Text>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => toggleExample(idx)}
                  aria-controls={`example-collapse-text-${idx}`}
                  aria-expanded={openIdx === idx}
                >
                  Try It!
                </Button>
                <Collapse in={openIdx === idx}>
                  <div id={`example-collapse-text-${idx}`} className="mt-3 text-muted">
                    This is a fun demo: type it in the chat and see how the bot responds! 🎉
                  </div>
                </Collapse>
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>

      <div className="text-center mt-5">
        <p className="fw-bold">Explore, experiment, and automate your processes like never before! 🚀</p>
      </div>
    </div>
  );
}
