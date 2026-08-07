import Image from "next/image";
import Link from "next/link";
import { getCatalogData } from "@/data/products";
import { ArrowRight, Shield, Truck, Award, Gem } from "lucide-react";
import { ParallaxLayer } from "@/components/ParallaxLayer";
import { ScrollReveal } from "@/components/ScrollReveal";
import { StatsCounter } from "@/components/StatsCounter";
import { ProductCard } from "@/components/ProductCard";
import { Hero10 } from "@/components/ui/hero-10";
export default async function Home() {
  const { featuredProducts, categories } = await getCatalogData();

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* ══════ HERO SECTION ══════ */}
      <Hero10 />

      {/* ══════ TRUST BAR ══════ */}
      <section className="bg-surface-dark py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-center gap-8 md:gap-16 text-on-surface-dark-variant">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-accent" />
            <span className="text-sm font-medium tracking-wide">Premium Quality</span>
          </div>
          <div className="hidden md:block w-[1px] h-4 bg-on-surface-dark-variant/20" />
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-accent" />
            <span className="text-sm font-medium tracking-wide">Nationwide Delivery</span>
          </div>
          <div className="hidden md:block w-[1px] h-4 bg-on-surface-dark-variant/20" />
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-accent" />
            <span className="text-sm font-medium tracking-wide">20+ Years Experience</span>
          </div>
          <div className="hidden md:block w-[1px] h-4 bg-on-surface-dark-variant/20" />
          <div className="flex items-center gap-3">
            <Gem className="w-5 h-5 text-accent" />
            <span className="text-sm font-medium tracking-wide">500+ Projects</span>
          </div>
        </div>
      </section>

      {/* ══════ ABOUT US (SHORT) ══════ */}
      <section className="bg-surface-container-low py-20 px-6 border-b ghost-border">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <p className="text-sm uppercase tracking-[0.2em] text-accent font-semibold mb-4">Our Heritage</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-on-surface mb-8">UN Tiles (Unicorn Enterprises)</h2>
            <p className="text-lg leading-relaxed text-on-surface-variant max-w-3xl mx-auto">
              Since 2004, UN Tiles (Unicorn Enterprises) has been a trusted importer and distributor of premium ceramic tiles and related products in Sri Lanka. Sourcing from leading manufacturers in China, Vietnam, India, and Lanka Tiles, we offer high-quality products, competitive pricing, and a wide range of designs for homes, businesses, and large-scale construction projects. With over two decades of experience and thousands of satisfied customers, we remain committed to delivering quality, reliability, and exceptional customer service.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════ CATEGORY GRID ══════ */}
      <section className="max-w-7xl mx-auto px-6 py-24 w-full">
        <ScrollReveal>
          <div className="flex justify-between items-end mb-12">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-accent font-semibold mb-3">Browse by Space</p>
              <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-on-surface">Curated Collections</h2>
            </div>
            <Link href="/collections" className="kinetic-link text-sm font-semibold uppercase tracking-widest text-accent border-b border-accent/30 pb-1 hover:border-accent transition-colors">
              View All
            </Link>
          </div>
        </ScrollReveal>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, idx) => (
            <ScrollReveal key={cat.slug} delay={idx * 100}>
              <Link
                href={`/collections?category=${cat.slug}`}
                className="group relative block aspect-[4/5] bg-surface-container overflow-hidden premium-shadow hover:premium-shadow-lg transition-shadow duration-500"
              >
                <Image 
                  src={cat.image} 
                  alt={cat.name} 
                  fill 
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-cover transform group-hover:scale-105 transition-transform duration-700 ease-in-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                  <h3 className="text-xl font-display font-semibold text-white mb-1">{cat.name}</h3>
                  <p className="text-sm text-white/70">{cat.items} Styles</p>
                </div>
                <div className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ══════ WHY CHOOSE US ══════ */}
      <section className="bg-surface-container-low py-24 border-y ghost-border">
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
                <div className="bg-surface-container-lowest p-8 text-center premium-shadow hover:premium-shadow-lg transition-shadow duration-500 group">
                  <div className="w-14 h-14 mx-auto mb-6 bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors duration-300">
                    <item.icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-lg font-display font-semibold text-on-surface mb-3">{item.title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{item.desc}</p>
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
      <section className="bg-slate-50 py-20 border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10 text-slate-900">
          <StatsCounter end={500} suffix="+" label="Projects Completed" />
          <StatsCounter end={20} suffix="+" label="Years Experience" />
          <StatsCounter end={4} label="Sourcing Locations" />
          <StatsCounter end={1000} suffix="+" label="Satisfied Customers" />
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
            src="/images/contact_hero.png"
            alt="Premium tile showroom"
            fill
            className="object-cover"
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
                className="kinetic-button inline-flex items-center justify-center space-x-3 bg-blue-700 text-white px-8 py-4 uppercase tracking-widest text-sm font-semibold hover:bg-blue-800 transition-colors shadow-lg"
              >
                <span>Get in Touch</span>
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

    </div>
  );
}
