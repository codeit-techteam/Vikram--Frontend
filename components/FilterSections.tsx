import { type ReactNode } from 'react';
import { Text, View } from 'react-native';

import { AvailabilitySection } from '@components/filter-sections/AvailabilitySection';
import { BrandSection } from '@components/filter-sections/BrandSection';
import { BulkPricingSection } from '@components/filter-sections/BulkPricingSection';
import { DiscountSection } from '@components/filter-sections/DiscountSection';
import { ETASection } from '@components/filter-sections/ETASection';
import { GradeSection } from '@components/filter-sections/GradeSection';
import { PriceRangeSection } from '@components/filter-sections/PriceRangeSection';
import { SortSection } from '@components/filter-sections/SortSection';
import { FILTER_COLORS, FILTER_SPACING } from '@constants/filterTokens';
import type { ActiveFilters, CategoryFilterConfig, FilterKey } from '@/types/filter.types';
import type { Product } from '@/types/catalog';

interface FilterSectionsProps {
  draft: ActiveFilters;
  onChange: (draft: ActiveFilters) => void;
  config: CategoryFilterConfig;
  products: Product[];
  visibleSections?: FilterKey[];
  /** Hide section titles — used in quick filter sheets where header already shows the title */
  compact?: boolean;
}

const SECTION_META: { key: FilterKey; title: string }[] = [
  { key: 'brand', title: 'BRAND' },
  { key: 'priceRange', title: 'PRICE RANGE' },
  { key: 'availability', title: 'AVAILABILITY' },
  { key: 'eta', title: 'DELIVERY TIME' },
  { key: 'grade', title: 'GRADE' },
  { key: 'discount', title: 'DISCOUNT' },
  { key: 'bulkPricing', title: 'BULK PRICING' },
  { key: 'sort', title: 'SORT BY' },
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
  visibleSections,
  compact,
}: FilterSectionsProps) {
  const sections = visibleSections
    ? SECTION_META.filter((s) => visibleSections.includes(s.key))
    : SECTION_META.filter((s) => config.advancedSections.includes(s.key));

  const sectionProps = { draft, onChange, config, products };

  const renderSection = (key: FilterKey) => {
    switch (key) {
      case 'grade':
        return <GradeSection {...sectionProps} />;
      case 'eta':
        return <ETASection {...sectionProps} />;
      case 'brand':
        return <BrandSection {...sectionProps} />;
      case 'priceRange':
        return <PriceRangeSection {...sectionProps} />;
      case 'availability':
        return <AvailabilitySection {...sectionProps} />;
      case 'discount':
        return <DiscountSection {...sectionProps} />;
      case 'bulkPricing':
        return <BulkPricingSection {...sectionProps} />;
      case 'sort':
        return <SortSection {...sectionProps} />;
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
