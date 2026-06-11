export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="mb-8">
          <a href="/" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">← Back to SpendWise</a>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: June 2025</p>

        <div className="space-y-8 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">1. Who We Are</h2>
            <p>SpendWise is a personal finance tracking application developed by Harsh Agrawal. We are based in India and operate under the Information Technology Act, 2000 and applicable Indian data protection laws.</p>
            <p className="mt-2">For any privacy concerns, contact us at: <a href="mailto:harshagrawal4256@gmail.com" className="text-indigo-600 font-semibold">harshagrawal4256@gmail.com</a></p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">2. What We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account information:</strong> Your email address and name (provided via email sign-up or Google Sign-In)</li>
              <li><strong>Financial data:</strong> Expense and income records you manually enter into the app</li>
              <li><strong>Profile photo:</strong> Only if signing in with Google and you have a public profile picture</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">3. What We Do NOT Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Payment card or banking credentials</li>
              <li>Device location or GPS data</li>
              <li>Contacts or call logs</li>
              <li>Browsing history outside of SpendWise</li>
              <li>Analytics tracking data (no Google Analytics, no Meta Pixel)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">4. How We Use Your Data</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide and operate the SpendWise service</li>
              <li>To authenticate your identity securely</li>
              <li>To store and sync your expense/income records across devices</li>
              <li>We do <strong>not</strong> sell, rent, or share your data with any third party for advertising</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">5. Google Sign-In</h2>
            <p>SpendWise uses Google OAuth 2.0 for authentication. When you sign in with Google, we access only your email address and display name. We do not access your Google Drive, Gmail, contacts, or any other Google services.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">6. Data Storage & Security</h2>
            <p>Your data is stored on secure cloud servers. We use industry-standard encryption for data in transit (HTTPS/TLS) and access is protected by JWT-based authentication. We take reasonable technical measures to protect your data from unauthorised access.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">7. Your Rights</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Access:</strong> You can view all your data within the app at any time</li>
              <li><strong>Deletion:</strong> You can permanently delete your account and all associated data from Profile → Delete Account. All data is removed within 24 hours.</li>
              <li><strong>Correction:</strong> You can update your information through the app settings</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">8. Data Retention</h2>
            <p>We retain your data for as long as your account is active. If you delete your account, all personal data and expense records are permanently deleted. Accounts with no activity for 18 months may be flagged for deletion with 30 days' email notice.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the date at the top of this page. Continued use of SpendWise after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">10. Contact</h2>
            <p>For privacy-related questions or requests, email us at <a href="mailto:harshagrawal4256@gmail.com" className="text-indigo-600 font-semibold">harshagrawal4256@gmail.com</a>. We aim to respond within 7 business days.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
