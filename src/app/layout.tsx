import type { Metadata, Viewport } from "next";
import { Inter, Manrope, Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.untiles.com"),
  title: {
    default: "UN Tiles | Architectural Tile Solutions & Intelligent Planner",
    template: "%s | UN Tiles",
  },
  description:
    "Premium architectural tiles with weight, texture, and structural integrity. Browse curated collections, plan layouts with our intelligent tile planner, and order with confidence.",
  applicationName: "UN Tiles",
  keywords: [
    "architectural tiles",
    "premium tiles",
    "tile planner",
    "tile collections",
    "UN Tiles",
    "interior design",
    "floor tiles",
    "wall tiles",
  ],
  authors: [{ name: "UN Tiles" }],
  creator: "UN Tiles",
  publisher: "UN Tiles",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "UN Tiles",
    title: "UN Tiles | Architectural Tile Solutions & Intelligent Planner",
    description:
      "Premium architectural tiles with weight, texture, and structural integrity. Browse curated collections and plan layouts with our intelligent tile planner.",
    url: "https://www.untiles.com",
    images: [
      {
        url: "/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "UN Tiles",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UN Tiles | Architectural Tile Solutions & Intelligent Planner",
    description:
      "Premium architectural tiles with weight, texture, and structural integrity. Browse curated collections and plan layouts with our intelligent tile planner.",
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
    "@type": "Organization",
    name: "UN Tiles",
    alternateName: "Unicorn Enterprises",
    url: "https://www.untiles.com",
    logo: "https://www.untiles.com/icons/icon-512.png",
    foundingDate: "2004",
    description:
      "Sri Lanka's trusted importer of premium ceramic tiles and sanitary ware since 2004. Sourcing from China, Vietnam, India, and Lanka Tiles.",
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
    sameAs: [
      "https://www.google.com/maps/place/Unicorn+enterprises/@6.8823419,79.8782596,17z",
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5.0",
      reviewCount: "5",
      bestRating: "5",
    },
  };

  const webSiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "UN Tiles",
    url: "https://www.untiles.com",
    description:
      "Premium architectural tiles with weight, texture, and structural integrity. Browse curated collections, plan layouts with our intelligent tile planner.",
    publisher: {
      "@type": "Organization",
      name: "UN Tiles",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate:
          "https://www.untiles.com/collections?search={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
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
            __html: JSON.stringify(webSiteJsonLd),
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
