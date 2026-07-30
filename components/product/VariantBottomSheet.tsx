import { memo, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProductQuantitySelector } from '@components/product/ProductQuantitySelector';
import { useAddToCart } from '@hooks/useAddToCart';
import { useVariantStore } from '@store/variantStore';
import { formatINR } from '@utils/formatCurrency';
import { getProductPricing } from '@utils/productPricing';
import { resolveProductImageSource } from '@utils/catalogPlaceholders';

const GOLD = '#FEB623';
const DARK = '#1A1A1A';
const GREEN = '#2E7D32';

function VariantBottomSheetComponent() {
  const insets = useSafeAreaInsets();
  const visible = useVariantStore((s) => s.visible);
  const product = useVariantStore((s) => s.product);
  const selectedVariantId = useVariantStore((s) => s.selectedVariantId);
  const quantity = useVariantStore((s) => s.quantity);
  const close = useVariantStore((s) => s.close);
  const selectVariant = useVariantStore((s) => s.selectVariant);
  const setQuantity = useVariantStore((s) => s.setQuantity);
  const { addToCart, buttonState } = useAddToCart();

  const variants = product?.productVariants ?? [];
  const selected = variants.find((v) => v.id === selectedVariantId) ?? variants[0];
  const pricing = product ? getProductPricing(product, selected) : null;

  const imageSource = useMemo(() => {
    if (!product) return null;
    return resolveProductImageSource({
      imageUrl: product.imageUrl,
      productSlug: product.slug,
      categorySlug: product.categorySlug,
    });
  }, [product]);

  const handleAdd = useCallback(async () => {
    if (!product || !selected || selected.inStock === false) return;
    await addToCart(product, quantity, { variantId: selected.id });
    close();
  }, [addToCart, close, product, quantity, selected]);

  if (!product || !pricing) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title}>Select Variant</Text>
          <Pressable onPress={close} hitSlop={12} accessibilityRole="button">
            <Ionicons name="close" size={22} color={DARK} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.body}>
          <View style={styles.summary}>
            {imageSource ? (
              <Image source={imageSource} style={styles.thumb} contentFit="cover" />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]} />
            )}
            <View style={styles.summaryText}>
              <Text style={styles.name} numberOfLines={2}>
                {product.detailName ?? product.name}
              </Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>
                  {formatINR(pricing.sellingPrice, false)}/{pricing.unit}
                </Text>
                {pricing.originalPrice > pricing.sellingPrice ? (
                  <Text style={styles.mrp}>{formatINR(pricing.originalPrice, false)}</Text>
                ) : null}
                {pricing.discountPercent > 0 ? (
                  <Text style={styles.off}>{pricing.discountPercent}% OFF</Text>
                ) : null}
              </View>
            </View>
          </View>

          {pricing.bulkTiers.length > 0 ? (
            <View style={styles.bulkBox}>
              <Text style={styles.bulkTitle}>Bulk Price Available</Text>
              {pricing.bulkTiers.map((tier) => (
                <View key={`${tier.minQty}-${tier.price}`} style={styles.bulkRow}>
                  <Text style={styles.bulkText}>
                    Buy {tier.minQty}+ at {formatINR(tier.price, false)}/{pricing.unit}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <Text style={styles.sectionLabel}>Weight</Text>
          <View style={styles.chips}>
            {variants.map((v) => {
              const selectedChip = v.id === selected?.id;
              const oos = v.inStock === false;
              return (
                <Pressable
                  key={v.id}
                  disabled={oos}
                  onPress={() => selectVariant(v.id)}
                  style={[
                    styles.chip,
                    selectedChip && styles.chipSelected,
                    oos && styles.chipOos,
                  ]}>
                  <Text
                    style={[
                      styles.chipLabel,
                      selectedChip && styles.chipLabelSelected,
                      oos && styles.chipLabelOos,
                    ]}>
                    {v.label}
                  </Text>
                  {oos ? <Text style={styles.oosText}>Out of stock</Text> : null}
                  {!oos ? (
                    <Text style={styles.chipPrice}>{formatINR(v.price, false)}</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <View>
            <Text style={styles.footerPrice}>
              {formatINR(pricing.sellingPrice, false)}/{pricing.unit}
            </Text>
            <ProductQuantitySelector
              quantity={quantity}
              onChange={setQuantity}
              min={product.minOrder ?? 1}
              max={product.maxOrder}
              step={product.incrementStep ?? 1}
              size="sm"
            />
          </View>
          <Pressable
            style={[
              styles.addBtn,
              (selected?.inStock === false || buttonState === 'loading') && styles.addBtnDisabled,
            ]}
            disabled={selected?.inStock === false || buttonState === 'loading'}
            onPress={() => void handleAdd()}>
            {buttonState === 'loading' ? (
              <ActivityIndicator color={DARK} />
            ) : (
              <Text style={styles.addBtnText}>Add to cart</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '82%',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: DARK,
  },
  body: {
    maxHeight: 420,
  },
  summary: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
  },
  thumbPlaceholder: {
    borderWidth: 1,
    borderColor: '#EEE',
  },
  summaryText: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: DARK,
  },
  mrp: {
    fontSize: 13,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  off: {
    fontSize: 12,
    fontWeight: '700',
    color: GREEN,
  },
  bulkBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  bulkTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: GREEN,
    marginBottom: 6,
  },
  bulkRow: {
    marginBottom: 4,
  },
  bulkText: {
    fontSize: 13,
    fontWeight: '600',
    color: DARK,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: DARK,
    marginBottom: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    minWidth: 72,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  chipSelected: {
    borderColor: GOLD,
    backgroundColor: '#FFF8E8',
  },
  chipOos: {
    opacity: 0.5,
    backgroundColor: '#F5F5F5',
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: DARK,
  },
  chipLabelSelected: {
    color: DARK,
  },
  chipLabelOos: {
    color: '#999',
  },
  chipPrice: {
    marginTop: 2,
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
  oosText: {
    marginTop: 2,
    fontSize: 10,
    color: '#999',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 12,
  },
  footerPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: DARK,
    marginBottom: 6,
  },
  addBtn: {
    flex: 1,
    backgroundColor: GOLD,
    borderRadius: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  addBtnDisabled: {
    opacity: 0.55,
  },
  addBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: DARK,
  },
});

export const VariantBottomSheet = memo(VariantBottomSheetComponent);
