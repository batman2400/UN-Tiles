import React from 'react';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "UN Tiles privacy policy — how we collect, use, and protect your personal information when you use our website and services.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="flex-1 bg-surface min-h-screen pt-28 sm:pt-32 pb-16 sm:pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-slate-900 mb-8">
          Privacy Policy
        </h1>
        <div className="prose prose-slate max-w-none">
          <p className="text-sm text-slate-500 mb-8">Last Updated: October 12, 2026</p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">1. Overview</h2>
            <p className="text-slate-600 mb-4 leading-relaxed">
              At UN Tiles (operated by Unicorn Enterprises, Colombo, Sri Lanka), we respect your privacy and are
              committed to protecting the personal information you share with us. This Privacy Policy describes how
              we collect, utilize, store, and safeguard your data when you browse our website, create an account,
              use our visual design tools, and purchase products from us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">2. Information We Collect</h2>
            <p className="text-slate-600 mb-4 leading-relaxed">
              We collect information you provide directly to us through account registration, order placement,
              and customer inquiries:
            </p>
            <ul className="list-disc pl-6 text-slate-600 mb-4 space-y-2">
              <li>
                <strong>Identity and Contact Details:</strong> Full name, email address, telephone number, and company name (for commercial contractors and architects).
              </li>
              <li>
                <strong>Delivery and Billing Addresses:</strong> Street address, city, postal region, and delivery contact person for logistics dispatch.
              </li>
              <li>
                <strong>Order and Transaction History:</strong> Records of products purchased, order values in LKR, payment status, and order fulfillment updates.
              </li>
              <li>
                <strong>Inquiry Messages:</strong> Project notes, tile specifications, and messages submitted through our showroom contact form.
              </li>
              <li>
                <strong>Visual Search Images:</strong> Photographs or renders you upload to our Visual Tile Matcher or Scene Advisor tools.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">3. AI Visual Search and Image Processing</h2>
            <p className="text-slate-600 mb-4 leading-relaxed">
              When you upload a photo to find matching tile slabs, your image is processed temporarily via Google
              Gemini Vision and embedding models to analyze surface texture, pattern, color palettes, and finish.
              Uploaded images are used solely to generate similarity vectors for finding matching catalog items;
              they are not used to train general artificial intelligence models, are not sold to third parties,
              and are not retained as permanent public records.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">4. How We Use Your Information</h2>
            <p className="text-slate-600 mb-4 leading-relaxed">
              We use your data for the following lawful purposes:
            </p>
            <ul className="list-disc pl-6 text-slate-600 mb-4 space-y-2">
              <li>Processing and fulfilling your orders, coordinating island-wide tile delivery, and managing warehouse collections.</li>
              <li>Maintaining your customer account, order history, and saved delivery addresses.</li>
              <li>Sending transaction notifications, order confirmations, and dispatch tracking details.</li>
              <li>Responding to customer support requests and architectural sample inquiries.</li>
              <li>Protecting against fraud, security incidents, and unauthorized account access.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">5. Payment Processing and Security</h2>
            <p className="text-slate-600 mb-4 leading-relaxed">
              Online credit and debit card transactions are handled directly through Stripe, a certified PCI-DSS Level 1
              service provider. UN Tiles never receives or stores your full credit card number, CVV code, or card expiration date.
              Database records and customer sessions are secured with Supabase using encrypted transport (TLS/SSL) and Row Level
              Security (RLS) policies ensuring users can only access their own profile and order records.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">6. Cookies and Local Storage</h2>
            <p className="text-slate-600 mb-4 leading-relaxed">
              We use essential cookies and browser local storage strictly for critical application functionality, including
              maintaining your active authentication session, remembering items in your shopping cart, and storing planner
              room measurements across page refreshes. We do not use third-party tracking pixels or ad networks.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">7. Your Data Rights</h2>
            <p className="text-slate-600 mb-4 leading-relaxed">
              In accordance with Sri Lanka&apos;s Personal Data Protection Act No. 9 of 2022 (PDPA) and international best
              practices, you have the right to request access to the personal data we hold about you, request corrections
              to inaccurate information, or request the closure and erasure of your account and profile data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">8. Contact Us</h2>
            <p className="text-slate-600 mb-4 leading-relaxed">
              If you have any questions about this Privacy Policy, your personal information, or wish to exercise your
              data rights, please contact our privacy compliance team at:
              <br />
              <strong>UN Tiles (Unicorn Enterprises)</strong>
              <br />
              Email: <a href="mailto:fade16022025@gmail.com" className="text-primary hover:underline">fade16022025@gmail.com</a>
              <br />
              Colombo, Sri Lanka
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
