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

const AUTO_DISMISS_MS = 2500;
const GOLD = '#FEB623';
const DARK = '#1A1A1A';
const GREEN = '#1F8A3B';

/**
 * Compact Blinkit-style floating confirmation (≈100px).
 * Replaces the old large dialog card.
 */
export function AddToCartSuccessToast() {
  const insets = useSafeAreaInsets();
  const feedback = useCartFeedbackStore((s) => s.feedback);
  const clearFeedback = useCartFeedbackStore((s) => s.clearFeedback);
  const enterY = useSharedValue(12);

  useEffect(() => {
    if (!feedback) return;
    enterY.value = withSpring(0, {
      damping: 20,
      stiffness: 280,
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
  const { item, result, totalQuantity, lineTotal, quantityAdded } = outcome;

  const imageSource = getCartItemImageSource(item);
  const isUpdate = result === 'quantity_updated';
  const title = isUpdate ? 'Quantity Updated' : 'Added to Cart';
  const qtyLabel = isUpdate
    ? `Qty ${totalQuantity}`
    : `Qty ${quantityAdded}`;

  // Sit above tab bar (~64) + safe area with a small gap
  const bottomOffset = Math.max(insets.bottom, 8) + 64;

  return (
    <Animated.View
      entering={FadeInDown.duration(220).easing(Easing.out(Easing.cubic))}
      exiting={FadeOutUp.duration(180)}
      style={[styles.container, { bottom: bottomOffset }]}
      pointerEvents="box-none">
      <Animated.View style={[styles.card, cardAnim]}>
        <View style={styles.row}>
          <View style={styles.checkWrap}>
            <Ionicons name="checkmark-circle" size={20} color={GREEN} />
          </View>

          <ProductImage
            source={imageSource}
            size={48}
            padding={6}
            borderRadius={10}
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

          <Pressable
            onPress={() => {
              clearFeedback();
              router.push('/cart');
            }}
            hitSlop={8}
            style={styles.viewCartBtn}
            accessibilityRole="button"
            accessibilityLabel="View Cart">
            <Text style={styles.viewCartText}>View Cart</Text>
            <Ionicons name="chevron-forward" size={14} color={DARK} />
          </Pressable>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={clearFeedback}
            style={styles.continueBtn}
            accessibilityRole="button"
            accessibilityLabel="Continue Shopping">
            <Text style={styles.continueText}>Continue Shopping</Text>
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
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#EEEEEE',
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
    gap: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: GREEN,
    letterSpacing: -0.1,
  },
  name: {
    fontSize: 13,
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
  viewCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: GOLD,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  viewCartText: {
    fontSize: 12,
    fontWeight: '800',
    color: DARK,
  },
  actions: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F0F0F0',
  },
  continueBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  continueText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
  },
});
