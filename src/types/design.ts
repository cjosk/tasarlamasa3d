import type { Vector3Tuple } from 'three';
import type { TableSizeId } from '../components/three/layers/tableDimensions';

export type CanonicalShapeKind = 'v_shape' | 'single_peak' | 'zigzag_m' | 'text' | 'svg';

export type ShapeKind =
  | CanonicalShapeKind
  | 'line'
  | 'circle'
  | 'vshape'
  | 'peak'
  | 'zigzag';

export interface NeonShape {
  id: string;
  kind: CanonicalShapeKind;
  label: string;
  color: string;
  intensity: number;
  thickness: number;
  glowRadius: number;
  text?: string;
  svgPath?: string;
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
  animated: boolean;
}

export interface GlassSettings {
  enabled: boolean;
  opacity: number;
  tint: string;
  roughness: number;
  thickness: number;
}

export interface CameraSettings {
  polar: [number, number];
  azimuth: [number, number];
}

export interface DesignStateData {
  id?: string;
  title: string;
  description?: string;
  shapes: NeonShape[];
  selectedId?: string;
  glass: GlassSettings;
  performance: 'high' | 'eco';
  tableSizeId?: TableSizeId;
  createdAt?: string;
  updatedAt?: string;
}

export interface HistoryState {
  past: DesignStateData[];
  present: DesignStateData;
  future: DesignStateData[];
}
