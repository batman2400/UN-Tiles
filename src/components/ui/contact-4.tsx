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
import { CheckCircle } from "lucide-react";
import {
  FaEnvelope,
  FaPhoneAlt,
  FaArrowRight,
  FaSeedling,
} from "react-icons/fa";

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
  headline: string;
  headlineAccent: string;
  subheadline: string;
  contactInfo: ContactInfo;
  serviceOptions: ServiceOption[];
  ctaLabel: string;
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
    contactInfo,
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
      // 1. Send email notification via server-side route (API key stays on server)
      const web3FormsRes = await fetch("/api/web3forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!web3FormsRes.ok) {
        console.error("Web3Forms submission failed");
      }

      // 2. Save to our database
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Something went wrong. Please try again.");
        return;
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
    <section className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="grid w-full max-w-5xl grid-cols-1 items-center gap-12 md:grid-cols-2">
        <div className="flex flex-col gap-6">
          {badge && (
            <Badge>
              <FaSeedling className="text-primary-foreground" />
              {badge}
            </Badge>
          )}

          <h1 className="text-foreground text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl">
            {headline}{" "}
            <span className="text-primary block">{headlineAccent}</span>
          </h1>

          <p className="text-muted-foreground max-w-sm text-base leading-relaxed">
            {subheadline}
          </p>

          <Separator className="border-primary/40 my-2 w-16" />
        </div>

        <Card className="bg-muted rounded-4xl shadow-sm ring-0">
          <CardContent className="flex flex-col gap-5 p-8">
            {success ? (
              <div className="flex flex-col items-center justify-center text-center py-12 space-y-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-3">
                  <p className="text-sm uppercase tracking-[0.2em] text-primary font-semibold">
                    Inquiry Received
                  </p>
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                    Thank You
                  </h2>
                  <p className="text-muted-foreground leading-relaxed max-w-sm">
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
                  <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl">
                    {errorMsg}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-0.5">
                    <Label
                      htmlFor="name"
                      className="text-foreground text-sm font-medium"
                    >
                      Full Name *
                    </Label>
                    <Input
                      id="name"
                      placeholder="Alex Rivera"
                      value={form.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      className="bg-input focus-visible:ring-primary rounded-xl border-0 text-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,1)] focus-visible:ring-1 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <Label
                      htmlFor="company"
                      className="text-foreground text-sm font-medium"
                    >
                      Company
                    </Label>
                    <Input
                      id="company"
                      placeholder="Your Company"
                      value={form.company}
                      onChange={(e) => handleChange("company", e.target.value)}
                      className="bg-input focus-visible:ring-primary rounded-xl border-0 text-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,1)] focus-visible:ring-1 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-0.5">
                    <Label
                      htmlFor="email"
                      className="text-foreground text-sm font-medium"
                    >
                      Work Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="alex@company.com"
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className="bg-input focus-visible:ring-primary rounded-xl border-0 text-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,1)] focus-visible:ring-1 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <Label
                      htmlFor="phone"
                      className="text-foreground text-sm font-medium"
                    >
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+94 77 ..."
                      value={form.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      className="bg-input focus-visible:ring-primary rounded-xl border-0 text-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,1)] focus-visible:ring-1 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-0.5">
                  <Label
                    htmlFor="projectType"
                    className="text-foreground text-sm font-medium"
                  >
                    Project Type
                  </Label>
                  <Select
                    value={form.projectType}
                    onValueChange={(val) => handleChange("projectType", val)}
                  >
                    <SelectTrigger
                      id="projectType"
                      className="bg-input focus:ring-primary text-muted-foreground rounded-xl border-0 text-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,1)] focus:ring-1 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]"
                    >
                      <SelectValue placeholder="Choose a project type..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {serviceOptions.map((opt) => (
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
                <div className="flex flex-col gap-0.5">
                  <Label
                    htmlFor="message"
                    className="text-foreground text-sm font-medium"
                  >
                    Message *
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us about your goals or challenges..."
                    rows={4}
                    value={form.message}
                    onChange={(e) => handleChange("message", e.target.value)}
                    className="bg-input focus-visible:ring-primary resize-none rounded-xl border-0 text-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,1)] focus-visible:ring-1 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]"
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !form.name || !form.email || !form.message}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 group mt-1 w-full rounded-xl py-5 text-sm font-semibold shadow-[inset_0_2px_0_0_rgba(255,255,255,0.5),inset_0_-2px_0_0_rgba(0,0,0,0.2)] transition-all dark:shadow-[inset_0_2px_0_0_rgba(255,255,255,0.2)] disabled:opacity-70"
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
