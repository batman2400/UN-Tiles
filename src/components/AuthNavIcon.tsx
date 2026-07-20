"use client";

import Link from "next/link";
import { UserCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function AuthNavIcon() {
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
        className="icon-button-lift flex items-center justify-center w-8 h-8 bg-primary text-on-primary text-xs font-display font-bold transition-colors duration-300 hover:bg-primary-dim"
        title={user.firstName ? `${user.firstName} ${user.lastName}` : user.email}
      >
        {initialF}{initialL}
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="icon-button-lift text-on-surface-variant hover:text-on-surface transition-colors duration-300"
    >
      <UserCircle className="w-5 h-5" />
    </Link>
  );
}
