// app/layout.tsx
// "use client";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { AuthProvider } from "./context/AuthContext";
import ChatSidebar from "./components/ChatSideBar";
import ProtectedRoute from "./components/ProtectedRoute";
// import { usePathname } from "next/navigation";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // const pathname = usePathname();
  // const publicPaths = ["/forgotPassword","/login", "/signup", "/reset-account", "/homepage", "/about"];
  // const isPublic = publicPaths.some((path) => pathname.startsWith(path));

  // const Content = isPublic ? (
  //   // Public routes, no ProtectedRoute
  //   children
  // ) : (
  //   <ProtectedRoute>{children}</ProtectedRoute>
  // );

  return (
    <html lang="en">
      <head>
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          rel="stylesheet"
        />
      </head>
      <body className="d-flex flex-column min-vh-100" style={{ margin: "0 auto", fontSize: "0.9rem", width: "100%" }}>
        <AuthProvider>
          <Navbar />
          <div className="flex-grow-1 container-fluid">
            <div className="row h-100">
              <div className="col-3 col-md-2 p-0 border-end">
                <ChatSidebar />
              </div>
              <div className="col-9 col-md-10 p-0 d-flex flex-column">
                <ProtectedRoute>{children}</ProtectedRoute>
              </div>
            </div>
          </div>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
