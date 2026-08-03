import Link from "next/link";
import { ArrowRight, Mail, Phone, LayoutGrid } from "lucide-react";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-surface-container-low border-t ghost-border py-16 mt-24">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-1 flex flex-col space-y-6 motion-fade-up">
          <Link href="/" className="inline-flex">
            <Image 
              src="/images/logo.png" 
              alt="UN Tiles" 
              width={100} 
              height={32} 
              style={{ width: "auto", height: "auto" }}
              className="logo-edge-blend mix-blend-multiply opacity-80 mix-blend-darken filter grayscale transition-transform duration-500 hover:scale-[1.03]"
            />
          </Link>
          <p className="text-sm text-on-surface-variant max-w-xs leading-relaxed">
            Architectural precision in high-end tiling. Materializing your vision with structural integrity and timeless design.
          </p>
        </div>
        
        <div className="motion-fade-up motion-delay-1">
          <h4 className="font-display font-semibold tracking-wide text-on-surface mb-6">Collections</h4>
          <ul className="space-y-4 text-sm text-on-surface-variant">
            <li><Link href="/collections" className="kinetic-link hover:text-primary transition-colors">Floor Tiles</Link></li>
            <li><Link href="/collections" className="kinetic-link hover:text-primary transition-colors">Wall Elegance</Link></li>
            <li><Link href="/collections" className="kinetic-link hover:text-primary transition-colors">Bathroom Monolith</Link></li>
            <li><Link href="/collections" className="kinetic-link hover:text-primary transition-colors">Outdoor Slate</Link></li>
          </ul>
        </div>

        <div className="motion-fade-up motion-delay-2">
          <h4 className="font-display font-semibold tracking-wide text-on-surface mb-6">Studio</h4>
          <ul className="space-y-4 text-sm text-on-surface-variant">
            <li><Link href="/about" className="kinetic-link hover:text-primary transition-colors">About Us</Link></li>
            <li><Link href="/contact" className="kinetic-link hover:text-primary transition-colors">Contact</Link></li>
            <li><Link href="#" className="kinetic-link hover:text-primary transition-colors">Shipping Policy</Link></li>
            <li><Link href="#" className="kinetic-link hover:text-primary transition-colors">Terms of Service</Link></li>
          </ul>
        </div>

        <div className="motion-fade-up motion-delay-3">
          <h4 className="font-display font-semibold tracking-wide text-on-surface mb-6">Newsletter</h4>
          <p className="text-sm text-on-surface-variant mb-4">Subscribe for exclusive designs.</p>
          <div className="flex border-b border-outline focus-within:border-primary transition-colors pb-2">
            <input 
              type="email" 
              placeholder="Email address" 
              className="bg-transparent border-none outline-none text-sm w-full text-on-surface placeholder:text-outline-variant"
            />
            <button className="icon-button-lift text-primary hover:text-primary-dim pl-2">
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex space-x-4 mt-8">
            <a href="#" className="icon-button-lift text-on-surface-variant hover:text-primary transition-colors"><Mail className="w-5 h-5" /></a>
            <a href="#" className="icon-button-lift text-on-surface-variant hover:text-primary transition-colors"><Phone className="w-5 h-5" /></a>
            <a href="#" className="icon-button-lift text-on-surface-variant hover:text-primary transition-colors"><LayoutGrid className="w-5 h-5" /></a>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t ghost-border text-xs text-on-surface-variant flex flex-col md:flex-row justify-between items-center">
        <p>&copy; {new Date().getFullYear()} UN Tiles. All rights reserved.</p>
        <div className="flex space-x-6 mt-4 md:mt-0">
          <Link href="#" className="kinetic-link hover:text-primary transition-colors">Privacy</Link>
          <Link href="#" className="kinetic-link hover:text-primary transition-colors">Cookies</Link>
        </div>
      </div>
    </footer>
  );
}
