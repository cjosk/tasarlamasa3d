import { ToggleLeft, ToggleRight } from 'lucide-react';
import { useDesignStore } from '../../state/designStore';

export const GlassControlPanel = () => {
  const glass = useDesignStore((state) => state.history.present.glass);
  const toggleGlass = useDesignStore((state) => state.toggleGlass);
  const setGlassSettings = useDesignStore((state) => state.setGlassSettings);

  return (
    <div className="flex h-full flex-col gap-4 rounded-3xl border border-slate-800/80 bg-slate-900/70 p-4 shadow-panel">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Glass top
          </h3>
          <p className="text-xs text-slate-500">Add reflections for realism</p>
        </div>
        <button
          onClick={() => toggleGlass(!glass.enabled)}
          className="flex items-center gap-2 rounded-full border border-slate-700/70 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-200 transition hover:border-neon-blue/80 hover:text-white"
        >
          {glass.enabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
          {glass.enabled ? 'On' : 'Off'}
        </button>
      </div>
      <div className="space-y-3">
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Opacity</span>
          <input
            type="range"
            min={0.05}
            max={0.9}
            step={0.05}
            value={glass.opacity}
            onChange={(event) => setGlassSettings({ opacity: Number(event.target.value) })}
            className="accent-neon-blue"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Roughness</span>
          <input
            type="range"
            min={0}
            max={0.6}
            step={0.05}
            value={glass.roughness}
            onChange={(event) => setGlassSettings({ roughness: Number(event.target.value) })}
            className="accent-neon-blue"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Thickness</span>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={glass.thickness}
            onChange={(event) => setGlassSettings({ thickness: Number(event.target.value) })}
            className="accent-neon-blue"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Tint</span>
          <input
            type="color"
            value={glass.tint}
            onChange={(event) => setGlassSettings({ tint: event.target.value })}
            className="h-10 w-full rounded-2xl border border-slate-700/70 bg-slate-900/80"
          />
        </label>
      </div>
    </div>
  );
};
