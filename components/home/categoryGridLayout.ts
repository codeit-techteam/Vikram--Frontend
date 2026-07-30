/** Shared layout tokens for the Home Material Categories grid. */
export const CATEGORY_GRID_PADDING = 16;
export const CATEGORY_GRID_GAP = 10;

/**
 * Responsive column count for Material Categories.
 * Phones: 4 · very small: 3 · tablets: 5–6
 */
export function getCategoryGridColumns(screenWidth: number): number {
  if (screenWidth >= 900) return 6;
  if (screenWidth >= 700) return 5;
  if (screenWidth < 360) return 3;
  return 4;
}

export function getCategoryGridCardWidth(
  screenWidth: number,
  columns = getCategoryGridColumns(screenWidth),
): number {
  const totalGaps = CATEGORY_GRID_GAP * (columns - 1);
  return (screenWidth - CATEGORY_GRID_PADDING * 2 - totalGaps) / columns;
}
