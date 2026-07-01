import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCartFeedbackStore } from '@store/cartFeedbackStore';
import { getCartItemImageSource } from '@utils/cartHelpers';
import { formatINR } from '@utils/formatCurrency';

const AUTO_DISMISS_MS = 2800;

export function AddToCartSuccessToast() {
  const insets = useSafeAreaInsets();
  const feedback = useCartFeedbackStore((s) => s.feedback);
  const clearFeedback = useCartFeedbackStore((s) => s.clearFeedback);
  const thumbScale = useSharedValue(0.85);

  useEffect(() => {
    if (!feedback) return;
    thumbScale.value = withSpring(1, { damping: 12, stiffness: 220 });
    const timer = setTimeout(clearFeedback, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [feedback, clearFeedback, thumbScale]);

  const thumbAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: thumbScale.value }],
  }));

  if (!feedback?.outcome) return null;

  const { outcome } = feedback;
  const { item, result, totalQuantity, lineTotal, quantityAdded } = outcome;

  const imageSource = getCartItemImageSource(item);
  const isUpdate = result === 'quantity_updated';
  const title = isUpdate ? 'Quantity Updated' : 'Added to Cart';
  const subtitle = isUpdate
    ? 'Quantity updated in your cart.'
    : 'Successfully added to your cart.';

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18).stiffness(200)}
      exiting={FadeOut.duration(200)}
      style={[styles.container, { bottom: insets.bottom + 16 }]}
      pointerEvents="box-none">
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={22} color="#34C759" />
          </View>
          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={styles.bodyRow}>
          <Animated.View style={[styles.thumbWrap, thumbAnimStyle]}>
            {imageSource ? (
              <Image source={imageSource} style={styles.thumb} contentFit="cover" />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]}>
                <Ionicons name="image-outline" size={22} color="#AAA" />
              </View>
            )}
          </Animated.View>

          <View style={styles.details}>
            <Text style={styles.productName} numberOfLines={2}>
              {item.productName ?? item.name}
            </Text>
            {item.variantLabel ? (
              <Text style={styles.variant}>{item.variantLabel}</Text>
            ) : null}
            <Text style={styles.price}>{formatINR(lineTotal, false)}</Text>
            <Text style={styles.qty}>
              {isUpdate ? `Quantity: ${totalQuantity}` : `Qty added: ${quantityAdded}`}
            </Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={clearFeedback} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>Continue Shopping</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              clearFeedback();
              router.push('/cart');
            }}
            style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>View Cart</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  successIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  bodyRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  thumbWrap: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  variant: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  price: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FEB623',
    marginBottom: 2,
  },
  qty: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    color: '#AAA',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#FEB623',
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1A1A',
  },
});
