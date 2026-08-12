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
  icons: {
    icon: "/images/final Logo without background.png",
    shortcut: "/images/final Logo without background.png",
    apple: "/images/final Logo without background.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#faf8f5",
  colorScheme: "light",
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
