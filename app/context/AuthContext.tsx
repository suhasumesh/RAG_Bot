"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

type AuthContextType = {
  loggedIn: boolean;
  login: (token: string) => void;
  logout: () => void;
};

type AuthProviderProps = {
  children: React.ReactNode;
  skipRedirect?: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children, skipRedirect = false }: AuthProviderProps) {
  const [loggedIn, setLoggedIn] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const publicPaths = ["/login", "/signup", "/reset-account","/homepage","/about","/forgotPassword"];

  useEffect(() => {
    const token = localStorage.getItem("token");
    setLoggedIn(!!token);

    // Only redirect on *protected* pages
    const isPublic = publicPaths.some((path) => pathname.startsWith(path));
    if (!token && !skipRedirect &&!isPublic ) {
    console.log("Redirecting to /login");
    router.replace("/login");
  }
  }, [loggedIn,skipRedirect,publicPaths]);

  const login = (token: string) => {
    console.log("Login called with token:", token);
    localStorage.setItem("token", token);
    setLoggedIn(true);
  };

  const logout = () => {
    console.log("Logout called");
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    setLoggedIn(false);
    router.replace("/login");
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <AuthContext.Provider value={{ loggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
