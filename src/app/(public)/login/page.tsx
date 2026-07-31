"use client";

import { useState, FormEvent, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, user, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/profile");
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const result = await login(email, password);
    if (result.success) {
      router.replace("/profile");
    } else {
      setError(result.error || "Login failed.");
      setIsSubmitting(false);
    }
  };

  if (isLoading) return null;

  return (
    <section className="min-h-[calc(100vh-6rem)] flex items-center justify-center bg-surface px-6 pt-32 pb-16">
      <div className="w-full max-w-md motion-fade-up">
        <div className="bg-surface-container-lowest p-10 md:p-14 ambient-glow">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-display font-semibold tracking-tight text-on-surface mb-3">
              UN Tiles
            </h1>
            <p className="text-sm text-on-surface-variant">
              Sign in to your account
            </p>
          </div>

          {/* Demo Account Hint (Supabase auth setup required) */}
          <div className="mb-8 bg-primary/5 px-5 py-4 border-l-2 border-primary">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Testing Note</p>
            <p className="text-sm text-on-surface-variant">
              Please use your registered Supabase credentials or create a new account to sign in.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 bg-[#9f403d]/8 border-l-2 border-[#9f403d] px-5 py-4 motion-fade-up">
              <p className="text-sm text-[#9f403d]">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label htmlFor="login-email" className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-transparent border-b border-outline py-3 text-on-surface placeholder:text-outline-variant outline-none form-field-animate focus:border-b-2 focus:border-primary focus:bg-surface-container-highest/40 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="login-password" className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-transparent border-b border-outline py-3 pr-10 text-on-surface placeholder:text-outline-variant outline-none form-field-animate focus:border-b-2 focus:border-primary focus:bg-surface-container-highest/40 transition-colors"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="remember-me" className="flex items-center gap-2.5 cursor-pointer group">
                <div className="relative">
                  <input id="remember-me" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="sr-only peer" />
                  <div className="w-4 h-4 border border-outline peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                    {rememberMe && (
                      <svg className="w-2.5 h-2.5 text-on-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="square" strokeLinejoin="miter" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">Remember me</span>
              </label>
              <Link href="#" className="kinetic-link text-sm text-primary hover:text-primary-dim transition-colors">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full kinetic-button bg-primary hover:bg-primary-dim text-on-primary py-4 text-sm font-semibold uppercase tracking-widest transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="flex items-center justify-center gap-3">
                {isSubmitting ? "Signing in..." : "Sign In"}
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </span>
            </button>
          </form>

          <p className="text-center text-sm text-on-surface-variant mt-10">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="kinetic-link text-primary font-semibold hover:text-primary-dim transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
