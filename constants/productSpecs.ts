import type { ProductCategoryType, TechSpecItem } from '@/types/catalog';

export const SPECS_BY_TYPE: Record<ProductCategoryType, TechSpecItem[]> = {
  cement: [
    { icon: 'resize-outline', label: 'GRADE', value: '53 Grade PPC' },
    { icon: 'time-outline', label: 'SETTING TIME', value: '30–600 mins' },
    { icon: 'fitness-outline', label: 'STRENGTH', value: 'Superior Durability' },
    { icon: 'analytics-outline', label: 'COMPRESSION', value: '27 MPa (3 Days)' },
  ],
  steel: [
    { icon: 'resize-outline', label: 'GRADE', value: 'Fe 500D' },
    { icon: 'pulse-outline', label: 'TENSILE STRENGTH', value: '565 MPa' },
    { icon: 'git-compare-outline', label: 'ELONGATION', value: '≥16%' },
    { icon: 'document-text-outline', label: 'IS STANDARD', value: 'IS 1786:2008' },
  ],
  sand: [
    { icon: 'resize-outline', label: 'GRADE', value: 'Zone II' },
    { icon: 'water-outline', label: 'SILT CONTENT', value: '<3%' },
    { icon: 'rainy-outline', label: 'MOISTURE', value: '≤5%' },
    { icon: 'earth-outline', label: 'SOURCE', value: 'Riverbed / M-Sand' },
  ],
  bricks: [
    { icon: 'resize-outline', label: 'GRADE', value: 'Class A' },
    { icon: 'barbell-outline', label: 'COMPRESSIVE STRENGTH', value: '≥7.5 N/mm²' },
    { icon: 'water-outline', label: 'WATER ABSORPTION', value: '≤20%' },
    { icon: 'cube-outline', label: 'SIZE', value: '230x110x76mm' },
  ],
  stone: [
    { icon: 'resize-outline', label: 'GRADE', value: 'Grade A' },
    { icon: 'ellipse-outline', label: 'SIZE', value: '20mm Aggregate' },
    { icon: 'hammer-outline', label: 'CRUSHING VALUE', value: '≤30%' },
    { icon: 'document-text-outline', label: 'IS STANDARD', value: 'IS 383' },
  ],
};

export const FREQUENTLY_BOUGHT: import('@/types/catalog').FrequentlyBoughtItem[] = [
  {
    id: 'fb1',
    name: 'JSW Neosteel TMT Bars',
    desc: 'High corrosion resistance FE550D bars.',
    price: '₹54,200/Ton',
    priceValue: 54200,
    imageSearch: 'tmt steel bars',
    unit: 'Ton',
  },
  {
    id: 'fb2',
    name: 'Advanced Plumbing Kit',
    desc: 'Comprehensive site plumbing essentials.',
    price: '₹12,450.00',
    priceValue: 12450,
    imageSearch: 'plumbing tools kit',
    unit: 'Kit',
  },
  {
    id: 'fb3',
    name: 'Masonry Hand-Tool Set',
    desc: 'Premium grade stainless steel trowels.',
    price: '₹2,890.00',
    priceValue: 2890,
    imageSearch: 'masonry trowel tools',
    unit: 'Set',
  },
];
