import { useEffect, useMemo } from 'react';
import { Toolbar } from '../components/toolbar/Toolbar';
import { ThreeCanvas } from '../components/three/ThreeCanvas';
import { ShapePanel } from '../components/panels/ShapePanel';
import { InspectorPanel } from '../components/panels/InspectorPanel';
import { GlassControlPanel } from '../components/panels/GlassControlPanel';
import { PreviewToggle } from '../components/panels/PreviewToggle';
import { OnboardingGuide } from '../components/ui/OnboardingGuide';
import { useDesignContext } from '../providers/DesignProvider';
import { useDesignStore } from '../state/designStore';
import { useSearchParams } from 'react-router-dom';
import { useFirebase } from '../providers/FirebaseProvider';
import { TableSizePanel } from '../components/panels/TableSizePanel';
import { MobileControlPanel } from '../components/panels/MobileControlPanel';

export const DesignerPage = () => {
  const [searchParams] = useSearchParams();
  const designId = searchParams.get('design');
  const { loadDesignById } = useDesignContext();
  const loading = useDesignStore((state) => state.loading);
  const error = useDesignStore((state) => state.error);
  const { authUser } = useFirebase();
  const design = useDesignStore((state) => state.history.present);

  useEffect(() => {
    if (designId) {
      loadDesignById(designId);
    }
  }, [designId, loadDesignById]);

  const showStatus = useMemo(() => loading || Boolean(error), [error, loading]);

  return (
    <div className="relative flex min-h-[calc(100vh-5rem)] flex-col">
      <div className="relative z-30 px-4 pt-4">
        <Toolbar />
      </div>
      {showStatus && (
        <div className="px-4 text-sm">
          {loading && <span className="text-slate-400">Syncing with Firebase…</span>}
          {error && <span className="text-rose-400">{error}</span>}
        </div>
      )}
      <div className="hidden flex-1 gap-4 px-4 pb-6 pt-4 lg:grid lg:grid-cols-[280px_minmax(0,1fr)_280px]">
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
      <div className="lg:hidden flex flex-1 flex-col overflow-hidden pb-[45vh]">
        <div className="px-3 pt-1 pb-1">
          <div className="relative h-[55vh] overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/70 shadow-panel">
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-between px-4 py-3 text-xs text-slate-400">
              <span>{design.title}</span>
              <span>{authUser?.displayName ?? 'Designer'}</span>
            </div>
            <ThreeCanvas />
            <OnboardingGuide />
          </div>
        </div>
      </div>
      <div className="pointer-events-none lg:hidden">
        <div className="pointer-events-auto fixed inset-x-0 bottom-0 z-40">
          <div className="mx-auto w-full max-w-xl rounded-t-3xl border-t border-slate-800/60 bg-slate-900/70 shadow-2xl shadow-slate-900/40 backdrop-blur-xl">
            <div className="max-h-[45vh] overflow-y-auto px-4 pt-4 pb-8 space-y-6">
              <MobileControlPanel />
              <div className="space-y-4 pb-6">
                <ShapePanel />
                <TableSizePanel />
                <InspectorPanel />
                <GlassControlPanel />
                <PreviewToggle />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
