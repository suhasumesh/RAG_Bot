"use client";
import Image from "next/image";
import genGPTLogo from "../assets/ollamaGPT.png";
import "bootstrap/dist/css/bootstrap.min.css";
import { useChat, Message } from "ai/react";
import PromptSuggestionsRow from "../components/PromptSuggestionsRow";
import ReactMarkdown from "react-markdown";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const ChatbotPage = () => {
  const router = useRouter();

  // 1️⃣ Redirect if not logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  const { input, handleInputChange, handleSubmit, isLoading, messages, append } =
    useChat({ api: "/api/chat" });

  const [darkMode, setDarkMode] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Domain & Agentic goal + structured fields
  const [domain, setDomain] = useState<"Augment AI" | "RPA" | "AI/ML">("Augment AI");
  const [goal, setGoal] = useState<string>("Agentic AI"); // free text / small list
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [systems, setSystems] = useState<string>(""); // comma separated
  const [volumePerDay, setVolumePerDay] = useState<number | "">("");
  const [pctUnstructured, setPctUnstructured] = useState<string | "">("");
  const [exceptionRate, setExceptionRate] = useState<string | "">("");
  const [complianceSensitivity, setComplianceSensitivity] = useState<string | "">("");
  const [decisionPoints, setDecisionPoints] = useState<number | "">("");

  // Auto-scroll to latest message
  // useEffect(() => {
  //   chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  // }, [messages, isLoading]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const isAtBottom =
      container.scrollHeight - container.scrollTop <= container.clientHeight + 50; // threshold

    if (isAtBottom) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);


  const handlePromptClick = (promptText: string) => {
    const msg: Message = {
      id: crypto.randomUUID(),
      content: promptText,
      role: "user",
    };
    append(msg, { options: { body: { content: promptText } } });
  };

  const noMessages = !messages || messages.length === 0;

  // Build metadata block
  const buildMetadataBlock = () => {
    const structured = {
      systems: systems ? systems.split(",").map((s) => s.trim()) : [],
      volumePerDay: volumePerDay === "" ? null : Number(volumePerDay),
      pctUnstructured: pctUnstructured === "" ? null : parseFloat(pctUnstructured),
      exceptionRate: exceptionRate === "" ? null : parseFloat(exceptionRate),
      complianceSensitivity: complianceSensitivity === "" ? null : parseFloat(complianceSensitivity),
      decisionPoints: decisionPoints === "" ? null : Number(decisionPoints),
    };
    console.log(`In the Frontend The structured data is - ${structured}`);

    const metaLines = [
      "<<METADATA>>",
      `Domain: ${domain}`,
      `ImplementationGoal: ${goal}`,
      `STRUCTURED: ${JSON.stringify(structured)}`,
      "<<END METADATA>>",
      "",
    ];
    console.log(`In the Frontend The meta data is - ${metaLines}`);
    return metaLines.join("\n");
  };

  // Custom send function that injects metadata into the input and triggers useChat submit
  const handleSend = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const meta = buildMetadataBlock();
    const fullMessage = `${meta}${input}`; // combine metadata + user input

    // Append message to UI immediately
    append({ id: crypto.randomUUID(), role: "user", content: fullMessage });

    // Submit to backend
    handleSubmit({
      preventDefault: () => { },
      target: { value: fullMessage }, // fake event with full message
    } as unknown as React.FormEvent<HTMLFormElement>);

    // Clear input after sending
    handleInputChange({ target: { value: "" } } as any);
  };

  return (
    <main className={`d-flex flex-column align-items-center justify-content-center vh-100`}>
      <div className={`chat-container card shadow-sm rounded-4 d-flex flex-column`} style={{ width: "100%", maxWidth: "900px", height: "85vh" }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <Image src={genGPTLogo} width={60} alt="Ollama Gen GPT" />
            <div>
              <div style={{ fontWeight: 600 }}>RPA / Agentic Evaluator</div>
              <div style={{ fontSize: "0.85rem", color: "#666" }}>Select domain & provide process info</div>
            </div>
          </div>

          <div className="d-flex gap-2 align-items-center">
            <select value={domain} onChange={(e) => setDomain(e.target.value as any)} className="form-select form-select-sm">
              <option value="Augment AI">Augment AI</option>
              <option value="RPA">RPA</option>
              <option value="AI/ML">AI/ML</option>
            </select>

            <select value={goal} onChange={(e) => setGoal(e.target.value)} className="form-select form-select-sm">
              <option>Agentic AI</option>
              <option>Automation</option>
              <option>Decision Support</option>
              <option>Data Extraction</option>
            </select>

            <button className="btn btn-sm btn-outline-secondary rounded-pill" onClick={() => setDarkMode((prev) => !prev)}>
              {darkMode ? "☀️ Light" : "🌙 Dark"}
            </button>
          </div>
        </div>

        {/* Chat Box */}
        <section className="chat-box flex-grow-1 overflow-auto px-3 py-2" style={{ backgroundColor: darkMode ? "#2c2c2c" : "#fafafa", fontSize: "0.95rem" }}>
          <PromptSuggestionsRow onPromptClick={handlePromptClick} />

          {/* Advanced structured fields */}
          <div className="p-2 my-2">
            <div className="d-flex align-items-center justify-content-between">
              <div style={{ fontWeight: 600 }}>Process details (optional)</div>
              <button className="btn btn-link btn-sm" onClick={() => setShowAdvanced((s) => !s)}>
                {showAdvanced ? "Hide" : "Show"} advanced
              </button>
            </div>

            {showAdvanced && (
              <div className="row gx-2 gy-2 mt-2">
                <div className="col-6">
                  <input className="form-control form-control-sm" placeholder="Systems (comma separated)" value={systems} onChange={(e) => setSystems(e.target.value)} />
                </div>
                <div className="col-2">
                  <input className="form-control form-control-sm" placeholder="Volume/day" value={volumePerDay} onChange={(e) => setVolumePerDay(e.target.value === "" ? "" : Number(e.target.value))} />
                </div>
                <div className="col-2">
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    max={1}
                    className="form-control form-control-sm"
                    placeholder="% unstructured (0-1)"
                    value={pctUnstructured}
                    onChange={(e) => setPctUnstructured(e.target.value)}
                  />
                </div>
                <div className="col-2">
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    max={1}
                    className="form-control form-control-sm"
                    placeholder="% exceptions (0-1)"
                    value={exceptionRate}
                    onChange={(e) => setExceptionRate(e.target.value)}
                  />
                </div>
                <div className="col-4">
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    max={1}
                    className="form-control form-control-sm"
                    placeholder="Compliance sensitivity (0-1)"
                    value={complianceSensitivity}
                    onChange={(e) => setComplianceSensitivity(e.target.value)}
                  />
                </div>
                <div className="col-4">
                  <input className="form-control form-control-sm" placeholder="Decision points (count)" value={decisionPoints} onChange={(e) => setDecisionPoints(e.target.value === "" ? "" : Number(e.target.value))} />
                </div>
              </div>
            )}
          </div>

          {noMessages ? (
            <p className="starter-text text-muted text-center mt-4">👋 Welcome! Ask me anything to get started.</p>
          ) : (
            <div className="d-flex flex-column overflow-auto" ref={chatContainerRef}>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 my-1 rounded-4 shadow-sm ${msg.role === "user" ? "bg-primary text-white align-self-end" : darkMode ? "bg-dark border text-light align-self-start" : "bg-white border text-dark align-self-start"}`}
                  style={{ maxWidth: "75%", lineHeight: "1.5" }}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ))}
              {isLoading && (
                <div className={`p-3 my-1 rounded-4 align-self-start ${darkMode ? "bg-dark text-light border" : "bg-white text-dark border"}`} style={{ maxWidth: "60%" }}>
                  <span className="typing-dots">⠋ ⠙ ⠹</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </section>

        {/* Input form */}
        <form onSubmit={handleSend} className="d-flex gap-2 p-3 border-top align-items-end">
          <textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="form-control"
            rows={1}
            style={{
              resize: "none",
              minHeight: "1.5em",
              maxHeight: "150px",
              overflowY: "auto", // <--- allow vertical scroll
              lineHeight: "1.5em", // match minHeight
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 150) + "px"; // restrict growth to maxHeight
            }}
          />

          <button type="submit" className="btn btn-primary  px-4 shadow-sm">Send</button>
        </form>
      </div>

      <style jsx>{`
        .typing-dots {
          font-size: 1.2rem;
          animation: blink 1s infinite;
        }
        @keyframes blink {
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </main>
  );
};

export default ChatbotPage;
