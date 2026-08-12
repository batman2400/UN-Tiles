import Image from "next/image";
import aboutHeroImage from "../../../../public/images/about.png";
import landingHeroImage from "../../../../public/images/landing_hero.png";
import { Star } from "lucide-react";
import { ParallaxLayer } from "@/components/ParallaxLayer";
import { ScrollReveal } from "@/components/ScrollReveal";
import { StatsCounter } from "@/components/StatsCounter";
export default function About() {
  return (
    <div className="flex flex-col min-h-screen">
      
      {/* ══════ HERO ══════ */}
      <section className="relative h-[85vh] flex items-center justify-center bg-surface-dark overflow-hidden pt-32">
        <ParallaxLayer
          speed={0.2}
          maxOffset={64}
          className="absolute -inset-x-0 -top-[10%] h-[120%] w-full"
        >
          <Image 
            src={aboutHeroImage} 
            alt="Monolith Texture" 
            fill 
            className="object-cover object-center opacity-100"
            priority
            placeholder="blur"
          />
        </ParallaxLayer>
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-background/90" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-accent font-semibold mb-4 motion-fade-up">Built to Last</p>
          <h1 className="text-5xl md:text-8xl font-display font-bold tracking-tight text-white mb-6 motion-fade-up motion-delay-1">
            Our Story
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
        <div className="flex flex-col justify-center">
          <ScrollReveal>
            <p className="text-sm uppercase tracking-[0.2em] text-accent font-semibold mb-3">Since 2004</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-on-surface mb-8">Our Heritage</h2>
          </ScrollReveal>
          <div className="space-y-6 text-on-surface-variant leading-relaxed">
            <ScrollReveal delay={100}>
              <p>
                Established in 2004, UN Tiles (Unicorn Enterprises) was founded with a simple vision—to provide Sri Lankan customers with high-quality ceramic tiles and sanitary products at competitive prices. Over the years, we have built a strong reputation as a trusted importer and distributor by offering reliable products, exceptional customer service, and a wide selection suitable for both residential and commercial projects.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <p>
                With more than two decades of industry experience, we continue to help homeowners, architects, contractors, and developers find the perfect ceramic solutions for every space.
              </p>
            </ScrollReveal>
          </div>
        </div>
        <ScrollReveal delay={150}>
          <div className="relative aspect-[4/5] bg-surface-container overflow-hidden premium-shadow-lg">
            <ParallaxLayer
              speed={0.12}
              maxOffset={50}
              className="absolute -inset-x-0 -top-[12%] h-[124%] w-full"
            >
              <Image 
                src={landingHeroImage} 
                alt="Studio Process" 
                fill 
                className="object-cover"
                placeholder="blur"
              />
            </ParallaxLayer>
          </div>
        </ScrollReveal>
      </section>

      {/* ══════ GOOGLE REVIEWS ══════ */}
      <section className="py-24 px-6 border-t border-b ghost-border">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <p className="text-sm uppercase tracking-[0.2em] text-accent font-semibold mb-3">Customer Reviews</p>
              <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-on-surface">What Our Customers Say</h2>
              <div className="mt-4 flex flex-col md:flex-row items-center justify-center gap-3 text-sm text-on-surface-variant">
                <div className="inline-flex items-center gap-2">
                  <span className="text-amber-400 text-lg">★★★★★</span>
                  <span className="font-semibold text-on-surface">5.0</span>
                </div>
                <span>·</span>
                <span>5 Google reviews</span>
              </div>
            </div>
          </ScrollReveal>

          <div className="grid gap-6 md:grid-cols-3">
            <ScrollReveal>
              <div className="rounded-[2rem] border border-outline bg-surface-container p-8 shadow-sm">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="font-semibold text-on-surface">Tharushi Himadhya</p>
                    <p className="text-sm text-on-surface-variant mt-1">Local Guide · 172 reviews · 10 photos · 2 months ago</p>
                  </div>
                  <div className="inline-flex items-center gap-0.5 text-amber-400 text-sm">
                    <Star className="w-4 h-4" />
                    <Star className="w-4 h-4" />
                    <Star className="w-4 h-4" />
                    <Star className="w-4 h-4" />
                    <Star className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-on-surface-variant leading-relaxed">The service was excellent, and I’m very satisfied with the overall experience. Highly recommended!</p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="rounded-[2rem] border border-outline bg-surface-container p-8 shadow-sm">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="font-semibold text-on-surface">sahan dilshan weerasinghe</p>
                    <p className="text-sm text-on-surface-variant mt-1">Local Guide · 172 reviews · 729 photos · 6 years ago</p>
                  </div>
                  <div className="inline-flex items-center gap-0.5 text-amber-400 text-sm">
                    <Star className="w-4 h-4" />
                    <Star className="w-4 h-4" />
                    <Star className="w-4 h-4" />
                    <Star className="w-4 h-4" />
                    <Star className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-on-surface-variant leading-relaxed">You can buy high quality tiles and bathroom wear</p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="rounded-[2rem] border border-outline bg-surface-container p-8 shadow-sm">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="font-semibold text-on-surface">Mahil Fernando</p>
                    <p className="text-sm text-on-surface-variant mt-1">Local Guide · 21 reviews · 30 photos · 6 years ago</p>
                  </div>
                  <div className="inline-flex items-center gap-0.5 text-amber-400 text-sm">
                    <Star className="w-4 h-4" />
                    <Star className="w-4 h-4" />
                    <Star className="w-4 h-4" />
                    <Star className="w-4 h-4" />
                    <Star className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-on-surface-variant leading-relaxed">Highly recommended</p>
              </div>
            </ScrollReveal>
          </div>

          <div className="mt-10 text-center">
            <a
              href="https://www.google.com/maps/place/Unicorn+enterprises/@6.8823419,79.8782596,17z/data=!4m14!1m5!8m4!1e3!2s115182345948015479158!3m1!1e1!3m7!1s0x3ae25bea34d46f43:0xff138b19444c3466!8m2!3d6.8823419!4d79.8808345!9m1!1b1!16s%2Fg%2F11jgtbkjph?entry=ttu&g_ep=EgoyMDI2MDgwNS4xIKXMDSoASAFQAw%3D%3D"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-outline px-6 py-3 text-sm font-semibold text-on-surface transition hover:bg-accent/5"
            >
              View all reviews on Google
            </a>
          </div>
        </div>
      </section>

      {/* ══════ STATS ══════ */}
      <section className="bg-surface-dark py-20 relative before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-accent/40 before:to-transparent after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-accent/40 after:to-transparent">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10 text-on-surface-dark relative z-10">
          <StatsCounter end={20} suffix="+" label="Years of Experience" dark />
          <StatsCounter end={1000} suffix="+" label="Satisfied Customers" dark />
          <StatsCounter end={4} label="Sourcing Locations" dark />
          <StatsCounter end={500} suffix="+" label="Projects Supplied" dark />
        </div>
      </section>

      {/* ══════ PRODUCT SOURCING ══════ */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <p className="text-sm uppercase tracking-[0.2em] text-accent font-semibold mb-4">Product Sourcing</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-on-surface mb-8">Global Sourcing, Local Trust</h2>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <p className="text-lg leading-relaxed text-on-surface-variant max-w-2xl mx-auto">
              Our products are carefully sourced from leading manufacturers across China, Vietnam, India, and Lanka Tiles (Sri Lanka).
            </p>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <p className="mt-6 text-lg leading-relaxed text-on-surface-variant max-w-2xl mx-auto">
              This allows us to offer customers a diverse range of designs, finishes, sizes, and price points to suit every project.
            </p>
          </ScrollReveal>
        </div>
      </section>


    </div>
  );
}