"use client";

import Link from "next/link";
import { UserCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function AuthNavIcon({ className }: { className?: string }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="w-5 h-5 bg-surface-container-high animate-pulse" />
    );
  }

  if (user) {
    const initialF = user.firstName
      ? user.firstName[0].toUpperCase()
      : (user.email.charAt(0) || "U").toUpperCase();
    const initialL = user.lastName ? user.lastName[0].toUpperCase() : "";

    return (
      <Link
        href="/profile"
        className="icon-button-lift flex items-center justify-center w-8 h-8 rounded-full bg-primary text-on-primary text-xs font-display font-bold transition-colors duration-300 hover:bg-primary-dim"
        title={user.firstName ? `${user.firstName} ${user.lastName}` : user.email}
      >
        {initialF}{initialL}
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      aria-label="Sign in"
      className={`icon-button-lift flex h-10 w-10 sm:min-h-11 sm:min-w-11 items-center justify-center transition-colors duration-300 ${className ?? "text-on-surface-variant hover:text-on-surface"}`}
    >
      <UserCircle className="w-5 h-5" />
    </Link>
  );
}
