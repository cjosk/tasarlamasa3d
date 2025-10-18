import { useCallback, useEffect, useMemo, useRef } from 'react';
import { MoveDown, MoveLeft, MoveRight, MoveUp, RotateCw } from 'lucide-react';
import clsx from 'clsx';
import type { Vector3Tuple } from 'three';
import { movementLimits, selectTableHeights, useDesignStore } from '../../state/designStore';

type MoveDirection = 'left' | 'right' | 'up' | 'down';

const POSITION_STEP = 0.05;
const ROTATION_STEP = (2 * Math.PI) / 180;
const HOLD_DELAY = 70;

export const MobileControlPanel = () => {
  const selectedId = useDesignStore((state) => state.history.present.selectedId);
  const updateShape = useDesignStore((state) => state.updateShape);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);
  const { x: limitX, y: limitY } = movementLimits;

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastFrameRef.current = 0;
  }, []);

  const runAction = useCallback(
    (action: () => void) => {
      stopLoop();
      const loop = (timestamp: number) => {
        if (!lastFrameRef.current) {
          lastFrameRef.current = timestamp;
        }
        if (timestamp - lastFrameRef.current >= HOLD_DELAY) {
          action();
          lastFrameRef.current = timestamp;
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    },
    [stopLoop]
  );

  useEffect(() => {
    if (!selectedId) {
      stopLoop();
    }
    return stopLoop;
  }, [selectedId, stopLoop]);

  const moveShape = useCallback(
    (direction: MoveDirection) => {
      const state = useDesignStore.getState();
      const { history } = state;
      const { selectedId: activeId, shapes } = history.present;
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

      const heights = selectTableHeights(state);
      const minY = heights.neonSurfaceY;
      const maxY = minY + limitY;
      const clampedPosition: Vector3Tuple = [
        Math.min(Math.max(nextX, -limitX), limitX),
        Math.min(Math.max(nextY, minY), maxY),
        0
      ];

      updateShape(activeId, { position: clampedPosition });
    },
    [limitX, limitY, updateShape]
  );

  const rotateShape = useCallback(() => {
    const { history } = useDesignStore.getState();
    const { selectedId: activeId, shapes } = history.present;
    if (!activeId) {
      return;
    }

    const target = shapes.find((shape) => shape.id === activeId);
    if (!target) {
      return;
    }

    const [, ry] = target.rotation;
    const nextRotation: Vector3Tuple = [0, ry + ROTATION_STEP, 0];
    updateShape(activeId, { rotation: nextRotation });
  }, [updateShape]);

  const handlePress = useCallback(
    (action: () => void) => {
      action();
      runAction(action);
    },
    [runAction]
  );

  const handleRelease = useCallback(() => {
    stopLoop();
  }, [stopLoop]);

  const buttonClassName = useMemo(
    () =>
      clsx(
        'group relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/70',
        'text-white shadow-lg shadow-neon-blue/10 transition-all duration-150 ease-micro',
        'hover:bg-neon-blue/30 active:scale-95 active:shadow-[0_0_28px_rgba(82,185,255,0.65)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-blue'
      ),
    []
  );

  if (!selectedId) {
    return null;
  }

  return (
    <div className="pointer-events-auto fixed inset-x-0 bottom-28 z-40 flex justify-center md:hidden">
      <div className="flex w-[min(320px,90vw)] flex-col items-center gap-3 rounded-3xl border border-slate-700/60 bg-slate-900/70 p-4 text-white shadow-panel backdrop-blur-xl">
        <div className="flex justify-center">
          <button
            type="button"
            className={buttonClassName}
            onPointerDown={(event) => {
              event.preventDefault();
              handlePress(() => moveShape('up'));
            }}
            onPointerUp={(event) => {
              event.preventDefault();
              handleRelease();
            }}
            onPointerLeave={handleRelease}
            onPointerCancel={handleRelease}
            aria-label="Move up"
          >
            <span
              className="pointer-events-none absolute inset-0 transform rounded-2xl bg-neon-blue/20 opacity-0 transition duration-150 ease-out group-active:scale-110 group-active:opacity-100 blur-md"
              aria-hidden
            />
            <MoveUp className="h-6 w-6" />
          </button>
        </div>
        <div className="flex w-full items-center justify-center gap-3">
          <button
            type="button"
            className={buttonClassName}
            onPointerDown={(event) => {
              event.preventDefault();
              handlePress(() => moveShape('left'));
            }}
            onPointerUp={(event) => {
              event.preventDefault();
              handleRelease();
            }}
            onPointerLeave={handleRelease}
            onPointerCancel={handleRelease}
            aria-label="Move left"
          >
            <span
              className="pointer-events-none absolute inset-0 transform rounded-2xl bg-neon-blue/20 opacity-0 transition duration-150 ease-out group-active:scale-110 group-active:opacity-100 blur-md"
              aria-hidden
            />
            <MoveLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            className={buttonClassName}
            onPointerDown={(event) => {
              event.preventDefault();
              handlePress(rotateShape);
            }}
            onPointerUp={(event) => {
              event.preventDefault();
              handleRelease();
            }}
            onPointerLeave={handleRelease}
            onPointerCancel={handleRelease}
            aria-label="Rotate"
          >
            <span
              className="pointer-events-none absolute inset-0 transform rounded-2xl bg-neon-blue/20 opacity-0 transition duration-150 ease-out group-active:scale-110 group-active:opacity-100 blur-md"
              aria-hidden
            />
            <RotateCw className="h-6 w-6" />
          </button>
          <button
            type="button"
            className={buttonClassName}
            onPointerDown={(event) => {
              event.preventDefault();
              handlePress(() => moveShape('right'));
            }}
            onPointerUp={(event) => {
              event.preventDefault();
              handleRelease();
            }}
            onPointerLeave={handleRelease}
            onPointerCancel={handleRelease}
            aria-label="Move right"
          >
            <span
              className="pointer-events-none absolute inset-0 transform rounded-2xl bg-neon-blue/20 opacity-0 transition duration-150 ease-out group-active:scale-110 group-active:opacity-100 blur-md"
              aria-hidden
            />
            <MoveRight className="h-6 w-6" />
          </button>
        </div>
        <div className="flex justify-center">
          <button
            type="button"
            className={buttonClassName}
            onPointerDown={(event) => {
              event.preventDefault();
              handlePress(() => moveShape('down'));
            }}
            onPointerUp={(event) => {
              event.preventDefault();
              handleRelease();
            }}
            onPointerLeave={handleRelease}
            onPointerCancel={handleRelease}
            aria-label="Move down"
          >
            <span
              className="pointer-events-none absolute inset-0 transform rounded-2xl bg-neon-blue/20 opacity-0 transition duration-150 ease-out group-active:scale-110 group-active:opacity-100 blur-md"
              aria-hidden
            />
            <MoveDown className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
