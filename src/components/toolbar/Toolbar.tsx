import { useCallback, useState } from 'react';
import clsx from 'clsx';
import { Loader2, Move3D, RefreshCcw, SquareMousePointer } from 'lucide-react';
import { useDesignStore } from '../../state/designStore';
import { useDesignContext } from '../../providers/DesignProvider';

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
  const setError = useDesignStore((state) => state.setError);
  const { saveDesign, exportImage, exportGlb, canvasRef, exporting } = useDesignContext();
  const [finishing, setFinishing] = useState(false);

  const handleFinish = useCallback(async () => {
    if (finishing || exporting) {
      return;
    }

    const canvasElement = canvasRef.current;
    if (!canvasElement) {
      setError('Önizleme hazır değil. Lütfen sahnenin yüklenmesini bekleyin.');
      return;
    }

    try {
      setFinishing(true);
      setError(undefined);
      await saveDesign();
      await exportImage(canvasElement);
      await exportGlb(canvasElement);
    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : 'Tasarım tamamlanamadı');
    } finally {
      setFinishing(false);
    }
  }, [canvasRef, exportGlb, exportImage, exporting, finishing, saveDesign, setError]);

  const finishDisabled = finishing || exporting || !canvasRef.current;

  return (
    <div className="relative flex w-full flex-col items-center gap-4">
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
      <button
        type="button"
        onClick={handleFinish}
        disabled={finishDisabled}
        className={clsx(
          'pointer-events-auto fixed bottom-8 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-neon-pink/80 px-6 py-3 text-sm font-bold uppercase tracking-[0.35em] text-white shadow-lg shadow-neon-pink/40 backdrop-blur-xl transition-all',
          'hover:bg-neon-pink disabled:cursor-not-allowed disabled:opacity-60',
          'md:static md:translate-x-0 md:gap-3'
        )}
      >
        {(finishing || exporting) && <Loader2 className="h-4 w-4 animate-spin" />}
        Tasarımı Bitir
      </button>
    </div>
  );
};
