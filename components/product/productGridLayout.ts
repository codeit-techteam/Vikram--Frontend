export const PRODUCT_GRID_PADDING = 16;
export const PRODUCT_GRID_GAP = 10;

export function getProductGridCardWidth(screenWidth: number): number {
  return (screenWidth - PRODUCT_GRID_PADDING * 2 - PRODUCT_GRID_GAP) / 2;
}
