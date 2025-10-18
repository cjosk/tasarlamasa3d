import { useEffect, useMemo } from 'react';
import { Toolbar } from '../components/toolbar/Toolbar';
import { ThreeCanvas } from '../components/three/ThreeCanvas';
import { ShapePanel } from '../components/panels/ShapePanel';
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
    <div className="relative flex min-h-screen flex-col">
      <div className="relative z-30 hidden px-4 pt-4 md:block">
        <Toolbar />
      </div>
      {showStatus && (
        <div className="px-4 text-sm">
          {loading && <span className="text-slate-400">Syncing with Firebase…</span>}
          {error && <span className="text-rose-400">{error}</span>}
        </div>
      )}
      <div className="hidden flex-1 gap-4 px-4 pb-6 pt-4 md:grid md:grid-cols-[280px_minmax(0,1fr)_280px]">
        <div className="hidden md:block">
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
        <div className="hidden gap-4 md:flex md:flex-col">
          <TableSizePanel />
          <GlassControlPanel />
          <PreviewToggle />
        </div>
      </div>
      <div className="relative flex flex-1 flex-col md:hidden">
        <div className="fixed top-0 left-0 right-0 h-[60vh] bg-[#0D1117]">
          <ThreeCanvas />
          <OnboardingGuide />
        </div>
        <div className="pt-[60vh]" aria-hidden />
        <div className="fixed bottom-0 left-0 right-0">
          <div className="bg-slate-900/80 backdrop-blur-2xl rounded-t-3xl border-t border-slate-800 px-4 pb-4 pt-0 shadow-lg max-h-[40vh] overflow-y-auto">
            <MobileControlPanel />
          </div>
        </div>
      </div>
    </div>
  );
};
