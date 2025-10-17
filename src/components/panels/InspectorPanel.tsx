import { HexColorPicker } from 'react-colorful';
import { useDesignStore } from '../../state/designStore';
import { useMemo } from 'react';

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
    <div className="flex h-full flex-col gap-4 rounded-3xl border border-slate-800/80 bg-slate-900/70 p-4 shadow-panel">
      <div>
        <h3 className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
          Inspector
        </h3>
        <p className="text-xs text-slate-500">Fine-tune the glow for {selectedShape.label}</p>
      </div>
      <div className="space-y-3">
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Color</span>
          <div className="rounded-3xl border border-slate-700/70 bg-slate-900/80 p-3">
            <HexColorPicker
              color={selectedShape.color}
              onChange={(value) => {
                updateShape(selectedShape.id, { color: value });
                advanceOnboarding();
              }}
            />
          </div>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Intensity</span>
          <input
            type="range"
            min={0.4}
            max={4}
            step={0.1}
            value={selectedShape.intensity}
            onChange={(event) =>
              updateShape(selectedShape.id, { intensity: Number(event.target.value) })
            }
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
            onChange={(event) =>
              updateShape(selectedShape.id, { glowRadius: Number(event.target.value) })
            }
            className="accent-neon-blue"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Thickness</span>
          <input
            type="range"
            min={0.05}
            max={0.8}
            step={0.05}
            value={selectedShape.thickness}
            onChange={(event) =>
              updateShape(selectedShape.id, { thickness: Number(event.target.value) })
            }
            className="accent-neon-blue"
          />
        </label>
      </div>
    </div>
  );
};
