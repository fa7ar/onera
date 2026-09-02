import { useState, useEffect } from 'react';
import {
  Boxes,
  ArrowRight,
  Building2,
  Users,
  Shield,
  Layers,
  Zap,
  Check,
  GitBranch,
  Globe,
  Menu,
  X,
} from 'lucide-react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';

const features = [
  {
    icon: Building2,
    title: 'Organizations',
    description: 'Manage multiple organizations with isolated workspaces, each with its own members and settings.',
  },
  {
    icon: Users,
    title: 'Team Management',
    description: 'Invite team members, assign roles, and control who can access what with granular permissions.',
  },
  {
    icon: Shield,
    title: 'Role-Based Access',
    description: 'Built-in RBAC with customizable roles and per-module permission keys for fine-grained control.',
  },
  {
    icon: Layers,
    title: 'Modular Architecture',
    description: 'Add only the modules you need — inventory, finance, HR, CRM — and extend with custom addons.',
  },
  {
    icon: GitBranch,
    title: 'Open Source',
    description: 'MIT licensed and fully self-hostable. No vendor lock-in, no hidden costs, full data ownership.',
  },
  {
    icon: Zap,
    title: 'Edge-First',
    description: 'Built on Cloudflare Workers for global low-latency access with server-side rendering support.',
  },
];

const stats = [
  { value: '9', label: 'Capability Ports' },
  { value: '100%', label: 'Open Source' },
  { value: '0', label: 'Vendor Lock-in' },
];

export function LandingPage() {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleGetStarted = () => {
    if (user) {
      navigate({ name: 'dashboard' });
    } else {
      navigate({ name: 'signup' });
    }
  };

  const handleSignIn = () => {
    navigate({ name: 'login' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'border-b border-slate-200 bg-white/90 backdrop-blur-md'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
              <Boxes className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Onera</span>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
              Features
            </a>
            <a href="#architecture" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
              Architecture
            </a>
            <a href="#opensource" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
              Open Source
            </a>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <button
              onClick={handleSignIn}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              Sign in
            </button>
            <button
              onClick={handleGetStarted}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
            <div className="space-y-3">
              <a href="#features" className="block text-sm font-medium text-slate-600" onClick={() => setMobileMenuOpen(false)}>
                Features
              </a>
              <a href="#architecture" className="block text-sm font-medium text-slate-600" onClick={() => setMobileMenuOpen(false)}>
                Architecture
              </a>
              <a href="#opensource" className="block text-sm font-medium text-slate-600" onClick={() => setMobileMenuOpen(false)}>
                Open Source
              </a>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => { handleSignIn(); setMobileMenuOpen(false); }}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Sign in
                </button>
                <button
                  onClick={() => { handleGetStarted(); setMobileMenuOpen(false); }}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Get started
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-900 pt-32 pb-24 sm:pt-40 sm:pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-slate-900 to-slate-900" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-slate-300 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
              Modular ERP platform — now in alpha
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl sm:leading-tight lg:text-6xl lg:leading-tight">
              The open-source<br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                business operating system
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl">
              A modular ERP platform for running your entire business — organizations, teams,
              roles, and modules that work together. Self-host or use the cloud.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={handleGetStarted}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 sm:w-auto"
              >
                Get started free
                <ArrowRight className="h-5 w-5" />
              </button>
              <a
                href="#features"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 sm:w-auto"
              >
                Explore features
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-20 max-w-4xl">
            <div className="grid grid-cols-3 gap-4 sm:gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold text-white sm:text-4xl">{stat.value}</div>
                  <div className="mt-1 text-sm text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Everything you need to run your business
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              A clean, modular foundation that grows with you. Start with identity and access
              control, then add modules as your needs expand.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group relative rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/50"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section id="architecture" className="bg-slate-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                <Layers className="h-4 w-4" />
                Clean Architecture
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Built on a foundation that scales
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Onera separates domain logic from infrastructure through port-adapter
                interfaces. Swap any provider — database, storage, payments, email — without
                touching business logic.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  'Domain layer with zero framework dependencies',
                  '9 provider ports: database, storage, auth, payments, and more',
                  'Adapter system lets you swap providers per deployment',
                  'Edge-first runtime on Cloudflare Workers',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-600">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                <img
                  src="https://images.pexels.com/photos/577210/pexels-photo-577210.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                  alt="Analytics dashboard showing data visualizations"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-lg sm:block">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Edge-deployed</div>
                    <div className="text-xs text-slate-500">Global low-latency</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Open Source CTA */}
      <section id="opensource" className="py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-8 py-16 text-center sm:px-16 sm:py-20">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-slate-900 to-slate-900" />
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                backgroundSize: '32px 32px',
              }}
            />
            <div className="relative">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                <GitBranch className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Open source. Self-hostable. Yours.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
                MIT licensed with no vendor lock-in. Deploy on the cloud or run it on your own
                infrastructure — your data stays yours.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button
                  onClick={handleGetStarted}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-slate-900 shadow-lg transition-all hover:bg-slate-100 sm:w-auto"
                >
                  Start building
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button
                  onClick={handleSignIn}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 sm:w-auto"
                >
                  Sign in
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <Boxes className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold tracking-tight text-slate-900">Onera</span>
            </div>
            <p className="text-sm text-slate-500">
              Open source · MIT License · Built for the edge
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
