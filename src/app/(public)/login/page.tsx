"use client";

import { useState, FormEvent, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "@/context/AuthContext";
import { getSafeNextPath } from "@/lib/safeNextPath";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = getSafeNextPath(searchParams.get("next"));
  const authErrorParam = searchParams.get("error");
  const { login, loginWithGoogle, user, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(authErrorParam || "");

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(next);
    }
  }, [user, isLoading, router, next]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const result = await login(email, password);
    if (result.success) {
      router.replace(next);
    } else {
      setError(result.error || "Login failed.");
      setIsSubmitting(false);
    }
  };

  const registerHref =
    next === "/profile" ? "/register" : `/register?next=${encodeURIComponent(next)}`;

  return (
    <section className="min-h-[calc(100svh-6rem)] flex items-center justify-center bg-surface px-4 sm:px-6 pt-28 sm:pt-32 pb-16">
      <div className="w-full max-w-md motion-fade-up">
        <div className="bg-surface-container-lowest rounded-3xl border border-outline/20 p-6 sm:p-10 md:p-12 ambient-glow">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-display font-semibold tracking-tight text-on-surface mb-3">
              UN Tiles
            </h1>
            <p className="text-sm text-on-surface-variant">
              Sign in to your account
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 bg-[#9f403d]/8 border-l-2 border-[#9f403d] px-5 py-4 motion-fade-up">
              <p className="text-sm text-[#9f403d]">{error}</p>
            </div>
          )}

          {/* Form */}
          <div className="space-y-8">
            <button
              type="button"
              disabled={isLoading || isSubmitting}
              onClick={async () => {
                const result = await loginWithGoogle(next);
                if (!result.success) {
                  setError(result.error || "Google login failed.");
                }
              }}
              className="w-full flex items-center justify-center gap-3 bg-surface border border-outline hover:bg-surface-container-highest py-4 rounded-xl text-sm font-semibold text-on-surface uppercase tracking-widest transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <FcGoogle className="w-5 h-5" />
              Sign In with Google
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-outline" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest">
                <span className="bg-surface-container-lowest px-2 text-on-surface-variant">Or continue with</span>
              </div>
            </div>

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
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-0 top-1/2 -translate-y-1/2 min-h-11 min-w-11 -mr-2 inline-flex items-center justify-center text-outline hover:text-on-surface transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="w-full kinetic-button bg-primary hover:bg-primary-dim text-on-primary py-4 rounded-xl text-sm font-semibold uppercase tracking-widest transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="flex items-center justify-center gap-3">
                {isSubmitting ? "Signing in..." : "Sign In"}
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </span>
            </button>
          </form>
          </div>

          <p className="text-center text-sm text-on-surface-variant mt-10">
            Don&apos;t have an account?{" "}
            <Link href={registerHref} className="kinetic-link text-primary font-semibold hover:text-primary-dim transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
