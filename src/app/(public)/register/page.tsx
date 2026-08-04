"use client";

import { useState, FormEvent, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { register, user, isLoading } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      router.push("/profile");
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }

    setIsSubmitting(true);

    const result = await register({
      firstName,
      lastName,
      email,
      phone: "",
      password,
    });

    if (result.success) {
      setSuccess(true);
      setTimeout(() => router.push("/login"), 5000);
    } else {
      setError(result.error || "Registration failed.");
      setIsSubmitting(false);
    }
  };

  if (isLoading) return null;

  return (
    <section className="min-h-[calc(100vh-6rem)] flex items-center justify-center bg-surface px-6 pt-32 pb-16">
      <div className="w-full max-w-lg motion-fade-up">
        <div className="bg-surface-container-lowest p-10 md:p-14 ambient-glow">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-display font-semibold tracking-tight text-on-surface mb-3">
              Create Account
            </h1>
            <p className="text-sm text-on-surface-variant">
              Join UN Tiles for exclusive collections
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-8 bg-primary/5 border-l-2 border-primary px-5 py-4 motion-fade-up">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-on-surface">Account created successfully!</p>
                  <p className="text-sm text-on-surface-variant">We&apos;ve sent a verification link to your email. Please verify your email before signing in.</p>
                  <p className="text-xs text-on-surface-variant/70 italic pt-2">Redirecting to login...</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-8 bg-[#9f403d]/8 border-l-2 border-[#9f403d] px-5 py-4 motion-fade-up">
              <p className="text-sm text-[#9f403d]">{error}</p>
            </div>
          )}

          {/* Form */}
          {!success && (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-2">
                  <label htmlFor="register-first-name" className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant">First Name</label>
                  <input id="register-first-name" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="John"
                    className="w-full bg-transparent border-b border-outline py-3 text-on-surface placeholder:text-outline-variant outline-none form-field-animate focus:border-b-2 focus:border-primary focus:bg-surface-container-highest/40 transition-colors" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="register-last-name" className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Last Name</label>
                  <input id="register-last-name" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder="Doe"
                    className="w-full bg-transparent border-b border-outline py-3 text-on-surface placeholder:text-outline-variant outline-none form-field-animate focus:border-b-2 focus:border-primary focus:bg-surface-container-highest/40 transition-colors" />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="register-email" className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Email Address</label>
                <input id="register-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com"
                  className="w-full bg-transparent border-b border-outline py-3 text-on-surface placeholder:text-outline-variant outline-none form-field-animate focus:border-b-2 focus:border-primary focus:bg-surface-container-highest/40 transition-colors" />
              </div>

              <div className="space-y-2">
                <label htmlFor="register-password" className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Password</label>
                <div className="relative">
                  <input id="register-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Minimum 8 characters"
                    className="w-full bg-transparent border-b border-outline py-3 pr-10 text-on-surface placeholder:text-outline-variant outline-none form-field-animate focus:border-b-2 focus:border-primary focus:bg-surface-container-highest/40 transition-colors" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="register-confirm-password" className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Confirm Password</label>
                <div className="relative">
                  <input id="register-confirm-password" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Re-enter your password"
                    className="w-full bg-transparent border-b border-outline py-3 pr-10 text-on-surface placeholder:text-outline-variant outline-none form-field-animate focus:border-b-2 focus:border-primary focus:bg-surface-container-highest/40 transition-colors" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors">
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isSubmitting}
                className="w-full kinetic-button bg-primary hover:bg-primary-dim text-on-primary py-4 text-sm font-semibold uppercase tracking-widest transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                <span className="flex items-center justify-center gap-3">
                  {isSubmitting ? "Creating Account..." : "Create Account"}
                  {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                </span>
              </button>
            </form>
          )}

          <p className="text-center text-sm text-on-surface-variant mt-10">
            Already have an account?{" "}
            <Link href="/login" className="kinetic-link text-primary font-semibold hover:text-primary-dim transition-colors">Log in</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
