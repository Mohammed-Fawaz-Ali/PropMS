import React from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  Briefcase,
  UserRound,
  Check,
  Wallet,
  FileText,
  Wrench,
  PieChart,
  Bell,
  Sparkles,
  Shield,
  Lock,
  Users,
  MapPin,
} from 'lucide-react';

const navLink =
  'text-sm font-medium text-slate-300 hover:text-white transition-colors';

const Section = ({ id, className = '', children }) => (
  <section id={id} className={className}>
    {children}
  </section>
);

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#f4f6fb] text-slate-900 antialiased">
      {/* —— Header + Hero —— */}
      <header className="relative bg-[#12122b] text-white overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 80% 50% at 50% -20%, #7c7cfc55, transparent)',
          }}
        />
        <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-5 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold tracking-tight text-white"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7c7cfc]/20 ring-1 ring-[#7c7cfc]/40">
              <Home className="h-5 w-5 text-[#a5a5ff]" aria-hidden />
            </span>
            PropMS
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className={navLink}>
              Features
            </a>
            <a href="#how-it-works" className={navLink}>
              How it works
            </a>
            <a href="#pricing" className={navLink}>
              Pricing
            </a>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              to="/login"
              className="hidden rounded-xl border border-white/25 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 sm:inline-flex"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-xl border border-white/40 bg-transparent px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              Get started free
            </Link>
          </div>
        </nav>

        <div className="relative z-10 mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-28 lg:pt-4">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#7c7cfc]/30 bg-[#7c7cfc]/10 px-4 py-1.5 text-xs font-medium text-[#c4c4ff]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              AI-powered property management
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              Manage rentals. The{' '}
              <span className="bg-gradient-to-r from-[#a5a5ff] to-[#7c7cfc] bg-clip-text text-transparent">
                smart
              </span>{' '}
              way.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
              PropMS automates rent collection, maintenance requests, lease
              tracking, and reminders—so you spend less time on spreadsheets
              and more time growing your portfolio.
            </p>
            <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-2xl bg-[#7c7cfc] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#7c7cfc]/25 transition hover:bg-[#6b6bf0] hover:shadow-xl"
              >
                Create owner account — free
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-2xl border border-white/25 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
              >
                Tenant portal login
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6">
            {[
              { label: '100%', sub: 'Automated billing' },
              { label: '0', sub: 'Spreadsheets needed' },
              { label: 'AI', sub: 'Rent pricing engine' },
              { label: '24/7', sub: 'Tenant self-service' },
            ].map((item) => (
              <div
                key={item.sub}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-5 text-center backdrop-blur-sm"
              >
                <p className="text-lg font-bold text-white sm:text-xl">
                  {item.label}
                </p>
                <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                  {item.sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* —— Who are you —— */}
      <Section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
          Who are you?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-slate-600">
          Choose the path that fits you. Owners get the full dashboard;
          tenants get a simple portal for rent and repairs.
        </p>
        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm shadow-slate-200/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#7c7cfc]/15 text-[#5b5bd6]">
              <Briefcase className="h-6 w-6" aria-hidden />
            </div>
            <h3 className="mt-6 text-xl font-bold text-slate-900">
              I&apos;m a property owner
            </h3>
            <p className="mt-3 text-slate-600 leading-relaxed">
              Run every building and unit from one place. See who paid, what is
              overdue, and which tickets need attention—without chasing data
              across files.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              {[
                'Add unlimited properties and units',
                'Track overdue payments and send reminders',
                'Invite tenants with secure portal access',
                'Maintenance desk with status tracking',
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <Check
                    className="mt-0.5 h-5 w-5 shrink-0 text-[#7c7cfc]"
                    aria-hidden
                  />
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-8 border-t border-slate-100 pt-6">
              <Link
                to="/register"
                className="inline-flex w-full items-center justify-center rounded-xl bg-[#7c7cfc] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#6b6bf0] sm:w-auto"
              >
                Create free owner account
              </Link>
              <p className="mt-4 text-center text-sm text-slate-500 lg:text-left">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-[#5b5bd6] hover:underline"
                >
                  Sign in as owner
                </Link>
              </p>
            </div>
          </div>

          <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm shadow-slate-200/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <UserRound className="h-6 w-6" aria-hidden />
            </div>
            <h3 className="mt-6 text-xl font-bold text-slate-900">
              I&apos;m a tenant
            </h3>
            <p className="mt-3 text-slate-600 leading-relaxed">
              Pay rent on time, download receipts, and submit maintenance
              requests without phone tag. Your landlord enables access for your
              unit.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              {[
                'Pay rent online with clear history',
                'Raise and track repair tickets',
                'Get notifications for dues and updates',
                'Secure login separate from owner tools',
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <Check
                    className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500"
                    aria-hidden
                  />
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-8 border-t border-slate-100 pt-6">
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center rounded-xl border-2 border-emerald-500/30 bg-emerald-50/50 px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 sm:w-auto"
              >
                Go to tenant login
              </Link>
              <p className="mt-4 text-center text-sm text-slate-500 lg:text-left">
                Access is provided by your property owner after you are added to
                PropMS.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* —— Features —— */}
      <Section
        id="features"
        className="border-y border-slate-200/80 bg-white py-16 lg:py-24"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
            Built for serious landlords
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
            Everything you need to operate rentals at scale—payments, leases,
            maintenance, and AI-assisted insights in one workspace.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Wallet,
                color: 'bg-violet-100 text-violet-600',
                title: 'Online rent collection',
                desc: 'Automated invoices, payment tracking, and a clear ledger for every tenant.',
              },
              {
                icon: FileText,
                color: 'bg-blue-100 text-blue-600',
                title: 'Lease management',
                desc: 'Keep terms, renewals, and key dates organized with less manual follow-up.',
              },
              {
                icon: Wrench,
                color: 'bg-amber-100 text-amber-600',
                title: 'Maintenance desk',
                desc: 'Tickets, priorities, and status so repairs never fall through the cracks.',
              },
              {
                icon: PieChart,
                color: 'bg-emerald-100 text-emerald-600',
                title: 'Financial reports',
                desc: 'See income, arrears, and portfolio health without rebuilding spreadsheets.',
              },
              {
                icon: Bell,
                color: 'bg-rose-100 text-rose-600',
                title: 'Overdue alerts',
                desc: 'Stay ahead of late rent with reminders you can act on immediately.',
              },
              {
                icon: Sparkles,
                color: 'bg-indigo-100 text-indigo-600',
                title: 'AI insights',
                desc: 'Suggestions on rent levels and risk signals to support better decisions.',
              },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-100 bg-[#fafbfc] p-6 transition hover:border-slate-200 hover:shadow-md"
              >
                <div
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${color}`}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* —— How it works —— */}
      <Section id="how-it-works" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
          Up and running in minutes
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-slate-600">
          No lengthy onboarding—create your account, add properties, invite
          tenants, and let billing run on autopilot.
        </p>
        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              n: 1,
              title: 'Create your account',
              body: 'Sign up free as a property owner and verify your email.',
            },
            {
              n: 2,
              title: 'Add your property',
              body: 'Add buildings, units, and rent amounts in a guided flow.',
            },
            {
              n: 3,
              title: 'Invite your tenants',
              body: 'Add tenant details; they receive credentials to the portal.',
            },
            {
              n: 4,
              title: 'Sit back',
              body: 'Rent bills generate on schedule—track payments in one dashboard.',
            },
          ].map((step) => (
            <div key={step.n} className="relative text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#7c7cfc] text-lg font-bold text-white shadow-lg shadow-[#7c7cfc]/30">
                {step.n}
              </div>
              <h3 className="mt-5 font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* —— Pricing teaser —— */}
      <Section
        id="pricing"
        className="border-t border-slate-200/80 bg-white py-16 lg:py-20"
      >
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-slate-600 leading-relaxed">
            Start free and scale as you add units. No hidden fees for core owner
            workflows—upgrade when you need advanced reporting and team seats.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex rounded-2xl bg-[#7c7cfc] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#6b6bf0]"
            >
              Start free today
            </Link>
            <a
              href="mailto:hello@propms.example"
              className="text-sm font-medium text-[#5b5bd6] hover:underline"
            >
              Contact sales for teams
            </a>
          </div>
        </div>
      </Section>

      {/* —— Trust strip —— */}
      <div className="bg-[#12122b] py-10 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-4 text-sm text-slate-300 sm:px-6 lg:px-8">
          <span className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#a5a5ff]" aria-hidden />
            Bank-level payment security
          </span>
          <span className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-[#a5a5ff]" aria-hidden />
            Data encrypted in transit &amp; at rest
          </span>
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#a5a5ff]" aria-hidden />
            Role-based access
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#a5a5ff]" aria-hidden />
            Built for the Indian rental market
          </span>
        </div>
      </div>

      {/* —— Footer —— */}
      <footer className="bg-[#0e0e24] py-10 text-slate-400">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Home className="h-5 w-5 text-[#a5a5ff]" aria-hidden />
            <span className="font-semibold text-white">PropMS</span>
            <span className="text-sm text-slate-500">
              © {new Date().getFullYear()} PropMS. All rights reserved.
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <a href="#" className="hover:text-white">
              Privacy
            </a>
            <a href="#" className="hover:text-white">
              Terms
            </a>
            <a href="mailto:hello@propms.example" className="hover:text-white">
              Contact
            </a>
            <Link to="/login" className="hover:text-white">
              Log in
            </Link>
            <Link to="/register" className="font-medium text-[#a5a5ff] hover:underline">
              Create account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
