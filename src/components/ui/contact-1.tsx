import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  IoHeadset,
  IoBriefcase,
  IoLocation,
  IoMegaphone,
} from "react-icons/io5";
import { Badge } from "@/components/ui/badge";

export interface ContactMethod {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  actionUrl: string;
}

export interface ContactBlockProps {
  badgeText?: string;
  title?: string;
  description?: string;
  contactMethods?: ContactMethod[];
}

const defaultMethods: ContactMethod[] = [
  {
    id: "support",
    icon: <IoHeadset className="h-6 w-6" />,
    title: "General Inquiries",
    description: "Questions about our tiles or need help choosing?",
    actionLabel: "fade16022025@gmail.com",
    actionUrl: "mailto:fade16022025@gmail.com",
  },
  {
    id: "sales",
    icon: <IoBriefcase className="h-6 w-6" />,
    title: "Sales & Trade",
    description: "Discuss wholesale or large architectural projects.",
    actionLabel: "Call +94 77 350 8325",
    actionUrl: "tel:+94773508325",
  },
  {
    id: "hq",
    icon: <IoLocation className="h-6 w-6" />,
    title: "Head Office",
    description: "Visit our main showroom to see our collections.",
    actionLabel: "Get Directions",
    actionUrl: "https://maps.google.com/maps?q=6.8823419,79.8808345",
  },
  {
    id: "social",
    icon: <IoMegaphone className="h-6 w-6" />,
    title: "Social Media",
    description: "Follow us on Facebook for the latest arrivals.",
    actionLabel: "Follow on Facebook",
    actionUrl: "https://www.facebook.com/unicornenterpriseslk/",
  },
];

export default function ContactBlock({
  badgeText = "Connect With Us",
  title = "How can we assist you today?",
  description = "Reach out for inquiries about our premium tile collections, custom requests, or showroom visits.",
  contactMethods = defaultMethods,
}: ContactBlockProps) {
  return (
    <section className="text-foreground w-full py-12 sm:py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 sm:mb-12 max-w-2xl space-y-4">
          {badgeText && (
            <Badge className="bg-accent/10 text-amber-800 border border-accent/25 px-3 py-1 rounded-full font-semibold uppercase tracking-widest text-[11px]">
              {badgeText}
            </Badge>
          )}
          {title && (
            <h2 className="text-3xl font-display font-bold tracking-tight sm:text-4xl md:text-5xl text-on-surface">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-on-surface-variant text-base sm:text-lg leading-relaxed">{description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {contactMethods.map((method) => (
            <Card
              key={method.id}
              className="bg-surface-container-lowest flex h-full flex-col overflow-hidden rounded-3xl border border-outline/25 p-0 premium-shadow hover:premium-shadow-lg transition-shadow duration-300 ring-0"
            >
              <CardContent className="flex flex-1 flex-col border-none p-6">
                <div className="bg-accent/10 text-accent border border-accent/20 mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl">
                  {method.icon}
                </div>
                <h3 className="mb-2 text-xl font-display font-semibold text-on-surface">{method.title}</h3>
                <p className="text-on-surface-variant text-sm mb-8 flex-1 leading-relaxed">
                  {method.description}
                </p>
                <div className="mt-auto">
                  <Button
                    className="w-full h-auto py-3 px-4 rounded-xl bg-zinc-900 hover:bg-accent text-white text-xs font-semibold tracking-wider transition-colors truncate"
                    render={<a href={method.actionUrl} target="_blank" rel="noopener noreferrer" />}
                  >
                    {method.actionLabel}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

