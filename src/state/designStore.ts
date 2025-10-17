import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from '../utils/nanoid';
import { DesignStateData, GlassSettings, NeonShape, ShapeKind } from '../types/design';

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
  performance: 'high'
});

const clone = <T,>(value: T): T => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
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
    addShape: (kind, payload) =>
      set((state) => {
        const shape = createShape(kind, payload);
        const next: DesignStateData = {
          ...state.history.present,
          shapes: [...state.history.present.shapes, shape],
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
        state.history = {
          past: [],
          present: clone(data),
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
