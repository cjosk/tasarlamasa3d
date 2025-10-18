import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FolderOpen, MoveDown, MoveLeft, MoveRight, MoveUp, RotateCw, Shapes, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { Canvas } from '@react-three/fiber';
import type { Vector3Tuple } from 'three';
import { TubeGeometry } from 'three';
import { selectMovementLimits, selectTableHeights, useDesignStore } from '../../state/designStore';
import { useDesignContext } from '../../providers/DesignProvider';
import { NEON_PALETTE } from './ColorPicker';
import type { CanonicalShapeKind } from '../../types/design';
import type { TableSizeId } from '../three/layers/tableDimensions';
import { createNeonCurve } from '../three/neonCurves';
import { EnvironmentPreviewPanel } from './EnvironmentPreviewPanel';

const POSITION_STEP = 0.05;
const ROTATION_STEP = Math.PI / 12; // 15°
const HOLD_INTERVAL_MS = 70;
const PREVIEW_RADIUS = 0.017 / 2;

const SHAPE_OPTIONS = [
  { kind: 'sharp_triangle', label: 'Sharp Triangle' },
  { kind: 'deep_v_shape', label: 'Deep V' },
  { kind: 'smooth_n_curve', label: 'Smooth N' },
  { kind: 'sharp_m_shape', label: 'Sharp W' }
] as const satisfies readonly { kind: CanonicalShapeKind; label: string }[];

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
  const [libraryOpen, setLibraryOpen] = useState(false);
  const movementLimits = useDesignStore(selectMovementLimits);
  const tableHeights = useDesignStore(selectTableHeights);
  const { x: limitX, z: limitZ } = movementLimits;
  const surfaceY = tableHeights.neonSurfaceY;
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
    (x: number, z: number): Vector3Tuple => [
      Math.min(Math.max(x, -limitX), limitX),
      surfaceY,
      Math.min(Math.max(z, -limitZ), limitZ)
    ],
    [limitX, limitZ, surfaceY]
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
      const [x, , z = 0] = target.position;
      let nextX = x;
      let nextZ = z;
      switch (direction) {
        case 'left':
          nextX = x - POSITION_STEP;
          break;
        case 'right':
          nextX = x + POSITION_STEP;
          break;
        case 'up':
          nextZ = z - POSITION_STEP;
          break;
        case 'down':
          nextZ = z + POSITION_STEP;
          break;
      }
      updateShape(activeId, { position: clampPosition(nextX, nextZ) });
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

  const MOBILE_TABLE_SIZES: readonly { id: TableSizeId; label: string }[] = useMemo(
    () => [
      { id: '70x45x50', label: 'S' },
      { id: '90x45x50', label: 'M' },
      { id: '120x80x50', label: 'L' },
      { id: '150x80x50', label: 'XL' }
    ],
    []
  );

  const handleTableSizePress = useCallback(
    (option: (typeof MOBILE_TABLE_SIZES)[number]) => {
      setTableSize(option.id);
    },
    [setTableSize]
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
    <div className="relative w-full">
      <div className="pointer-events-none absolute -top-6 left-0 z-30 flex w-full justify-center">
        <div className="pointer-events-auto w-full">
          <EnvironmentPreviewPanel />
        </div>
      </div>

      <div className="mt-14 flex flex-col gap-4 pb-4">
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
                  const displayName = shape.name ?? shape.label;
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
                        <span className="truncate font-semibold uppercase tracking-[0.25em]">{displayName}</span>
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
      <div className="mt-4 flex flex-col items-center">
        <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-300">Renkler</span>
        <div className="mt-4 mb-4 flex flex-nowrap items-center justify-center gap-2">
          {NEON_PALETTE.map((color) => {
            const isActive = selectedShape?.color?.toLowerCase() === color.toLowerCase();
            return (
              <button
                key={color}
                type="button"
                onClick={() => applyColor(color)}
                disabled={!selectedId}
                style={{ backgroundColor: color }}
                className={clsx(
                  'h-8 w-8 flex-shrink-0 rounded-full border transition-transform duration-150 ease-micro',
                  isActive ? 'border-neon-pink/80' : 'border-slate-700/70',
                  'hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100'
                )}
                aria-label={`Rengi ${color} yap`}
                aria-pressed={isActive}
              />
            );
          })}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setLibraryOpen((prev) => !prev)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/80 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
        aria-expanded={libraryOpen}
      >
        <Shapes className="h-4 w-4" />
        Şekil Kütüphanesi
      </button>
      <div
        className={clsx(
          'overflow-hidden transition-all duration-300 ease-in-out',
          libraryOpen ? 'max-h-56 opacity-100' : 'max-h-0 opacity-0'
        )}
        aria-hidden={!libraryOpen}
      >
        <div className="grid grid-cols-4 justify-center gap-2 pt-2 pb-2">
          {SHAPE_OPTIONS.map((option) => {
            const isActive = selectedShape?.kind === option.kind;
            return (
              <button
                key={option.kind}
                type="button"
                onClick={() => handleAddShape(option)}
                className={clsx(
                  'relative flex h-16 w-16 items-center justify-center rounded-xl border bg-slate-900/70 transition-all duration-150 ease-micro',
                  'border-slate-700/70 hover:border-neon-blue/50 active:scale-95',
                  isActive && 'ring-2 ring-neon-blue/50'
                )}
                aria-label={option.label}
              >
                <ShapePreview kind={option.kind} />
                <span className="sr-only">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-center text-[11px] uppercase tracking-[0.3em] text-slate-400">Masa Boyutu</span>
        <div className="grid grid-cols-4 gap-2 mt-4">
          {MOBILE_TABLE_SIZES.map((option) => {
            const matchesCurrent = tableSizeId === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleTableSizePress(option)}
                className={clsx(
                  'flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 py-2 text-[0.55rem] font-semibold uppercase tracking-[0.18em] text-slate-300 transition hover:bg-slate-700 active:scale-95',
                  matchesCurrent && 'bg-neon-pink text-white shadow-[0_0_16px_rgba(236,72,153,0.45)]'
                )}
              >
                {option.label} EBAT
              </button>
            );
          })}
        </div>
      </div>
      <button
        type="button"
        onClick={handleFinish}
        disabled={finishDisabled}
        className={clsx(
          'mt-1 flex w-full items-center justify-center rounded-2xl bg-neon-pink/80 px-6 py-3 text-sm font-bold uppercase tracking-[0.35em] text-white shadow-lg shadow-neon-pink/40 backdrop-blur-xl transition-all',
          'hover:bg-neon-pink disabled:cursor-not-allowed disabled:opacity-60'
        )}
      >
        {finishing || exporting ? 'KAYDEDİLİYOR…' : 'TASARIMI BİTİR'}
      </button>
    </div>
  </div>
  );
};

const ShapePreview = ({ kind }: { kind: CanonicalShapeKind }) => {
  const geometry = useMemo(() => {
    const definition = createNeonCurve(kind);
    if (!definition) return null;
    return new TubeGeometry(definition.curve, definition.tubularSegments, PREVIEW_RADIUS, 18, false);
  }, [kind]);

  useEffect(() => {
    return () => {
      geometry?.dispose();
    };
  }, [geometry]);

  if (!geometry) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-900/70 text-[10px] uppercase tracking-[0.2em] text-slate-500">
        N/A
      </div>
    );
  }

  return (
    <Canvas
      orthographic
      camera={{ zoom: 55, position: [0, 0, 5] }}
      className="h-16 w-16 rounded-xl bg-slate-900/70"
      dpr={[1, 1.5]}
      style={{ pointerEvents: 'none' }}
    >
      <ambientLight intensity={0.9} />
      <mesh geometry={geometry} rotation={[Math.PI, 0, 0]}>
        <meshStandardMaterial
          color="#52B9FF"
          emissive="#52B9FF"
          emissiveIntensity={1}
          toneMapped={false}
        />
      </mesh>
    </Canvas>
  );
};
