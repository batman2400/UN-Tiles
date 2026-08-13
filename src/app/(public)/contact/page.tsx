import Image from "next/image";
import { preload } from "react-dom";
import { ParallaxLayer } from "@/components/ParallaxLayer";
import { ScrollReveal } from "@/components/ScrollReveal";
import { MapPin } from "lucide-react";
import ContactBlock from "@/components/ui/contact-1";
import ContactSolutionForm from "@/components/ui/contact-4";

export default function Contact() {
  preload("/images/contact_hero.jpg", { as: "image", fetchPriority: "high" });

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* ══════ HERO ══════ */}
      <section
        className="relative h-[42vh] min-h-[280px] sm:h-[55vh] sm:min-h-[350px] flex items-center justify-center bg-background overflow-hidden pt-24 sm:pt-32"
        style={{
          backgroundImage: "url(/images/contact_hero.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <ParallaxLayer
          speed={0.2}
          maxOffset={48}
          className="absolute -inset-x-0 -top-[10%] h-[120%] w-full"
        >
          <Image 
            src="/images/contact_hero.jpg" 
            alt="UN Tiles Showroom" 
            fill 
            sizes="100vw"
            className="object-cover"
            priority
            unoptimized
          />
        </ParallaxLayer>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-background/90" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-accent font-semibold mb-4 motion-fade-up">Let&apos;s Connect</p>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-display font-bold tracking-tight text-white motion-fade-up motion-delay-1">
            Get in Touch
          </h1>
        </div>
      </section>

      {/* ══════ CONTACT METHODS (contact-1) ══════ */}
      <ScrollReveal>
        <ContactBlock />
      </ScrollReveal>

      {/* ══════ CONTACT SOLUTION FORM (contact-4) ══════ */}
      <ScrollReveal>
        <ContactSolutionForm />
      </ScrollReveal>

      {/* ══════ MAP ══════ */}
      <section className="w-full">
        <ScrollReveal>
          <div className="relative w-full h-[320px] sm:h-[480px] overflow-hidden">
            {/* Accent top border */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent z-10" />
            {/* Dark overlay label */}
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-auto sm:top-6 sm:right-6 sm:left-auto z-10 bg-surface-dark/90 backdrop-blur-sm px-4 py-3 sm:px-5 premium-shadow flex items-start sm:items-center gap-3 max-w-full sm:max-w-md">
              <MapPin className="w-4 h-4 text-accent flex-shrink-0 mt-0.5 sm:mt-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-dark-variant">Head Office</p>
                <p className="text-sm font-semibold text-on-surface-dark break-words">No. 161/A, Polhengoda Road, Colombo 05</p>
              </div>
            </div>
            <iframe
              title="UN Tiles Location"
              src="https://maps.google.com/maps?q=6.8823419,79.8808345&z=17&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
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
