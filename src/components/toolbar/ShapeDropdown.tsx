import { useState } from 'react';
import { Activity, ChevronDown, ChevronUp, Mountain, Sparkles, Type } from 'lucide-react';
import { useDesignStore } from '../../state/designStore';
import type { ShapeKind } from '../../types/design';

interface ShapeOption {
  kind: ShapeKind;
  label: string;
  icon: JSX.Element;
}

const SHAPE_OPTIONS: ShapeOption[] = [
  { kind: 'v_shape', label: 'V Shape', icon: <ChevronDown className="h-4 w-4" /> },
  { kind: 'single_peak', label: 'Peak', icon: <Mountain className="h-4 w-4" /> },
  { kind: 'zigzag_m', label: 'Zigzag', icon: <Activity className="h-4 w-4" /> },
  { kind: 'text', label: 'Text', icon: <Type className="h-4 w-4" /> }
];

export const ShapeDropdown = () => {
  const [open, setOpen] = useState(false);
  const addShape = useDesignStore((state) => state.addShape);
  const advanceOnboarding = useDesignStore((state) => state.advanceOnboarding);

  const handleAdd = (option: ShapeOption) => {
    if (option.kind === 'text') {
      const text = prompt('Enter neon text');
      if (!text) {
        return;
      }
      addShape('text', { text, label: text.slice(0, 12) });
      advanceOnboarding();
      setOpen(false);
      return;
    }

    addShape(option.kind);
    advanceOnboarding();
    setOpen(false);
  };

  return (
    <div className="pointer-events-auto fixed bottom-20 left-1/2 z-40 w-[min(320px,92vw)] -translate-x-1/2 md:bottom-8">
      <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 shadow-panel backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex w-full items-center justify-between rounded-3xl px-5 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-slate-200 transition hover:text-white"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-neon-blue" />
            Shapes
          </span>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <div
          className={`grid origin-top transform gap-2 px-4 pb-4 transition-all duration-200 ease-in-out ${
            open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/80 p-3 shadow-[0_0_18px_rgba(59,130,246,0.2)]">
            <div className="flex flex-col gap-2">
              {SHAPE_OPTIONS.map((option) => (
                <button
                  key={option.kind}
                  type="button"
                  onClick={() => handleAdd(option)}
                  className="flex items-center justify-between rounded-2xl border border-slate-700/60 px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:border-neon-blue/70 hover:text-white"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800/80 text-neon-blue">
                      {option.icon}
                    </span>
                    {option.label}
                  </span>
                  <ChevronRightGlow />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChevronRightGlow = () => (
  <span className="relative inline-flex h-6 w-6 items-center justify-center">
    <span className="absolute inset-0 rounded-full bg-neon-blue/20 blur" aria-hidden />
    <ChevronDown className="h-3 w-3 rotate-[-90deg] text-neon-blue" />
  </span>
);
