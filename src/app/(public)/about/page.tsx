import Image from "next/image";
import { ParallaxLayer } from "@/components/ParallaxLayer";
import { ScrollReveal } from "@/components/ScrollReveal";
import { StatsCounter } from "@/components/StatsCounter";
import { Layers, Target, Heart, Globe } from "lucide-react";

export default function About() {
  return (
    <div className="flex flex-col min-h-screen">
      
      {/* ══════ HERO ══════ */}
      <section className="relative h-[85vh] flex items-center justify-center bg-surface-dark overflow-hidden">
        <ParallaxLayer
          speed={0.2}
          maxOffset={64}
          className="absolute -inset-x-0 -top-[10%] h-[120%] w-full"
        >
          <Image 
            src="/images/monolith_about.png" 
            alt="Monolith Texture" 
            fill 
            className="object-cover object-center opacity-60"
            priority
          />
        </ParallaxLayer>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/40" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-accent font-semibold mb-4 motion-fade-up">Our Story</p>
          <h1 className="text-5xl md:text-8xl font-display font-bold tracking-tight text-white mb-6 motion-fade-up motion-delay-1">
            The Monolith.
          </h1>
          <p className="text-lg text-white/70 max-w-xl mx-auto motion-fade-up motion-delay-2">
            Building beautiful spaces with quality ceramic solutions.
          </p>
        </div>
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-60">
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/60">Scroll</span>
          <div className="w-[1px] h-8 bg-gradient-to-b from-white/60 to-transparent" />
        </div>
      </section>

      {/* ══════ HERITAGE ══════ */}
      <section className="max-w-7xl mx-auto px-6 py-32 w-full grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <ScrollReveal>
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-accent font-semibold mb-3">Since 2004</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-on-surface mb-8">Our Heritage</h2>
            <div className="space-y-6 text-on-surface-variant leading-relaxed">
              <p>
                Established in 2004, UN Tiles was founded with a simple vision—to provide Sri Lankan customers with high-quality ceramic tiles and sanitary products at competitive prices. Over the years, we have built a strong reputation as a trusted importer and distributor by offering reliable products, exceptional customer service, and a wide selection suitable for both residential and commercial projects.
              </p>
              <p>
                With more than two decades of industry experience, we continue to help homeowners, architects, contractors, and developers find the perfect ceramic solutions for every space.
              </p>
            </div>
          </div>
        </ScrollReveal>
        <ScrollReveal delay={150}>
          <div className="relative aspect-[4/5] bg-surface-container overflow-hidden premium-shadow-lg">
            <ParallaxLayer
              speed={0.12}
              maxOffset={50}
              className="absolute -inset-x-0 -top-[12%] h-[124%] w-full"
            >
              <Image 
                src="/images/landing_hero.png" 
                alt="Studio Process" 
                fill 
                className="object-cover"
              />
            </ParallaxLayer>
          </div>
        </ScrollReveal>
      </section>

      {/* ══════ STATS ══════ */}
      <section className="bg-surface-dark py-20">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10 text-on-surface-dark">
          <StatsCounter end={20} suffix="+" label="Years of Experience" />
          <StatsCounter end={1000} suffix="+" label="Customers Served" />
          <StatsCounter end={4} label="Sourcing Locations" />
          <StatsCounter end={500} suffix="+" label="Projects Supplied" />
        </div>
      </section>

      {/* ══════ PRODUCT SOURCING ══════ */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <p className="text-sm uppercase tracking-[0.2em] text-accent font-semibold mb-4">Product Sourcing</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-on-surface mb-8">Global Sourcing, Local Trust</h2>
            <p className="text-lg leading-relaxed text-on-surface-variant max-w-2xl mx-auto">
              Our products are carefully sourced from leading manufacturers across China, Vietnam, India, and Lanka Tiles (Sri Lanka).
            </p>
            <p className="mt-6 text-lg leading-relaxed text-on-surface-variant max-w-2xl mx-auto">
              This allows us to offer customers a diverse range of designs, finishes, sizes, and price points to suit every project.
            </p>
          </ScrollReveal>
        </div>
      </section>


    </div>
  );
}