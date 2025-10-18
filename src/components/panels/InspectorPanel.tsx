import { useMemo } from 'react';
import { useDesignStore } from '../../state/designStore';
import { ColorPicker } from './ColorPicker';

export const InspectorPanel = () => {
  const design = useDesignStore((state) => state.history.present);
  const updateShape = useDesignStore((state) => state.updateShape);
  const advanceOnboarding = useDesignStore((state) => state.advanceOnboarding);
  const selectedShape = useMemo(
    () => design.shapes.find((shape) => shape.id === design.selectedId),
    [design.selectedId, design.shapes]
  );

  if (!selectedShape) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 text-center text-sm text-slate-500 shadow-panel">
        Select a shape to edit its neon style.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 rounded-3xl border border-slate-800/80 bg-slate-900/70 p-4 shadow-panel backdrop-blur-xl">
      <div>
        <h3 className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Inspector</h3>
        <p className="text-xs text-slate-500">Fine-tune the glow for {selectedShape.label}</p>
      </div>
      <div className="space-y-3">
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Color</span>
          <ColorPicker
            value={selectedShape.color}
            onChange={(color) => {
              updateShape(selectedShape.id, { color });
              advanceOnboarding();
            }}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Intensity</span>
          <input
            type="range"
            min={0.4}
            max={4}
            step={0.1}
            value={selectedShape.intensity}
            onChange={(event) => updateShape(selectedShape.id, { intensity: Number(event.target.value) })}
            className="accent-neon-blue"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Glow radius</span>
          <input
            type="range"
            min={0.1}
            max={2}
            step={0.05}
            value={selectedShape.glowRadius}
            onChange={(event) => updateShape(selectedShape.id, { glowRadius: Number(event.target.value) })}
            className="accent-neon-blue"
          />
        </label>
        <p className="rounded-2xl border border-slate-700/70 bg-slate-900/80 p-3 text-[11px] uppercase tracking-[0.3em] text-slate-400">
          Thickness is locked to 17&nbsp;mm for consistent neon lines.
        </p>
      </div>
    </div>
  );
};
