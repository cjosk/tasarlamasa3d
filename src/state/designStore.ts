import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { isDraft, original } from 'immer';
import { nanoid } from '../utils/nanoid';
import type { Vector3Tuple } from 'three';
import { DesignStateData, GlassSettings, NeonShape, ShapeKind } from '../types/design';
import {
  DEFAULT_TABLE_SIZE_ID,
  getTableHeights,
  getTableProfile
} from '../components/three/layers/tableDimensions';
import type { TableSizeId } from '../components/three/layers/tableDimensions';

interface DesignStoreState {
  history: {
    past: DesignStateData[];
    present: DesignStateData;
    future: DesignStateData[];
  };
  onboardingStep: number;
  performance: 'high' | 'eco';
  transformMode: 'translate' | 'rotate' | 'scale';
  isTransforming: boolean;
  loading: boolean;
  error?: string;
  setTableSize: (sizeId: TableSizeId) => void;
  addShape: (kind: ShapeKind, payload?: Partial<NeonShape>) => void;
  updateShape: (id: string, patch: Partial<NeonShape>) => void;
  removeShape: (id: string) => void;
  selectShape: (id?: string) => void;
  setGlassSettings: (settings: Partial<GlassSettings>) => void;
  toggleGlass: (enabled: boolean) => void;
  setTitle: (title: string) => void;
  setPerformance: (mode: 'high' | 'eco') => void;
  setTransformMode: (mode: 'translate' | 'rotate' | 'scale') => void;
  setTransforming: (active: boolean) => void;
  setAnimationEnabled: (enabled: boolean) => void;
  loadDesign: (data: DesignStateData) => void;
  resetDesign: () => void;
  setLoading: (loading: boolean) => void;
  setError: (message?: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  advanceOnboarding: () => void;
  restartOnboarding: () => void;
}

const defaultDesign = (): DesignStateData => ({
  title: 'Untitled Neon Table',
  shapes: [],
  glass: {
    enabled: true,
    opacity: 0.35,
    tint: '#94a3b8',
    roughness: 0.1,
    thickness: 0.6
  },
  tableSizeId: DEFAULT_TABLE_SIZE_ID,
  performance: 'high'
});

const clone = <T,>(value: T): T => {
  const plain = isDraft(value) ? (original(value) as T) ?? value : value;

  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(plain);
    } catch (error) {
      // Ignore and fall through to JSON cloning when structuredClone cannot serialize.
    }
  }

  return JSON.parse(JSON.stringify(plain));
};

const pushHistory = (state: DesignStoreState['history'], next: DesignStateData) => {
  state.past.push(clone(state.present));
  state.present = clone(next);
  state.future = [];
};

const LABEL_PRESETS: Record<ShapeKind, string> = {
  v_shape: 'V Stroke',
  single_peak: 'Peak',
  zigzag_m: 'Zigzag',
  text: 'Neon Text',
  svg: 'Imported SVG'
};

const NEON_THICKNESS = 0.017;
const STACK_SPACING = 0.08;
const LIMIT_X = 0.5; // 50 cm expressed in meters
const LIMIT_Y = 0.4; // 40 cm expressed in meters

const resolveTableSizeId = (sizeId?: TableSizeId): TableSizeId => sizeId ?? DEFAULT_TABLE_SIZE_ID;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const constrainPosition = (position: Vector3Tuple, tableSizeId: TableSizeId): Vector3Tuple => {
  const profile = getTableProfile(tableSizeId);
  const heights = getTableHeights(profile);
  const minY = heights.neonSurfaceY;
  const maxY = heights.neonSurfaceY + LIMIT_Y;

  return [
    clamp(position[0], -LIMIT_X, LIMIT_X),
    clamp(position[1], minY, maxY),
    0
  ] as Vector3Tuple;
};

const constrainRotation = (rotation: Vector3Tuple): Vector3Tuple => [0, rotation[1], 0];

const sanitizeShape = (shape: NeonShape, tableSizeId: TableSizeId): NeonShape => ({
  ...shape,
  thickness: NEON_THICKNESS,
  position: constrainPosition(shape.position, tableSizeId),
  rotation: constrainRotation(shape.rotation)
});

const createShape = (kind: ShapeKind, payload?: Partial<NeonShape>): NeonShape => {
  const base: NeonShape = {
    id: nanoid(),
    kind,
    label: `${LABEL_PRESETS[kind]} #${Math.floor(Math.random() * 900 + 100)}`,
    color: '#52B9FF',
    intensity: 2.4,
    thickness: NEON_THICKNESS,
    glowRadius: 0.8,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    animated: true
  };

  return { ...base, ...payload };
};

export const useDesignStore = create<DesignStoreState>()(
  immer((set, get) => ({
    history: {
      past: [],
      present: defaultDesign(),
      future: []
    },
    onboardingStep: 0,
    performance: 'high',
    transformMode: 'translate',
    isTransforming: false,
    loading: false,
    error: undefined,
    setTableSize: (sizeId) =>
      set((state) => {
        const currentSizeId = resolveTableSizeId(state.history.present.tableSizeId);

        if (currentSizeId === sizeId) {
          return;
        }

        const currentProfile = getTableProfile(currentSizeId);
        const nextProfile = getTableProfile(sizeId);
        const currentHeights = getTableHeights(currentProfile);
        const nextHeights = getTableHeights(nextProfile);
        const deltaY = nextHeights.neonSurfaceY - currentHeights.neonSurfaceY;

        const nextShapes = state.history.present.shapes.map((shape) => {
          const adjusted: NeonShape = {
            ...shape,
            position: [shape.position[0], shape.position[1] + deltaY, 0] as Vector3Tuple
          };
          return sanitizeShape(adjusted, sizeId);
        });

        const next: DesignStateData = {
          ...state.history.present,
          shapes: nextShapes,
          tableSizeId: sizeId
        };

        pushHistory(state.history, next);
      }),
    addShape: (kind, payload) =>
      set((state) => {
        const shape = createShape(kind, payload);
        const activeSizeId = resolveTableSizeId(state.history.present.tableSizeId);
        const profile = getTableProfile(activeSizeId);
        const heights = getTableHeights(profile);
        const nextIndex = state.history.present.shapes.length;
        const stackedYOffset = Math.min(nextIndex * STACK_SPACING, LIMIT_Y);
        const rawPosition: Vector3Tuple = [shape.position[0], heights.neonSurfaceY + stackedYOffset, 0];
        const positionedShape = sanitizeShape(
          {
            ...shape,
            position: rawPosition
          },
          activeSizeId
        );
        const next: DesignStateData = {
          ...state.history.present,
          shapes: [...state.history.present.shapes, positionedShape],
          selectedId: shape.id
        };
        pushHistory(state.history, next);
      }),
    updateShape: (id, patch) =>
      set((state) => {
        const activeSizeId = resolveTableSizeId(state.history.present.tableSizeId);
        const nextShapes = state.history.present.shapes.map((shape) => {
          if (shape.id !== id) {
            return shape;
          }
          const { thickness: _ignoredThickness, ...restPatch } = patch;
          const patched: NeonShape = {
            ...shape,
            ...restPatch,
            thickness: NEON_THICKNESS,
            position: (restPatch.position as Vector3Tuple | undefined) ?? shape.position,
            rotation: (restPatch.rotation as Vector3Tuple | undefined) ?? shape.rotation
          };
          return sanitizeShape(patched, activeSizeId);
        });
        const next: DesignStateData = {
          ...state.history.present,
          shapes: nextShapes
        };
        pushHistory(state.history, next);
      }),
    removeShape: (id) =>
      set((state) => {
        const next: DesignStateData = {
          ...state.history.present,
          shapes: state.history.present.shapes.filter((shape) => shape.id !== id),
          selectedId:
            state.history.present.selectedId === id
              ? undefined
              : state.history.present.selectedId
        };
        pushHistory(state.history, next);
      }),
    selectShape: (id) =>
      set((state) => {
        state.history.present.selectedId = id;
      }),
    setGlassSettings: (settings) =>
      set((state) => {
        const next: DesignStateData = {
          ...state.history.present,
          glass: { ...state.history.present.glass, ...settings }
        };
        pushHistory(state.history, next);
      }),
    toggleGlass: (enabled) =>
      set((state) => {
        const next: DesignStateData = {
          ...state.history.present,
          glass: { ...state.history.present.glass, enabled }
        };
        pushHistory(state.history, next);
      }),
    setTitle: (title) =>
      set((state) => {
        const next: DesignStateData = {
          ...state.history.present,
          title
        };
        pushHistory(state.history, next);
      }),
    setPerformance: (mode) =>
      set((state) => {
        state.performance = mode;
        state.history.present.performance = mode;
      }),
    setTransformMode: (mode) =>
      set(() => ({ transformMode: mode })),
    setTransforming: (active) =>
      set(() => ({ isTransforming: active })),
    setAnimationEnabled: (enabled) =>
      set((state) => {
        const next: DesignStateData = {
          ...state.history.present,
          shapes: state.history.present.shapes.map((shape) => ({
            ...shape,
            animated: enabled
          }))
        };
        pushHistory(state.history, next);
      }),
    loadDesign: (data) =>
      set((state) => {
        const resolvedSizeId = resolveTableSizeId(data.tableSizeId);
        const profile = getTableProfile(resolvedSizeId);
        const heights = getTableHeights(profile);
        const normalized: DesignStateData = {
          ...defaultDesign(),
          ...clone(data),
          tableSizeId: resolvedSizeId,
          shapes: (data.shapes ?? []).map((shape, index) => {
            const rawPosition: Vector3Tuple = [
              shape.position?.[0] ?? 0,
              shape.position?.[1] ?? heights.neonSurfaceY + Math.min(index * STACK_SPACING, LIMIT_Y),
              0
            ];
            const rawRotation: Vector3Tuple = [
              shape.rotation?.[0] ?? 0,
              shape.rotation?.[1] ?? 0,
              shape.rotation?.[2] ?? 0
            ];
            return sanitizeShape(
              {
                ...shape,
                thickness: NEON_THICKNESS,
                position: rawPosition,
                rotation: rawRotation
              } as NeonShape,
              resolvedSizeId
            );
          })
        };
        state.performance = normalized.performance;
        state.history = {
          past: [],
          present: normalized,
          future: []
        };
      }),
    resetDesign: () =>
      set((state) => {
        state.history = {
          past: [],
          present: defaultDesign(),
          future: []
        };
      }),
    setLoading: (loading) => set(() => ({ loading })),
    setError: (message) => set(() => ({ error: message })),
    undo: () =>
      set((state) => {
        if (!state.history.past.length) return;
        const previous = state.history.past.pop()!;
        state.history.future.unshift(clone(state.history.present));
        state.history.present = previous;
      }),
    redo: () =>
      set((state) => {
        if (!state.history.future.length) return;
        const next = state.history.future.shift()!;
        state.history.past.push(clone(state.history.present));
        state.history.present = next;
      }),
    canUndo: () => get().history.past.length > 0,
    canRedo: () => get().history.future.length > 0,
    advanceOnboarding: () =>
      set((state) => {
        state.onboardingStep = Math.min(state.onboardingStep + 1, 3);
      }),
    restartOnboarding: () => set(() => ({ onboardingStep: 0 }))
  }))
);

export const selectCurrentDesign = (state: DesignStoreState) => state.history.present;
export const selectTableProfile = (state: DesignStoreState) =>
  getTableProfile(resolveTableSizeId(state.history.present.tableSizeId));
export const selectTableHeights = (state: DesignStoreState) =>
  getTableHeights(getTableProfile(resolveTableSizeId(state.history.present.tableSizeId)));
export const movementLimits = { x: LIMIT_X, y: LIMIT_Y } as const;
