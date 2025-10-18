import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LineChart, Shapes, Trash2, Triangle, Type } from 'lucide-react';
import clsx from 'clsx';
import { useDesignStore } from '../../state/designStore';

const iconForKind = (kind: string) => {
  switch (kind) {
    case 'sharp_triangle':
      return <Triangle className="h-4 w-4" />;
    case 'deep_v_shape':
      return <ChevronDown className="h-4 w-4" />;
    case 'smooth_n_curve':
      return <Shapes className="h-4 w-4" />;
    case 'sharp_m_shape':
      return <LineChart className="h-4 w-4" />;
    case 'text':
      return <Type className="h-4 w-4" />;
    default:
      return <ChevronDown className="h-4 w-4" />;
  }
};

export const ShapePanel = () => {
  const design = useDesignStore((state) => state.history.present);
  const selectShape = useDesignStore((state) => state.selectShape);
  const removeShape = useDesignStore((state) => state.removeShape);
  const listRef = useRef<HTMLUListElement | null>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const listEl = listRef.current;
    if (!listEl) {
      return;
    }

    const checkOverflow = () => {
      setHasOverflow(listEl.scrollHeight - listEl.clientHeight > 4);
    };

    checkOverflow();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(checkOverflow);
      resizeObserver.observe(listEl);
    }

    listEl.addEventListener('scroll', checkOverflow);

    return () => {
      resizeObserver?.disconnect();
      listEl.removeEventListener('scroll', checkOverflow);
    };
  }, [design.shapes.length]);

  return (
    <div className="flex h-full flex-col gap-4 rounded-3xl border border-slate-800/80 bg-slate-900/70 p-4 shadow-panel backdrop-blur-xl">
      <div>
        <h3 className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Layers</h3>
        <p className="text-xs text-slate-500">Tap an item to select it in the scene.</p>
      </div>
      <div className="relative">
        <ul
          ref={listRef}
          className="max-h-[calc(100vh-180px)] overflow-y-auto rounded-2xl border border-slate-800/60 divide-y divide-slate-800/40 bg-slate-900/70 backdrop-blur-xl shadow-inner"
        >
          {design.shapes.length === 0 ? (
            <li className="p-6 text-center text-xs text-slate-500">
              No shapes yet. Add one from the Shapes menu to start.
            </li>
          ) : (
            design.shapes.map((shape) => {
              const isSelected = design.selectedId === shape.id;
              const displayName = shape.name ?? shape.label;
              return (
                <li key={shape.id} className="last:border-b-0">
                  <button
                    type="button"
                    onClick={() => selectShape(shape.id)}
                    className={clsx(
                      'flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition',
                      isSelected
                        ? 'bg-neon-blue/10 text-white shadow-[0_0_22px_rgba(59,130,246,0.2)]'
                        : 'text-slate-200 hover:bg-slate-800/70 hover:text-white'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800/80 text-neon-blue">
                        {iconForKind(shape.kind)}
                      </span>
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-semibold">{displayName}</span>
                        <span className="text-[11px] uppercase tracking-[0.25em] text-slate-400">{shape.kind}</span>
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
                </li>
              );
            })
          )}
        </ul>
        {hasOverflow && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 rounded-b-2xl bg-gradient-to-t from-slate-900/90 to-transparent" />
        )}
      </div>
    </div>
  );
};
