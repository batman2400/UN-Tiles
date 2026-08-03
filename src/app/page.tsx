import Image from "next/image";
import Link from "next/link";
import { getCatalogData } from "@/data/products";
import { ArrowRight } from "lucide-react";
import { ParallaxLayer } from "@/components/ParallaxLayer";

export default async function Home() {
  const { featuredProducts, categories } = await getCatalogData();

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center bg-surface-container-highest overflow-hidden">
        <ParallaxLayer
          speed={0.18}
          maxOffset={54}
          className="absolute -inset-x-0 -top-[8%] h-[116%] w-full"
        >
          <Image 
            src="/images/landing_hero.png" 
            alt="Luxury modern interior with slate tiles" 
            fill 
            className="object-cover object-center opacity-90 mix-blend-multiply filter grayscale-[30%]"
            priority
          />
        </ParallaxLayer>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full flex flex-col items-center text-center">
          <div className="bg-surface-container-lowest/90 backdrop-blur-md p-10 md:p-16 max-w-3xl motion-fade-up motion-delay-1">
            <h1 className="text-4xl md:text-6xl font-display font-medium tracking-tight text-on-surface mb-6">
              Materializing <br/> <span className="text-primary italic">Vision.</span>
            </h1>
            <p className="text-lg text-on-surface-variant max-w-xl mx-auto mb-10">
              Architectural precision in high-end tiling. Structural integrity meets timeless design.
            </p>
            <Link 
              href="/collections" 
              className="kinetic-button inline-flex items-center space-x-3 bg-primary text-on-primary px-8 py-4 uppercase tracking-widest text-sm font-semibold hover:bg-primary-dim transition-colors"
            >
              <span>Explore Premium Tiles</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="max-w-7xl mx-auto px-6 py-24 w-full">
        <div className="flex justify-between items-end mb-12 motion-fade-up">
          <h2 className="text-3xl font-display tracking-tight text-on-surface">Curated by Space</h2>
          <Link href="/collections" className="kinetic-link text-sm font-semibold uppercase tracking-widest text-primary border-b border-primary/30 pb-1 hover:border-primary transition-colors">
            View All
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, idx) => (
             <Link
              key={cat.slug}
              href={`/collections?category=${cat.slug}`}
              className="group relative block aspect-[4/5] bg-surface-container overflow-hidden interactive-card motion-fade-up"
              style={{ animationDelay: `${90 + idx * 80}ms` }}
            >
              <Image 
                src={cat.image} 
                alt={cat.name} 
                fill 
                className="object-cover transform group-hover:scale-105 transition-transform duration-700 ease-in-out filter grayscale group-hover:grayscale-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-highest/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-0 left-0 p-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <h3 className="text-xl font-display text-on-surface mb-1">{cat.name}</h3>
                <p className="text-sm text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity duration-500">{cat.items} Styles</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-surface-container-low w-full py-24 ghost-border border-y">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 motion-fade-up">
            <h2 className="text-3xl font-display tracking-tight text-on-surface mb-4">The Monolith Series</h2>
            <p className="text-on-surface-variant max-w-2xl">
              Our most sought-after slabs, defined by extreme formats and mathematical alignment.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product, idx) => (
              <div
                key={product.id}
                className="group bg-surface-container-lowest p-4 interactive-card motion-fade-up"
                style={{ animationDelay: `${120 + idx * 90}ms` }}
              >
                <div className="relative aspect-square mb-6 overflow-hidden bg-surface-container">
                  <Image 
                    src={product.image} 
                    alt={product.name} 
                    fill 
                    className="object-cover"
                  />
                </div>
                <div className="space-y-2 mb-6">
                  <p className="text-xs uppercase tracking-widest text-outline">{product.category}</p>
                  <h3 className="text-lg font-display text-on-surface">{product.name}</h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-on-surface-variant">{product.dimensions}</span>
                    <span className="font-semibold text-on-surface">{product.price} / sq ft</span>
                  </div>
                </div>
                <button className="w-full kinetic-button bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface transition-colors py-3 text-sm font-semibold tracking-wide uppercase">
                  <span>Add to Cart</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
