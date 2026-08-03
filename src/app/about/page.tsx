import Image from "next/image";
import { ParallaxLayer } from "@/components/ParallaxLayer";

export default function About() {
  return (
    <div className="flex flex-col min-h-screen">
      
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center bg-surface-container-highest overflow-hidden">
        <ParallaxLayer
          speed={0.2}
          maxOffset={64}
          className="absolute -inset-x-0 -top-[10%] h-[120%] w-full"
        >
          <Image 
            src="/images/monolith_about.png" 
            alt="Monolith Texture" 
            fill 
            className="object-cover object-center opacity-80 mix-blend-multiply"
            priority
          />
        </ParallaxLayer>
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full text-center">
          <h1 className="text-5xl md:text-7xl font-display font-medium tracking-tight text-surface-container-lowest drop-shadow-2xl mb-6 motion-fade-up motion-delay-1">
            The Monolith.
          </h1>
        </div>
      </section>

      {/* Heritage */}
      <section className="max-w-7xl mx-auto px-6 py-32 w-full grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div className="motion-fade-up">
          <h2 className="text-3xl font-display tracking-tight text-on-surface mb-8">Our Heritage</h2>
          <div className="space-y-6 text-on-surface-variant leading-relaxed">
            <p>
              UN Tiles was born from a singular obsession: the intrinsic beauty of raw, elemental matter. We believe that a tile is not merely a surface covering, but an architectural primitive capable of defining space.
            </p>
            <p>
              For decades, we have partnered with the world&apos;s most renowned quarries and material laboratories, extracting and refining slabs that honor structural integrity and timeless design.
            </p>
          </div>
        </div>
        <div className="relative aspect-[4/5] bg-surface-container overflow-hidden interactive-card motion-fade-up motion-delay-1">
          <ParallaxLayer
            speed={0.12}
            maxOffset={50}
            className="absolute -inset-x-0 -top-[12%] h-[124%] w-full"
          >
            <Image 
              src="/images/landing_hero.png" 
              alt="Studio Process" 
              fill 
              className="object-cover filter grayscale"
            />
          </ParallaxLayer>
        </div>
      </section>

      {/* Philosophy */}
      <section className="bg-primary text-on-primary py-32">
        <div className="max-w-4xl mx-auto px-6 text-center motion-fade-up">
          <h2 className="text-3xl font-display tracking-tight mb-8">The Philosophy of Asymmetry</h2>
          <p className="text-lg leading-relaxed opacity-90 max-w-2xl mx-auto">
            We reject the template. We embrace expansive white space and heavy, grounded blocks of content. Our products provide the canvas; your architecture provides the life.
          </p>
        </div>
      </section>

      {/* Craft */}
      <section className="max-w-7xl mx-auto px-6 py-32 w-full grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div className="relative aspect-[4/5] bg-surface-container order-2 md:order-1 overflow-hidden interactive-card motion-fade-up">
          <ParallaxLayer
            speed={0.12}
            maxOffset={50}
            className="absolute -inset-x-0 -top-[12%] h-[124%] w-full"
          >
            <Image 
              src="/images/contact_hero.png" 
              alt="Material Extraction" 
              fill 
              className="object-cover filter grayscale"
            />
          </ParallaxLayer>
        </div>
        <div className="order-1 md:order-2 md:pl-12 motion-fade-up motion-delay-1">
          <h2 className="text-3xl font-display tracking-tight text-on-surface mb-8">Our Craft</h2>
          <div className="space-y-6 text-on-surface-variant leading-relaxed">
            <p>
              The journey from quarry to installation is one of uncompromising standards. Every slab in our Monolith series undergoes microscopic quality control.
            </p>
            <p>
              We don&apos;t just sell tiles; we curate geological histories, preparing them to last for centuries in your most sacred architectural spaces.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
