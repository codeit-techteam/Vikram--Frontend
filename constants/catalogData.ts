import {
  mergeCategoryProducts,
} from '@constants/catalogExtensions';
import type { CatalogCategory, Product, ProductCategoryType } from '@/types/catalog';
import {
  resolveProductCarouselSources,
  resolveProductImageSource,
} from '@utils/catalogPlaceholders';
import { images, productImageUrls } from '@constants/images';
import type { ImageSourcePropType } from 'react-native';

const PRODUCT_IMAGE_BASE: Record<string, string> = {
  'ultratech cement bags warehouse': productImageUrls.cementBags,
  'acc cement pile grey': productImageUrls.cementSite,
  'manufactured sand construction': productImageUrls.mSand,
  'river sand pile construction': productImageUrls.riverSand,
  'red clay bricks construction': productImageUrls.redBricks,
  'aac blocks construction': productImageUrls.aacBlocks,
  'stone aggregate construction': productImageUrls.stoneAggregate,
  'crushed stone construction': productImageUrls.crushedStone,
  'grey fill sand construction': productImageUrls.riverSand,
  'ultratech cement bags': productImageUrls.cementBags,
  'acc cement bags construction': productImageUrls.cementSite,
  'ambuja cement construction': productImageUrls.cementBags,
  'sand construction pile': productImageUrls.mSand,
  'river sand construction': productImageUrls.riverSand,
  'stone chips aggregate': productImageUrls.stoneAggregate,
  'red bricks construction': productImageUrls.redBricks,
  'tmt steel bars construction': productImageUrls.steelBars,
  'tata steel bars': productImageUrls.steelBars,
  'jsw steel rods construction': productImageUrls.steelBars,
  'jindal tmt bars construction': productImageUrls.steelBars,
  'tmt steel bars': productImageUrls.steelBars,
  'plumbing tools kit': productImageUrls.constructionSite,
  'masonry trowel tools': productImageUrls.constructionSite,
};

const PRODUCT_CAROUSEL_IMAGES: Record<string, string[]> = {
  'manufactured sand construction': [
    productImageUrls.mSand,
    productImageUrls.riverSand,
    productImageUrls.stoneAggregate,
  ],
  'river sand pile construction': [
    productImageUrls.riverSand,
    productImageUrls.mSand,
    productImageUrls.stoneAggregate,
  ],
  'red clay bricks construction': [
    productImageUrls.redBricks,
    productImageUrls.redBricksStack,
    productImageUrls.aacBlocks,
  ],
  'aac blocks construction': [
    productImageUrls.aacBlocks,
    productImageUrls.redBricksStack,
    productImageUrls.redBricks,
  ],
  'stone aggregate construction': [
    productImageUrls.stoneAggregate,
    productImageUrls.crushedStone,
    productImageUrls.riverSand,
  ],
  'crushed stone construction': [
    productImageUrls.crushedStone,
    productImageUrls.stoneAggregate,
    productImageUrls.riverSand,
  ],
  'grey fill sand construction': [
    productImageUrls.riverSand,
    productImageUrls.mSand,
    productImageUrls.stoneAggregate,
  ],
};

function toSizedImageUrl(baseUrl: string, size = '400x200') {
  const [w, h] = size.split('x');
  return `${baseUrl}?w=${w}&h=${h}&fit=crop&q=80`;
}

function toImageUri(searchTerm: string, size = '800x440'): ImageSourcePropType {
  const base = PRODUCT_IMAGE_BASE[searchTerm] ?? productImageUrls.constructionSite;
  return { uri: toSizedImageUrl(base, size) };
}

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  {
    id: 'cement',
    slug: 'cement',
    name: 'Cement',
    labelKey: 'cement',
    image: images.categoryCement,
    displayOrder: 1,
    isFeatured: true,
    isActive: true,
    productCount: 0,
  },
  {
    id: 'rmc',
    slug: 'rmc',
    name: 'RMC',
    labelKey: 'rmc',
    image: images.categoryRmc,
    displayOrder: 2,
    isFeatured: true,
    isActive: true,
    productCount: 0,
  },
  {
    id: 'sand',
    slug: 'sand',
    name: 'Sand',
    labelKey: 'sand',
    image: images.categorySand,
    displayOrder: 3,
    isFeatured: true,
    isActive: true,
    productCount: 0,
  },
  {
    id: 'bricks',
    slug: 'bricks',
    name: 'Bricks',
    labelKey: 'bricksAndMasonry',
    image: images.categoryBricks,
    displayOrder: 4,
    isFeatured: true,
    isActive: true,
    productCount: 0,
  },
  {
    id: 'grey-fill-sand',
    slug: 'grey-fill-sand',
    name: 'Grey Fill Sand',
    labelKey: 'greyFillSand',
    image: images.categoryGreyFillSand,
    imageSearch: 'grey fill sand construction',
    displayOrder: 5,
    isFeatured: false,
    isActive: true,
    productCount: 0,
  },
  {
    id: 'stone-chips',
    slug: 'stone-chips',
    name: 'Stone Chips',
    labelKey: 'stoneChip',
    image: images.categoryStone,
    displayOrder: 6,
    isFeatured: true,
    isActive: true,
    productCount: 0,
  },
  {
    id: 'aggregates',
    slug: 'aggregates',
    name: 'Aggregates',
    labelKey: 'aggregates',
    image: images.categoryAggregates,
    displayOrder: 7,
    isFeatured: false,
    isActive: true,
    productCount: 0,
  },
  {
    id: 'adhesives',
    slug: 'adhesives',
    name: 'Adhesives',
    labelKey: 'adhesives',
    image: images.categoryAdhesives,
    displayOrder: 8,
    isFeatured: false,
    isActive: true,
    productCount: 0,
  },
  {
    id: 'wall-repair',
    slug: 'wall-repair',
    name: 'Wall Repair',
    labelKey: 'wallRepair',
    image: images.categoryWallRepair,
    displayOrder: 9,
    isFeatured: false,
    isActive: true,
    productCount: 0,
  },
  {
    id: 'waterproofing',
    slug: 'waterproofing',
    name: 'Waterproofing',
    labelKey: 'waterproofing',
    image: images.categoryWaterproofing,
    displayOrder: 10,
    isFeatured: false,
    isActive: true,
    productCount: 0,
  },
  {
    id: 'quick-repair',
    slug: 'quick-repair',
    name: 'Quick Repair',
    labelKey: 'quickRepair',
    image: images.categoryQuickRepair,
    displayOrder: 11,
    isFeatured: false,
    isActive: true,
    productCount: 0,
  },
  {
    id: 'putty',
    slug: 'putty',
    name: 'Putty',
    labelKey: 'putty',
    image: images.categoryPutty,
    displayOrder: 12,
    isFeatured: false,
    isActive: true,
    productCount: 0,
  },
];

const cementProducts: Product[] = [
  {
    id: 'c1',
    badge: '⚡ 90 min ETA',
    badgeColor: '#FEB623',
    image: images.productUltratech,
    imageSearch: 'ultratech cement bags warehouse',
    category: 'CEMENT & ADHESIVES',
    name: 'UltraTech Premium PPC',
    nameHi: 'UltraTech Premium PPC सीमेंट',
    detailName: 'UltraTech Premium PPC Cement',
    grade: '53',
    status: 'READY FOR DISPATCH',
    spec: 'Order from 1 Bag',
    retailPrice: '₹425.00 / Bag',
    retailPriceValue: 425,
    bulkLabel: 'Bulk Price (50+)',
    bulkPrice: '₹398.50',
    bulkPriceValue: 398.5,
    unit: 'Bag',
    defaultQuantity: 1,
    minOrder: 1,
    weightPerUnit: 50,
    bulkThreshold: 50,
    categoryType: 'cement',
    description:
      'High-ductility FE 550 grade Portland Pozzolana Cement engineered for structural integrity and long-term durability in demanding construction environments.',
    descriptionHi:
      'उच्च-लचीलापन FE 550 ग्रेड Portland Pozzolana Cement, मांग वाले निर्माण वातावरण में संरचनात्मक अखंडता और दीर्घकालिक टिकाऊपन के लिए।',
  },
  {
    id: 'c2',
    badge: '🟠 Bulk Discount Available',
    badgeColor: '#FEB623',
    image: images.productAcc,
    imageSearch: 'acc cement pile grey',
    category: 'CEMENT & ADHESIVES',
    name: 'ACC CEMENT',
    nameHi: 'ACC Portland सीमेंट',
    detailName: 'ACC Portland Cement',
    grade: '53',
    status: 'IN STOCK',
    spec: '12mm Standard',
    retailPrice: '₹72,400.00 / MT',
    retailPriceValue: 72400,
    bulkLabel: 'Contractor Tier (5t+)',
    bulkPrice: '₹68,950.00',
    bulkPriceValue: 68950,
    unit: 'MT',
    defaultQuantity: 1,
    bulkThreshold: 5,
    categoryType: 'cement',
    description:
      'Premium OPC cement suitable for high-rise structures, bridges, and heavy-duty industrial flooring with consistent quality assurance.',
    descriptionHi:
      'प्रीमियम OPC सीमेंट, ऊंची इमारतों, पुलों और भारी औद्योगिक फर्श के लिए, निरंतर गुणवत्ता आश्वासन के साथ।',
  },
];

/** Offline/static RMC fallbacks aligned with seeded catalog (RMC-M25 / RMC-M30). */
const rmcProducts: Product[] = [
  {
    id: 'rmc_m25',
    badge: '⚡ Same Day',
    image: images.categoryRmc,
    imageSearch: 'ready mix concrete mixer truck',
    category: 'RMC',
    name: 'RMC M25',
    nameHi: 'आरएमसी M25',
    detailName: 'Ready Mix Concrete M25',
    grade: 'M25',
    status: 'IN STOCK',
    spec: 'Ready Mix Concrete',
    retailPrice: '₹4,800 / Cum',
    retailPriceValue: 4800,
    bulkLabel: 'Bulk (10+ Cum)',
    bulkPrice: '₹4,500',
    bulkPriceValue: 4500,
    unit: 'Cum',
    defaultQuantity: 1,
    bulkThreshold: 10,
    categoryType: 'rmc',
    description:
      'Ready Mix Concrete M25 for structural pours. Delivered by Bajriwala mixer trucks.',
    descriptionHi:
      'संरचनात्मक ढलाई के लिए रेडी मिक्स कंक्रीट M25। बजरीवाला मिक्सर ट्रकों द्वारा डिलीवरी।',
  },
  {
    id: 'rmc_m30',
    badge: '⚡ Same Day',
    image: images.categoryRmc,
    imageSearch: 'ready mix concrete mixer truck',
    category: 'RMC',
    name: 'RMC M30',
    nameHi: 'आरएमसी M30',
    detailName: 'Ready Mix Concrete M30',
    grade: 'M30',
    status: 'IN STOCK',
    spec: 'Ready Mix Concrete',
    retailPrice: '₹5,200 / Cum',
    retailPriceValue: 5200,
    bulkLabel: 'Bulk (10+ Cum)',
    bulkPrice: '₹4,900',
    bulkPriceValue: 4900,
    unit: 'Cum',
    defaultQuantity: 1,
    bulkThreshold: 10,
    categoryType: 'rmc',
    description:
      'Ready Mix Concrete M30 for high-strength structural applications.',
    descriptionHi:
      'उच्च-शक्ति संरचनात्मक अनुप्रयोगों के लिए रेडी मिक्स कंक्रीट M30।',
  },
];

const sandProducts: Product[] = [];

const bricksProducts: Product[] = [];

const greyFillSandProducts: Product[] = [
  {
    id: 'gf1',
    badge: '⚡ Same Day',
    image: images.categoryGreyFillSand,
    imageSearch: 'grey fill sand construction',
    category: 'SAND & AGGREGATES',
    name: 'Grey Fill Sand Grade 1',
    nameHi: 'Grey Fill Sand ग्रेड 1',
    detailName: 'Grey Fill Sand Grade 1',
    grade: 'G1',
    status: 'IN STOCK',
    spec: 'Min 1 Ton',
    retailPrice: '₹1,200 / Ton',
    retailPriceValue: 1200,
    bulkLabel: 'Bulk (10T+)',
    bulkPrice: '₹980',
    bulkPriceValue: 980,
    unit: 'Ton',
    defaultQuantity: 1,
    bulkThreshold: 10,
    categoryType: 'sand',
    description:
      'Coarse grey fill sand for backfilling, leveling, and foundation preparation on construction sites.',
    descriptionHi:
      'निर्माण साइटों पर बैकफिलिंग, leveling और foundation तैयारी के लिए मोटी grey fill sand।',
  },
];

const stoneChipProducts: Product[] = [
  {
    id: 'sc1',
    badge: '⚡ 90 min ETA',
    image: images.productCrushedStoneAggregate,
    imageSearch: 'stone aggregate construction',
    category: 'STONE & AGGREGATES',
    name: '20mm Stone Aggregate',
    nameHi: '20mm Stone Aggregate',
    detailName: '20mm Stone Aggregate',
    grade: 'Grade A',
    status: 'IN STOCK',
    spec: 'Min 1 MT',
    retailPrice: '₹1,600 / MT',
    retailPriceValue: 1600,
    bulkLabel: 'Bulk (5MT+)',
    bulkPrice: '₹1,380',
    bulkPriceValue: 1380,
    unit: 'MT',
    defaultQuantity: 1,
    bulkThreshold: 5,
    categoryType: 'stone',
    description:
      'Crushed stone aggregate conforming to IS 383 standards for concrete production and road base layers.',
    descriptionHi:
      'IS 383 मानकों के अनुरूप crushed stone aggregate, कंक्रीट उत्पादन और सड़क base layers के लिए।',
  },
  {
    id: 'sc2',
    badge: '⚡ 90 min ETA',
    image: toImageUri('crushed stone construction'),
    imageSearch: 'crushed stone construction',
    category: 'STONE & AGGREGATES',
    name: '40mm Crushed Stone',
    nameHi: '40mm Crushed Stone',
    detailName: '40mm Crushed Stone',
    grade: 'Grade B',
    status: 'READY FOR DISPATCH',
    spec: 'Min 2 MT',
    retailPrice: '₹1,450 / MT',
    retailPriceValue: 1450,
    bulkLabel: 'Bulk (10MT+)',
    bulkPrice: '₹1,250',
    bulkPriceValue: 1250,
    unit: 'MT',
    defaultQuantity: 2,
    bulkThreshold: 10,
    categoryType: 'stone',
    description:
      'Large-size crushed stone for drainage layers, railway ballast, and heavy-duty foundation work.',
    descriptionHi:
      'ड्रेनेज layers, रेलवे ballast और भारी foundation कार्य के लिए बड़े आकार की crushed stone।',
  },
];


const rmcMerged = mergeCategoryProducts(rmcProducts, 'rmc');

export const PRODUCTS_BY_CATEGORY: Record<string, Product[]> = {
  cement: mergeCategoryProducts(cementProducts, 'cement'),
  rmc: rmcMerged,
  /** Legacy slug alias — redirects / older links */
  steel: rmcMerged,
  /** Legacy empty bucket — Hardware is hidden from marketplace grids */
  hardware: [],
  sand: mergeCategoryProducts(sandProducts, 'sand'),
  bricks: mergeCategoryProducts(bricksProducts, 'bricks'),
  'grey-fill-sand': mergeCategoryProducts(greyFillSandProducts, 'grey-fill-sand'),
  'stone-chips': mergeCategoryProducts(stoneChipProducts, 'stone-chips'),
  aggregates: mergeCategoryProducts([], 'aggregates'),
  adhesives: mergeCategoryProducts([], 'adhesives'),
  'wall-repair': mergeCategoryProducts([], 'wall-repair'),
  waterproofing: mergeCategoryProducts([], 'waterproofing'),
  'quick-repair': mergeCategoryProducts([], 'quick-repair'),
  putty: mergeCategoryProducts([], 'putty'),
};

const CATEGORY_TYPE_MAP: Record<string, ProductCategoryType> = {
  cement: 'cement',
  rmc: 'rmc',
  steel: 'rmc',
  sand: 'sand',
  bricks: 'bricks',
  'grey-fill-sand': 'sand',
  'stone-chips': 'stone',
  aggregates: 'aggregates',
  adhesives: 'adhesives',
  'wall-repair': 'wall-repair',
  waterproofing: 'waterproofing',
  'quick-repair': 'quick-repair',
  putty: 'putty',
};

export function getProductImageSource(product: Product): ImageSourcePropType {
  return resolveProductImageSource({
    imageUrl: product.imageUrl,
    productSlug: product.slug,
    categorySlug: product.categorySlug ?? product.categoryType,
    fallbackImage: product.image,
  });
}

export function getCarouselImages(product: Product): ImageSourcePropType[] {
  return resolveProductCarouselSources({
    urls: product.carouselUrls,
    imageUrl: product.imageUrl,
    productSlug: product.slug,
    categorySlug: product.categorySlug ?? product.categoryType,
  });
}

/** @deprecated Prefer React Query catalog hooks — kept for cart/reorder fallbacks. */
export function getAllProducts(): Product[] {
  return Object.values(PRODUCTS_BY_CATEGORY).flat();
}

/** @deprecated Prefer useProductDetail / product cache. */
export function getProductById(productId: string): Product | undefined {
  return getAllProducts().find((p) => p.id === productId || p.slug === productId);
}

/** @deprecated Prefer product.categorySlug from API. */
export function getCategoryIdForProduct(productId: string): string | undefined {
  for (const [catId, products] of Object.entries(PRODUCTS_BY_CATEGORY)) {
    if (products.some((p) => p.id === productId || p.slug === productId)) return catId;
  }
  return undefined;
}

export function getProductCountForCategory(categoryId: string): number {
  return PRODUCTS_BY_CATEGORY[categoryId]?.length ?? 0;
}

export function getProductImageUrl(searchTerm: string, size = '400x200') {
  const base = PRODUCT_IMAGE_BASE[searchTerm] ?? productImageUrls.constructionSite;
  return toSizedImageUrl(base, size);
}
