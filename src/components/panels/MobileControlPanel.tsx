import { useCallback } from 'react';
import { MoveDown, MoveLeft, MoveRight, MoveUp, RotateCw } from 'lucide-react';
import clsx from 'clsx';
import { Vector3Tuple } from 'three';
import { useDesignStore } from '../../state/designStore';

type MoveDirection = 'left' | 'right' | 'up' | 'down';

const POSITION_STEP = 0.5;
const ROTATION_STEP = Math.PI / 12;

export const MobileControlPanel = () => {
  const selectedId = useDesignStore((state) => state.history.present.selectedId);
  const updateShape = useDesignStore((state) => state.updateShape);

  const moveShape = useCallback(
    (direction: MoveDirection) => {
      const { history } = useDesignStore.getState();
      const { selectedId: activeId, shapes } = history.present;
      if (!activeId) {
        return;
      }

      const target = shapes.find((shape) => shape.id === activeId);
      if (!target) {
        return;
      }

      const [x, y, z] = target.position;
      let nextPosition: Vector3Tuple = [x, y, z];

      switch (direction) {
        case 'left':
          nextPosition = [x - POSITION_STEP, y, z];
          break;
        case 'right':
          nextPosition = [x + POSITION_STEP, y, z];
          break;
        case 'up':
          nextPosition = [x, y + POSITION_STEP, z];
          break;
        case 'down':
          nextPosition = [x, y - POSITION_STEP, z];
          break;
      }

      updateShape(activeId, { position: nextPosition });
    },
    [updateShape]
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

    const [rx, ry, rz] = target.rotation;
    const nextRotation: Vector3Tuple = [rx, ry + ROTATION_STEP, rz];
    updateShape(activeId, { rotation: nextRotation });
  }, [updateShape]);

  if (!selectedId) {
    return null;
  }

  const buttonClassName = clsx(
    'flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700/60 bg-slate-900/70',
    'text-white shadow-lg shadow-neon-blue/10 transition-transform transition-colors duration-150 ease-micro',
    'active:scale-90 hover:bg-neon-blue/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-blue'
  );

  return (
    <div className="pointer-events-auto fixed inset-x-0 bottom-24 z-40 flex justify-center md:hidden">
      <div className="flex w-[min(320px,90vw)] flex-col items-center gap-3 rounded-3xl border border-slate-700/60 bg-slate-900/70 p-4 text-white shadow-panel backdrop-blur-xl">
        <div className="flex justify-center">
          <button
            type="button"
            className={buttonClassName}
            onClick={() => moveShape('up')}
            aria-label="Move up"
          >
            <MoveUp className="h-6 w-6" />
          </button>
        </div>
        <div className="flex w-full items-center justify-center gap-3">
          <button
            type="button"
            className={buttonClassName}
            onClick={() => moveShape('left')}
            aria-label="Move left"
          >
            <MoveLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            className={buttonClassName}
            onClick={rotateShape}
            aria-label="Rotate"
          >
            <RotateCw className="h-6 w-6" />
          </button>
          <button
            type="button"
            className={buttonClassName}
            onClick={() => moveShape('right')}
            aria-label="Move right"
          >
            <MoveRight className="h-6 w-6" />
          </button>
        </div>
        <div className="flex justify-center">
          <button
            type="button"
            className={buttonClassName}
            onClick={() => moveShape('down')}
            aria-label="Move down"
          >
            <MoveDown className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

