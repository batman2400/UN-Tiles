import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { preload } from "react-dom";
import { getCatalogData } from "@/data/products";
import { ArrowRight, Shield, Truck, Award, Gem } from "lucide-react";
import { ParallaxLayer } from "@/components/ParallaxLayer";
import { ScrollReveal } from "@/components/ScrollReveal";
import { StatsCounter } from "@/components/StatsCounter";
import { ProductCard } from "@/components/ProductCard";
import { Hero10 } from "@/components/ui/hero-10";

export default function Home() {
  preload("/images/light_luxury_tiles.jpg", { as: "image", fetchPriority: "high" });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      
      {/* ══════ HERO SECTION ══════ */}
      <Hero10 />

      {/* ══════ TRUST BAR ══════ */}
      <section className="py-6 border-b ghost-border">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-center gap-8 md:gap-16 text-on-surface-variant">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-accent" />
            <span className="text-sm font-medium tracking-wide">Premium Quality</span>
          </div>
          <div className="hidden md:block w-[1px] h-4 bg-on-surface-variant/20" />
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-accent" />
            <span className="text-sm font-medium tracking-wide">Nationwide Delivery</span>
          </div>
          <div className="hidden md:block w-[1px] h-4 bg-on-surface-variant/20" />
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-accent" />
            <span className="text-sm font-medium tracking-wide">20+ Years Experience</span>
          </div>
          <div className="hidden md:block w-[1px] h-4 bg-on-surface-variant/20" />
          <div className="flex items-center gap-3">
            <Gem className="w-5 h-5 text-accent" />
            <span className="text-sm font-medium tracking-wide">500+ Projects</span>
          </div>
        </div>
      </section>

      {/* ══════ ABOUT US (EDITORIAL) ══════ */}
      <section className="py-24 px-6 border-b ghost-border overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <ScrollReveal className="order-2 lg:order-1 relative">
              <div className="aspect-[4/5] md:aspect-square lg:aspect-[4/5] relative rounded-xl overflow-hidden premium-shadow-lg">
                <Image 
                  src="/images/contact_hero_v6.jpg"
                  alt="UN Tiles Showroom"
                  fill
                  sizes="100vw"
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
              {/* Decorative element */}
              <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-accent/10 rounded-full blur-3xl -z-10" />
            </ScrollReveal>
            
            <ScrollReveal className="order-1 lg:order-2">
              <p className="text-sm uppercase tracking-[0.2em] text-accent font-semibold mb-4">Our Heritage</p>
              <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-on-surface mb-8 leading-tight">
                Crafting Spaces Since <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent/60">2004</span>
              </h2>
              <p className="text-lg leading-relaxed text-on-surface-variant mb-6">
                UN Tiles (Unicorn Enterprises) has been a trusted importer and distributor of premium ceramic tiles in Sri Lanka. Sourcing from leading manufacturers across the globe, we bring world-class quality to your doorstep.
              </p>
              <p className="text-lg leading-relaxed text-on-surface-variant mb-10">
                With over two decades of experience, we remain committed to delivering unparalleled reliability, competitive pricing, and exceptional service for homes and large-scale projects alike.
              </p>
              <Link href="/about" className="kinetic-button inline-flex items-center space-x-3 bg-zinc-900 text-white px-8 py-4 uppercase tracking-widest text-sm font-semibold hover:bg-black transition-all rounded-lg">
                <span>Discover Our Story</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <Suspense fallback={<div className="min-h-[50vh] bg-background" aria-hidden="true" />}>
        <HomeBelowFold />
      </Suspense>
    </div>
  );
}

async function HomeBelowFold() {
  const { featuredProducts, categories } = await getCatalogData();

  return (
    <>
      {/* ══════ CATEGORY GRID ══════ */}
      <section className="max-w-7xl mx-auto px-6 py-24 w-full">
        <ScrollReveal>
          <div className="flex justify-between items-end mb-12">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-accent font-semibold mb-3">Browse by Space</p>
              <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-on-surface">Curated Collections</h2>
            </div>
            <Link href="/collections" className="group flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-on-surface hover:text-accent transition-colors">
              <span className="border-b border-transparent group-hover:border-accent pb-0.5 transition-all">View All</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </ScrollReveal>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, idx) => (
            <ScrollReveal key={cat.slug} delay={idx * 100}>
              <Link
                href={`/collections?category=${cat.slug}`}
                className="group relative block aspect-[4/5] bg-surface-container overflow-hidden rounded-2xl"
              >
                <Image 
                  src={cat.image} 
                  alt={cat.name} 
                  fill 
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-cover transform group-hover:scale-110 transition-transform duration-1000 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
                />
                {/* Gradient overlay that darkens on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
                
                {/* Content block sliding up */}
                <div className="absolute bottom-0 left-0 p-6 w-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <h3 className="text-2xl font-display font-semibold text-white mb-2">{cat.name}</h3>
                  <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                    <p className="text-sm text-white/80 font-medium tracking-wide uppercase">{cat.items} Styles</p>
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-white -rotate-45 group-hover:rotate-0 transition-transform duration-500" />
                    </div>
                  </div>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ══════ WHY CHOOSE US ══════ */}
      <section className="py-24 border-y ghost-border relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[100px] -z-10" />
        
        <div className="max-w-7xl mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="text-sm uppercase tracking-[0.2em] text-accent font-semibold mb-3">The UN Tiles Difference</p>
              <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-on-surface">Why Choose Us</h2>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Shield, title: "Certified Quality", desc: "Every slab undergoes rigorous quality testing to international standards." },
              { icon: Gem, title: "Rare Materials", desc: "Sourced from the world's most renowned quarries and material laboratories." },
              { icon: Truck, title: "Reliable Delivery", desc: "On-time, damage-free delivery with professional handling and installation support." },
              { icon: Award, title: "Expert Guidance", desc: "Our design consultants help you choose the perfect tile for every space." },
            ].map((item, idx) => (
              <ScrollReveal key={item.title} delay={idx * 100}>
                <div className="group relative bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/20 dark:border-white/10 p-8 rounded-2xl hover:bg-white/60 dark:hover:bg-black/60 transition-all duration-500 hover:-translate-y-2 hover:premium-shadow-lg overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/0 dark:from-white/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  
                  <div className="relative z-10 w-14 h-14 mb-6 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center group-hover:scale-110 group-hover:from-accent group-hover:to-accent transition-all duration-500">
                    <item.icon className="w-6 h-6 text-accent group-hover:text-white transition-colors duration-500" />
                  </div>
                  <h3 className="relative z-10 text-xl font-display font-semibold text-on-surface mb-3">{item.title}</h3>
                  <p className="relative z-10 text-sm text-on-surface-variant leading-relaxed">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ FEATURED PRODUCTS ══════ */}
      <section className="max-w-7xl mx-auto px-6 py-24 w-full">
        <ScrollReveal>
          <div className="mb-16">
            <p className="text-sm uppercase tracking-[0.2em] text-accent font-semibold mb-3">Best Sellers</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-on-surface mb-4">Featured Collection</h2>
            <p className="text-on-surface-variant max-w-2xl">
              Our most popular tiles — handpicked for quality, style, and value across every space.
            </p>
          </div>
        </ScrollReveal>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredProducts.map((product, idx) => (
            <ScrollReveal key={product.id} delay={idx * 100}>
              <ProductCard product={product} />
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ══════ STATS BAR ══════ */}
      <section className="relative py-24 overflow-hidden border-t ghost-border">
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="text-sm uppercase tracking-[0.2em] text-accent font-semibold mb-3">Our Impact</p>
              <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-on-surface">By the Numbers</h2>
            </div>
          </ScrollReveal>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { end: 500, suffix: "+", label: "Projects Completed" },
              { end: 20, suffix: "+", label: "Years Experience" },
              { end: 4, suffix: "", label: "Sourcing Locations" },
              { end: 1000, suffix: "+", label: "Satisfied Customers" },
            ].map((stat, idx) => (
              <ScrollReveal key={stat.label} delay={idx * 100}>
                <div className="flex flex-col items-center justify-center text-center group bg-white/50 backdrop-blur-md border border-white/40 p-8 rounded-3xl hover:bg-white/70 transition-all duration-500 hover:-translate-y-2 premium-shadow hover:premium-shadow-lg">
                  <StatsCounter end={stat.end} suffix={stat.suffix} label={stat.label} />
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ CTA SECTION ══════ */}
      <section className="relative py-32 overflow-hidden">
        <ParallaxLayer
          speed={0.1}
          maxOffset={30}
          className="absolute -inset-x-0 -top-[10%] h-[120%] w-full"
        >
          <Image
            src="/images/contact_hero_v6.jpg"
            alt="Premium tile showroom"
            fill
            sizes="100vw"
            className="object-cover"
            unoptimized
          />
        </ParallaxLayer>
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-6">
              Ready to Transform Your Space?
            </h2>
            <p className="text-lg text-slate-700 mb-10 max-w-xl mx-auto">
              Visit our showroom or speak with a design consultant to find the perfect tile for your project.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center space-x-3 bg-zinc-900 hover:bg-black text-white font-semibold px-6 py-3 rounded-lg transition-all"
              >
                <span>GET IN TOUCH</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/collections"
                className="kinetic-button inline-flex items-center justify-center space-x-3 bg-white text-slate-900 border border-slate-300 px-8 py-4 uppercase tracking-widest text-sm font-semibold hover:bg-slate-50 hover:border-slate-400 transition-colors shadow-sm"
              >
                <span>Browse Collections</span>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
