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
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProductQuantitySelector } from '@components/product/ProductQuantitySelector';
import {
  getMinOrderQuantity,
  getVariantCount,
  sheetShowsVariantPicker,
} from '@constants/catalogVariantHelpers';
import { useAddToCart } from '@hooks/useAddToCart';
import { useDeliveryEta } from '@hooks/useDeliveryEta';
import { useVariantStore } from '@store/variantStore';
import { isVisibleProductBrand } from '@utils/categoryDisplay';
import { formatINR } from '@utils/formatCurrency';
import { getDeliveryEta, getProductPricing } from '@utils/productPricing';
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
  const { estimatedMinutes, deliveryMessage: etaLabel } = useDeliveryEta({ autoFetch: false });

  const variants = product?.productVariants ?? [];
  const showVariants = product ? sheetShowsVariantPicker(product) : false;
  const selected = showVariants
    ? (variants.find((v) => v.id === selectedVariantId) ?? variants[0])
    : (variants.find((v) => v.id === selectedVariantId) ?? variants[0] ?? null);
  const pricing = product ? getProductPricing(product, selected) : null;
  const minOrder = product ? getMinOrderQuantity(product) : 1;
  const deliveryEta = product
    ? getDeliveryEta(product, estimatedMinutes, etaLabel)
    : null;
  const showBrand = product ? isVisibleProductBrand(product.brand) : false;

  const unitPrice = pricing?.sellingPrice ?? 0;
  const subtotal = unitPrice * quantity;
  const subtotalScale = useSharedValue(1);

  const imageSource = useMemo(() => {
    if (!product) return null;
    return resolveProductImageSource({
      imageUrl: product.imageUrl,
      productSlug: product.slug,
      categorySlug: product.categorySlug,
    });
  }, [product]);

  const subtotalAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: subtotalScale.value }],
  }));

  const handleQuantityChange = useCallback(
    (next: number) => {
      setQuantity(next);
      subtotalScale.value = withSequence(
        withSpring(1.05, { damping: 14, stiffness: 260 }),
        withSpring(1, { damping: 14 }),
      );
    },
    [setQuantity, subtotalScale],
  );

  const handleAdd = useCallback(async () => {
    if (!product) return;
    if (showVariants && (!selected || selected.inStock === false)) return;

    const variantId =
      selected?.id ??
      (getVariantCount(product) === 1 ? product.productVariants?.[0]?.id : undefined);

    await addToCart(product, quantity, variantId ? { variantId } : undefined);
    close();
  }, [addToCart, close, product, quantity, selected, showVariants]);

  if (!product || !pricing) return null;

  const title = showVariants ? 'Select Variant' : 'Add to Cart';
  const outOfStock = showVariants && selected?.inStock === false;
  const canSubmit = !outOfStock && buttonState !== 'loading';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
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
              {showBrand ? (
                <Text style={styles.brand} numberOfLines={1}>
                  {product.brand}
                </Text>
              ) : null}
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
              {deliveryEta ? (
                <Text style={styles.eta} numberOfLines={1}>
                  {deliveryEta}
                </Text>
              ) : null}
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

          {minOrder > 1 ? (
            <Text style={styles.minOrderHint}>
              Minimum order: {minOrder} {pricing.unit}
            </Text>
          ) : null}

          {showVariants ? (
            <>
              <Text style={styles.sectionLabel}>Options</Text>
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
            </>
          ) : null}

          <Text style={styles.sectionLabel}>Quantity</Text>
          <ProductQuantitySelector
            quantity={quantity}
            onChange={handleQuantityChange}
            min={minOrder}
            max={product.maxOrder}
            step={product.incrementStep ?? 1}
            size="lg"
            variant="capsule"
          />

          <Animated.View style={[styles.subtotalRow, subtotalAnimStyle]}>
            <Text style={styles.subtotalLabel}>
              {formatINR(unitPrice, false)} × {quantity}
            </Text>
            <Text style={styles.subtotalValue}>{formatINR(subtotal, false)}</Text>
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Text style={styles.footerHint}>Subtotal</Text>
            <Text style={styles.footerPrice}>{formatINR(subtotal, false)}</Text>
          </View>
          <Pressable
            style={[styles.addBtn, !canSubmit && styles.addBtnDisabled]}
            disabled={!canSubmit}
            onPress={() => void handleAdd()}>
            {buttonState === 'loading' ? (
              <ActivityIndicator color={DARK} />
            ) : (
              <Text style={styles.addBtnText}>Add to Cart</Text>
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
    maxHeight: '85%',
    paddingHorizontal: 16,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 16,
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
    maxHeight: 460,
  },
  summary: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
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
  brand: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
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
  eta: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  bulkBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
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
  minOrderHint: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B6914',
    marginBottom: 12,
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
  subtotalRow: {
    marginTop: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  subtotalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  subtotalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: DARK,
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
  footerLeft: {
    minWidth: 88,
  },
  footerHint: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888',
    marginBottom: 2,
  },
  footerPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: DARK,
  },
  addBtn: {
    flex: 1,
    backgroundColor: GOLD,
    borderRadius: 12,
    minHeight: 52,
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
