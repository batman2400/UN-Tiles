import Link from "next/link";
import { ArrowRight, Mail, Phone, LayoutGrid, Globe } from "lucide-react";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-surface-dark text-on-surface-dark">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* Brand */}
        <div className="col-span-1 md:col-span-1 flex flex-col space-y-6">
          <Link href="/" className="inline-flex">
            <Image 
              src="/images/final Logo without background.png" 
              alt="UN Tiles" 
              width={200} 
              height={64} 
              style={{ width: "auto", height: "auto", maxHeight: "64px" }}
              className="logo-edge-blend brightness-150 contrast-75 transition-transform duration-500 hover:scale-[1.03]"
            />
          </Link>
          <p className="text-sm text-on-surface-dark-variant leading-relaxed">
            Architectural precision in high-end tiling. Materializing your vision with structural integrity and timeless design.
          </p>
          <div className="flex space-x-4 pt-2">
            <a href="#" className="w-9 h-9 bg-surface-dark-elevated flex items-center justify-center text-on-surface-dark-variant hover:bg-accent hover:text-on-accent transition-colors duration-300">
              <Globe className="w-4 h-4" />
            </a>
            <a href="#" className="w-9 h-9 bg-surface-dark-elevated flex items-center justify-center text-on-surface-dark-variant hover:bg-accent hover:text-on-accent transition-colors duration-300">
              <LayoutGrid className="w-4 h-4" />
            </a>
            <a href="#" className="w-9 h-9 bg-surface-dark-elevated flex items-center justify-center text-on-surface-dark-variant hover:bg-accent hover:text-on-accent transition-colors duration-300">
              <Mail className="w-4 h-4" />
            </a>
            <a href="#" className="w-9 h-9 bg-surface-dark-elevated flex items-center justify-center text-on-surface-dark-variant hover:bg-accent hover:text-on-accent transition-colors duration-300">
              <Phone className="w-4 h-4" />
            </a>
          </div>
        </div>
        
        {/* Collections */}
        <div>
          <h4 className="font-display font-semibold tracking-wide text-on-surface-dark text-sm uppercase mb-6">Collections</h4>
          <ul className="space-y-3 text-sm text-on-surface-dark-variant">
            <li><Link href="/collections?category=floor" className="hover:text-accent transition-colors duration-300">Floor Tiles</Link></li>
            <li><Link href="/collections?category=wall" className="hover:text-accent transition-colors duration-300">Wall Tiles</Link></li>
            <li><Link href="/collections?category=mosaics" className="hover:text-accent transition-colors duration-300">Mosaics</Link></li>
            <li><Link href="/collections?category=pool-tiles" className="hover:text-accent transition-colors duration-300">Pool Tiles</Link></li>
          </ul>
        </div>

        {/* Studio */}
        <div>
          <h4 className="font-display font-semibold tracking-wide text-on-surface-dark text-sm uppercase mb-6">Studio</h4>
          <ul className="space-y-3 text-sm text-on-surface-dark-variant">
            <li><Link href="/about" className="hover:text-accent transition-colors duration-300">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-accent transition-colors duration-300">Contact</Link></li>
            <li><Link href="#" className="hover:text-accent transition-colors duration-300">Shipping Policy</Link></li>
            <li><Link href="#" className="hover:text-accent transition-colors duration-300">Terms of Service</Link></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="font-display font-semibold tracking-wide text-on-surface-dark text-sm uppercase mb-6">Newsletter</h4>
          <p className="text-sm text-on-surface-dark-variant mb-5">Subscribe for exclusive designs and early access to new collections.</p>
          <div className="flex">
            <input 
              type="email" 
              placeholder="Email address" 
              className="bg-surface-dark-elevated border border-white/10 outline-none text-sm flex-1 px-4 py-3 text-on-surface-dark placeholder:text-on-surface-dark-variant/50 focus:border-accent transition-colors"
            />
            <button className="bg-accent text-on-accent px-4 py-3 hover:bg-accent/90 transition-colors flex-shrink-0">
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Bottom bar */}
      <div className="border-t border-white/8">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-on-surface-dark-variant">
          <p>&copy; {new Date().getFullYear()} UN Tiles (Unicorn Enterprises). All rights reserved.</p>
          <div className="flex space-x-6">
            <Link href="#" className="hover:text-accent transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-accent transition-colors">Cookie Policy</Link>
            <Link href="#" className="hover:text-accent transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
