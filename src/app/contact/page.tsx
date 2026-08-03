import Image from "next/image";
import { ParallaxLayer } from "@/components/ParallaxLayer";

export default function Contact() {
  return (
    <div className="flex flex-col min-h-screen">
      
      {/* Hero Section */}
      <section className="relative h-[50vh] flex items-center justify-center bg-surface-container-highest overflow-hidden">
        <ParallaxLayer
          speed={0.2}
          maxOffset={48}
          className="absolute -inset-x-0 -top-[10%] h-[120%] w-full"
        >
          <Image 
            src="/images/contact_hero.png" 
            alt="Modern Showroom" 
            fill 
            className="object-cover object-center opacity-80 mix-blend-multiply filter grayscale-[20%]"
            priority
          />
        </ParallaxLayer>
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full text-center">
          <div className="bg-surface-container-lowest/90 backdrop-blur-md inline-block p-10 motion-fade-up motion-delay-1">
            <h1 className="text-4xl md:text-5xl font-display font-medium tracking-tight text-on-surface">
              Get in Touch
            </h1>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-6 py-24 w-full grid grid-cols-1 md:grid-cols-2 gap-24">
        
        {/* Info */}
        <div className="space-y-16 motion-fade-up">
          <div>
            <h2 className="text-2xl font-display tracking-tight text-on-surface mb-6">HQ / Flagship Studio</h2>
            <div className="space-y-2 text-on-surface-variant leading-relaxed">
              <p>100 Architectural Way</p>
              <p>Design District, NY 10001</p>
              <p className="pt-4 font-semibold text-on-surface">P: +1 (555) 123-4567</p>
              <p className="font-semibold text-on-surface">E: studio@untiles.com</p>
            </div>
          </div>
          
          <div>
            <h2 className="text-2xl font-display tracking-tight text-on-surface mb-6">Global Showrooms</h2>
            <div className="space-y-6 text-on-surface-variant">
              <div>
                <p className="font-semibold text-on-surface mb-1">London</p>
                <p>45 Monolith Building, Clerkenwell EC1M</p>
              </div>
              <div>
                <p className="font-semibold text-on-surface mb-1">Milan</p>
                <p>Via Brera 22, 20121 Milano MI</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-surface-container-low p-10 ghost-border motion-fade-up motion-delay-1 interactive-card">
          <h2 className="text-2xl font-display tracking-tight text-on-surface mb-8">Inquire</h2>
          <form className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="flex flex-col">
                <label className="text-xs uppercase tracking-widest text-on-surface-variant mb-2">Name *</label>
                <input type="text" className="form-field-animate bg-transparent border-b border-outline focus:border-primary outline-none py-2 text-on-surface transition-colors" required />
              </div>
              <div className="flex flex-col">
                <label className="text-xs uppercase tracking-widest text-on-surface-variant mb-2">Company Name</label>
                <input type="text" className="form-field-animate bg-transparent border-b border-outline focus:border-primary outline-none py-2 text-on-surface transition-colors" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="flex flex-col">
                <label className="text-xs uppercase tracking-widest text-on-surface-variant mb-2">Email *</label>
                <input type="email" className="form-field-animate bg-transparent border-b border-outline focus:border-primary outline-none py-2 text-on-surface transition-colors" required />
              </div>
              <div className="flex flex-col">
                <label className="text-xs uppercase tracking-widest text-on-surface-variant mb-2">Phone Number</label>
                <input type="tel" className="form-field-animate bg-transparent border-b border-outline focus:border-primary outline-none py-2 text-on-surface transition-colors" />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-xs uppercase tracking-widest text-on-surface-variant mb-2">Project Type</label>
              <select className="form-field-animate bg-transparent border-b border-outline focus:border-primary outline-none py-2 text-on-surface transition-colors appearance-none cursor-pointer rounded-none">
                <option>Residential</option>
                <option>Commercial</option>
                <option>Public Space</option>
                <option>Other</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-xs uppercase tracking-widest text-on-surface-variant mb-2">Message *</label>
              <textarea rows={4} className="form-field-animate bg-transparent border-b border-outline focus:border-primary outline-none py-2 text-on-surface transition-colors resize-none" required></textarea>
            </div>

            <button type="submit" className="kinetic-button bg-primary text-on-primary px-8 py-4 uppercase tracking-widest text-sm font-semibold hover:bg-primary-dim transition-colors w-full">
              <span>Submit Inquiry</span>
            </button>
          </form>
        </div>
        
      </section>

    </div>
  );
}
