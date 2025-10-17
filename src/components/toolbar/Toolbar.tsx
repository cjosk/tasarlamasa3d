import {
  Move3D as Move3d,   // Eski sürümdeki adı, yenide yok
  Redo2,
  RefreshCcw,
  Save,
  Shapes,
  SquareMousePointer,
  Type,
  Undo2,
  Upload,
  PenSquare,
  Sparkles,
  Box3d // Cube yerine bu kullanılacak
} from 'lucide-react';
import { ChangeEvent } from 'react';
import { useDesignStore } from '../../state/designStore';
import { useDesignContext } from '../../providers/DesignProvider';
import { ShapeKind } from '../../types/design';

export const Toolbar = () => {
  const addShape = useDesignStore((state) => state.addShape);
  const undo = useDesignStore((state) => state.undo);
  const redo = useDesignStore((state) => state.redo);
  const canUndo = useDesignStore((state) => state.history.past.length > 0);
  const canRedo = useDesignStore((state) => state.history.future.length > 0);
  const setTransformMode = useDesignStore((state) => state.setTransformMode);
  const transformMode = useDesignStore((state) => state.transformMode);
  const advanceOnboarding = useDesignStore((state) => state.advanceOnboarding);
  const { saveDesign, exportImage, exportGlb, canvasRef } = useDesignContext();

  const handleAddShape = (kind: ShapeKind) => {
    if (kind === 'text') {
      const text = prompt('Enter neon text');
      if (!text) return;
      addShape('text', { text, label: text.slice(0, 12) });
      advanceOnboarding();
      return;
    }
    addShape(kind);
    advanceOnboarding();
  };

  const handleSvgUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const svgPath = reader.result?.toString();
      if (!svgPath) return;
      addShape('svg', { svgPath, label: file.name });
      advanceOnboarding();
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleSave = async () => {
    await saveDesign();
    console.info('Design saved to your library!');
  };

  const handleExportImage = async () => {
    if (!canvasRef.current) return;
    const dataUrl = await exportImage(canvasRef.current);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'neon-table.png';
    link.click();
  };

  const handleExportGlb = async () => {
    if (!canvasRef.current) return;
    const dataUrl = await exportGlb(canvasRef.current);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'neon-table.glb';
    link.click();
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-slate-800/70 bg-slate-900/70 p-3 text-xs shadow-panel backdrop-blur">
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleAddShape('line')}
          className="flex items-center gap-2 rounded-2xl border border-slate-700/80 px-4 py-2 font-semibold uppercase tracking-wide text-slate-200 transition hover:border-neon-blue/80 hover:text-white"
        >
          <Shapes className="h-4 w-4" />
          Line
        </button>
        <button
          onClick={() => handleAddShape('circle')}
          className="flex items-center gap-2 rounded-2xl border border-slate-700/80 px-4 py-2 font-semibold uppercase tracking-wide text-slate-200 transition hover:border-neon-blue/80 hover:text-white"
        >
          <Sparkles className="h-4 w-4" />
          Circle
        </button>
        <button
          onClick={() => handleAddShape('text')}
          className="flex items-center gap-2 rounded-2xl border border-slate-700/80 px-4 py-2 font-semibold uppercase tracking-wide text-slate-200 transition hover:border-neon-blue/80 hover:text-white"
        >
          <Type className="h-4 w-4" />
          Text
        </button>
        <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-700/80 px-4 py-2 font-semibold uppercase tracking-wide text-slate-200 transition hover:border-neon-blue/80 hover:text-white">
          <Upload className="h-4 w-4" />
          SVG
          <input type="file" accept=".svg" onChange={handleSvgUpload} className="sr-only" />
        </label>
      </div>
      <div className="h-8 w-px bg-slate-700/70" aria-hidden />
      <div className="flex items-center gap-2">
        {(['translate', 'rotate', 'scale'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setTransformMode(mode)}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2 font-semibold uppercase tracking-wide transition ${
              transformMode === mode
                ? 'bg-neon-blue/80 text-white shadow-neon-blue/30'
                : 'border border-slate-700/80 text-slate-200 hover:border-neon-blue/80 hover:text-white'
            }`}
          >
            {mode === 'translate' && <Move3D className="h-4 w-4" />}
            {mode === 'rotate' && <RefreshCcw className="h-4 w-4" />}
            {mode === 'scale' && <SquareMousePointer className="h-4 w-4" />}
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>
      <div className="h-8 w-px bg-slate-700/70" aria-hidden />
      <div className="flex items-center gap-2">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="flex items-center gap-1 rounded-2xl border border-slate-700/80 px-4 py-2 font-semibold uppercase tracking-wide text-slate-200 transition hover:border-neon-pink/80 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Undo2 className="h-4 w-4" />
          Undo
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="flex items-center gap-1 rounded-2xl border border-slate-700/80 px-4 py-2 font-semibold uppercase tracking-wide text-slate-200 transition hover:border-neon-pink/80 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Redo2 className="h-4 w-4" />
          Redo
        </button>
      </div>
      <div className="h-8 w-px bg-slate-700/70" aria-hidden />
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 rounded-2xl bg-neon-blue/80 px-4 py-2 font-semibold uppercase tracking-wide text-white shadow-lg shadow-neon-blue/30 transition hover:bg-neon-blue"
        >
          <Save className="h-4 w-4" />
          Save
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportImage}
            className="flex items-center gap-2 rounded-2xl bg-neon-pink/80 px-4 py-2 font-semibold uppercase tracking-wide text-white shadow-lg shadow-neon-pink/30 transition hover:bg-neon-pink"
          >
            <PenSquare className="h-4 w-4" />
            PNG
          </button>
          <button
            onClick={handleExportGlb}
            className="flex items-center gap-2 rounded-2xl border border-neon-pink/60 px-4 py-2 font-semibold uppercase tracking-wide text-slate-200 transition hover:border-neon-blue/80 hover:text-white"
          >
            <Box3d className="h-4 w-4" />
            GLB
          </button>
        </div>
      </div>
    </div>
  );
};
