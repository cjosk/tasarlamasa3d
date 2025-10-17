export type TableSizeId = '70x45x50' | '90x45x50' | '120x80x50' | '150x80x50';

export interface TableSizeOption {
  id: TableSizeId;
  label: string;
  dimensionsCm: [number, number, number]; // [width, depth, height]
  width: number; // meters
  depth: number; // meters
  height: number; // meters
  baseThickness: number; // meters
  innerSurfaceThickness: number; // meters
  frameInset: number; // meters
  glassWallThickness: number; // meters
  neonLift: number; // meters offset to float shapes above the mirror
}

const cmToM = (value: number) => value / 100;

const BASE_PROFILE = {
  baseThickness: cmToM(6),
  innerSurfaceThickness: cmToM(1),
  frameInset: cmToM(4),
  glassWallThickness: cmToM(1.5),
  neonLift: cmToM(0.4)
};

export const TABLE_SIZE_OPTIONS: TableSizeOption[] = [
  {
    id: '70x45x50',
    label: '70 × 45 × 50 cm',
    dimensionsCm: [70, 45, 50],
    width: cmToM(70),
    depth: cmToM(45),
    height: cmToM(50),
    ...BASE_PROFILE
  },
  {
    id: '90x45x50',
    label: '90 × 45 × 50 cm',
    dimensionsCm: [90, 45, 50],
    width: cmToM(90),
    depth: cmToM(45),
    height: cmToM(50),
    ...BASE_PROFILE
  },
  {
    id: '120x80x50',
    label: '120 × 80 × 50 cm',
    dimensionsCm: [120, 80, 50],
    width: cmToM(120),
    depth: cmToM(80),
    height: cmToM(50),
    ...BASE_PROFILE
  },
  {
    id: '150x80x50',
    label: '150 × 80 × 50 cm',
    dimensionsCm: [150, 80, 50],
    width: cmToM(150),
    depth: cmToM(80),
    height: cmToM(50),
    ...BASE_PROFILE
  }
];

export const DEFAULT_TABLE_SIZE_ID: TableSizeId = '90x45x50';

export const getTableProfile = (sizeId?: TableSizeId): TableSizeOption => {
  const fallback = TABLE_SIZE_OPTIONS.find((option) => option.id === DEFAULT_TABLE_SIZE_ID)!;
  if (!sizeId) {
    return fallback;
  }
  return TABLE_SIZE_OPTIONS.find((option) => option.id === sizeId) ?? fallback;
};

export const getTableHeights = (profile: TableSizeOption) => {
  const groundY = 0;
  const baseBottomY = groundY;
  const baseTopY = baseBottomY + profile.baseThickness;
  const mirrorCenterY = baseTopY + profile.innerSurfaceThickness / 2;
  const neonSurfaceY = baseTopY + profile.innerSurfaceThickness + profile.neonLift;
  const glassBaseY = baseTopY;
  const glassHeight = Math.max(profile.height - profile.baseThickness, cmToM(30));

  return {
    groundY,
    baseBottomY,
    baseTopY,
    mirrorCenterY,
    neonSurfaceY,
    glassBaseY,
    glassHeight
  } as const;
};

