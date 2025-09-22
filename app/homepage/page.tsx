import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <div className="container mt-5">
        <h1 className="text-center mb-4">Welcome to Avaali Chatbot</h1>
        <p className="lead text-center">
          Avaali Bot is your AI assistant for automating RPA tasks, answering queries, and providing insights. 
          Login or Signup to get started with your personal AI chatbot experience.
        </p>
      </div>
       <Footer />
    </>
  );
}
