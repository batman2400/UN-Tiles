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
  title: "UN Tiles | Premium Architectural Tiles",
  description: "High-end tiling with weight, texture, and structural integrity.",
  applicationName: "UN Tiles",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icons/icon-192.png",
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
        <Providers>
          <main className="flex-1">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
