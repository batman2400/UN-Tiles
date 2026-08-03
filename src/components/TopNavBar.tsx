import Link from "next/link";
import { Search, ShoppingCart, Menu } from "lucide-react";
import Image from "next/image";

export function TopNavBar() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Mobile menu icon */}
        <button className="md:hidden icon-button-lift text-on-surface-variant hover:text-on-surface transition-colors duration-300">
          <Menu className="w-6 h-6" />
        </button>

        {/* Logo */}
        <Link href="/" className="flex-shrink-0 flex items-center motion-fade-up">
          <Image 
            src="/images/logo.png" 
            alt="UN Tiles" 
            width={120} 
            height={40} 
            style={{ width: "auto", height: "auto" }}
            className="object-contain logo-edge-blend transition-transform duration-500 hover:scale-[1.03]"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex flex-1 justify-center gap-8">
          <Link href="/" className="kinetic-link text-sm tracking-widest uppercase font-semibold text-on-surface-variant hover:text-on-surface transition-colors duration-300">Home</Link>
          <Link href="/collections" className="kinetic-link text-sm tracking-widest uppercase font-semibold text-on-surface-variant hover:text-on-surface transition-colors duration-300">Collections</Link>
          <Link href="/about" className="kinetic-link text-sm tracking-widest uppercase font-semibold text-on-surface-variant hover:text-on-surface transition-colors duration-300">About Us</Link>
          <Link href="/contact" className="kinetic-link text-sm tracking-widest uppercase font-semibold text-on-surface-variant hover:text-on-surface transition-colors duration-300">Contact</Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-6">
          <button className="icon-button-lift text-on-surface-variant hover:text-on-surface transition-colors duration-300">
            <Search className="w-5 h-5" />
          </button>
          <button className="relative icon-button-lift text-on-surface-variant hover:text-on-surface transition-colors duration-300">
            <ShoppingCart className="w-5 h-5" />
            <span className="absolute -top-1.5 -right-1.5 bg-primary text-on-primary text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
              2
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
