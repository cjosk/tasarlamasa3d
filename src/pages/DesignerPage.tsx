import { useEffect, useMemo, useState } from 'react';
import { Toolbar } from '../components/toolbar/Toolbar';
import { ThreeCanvas } from '../components/three/ThreeCanvas';
import { ShapePanel } from '../components/panels/ShapePanel';
import { InspectorPanel } from '../components/panels/InspectorPanel';
import { GlassControlPanel } from '../components/panels/GlassControlPanel';
import { PreviewToggle } from '../components/panels/PreviewToggle';
import { OnboardingGuide } from '../components/ui/OnboardingGuide';
import { SaveModal } from '../components/modals/SaveModal';
import { ShareDialog } from '../components/modals/ShareDialog';
import { useDesignContext } from '../providers/DesignProvider';
import { useDesignStore } from '../state/designStore';
import { useSearchParams } from 'react-router-dom';
import { useFirebase } from '../providers/FirebaseProvider';
import clsx from 'clsx';
import { TableSizePanel } from '../components/panels/TableSizePanel';

export const DesignerPage = () => {
  const [searchParams] = useSearchParams();
  const designId = searchParams.get('design');
  const { loadDesignById } = useDesignContext();
  const loading = useDesignStore((state) => state.loading);
  const error = useDesignStore((state) => state.error);
  const { authUser } = useFirebase();
  const [saveOpen, setSaveOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const design = useDesignStore((state) => state.history.present);

  useEffect(() => {
    if (designId) {
      loadDesignById(designId);
    }
  }, [designId, loadDesignById]);

  const fabVisible = useMemo(() => design.shapes.length > 0, [design.shapes.length]);
  const shareDisabled = !design.id;

  return (
    <div className="relative flex h-[calc(100vh-5rem)] flex-col">
      <div className="relative z-30 px-4 pt-4">
        <Toolbar />
      </div>
      {loading && (
        <div className="px-4 text-sm text-slate-400">Syncing with Firebase…</div>
      )}
      {error && (
        <div className="px-4 text-sm text-rose-400">{error}</div>
      )}
      <div className="grid flex-1 gap-4 px-4 pb-6 pt-4 lg:grid-cols-[280px_minmax(0,1fr)_280px]">
        <div className="hidden lg:block">
          <ShapePanel />
        </div>
        <div className="relative flex min-h-[400px] flex-col overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/70 shadow-panel">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-between px-4 py-3 text-xs text-slate-400">
            <span>{design.title}</span>
            <span>{authUser?.displayName ?? 'Designer'}</span>
          </div>
          <div className="flex-1">
            <ThreeCanvas />
          </div>
          <OnboardingGuide />
        </div>
        <div className="hidden gap-4 lg:flex lg:flex-col">
          <TableSizePanel />
          <InspectorPanel />
          <GlassControlPanel />
          <PreviewToggle />
        </div>
      </div>
      <div className="space-y-4 px-4 pb-28 lg:hidden">
        <ShapePanel />
        <TableSizePanel />
        <InspectorPanel />
        <GlassControlPanel />
        <PreviewToggle />
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 bg-slate-950/60 px-4 py-3 backdrop-blur lg:hidden">
        <button
          onClick={() => setSaveOpen(true)}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-neon-blue/80 px-4 py-3 text-sm font-semibold text-white"
        >
          Save
        </button>
        <button
          onClick={() => setShareOpen(true)}
          disabled={shareDisabled}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-neon-pink/80 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          Share
        </button>
      </div>
      <div
        className={clsx(
          'pointer-events-auto fixed bottom-8 right-8 hidden flex-col gap-3 lg:flex',
          fabVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <button
          onClick={() => setSaveOpen(true)}
          className="rounded-full bg-neon-blue/80 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-lg shadow-neon-blue/40 hover:bg-neon-blue"
        >
          Save
        </button>
        <button
          onClick={() => setShareOpen(true)}
          disabled={shareDisabled}
          className="rounded-full bg-neon-pink/80 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-lg shadow-neon-pink/40 hover:bg-neon-pink disabled:cursor-not-allowed disabled:opacity-60"
        >
          Share
        </button>
      </div>
      <SaveModal open={saveOpen} onClose={() => setSaveOpen(false)} />
      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
};
