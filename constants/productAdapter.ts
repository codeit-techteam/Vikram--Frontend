import type { ImageSourcePropType } from 'react-native';

import { images } from '@constants/images';
import { ALL_PRODUCTS, type CatalogProduct, type CatalogVariant } from '@constants/products';
import type { Product, ProductCategoryType, ProductStatus, ProductVariant } from '@/types/catalog';

const CATEGORY_TYPE_MAP: Record<string, ProductCategoryType> = {
  cement: 'cement',
  sand: 'sand',
  bricks: 'bricks',
  aggregates: 'aggregates',
  adhesives: 'adhesives',
  wall_repair: 'wall-repair',
  putty: 'putty',
};

const CATEGORY_ROUTE_MAP: Record<string, string> = {
  cement: 'cement',
  sand: 'sand',
  bricks: 'bricks',
  aggregates: 'aggregates',
  adhesives: 'adhesives',
  wall_repair: 'wall-repair',
  putty: 'putty',
};

const IMAGE_BY_QUERY: Record<string, ImageSourcePropType> = {
  'cement bag construction': images.productUltratechBags,
  'dust sand construction': images.productDust,
  'river sand construction': images.productRiverSand,
  'red bricks construction': images.productRedBricks,
  'grey flash cement bricks construction': images.productGreyFlashCementBricks,
  'jeera rodi aggregate construction': images.productJeeraRodi,
  'fevicol marine adhesive': images.productFevicolMarine,
  'fevicol sh adhesive': images.productFevicolSh,
  'fevicol heatx adhesive': images.productFevicolHeatx,
  'fevicol speedx adhesive': images.productFevicolSpeedx,
  'jivantor adhesive': images.productJivantor,
  'jk wall putty': images.productJkWallPutty,
  'birla wall putty': images.productBirlaPutty,
  'sakarni pop': images.productSakarniPop,
  'white cement construction': images.productWhiteCement,
  'asian paints acrylic putty': images.productAsianPaintsAcrylicPutty,
};

function toProductVariant(v: CatalogVariant): ProductVariant {
  return {
    id: v.id,
    label: v.label,
    displayUnit: v.displayUnit,
    count: v.count,
    quantity: v.quantity,
    size: v.weight ?? v.volume,
    sizeUnit: v.displayUnit ?? (v.weight !== undefined ? 'Bag' : v.volume !== undefined ? 'L' : undefined),
    price: v.price,
    bulkPrice: v.bulkPrice ?? null,
    inStock: true,
  };
}

function variantSummary(product: CatalogProduct): string {
  if (!product.variants?.length) return product.unitLabel ?? product.unit;
  const labels = product.variants.map((v) => v.label);
  if (labels.length <= 3) return labels.join(' · ');
  return `${labels.slice(0, 2).join(' · ')} · +${labels.length - 2} more`;
}

function adaptCatalogProduct(def: CatalogProduct): Product {
  const categoryType = CATEGORY_TYPE_MAP[def.category] ?? 'cement';
  const productVariants = def.variants?.map(toProductVariant);
  const defaultVariant =
    productVariants?.find((v) => v.id === def.defaultVariantId) ?? productVariants?.[0];
  const retailPriceValue = def.hasVariants
    ? (defaultVariant?.price ?? 0)
    : (def.retailPrice ?? 0);
  const bulkPriceValue = def.bulkPrice ?? 0;
  const bulkThreshold = def.bulkThreshold ?? 0;
  const unit = def.unitLabel ?? def.unit;
  const status = (def.status as ProductStatus) ?? 'IN STOCK';

  return {
    id: def.id,
    badge: def.badge ?? '⚡ 90 min ETA',
    badgeColor: '#FEB623',
    image: IMAGE_BY_QUERY[def.imageQuery],
    imageSearch: def.imageQuery,
    category: def.categoryLabel.toUpperCase(),
    brand: def.brand,
    name: def.name,
    detailName: def.name,
    grade: def.specs.GRADE ?? 'Standard',
    status,
    spec: variantSummary(def),
    variants: productVariants?.map((v) => v.label),
    hasVariants: def.hasVariants,
    productVariants,
    defaultVariantId: def.defaultVariantId ?? productVariants?.[0]?.id,
    perPiecePrice: def.perPiecePrice,
    retailPrice: `₹${retailPriceValue.toLocaleString('en-IN')} / ${defaultVariant?.displayUnit ?? defaultVariant?.label ?? unit}`,
    retailPriceValue,
    bulkLabel: bulkThreshold > 0 ? `Bulk (${bulkThreshold}+)` : 'Bulk Discount',
    bulkPrice: `₹${bulkPriceValue.toLocaleString('en-IN')}`,
    bulkPriceValue,
    unit: def.unit,
    defaultQuantity: 1,
    minOrder: def.minOrder ?? 1,
    maxOrder: def.maxOrder,
    incrementStep: def.stepSize ?? 1,
    bulkThreshold,
    description: def.description,
    categoryType,
  };
}

const ADAPTED_PRODUCTS = ALL_PRODUCTS.map(adaptCatalogProduct);

export function getExcelCatalogProducts(): Product[] {
  return ADAPTED_PRODUCTS;
}

export function getExcelProductsByCategory(categoryId: string): Product[] {
  return ALL_PRODUCTS.filter(
    (def) => (CATEGORY_ROUTE_MAP[def.category] ?? def.category) === categoryId,
  ).map(adaptCatalogProduct);
}

export function getExcelProductById(id: string): Product | undefined {
  const def = ALL_PRODUCTS.find((p) => p.id === id);
  return def ? adaptCatalogProduct(def) : undefined;
}

export { ADAPTED_PRODUCTS };
