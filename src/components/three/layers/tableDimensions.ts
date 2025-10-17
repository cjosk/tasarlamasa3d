export const TABLE_DIMENSIONS = {
  width: 3.2,
  depth: 1.8,
  baseThickness: 0.12,
  innerSurfaceThickness: 0.012,
  frameInset: 0.06,
  legHeight: 0.42,
  legRadius: 0.08,
  legInset: 0.18,
  glassWallThickness: 0.035
} as const;

export const TABLE_BASE_BOTTOM_Y = -TABLE_DIMENSIONS.baseThickness;
export const TABLE_GROUND_Y = TABLE_BASE_BOTTOM_Y - TABLE_DIMENSIONS.legHeight;
