import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { isDraft, original } from 'immer';
import { nanoid } from '../utils/nanoid';
import type { Vector3Tuple } from 'three';
import {
  CanonicalShapeKind,
  DesignStateData,
  GlassSettings,
  NeonShape,
  ShapeKind
} from '../types/design';
import {
  DEFAULT_TABLE_SIZE_ID,
  getTableHeights,
  getTableProfile,
  type TableSizeOption
} from '../components/three/layers/tableDimensions';
import type { TableSizeId } from '../components/three/layers/tableDimensions';

interface DesignStoreState {
  history: {
    past: DesignStateData[];
    present: DesignStateData;
    future: DesignStateData[];
  };
  shapeCounter: number;
  onboardingStep: number;
  performance: 'high' | 'eco';
  transformMode: 'translate' | 'rotate' | 'scale';
  isTransforming: boolean;
  loading: boolean;
  error?: string;
  environment: string;
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
  setEnvironment: (environment: string) => void;
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

const DEFAULT_ENVIRONMENT_HDR =
  'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/neon_photostudio_1k.hdr';

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

const KIND_ALIASES: Record<ShapeKind, CanonicalShapeKind> = {
  sharp_triangle: 'sharp_triangle',
  deep_v_shape: 'deep_v_shape',
  smooth_n_curve: 'smooth_n_curve',
  sharp_m_shape: 'sharp_m_shape',
  text: 'text',
  svg: 'svg',
  v_shape: 'sharp_triangle',
  vshape: 'sharp_triangle',
  single_peak: 'deep_v_shape',
  peak: 'deep_v_shape',
  zigzag_m: 'sharp_m_shape',
  zigzag: 'sharp_m_shape',
  line: 'sharp_triangle',
  circle: 'smooth_n_curve'
};

const LABEL_PRESETS: Record<CanonicalShapeKind, string> = {
  sharp_triangle: 'Sharp Triangle',
  deep_v_shape: 'Deep V',
  smooth_n_curve: 'Smooth N',
  sharp_m_shape: 'Sharp W',
  text: 'Neon Text',
  svg: 'Imported SVG'
};

const NEON_THICKNESS = 0.017;
const MOVEMENT_MARGIN = 0.05; // 5 cm safety padding inside the glass walls
const MIN_BOUND = 0.05;
const VERTICAL_RANGE_RATIO = 0.5;

const resolveTableSizeId = (sizeId?: TableSizeId): TableSizeId => sizeId ?? DEFAULT_TABLE_SIZE_ID;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

type MovementLimits = {
  x: number;
  y: number;
  z: number;
};

const calculateMovementLimits = (profile: TableSizeOption): MovementLimits => {
  const halfWidth = profile.width / 2;
  const halfDepth = profile.depth / 2;
  const baseLimitX = halfWidth - MOVEMENT_MARGIN;
  const baseLimitZ = halfDepth - MOVEMENT_MARGIN;
  const horizontalLimit = Math.max(MIN_BOUND, baseLimitX);
  const depthLimit = Math.max(MIN_BOUND, baseLimitZ);

  const heights = getTableHeights(profile);
  const verticalFromTable = Math.max(MIN_BOUND, profile.height * VERTICAL_RANGE_RATIO);
  const glassHeadroom = Math.max(MIN_BOUND, heights.glassHeight - profile.neonLift);

  return {
    x: horizontalLimit,
    y: Math.min(verticalFromTable, glassHeadroom),
    z: depthLimit
  } as const;
};

const constrainPosition = (position: Vector3Tuple, tableSizeId: TableSizeId): Vector3Tuple => {
  const profile = getTableProfile(tableSizeId);
  const heights = getTableHeights(profile);
  const limits = calculateMovementLimits(profile);
  const minY = heights.neonSurfaceY;
  const currentZ = position[2] ?? 0;

  return [
    clamp(position[0], -limits.x, limits.x),
    minY,
    clamp(currentZ, -limits.z, limits.z)
  ] as Vector3Tuple;
};

const constrainRotation = (rotation: Vector3Tuple): Vector3Tuple => [Math.PI, rotation[1], 0];

const sanitizeShape = (shape: NeonShape, tableSizeId: TableSizeId): NeonShape => {
  const canonicalKind = normalizeKind(shape.kind);
  const fallbackLabel = shape.label ?? shape.name ?? LABEL_PRESETS[canonicalKind];
  const fallbackName = shape.name ?? fallbackLabel;
  const sourcePosition = (shape.position ?? [0, 0, 0]) as Vector3Tuple;
  const sourceRotation = (shape.rotation ?? [Math.PI, 0, 0]) as Vector3Tuple;
  const clampedPosition = constrainPosition(sourcePosition, tableSizeId);
  const constrainedRotation = constrainRotation(sourceRotation);

  return {
    ...shape,
    kind: canonicalKind,
    label: fallbackLabel,
    name: fallbackName,
    thickness: NEON_THICKNESS,
    position: clampedPosition,
    rotation: constrainedRotation,
    glowRadius: 1,
    intensity: 1,
    scale: (shape.scale ?? [1, 1, 1]) as Vector3Tuple,
    animated: shape.animated ?? true
  };
};

const normalizeKind = (kind: ShapeKind): CanonicalShapeKind => KIND_ALIASES[kind] ?? 'sharp_triangle';

const extractShapeCounter = (value?: string): number => {
  if (!value) {
    return Number.NaN;
  }
  const match = value.match(/Şekil\s*#(\d+)/i);
  if (!match) {
    return Number.NaN;
  }
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const deriveNextShapeCounter = (shapes: NeonShape[]): number => {
  let maxCounter = 0;
  shapes.forEach((shape, index) => {
    const candidates = [extractShapeCounter(shape.name), extractShapeCounter(shape.label)];
    const valid = candidates.find((value) => Number.isFinite(value));
    const numericValue = typeof valid === 'number' && Number.isFinite(valid) ? valid : index + 1;
    if (numericValue > maxCounter) {
      maxCounter = numericValue;
    }
  });
  return maxCounter + 1;
};

const createShape = (kind: ShapeKind, payload?: Partial<NeonShape>): NeonShape => {
  const canonicalKind = normalizeKind(kind);
  const baseLabel = LABEL_PRESETS[canonicalKind];
  const base: NeonShape = {
    id: nanoid(),
    kind: canonicalKind,
    label: baseLabel,
    name: baseLabel,
    color: '#52B9FF',
    intensity: 1,
    thickness: NEON_THICKNESS,
    glowRadius: 1,
    position: [0, 0, 0],
    rotation: [Math.PI, 0, 0],
    scale: [1, 1, 1],
    animated: true
  };

  const { kind: _ignoredKind, ...restPayload } = payload ?? {};
  const merged = { ...base, ...restPayload } as NeonShape;
  const finalLabel = (payload?.label ?? merged.label ?? baseLabel) as string;
  const finalName = (payload?.name ?? merged.name ?? finalLabel) as string;

  return {
    ...merged,
    label: finalLabel,
    name: finalName
  };
};

export const useDesignStore = create<DesignStoreState>()(
  immer((set, get) => ({
    history: {
      past: [],
      present: defaultDesign(),
      future: []
    },
    shapeCounter: 1,
    onboardingStep: 0,
    performance: 'high',
    transformMode: 'translate',
    isTransforming: false,
    loading: false,
    error: undefined,
    environment: DEFAULT_ENVIRONMENT_HDR,
    setTableSize: (sizeId) =>
      set((state) => {
        const currentSizeId = resolveTableSizeId(state.history.present.tableSizeId);

        if (currentSizeId === sizeId) {
          return;
        }

        const nextShapes = state.history.present.shapes.map((shape) =>
          sanitizeShape(shape, sizeId)
        );

        const next: DesignStateData = {
          ...state.history.present,
          shapes: nextShapes,
          tableSizeId: sizeId
        };

        pushHistory(state.history, next);
      }),
    addShape: (kind, payload) =>
      set((state) => {
        const shapeLabel = `Şekil #${state.shapeCounter}`;
        state.shapeCounter += 1;
        const shapePayload: Partial<NeonShape> = { ...(payload ?? {}), label: shapeLabel, name: shapeLabel };
        const shape = createShape(kind, shapePayload);
        const activeSizeId = resolveTableSizeId(state.history.present.tableSizeId);
        const profile = getTableProfile(activeSizeId);
        const heights = getTableHeights(profile);
        const rawPosition: Vector3Tuple = [shape.position[0], heights.neonSurfaceY, shape.position[2] ?? 0];
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
    setEnvironment: (environment) =>
      set((state) => {
        state.environment = environment;
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
          shapes: (data.shapes ?? []).map((shape) => {
            const rawPosition: Vector3Tuple = [
              shape.position?.[0] ?? 0,
              heights.neonSurfaceY,
              shape.position?.[2] ?? 0
            ];
            const rawRotation: Vector3Tuple = [
              shape.rotation?.[0] ?? 0,
              shape.rotation?.[1] ?? 0,
              shape.rotation?.[2] ?? 0
            ];
            const canonicalKind = normalizeKind((shape.kind ?? 'sharp_triangle') as ShapeKind);
            return sanitizeShape(
              {
                ...shape,
                kind: canonicalKind,
                thickness: NEON_THICKNESS,
                position: rawPosition,
                rotation: rawRotation
              } as NeonShape,
              resolvedSizeId
            );
          })
        };
        state.performance = normalized.performance;
        state.shapeCounter = deriveNextShapeCounter(normalized.shapes);
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
        state.shapeCounter = 1;
        state.environment = DEFAULT_ENVIRONMENT_HDR;
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
export const selectMovementLimits = (state: DesignStoreState) =>
  calculateMovementLimits(getTableProfile(resolveTableSizeId(state.history.present.tableSizeId)));

export { calculateMovementLimits as getMovementLimits };
