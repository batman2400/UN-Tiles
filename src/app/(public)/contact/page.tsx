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
        body: JSON.stringify({ name, email, company, phone, projectType, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Something went wrong. Please try again.");
        return;
      }

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
      <section className="relative h-[55vh] min-h-[350px] flex items-center justify-center bg-surface-dark overflow-hidden pt-32">
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
      <section className="bg-surface-dark border-t border-white/10 relative z-10 premium-shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { icon: Phone, label: "Call Us", value: "+94 773508325", href: "tel:+94773508325" },
            { icon: Mail, label: "Email", value: "fade16022025@gmail.com", href: "mailto:fade16022025@gmail.com" },
            { icon: MapPin, label: "Location", value: "Kirulapona, Colombo 05.", href: "https://maps.google.com/maps?q=6.8823419,79.8808345", target: "_blank" },
            { icon: Clock, label: "Hours", value: "Mon-Sat: 9.00am-6.30pm", href: null },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-4 text-on-surface-dark-variant group cursor-default">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                <item.icon className="w-4 h-4 text-accent flex-shrink-0" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">{item.label}</p>
                {item.href ? (
                  <a href={item.href} {...(item.target ? { target: item.target, rel: "noopener noreferrer" } : {})} className="text-sm text-on-surface-dark font-medium hover:text-accent transition-colors">{item.value}</a>
                ) : (
                  <p className="text-sm text-on-surface-dark font-medium">{item.value}</p>
                )}
              </div>
            </div>
          ))}
        </div>
        {/* WhatsApp & Facebook row */}
        <div className="border-t border-white/5 max-w-7xl mx-auto px-6 py-5 flex flex-wrap gap-4 items-center">
          <a
            href="https://wa.me/94773508325"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/20 transition-colors text-sm font-semibold tracking-wide"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
            </svg>
            Chat on WhatsApp
          </a>
          <a
            href="https://www.facebook.com/unicornenterpriseslk/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] border border-[#1877F2]/20 transition-colors text-sm font-semibold tracking-wide"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
            Follow on Facebook
          </a>
        </div>
      </section>

      {/* ══════ MAIN CONTENT ══════ */}
      <section className="max-w-7xl mx-auto px-6 py-24 w-full grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24">
        
        {/* Info */}
        <div className="space-y-12 flex flex-col justify-center">
          <div className="flex flex-col">
            <ScrollReveal>
              <p className="text-sm uppercase tracking-[0.2em] text-accent font-semibold mb-3">Visit Us</p>
              <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-on-surface mb-6">Colombo Showroom (Head Office)</h2>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <div className="space-y-2 text-on-surface-variant leading-relaxed">
                <p>No. 161/A, Polhengoda Road,</p>
                <p>Kirulapona, Colombo 05.</p>
                <p className="pt-4 font-semibold text-on-surface">P: +94 773508325 / +94 772303950</p>
                <p className="font-semibold text-on-surface">E: fade16022025@gmail.com</p>
              </div>
            </ScrollReveal>
          </div>
          
          <ScrollReveal delay={100}>
            <div className="section-divider" />
          </ScrollReveal>

          <div className="flex flex-col">
            <ScrollReveal delay={150}>
              <p className="text-sm uppercase tracking-[0.2em] text-accent font-semibold mb-3">Islandwide</p>
              <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-on-surface mb-6">Other Showrooms</h2>
            </ScrollReveal>
            <ScrollReveal delay={250}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-surface-container-low p-6 premium-shadow interactive-card cursor-default group">
                  <p className="font-display font-semibold text-on-surface mb-1 group-hover:text-accent transition-colors">Benthota</p>
                  <p className="text-sm text-on-surface-variant">No 105, Gasdeka watta, Dope , Benthota</p>
                </div>
              </div>
            </ScrollReveal>
          </div>

          <ScrollReveal delay={200}>
            <div className="section-divider" />
          </ScrollReveal>

          <div className="flex flex-col">
            <ScrollReveal delay={250}>
              <p className="text-sm uppercase tracking-[0.2em] text-accent font-semibold mb-3">Schedule</p>
              <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-on-surface mb-6">Business Hours</h2>
            </ScrollReveal>
            <ScrollReveal delay={350}>
              <div className="space-y-3 text-sm">
                {[
                  { day: "Monday – Saturday", time: "9:00 AM – 6:30 PM" },
                  { day: "Sunday", time: "Closed" },
                  { day: "Public Holidays", time: "Closed" },
                ].map((item) => (
                  <div key={item.day} className="flex justify-between py-2 border-b ghost-border hover:bg-surface-container-low transition-colors px-2 rounded">
                    <span className="text-on-surface font-medium">{item.day}</span>
                    <span className="text-on-surface-variant">{item.time}</span>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
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

      {/* ══════ MAP ══════ */}
      <section className="w-full">
        <ScrollReveal>
          <div className="relative w-full h-[480px] overflow-hidden">
            {/* Accent top border */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent z-10" />
            {/* Dark overlay label */}
            <div className="absolute top-6 right-6 z-10 bg-surface-dark/90 backdrop-blur-sm px-5 py-3 premium-shadow flex items-center gap-3">
              <MapPin className="w-4 h-4 text-accent flex-shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-dark-variant">Head Office</p>
                <p className="text-sm font-semibold text-on-surface-dark">No. 161/A, Polhengoda Road, Colombo 05</p>
              </div>
            </div>
            <iframe
              title="UN Tiles Location"
              src="https://maps.google.com/maps?q=6.8823419,79.8808345&z=17&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0, filter: "grayscale(30%) contrast(1.05)" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0"
            />
            {/* Bottom gradient fade */}
            <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-background/20 to-transparent pointer-events-none z-10" />
          </div>
        </ScrollReveal>
      </section>

    </div>
  );
}
