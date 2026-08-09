import React from 'react';

export default function TermsPage() {
  return (
    <main className="flex-1 bg-surface min-h-screen pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-8">Terms of Service</h1>
        <div className="prose prose-slate max-w-none">
          <p className="text-sm text-slate-500 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">1. Acceptance of Terms</h2>
            <p className="text-slate-600 mb-4 leading-relaxed">
              [Placeholder: Insert your legal terms of service here. By accessing and using the UN Tiles website, you accept and agree to be bound by the terms and provision of this agreement.]
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">2. Use License</h2>
            <p className="text-slate-600 mb-4 leading-relaxed">
              [Placeholder: Detail the permissions granted to users to temporarily download one copy of the materials (information or software) on UN Tiles' website for personal, non-commercial transitory viewing only.]
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">3. Disclaimer</h2>
            <p className="text-slate-600 mb-4 leading-relaxed">
              [Placeholder: The materials on UN Tiles' website are provided on an 'as is' basis. UN Tiles makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.]
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">4. Limitations</h2>
            <p className="text-slate-600 mb-4 leading-relaxed">
              [Placeholder: In no event shall UN Tiles or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on UN Tiles' website.]
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
