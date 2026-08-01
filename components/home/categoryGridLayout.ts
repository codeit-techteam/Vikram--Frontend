/** Shared layout tokens for marketplace category grids (Home + Catalog). */
export const CATEGORY_GRID_PADDING = 16;
/** Horizontal gap between cards */
export const CATEGORY_GRID_GAP_H = 12;
/** Vertical gap between rows */
export const CATEGORY_GRID_GAP_V = 16;
/** @deprecated use CATEGORY_GRID_GAP_H — kept for skeleton/compat imports */
export const CATEGORY_GRID_GAP = CATEGORY_GRID_GAP_H;

/**
 * Responsive column count for Material Categories.
 * Small phones: 2 · medium: 3 · large phones/tablets: 4
 */
export function getCategoryGridColumns(screenWidth: number): number {
  if (screenWidth >= 700) return 4;
  if (screenWidth >= 400) return 3;
  return 2;
}

export function getCategoryGridCardWidth(
  screenWidth: number,
  columns = getCategoryGridColumns(screenWidth),
): number {
  const totalGaps = CATEGORY_GRID_GAP_H * (columns - 1);
  return (screenWidth - CATEGORY_GRID_PADDING * 2 - totalGaps) / columns;
}
