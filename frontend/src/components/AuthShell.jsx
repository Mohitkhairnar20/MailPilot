function AuthShell({ title, subtitle, children, accent }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative overflow-hidden rounded-[2rem] bg-ink p-8 text-white shadow-2xl sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,107,87,0.28),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(125,211,252,0.18),transparent_40%)]" />
          <div className="relative">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-coral">MailPilot</p>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-tight sm:text-5xl">{title}</h1>
            <p className="mt-4 max-w-md text-slate-300">{subtitle}</p>
            <div className="mt-10 rounded-[1.5rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm uppercase tracking-[0.18em] text-slate-300">What you get</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-200">
                <li>AI-personalized campaign creation at scale</li>
                <li>CSV upload, queue-backed delivery, and retry handling</li>
                <li>Live metrics for sent, failed, and scheduled emails</li>
              </ul>
            </div>
            {accent}
          </div>
        </section>
        <section className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-xl backdrop-blur sm:p-8">
          {children}
        </section>
      </div>
    </main>
  );
}

export default AuthShell;
