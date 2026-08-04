import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { CartItemImage } from '@components/cart/CartItemImage';
import { ProductUnit } from '@components/product/ProductUnit';
import {
  getEffectivePrice,
  getLineTotal,
  type CartItem,
} from '@store/cartStore';

const GOLD = '#FEB623';
const DARK = '#1A1A1A';
const THUMB = 88;

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}

export function CartItemCard({
  item,
  onUpdateQuantity,
  onRemove,
}: CartItemCardProps) {
  const qtyOpacity = useSharedValue(1);
  const unitPrice = getEffectivePrice(item);
  const lineTotal = getLineTotal(item);

  const qtyAnimStyle = useAnimatedStyle(() => ({ opacity: qtyOpacity.value }));

  const changeQty = async (delta: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    qtyOpacity.value = withSequence(
      withTiming(0.35, { duration: 70 }),
      withTiming(1, { duration: 140 }),
    );
    onUpdateQuantity(item.id, item.quantity + delta);
  };

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <CartItemImage
          item={item}
          size={THUMB}
          padding={10}
          borderRadius={12}
          style={styles.thumb}
        />

        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={styles.name} numberOfLines={2}>
              {item.name}
            </Text>
            <Pressable
              onPress={() => onRemove(item.id)}
              hitSlop={10}
              style={styles.deleteButton}
              accessibilityRole="button"
              accessibilityLabel="Remove item">
              <Ionicons name="trash-outline" size={16} color="#888" />
            </Pressable>
          </View>

          {item.variantLabel ? (
            <View style={styles.variantRow}>
              <Text style={styles.variantValue}>{item.variantLabel}</Text>
            </View>
          ) : null}

          {item.description ? (
            <Text style={styles.description} numberOfLines={1}>
              {item.description}
            </Text>
          ) : null}

          <Text style={styles.price}>
            ₹{unitPrice.toLocaleString('en-IN')}
            <ProductUnit unit={item.unit} variant="price" />
          </Text>

          <View style={styles.controlsRow}>
            <View style={styles.qtyControls}>
              <Pressable onPress={() => changeQty(-1)} style={styles.qtyButton} hitSlop={4}>
                <Text style={styles.qtySymbol}>−</Text>
              </Pressable>
              <Animated.Text style={[styles.qtyValue, qtyAnimStyle]}>
                {item.quantity}
              </Animated.Text>
              <Pressable onPress={() => changeQty(1)} style={styles.qtyButton} hitSlop={4}>
                <Text style={styles.qtySymbol}>+</Text>
              </Pressable>
            </View>

            <View style={styles.subtotalWrap}>
              <Text style={styles.subtotalLabel}>
                <ProductUnit unit={item.unit} quantity={item.quantity} variant="qty" />
              </Text>
              <Text style={styles.subtotalValue}>₹{lineTotal.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#F0F0F0',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  thumb: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#EEEEEE',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
    lineHeight: 20,
  },
  deleteButton: {
    padding: 4,
    marginTop: -2,
  },
  variantRow: {
    marginTop: 6,
    backgroundColor: '#FFF8E8',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  variantValue: {
    fontSize: 11,
    fontWeight: '700',
    color: DARK,
  },
  description: {
    marginTop: 4,
    fontSize: 12,
    color: '#888',
    lineHeight: 16,
  },
  price: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '700',
    color: GOLD,
  },
  controlsRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: GOLD,
    borderRadius: 10,
    backgroundColor: '#FFF',
    overflow: 'hidden',
  },
  qtyButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  qtySymbol: {
    fontSize: 16,
    color: DARK,
    fontWeight: '600',
  },
  qtyValue: {
    fontSize: 14,
    fontWeight: '800',
    color: DARK,
    paddingHorizontal: 6,
    minWidth: 28,
    textAlign: 'center',
  },
  subtotalWrap: {
    alignItems: 'flex-end',
  },
  subtotalLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
  },
  subtotalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: DARK,
    marginTop: 1,
  },
});
