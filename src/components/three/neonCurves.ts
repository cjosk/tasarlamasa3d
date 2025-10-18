import { CatmullRomCurve3, Vector3 } from 'three';
import type { CanonicalShapeKind } from '../../types/design';

export interface NeonCurveDefinition {
  curve: CatmullRomCurve3;
  tubularSegments: number;
}

const HEIGHT = 0.36; // 36 cm expressed in meters

const offsetPoints = (points: Vector3[]) => {
  const offset = HEIGHT / 2;
  points.forEach((point) => {
    point.y -= offset;
  });
  return points;
};

export const createNeonCurve = (kind: CanonicalShapeKind): NeonCurveDefinition | undefined => {
  switch (kind) {
    case 'sharp_triangle': {
      const width = 0.27;
      const points = offsetPoints([
        new Vector3(-width / 2, -HEIGHT / 2, 0),
        new Vector3(0, HEIGHT / 2, 0),
        new Vector3(width / 2, -HEIGHT / 2, 0)
      ]);
      return { curve: new CatmullRomCurve3(points, false, 'chordal'), tubularSegments: 64 };
    }
    case 'deep_v_shape': {
      const width = 0.3;
      const points = offsetPoints([
        new Vector3(-width / 2, HEIGHT / 2, 0),
        new Vector3(0, -HEIGHT / 2, 0),
        new Vector3(width / 2, HEIGHT / 3, 0)
      ]);
      return { curve: new CatmullRomCurve3(points, false, 'chordal'), tubularSegments: 64 };
    }
    case 'smooth_n_curve': {
      const width = 0.47;
      const points = offsetPoints([
        new Vector3(-width / 2, -HEIGHT / 4, 0),
        new Vector3(-width / 4, HEIGHT / 2, 0),
        new Vector3(width / 4, -HEIGHT / 2, 0),
        new Vector3(width / 2, HEIGHT / 4, 0)
      ]);
      return { curve: new CatmullRomCurve3(points, false, 'chordal'), tubularSegments: 64 };
    }
    case 'sharp_m_shape': {
      const width = 0.66;
      const points = offsetPoints([
        new Vector3(-width / 2, HEIGHT / 2, 0),
        new Vector3(-width / 4, -HEIGHT / 2, 0),
        new Vector3(0, HEIGHT / 2, 0),
        new Vector3(width / 4, -HEIGHT / 2, 0),
        new Vector3(width / 2, HEIGHT / 2, 0)
      ]);
      return { curve: new CatmullRomCurve3(points, false, 'chordal'), tubularSegments: 64 };
    }
    default:
      return undefined;
  }
};
