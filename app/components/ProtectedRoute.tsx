"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";

const publicPaths = ["/login", "/signup", "/reset-account", "/homepage", "/about","/forgotPassword"];

type Props = {
  children: ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = publicPaths.some((path) => pathname.startsWith(path));

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    if (!token && !isPublic) {
      console.log("Redirecting to /login from ProtectedRoute");
      router.replace("/login");
    }
  }, [pathname, isPublic, router]);

  return <>{children}</>;
}
