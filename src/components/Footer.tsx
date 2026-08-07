import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-slate-100 text-slate-900 border-t border-slate-200">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-12">
        
        {/* Brand */}
        <div className="col-span-1 md:col-span-1 flex flex-col space-y-6">
          <Link href="/" className="inline-flex">
            <Image 
              src="/images/final Logo without background.png" 
              alt="UN Tiles" 
              width={200} 
              height={64} 
              style={{ width: "auto", height: "auto", maxHeight: "64px" }}
              className="logo-edge-blend transition-transform duration-500 hover:scale-[1.03]"
            />
          </Link>
          <p className="text-sm text-slate-600 leading-relaxed">
            Architectural precision in high-end tiling. Materializing your vision with structural integrity and timeless design.
          </p>
          <div className="flex space-x-4 pt-2">
            <a href="https://www.instagram.com/un_tiles_?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors duration-300 shadow-sm" aria-label="Instagram">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
            <a href="https://www.facebook.com/unicornenterpriseslk/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors duration-300 shadow-sm" aria-label="Facebook">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
            <a href="https://wa.me/94773508325" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors duration-300 shadow-sm" aria-label="WhatsApp">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
              </svg>
            </a>
            <a href="mailto:fade16022025@gmail.com" className="w-9 h-9 bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors duration-300 shadow-sm">
              <Mail className="w-4 h-4" />
            </a>
            <a href="tel:+94773508325" className="w-9 h-9 bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors duration-300 shadow-sm">
              <Phone className="w-4 h-4" />
            </a>
          </div>
        </div>
        
        {/* Collections */}
        <div>
          <h4 className="font-display font-semibold tracking-wide text-slate-900 text-sm uppercase mb-6">Collections</h4>
          <ul className="space-y-3 text-sm text-slate-600">
            <li><Link href="/collections?category=floor" className="hover:text-blue-600 transition-colors duration-300">Floor Tiles</Link></li>
            <li><Link href="/collections?category=wall" className="hover:text-blue-600 transition-colors duration-300">Wall Tiles</Link></li>
            <li><Link href="/collections?category=mosaics" className="hover:text-blue-600 transition-colors duration-300">Mosaics</Link></li>
            <li><Link href="/collections?category=pool-tiles" className="hover:text-blue-600 transition-colors duration-300">Pool Tiles</Link></li>
          </ul>
        </div>

        {/* Studio */}
        <div>
          <h4 className="font-display font-semibold tracking-wide text-slate-900 text-sm uppercase mb-6">Studio</h4>
          <ul className="space-y-3 text-sm text-slate-600">
            <li><Link href="/about" className="hover:text-blue-600 transition-colors duration-300">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-blue-600 transition-colors duration-300">Contact</Link></li>
          </ul>
        </div>

      </div>
      
      {/* Bottom bar */}
      <div className="border-t border-slate-300">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-center items-center gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} UN Tiles (Unicorn Enterprises). All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
