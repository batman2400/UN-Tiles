import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { TopNavBar } from "@/components/TopNavBar";
import { Footer } from "@/components/Footer";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <TopNavBar />
        <main className="flex-1 pt-24 page-enter">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
