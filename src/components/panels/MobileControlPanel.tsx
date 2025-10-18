import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MoveDown, MoveLeft, MoveRight, MoveUp, RotateCw } from 'lucide-react';
import clsx from 'clsx';
import type { Vector3Tuple } from 'three';
import {
  movementLimits,
  selectTableHeights,
  useDesignStore
} from '../../state/designStore';
import { useDesignContext } from '../../providers/DesignProvider';
import { NEON_PALETTE } from './ColorPicker';

const POSITION_STEP = 0.05;
const ROTATION_STEP = (2 * Math.PI) / 180; // ≈2°
const HOLD_INTERVAL_MS = 70;

const SHAPE_OPTIONS = [
  { kind: 'v_shape', label: 'V SHAPE' as const },
  { kind: 'single_peak', label: 'PEAK' as const },
  { kind: 'zigzag_m', label: 'ZIGZAG' as const },
  { kind: 'text', label: 'TEXT' as const },
  { kind: 'svg', label: 'SVG' as const }
];

type ShapeOption = (typeof SHAPE_OPTIONS)[number];

type MoveDirection = 'left' | 'right' | 'up' | 'down';

export const MobileControlPanel = () => {
  const selectedId = useDesignStore((state) => state.history.present.selectedId);
  const selectedShape = useDesignStore((state) => {
    const { selectedId: activeId, shapes } = state.history.present;
    return shapes.find((shape) => shape.id === activeId);
  });
  const updateShape = useDesignStore((state) => state.updateShape);
  const addShape = useDesignStore((state) => state.addShape);
  const advanceOnboarding = useDesignStore((state) => state.advanceOnboarding);
  const { saveDesign, exportImage, exportGlb, canvasRef, exporting } = useDesignContext();
  const setError = useDesignStore((state) => state.setError);
  const [finishing, setFinishing] = useState(false);
  const svgInputRef = useRef<HTMLInputElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);
  const { x: limitX, y: limitY } = movementLimits;

  const isActionDisabled = !selectedId;

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastFrameRef.current = 0;
  }, []);

  const runContinuous = useCallback(
    (action: () => void) => {
      stopLoop();
      const loop = (timestamp: number) => {
        if (!lastFrameRef.current) {
          lastFrameRef.current = timestamp;
        }
        if (timestamp - lastFrameRef.current >= HOLD_INTERVAL_MS) {
          action();
          lastFrameRef.current = timestamp;
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    },
    [stopLoop]
  );

  useEffect(() => stopLoop, [stopLoop]);

  useEffect(() => {
    if (!selectedId) {
      stopLoop();
    }
  }, [selectedId, stopLoop]);

  const clampPosition = useCallback(
    (x: number, y: number): Vector3Tuple => {
      const state = useDesignStore.getState();
      const heights = selectTableHeights(state);
      const minY = heights.neonSurfaceY;
      const maxY = minY + limitY;
      return [
        Math.min(Math.max(x, -limitX), limitX),
        Math.min(Math.max(y, minY), maxY),
        0
      ];
    },
    [limitX, limitY]
  );

  const moveShape = useCallback(
    (direction: MoveDirection) => {
      const state = useDesignStore.getState();
      const { selectedId: activeId, shapes } = state.history.present;
      if (!activeId) {
        return;
      }
      const target = shapes.find((shape) => shape.id === activeId);
      if (!target) {
        return;
      }
      const [x, y] = target.position;
      let nextX = x;
      let nextY = y;
      switch (direction) {
        case 'left':
          nextX = x - POSITION_STEP;
          break;
        case 'right':
          nextX = x + POSITION_STEP;
          break;
        case 'up':
          nextY = y + POSITION_STEP;
          break;
        case 'down':
          nextY = y - POSITION_STEP;
          break;
      }
      updateShape(activeId, { position: clampPosition(nextX, nextY) });
    },
    [clampPosition, updateShape]
  );

  const rotateShape = useCallback(() => {
    const state = useDesignStore.getState();
    const { selectedId: activeId, shapes } = state.history.present;
    if (!activeId) {
      return;
    }
    const target = shapes.find((shape) => shape.id === activeId);
    if (!target) {
      return;
    }
    const [, ry] = target.rotation;
    const nextRotation: Vector3Tuple = [Math.PI, ry + ROTATION_STEP, 0];
    updateShape(activeId, { rotation: nextRotation });
  }, [updateShape]);

  const handlePress = useCallback(
    (action: () => void) => {
      action();
      runContinuous(action);
    },
    [runContinuous]
  );

  const handleRelease = useCallback(() => {
    stopLoop();
  }, [stopLoop]);

  const handleAddShape = useCallback(
    (option: ShapeOption) => {
      if (option.kind === 'text') {
        const text = prompt('Neon metni girin');
        if (!text) {
          return;
        }
        addShape('text', { text, label: text.slice(0, 18) });
        advanceOnboarding();
        return;
      }
      if (option.kind === 'svg') {
        svgInputRef.current?.click();
        return;
      }
      addShape(option.kind);
      advanceOnboarding();
    },
    [addShape, advanceOnboarding]
  );

  const handleSvgFile = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const content = typeof reader.result === 'string' ? reader.result : '';
        if (!content) {
          event.target.value = '';
          return;
        }
        addShape('svg', { svgPath: content, label: file.name.replace(/\.[^/.]+$/, '') });
        advanceOnboarding();
        event.target.value = '';
      };
      reader.readAsText(file);
    },
    [addShape, advanceOnboarding]
  );

  const applyColor = useCallback(
    (color: string) => {
      if (!selectedId) return;
      updateShape(selectedId, { color });
    },
    [selectedId, updateShape]
  );

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
      setError(error instanceof Error ? error.message : 'Tasarımı tamamlayamadık, tekrar deneyin.');
    } finally {
      setFinishing(false);
    }
  }, [canvasRef, exportGlb, exportImage, exporting, finishing, saveDesign, setError]);

  const finishDisabled = finishing || exporting || !canvasRef.current;

  const movementButtons = useMemo(
    () => [
      { direction: 'left' as const, icon: <MoveLeft className="h-5 w-5" />, label: 'Sola taşı' },
      { direction: 'up' as const, icon: <MoveUp className="h-5 w-5" />, label: 'Yukarı taşı' },
      { direction: 'rotate' as const, icon: <RotateCw className="h-5 w-5" />, label: 'Döndür' },
      { direction: 'down' as const, icon: <MoveDown className="h-5 w-5" />, label: 'Aşağı taşı' },
      { direction: 'right' as const, icon: <MoveRight className="h-5 w-5" />, label: 'Sağa taşı' }
    ],
    []
  );

  const buttonClassName = useMemo(
    () =>
      clsx(
        'group relative flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700/60',
        'bg-slate-900/70 text-white shadow-lg shadow-neon-blue/10 transition-all duration-150 ease-micro',
        'hover:bg-neon-blue/20 active:scale-95 active:shadow-[0_0_28px_rgba(82,185,255,0.55)]',
        'disabled:cursor-not-allowed disabled:opacity-40'
      ),
    []
  );

  return (
    <>
      <input
        ref={svgInputRef}
        type="file"
        accept=".svg"
        className="hidden"
        onChange={handleSvgFile}
      />
      <div className="pointer-events-auto fixed bottom-0 left-0 right-0 z-40 md:hidden">
        <div className="mx-auto w-full max-w-xl rounded-t-3xl border-t border-slate-800/60 bg-slate-900/70 shadow-2xl shadow-slate-900/40 backdrop-blur-xl">
          <div className="max-h-[60vh] overflow-y-auto px-4 py-3">
            <div className="flex items-center justify-center gap-3">
              {movementButtons.map((button) => {
                if (button.direction === 'rotate') {
                  return (
                    <button
                      key={button.direction}
                      type="button"
                      className={buttonClassName}
                      onPointerDown={(event) => {
                        event.preventDefault();
                        if (isActionDisabled) return;
                        handlePress(rotateShape);
                      }}
                      onPointerUp={(event) => {
                        event.preventDefault();
                        handleRelease();
                      }}
                      onPointerLeave={handleRelease}
                      onPointerCancel={handleRelease}
                      aria-label={button.label}
                      disabled={isActionDisabled}
                    >
                      <span
                        className="pointer-events-none absolute inset-0 rounded-2xl bg-neon-blue/20 opacity-0 transition duration-150 ease-out group-active:scale-125 group-active:opacity-100 blur-md"
                        aria-hidden
                      />
                      {button.icon}
                    </button>
                  );
                }
                return (
                  <button
                    key={button.direction}
                    type="button"
                    className={buttonClassName}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      if (isActionDisabled) return;
                      handlePress(() => moveShape(button.direction as MoveDirection));
                    }}
                    onPointerUp={(event) => {
                      event.preventDefault();
                      handleRelease();
                    }}
                    onPointerLeave={handleRelease}
                    onPointerCancel={handleRelease}
                    aria-label={button.label}
                    disabled={isActionDisabled}
                  >
                    <span
                      className="pointer-events-none absolute inset-0 rounded-2xl bg-neon-blue/20 opacity-0 transition duration-150 ease-out group-active:scale-125 group-active:opacity-100 blur-md"
                      aria-hidden
                    />
                    {button.icon}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {SHAPE_OPTIONS.map((option) => (
                <button
                  key={option.kind}
                  type="button"
                  onClick={() => handleAddShape(option)}
                  className="flex min-h-[60px] items-center justify-center rounded-2xl border border-slate-800/60 bg-slate-900/80 px-2 text-[11px] font-bold uppercase tracking-[0.25em] text-slate-200 transition hover:border-neon-blue/70 hover:text-white active:scale-95"
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              {NEON_PALETTE.map((color) => {
                const isActive = selectedShape?.color?.toLowerCase() === color.toLowerCase();
                const glowShadow = `0 0 12px ${color}80, 0 0 24px ${color}40`;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => applyColor(color)}
                    disabled={!selectedId}
                    style={{
                      backgroundColor: color,
                      boxShadow: isActive
                        ? `${glowShadow}, 0 0 0 4px rgba(15,23,42,0.9), 0 0 0 6px ${color}`
                        : glowShadow
                    }}
                    className={clsx(
                      'group h-12 w-12 rounded-full transition-transform duration-150 ease-micro',
                      'hover:scale-105 active:scale-95',
                      'disabled:cursor-not-allowed disabled:opacity-40'
                    )}
                    aria-label={`Rengi ${color} yap`}
                  >
                    <span className="pointer-events-none block h-full w-full rounded-full opacity-0 transition group-active:animate-ping group-active:opacity-70" />
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={handleFinish}
                disabled={finishDisabled}
                className={clsx(
                  'flex min-w-[220px] items-center justify-center rounded-2xl bg-neon-pink/80 px-6 py-3 text-sm font-bold uppercase tracking-[0.35em] text-white shadow-lg shadow-neon-pink/40 backdrop-blur-xl transition-all',
                  'hover:bg-neon-pink disabled:cursor-not-allowed disabled:opacity-60'
                )}
              >
                {finishing || exporting ? 'Kaydediliyor…' : 'Tasarımı Bitir'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
