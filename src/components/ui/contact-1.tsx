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
    <section className="text-foreground w-full py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 max-w-2xl space-y-4">
          {badgeText && <Badge>{badgeText}</Badge>}
          {title && (
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-muted-foreground text-lg">{description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {contactMethods.map((method) => (
            <Card
              key={method.id}
              className="bg-muted flex h-full flex-col overflow-hidden rounded-4xl border-none p-0 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0px_0px_0px_1px_rgba(0,0,0,0.08),0px_1px_2px_-1px_rgba(0,0,0,0.08),0px_2px_4px_0px_rgba(0,0,0,0.08)] ring-0 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0px_0px_0px_1px_rgba(0,0,0,0.08),0px_1px_2px_-1px_rgba(0,0,0,0.08),0px_2px_4px_0px_rgba(0,0,0,0.08)]"
            >
              <CardContent className="flex flex-1 flex-col border-none p-6">
                <div className="bg-card text-foreground mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0px_0px_0px_1px_rgba(0,0,0,0.04),0px_1px_2px_-1px_rgba(0,0,0,0.04),0px_2px_4px_0px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0px_0px_0px_1px_rgba(0,0,0,0.04),0px_1px_2px_-1px_rgba(0,0,0,0.04),0px_2px_4px_0px_rgba(0,0,0,0.04)]">
                  {method.icon}
                </div>
                <h3 className="mb-2 text-xl font-semibold">{method.title}</h3>
                <p className="text-muted-foreground mb-8 flex-1">
                  {method.description}
                </p>
                <div className="mt-auto">
                  <Button
                    className="w-full py-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5),inset_0_-1px_0_0_rgba(0,0,0,0.2)]"
                    render={<a href={method.actionUrl} />}
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

