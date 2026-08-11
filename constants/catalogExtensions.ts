import type { ImageSourcePropType } from 'react-native';

import { images } from '@constants/images';
import { getExcelProductsByCategory } from '@constants/productAdapter';
import type { Product } from '@/types/catalog';
import { CONTACT_FOR_SIZE } from '@constants/catalogVariantHelpers';
import type { SearchProduct } from '@constants/searchData';

type ExtensionProductInput = Partial<Product> &
  Pick<
    Product,
    | 'id'
    | 'name'
    | 'category'
    | 'categoryType'
    | 'imageSearch'
    | 'unit'
    | 'retailPriceValue'
    | 'bulkPriceValue'
    | 'bulkThreshold'
    | 'description'
  >;

function createExtensionProduct(input: ExtensionProductInput): Product {
  const {
    badge = '⚡ 90 min ETA',
    badgeColor = '#FEB623',
    grade = 'Standard',
    status = 'IN STOCK',
    spec = 'Select variant',
    defaultQuantity = 1,
    bulkLabel = 'Bulk Discount',
    minOrder,
    incrementStep,
    ...rest
  } = input;

  return {
    badge,
    badgeColor,
    grade,
    status,
    spec,
    defaultQuantity,
    bulkLabel,
    retailPrice: `₹${input.retailPriceValue.toLocaleString('en-IN')} / ${input.unit}`,
    bulkPrice: `₹${input.bulkPriceValue.toLocaleString('en-IN')}`,
    minOrder,
    incrementStep,
    ...rest,
  };
}

const extraAdhesivesExtensions: Product[] = [
  createExtensionProduct({
    id: 'ext-ad-probond',
    brand: 'Fevicol',
    image: images.productFevicolProBond,
    imageSearch: 'fevicol pro bond adhesive',
    category: 'ADHESIVES',
    name: 'Fevicol Pro Bond',
    detailName: 'Fevicol Pro Bond',
    unit: 'Unit',
    retailPriceValue: 220,
    bulkPriceValue: 200,
    bulkThreshold: 10,
    categoryType: 'adhesives',
    variantsPlaceholder: CONTACT_FOR_SIZE,
    description: 'Professional-grade adhesive for high-strength bonding in construction and interiors.',
  }),
  createExtensionProduct({
    id: 'ext-ad-sr998',
    brand: 'Fevicol',
    image: images.productFevicolSr998,
    imageSearch: 'fevicol sr998 adhesive',
    category: 'ADHESIVES',
    name: 'Fevicol SR998',
    detailName: 'Fevicol SR998',
    unit: 'Unit',
    retailPriceValue: 250,
    bulkPriceValue: 230,
    bulkThreshold: 10,
    categoryType: 'adhesives',
    variantsPlaceholder: CONTACT_FOR_SIZE,
    description: 'Synthetic rubber adhesive for footwear, leather, and rubber bonding applications.',
  }),
];

const quickRepairExtensions: Product[] = [
  createExtensionProduct({
    id: 'ext-qr-polyfix',
    brand: 'Polyfix',
    image: images.productPolyfix,
    imageSearch: 'polyfix instant glue',
    category: 'QUICK REPAIR',
    name: 'Polyfix',
    detailName: 'Polyfix',
    unit: 'Unit',
    retailPriceValue: 120,
    bulkPriceValue: 110,
    bulkThreshold: 10,
    categoryType: 'quick-repair',
    variantsPlaceholder: CONTACT_FOR_SIZE,
    description: 'Quick-fix adhesive for instant bonding and small repair jobs on site.',
  }),
  createExtensionProduct({
    id: 'ext-qr-araldite',
    brand: 'Araldite',
    image: images.productAraldite,
    imageSearch: 'araldite epoxy',
    category: 'QUICK REPAIR',
    name: 'Araldite',
    detailName: 'Araldite',
    unit: 'Unit',
    retailPriceValue: 150,
    bulkPriceValue: 135,
    bulkThreshold: 10,
    categoryType: 'quick-repair',
    variantsPlaceholder: CONTACT_FOR_SIZE,
    description: 'Two-part epoxy adhesive for strong, durable repairs on metal, wood, and plastic.',
  }),
  createExtensionProduct({
    id: 'ext-qr-fevikwik',
    brand: 'FeviKwik',
    image: images.productFevikwik,
    imageSearch: 'fevikwik instant adhesive',
    category: 'QUICK REPAIR',
    name: 'FeviKwik',
    detailName: 'FeviKwik',
    unit: 'Unit',
    retailPriceValue: 45,
    bulkPriceValue: 40,
    bulkThreshold: 20,
    categoryType: 'quick-repair',
    variantsPlaceholder: CONTACT_FOR_SIZE,
    description: 'Instant cyanoacrylate adhesive for fast fixes on broken items and small parts.',
  }),
];

const waterproofingExtensions: Product[] = [
  createExtensionProduct({
    id: 'ext-wp-301',
    brand: 'Dr Fixit',
    image: images.productDrFixit301,
    imageSearch: 'dr fixit 301 pidicrete urp',
    category: 'WATERPROOFING',
    name: 'Dr Fixit 301 Pidicrete URP',
    detailName: 'Dr Fixit 301 Pidicrete URP',
    unit: 'Unit',
    retailPriceValue: 850,
    bulkPriceValue: 780,
    bulkThreshold: 5,
    categoryType: 'waterproofing',
    variantsPlaceholder: CONTACT_FOR_SIZE,
    description: 'Polymer-modified waterproofing compound for concrete and masonry structures.',
  }),
  createExtensionProduct({
    id: 'ext-wp-302',
    brand: 'Dr Fixit',
    image: images.productDrFixit302,
    imageSearch: 'dr fixit 302 super latex',
    category: 'WATERPROOFING',
    name: 'Dr Fixit 302 Super Latex',
    detailName: 'Dr Fixit 302 Super Latex',
    unit: 'Unit',
    retailPriceValue: 920,
    bulkPriceValue: 850,
    bulkThreshold: 5,
    categoryType: 'waterproofing',
    variantsPlaceholder: CONTACT_FOR_SIZE,
    description: 'High-performance latex additive for waterproof plaster and mortar applications.',
  }),
  createExtensionProduct({
    id: 'ext-wp-sure',
    brand: 'Dr Fixit',
    image: images.productDrFixitSureSeal,
    imageSearch: 'dr fixit sure seal',
    category: 'WATERPROOFING',
    name: 'Dr Fixit Sure Seal',
    detailName: 'Dr Fixit Sure Seal',
    unit: 'Unit',
    retailPriceValue: 780,
    bulkPriceValue: 720,
    bulkThreshold: 5,
    categoryType: 'waterproofing',
    variantsPlaceholder: CONTACT_FOR_SIZE,
    description: 'Elastomeric waterproof coating for terraces, bathrooms, and external walls.',
  }),
  createExtensionProduct({
    id: 'ext-wp-all',
    brand: 'Dr Fixit',
    image: images.productDrFixitAllSeal,
    imageSearch: 'dr fixit all seal',
    category: 'WATERPROOFING',
    name: 'Dr Fixit All Seal',
    detailName: 'Dr Fixit All Seal',
    unit: 'Unit',
    retailPriceValue: 690,
    bulkPriceValue: 640,
    bulkThreshold: 5,
    categoryType: 'waterproofing',
    variantsPlaceholder: CONTACT_FOR_SIZE,
    description: 'Multi-surface waterproof sealant for joints, cracks, and porous substrates.',
  }),
  createExtensionProduct({
    id: 'ext-wp-101',
    brand: 'Dr Fixit',
    image: images.productDrFixit101Lw,
    imageSearch: 'dr fixit 101 lw plus',
    category: 'WATERPROOFING',
    name: 'Dr Fixit 101 LW+',
    detailName: 'Dr Fixit 101 LW+',
    unit: 'Unit',
    retailPriceValue: 560,
    bulkPriceValue: 520,
    bulkThreshold: 5,
    categoryType: 'waterproofing',
    variantsPlaceholder: CONTACT_FOR_SIZE,
    description: 'Integral waterproofing liquid for concrete during mixing for lasting protection.',
  }),
  createExtensionProduct({
    id: 'ext-wp-202',
    brand: 'Dr Fixit',
    image: images.productDrFixit202Crackx,
    imageSearch: 'dr fixit 202 crack-x powder',
    category: 'WATERPROOFING',
    name: 'Dr Fixit 202 Crack-X Powder',
    detailName: 'Dr Fixit 202 Crack-X Powder',
    unit: 'Unit',
    retailPriceValue: 480,
    bulkPriceValue: 440,
    bulkThreshold: 5,
    categoryType: 'waterproofing',
    variantsPlaceholder: CONTACT_FOR_SIZE,
    description: 'Crack-filling powder for structural and non-structural wall and floor repairs.',
  }),
];

export const PRODUCT_IMAGE_OVERRIDES: Record<string, ImageSourcePropType> = {
  s1: images.productTataTiscon500d,
  sc2: images.product40mmCrushedStone,
};

export const EXTENSION_PRODUCTS_BY_CATEGORY: Record<string, Product[]> = {
  sand: getExcelProductsByCategory('sand'),
  bricks: getExcelProductsByCategory('bricks'),
  cement: getExcelProductsByCategory('cement'),
  aggregates: getExcelProductsByCategory('aggregates'),
  adhesives: [...getExcelProductsByCategory('adhesives'), ...extraAdhesivesExtensions],
  'wall-repair': getExcelProductsByCategory('wall-repair'),
  putty: getExcelProductsByCategory('putty'),
  'quick-repair': quickRepairExtensions,
  waterproofing: waterproofingExtensions,
};

const SEARCH_CATEGORY_MAP: Record<string, SearchProduct['category']> = {
  cement: 'cement',
  rmc: 'rmc',
  steel: 'rmc',
  sand: 'sand',
  bricks: 'bricks',
  stone: 'stone',
  aggregates: 'stone',
  adhesives: 'cement',
  'wall-repair': 'cement',
  waterproofing: 'cement',
  'quick-repair': 'cement',
  putty: 'cement',
};

export function getExtensionSearchProducts(): SearchProduct[] {
  return Object.values(EXTENSION_PRODUCTS_BY_CATEGORY)
    .flat()
    .map((product) => ({
      id: product.id,
      category: SEARCH_CATEGORY_MAP[product.categoryType],
      badge: null,
      name: product.detailName ?? product.name,
      brand: product.brand ?? 'Bajriwala',
      price: product.retailPriceValue,
      unit: product.unit,
      image: product.imageSearch,
    }));
}

export function mergeCategoryProducts(base: Product[], categoryId: string): Product[] {
  const extensions = EXTENSION_PRODUCTS_BY_CATEGORY[categoryId] ?? [];
  return [...base, ...extensions];
}
