"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { ParallaxLayer } from "@/components/ParallaxLayer";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Mail, Phone, Clock, MapPin, CheckCircle } from "lucide-react";

export default function Contact() {
  // ── Form state ───────────────────────────────────────
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [projectType, setProjectType] = useState("Residential");
  const [message, setMessage] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // ── Submit handler ───────────────────────────────────
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Something went wrong. Please try again.");
        return;
      }

      // Open the device's default mail app with the inquiry pre-filled
      const subject = encodeURIComponent(`UN Tiles Inquiry from ${name}`);
      const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\nCompany: ${company || "N/A"}\nPhone: ${phone || "N/A"}\nProject Type: ${projectType}\n\nMessage:\n${message}`
      );
      window.open(`mailto:uvarammohan90@gmail.com?subject=${subject}&body=${body}`, "_self");

      // Clear form & show success
      setName("");
      setCompany("");
      setEmail("");
      setPhone("");
      setProjectType("Residential");
      setMessage("");
      setSuccess(true);
    } catch {
      setErrorMsg("Unable to reach our servers. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* ══════ HERO ══════ */}
      <section className="relative h-[55vh] min-h-[350px] flex items-center justify-center bg-surface-dark overflow-hidden">
        <ParallaxLayer
          speed={0.2}
          maxOffset={48}
          className="absolute -inset-x-0 -top-[10%] h-[120%] w-full"
        >
          <Image 
            src="/images/contact_hero.png" 
            alt="Modern Showroom" 
            fill 
            className="object-cover object-center opacity-50"
            priority
          />
        </ParallaxLayer>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/40" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-accent font-semibold mb-4 motion-fade-up">Let&apos;s Connect</p>
          <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-white motion-fade-up motion-delay-1">
            Get in Touch
          </h1>
        </div>
      </section>

      {/* ══════ QUICK CONTACT STRIP ══════ */}
      <section className="bg-surface-dark border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Phone, label: "Call Us", value: "+1 (555) 123-4567" },
            { icon: Mail, label: "Email", value: "studio@untiles.com" },
            { icon: MapPin, label: "Location", value: "Design District, NY" },
            { icon: Clock, label: "Hours", value: "Mon-Sat: 9am-6pm" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 text-on-surface-dark-variant">
              <item.icon className="w-4 h-4 text-accent flex-shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-widest opacity-60">{item.label}</p>
                <p className="text-sm text-on-surface-dark font-medium">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════ MAIN CONTENT ══════ */}
      <section className="max-w-7xl mx-auto px-6 py-24 w-full grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24">
        
        {/* Info */}
        <div className="space-y-12">
          <ScrollReveal>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-accent font-semibold mb-3">Visit Us</p>
              <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-on-surface mb-6">HQ / Flagship Studio</h2>
              <div className="space-y-2 text-on-surface-variant leading-relaxed">
                <p>100 Architectural Way</p>
                <p>Design District, NY 10001</p>
                <p className="pt-4 font-semibold text-on-surface">P: +1 (555) 123-4567</p>
                <p className="font-semibold text-on-surface">E: studio@untiles.com</p>
              </div>
            </div>
          </ScrollReveal>
          
          <ScrollReveal delay={100}>
            <div className="section-divider" />
          </ScrollReveal>

          <ScrollReveal delay={150}>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-accent font-semibold mb-3">Worldwide</p>
              <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-on-surface mb-6">Global Showrooms</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-surface-container-low p-6 premium-shadow">
                  <p className="font-display font-semibold text-on-surface mb-1">London</p>
                  <p className="text-sm text-on-surface-variant">45 Monolith Building, Clerkenwell EC1M</p>
                </div>
                <div className="bg-surface-container-low p-6 premium-shadow">
                  <p className="font-display font-semibold text-on-surface mb-1">Milan</p>
                  <p className="text-sm text-on-surface-variant">Via Brera 22, 20121 Milano MI</p>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="section-divider" />
          </ScrollReveal>

          <ScrollReveal delay={250}>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-accent font-semibold mb-3">Schedule</p>
              <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-on-surface mb-6">Business Hours</h2>
              <div className="space-y-3 text-sm">
                {[
                  { day: "Monday – Friday", time: "9:00 AM – 6:00 PM" },
                  { day: "Saturday", time: "10:00 AM – 4:00 PM" },
                  { day: "Sunday", time: "Closed" },
                ].map((item) => (
                  <div key={item.day} className="flex justify-between py-2 border-b ghost-border">
                    <span className="text-on-surface font-medium">{item.day}</span>
                    <span className="text-on-surface-variant">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Form */}
        <ScrollReveal delay={100}>
          <div className="bg-surface-container-lowest p-8 md:p-12 premium-shadow-lg sticky top-24">
            {success ? (
              /* ── Success State ─────────────────────────── */
              <div className="flex flex-col items-center justify-center text-center py-12 space-y-6">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-accent" />
                </div>
                <div className="space-y-3">
                  <p className="text-sm uppercase tracking-[0.2em] text-accent font-semibold">Inquiry Received</p>
                  <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-on-surface">
                    Thank You
                  </h2>
                  <p className="text-on-surface-variant leading-relaxed max-w-sm">
                    An architectural consultant will be in touch shortly to discuss your project in detail.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className="mt-4 text-sm uppercase tracking-widest text-accent font-semibold hover:text-accent/80 transition-colors underline underline-offset-4"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              /* ── Form State ────────────────────────────── */
              <>
                <p className="text-sm uppercase tracking-[0.2em] text-accent font-semibold mb-2">Send a Message</p>
                <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-on-surface mb-8">Inquire</h2>

                {errorMsg && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-7">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex flex-col">
                      <label className="text-xs uppercase tracking-widest text-on-surface-variant mb-2 font-semibold">Name *</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="form-field-animate bg-transparent border-b-2 border-outline-variant/40 focus:border-accent outline-none py-3 text-on-surface transition-colors"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs uppercase tracking-widest text-on-surface-variant mb-2 font-semibold">Company Name</label>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="form-field-animate bg-transparent border-b-2 border-outline-variant/40 focus:border-accent outline-none py-3 text-on-surface transition-colors"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex flex-col">
                      <label className="text-xs uppercase tracking-widest text-on-surface-variant mb-2 font-semibold">Email *</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="form-field-animate bg-transparent border-b-2 border-outline-variant/40 focus:border-accent outline-none py-3 text-on-surface transition-colors"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs uppercase tracking-widest text-on-surface-variant mb-2 font-semibold">Phone Number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="form-field-animate bg-transparent border-b-2 border-outline-variant/40 focus:border-accent outline-none py-3 text-on-surface transition-colors"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs uppercase tracking-widest text-on-surface-variant mb-2 font-semibold">Project Type</label>
                    <select
                      value={projectType}
                      onChange={(e) => setProjectType(e.target.value)}
                      className="form-field-animate bg-transparent border-b-2 border-outline-variant/40 focus:border-accent outline-none py-3 text-on-surface transition-colors appearance-none cursor-pointer rounded-none"
                      disabled={isSubmitting}
                    >
                      <option>Residential</option>
                      <option>Commercial</option>
                      <option>Public Space</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs uppercase tracking-widest text-on-surface-variant mb-2 font-semibold">Message *</label>
                    <textarea
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="form-field-animate bg-transparent border-b-2 border-outline-variant/40 focus:border-accent outline-none py-3 text-on-surface transition-colors resize-none"
                      required
                      disabled={isSubmitting}
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="kinetic-button bg-accent text-on-accent px-8 py-4 uppercase tracking-widest text-sm font-semibold hover:bg-accent/90 transition-colors w-full disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span>{isSubmitting ? "Sending..." : "Submit Inquiry"}</span>
                  </button>
                </form>
              </>
            )}
          </div>
        </ScrollReveal>
        
      </section>

    </div>
  );
}
