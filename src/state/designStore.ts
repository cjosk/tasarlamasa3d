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

const createShape = (kind: ShapeKind, payload?: Partial<NeonShape>): NeonShape => {
  const base: NeonShape = {
    id: nanoid(),
    kind,
    label: `${kind.toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
    color: '#22d3ee',
    intensity: 2.4,
    thickness: 0.2,
    glowRadius: 0.8,
    position: [0, 0.02, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    animated: true
  };

  if (kind === 'circle') {
    base.scale = [1.5, 1.5, 1.5];
  }

  if (kind === 'line') {
    base.scale = [2, 1, 1];
  }

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
    loading: false,
    error: undefined,
    setTableSize: (sizeId) =>
      set((state) => {
        if (state.history.present.tableSizeId === sizeId) {
          return;
        }
        const currentProfile = getTableProfile(state.history.present.tableSizeId);
        const nextProfile = getTableProfile(sizeId);
        const currentHeights = getTableHeights(currentProfile);
        const nextHeights = getTableHeights(nextProfile);
        const deltaY = nextHeights.neonSurfaceY - currentHeights.neonSurfaceY;

        const nextShapes = state.history.present.shapes.map((shape) => ({
          ...shape,
          position: [
            shape.position[0],
            shape.position[1] + deltaY,
            shape.position[2]
          ] as Vector3Tuple
        }));

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
        const profile = getTableProfile(state.history.present.tableSizeId);
        const heights = getTableHeights(profile);
        const positionedShape: NeonShape = {
          ...shape,
          position: [shape.position[0], heights.neonSurfaceY, shape.position[2]] as Vector3Tuple
        };
        const next: DesignStateData = {
          ...state.history.present,
          shapes: [...state.history.present.shapes, positionedShape],
          selectedId: shape.id
        };
        pushHistory(state.history, next);
      }),
    updateShape: (id, patch) =>
      set((state) => {
        const nextShapes = state.history.present.shapes.map((shape) =>
          shape.id === id ? { ...shape, ...patch } : shape
        );
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
        const profile = getTableProfile(data.tableSizeId);
        const heights = getTableHeights(profile);
        const normalized: DesignStateData = {
          ...defaultDesign(),
          ...clone(data),
          tableSizeId: data.tableSizeId ?? DEFAULT_TABLE_SIZE_ID,
          shapes: (data.shapes ?? []).map((shape) => ({
            ...shape,
            position: [
              shape.position?.[0] ?? 0,
              shape.position?.[1] ?? heights.neonSurfaceY,
              shape.position?.[2] ?? 0
            ] as Vector3Tuple
          }))
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
  getTableProfile(state.history.present.tableSizeId);
export const selectTableHeights = (state: DesignStoreState) =>
  getTableHeights(getTableProfile(state.history.present.tableSizeId));
