import type { ImageSourcePropType } from 'react-native';

import { images, productImageUrls } from '@constants/images';
import {
  mergeCategoryProducts,
  PRODUCT_IMAGE_OVERRIDES,
} from '@constants/catalogExtensions';
import type { CatalogCategory, Product, ProductCategoryType } from '@/types/catalog';

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
  { id: 'cement', labelKey: 'cement', image: images.categoryCement },
  { id: 'steel', labelKey: 'steel', image: images.categorySteel },
  { id: 'sand', labelKey: 'sand', image: images.categorySand },
  { id: 'bricks', labelKey: 'bricksAndMasonry', image: images.categoryBricks },
  {
    id: 'grey-fill-sand',
    labelKey: 'greyFillSand',
    image: images.categoryGreyFillSand,
    imageSearch: 'grey fill sand construction',
  },
  { id: 'stone-chips', labelKey: 'stoneChip', image: images.categoryStone },
  { id: 'aggregates', labelKey: 'aggregates', image: images.categoryAggregates },
  { id: 'adhesives', labelKey: 'adhesives', image: images.categoryAdhesives },
  { id: 'wall-repair', labelKey: 'wallRepair', image: images.categoryWallRepair },
  { id: 'waterproofing', labelKey: 'waterproofing', image: images.categoryWaterproofing },
  { id: 'quick-repair', labelKey: 'quickRepair', image: images.categoryQuickRepair },
  { id: 'putty', labelKey: 'putty', image: images.categoryPutty },
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
    spec: 'Minimum 20 Bags',
    retailPrice: '₹425.00 / Bag',
    retailPriceValue: 425,
    bulkLabel: 'Bulk Price (50+)',
    bulkPrice: '₹398.50',
    bulkPriceValue: 398.5,
    unit: 'Bag',
    defaultQuantity: 10,
    minOrder: 10,
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

const steelProducts: Product[] = [
  {
    id: 's1',
    badge: '⚡ 90 min ETA',
    imageSearch: 'tata steel tmt bars construction',
    category: 'STEEL & REBAR',
    name: 'TATA Tiscon TMT 500D',
    nameHi: 'TATA Tiscon TMT 500D',
    detailName: 'TATA Tiscon TMT 500D',
    grade: 'Fe500',
    status: 'IN STOCK',
    spec: 'Min 1 MT',
    retailPrice: '₹58,000 / MT',
    retailPriceValue: 58000,
    bulkLabel: 'Bulk (5MT+)',
    bulkPrice: '₹54,500',
    bulkPriceValue: 54500,
    unit: 'MT',
    defaultQuantity: 1,
    bulkThreshold: 5,
    categoryType: 'steel',
    description:
      'Thermo-mechanically treated bars with superior bendability and weldability for reinforced concrete structures.',
    descriptionHi:
      'प्रबलित कंक्रीट संरचनाओं के लिए उत्कृष्ट मोड़ और वेल्ड क्षमता वाली thermo-mechanically treated सरिया।',
  },
  {
    id: 's2',
    badge: '⚡ 90 min ETA',
    image: images.productJswNeosteel,
    imageSearch: 'jsw steel rods construction',
    category: 'STEEL & REBAR',
    name: 'JSW Neo Steel Bars',
    nameHi: 'JSW Neo Steel Bars',
    detailName: 'JSW Neo Steel Bars',
    grade: 'Fe550',
    status: 'READY FOR DISPATCH',
    spec: '12mm Rod',
    retailPrice: '₹61,000 / MT',
    retailPriceValue: 61000,
    bulkLabel: 'Contractor (10MT+)',
    bulkPrice: '₹57,200',
    bulkPriceValue: 57200,
    unit: 'MT',
    defaultQuantity: 1,
    bulkThreshold: 10,
    categoryType: 'steel',
    description:
      'High-strength TMT bars with enhanced corrosion resistance for coastal and high-humidity construction zones.',
    descriptionHi:
      'तटीय और उच्च-आर्द्रता निर्माण क्षेत्रों के लिए बढ़ी हुई जंग प्रतिरोध क्षमता वाली उच्च-मजबूती TMT सरिया।',
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


export const PRODUCTS_BY_CATEGORY: Record<string, Product[]> = {
  cement: mergeCategoryProducts(cementProducts, 'cement'),
  steel: mergeCategoryProducts(steelProducts, 'steel'),
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
  steel: 'steel',
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

export function getProductCountForCategory(categoryId: string): number {
  return PRODUCTS_BY_CATEGORY[categoryId]?.length ?? 0;
}

export function getProductImageUrl(searchTerm: string, size = '400x200') {
  const base = PRODUCT_IMAGE_BASE[searchTerm] ?? productImageUrls.constructionSite;
  return toSizedImageUrl(base, size);
}

export function getAllProducts(): Product[] {
  return Object.values(PRODUCTS_BY_CATEGORY).flat();
}

export function getProductById(productId: string): Product | undefined {
  return getAllProducts().find((p) => p.id === productId);
}

export function getCategoryIdForProduct(productId: string): string | undefined {
  for (const [catId, products] of Object.entries(PRODUCTS_BY_CATEGORY)) {
    if (products.some((p) => p.id === productId)) return catId;
  }
  return undefined;
}

export function getProductImageSource(product: Product): ImageSourcePropType {
  if (PRODUCT_IMAGE_OVERRIDES[product.id]) return PRODUCT_IMAGE_OVERRIDES[product.id];
  if (product.image) return product.image;
  if (product.imageSearch === 'jsw steel rods construction') {
    return images.productJswNeosteel;
  }
  return { uri: getProductImageUrl(product.imageSearch) };
}

export function getCarouselImages(product: Product): ImageSourcePropType[] {
  if (product.image && typeof product.image === 'number') {
    return [product.image, product.image, product.image];
  }
  const carousel = PRODUCT_CAROUSEL_IMAGES[product.imageSearch];
  if (carousel) {
    return carousel.map((url) => ({ uri: toSizedImageUrl(url, '800x440') }));
  }
  if (product.image) {
    return [product.image, product.image, product.image];
  }
  const fallback = getProductImageUrl(product.imageSearch, '800x440');
  return [{ uri: fallback }, { uri: fallback }, { uri: fallback }];
}
