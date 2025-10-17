import clsx from 'clsx';
import {
  selectTableProfile,
  useDesignStore
} from '../../state/designStore';
import {
  DEFAULT_TABLE_SIZE_ID,
  TABLE_SIZE_OPTIONS
} from '../three/layers/tableDimensions';

export const TableSizePanel = () => {
  const activeSize = useDesignStore((state) => state.history.present.tableSizeId ?? DEFAULT_TABLE_SIZE_ID);
  const setTableSize = useDesignStore((state) => state.setTableSize);
  const profile = useDesignStore(selectTableProfile);

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-800/80 bg-slate-900/70 p-4 shadow-panel">
      <div>
        <h3 className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
          Table Size
        </h3>
        <p className="text-xs text-slate-500">Tap to match the neon table footprint.</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {TABLE_SIZE_OPTIONS.map((option) => {
          const isActive = option.id === activeSize;
          return (
            <button
              key={option.id}
              onClick={() => setTableSize(option.id)}
              className={clsx(
                'rounded-2xl border px-3 py-3 text-left text-xs transition duration-150 ease-micro',
                isActive
                  ? 'border-neon-blue/80 bg-neon-blue/10 text-white shadow-neon-blue/20'
                  : 'border-slate-800/80 bg-slate-900/80 text-slate-200 hover:border-neon-blue/50 hover:text-white'
              )}
            >
              <span className="block text-sm font-semibold text-slate-100">{option.label}</span>
              <span className="mt-1 block text-[11px] uppercase tracking-[0.3em] text-slate-400">
                {option.dimensionsCm[0]} × {option.dimensionsCm[1]} cm footprint
              </span>
            </button>
          );
        })}
      </div>
      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-3 text-xs text-slate-400">
        Active area: {profile.dimensionsCm[0]} cm × {profile.dimensionsCm[1]} cm × {profile.dimensionsCm[2]} cm
      </div>
    </div>
  );
};
