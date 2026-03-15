import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const featureList = [
  {
    eyebrow: "Campaign studio",
    title: "Launch polished outreach from a single control surface",
    text: "Write once, personalize with variables, and schedule or send instantly without losing clarity."
  },
  {
    eyebrow: "Queue engine",
    title: "Protect delivery with workers, retries, and queue-backed processing",
    text: "BullMQ and Redis keep campaigns moving even when providers slow down or individual sends fail."
  },
  {
    eyebrow: "Visibility",
    title: "See the full lifecycle from queued to sent to failed",
    text: "Operators can follow logs, campaign metrics, and activity without digging through multiple tools."
  }
];

const steps = [
  {
    step: "01",
    title: "Import your audience",
    text: "Paste recipients manually or upload a CSV with name, company, and role."
  },
  {
    step: "02",
    title: "Compose with variables",
    text: "Use placeholders like {{firstName}} and AI-generated copy for personalized outreach."
  },
  {
    step: "03",
    title: "Push to the queue",
    text: "Every email becomes a controlled job so retries and failures are handled predictably."
  },
  {
    step: "04",
    title: "Track performance",
    text: "Review logs, delivery status, and analytics from one product-shaped workflow."
  }
];

const founderProfile = {
  name: "Mohit Khairnar",
  role: "Founder and Developer, MailPilot",
  image: "/images/mohit-khairnar.jpg",
  quote:
    "I built MailPilot to make AI-powered email operations practical, reliable, and understandable from the first screen."
};

const credibilityCards = [
  {
    title: "Real implementation, not static demo content",
    text: "MailPilot combines campaign creation, queue-backed sending, retries, logs, and analytics into one working system."
  },
  {
    title: "Built for operational clarity",
    text: "Every major action is visible across campaigns, delivery status, and recipient-level logs so decisions are easier to make."
  }
];

const trustBadges = ["Queue-backed", "SMTP-ready", "AI-personalized", "Analytics-first", "Operator-friendly"];

const pricing = [
  {
    name: "Starter",
    price: "Free",
    text: "Perfect for demos, testing, and student portfolio projects.",
    features: ["Auth and dashboard", "Manual campaigns", "CSV upload flow", "Mailtrap or Brevo SMTP"]
  },
  {
    name: "Growth",
    price: "$29",
    note: "/month concept",
    text: "For teams that want structured campaign operations and AI personalization.",
    featured: true,
    features: ["Queue-backed sending", "Analytics dashboard", "AI personalization", "Delivery logs and retries"]
  },
  {
    name: "Scale",
    price: "Custom",
    text: "For high-volume sending flows, multiple operators, and custom infrastructure.",
    features: ["Custom worker scaling", "Advanced observability", "Domain setup guidance", "Workflow customization"]
  }
];

const faqs = [
  {
    q: "Can MailPilot send real emails?",
    a: "Yes. Use a live SMTP provider like Brevo for production-style sending or Mailtrap for testing."
  },
  {
    q: "Does it support personalization?",
    a: "Yes. You can use placeholders like {{name}}, {{firstName}}, {{email}}, {{company}}, and {{role}}."
  },
  {
    q: "What makes the delivery flow reliable?",
    a: "Redis, BullMQ, and workers process each email as a job, allowing retries and better tracking."
  },
  {
    q: "Who is it good for?",
    a: "Student builders, startup operators, growth teams, and anyone who wants a visible sending workflow."
  }
];

function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [isFounderImageBroken, setIsFounderImageBroken] = useState(false);

  return (
    <main className="min-h-screen bg-[#f8f5ef] text-ink">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="sticky top-4 z-30 flex items-center justify-between rounded-full border border-[#e8dfd2] bg-white/92 px-5 py-3 shadow-sm backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-[#132238] text-sm font-bold text-white shadow-lg shadow-slate-900/10">
              MP
            </div>
            <div>
              <p className="font-display text-xl font-semibold">MailPilot</p>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">AI Email Automation</p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 lg:flex">
            <a href="#features" className="hover:text-[#132238]">
              Features
            </a>
            <a href="#workflow" className="hover:text-[#132238]">
              Workflow
            </a>
            <a href="#pricing" className="hover:text-[#132238]">
              Pricing
            </a>
            <a href="#faq" className="hover:text-[#132238]">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
              Log in
            </Link>
            <Link
              to={isAuthenticated ? "/app" : "/signup"}
              className="rounded-full bg-[#132238] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              {isAuthenticated ? "Open App" : "Start Free"}
            </Link>
          </div>
        </header>

        <section className="grid gap-8 pb-10 pt-8 lg:grid-cols-[0.96fr_1.04fr] lg:items-center">
          <div className="landing-reveal">
            <p className="inline-flex rounded-full border border-[#f1d2bd] bg-[#fff0e4] px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#d16d35]">
              Built for modern outbound systems
            </p>
            <h1 className="mt-5 max-w-3xl font-display text-[3.45rem] font-semibold leading-[0.95] text-[#132238] sm:text-[4.6rem]">
              Personalized email operations that feel premium and easy to use.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              MailPilot helps you introduce your platform, automate outreach, and actually understand delivery. It blends a clean product experience with the backend infrastructure serious sending requires.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to={isAuthenticated ? "/app" : "/signup"}
                className="rounded-full bg-[#ff6b57] px-6 py-3 text-center text-sm font-semibold text-white shadow-xl shadow-[#ff6b57]/20 transition hover:brightness-95"
              >
                Launch Your First Campaign
              </Link>
              <a
                href="#platform"
                className="rounded-full border border-slate-200 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Explore The Platform
              </a>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-[1.08fr_0.92fr]">
              <div className="rounded-[1.8rem] border border-[#ece4d8] bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">What customers notice</p>
                <div className="mt-4 space-y-3">
                  {[
                    "A cleaner campaign creation flow",
                    "Personalized sending with real variables",
                    "Logs and analytics in the same platform"
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-[1.1rem] bg-slate-50 px-4 py-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#ff6b57]" />
                      <p className="text-sm leading-6 text-slate-700">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-4">
                {[
                  { value: "CSV", label: "bulk-ready workflows" },
                  { value: "AI", label: "smart personalization" },
                  { value: "Logs", label: "full delivery visibility" }
                ].map((item) => (
                  <div key={item.label} className="rounded-[1.4rem] border border-[#ece4d8] bg-white p-4 shadow-sm">
                    <p className="font-display text-3xl font-semibold text-[#132238]">{item.value}</p>
                    <p className="mt-2 text-sm text-slate-600">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative landing-reveal-delayed">
            <div className="absolute -left-6 top-10 h-48 w-48 rounded-full bg-[#d3eef8] blur-3xl" />
            <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-[#ffe2cb] blur-3xl" />

            <div className="relative rounded-[2.35rem] border border-[#e8dfd3] bg-white p-4 shadow-[0_24px_80px_rgba(19,34,56,0.08)]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">MailPilot Platform</p>
                  <h2 className="mt-2 font-display text-[1.8rem] font-semibold text-[#132238]">Operator dashboard preview</h2>
                </div>
                <div className="rounded-full bg-[#fff3e7] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#d16d35]">
                  Sending live
                </div>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-[0.98fr_1.02fr]">
                <div className="rounded-[1.7rem] bg-[#132238] p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Active campaign</p>
                      <h3 className="mt-2 font-display text-[2.15rem] font-semibold leading-[1.02]">Product launch sequence</h3>
                    </div>
                    <div className="rounded-full bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-200">
                      Processing
                    </div>
                  </div>

                  <div className="mt-4 rounded-[1.3rem] bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Template preview</p>
                    <p className="mt-3 text-sm leading-7 text-slate-100">
                      Hello {`{{firstName}}`}, I wanted to share how MailPilot turns a complex backend email flow into a cleaner product experience.
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {[
                      { label: "Queued", value: "42" },
                      { label: "Sent", value: "186" },
                      { label: "Failed", value: "06" }
                    ].map((item) => (
                      <div key={item.label} className="rounded-[1.05rem] bg-white/10 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-300">{item.label}</p>
                        <p className="mt-2 font-display text-3xl font-semibold">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[1.5rem] border border-[#ece4d8] bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Audience panel</p>
                        <h3 className="mt-2 font-display text-[1.8rem] font-semibold leading-[1.05] text-[#132238]">Recipient enrichment</h3>
                      </div>
                      <div className="rounded-full bg-[#eef8fc] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#2c6d84]">
                        AI ready
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      {[
                        ["Sanjay", "Founder", "Queued"],
                        ["Sarala", "Ops", "Sent"],
                        ["Alex", "Growth", "Retry"]
                      ].map(([name, role, state]) => (
                        <div key={name} className="flex items-center justify-between rounded-[1.2rem] bg-slate-50 px-4 py-3">
                          <div>
                            <p className="font-semibold text-[#132238]">{name}</p>
                            <p className="text-xs text-slate-500">{role}</p>
                          </div>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 shadow-sm">
                            {state}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-[#ece4d8] bg-[#fff9f4] p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Weekly activity</p>
                        <h3 className="mt-2 font-display text-[1.8rem] font-semibold text-[#132238]">Outbound volume</h3>
                      </div>
                      <p className="text-sm font-semibold text-[#ff6b57]">+18%</p>
                    </div>
                    <div className="mt-4 flex h-28 items-end gap-2.5">
                      {[34, 55, 48, 72, 68, 80, 91].map((value, index) => (
                        <div key={`${value}-${index}`} className="flex flex-1 flex-col items-center gap-2">
                          <div
                            className={`w-full rounded-t-[1rem] ${index >= 5 ? "bg-[#ff6b57]" : "bg-[#132238]"}`}
                            style={{ height: `${value}%` }}
                          />
                          <span className="text-xs font-semibold text-slate-400">
                            {["M", "T", "W", "T", "F", "S", "S"][index]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-[#ece4d8] bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Recent delivery events</p>
                    <div className="mt-3 space-y-2.5">
                      {[
                        ["hello@sales.com", "Sent", "2s ago"],
                        ["team@startup.io", "Queued", "14s ago"],
                        ["ops@company.com", "Retrying", "26s ago"]
                      ].map(([email, status, time]) => (
                        <div key={email} className="flex items-center justify-between rounded-[1.25rem] bg-slate-50 px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold text-[#132238]">{email}</p>
                            <p className="text-xs text-slate-500">{time}</p>
                          </div>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 shadow-sm">
                            {status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="landing-float absolute -bottom-5 left-6 rounded-[1.35rem] border border-[#ece4d8] bg-white px-4 py-3 shadow-2xl">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Live worker</p>
                <p className="mt-1 text-sm font-semibold text-[#132238]">Jobs are processing and variables are rendering per recipient</p>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-reveal mt-2 rounded-[2rem] border border-[#ece4d8] bg-white px-5 py-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <p className="mr-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Platform qualities</p>
            {trustBadges.map((item) => (
              <span
                key={item}
                className="rounded-full border border-[#ece4d8] bg-[#faf7f2] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600"
              >
                {item}
              </span>
            ))}
          </div>
        </section>

        <section className="landing-reveal mt-6 grid gap-4 md:grid-cols-4">
          {[
            "MongoDB-backed campaign records",
            "Redis queue orchestration",
            "BullMQ retry handling",
            "Brevo or Mailtrap SMTP delivery"
          ].map((item) => (
            <div key={item} className="rounded-[1.5rem] border border-[#eadfce] bg-white px-5 py-4 text-sm font-semibold text-slate-700 shadow-sm">
              {item}
            </div>
          ))}
        </section>

        <section id="features" className="mt-12">
          <div className="landing-reveal flex items-end justify-between gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#d16d35]">Platform features</p>
              <h2 className="mt-3 font-display text-4xl font-semibold text-[#132238]">A clearer product story with stronger infrastructure underneath.</h2>
            </div>
          </div>
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {featureList.map((feature, index) => (
              <article
                key={feature.title}
                className={`landing-reveal rounded-[2rem] border border-[#ece4d8] p-6 shadow-sm ${index === 1 ? "bg-[#132238] text-white" : "bg-white text-ink"}`}
              >
                <p className={`text-sm font-semibold uppercase tracking-[0.22em] ${index === 1 ? "text-[#ff9b8b]" : "text-[#d16d35]"}`}>
                  {feature.eyebrow}
                </p>
                <h3 className="mt-4 font-display text-3xl font-semibold">{feature.title}</h3>
                <p className={`mt-4 leading-7 ${index === 1 ? "text-slate-300" : "text-slate-600"}`}>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="landing-reveal rounded-[2.5rem] border border-[#ece4d8] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Product window</p>
                <h2 className="mt-2 font-display text-3xl font-semibold text-[#132238]">Analytics snapshot</h2>
              </div>
              <div className="flex gap-2">
                <span className="h-3 w-3 rounded-full bg-[#ff8c7e]" />
                <span className="h-3 w-3 rounded-full bg-[#ffd47a]" />
                <span className="h-3 w-3 rounded-full bg-[#8bdba9]" />
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-[0.72fr_1.28fr]">
              <div className="rounded-[1.75rem] bg-[#132238] p-5 text-white">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Delivery health</p>
                <p className="mt-3 font-display text-5xl font-semibold">96%</p>
                <p className="mt-2 text-sm text-slate-300">Emails successfully accepted by provider this week.</p>
              </div>
              <div className="rounded-[1.75rem] bg-[#f7fafc] p-5">
                <div className="flex h-44 items-end gap-3">
                  {[22, 38, 31, 49, 45, 57, 64, 58].map((value, index) => (
                    <div key={`${value}-${index}`} className="flex flex-1 flex-col items-center gap-2">
                      <div
                        className={`w-full rounded-t-[1rem] ${index % 3 === 0 ? "bg-[#ff6b57]" : "bg-[#132238]"}`}
                        style={{ height: `${value}%` }}
                      />
                      <span className="text-[11px] font-semibold text-slate-400">
                        {["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"][index]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="landing-reveal-delayed rounded-[2.5rem] border border-[#ece4d8] bg-[linear-gradient(145deg,#132238_0%,#1a3150_100%)] p-6 text-white shadow-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#ff9b8b]">Marketing-grade presentation</p>
            <h2 className="mt-4 font-display text-4xl font-semibold leading-tight">A homepage that explains the product before anyone even logs in.</h2>
            <p className="mt-5 leading-8 text-slate-300">
              The landing page now includes visual proof, product windows, pricing context, social proof, FAQ structure, and stronger calls to action.
            </p>
            <div className="mt-6 grid gap-3">
              {[
                "Faster scanning with less dense copy",
                "Richer product visuals and better hierarchy",
                "Contact/demo section for a more complete SaaS feel"
              ].map((item) => (
                <div key={item} className="rounded-[1.35rem] bg-white/10 px-4 py-3 text-sm text-slate-100">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="mt-12 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="landing-reveal rounded-[2.5rem] bg-[#132238] p-8 text-white shadow-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#ff9b8b]">Workflow</p>
            <h2 className="mt-4 font-display text-4xl font-semibold leading-tight">Readable, guided, and easier to explain to anyone reviewing the product.</h2>
            <p className="mt-5 text-base leading-8 text-slate-300">
              The flow is simple on purpose: collect recipients, compose one message, personalize it, queue it, and keep the delivery state observable.
            </p>
            <div className="mt-6 rounded-[1.75rem] bg-white/10 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Template variables</p>
              <p className="mt-3 text-sm leading-7 text-slate-100">
                Use placeholders like {`{{name}}`}, {`{{firstName}}`}, {`{{email}}`}, {`{{company}}`}, and {`{{role}}`} to make each email feel intentional.
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {steps.map((item, index) => (
              <div
                key={item.title}
                className={`landing-reveal rounded-[2rem] border border-[#ece4d8] p-6 shadow-sm ${index === 0 || index === 3 ? "bg-[#fff7f0]" : "bg-white"}`}
              >
                <div className="grid h-11 w-11 place-items-center rounded-full bg-[#fff0e4] text-sm font-bold text-[#d16d35]">
                  {item.step}
                </div>
                <h3 className="mt-5 font-display text-2xl font-semibold text-[#132238]">{item.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="platform" className="mt-12 grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="landing-reveal rounded-[2.5rem] border border-[#ece4d8] bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#d16d35]">Visual product layer</p>
            <h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-[#132238]">Designed to look like a real SaaS platform, not just a form with buttons.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              The landing page now leads with visual hierarchy, cleaner reading flow, mock product states, and sections that explain the platform naturally.
            </p>
          </div>
          <div className="landing-reveal rounded-[2.5rem] bg-[linear-gradient(145deg,#fff0e3_0%,#ffffff_45%,#f2fbff_100%)] p-8 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Cleaner reading rhythm and shorter blocks",
                "Product-style hero visual with data cards",
                "Animated floating status panel",
                "Pricing, testimonials, FAQ, and footer sections"
              ].map((item) => (
                <div key={item} className="rounded-[1.5rem] bg-white/80 p-5 shadow-sm">
                  <p className="leading-7 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="landing-reveal">
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#d16d35]">Founder</p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-[#132238]">Built and developed by Mohit Khairnar.</h2>
          </div>
          <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
            <article className="landing-reveal rounded-[2rem] border border-[#ece4d8] bg-white p-6 shadow-sm">
              <div className="grid gap-5 md:grid-cols-[130px_1fr] md:items-center">
                <div className="relative h-[130px] w-[130px] overflow-hidden rounded-[1.4rem] bg-[#132238]">
                  {!isFounderImageBroken ? (
                    <img
                      src={founderProfile.image}
                      alt="Mohit Khairnar"
                      className="h-full w-full object-cover"
                      onError={() => setIsFounderImageBroken(true)}
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-3xl font-semibold text-white/90">MK</div>
                  )}
                </div>
                <div>
                  <p className="text-lg leading-8 text-slate-700">"{founderProfile.quote}"</p>
                  <footer className="mt-6">
                    <p className="font-semibold text-[#132238]">{founderProfile.name}</p>
                    <p className="text-sm text-slate-500">{founderProfile.role}</p>
                  </footer>
                </div>
              </div>
            </article>
            {credibilityCards.map((item, index) => (
              <article
                key={item.title}
                className={`landing-reveal rounded-[2rem] p-6 shadow-sm ${
                  index === 0 ? "bg-[#132238] text-white" : "border border-[#ece4d8] bg-white text-ink"
                }`}
              >
                <p className={`text-sm font-semibold uppercase tracking-[0.2em] ${index === 0 ? "text-[#ff9b8b]" : "text-[#d16d35]"}`}>
                  Product proof
                </p>
                <h3 className="mt-4 font-display text-2xl font-semibold">{item.title}</h3>
                <p className={`mt-4 leading-8 ${index === 0 ? "text-slate-200" : "text-slate-600"}`}>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="pricing" className="mt-12">
          <div className="landing-reveal flex items-end justify-between gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#d16d35]">Pricing concept</p>
              <h2 className="mt-3 font-display text-4xl font-semibold text-[#132238]">A complete landing page needs a pricing story too.</h2>
            </div>
          </div>
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`landing-reveal rounded-[2.25rem] border p-6 shadow-sm ${
                  plan.featured
                    ? "border-[#132238] bg-[#132238] text-white shadow-xl"
                    : "border-[#ece4d8] bg-white text-ink"
                }`}
              >
                <p className={`text-sm font-semibold uppercase tracking-[0.22em] ${plan.featured ? "text-[#ff9b8b]" : "text-[#d16d35]"}`}>
                  {plan.name}
                </p>
                <div className="mt-4 flex items-end gap-2">
                  <p className="font-display text-5xl font-semibold">{plan.price}</p>
                  {plan.note ? <p className={`pb-2 text-sm ${plan.featured ? "text-slate-300" : "text-slate-500"}`}>{plan.note}</p> : null}
                </div>
                <p className={`mt-4 leading-7 ${plan.featured ? "text-slate-300" : "text-slate-600"}`}>{plan.text}</p>
                <div className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className={`rounded-[1.25rem] px-4 py-3 ${plan.featured ? "bg-white/10" : "bg-slate-50"}`}>
                      {feature}
                    </div>
                  ))}
                </div>
                <Link
                  to={isAuthenticated ? "/app" : "/signup"}
                  className={`mt-6 block rounded-full px-5 py-3 text-center text-sm font-semibold ${
                    plan.featured ? "bg-[#ff6b57] text-white" : "bg-[#132238] text-white"
                  }`}
                >
                  {plan.featured ? "Choose Growth" : "Get Started"}
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="landing-reveal rounded-[2.5rem] border border-[#ece4d8] bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#d16d35]">Book a demo</p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-[#132238]">Want this to feel even more productized? Start with a guided demo flow.</h2>
            <p className="mt-4 max-w-xl leading-8 text-slate-600">
              Use this section like a modern SaaS contact surface. It rounds out the landing page and makes the product feel commercially ready.
            </p>
          </div>
          <div className="landing-reveal-delayed rounded-[2.5rem] border border-[#ece4d8] bg-white p-8 shadow-sm">
            <form className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#ff6b57]"
                  type="text"
                  placeholder="Your name"
                />
                <input
                  className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#ff6b57]"
                  type="email"
                  placeholder="Work email"
                />
              </div>
              <input
                className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#ff6b57]"
                type="text"
                placeholder="Team or project"
              />
              <textarea
                className="min-h-32 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#ff6b57]"
                placeholder="Tell us what kind of email workflow you want to run."
              />
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  className="rounded-full bg-[#132238] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Request Demo
                </button>
                <Link
                  to={isAuthenticated ? "/app" : "/signup"}
                  className="rounded-full border border-[#e3d8ca] px-6 py-3 text-center text-sm font-semibold text-slate-700"
                >
                  Try The Product
                </Link>
              </div>
            </form>
          </div>
        </section>

        <section id="faq" className="mt-12 rounded-[2.75rem] bg-[#132238] px-6 py-10 text-white shadow-2xl sm:px-10">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="landing-reveal">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#ff9b8b]">FAQ</p>
              <h2 className="mt-4 font-display text-4xl font-semibold leading-tight">Everything someone needs to trust the platform at a glance.</h2>
              <p className="mt-5 text-slate-300">
                Connect MongoDB, Redis, SMTP, and OpenAI to move from polished UI to an actually working email automation stack.
              </p>
            </div>
            <div className="space-y-4">
              {faqs.map((item) => (
                <div key={item.q} className="landing-reveal rounded-[1.6rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <h3 className="font-semibold text-white">{item.q}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-300">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to={isAuthenticated ? "/app" : "/signup"}
              className="rounded-full bg-[#ff6b57] px-6 py-3 text-center text-sm font-semibold text-white"
            >
              {isAuthenticated ? "Open Workspace" : "Create Account"}
            </Link>
            <Link to="/login" className="rounded-full border border-white/10 px-6 py-3 text-center text-sm font-semibold text-white">
              Sign In
            </Link>
          </div>
        </section>

        <footer className="landing-reveal mt-10 rounded-[2rem] border border-[#ece4d8] bg-white px-6 py-8 shadow-sm sm:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr_0.8fr]">
            <div>
              <p className="font-display text-2xl font-semibold text-[#132238]">MailPilot</p>
              <p className="mt-3 max-w-md leading-7 text-slate-600">
                A full-stack AI email automation platform with a better visual story, stronger infrastructure, and a clearer path from demo to delivery.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d16d35]">Platform</p>
              <div className="mt-4 space-y-3 text-slate-600">
                <p>Campaign creation</p>
                <p>CSV personalization</p>
                <p>Delivery logs</p>
                <p>Analytics dashboard</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d16d35]">Call to action</p>
              <div className="mt-4 space-y-3 text-slate-600">
                <p>Try the public landing page</p>
                <p>Open the protected app</p>
                <p>Connect Brevo or Mailtrap</p>
                <p>Ship your first campaign</p>
              </div>
            </div>
          </div>
        </footer>
      </section>
    </main>
  );
}

export default LandingPage;



