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
            Where raw elemental matter becomes architectural art.
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
            <p className="text-sm uppercase tracking-[0.2em] text-accent font-semibold mb-3">Since 2009</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-on-surface mb-8">Our Heritage</h2>
            <div className="space-y-6 text-on-surface-variant leading-relaxed">
              <p>
                UN Tiles was born from a singular obsession: the intrinsic beauty of raw, elemental matter. We believe that a tile is not merely a surface covering, but an architectural primitive capable of defining space.
              </p>
              <p>
                For decades, we have partnered with the world&apos;s most renowned quarries and material laboratories, extracting and refining slabs that honor structural integrity and timeless design.
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
          <StatsCounter end={500} suffix="+" label="Projects Completed" />
          <StatsCounter end={15} suffix="+" label="Years of Craft" />
          <StatsCounter end={12} label="Countries Served" />
          <StatsCounter end={50} suffix="+" label="Exclusive Designs" />
        </div>
      </section>

      {/* ══════ VALUES ══════ */}
      <section className="max-w-7xl mx-auto px-6 py-32 w-full">
        <ScrollReveal>
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-[0.2em] text-accent font-semibold mb-3">What Drives Us</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-on-surface">Our Core Values</h2>
          </div>
        </ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: Layers, title: "Craftsmanship", desc: "Every slab undergoes microscopic quality control and precision cutting." },
            { icon: Target, title: "Precision", desc: "Mathematical alignment and extreme formats define our architectural approach." },
            { icon: Heart, title: "Passion", desc: "We don't just sell tiles — we curate geological histories for sacred spaces." },
            { icon: Globe, title: "Sustainability", desc: "Responsibly sourced materials with minimal environmental footprint." },
          ].map((item, idx) => (
            <ScrollReveal key={item.title} delay={idx * 100}>
              <div className="bg-surface-container-lowest p-8 text-center premium-shadow hover:premium-shadow-lg transition-all duration-500 group border-t-2 border-transparent hover:border-accent">
                <div className="w-14 h-14 mx-auto mb-6 bg-accent/10 flex items-center justify-center group-hover:bg-accent group-hover:text-on-accent transition-colors duration-300">
                  <item.icon className="w-6 h-6 text-accent group-hover:text-on-accent transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-display font-semibold text-on-surface mb-3">{item.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{item.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ══════ PHILOSOPHY ══════ */}
      <section className="relative py-32 overflow-hidden">
        <Image
          src="/images/contact_hero.png"
          alt="Showroom"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-primary/85" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <ScrollReveal>
            <p className="text-sm uppercase tracking-[0.2em] text-accent font-semibold mb-4">Our Philosophy</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-white mb-8">The Philosophy of Asymmetry</h2>
            <p className="text-lg leading-relaxed text-white/85 max-w-2xl mx-auto">
              We reject the template. We embrace expansive white space and heavy, grounded blocks of content. Our products provide the canvas; your architecture provides the life.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════ CRAFT ══════ */}
      <section className="max-w-7xl mx-auto px-6 py-32 w-full grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <ScrollReveal>
          <div className="relative aspect-[4/5] bg-surface-container order-2 md:order-1 overflow-hidden premium-shadow-lg">
            <ParallaxLayer
              speed={0.12}
              maxOffset={50}
              className="absolute -inset-x-0 -top-[12%] h-[124%] w-full"
            >
              <Image 
                src="/images/contact_hero.png" 
                alt="Material Extraction" 
                fill 
                className="object-cover"
              />
            </ParallaxLayer>
          </div>
        </ScrollReveal>
        <ScrollReveal delay={150}>
          <div className="order-1 md:order-2 md:pl-12">
            <p className="text-sm uppercase tracking-[0.2em] text-accent font-semibold mb-3">The Process</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-on-surface mb-8">Our Craft</h2>
            <div className="space-y-6 text-on-surface-variant leading-relaxed">
              <p>
                The journey from quarry to installation is one of uncompromising standards. Every slab in our Monolith series undergoes microscopic quality control.
              </p>
              <p>
                We don&apos;t just sell tiles; we curate geological histories, preparing them to last for centuries in your most sacred architectural spaces.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </section>

    </div>
  );
}
