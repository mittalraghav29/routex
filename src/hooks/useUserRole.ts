"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";

export type UserRole = "admin" | "user" | null;

export function useUserRole() {
  const { data: session, isPending } = useSession();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (!session) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      try {
        const token = localStorage.getItem("bearer_token");
        const res = await fetch("/api/user/role", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setRole(data.role);
        } else {
          setRole("user"); // Default to user if fetch fails
        }
      } catch (error) {
        console.error("Failed to fetch user role:", error);
        setRole("user"); // Default to user on error
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [session, isPending]);

  return {
    role,
    isAdmin: role === "admin",
    isUser: role === "user",
    loading: loading || isPending,
  };
}
