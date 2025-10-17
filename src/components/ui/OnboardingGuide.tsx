import { useDesignStore } from '../../state/designStore';
import { Sparkles } from 'lucide-react';

const steps = [
  {
    title: 'Add a neon shape',
    description: 'Use the toolbar to drop a V-stroke, peak, zigzag, text, or your custom SVG.'
  },
  {
    title: 'Tune the color',
    description: 'Pick a vibrant tone and adjust the glow intensity to taste.'
  },
  {
    title: 'Save your masterpiece',
    description: 'Hit save to store the design in your cloud library and share.'
  }
];

export const OnboardingGuide = () => {
  const onboardingStep = useDesignStore((state) => state.onboardingStep);
  const advanceOnboarding = useDesignStore((state) => state.advanceOnboarding);
  const restart = useDesignStore((state) => state.restartOnboarding);

  if (onboardingStep >= steps.length) {
    return null;
  }

  const step = steps[onboardingStep];

  return (
    <div className="pointer-events-auto fixed bottom-6 right-6 z-40 w-full max-w-xs rounded-3xl border border-slate-800/80 bg-slate-900/90 p-4 text-sm text-slate-200 shadow-panel">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-neon-pink/20 p-2 text-neon-pink">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Step {onboardingStep + 1}</p>
          <h4 className="text-base font-semibold text-white">{step.title}</h4>
          <p className="text-xs text-slate-400">{step.description}</p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={advanceOnboarding}
              className="rounded-full bg-neon-blue/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-neon-blue"
            >
              Got it
            </button>
            <button
              onClick={restart}
              className="rounded-full border border-slate-700/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300 hover:border-neon-pink/70 hover:text-white"
            >
              Restart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
