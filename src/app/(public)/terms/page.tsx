import React from 'react';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "UN Tiles terms of service — the terms and conditions governing your use of our website, products, and services.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <main className="flex-1 bg-surface min-h-screen pt-28 sm:pt-32 pb-16 sm:pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-slate-900 mb-8">
          Terms of Service
        </h1>
        <div className="prose prose-slate max-w-none">
          <p className="text-sm text-slate-500 mb-8">Last Updated: October 12, 2026</p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">1. Acceptance of Terms</h2>
            <p className="text-slate-600 mb-4 leading-relaxed">
              Welcome to UN Tiles (operated by Unicorn Enterprises). By accessing or using our website,
              browsing our digital catalog, utilizing our room planning and AI visual search tools, or purchasing
              architectural surfaces and tiles from us, you agree to be bound by these Terms of Service and all
              applicable laws and regulations of the Democratic Socialist Republic of Sri Lanka. If you do not
              agree with any of these terms, you are prohibited from using or accessing this site.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">2. Products, Orders, and Pricing</h2>
            <p className="text-slate-600 mb-4 leading-relaxed">
              We make every effort to display the colors, textures, finishes, and dimensions of our porcelain,
              ceramic, marble, and granite tiles as accurately as possible. However, because natural minerals
              and firing processes produce slight batch-to-batch variations (shade and caliber variations), tiles
              delivered may display subtle differences from images displayed on screen or physical showroom samples.
            </p>
            <p className="text-slate-600 mb-4 leading-relaxed">
              All prices are listed in Sri Lankan Rupees (LKR) and include applicable taxes unless otherwise noted.
              We reserve the right to correct pricing errors, adjust inventory availability, or cancel orders arising
              from typographical or technical system discrepancies. If your order is cancelled after payment, a full
              refund will be processed to your original payment method.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">3. Tile Planner and AI Visual Search Tools</h2>
            <p className="text-slate-600 mb-4 leading-relaxed">
              Our Smart Room Planner and Gemini-powered Visual Tile Search are assistive digital utilities provided
              to assist with surface estimation and visual discovery. Waste percentage estimates (e.g., 10%–15% recommended
              cutting allowance) and layout diagrams are guidelines only. Final measurement verification and installation
              assessments remain the responsibility of the client and licensed contractor.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">4. Payment and Billing</h2>
            <p className="text-slate-600 mb-4 leading-relaxed">
              Online card transactions are securely processed through Stripe. We do not store your complete credit or
              debit card credentials on our servers. For Cash on Delivery (COD) or Showroom Pickup orders, payment
              must be tendered prior to unloading or physical release of materials. Failure to complete payment upon delivery
              authorizes UN Tiles to withhold goods and charge applicable transport restocking fees.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">5. Delivery, Inspection, and Damage Claims</h2>
            <p className="text-slate-600 mb-4 leading-relaxed">
              Tiles are fragile, heavyweight architectural cargo. We deliver island-wide across Sri Lanka using dedicated
              transport. Delivery is to curbside or vehicle access point at the designated site address.
            </p>
            <p className="text-slate-600 mb-4 leading-relaxed">
              Customers or authorized site representatives must inspect boxes upon delivery. Any transit breakage, shortages,
              or product discrepancies must be recorded on the delivery note and reported to UN Tiles within forty-eight
              (48) hours of receipt with accompanying photographic evidence. Once tiles are installed, affixed with adhesive,
              or cut, they are deemed accepted and cannot be returned or refunded.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">6. User Accounts and Security</h2>
            <p className="text-slate-600 mb-4 leading-relaxed">
              When creating an account with UN Tiles, you are responsible for maintaining the confidentiality of your login
              credentials and for all activities that occur under your account. You agree to notify us immediately of any
              unauthorized access or security breach.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">7. Intellectual Property</h2>
            <p className="text-slate-600 mb-4 leading-relaxed">
              All content on this website, including tile photographs, design renders, brand identity, text, code,
              and UI components, is the property of Unicorn Enterprises (UN Tiles) and protected by intellectual property
              laws. Unauthorized reproduction, modification, scraping, or commercial exploitation is strictly prohibited.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">8. Limitation of Liability</h2>
            <p className="text-slate-600 mb-4 leading-relaxed">
              In no event shall UN Tiles, its directors, or suppliers be liable for indirect, incidental, consequential,
              or punitive damages (including project downtime, contractor labor costs, or delayed construction schedules)
              arising from product delivery schedules or site conditions. Our maximum liability shall not exceed the purchase
              price paid for the specific goods giving rise to the claim.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">9. Contact and Governing Law</h2>
            <p className="text-slate-600 mb-4 leading-relaxed">
              These terms are governed by and construed under the laws of Sri Lanka. Any disputes shall be subject to the
              exclusive jurisdiction of the courts of Colombo, Sri Lanka.
            </p>
            <p className="text-slate-600 mb-4 leading-relaxed">
              For questions regarding these Terms of Service, contact our showroom team:
              <br />
              <strong>UN Tiles (Unicorn Enterprises)</strong>
              <br />
              Email: <a href="mailto:fade16022025@gmail.com" className="text-primary hover:underline">fade16022025@gmail.com</a>
              <br />
              Location: Colombo, Sri Lanka
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
