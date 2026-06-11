export default function Contact() {
  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="mb-8">
          <a href="/" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">← Back to SpendWise</a>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Contact</h1>
        <p className="text-slate-500 mb-10">Have a question, found a bug, or want to say hi? Reach out below.</p>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* Email */}
          <a
            href="mailto:harshagrawal4256@gmail.com"
            className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-slate-900">Email</div>
              <div className="mt-0.5 text-xs text-slate-500 break-all">harshagrawal4256@gmail.com</div>
            </div>
          </a>

          {/* GitHub */}
          <a
            href="https://github.com/harshagrawal909"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-400 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-800 group-hover:bg-slate-200">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-slate-900">GitHub</div>
              <div className="mt-0.5 text-xs text-slate-500">harshagrawal909</div>
            </div>
          </a>

          {/* LinkedIn */}
          <a
            href="https://linkedin.com/in/harshagrawal42"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 group-hover:bg-blue-100">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-slate-900">LinkedIn</div>
              <div className="mt-0.5 text-xs text-slate-500">harshagrawal42</div>
            </div>
          </a>
        </div>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-1">Response Time</h2>
          <p className="text-sm text-slate-500">I typically respond within 1–3 business days. For bugs or urgent issues, email is the fastest way to reach me.</p>
        </div>
      </div>
    </div>
  );
}
