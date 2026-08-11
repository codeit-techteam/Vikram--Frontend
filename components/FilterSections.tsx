import { type ReactNode, useMemo } from 'react';
import { Text, View } from 'react-native';

import { BrandSection } from '@components/filter-sections/BrandSection';
import { GradeSection } from '@components/filter-sections/GradeSection';
import { PriceRangeSection } from '@components/filter-sections/PriceRangeSection';
import { ProductTypeSection } from '@components/filter-sections/ProductTypeSection';
import { computeFacetCounts } from '@constants/filterOptions';
import { FILTER_COLORS, FILTER_SPACING } from '@constants/filterTokens';
import type { ActiveFilters, CategoryFilterConfig, FilterKey } from '@/types/filter.types';
import type { Product } from '@/types/catalog';

interface FilterSectionsProps {
  draft: ActiveFilters;
  onChange: (draft: ActiveFilters) => void;
  config: CategoryFilterConfig;
  products: Product[];
  categoryId?: string;
  visibleSections?: FilterKey[];
  matchingCount?: number;
  /** Hide section titles — used in quick filter sheets where header already shows the title */
  compact?: boolean;
}

const SECTION_META: { key: FilterKey; title: string }[] = [
  { key: 'productType', title: 'TYPE' },
  { key: 'brand', title: 'BRAND' },
  { key: 'grade', title: 'GRADE' },
  { key: 'priceRange', title: 'PRICE' },
];

function FilterSectionBlock({
  title,
  children,
  showDivider,
  compact,
}: {
  title: string;
  children: ReactNode;
  showDivider: boolean;
  compact?: boolean;
}) {
  return (
    <View style={{ paddingVertical: compact ? 0 : FILTER_SPACING.lg }}>
      {!compact && (
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            letterSpacing: 0.5,
            color: FILTER_COLORS.textMuted,
            textTransform: 'uppercase',
            marginBottom: FILTER_SPACING.md,
          }}>
          {title}
        </Text>
      )}
      {children}
      {showDivider && (
        <View
          style={{
            height: 1,
            backgroundColor: FILTER_COLORS.divider,
            marginTop: FILTER_SPACING.lg,
          }}
        />
      )}
    </View>
  );
}

export function FilterSections({
  draft,
  onChange,
  config,
  products,
  categoryId = '',
  visibleSections,
  compact,
}: FilterSectionsProps) {
  const sections = visibleSections
    ? SECTION_META.filter((s) => visibleSections.includes(s.key))
    : SECTION_META.filter((s) => config.advancedSections.includes(s.key));

  const brandCounts = useMemo(
    () =>
      categoryId
        ? computeFacetCounts(products, draft, config, categoryId, 'brand')
        : undefined,
    [products, draft, config, categoryId],
  );
  const gradeCounts = useMemo(
    () =>
      categoryId
        ? computeFacetCounts(products, draft, config, categoryId, 'grade')
        : undefined,
    [products, draft, config, categoryId],
  );
  const productTypeCounts = useMemo(
    () =>
      categoryId
        ? computeFacetCounts(products, draft, config, categoryId, 'productType')
        : undefined,
    [products, draft, config, categoryId],
  );
  const priceCounts = useMemo(
    () =>
      categoryId
        ? computeFacetCounts(products, draft, config, categoryId, 'price')
        : undefined,
    [products, draft, config, categoryId],
  );

  const sectionProps = { draft, onChange, config, products };

  const renderSection = (key: FilterKey) => {
    switch (key) {
      case 'productType':
        return <ProductTypeSection {...sectionProps} facetCounts={productTypeCounts} />;
      case 'grade':
        return <GradeSection {...sectionProps} facetCounts={gradeCounts} />;
      case 'brand':
        return <BrandSection {...sectionProps} facetCounts={brandCounts} />;
      case 'priceRange':
          return (
            <PriceRangeSection
              {...sectionProps}
              facetCounts={priceCounts}
            />
          );
      default:
        return null;
    }
  };

  return (
    <>
      {sections.map((section, index) => (
        <FilterSectionBlock
          key={section.key}
          title={section.title}
          compact={compact}
          showDivider={index < sections.length - 1 && !compact}>
          {renderSection(section.key)}
        </FilterSectionBlock>
      ))}
    </>
  );
}

export function getSectionTitle(key: FilterKey): string {
  return SECTION_META.find((s) => s.key === key)?.title ?? key.toUpperCase();
}
