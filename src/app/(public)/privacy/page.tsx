import React from 'react';

export default function PrivacyPage() {
  return (
    <main className="flex-1 bg-surface min-h-screen pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-8">Privacy Policy</h1>
        <div className="prose prose-slate max-w-none">
          <p className="text-sm text-slate-500 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">1. Information We Collect</h2>
            <p className="text-slate-600 mb-4 leading-relaxed">
              [Placeholder: Insert your privacy policy here. Explain what personal data you collect from users, such as names, email addresses, phone numbers, and browsing behavior.]
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">2. How We Use Your Information</h2>
            <p className="text-slate-600 mb-4 leading-relaxed">
              [Placeholder: Detail how the collected information is used. For example, to provide and maintain our service, notify you about changes to our service, provide customer support, and gather analysis or valuable information so that we can improve our service.]
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">3. Data Security</h2>
            <p className="text-slate-600 mb-4 leading-relaxed">
              [Placeholder: Explain the security measures you have in place to protect user data from unauthorized access, alteration, disclosure, or destruction.]
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">4. Contact Us</h2>
            <p className="text-slate-600 mb-4 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at:
              <br />
              Email: fade16022025@gmail.com
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
