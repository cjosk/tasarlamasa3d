import { Link } from 'react-router-dom';
import { Sparkles, PenSquare, Share2, Zap } from 'lucide-react';
import { ReactNode } from 'react';

export const LandingPage = () => (
  <div className="relative overflow-hidden">
    <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-900 via-midnight to-slate-950" />
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col gap-16 px-6 py-16">
      <section className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
            <Sparkles className="h-4 w-4 text-neon-pink" />
            Design in real-time
          </span>
          <h1 className="font-display text-4xl font-semibold text-white md:text-6xl">
            Craft glowing <span className="text-neon-blue">3D neon tables</span> in minutes.
          </h1>
          <p className="text-lg text-slate-300">
            Build immersive tabletop light art with precise controls, bloom effects, glass reflections, and collaborative sharing—all rendered in real time with react-three-fiber.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/designer"
              className="rounded-full bg-neon-blue/80 px-8 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-lg shadow-neon-blue/30 transition hover:bg-neon-blue"
            >
              Launch designer
            </Link>
            <Link
              to="/library"
              className="rounded-full border border-slate-700/70 px-8 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:border-neon-pink/70 hover:text-white"
            >
              Browse library
            </Link>
          </div>
        </div>
        <div className="relative rounded-[2.5rem] border border-slate-800/80 bg-slate-900/80 p-6 shadow-[0_40px_120px_rgba(56,189,248,0.15)]">
          <div className="aspect-video w-full overflow-hidden rounded-2xl bg-gradient-to-tr from-neon-blue/30 via-transparent to-neon-pink/20">
            <img
              src="https://images.unsplash.com/photo-1519120944692-1a8d8cfc1070?auto=format&fit=crop&w=1200&q=80"
              alt="Neon table sample"
              className="h-full w-full object-cover opacity-70"
            />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <FeatureCard
              icon={<PenSquare className="h-5 w-5" />}
              title="Freeform layouts"
              description="Drop lines, rings, text, or custom SVG neon art with instant feedback."
            />
            <FeatureCard
              icon={<Zap className="h-5 w-5" />}
              title="Bloom-powered glow"
              description="Switch between high fidelity bloom and eco preview to match your device."
            />
            <FeatureCard
              icon={<Share2 className="h-5 w-5" />}
              title="Cloud sync"
              description="Save designs with generated thumbnails and shareable links via Firebase."
            />
            <FeatureCard
              icon={<Sparkles className="h-5 w-5" />}
              title="Glass realism"
              description="Simulate reflections and tint control with physical-based materials."
            />
          </div>
        </div>
      </section>
      <section className="rounded-[2.5rem] border border-slate-800/70 bg-slate-900/60 p-10 text-center shadow-panel">
        <h2 className="font-display text-3xl font-semibold text-white">Ready to glow?</h2>
        <p className="mt-3 text-slate-400">
          Sign in with Google or email and start crafting a luminous centrepiece for your next event.
        </p>
        <Link
          to="/designer"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-neon-pink/80 px-10 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-lg shadow-neon-pink/30 hover:bg-neon-pink"
        >
          Start designing
        </Link>
      </section>
    </div>
  </div>
);

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 px-4 py-5 text-left text-slate-200">
    <div className="flex items-center gap-2 text-neon-blue">{icon}</div>
    <h3 className="mt-3 text-base font-semibold text-white">{title}</h3>
    <p className="text-sm text-slate-400">{description}</p>
  </div>
);
