import type { Metadata, Viewport } from "next";
import { Inter, Manrope, Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { cn } from "@/lib/utils";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.untiles.com"),
  title: {
    default: "UN Tiles | Buy Tiles in Sri Lanka - Floor, Wall & Porcelain Tile Store",
    template: "%s | UN Tiles Sri Lanka",
  },
  description:
    "UN Tiles (Unicorn Enterprises) is Sri Lanka's trusted tile importer and store since 2004. Buy premium porcelain floor tiles, wall tiles, and slabs with transparent per-sqft LKR pricing, Colombo 05 showroom, and islandwide delivery. Includes smart room planner and AI tile finder.",
  applicationName: "UN Tiles Sri Lanka",
  keywords: [
    "buy tiles in sri lanka",
    "purchase tiles in sri lanka",
    "un tiles",
    "tiles shop in sri lanka",
    "tiles showroom colombo",
    "buy floor tiles sri lanka",
    "buy wall tiles sri lanka",
    "porcelain tiles sri lanka",
    "ceramic tiles colombo",
    "tile prices in sri lanka",
    "order tiles online sri lanka",
    "unicorn enterprises tiles",
    "vitrified tiles sri lanka",
    "architectural tiles sri lanka",
    "ai tiles finder in sri lanka",
    "smart tile planner sri lanka",
  ],
  authors: [{ name: "UN Tiles" }],
  creator: "UN Tiles",
  publisher: "UN Tiles",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_LK",
    siteName: "UN Tiles Sri Lanka",
    title: "UN Tiles | Buy Tiles in Sri Lanka - Floor, Wall & Porcelain Tile Store",
    description:
      "UN Tiles (Unicorn Enterprises) is Sri Lanka's trusted tile importer and store since 2004. Buy premium floor and wall tiles with transparent LKR pricing, Colombo 05 showroom, and islandwide delivery.",
    url: "https://www.untiles.com",
    images: [
      {
        url: "/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "UN Tiles - Buy Tiles in Sri Lanka",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UN Tiles | Buy Tiles in Sri Lanka - Floor, Wall & Porcelain Tile Store",
    description:
      "Buy tiles in Sri Lanka from UN Tiles. Browse premium floor & wall tiles with transparent LKR pricing, Colombo 05 showroom, and islandwide delivery.",
    images: ["/icons/icon-512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "UN Tiles",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#faf8f5",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": ["Organization", "Store", "OnlineStore", "HomeGoodsStore"],
    name: "UN Tiles",
    alternateName: "Unicorn Enterprises",
    url: "https://www.untiles.com",
    logo: "https://www.untiles.com/icons/icon-512.png",
    foundingDate: "2004",
    description:
      "Sri Lanka's trusted tile importer, showroom, and online tile store since 2004. Purchase premium floor tiles, wall tiles, and porcelain slabs with islandwide delivery and showroom in Colombo 05.",
    telephone: "+94 77 350 8325",
    priceRange: "LKR",
    currenciesAccepted: "LKR",
    paymentAccepted: ["Cash", "Credit Card", "Debit Card", "Bank Transfer", "Online Payment"],
    address: {
      "@type": "PostalAddress",
      streetAddress: "No. 161/A, Polhengoda Road",
      addressLocality: "Colombo 05",
      addressCountry: "LK",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 6.8823419,
      longitude: 79.8808345,
    },
    areaServed: {
      "@type": "Country",
      name: "Sri Lanka",
    },
    hasMap: "https://www.google.com/maps/place/Unicorn+enterprises/@6.8823419,79.8782596,17z",
    sameAs: [
      "https://www.google.com/maps/place/Unicorn+enterprises/@6.8823419,79.8782596,17z",
      "https://www.facebook.com/unicornenterpriseslk/",
      "https://www.instagram.com/un_tiles_/",
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5.0",
      reviewCount: "5",
      bestRating: "5",
    },
    knowsAbout: [
      "Buy Tiles in Sri Lanka",
      "Purchase Tiles Online and In Colombo Showroom",
      "Tile Prices in Sri Lanka",
      "Floor Tiles Sri Lanka",
      "Wall Tiles Sri Lanka",
      "Porcelain Slabs and Vitrified Tiles",
      "Curated Sri Lanka Tile Sourcing",
      "Smart Tile Calculator and Waste Planning",
      "AI Tile Matching & Room Visual Search",
    ],
  };

  const tileStoreServiceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Tile Purchasing & Supply in Sri Lanka",
    alternateName: "UN Tiles Retail & Wholesale Tile Store",
    serviceType: "Tile Store & Architectural Tile Supply",
    provider: {
      "@type": "Organization",
      name: "UN Tiles (Unicorn Enterprises)",
      url: "https://www.untiles.com",
    },
    areaServed: {
      "@type": "Country",
      name: "Sri Lanka",
    },
    description:
      "Purchase premium porcelain floor tiles, wall tiles, and architectural slabs in Sri Lanka. Transparent per-sqft pricing in LKR, showroom in Colombo 05, and islandwide delivery. Featuring smart room calculator and AI tile matching.",
  };

  const shoppingAssistantServiceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "AI Visual Tile Match & Room Planner",
    alternateName: "UN Tiles Smart Shopping Tools",
    serviceType: "Tile Shopping Assistant Tool",
    provider: {
      "@type": "Organization",
      name: "UN Tiles",
      url: "https://www.untiles.com",
    },
    areaServed: {
      "@type": "Country",
      name: "Sri Lanka",
    },
    description:
      "Free visual search and smart tile room planner tools to help buyers calculate required tile quantities and match inspiration photos with available tiles at UN Tiles.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "LKR",
    },
  };

  const webSiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "UN Tiles Sri Lanka",
    url: "https://www.untiles.com",
    description:
      "UN Tiles (Unicorn Enterprises) — Buy premium floor and wall tiles in Sri Lanka. Colombo showroom, transparent LKR pricing, and islandwide delivery, with smart tile planner and AI finder to assist your purchase.",
    publisher: {
      "@type": "Organization",
      name: "UN Tiles",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://www.untiles.com/collections?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  const siteNavigationJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: [
      {
        "@type": "SiteNavigationElement",
        position: 1,
        name: "Tile Collections",
        description: "Browse 50+ premium floor tiles, wall tiles, and porcelain slabs with transparent LKR pricing.",
        url: "https://www.untiles.com/collections",
      },
      {
        "@type": "SiteNavigationElement",
        position: 2,
        name: "Smart Tile Planner",
        description: "Calculate exact tile square footage, box count, and wastage buffer for your room layout.",
        url: "https://www.untiles.com/planner",
      },
      {
        "@type": "SiteNavigationElement",
        position: 3,
        name: "AI Tiles Finder",
        description: "Upload room or inspiration photos to find matching tiles instantly in Sri Lanka.",
        url: "https://www.untiles.com/visual-search",
      },
      {
        "@type": "SiteNavigationElement",
        position: 4,
        name: "Colombo Showroom & Contact",
        description: "Visit our showroom at No. 161/A, Polhengoda Road, Colombo 05 or order online.",
        url: "https://www.untiles.com/contact",
      },
      {
        "@type": "SiteNavigationElement",
        position: 5,
        name: "About UN Tiles",
        description: "Sri Lanka's trusted importer of premium ceramic & porcelain tiles since 2004.",
        url: "https://www.untiles.com/about",
      },
    ],
  };

  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", inter.variable, manrope.variable, "font-sans", geist.variable)}
      style={{ backgroundColor: "#faf8f5", colorScheme: "light" }}
    >
      <body
        className="min-h-full flex flex-col font-sans bg-noise ambient-glow-bg bg-background"
        style={{ backgroundColor: "#faf8f5" }}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(tileStoreServiceJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(shoppingAssistantServiceJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(webSiteJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(siteNavigationJsonLd),
          }}
        />
        <Providers>
          <main className="flex-1">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
