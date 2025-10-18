import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FolderOpen, MoveDown, MoveLeft, MoveRight, MoveUp, RotateCw, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import type { Vector3Tuple } from 'three';
import {
  movementLimits,
  selectTableHeights,
  useDesignStore
} from '../../state/designStore';
import { useDesignContext } from '../../providers/DesignProvider';
import { NEON_PALETTE } from './ColorPicker';
import type { ShapeKind } from '../../types/design';
import type { TableSizeId } from '../three/layers/tableDimensions';

const POSITION_STEP = 0.05;
const ROTATION_STEP = Math.PI / 12; // 15°
const HOLD_INTERVAL_MS = 70;

const SHAPE_OPTIONS = [
  { kind: 'v_shape', label: 'V SHAPE' },
  { kind: 'single_peak', label: 'PEAK' },
  { kind: 'zigzag_m', label: 'ZIGZAG' }
] as const satisfies readonly { kind: ShapeKind; label: string }[];

type ShapeOption = (typeof SHAPE_OPTIONS)[number];

type MoveDirection = 'left' | 'right' | 'up' | 'down';
type MovementButton =
  | {
      kind: 'move';
      direction: MoveDirection;
      icon: ReactNode;
      label: string;
    }
  | {
      kind: 'rotate';
      icon: ReactNode;
      label: string;
    };

export const MobileControlPanel = () => {
  const selectedId = useDesignStore((state) => state.history.present.selectedId);
  const selectedShape = useDesignStore((state) => {
    const { selectedId: activeId, shapes } = state.history.present;
    return shapes.find((shape) => shape.id === activeId);
  });
  const shapes = useDesignStore((state) => state.history.present.shapes);
  const updateShape = useDesignStore((state) => state.updateShape);
  const addShape = useDesignStore((state) => state.addShape);
  const advanceOnboarding = useDesignStore((state) => state.advanceOnboarding);
  const selectShape = useDesignStore((state) => state.selectShape);
  const removeShape = useDesignStore((state) => state.removeShape);
  const { saveDesign, exportImage, exportGlb, canvasRef, exporting } = useDesignContext();
  const setError = useDesignStore((state) => state.setError);
  const [finishing, setFinishing] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);
  const layerListRef = useRef<HTMLUListElement | null>(null);
  const [layerHasOverflow, setLayerHasOverflow] = useState(false);
  const { x: limitX, y: limitY } = movementLimits;
  const tableSizeId = useDesignStore((state) => state.history.present.tableSizeId);
  const setTableSize = useDesignStore((state) => state.setTableSize);

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

  useEffect(() => {
    const list = layerListRef.current;
    if (!list) return;

    const evaluateOverflow = () => {
      setLayerHasOverflow(list.scrollHeight - list.clientHeight > 4);
    };

    evaluateOverflow();

    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(evaluateOverflow);
      resizeObserver.observe(list);
    }

    list.addEventListener('scroll', evaluateOverflow);

    return () => {
      resizeObserver?.disconnect();
      list.removeEventListener('scroll', evaluateOverflow);
    };
  }, [shapes.length]);

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
      addShape(option.kind);
      advanceOnboarding();
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

  const MOBILE_TABLE_SIZES: readonly { id: TableSizeId; label: string; helperIds?: readonly TableSizeId[] }[] = useMemo(
    () => [
      { id: '70x45x50', label: 'Küçük' },
      { id: '90x45x50', label: 'Orta', helperIds: ['120x80x50'] },
      { id: '150x80x50', label: 'Büyük' }
    ],
    []
  );

  const handleTableSizePress = useCallback(
    (option: (typeof MOBILE_TABLE_SIZES)[number]) => {
      if (option.helperIds && option.helperIds.length > 0) {
        const cycle = [option.id, ...option.helperIds];
        const currentIndex = tableSizeId && cycle.includes(tableSizeId) ? cycle.indexOf(tableSizeId) : -1;
        const nextId = currentIndex >= 0 ? cycle[(currentIndex + 1) % cycle.length] : option.id;
        setTableSize(nextId);
        return;
      }
      setTableSize(option.id);
    },
    [setTableSize, tableSizeId, MOBILE_TABLE_SIZES]
  );

  const movementButtons = useMemo<readonly MovementButton[]>(
    () => [
      { kind: 'move', direction: 'left', icon: <MoveLeft className="h-5 w-5" />, label: 'Sola taşı' },
      { kind: 'move', direction: 'up', icon: <MoveUp className="h-5 w-5" />, label: 'Yukarı taşı' },
      { kind: 'rotate', icon: <RotateCw className="h-5 w-5" />, label: 'Döndür' },
      { kind: 'move', direction: 'down', icon: <MoveDown className="h-5 w-5" />, label: 'Aşağı taşı' },
      { kind: 'move', direction: 'right', icon: <MoveRight className="h-5 w-5" />, label: 'Sağa taşı' }
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
    <div className="flex flex-col gap-4 pb-6">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-300">Kontroller</span>
        <button
          type="button"
          onClick={() => setLayersOpen((prev) => !prev)}
          className={clsx(
            'flex h-10 w-10 items-center justify-center rounded-full border border-slate-700/60 bg-slate-900/80 text-slate-200 transition-colors duration-150 ease-micro',
            'hover:border-neon-blue/60 hover:text-white active:scale-95'
          )}
          aria-expanded={layersOpen}
          aria-controls="mobile-layer-list"
          aria-label={layersOpen ? 'Katman listesini gizle' : 'Katman listesini göster'}
        >
          <FolderOpen className="h-5 w-5" />
        </button>
      </div>
      {layersOpen && (
        <div className="relative rounded-2xl border border-slate-800/60 bg-slate-900/70 p-2 shadow-inner">
          <ul
            id="mobile-layer-list"
            ref={layerListRef}
            className="max-h-40 overflow-y-auto divide-y divide-slate-800/40"
          >
            {shapes.length === 0 ? (
              <li className="py-4 text-center text-xs text-slate-500">Henüz şekil yok. Aşağıdan ekleyin.</li>
            ) : (
              shapes.map((shape) => {
                const isSelected = shape.id === selectedId;
                return (
                  <li key={shape.id} className="last:border-b-0">
                    <button
                      type="button"
                      onClick={() => selectShape(shape.id)}
                      className={clsx(
                        'flex w-full items-center justify-between gap-3 px-3 py-3 text-left text-sm transition',
                        isSelected
                          ? 'bg-neon-blue/10 text-white shadow-[0_0_16px_rgba(59,130,246,0.25)]'
                          : 'text-slate-200 hover:bg-slate-800/70 hover:text-white'
                      )}
                    >
                      <span className="truncate font-semibold uppercase tracking-[0.25em]">{shape.label}</span>
                      <Trash2
                        className="h-4 w-4 text-slate-500 transition hover:text-rose-400"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeShape(shape.id);
                        }}
                      />
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          {layerHasOverflow && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 rounded-b-2xl bg-gradient-to-t from-slate-900/85 to-transparent" />
          )}
        </div>
      )}
      <div className="flex items-center justify-center gap-3">
        {movementButtons.map((button) => {
          const glow = (
            <span
              className="pointer-events-none absolute inset-0 rounded-2xl bg-neon-blue/20 opacity-0 transition duration-150 ease-out group-active:scale-125 group-active:opacity-100 blur-md"
              aria-hidden
            />
          );

          if (button.kind === 'rotate') {
            return (
              <button
                key="rotate"
                type="button"
                className={buttonClassName}
                aria-label={button.label}
                disabled={isActionDisabled}
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
              >
                {glow}
                {button.icon}
              </button>
            );
          }

          return (
            <button
              key={button.direction}
              type="button"
              className={buttonClassName}
              aria-label={button.label}
              disabled={isActionDisabled}
              onPointerDown={(event) => {
                event.preventDefault();
                if (isActionDisabled) return;
                const direction = button.direction;
                handlePress(() => moveShape(direction));
              }}
              onPointerUp={(event) => {
                event.preventDefault();
                handleRelease();
              }}
              onPointerLeave={handleRelease}
              onPointerCancel={handleRelease}
            >
              {glow}
              {button.icon}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-3 gap-2">
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
      <div className="flex flex-wrap items-center justify-center gap-3">
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
      <div className="flex flex-col gap-2">
        <span className="text-center text-[11px] uppercase tracking-[0.3em] text-slate-400">Masa Boyutu</span>
        <div className="flex justify-center gap-2">
          {MOBILE_TABLE_SIZES.map((option) => {
            const matchesCurrent =
              tableSizeId === option.id || (tableSizeId ? option.helperIds?.includes(tableSizeId) : false);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleTableSizePress(option)}
                className={clsx(
                  'px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition',
                  'rounded-full border backdrop-blur-md',
                  matchesCurrent
                    ? 'border-neon-pink/80 bg-neon-pink/30 text-white shadow-[0_0_22px_rgba(236,72,153,0.35)]'
                    : 'border-slate-700/70 text-slate-300 hover:border-neon-blue/60 hover:text-white'
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="sticky bottom-0 left-0 right-0 pt-2">
        <div className="rounded-2xl bg-slate-900/90 p-3 shadow-inner shadow-slate-900/60">
          <button
            type="button"
            onClick={handleFinish}
            disabled={finishDisabled}
            className={clsx(
              'flex w-full items-center justify-center rounded-2xl bg-neon-pink/80 px-6 py-3 text-sm font-bold uppercase tracking-[0.35em] text-white shadow-lg shadow-neon-pink/40 backdrop-blur-xl transition-all',
              'hover:bg-neon-pink disabled:cursor-not-allowed disabled:opacity-60'
            )}
          >
            {finishing || exporting ? 'KAYDEDİLİYOR…' : 'TASARIMI BİTİR'}
          </button>
        </div>
      </div>
    </div>
  );
};
