import { Move3D, RefreshCcw, SquareMousePointer } from 'lucide-react';
import { useDesignStore } from '../../state/designStore';

const MODES = ['translate', 'rotate', 'scale'] as const;

type Mode = (typeof MODES)[number];

const labelMap: Record<Mode, string> = {
  translate: 'Translate',
  rotate: 'Rotate',
  scale: 'Scale'
};

const iconMap: Record<Mode, JSX.Element> = {
  translate: <Move3D className="h-4 w-4" />,
  rotate: <RefreshCcw className="h-4 w-4" />,
  scale: <SquareMousePointer className="h-4 w-4" />
};

export const Toolbar = () => {
  const setTransformMode = useDesignStore((state) => state.setTransformMode);
  const transformMode = useDesignStore((state) => state.transformMode);

  return (
    <div className="flex items-center justify-center">
      <div className="hidden items-center gap-3 rounded-3xl border border-slate-800/70 bg-slate-900/70 p-3 text-xs shadow-panel backdrop-blur md:flex">
        {MODES.map((mode) => (
          <button
            key={mode}
            onClick={() => setTransformMode(mode)}
            className={`flex items-center gap-2 rounded-2xl px-5 py-2 font-semibold uppercase tracking-[0.35em] transition ${
              transformMode === mode
                ? 'bg-neon-blue/80 text-white shadow-neon-blue/30'
                : 'border border-slate-700/80 text-slate-200 hover:border-neon-blue/80 hover:text-white'
            }`}
          >
            {iconMap[mode]}
            {labelMap[mode]}
          </button>
        ))}
      </div>
    </div>
  );
};
