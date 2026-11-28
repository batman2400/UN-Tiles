"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Sparkles } from "lucide-react";
import { FaArrowRight } from "react-icons/fa";

interface ContactInfo {
  email: string;
  phone: string;
}

interface ServiceOption {
  value: string;
  label: string;
}

interface ContactFormProps {
  badge?: string;
  headline?: string;
  headlineAccent?: string;
  subheadline?: string;
  contactInfo?: ContactInfo;
  serviceOptions?: ServiceOption[];
  ctaLabel?: string;
}

interface FormData {
  name: string;
  company: string;
  email: string;
  phone: string;
  projectType: string;
  message: string;
}

const defaultProps: ContactFormProps = {
  badge: "Let's Connect",
  headline: "Materialize Your",
  headlineAccent: "Vision",
  subheadline:
    "Reach out to us to design and source the perfect tiles for your next project.",
  contactInfo: {
    email: "fade16022025@gmail.com",
    phone: "+94 77 350 8325",
  },
  serviceOptions: [
    { value: "Residential", label: "Residential" },
    { value: "Commercial", label: "Commercial" },
    { value: "Public Space", label: "Public Space" },
    { value: "Other", label: "Other" },
  ],
  ctaLabel: "Send My Inquiry",
};

export default function ContactSolutionForm(
  props: ContactFormProps = defaultProps,
) {
  const {
    badge,
    headline,
    headlineAccent,
    subheadline,
    serviceOptions,
    ctaLabel,
  } = { ...defaultProps, ...props };

  const [form, setForm] = useState<FormData>({
    name: "",
    company: "",
    email: "",
    phone: "",
    projectType: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      // Validate, rate-limit, and persist to our database BEFORE emailing via Web3Forms
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorMsg(data.error || "Something went wrong. Please try again.");
        return;
      }

      // Web3Forms free plan requires a client-side submit (server proxy returns 403).
      const accessKey = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;
      if (accessKey) {
        const web3FormsRes = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            access_key: accessKey,
            subject: `New UN Tiles Inquiry from ${form.name}`,
            from_name: "UN Tiles Contact Form",
            name: form.name,
            email: form.email,
            company: form.company || "N/A",
            phone: form.phone || "N/A",
            projectType: form.projectType || "N/A",
            message: form.message,
          }),
        });

        const web3Data = await web3FormsRes.json().catch(() => null);
        if (!web3FormsRes.ok || !web3Data?.success) {
          if (process.env.NODE_ENV === "development") {
            console.error("Web3Forms submission failed", web3Data);
          }
        }
      } else {
        if (process.env.NODE_ENV === "development") {
          console.warn("NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY is not set");
        }
      }

      // Clear form & show success
      setForm({
        name: "",
        company: "",
        email: "",
        phone: "",
        projectType: "",
        message: "",
      });
      setSuccess(true);
    } catch {
      setErrorMsg(
        "Unable to reach our servers. Please check your connection and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="flex items-center justify-center px-4 py-12 sm:py-16 md:min-h-screen">
      <div className="grid w-full max-w-5xl grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-12">
        <div className="flex flex-col gap-6">
          {badge && (
            <Badge className="w-fit bg-accent/10 text-amber-800 border border-accent/25 px-3 py-1 rounded-full font-semibold uppercase tracking-widest text-[11px] gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              {badge}
            </Badge>
          )}

          <h2 className="text-on-surface text-3xl leading-tight font-display font-bold tracking-tight sm:text-4xl md:text-5xl">
            {headline}{" "}
            <span className="text-accent block">{headlineAccent}</span>
          </h2>

          <p className="text-on-surface-variant max-w-sm text-base leading-relaxed">
            {subheadline}
          </p>

          <Separator className="border-accent/40 my-2 w-16" />
        </div>

        <Card className="bg-surface-container-lowest border border-outline/25 rounded-3xl premium-shadow-lg ring-0">
          <CardContent className="flex flex-col gap-5 p-6 sm:p-8">
            {success ? (
              <div className="flex flex-col items-center justify-center text-center py-12 space-y-6">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-accent" />
                </div>
                <div className="space-y-3">
                  <p className="text-sm uppercase tracking-[0.2em] text-accent font-semibold">
                    Inquiry Received
                  </p>
                  <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-on-surface">
                    Thank You
                  </h2>
                  <p className="text-on-surface-variant leading-relaxed max-w-sm">
                    An architectural consultant will be in touch shortly to discuss your project in detail.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSuccess(false)}
                  className="mt-4 rounded-xl"
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <>
                {errorMsg && (
                  <div className="mb-2 p-4 bg-red-500/10 border border-red-500/20 text-red-600 text-sm rounded-xl">
                    {errorMsg}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor="name"
                      className="text-on-surface text-xs font-bold uppercase tracking-wider"
                    >
                      Full Name *
                    </Label>
                    <Input
                      id="name"
                      placeholder="Kasun Perera"
                      value={form.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      className="bg-surface-container-low/60 border border-outline/30 rounded-xl min-h-11 px-3.5 text-sm text-on-surface placeholder:text-outline-variant focus-visible:border-accent focus-visible:ring-accent/20"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor="company"
                      className="text-on-surface text-xs font-bold uppercase tracking-wider"
                    >
                      Company
                    </Label>
                    <Input
                      id="company"
                      placeholder="Your Company"
                      value={form.company}
                      onChange={(e) => handleChange("company", e.target.value)}
                      className="bg-surface-container-low/60 border border-outline/30 rounded-xl min-h-11 px-3.5 text-sm text-on-surface placeholder:text-outline-variant focus-visible:border-accent focus-visible:ring-accent/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor="email"
                      className="text-on-surface text-xs font-bold uppercase tracking-wider"
                    >
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="kasun@example.com"
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className="bg-surface-container-low/60 border border-outline/30 rounded-xl min-h-11 px-3.5 text-sm text-on-surface placeholder:text-outline-variant focus-visible:border-accent focus-visible:ring-accent/20"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor="phone"
                      className="text-on-surface text-xs font-bold uppercase tracking-wider"
                    >
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+94 77 ..."
                      value={form.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      className="bg-surface-container-low/60 border border-outline/30 rounded-xl min-h-11 px-3.5 text-sm text-on-surface placeholder:text-outline-variant focus-visible:border-accent focus-visible:ring-accent/20"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="projectType"
                    className="text-on-surface text-xs font-bold uppercase tracking-wider"
                  >
                    Project Type
                  </Label>
                  <Select
                    value={form.projectType}
                    onValueChange={(val) => handleChange("projectType", val ?? "")}
                  >
                    <SelectTrigger
                      id="projectType"
                      className="w-full min-h-11 px-3.5 bg-surface-container-low/60 border border-outline/30 rounded-xl text-sm text-on-surface focus:border-accent focus:ring-accent/20"
                    >
                      <SelectValue placeholder="Choose a project type..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {(serviceOptions ?? []).map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          className="text-sm"
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="message"
                    className="text-on-surface text-xs font-bold uppercase tracking-wider"
                  >
                    Message *
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us about your project, tile preferences, or timeline..."
                    rows={4}
                    value={form.message}
                    onChange={(e) => handleChange("message", e.target.value)}
                    className="bg-surface-container-low/60 border border-outline/30 rounded-xl px-3.5 py-2.5 text-sm text-on-surface placeholder:text-outline-variant resize-none focus-visible:border-accent focus-visible:ring-accent/20"
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !form.name || !form.email || !form.message}
                  className="bg-zinc-900 text-white hover:bg-accent group mt-1 w-full h-auto rounded-xl py-4 text-xs font-semibold uppercase tracking-widest shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Sending..." : ctaLabel}
                  {!isSubmitting && <FaArrowRight className="ml-2 text-xs transition-transform group-hover:translate-x-1" />}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
