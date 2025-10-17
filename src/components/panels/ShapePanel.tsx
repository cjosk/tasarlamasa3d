import { Activity, ChevronDown, Mountain, Trash2, Type, Upload } from 'lucide-react';
import { useDesignStore } from '../../state/designStore';

const iconForKind = (kind: string) => {
  switch (kind) {
    case 'v_shape':
      return <ChevronDown className="h-4 w-4" />;
    case 'single_peak':
      return <Mountain className="h-4 w-4" />;
    case 'zigzag_m':
      return <Activity className="h-4 w-4" />;
    case 'text':
      return <Type className="h-4 w-4" />;
    case 'svg':
      return <Upload className="h-4 w-4" />;
    default:
      return <ChevronDown className="h-4 w-4" />;
  }
};

export const ShapePanel = () => {
  const design = useDesignStore((state) => state.history.present);
  const selectShape = useDesignStore((state) => state.selectShape);
  const removeShape = useDesignStore((state) => state.removeShape);

  return (
    <div className="flex h-full flex-col gap-4 rounded-3xl border border-slate-800/80 bg-slate-900/70 p-4 shadow-panel backdrop-blur">
      <div>
        <h3 className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
          Layers
        </h3>
        <p className="text-xs text-slate-500">Tap an item to select it in the scene.</p>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto pr-2">
        {design.shapes.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-700/60 bg-slate-900/50 p-4 text-center text-xs text-slate-500">
            No shapes yet. Add one from the toolbar to start.
          </div>
        )}
        {design.shapes.map((shape) => {
          const isSelected = design.selectedId === shape.id;
          return (
            <button
              key={shape.id}
              onClick={() => selectShape(shape.id)}
              className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                isSelected
                  ? 'border-neon-blue/90 bg-neon-blue/10 text-white shadow-neon-blue/20'
                  : 'border-slate-800/80 bg-slate-900/80 text-slate-200 hover:border-neon-blue/50 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800/70 text-neon-blue">
                  {iconForKind(shape.kind)}
                </span>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-semibold">{shape.label}</span>
                  <span className="text-[11px] uppercase tracking-[0.25em] text-slate-400">
                    {shape.kind}
                  </span>
                </div>
              </div>
              <Trash2
                onClick={(event) => {
                  event.stopPropagation();
                  removeShape(shape.id);
                }}
                className="h-4 w-4 text-slate-500 transition hover:text-rose-400"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
