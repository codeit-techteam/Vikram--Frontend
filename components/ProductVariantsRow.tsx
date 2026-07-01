import { ScrollView, Text, View } from 'react-native';

import { VariantChip } from '@components/product/VariantChip';
import {
  CONTACT_FOR_SIZE,
  getVariantLabels,
  productHasStructuredVariants,
} from '@constants/catalogVariantHelpers';
import type { Product } from '@/types/catalog';

interface ProductVariantsRowProps {
  product: Product;
  compact?: boolean;
  selectedVariantId?: string;
  onSelectVariant?: (variantId: string) => void;
}

export function getProductVariantsLabel(product: Product): string {
  if (product.variantsPlaceholder) return product.variantsPlaceholder;
  const labels = getVariantLabels(product);
  if (!labels.length) return product.spec;
  if (labels.length <= 3) return labels.join(' · ');
  return `${labels[0]} · ${labels[1]} · +${labels.length - 2} more`;
}

export function ProductVariantsRow({
  product,
  compact = false,
  selectedVariantId,
  onSelectVariant,
}: ProductVariantsRowProps) {
  const placeholder = product.variantsPlaceholder;
  const structured = productHasStructuredVariants(product);
  const variants = product.productVariants ?? [];
  const isInteractive = Boolean(onSelectVariant) && structured && !placeholder;

  if (placeholder) {
    return (
      <View className="mt-2 self-start rounded-md bg-secondary/10 px-2.5 py-1.5">
        <Text className="text-xs font-semibold text-secondary">{placeholder}</Text>
      </View>
    );
  }

  if (!structured && !product.variants?.length) return null;

  if (compact) {
    return null;
  }

  if (!structured) {
    const labels = product.variants ?? [];
    if (!labels.length) return null;
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
        <View className="flex-row gap-2">
          {labels.map((variant) => (
            <View
              key={variant}
              className="rounded-full border border-border bg-background px-3 py-1.5">
              <Text className="text-xs font-medium text-text">{variant}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  if (!isInteractive) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
        <View className="flex-row gap-2">
          {variants.map((variant) => (
            <View
              key={variant.id}
              className="rounded-full border border-border bg-background px-3 py-1.5">
              <Text className="text-xs font-medium text-text">{variant.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mt-2"
      contentContainerStyle={{ paddingRight: 8 }}>
      <View className="flex-row gap-2.5">
        {variants.map((variant) => (
          <VariantChip
            key={variant.id}
            label={variant.label}
            selected={selectedVariantId === variant.id}
            onPress={() => onSelectVariant?.(variant.id)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

export function isContactForSizeVariant(product: Product): boolean {
  return product.variantsPlaceholder === CONTACT_FOR_SIZE;
}
