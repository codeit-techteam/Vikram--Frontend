export const PRODUCT_GRID_PADDING = 16;
export const PRODUCT_GRID_GAP = 10;

/** Tighter gutters when the grid shares the screen with a category sidebar. */
export const PRODUCT_GRID_PADDING_COMPACT = 10;

export function getProductGridCardWidth(
  availableWidth: number,
  padding: number = PRODUCT_GRID_PADDING,
): number {
  return (availableWidth - padding * 2 - PRODUCT_GRID_GAP) / 2;
}
