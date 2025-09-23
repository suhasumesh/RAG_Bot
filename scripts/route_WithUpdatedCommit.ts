// "use client";
// import Image from "next/image";
// import genGPTLogo from "../assets/ollamaGPT.png";
// import "bootstrap/dist/css/bootstrap.min.css";
// import { useChat, Message } from "ai/react";
// import PromptSuggestionsRow from "../app/components/PromptSuggestionsRow";
// import ReactMarkdown from "react-markdown";
// import { useEffect, useRef, useState } from "react";
// import { useRouter } from "next/navigation";

// const ChatbotPage = () => {
//   const router = useRouter();

//   // 1️⃣ Redirect if not logged in
//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (!token) {
//       router.replace("/login");
//     }
//   }, [router]);

//   const { input, handleInputChange, handleSubmit, isLoading, messages, append } =
//     useChat({ api: "/api/chat" });

//   const [darkMode, setDarkMode] = useState(false);
//   const chatEndRef = useRef<HTMLDivElement>(null);

//   // Auto-scroll to latest message
//   useEffect(() => {
//     chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages, isLoading]);

//   const handlePromptClick = (promptText: string) => {
//     const msg: Message = {
//       id: crypto.randomUUID(),
//       content: promptText,
//       role: "user",
//     };
//     append(msg, { options: { body: { content: promptText } } });
//   };

//   const noMessages = !messages || messages.length === 0;

//   return (
//     <main
//       className={`d-flex flex-column align-items-center justify-content-center vh-100`}
//     >
//       <div
//         className={`chat-container card shadow-sm rounded-4 d-flex flex-column`}
//         style={{ width: "100%", maxWidth: "900px", height: "85vh" }}
//       >
//         {/* Header */}
//         <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
//           <Image src={genGPTLogo} width={60} alt="Ollama Gen GPT" />
//           <button
//             className="btn btn-sm btn-outline-secondary rounded-pill"
//             onClick={() => setDarkMode((prev) => !prev)}
//           >
//             {darkMode ? "☀️ Light" : "🌙 Dark"}
//           </button>
//         </div>

//         {/* Chat Box */}
//         <section
//           className="chat-box flex-grow-1 overflow-auto px-3 py-2"
//           style={{
//             backgroundColor: darkMode ? "#2c2c2c" : "#fafafa",
//             fontSize: "0.95rem",
//           }}
//         >
//           <PromptSuggestionsRow onPromptClick={handlePromptClick} />

//           {noMessages ? (
//             <p className="starter-text text-muted text-center mt-4">
//               👋 Welcome! Ask me anything to get started.
//             </p>
//           ) : (
//             <div className="d-flex flex-column">
//               {messages.map((msg, idx) => (
//                 <div
//                   key={idx}
//                   className={`p-3 my-1 rounded-4 shadow-sm ${
//                     msg.role === "user"
//                       ? "bg-primary text-white align-self-end"
//                       : darkMode
//                       ? "bg-dark border text-light align-self-start"
//                       : "bg-white border text-dark align-self-start"
//                   }`}
//                   style={{ maxWidth: "75%", lineHeight: "1.5" }}
//                 >
//                   <ReactMarkdown>{msg.content}</ReactMarkdown>
//                 </div>
//               ))}
//               {isLoading && (
//                 <div
//                   className={`p-3 my-1 rounded-4 align-self-start ${
//                     darkMode
//                       ? "bg-dark text-light border"
//                       : "bg-white text-dark border"
//                   }`}
//                   style={{ maxWidth: "60%" }}
//                 >
//                   <span className="typing-dots">⠋ ⠙ ⠹</span>
//                 </div>
//               )}
//               <div ref={chatEndRef} />
//             </div>
//           )}
//         </section>

//         {/* Input */}
//         <form
//           onSubmit={(e) => {
//             e.preventDefault();
//             handleSubmit(e);
//           }}
//           className="d-flex gap-2 p-3 border-top"
//         >
//           <input
//             value={input}
//             onChange={handleInputChange}
//             placeholder="Type your message..."
//             className="form-control rounded-pill"
//           />
//           <button
//             type="submit"
//             className="btn btn-primary rounded-pill px-4 shadow-sm"
//           >
//             Send
//           </button>
//         </form>
//       </div>

//       <style jsx>{`
//         .typing-dots {
//           font-size: 1.2rem;
//           animation: blink 1s infinite;
//         }
//         @keyframes blink {
//           50% {
//             opacity: 0.5;
//           }
//         }
//       `}</style>
//     </main>
//   );
// };

// export default ChatbotPage;
