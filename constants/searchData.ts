import { getProductImageUrl } from '@constants/catalogData';
import type { Product } from '@/types/catalog';
import type { CartItem } from '@store/cartStore';

export type SearchCategory = 'cement' | 'steel' | 'stone' | 'sand' | 'bricks';

export interface SearchProduct {
  id: string;
  category: SearchCategory;
  badge: 'TRENDING' | 'POPULAR' | null;
  badgeColor?: string;
  name: string;
  brand: string;
  price: number;
  unit: string;
  image: string;
}

export const SEARCH_CATEGORIES = [
  { id: 'cement' as const, label: 'Cement', icon: '🧱' },
  { id: 'steel' as const, label: 'Steel', icon: '🔩' },
  { id: 'stone' as const, label: 'Stone Chips', icon: '🪨' },
  { id: 'sand' as const, label: 'Sand', icon: '🏖' },
  { id: 'bricks' as const, label: 'Bricks', icon: '🧱' },
];

export const ALL_PRODUCTS: SearchProduct[] = [
  {
    id: 'p1',
    category: 'cement',
    badge: 'TRENDING',
    badgeColor: '#FEB623',
    name: 'UltraTech PPC Cement',
    brand: 'UltraTech',
    price: 395,
    unit: '50kg Bag',
    image: 'ultratech cement bags',
  },
  {
    id: 'p2',
    category: 'cement',
    badge: 'POPULAR',
    badgeColor: '#1A73E8',
    name: 'ACC Gold Water Shield',
    brand: 'ACC',
    price: 410,
    unit: '50kg Bag',
    image: 'acc cement bags construction',
  },
  {
    id: 'p3',
    category: 'cement',
    badge: null,
    name: 'Ambuja Kawach Cement',
    brand: 'Ambuja',
    price: 405,
    unit: '50kg Bag',
    image: 'ambuja cement construction',
  },
  {
    id: 'p4',
    category: 'steel',
    badge: 'TRENDING',
    badgeColor: '#FEB623',
    name: 'JSW Neosteel TMT 12mm',
    brand: 'JSW',
    price: 58450,
    unit: 'MT',
    image: 'jsw steel rods construction',
  },
  {
    id: 'p5',
    category: 'steel',
    badge: 'POPULAR',
    badgeColor: '#1A73E8',
    name: 'TATA Tiscon 500D',
    brand: 'TATA',
    price: 57200,
    unit: 'MT',
    image: 'tata steel bars',
  },
  {
    id: 'p6',
    category: 'steel',
    badge: null,
    name: 'Jindal Panther TMT 10mm',
    brand: 'Jindal',
    price: 55800,
    unit: 'MT',
    image: 'jindal tmt bars construction',
  },
  {
    id: 'p7',
    category: 'sand',
    badge: 'POPULAR',
    badgeColor: '#1A73E8',
    name: 'M-Sand Zone II',
    brand: 'Local',
    price: 1800,
    unit: 'Ton',
    image: 'sand construction pile',
  },
  {
    id: 'p8',
    category: 'sand',
    badge: null,
    name: 'River Sand Premium',
    brand: 'Natural',
    price: 2200,
    unit: 'Ton',
    image: 'river sand construction',
  },
  {
    id: 'p9',
    category: 'stone',
    badge: 'TRENDING',
    badgeColor: '#FEB623',
    name: '20mm Stone Aggregate',
    brand: 'Blue Metal',
    price: 1600,
    unit: 'MT',
    image: 'stone chips aggregate',
  },
  {
    id: 'p10',
    category: 'bricks',
    badge: null,
    name: 'Red Clay Bricks ISI',
    brand: 'Local',
    price: 8,
    unit: 'piece',
    image: 'red bricks construction',
  },
  {
    id: 'p11',
    category: 'bricks',
    badge: 'POPULAR',
    badgeColor: '#1A73E8',
    name: 'AAC Blocks 600x200',
    brand: 'Siporex',
    price: 45,
    unit: 'piece',
    image: 'aac blocks construction',
  },
];

export const BUNDLE_PRODUCT_IDS = ['p1', 'p4', 'p9'] as const;
export const BUNDLE_ORIGINAL_PRICE = 24500;
export const BUNDLE_PRICE = 22499;

export function getResults(query: string, category: string | null): SearchProduct[] {
  return ALL_PRODUCTS.filter((p) => {
    const matchesQuery =
      query.length === 0 ||
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.brand.toLowerCase().includes(query.toLowerCase()) ||
      p.category.toLowerCase().includes(query.toLowerCase());

    const matchesCategory = !category || p.category === category;

    return matchesQuery && matchesCategory;
  });
}

export function getInstantSuggestions(query: string): SearchProduct[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return ALL_PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q),
  ).slice(0, 5);
}

export function getSearchProductById(id: string): SearchProduct | undefined {
  return ALL_PRODUCTS.find((p) => p.id === id);
}

export function searchProductToCartItem(product: SearchProduct): CartItem {
  return {
    id: product.id,
    productId: product.id,
    name: product.name,
    productName: product.name,
    brand: product.brand,
    category: product.category,
    description: `${product.brand} · ${product.unit}`,
    imageSearch: product.image,
    image: product.image,
    unitPrice: product.price,
    bulkPrice: product.price,
    bulkThreshold: 9999,
    quantity: 1,
    unit: product.unit,
  };
}

export function searchProductToProduct(sp: SearchProduct): Product {
  const priceStr = `₹${sp.price.toLocaleString('en-IN')}`;
  return {
    id: sp.id,
    badge: sp.badge ?? 'IN STOCK',
    badgeColor: sp.badgeColor ?? '#FEB623',
    imageSearch: sp.image,
    category: sp.category.toUpperCase(),
    name: sp.name,
    detailName: sp.name,
    grade: '-',
    status: 'IN STOCK',
    spec: sp.unit,
    retailPrice: `${priceStr} / ${sp.unit}`,
    retailPriceValue: sp.price,
    bulkLabel: 'Standard Price',
    bulkPrice: priceStr,
    bulkPriceValue: sp.price,
    unit: sp.unit,
    defaultQuantity: 1,
    bulkThreshold: 50,
    description: `${sp.brand} ${sp.name} — premium construction material.`,
    categoryType: sp.category,
  };
}

export function formatSearchPrice(price: number): string {
  return `₹${price.toLocaleString('en-IN')}`;
}
