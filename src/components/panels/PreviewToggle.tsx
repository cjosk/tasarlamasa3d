import { useDesignStore } from '../../state/designStore';
import { Lightbulb, Zap } from 'lucide-react';

export const PreviewToggle = () => {
  const design = useDesignStore((state) => state.history.present);
  const setAnimationEnabled = useDesignStore((state) => state.setAnimationEnabled);

  const animated = design.shapes.every((shape) => shape.animated);

  return (
    <div className="flex items-center justify-between rounded-3xl border border-slate-800/80 bg-slate-900/70 px-5 py-4 shadow-panel">
      <div>
        <h4 className="text-sm font-semibold text-white">Live glow preview</h4>
        <p className="text-xs text-slate-500">Toggle pulsing animation for neon tubes.</p>
      </div>
      <button
        onClick={() => setAnimationEnabled(!animated)}
        className="flex items-center gap-2 rounded-full border border-slate-700/80 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-200 transition hover:border-neon-blue/80 hover:text-white"
      >
        {animated ? <Zap className="h-4 w-4" /> : <Lightbulb className="h-4 w-4" />}
        {animated ? 'On' : 'Off'}
      </button>
    </div>
  );
};
