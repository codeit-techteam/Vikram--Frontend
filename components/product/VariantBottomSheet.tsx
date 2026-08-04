import { memo, useCallback, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProductImage } from '@components/product/ProductImage';
import { ProductQuantitySelector } from '@components/product/ProductQuantitySelector';
import {
  getVariantCount,
  sheetShowsVariantPicker,
} from '@constants/catalogVariantHelpers';
import { useAddToCart } from '@hooks/useAddToCart';
import { useEtaStore } from '@store/etaStore';
import { useVariantStore } from '@store/variantStore';
import { isVisibleProductBrand } from '@utils/categoryDisplay';
import { formatINR } from '@utils/formatCurrency';
import { getProductPricing } from '@utils/productPricing';
import {
  computeQuantityPricing,
  formatUnitCount,
} from '@utils/quantityPricing';
import { resolveProductImageSource } from '@utils/catalogPlaceholders';

const GOLD = '#FEB623';
const GOLD_SOFT = '#FFF8E8';
const GOLD_BORDER = '#F5D078';
const DARK = '#1A1A1A';
const MUTED = '#6B6B6B';
const HAIRLINE = '#EFEFEF';
const SURFACE = '#F6F6F6';
const GREEN = '#1F8A3B';
const GREEN_SOFT = '#E9F7EE';
const GREEN_BORDER = '#B7E0C2';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = Math.round(SCREEN_HEIGHT * 0.8);
const OPEN_MS = 250;
const CLOSE_MS = 200;

/** UI-only guard: hide nonsensical MRP/discount badges without changing pricing math. */
function shouldShowListPrice(selling: number, original: number, discountPercent: number) {
  if (!(original > selling) || selling <= 0) return false;
  if (discountPercent <= 0 || discountPercent > 70) return false;
  if (original / selling > 4) return false;
  return true;
}

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
  const liveEta = useEtaStore((s) => s.eta?.deliveryETA);

  const variants = product?.productVariants ?? [];
  const showVariants = product ? sheetShowsVariantPicker(product) : false;
  const selected = showVariants
    ? (variants.find((v) => v.id === selectedVariantId) ?? variants[0])
    : (variants.find((v) => v.id === selectedVariantId) ?? variants[0] ?? null);
  const pricing = product ? getProductPricing(product, selected) : null;
  const showBrand = product ? isVisibleProductBrand(product.brand) : false;

  const quote = useMemo(() => {
    if (!product || !pricing) return null;
    return computeQuantityPricing(product, quantity, selected, pricing);
  }, [product, pricing, quantity, selected]);

  const sheetY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const subtotalScale = useSharedValue(1);
  const progressWidth = useSharedValue(0);
  const ctaScale = useSharedValue(1);
  const mounted = useSharedValue(0);

  const finishClose = useCallback(() => {
    close();
  }, [close]);

  useEffect(() => {
    if (visible) {
      mounted.value = 1;
      sheetY.value = SHEET_HEIGHT;
      backdropOpacity.value = 0;
      backdropOpacity.value = withTiming(1, {
        duration: OPEN_MS,
        easing: Easing.out(Easing.cubic),
      });
      // Native spring, no bounce — Blinkit-style sheet entrance
      sheetY.value = withSpring(0, {
        damping: 28,
        stiffness: 320,
        mass: 0.85,
        overshootClamping: true,
      });
    }
  }, [visible, backdropOpacity, sheetY, mounted]);

  useEffect(() => {
    if (!quote) return;
    progressWidth.value = withTiming(quote.progressRatio, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
    });
  }, [quote?.progressRatio, progressWidth, quote]);

  const imageSource = useMemo(() => {
    if (!product) return null;
    return resolveProductImageSource({
      imageUrl: product.imageUrl,
      productSlug: product.slug,
      categorySlug: product.categorySlug,
    });
  }, [product]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }],
  }));

  const subtotalAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: subtotalScale.value }],
  }));

  const progressAnimStyle = useAnimatedStyle(() => ({
    width: `${Math.round(progressWidth.value * 100)}%`,
  }));

  const ctaAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ctaScale.value }],
  }));

  const animateClose = useCallback(() => {
    backdropOpacity.value = withTiming(0, {
      duration: CLOSE_MS,
      easing: Easing.in(Easing.cubic),
    });
    sheetY.value = withTiming(
      SHEET_HEIGHT,
      { duration: CLOSE_MS, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(finishClose)();
      },
    );
  }, [backdropOpacity, sheetY, finishClose]);

  const handleQuantityChange = useCallback(
    (next: number) => {
      setQuantity(Math.max(1, next));
      subtotalScale.value = withSequence(
        withTiming(1.03, { duration: 90 }),
        withTiming(1, { duration: 120 }),
      );
    },
    [setQuantity, subtotalScale],
  );

  const handleSelectVariant = useCallback(
    (id: string) => {
      void Haptics.selectionAsync();
      selectVariant(id);
      subtotalScale.value = withSequence(
        withTiming(1.025, { duration: 90 }),
        withTiming(1, { duration: 120 }),
      );
    },
    [selectVariant, subtotalScale],
  );

  const handleAdd = useCallback(async () => {
    if (!product) return;
    if (showVariants && (!selected || selected.inStock === false)) return;

    ctaScale.value = withSequence(
      withTiming(0.97, { duration: 80 }),
      withSpring(1, { damping: 18, stiffness: 320, overshootClamping: true }),
    );

    const variantId =
      selected?.id ??
      (getVariantCount(product) === 1 ? product.productVariants?.[0]?.id : undefined);

    await addToCart(product, quantity, variantId ? { variantId } : undefined);
    animateClose();
  }, [
    addToCart,
    animateClose,
    ctaScale,
    product,
    quantity,
    selected,
    showVariants,
  ]);

  if (!visible || !product || !pricing || !quote) return null;

  const outOfStock = Boolean(showVariants && selected?.inStock === false);
  const canSubmit = !outOfStock && buttonState !== 'loading';
  const displayUnitPrice = quote.appliedUnitPrice;
  const variantLabel = selected?.label ?? pricing.unit;
  const showListPrice = shouldShowListPrice(
    displayUnitPrice,
    quote.originalUnitPrice,
    pricing.discountPercent,
  );
  const etaLabel =
    liveEta != null
      ? `Delivery in ${liveEta} mins`
      : quote.eta
        ? `Delivery in ${quote.eta}`
        : null;

  const ctaPrimary = outOfStock
    ? 'Out of Stock'
    : showVariants
      ? `Add ${quantity} × ${variantLabel}`
      : `Add ${formatUnitCount(quantity, quote.unit)}`;

  const summaryLine = [
    `${quantity} Qty`,
    variantLabel,
    `${quote.vehicle.shortLabel} Delivery`,
    quote.estimatedWeightKg > 0 ? `${quote.estimatedWeightKg} kg` : null,
  ]
    .filter(Boolean)
    .join('  ·  ');

  const safeBottom = Math.max(insets.bottom, 8);
  const footerSubtotal = formatINR(quote.estimatedTotal, false);

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={animateClose}>
      <View style={styles.root} pointerEvents="box-none">
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={animateClose}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
          />
        </Animated.View>

        <Animated.View style={[styles.sheet, { height: SHEET_HEIGHT }, sheetStyle]}>
          <View style={styles.handle} />

          {/* Fixed header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={styles.title}>
                {showVariants ? 'Select Variant' : 'Add to Cart'}
              </Text>
              <Pressable
                onPress={animateClose}
                hitSlop={12}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Close">
                <Ionicons name="close" size={18} color={DARK} />
              </Pressable>
            </View>

            <View style={styles.productRow}>
              <Animated.View entering={FadeIn.duration(220)}>
                <ProductImage
                  source={imageSource}
                  size={72}
                  padding={8}
                  borderRadius={16}
                  backgroundColor="#FFFFFF"
                  recyclingKey={product.slug || product.id}
                  style={styles.thumb}
                  showShadow
                />
              </Animated.View>
              <View style={styles.productMeta}>
                {showBrand ? (
                  <Text style={styles.brand} numberOfLines={1}>
                    {product.brand}
                  </Text>
                ) : null}
                <Text style={styles.name} numberOfLines={2}>
                  {product.detailName ?? product.name}
                </Text>
                <View style={styles.priceRow}>
                  <Animated.Text style={[styles.unitPrice, subtotalAnimStyle]}>
                    {formatINR(displayUnitPrice, false)}
                    <Text style={styles.unitSuffix}>/{pricing.unit}</Text>
                  </Animated.Text>
                  {showListPrice ? (
                    <Text style={styles.mrp}>{formatINR(quote.originalUnitPrice, false)}</Text>
                  ) : null}
                  {showListPrice ? (
                    <View style={styles.offBadge}>
                      <Text style={styles.off}>{pricing.discountPercent}% OFF</Text>
                    </View>
                  ) : null}
                  {quote.bulkApplied ? (
                    <Animated.View entering={FadeIn.duration(160)} style={styles.bulkAppliedBadge}>
                      <Text style={styles.bulkAppliedBadgeText}>BULK</Text>
                    </Animated.View>
                  ) : null}
                </View>
                {etaLabel ? (
                  <View style={styles.etaBadge}>
                    <Ionicons name="flash" size={11} color={GREEN} />
                    <Text style={styles.etaBadgeText}>{etaLabel}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {/* Scrollable middle */}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
            overScrollMode="never"
            keyboardShouldPersistTaps="handled">
            {showVariants ? (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Choose size</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.variantRow}
                  nestedScrollEnabled
                  bounces={false}>
                  {variants.map((v) => {
                    const selectedChip = v.id === selected?.id;
                    const oos = v.inStock === false;
                    return (
                      <VariantPill
                        key={v.id}
                        label={v.label}
                        price={formatINR(v.price, false)}
                        selected={selectedChip}
                        outOfStock={oos}
                        onPress={() => handleSelectVariant(v.id)}
                      />
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            <View style={styles.section}>
              <View style={styles.qtyRow}>
                <View style={styles.qtyCopy}>
                  <Text style={styles.sectionLabelInline}>Quantity</Text>
                  <Text style={styles.qtyHint}>{pricing.unit}</Text>
                </View>
                <ProductQuantitySelector
                  quantity={quantity}
                  onChange={handleQuantityChange}
                  min={1}
                  max={product.maxOrder}
                  step={product.incrementStep ?? 1}
                  size="lg"
                  variant="capsule"
                />
              </View>
            </View>

            <Animated.View
              key={quote.vehicleType}
              entering={FadeIn.duration(160)}
              style={[styles.section, styles.deliveryCard]}>
              <View style={styles.deliveryIconWrap}>
                <Ionicons name={quote.vehicle.icon} size={22} color={DARK} />
              </View>
              <View style={styles.deliveryTextWrap}>
                <Text style={styles.deliveryMode} numberOfLines={1}>
                  {quote.modeTitle}
                </Text>
                <Text style={styles.deliveryEta} numberOfLines={1}>
                  ETA {quote.eta}
                  {quote.estimatedWeightKg > 0
                    ? `  ·  Est. ${quote.estimatedWeightKg} kg`
                    : ''}
                </Text>
              </View>
              <View style={styles.vehiclePill}>
                <Ionicons name={quote.vehicle.icon} size={12} color={DARK} />
                <Text style={styles.vehiclePillText}>{quote.vehicle.shortLabel}</Text>
              </View>
            </Animated.View>

            {pricing.hasBulk ? (
              <View style={styles.section}>
                {quote.bulkApplied ? (
                  <View style={[styles.bulkCard, styles.bulkCardActive]}>
                    <Text style={styles.bulkCardEyebrow}>Bulk unlocked</Text>
                    <Text style={styles.bulkCardTitle}>
                      Only {formatINR(quote.bulkPrice, false)} / {pricing.unit}
                    </Text>
                    <Text style={styles.bulkCardHint}>
                      You save {formatINR(quote.savePerUnit, false)} per{' '}
                      {pricing.unit.toLowerCase()}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.bulkCard}>
                    <Text style={styles.bulkCardEyebrow}>Bulk Offer</Text>
                    <Text style={styles.bulkCardTitle}>
                      Buy {quote.bulkThreshold}+{' '}
                      {/bag$/i.test(pricing.unit) ? 'Bags' : pricing.unit}
                    </Text>
                    <Text style={styles.bulkCardPrice}>
                      Only {formatINR(quote.bulkPrice, false)} / {pricing.unit}
                    </Text>
                    <Text style={styles.bulkCardHint}>
                      Save {formatINR(quote.savePerUnit, false)} per {pricing.unit.toLowerCase()}
                    </Text>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressCount}>
                        {quantity} / {quote.bulkThreshold}{' '}
                        {/bag$/i.test(pricing.unit) ? 'Bags' : pricing.unit}
                      </Text>
                      <Text style={styles.progressAway}>
                        {quote.bagsToBulk} more to unlock
                      </Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <Animated.View style={[styles.progressFill, progressAnimStyle]} />
                    </View>
                  </View>
                )}
              </View>
            ) : null}

            <View style={[styles.section, styles.breakdownCard]}>
              <Text style={styles.breakdownTitle}>Price summary</Text>
              <BreakdownRow
                label="Base price"
                value={`${formatINR(quote.retailUnitPrice, false)}/${pricing.unit}`}
              />
              <BreakdownRow label="Qty" value={String(quote.quantity)} />
              {quote.retailDiscountAmount > 0 && showListPrice ? (
                <BreakdownRow
                  label="Discount"
                  value={`−${formatINR(quote.retailDiscountAmount, false)}`}
                  valueStyle={styles.savingsValue}
                />
              ) : null}
              {quote.bulkApplied && quote.bulkDiscountAmount > 0 ? (
                <BreakdownRow
                  label="Bulk discount"
                  value={`−${formatINR(quote.bulkDiscountAmount, false)}`}
                  valueStyle={styles.savingsValue}
                />
              ) : null}
              <BreakdownRow
                label={`GST (${quote.gstRate}%)`}
                value={formatINR(quote.gstAmount, false)}
              />
              <BreakdownRow
                label="Delivery"
                value="Included"
                valueStyle={styles.deliveryIncluded}
              />
              <View style={styles.breakdownDivider} />
              <BreakdownRow
                label="Grand Total"
                value={formatINR(quote.estimatedTotal, false)}
                bold
              />
            </View>

            <Text style={styles.summaryLine} numberOfLines={2}>
              {summaryLine}
            </Text>
          </ScrollView>

          {/* Sticky CTA — flush to bottom safe area */}
          <View style={[styles.footer, { paddingBottom: safeBottom }]}>
            <View style={styles.footerLeft}>
              <Text style={styles.footerHint}>Subtotal</Text>
              <Animated.Text style={[styles.footerPrice, subtotalAnimStyle]}>
                {footerSubtotal}
              </Animated.Text>
            </View>
            <Animated.View style={[styles.addBtnWrap, ctaAnimStyle]}>
              <Pressable
                style={[styles.addBtn, !canSubmit && styles.addBtnDisabled]}
                disabled={!canSubmit}
                onPress={() => void handleAdd()}
                accessibilityRole="button"
                accessibilityLabel={ctaPrimary}
                accessibilityState={{ disabled: !canSubmit }}>
                {buttonState === 'loading' ? (
                  <ActivityIndicator color={DARK} />
                ) : (
                  <View style={styles.addBtnContent}>
                    <Text style={styles.addBtnText} numberOfLines={1}>
                      {ctaPrimary}
                    </Text>
                    {!outOfStock ? (
                      <Text style={styles.addBtnPrice} numberOfLines={1}>
                        {formatINR(quote.subtotalBeforeGst, false)}
                      </Text>
                    ) : null}
                  </View>
                )}
              </Pressable>
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const VariantPill = memo(function VariantPill({
  label,
  price,
  selected,
  outOfStock,
  onPress,
}: {
  label: string;
  price: string;
  selected: boolean;
  outOfStock: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withTiming(selected ? 1.02 : 1, { duration: 140 });
  }, [selected, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        disabled={outOfStock}
        onPress={onPress}
        style={[
          styles.pill,
          selected && styles.pillSelected,
          outOfStock && styles.pillOos,
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected, disabled: outOfStock }}
        accessibilityLabel={`${label}, ${price}`}>
        <Text
          style={[
            styles.pillLabel,
            selected && styles.pillLabelSelected,
            outOfStock && styles.pillLabelOos,
          ]}>
          {label}
        </Text>
        {outOfStock ? (
          <Text style={styles.oosText}>Out of stock</Text>
        ) : (
          <Text style={[styles.pillPrice, selected && styles.pillPriceSelected]}>{price}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
});

const BreakdownRow = memo(function BreakdownRow({
  label,
  value,
  bold,
  valueStyle,
}: {
  label: string;
  value: string;
  bold?: boolean;
  valueStyle?: object;
}) {
  return (
    <View style={styles.breakdownRow}>
      <Text style={[styles.breakdownLabel, bold && styles.breakdownBold]}>{label}</Text>
      <Text style={[styles.breakdownValue, bold && styles.breakdownBold, valueStyle]}>
        {value}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 24,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D6D6D6',
    marginTop: 8,
    marginBottom: 4,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: HAIRLINE,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: DARK,
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  thumb: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
  },
  productMeta: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  brand: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A8A8A',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: DARK,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  unitPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: DARK,
    letterSpacing: -0.3,
  },
  unitSuffix: {
    fontSize: 13,
    fontWeight: '600',
    color: MUTED,
  },
  mrp: {
    fontSize: 13,
    color: '#9A9A9A',
    textDecorationLine: 'line-through',
  },
  offBadge: {
    backgroundColor: GREEN_SOFT,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  off: {
    fontSize: 11,
    fontWeight: '800',
    color: GREEN,
  },
  bulkAppliedBadge: {
    backgroundColor: GREEN,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  bulkAppliedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  etaBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    backgroundColor: GREEN_SOFT,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  etaBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: GREEN,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  section: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: DARK,
    marginBottom: 10,
  },
  sectionLabelInline: {
    fontSize: 14,
    fontWeight: '800',
    color: DARK,
  },
  qtyCopy: {
    flexShrink: 1,
  },
  qtyHint: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: SURFACE,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  variantRow: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 4,
  },
  pill: {
    minWidth: 86,
    minHeight: 54,
    borderWidth: 1.5,
    borderColor: '#E2E2E2',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  pillSelected: {
    borderColor: GOLD,
    backgroundColor: GOLD_SOFT,
    borderWidth: 2,
  },
  pillOos: {
    opacity: 0.45,
    backgroundColor: SURFACE,
  },
  pillLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: DARK,
  },
  pillLabelSelected: {
    fontWeight: '800',
  },
  pillLabelOos: {
    color: '#999',
  },
  pillPrice: {
    marginTop: 3,
    fontSize: 12,
    color: MUTED,
    fontWeight: '600',
  },
  pillPriceSelected: {
    color: DARK,
    fontWeight: '800',
  },
  oosText: {
    marginTop: 3,
    fontSize: 10,
    color: '#999',
    fontWeight: '600',
  },
  deliveryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    backgroundColor: GOLD_SOFT,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  deliveryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  deliveryMode: {
    fontSize: 14,
    fontWeight: '800',
    color: DARK,
  },
  deliveryEta: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
  },
  vehiclePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: GOLD,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  vehiclePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: DARK,
  },
  bulkCard: {
    backgroundColor: GREEN_SOFT,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: GREEN_BORDER,
    padding: 14,
  },
  bulkCardActive: {
    backgroundColor: '#D8F0DE',
    borderColor: GREEN,
  },
  bulkCardEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: GREEN,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  bulkCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: DARK,
  },
  bulkCardPrice: {
    marginTop: 2,
    fontSize: 17,
    fontWeight: '800',
    color: GREEN,
    letterSpacing: -0.3,
  },
  bulkCardHint: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '600',
    color: '#1B5E20',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
    gap: 8,
  },
  progressCount: {
    fontSize: 12,
    fontWeight: '800',
    color: DARK,
  },
  progressAway: {
    flex: 1,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: '600',
    color: MUTED,
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(31,138,59,0.15)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: GOLD,
  },
  breakdownCard: {
    borderRadius: 14,
    backgroundColor: SURFACE,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  breakdownTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: DARK,
    marginBottom: 6,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
    minHeight: 22,
  },
  breakdownLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
  },
  breakdownValue: {
    fontSize: 12,
    fontWeight: '700',
    color: DARK,
  },
  breakdownBold: {
    fontSize: 16,
    fontWeight: '800',
    color: DARK,
    letterSpacing: -0.2,
  },
  savingsValue: {
    color: GREEN,
  },
  deliveryIncluded: {
    color: GREEN,
    fontWeight: '700',
  },
  breakdownDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E0E0E0',
    marginVertical: 6,
  },
  summaryLine: {
    marginTop: 2,
    marginBottom: 4,
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HAIRLINE,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#FFF',
  },
  footerLeft: {
    width: '28%',
    minWidth: 72,
  },
  footerHint: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888',
    marginBottom: 1,
  },
  footerPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: DARK,
    letterSpacing: -0.4,
  },
  addBtnWrap: {
    flex: 1,
    minWidth: 0,
  },
  addBtn: {
    backgroundColor: GOLD,
    borderRadius: 16,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  addBtnDisabled: {
    opacity: 0.55,
    shadowOpacity: 0,
    elevation: 0,
  },
  addBtnContent: {
    alignItems: 'center',
    gap: 1,
  },
  addBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: DARK,
  },
  addBtnPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: DARK,
    opacity: 0.72,
  },
});

export const VariantBottomSheet = memo(VariantBottomSheetComponent);
