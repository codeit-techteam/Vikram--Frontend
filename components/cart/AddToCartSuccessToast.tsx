import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProductImage } from '@components/product/ProductImage';
import { useCartFeedbackStore } from '@store/cartFeedbackStore';
import { getCartItemImageSource } from '@utils/cartHelpers';
import { formatINR } from '@utils/formatCurrency';

const AUTO_DISMISS_MS = 4200;
const GOLD = '#FEB623';
const DARK = '#1A1A1A';
const GREEN = '#1F8A3B';

/**
 * Blinkit-style added-to-cart confirmation: product row + two equal CTAs.
 */
export function AddToCartSuccessToast() {
  const insets = useSafeAreaInsets();
  const feedback = useCartFeedbackStore((s) => s.feedback);
  const clearFeedback = useCartFeedbackStore((s) => s.clearFeedback);
  const enterY = useSharedValue(16);

  useEffect(() => {
    if (!feedback) return;
    enterY.value = withSpring(0, {
      damping: 18,
      stiffness: 260,
      overshootClamping: true,
    });
    const timer = setTimeout(clearFeedback, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [feedback, clearFeedback, enterY]);

  const cardAnim = useAnimatedStyle(() => ({
    transform: [{ translateY: enterY.value }],
  }));

  if (!feedback?.outcome) return null;

  const { outcome } = feedback;
  const { item, result, totalQuantity, lineTotal } = outcome;

  const imageSource = getCartItemImageSource(item);
  const isUpdate = result === 'quantity_updated';
  const title = isUpdate ? 'Quantity updated' : 'Added to cart';
  const qtyLabel = `Qty ${totalQuantity}`;

  const bottomOffset = Math.max(insets.bottom, 8) + 64;

  const goToCart = () => {
    clearFeedback();
    router.push('/cart');
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(240).easing(Easing.out(Easing.cubic))}
      exiting={FadeOutUp.duration(180)}
      style={[styles.container, { bottom: bottomOffset }]}
      pointerEvents="box-none">
      <Animated.View style={[styles.card, cardAnim]}>
        <View style={styles.accent} />

        <View style={styles.row}>
          <View style={styles.checkWrap}>
            <Ionicons name="checkmark-circle" size={22} color={GREEN} />
          </View>

          <ProductImage
            source={imageSource}
            size={52}
            padding={6}
            borderRadius={12}
            backgroundColor="#F7F7F7"
            recyclingKey={item.productId ?? item.id}
            showSkeleton={false}
          />

          <View style={styles.meta}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.name} numberOfLines={1}>
              {item.productName ?? item.name}
            </Text>
            <Text style={styles.subline} numberOfLines={1}>
              {qtyLabel}
              <Text style={styles.dot}> · </Text>
              <Text style={styles.price}>{formatINR(lineTotal, false)}</Text>
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={clearFeedback}
            style={styles.continueBtn}
            accessibilityRole="button"
            accessibilityLabel="Continue Shopping">
            <Text style={styles.continueText}>Continue Shopping</Text>
          </Pressable>
          <Pressable
            onPress={goToCart}
            style={styles.viewCartBtn}
            accessibilityRole="button"
            accessibilityLabel="View Cart">
            <Text style={styles.viewCartText}>View Cart</Text>
            <Ionicons name="chevron-forward" size={15} color={DARK} />
          </Pressable>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 9999,
    elevation: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#EDEDED',
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: GREEN,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkWrap: {
    width: 22,
    alignItems: 'center',
  },
  meta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: GREEN,
    letterSpacing: -0.2,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: DARK,
  },
  subline: {
    marginTop: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
  },
  dot: {
    color: '#CCC',
  },
  price: {
    fontWeight: '800',
    color: DARK,
  },
  actions: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  continueBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E6E6E6',
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    fontSize: 13,
    fontWeight: '800',
    color: DARK,
  },
  viewCartBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: GOLD,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  viewCartText: {
    fontSize: 13,
    fontWeight: '800',
    color: DARK,
  },
});
