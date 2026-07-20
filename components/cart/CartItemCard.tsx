import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useTranslation } from '@store/languageStore';
import { CartItemImage } from '@components/cart/CartItemImage';
import { ProductUnit } from '@components/product/ProductUnit';
import {
  getEffectivePrice,
  getLineTotal,
  type CartItem,
} from '@store/cartStore';

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onSaveForLater: (id: string) => void;
}

export function CartItemCard({
  item,
  onUpdateQuantity,
  onRemove,
  onSaveForLater,
}: CartItemCardProps) {
  const { t } = useTranslation();
  const qtyOpacity = useSharedValue(1);
  const unitPrice = getEffectivePrice(item);
  const lineTotal = getLineTotal(item);

  const qtyAnimStyle = useAnimatedStyle(() => ({ opacity: qtyOpacity.value }));

  const changeQty = async (delta: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    qtyOpacity.value = withSequence(withTiming(0, { duration: 80 }), withTiming(1, { duration: 150 }));
    onUpdateQuantity(item.id, item.quantity + delta);
  };

  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        <CartItemImage item={item} style={styles.image} contentFit="cover" />
        <Pressable onPress={() => onRemove(item.id)} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={18} color="#666" />
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.name}>{item.name}</Text>
        {item.variantLabel ? (
          <View style={styles.variantRow}>
            <Text style={styles.variantLabel}>Variant</Text>
            <Text style={styles.variantValue}>{item.variantLabel}</Text>
          </View>
        ) : null}
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.price}>
          ₹{unitPrice.toLocaleString('en-IN')}
          <ProductUnit unit={item.unit} variant="price" />
        </Text>

        <View style={styles.controlsRow}>
          <View style={styles.qtyControls}>
            <Pressable onPress={() => changeQty(-1)} style={styles.qtyButton}>
              <Text style={styles.qtySymbol}>−</Text>
            </Pressable>
            <Animated.Text style={[styles.qtyValue, qtyAnimStyle]}>{item.quantity}</Animated.Text>
            <Pressable onPress={() => changeQty(1)} style={styles.qtyButton}>
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

        <Pressable onPress={() => onSaveForLater(item.id)} style={styles.saveLater}>
          <Ionicons name="bookmark-outline" size={14} color="#FEB623" />
          <Text style={styles.saveLaterText}>{t('saveForLater')}</Text>
        </Pressable>
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
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  imageWrap: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 160,
  },
  deleteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 6,
  },
  content: {
    padding: 14,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    backgroundColor: '#FFF8E8',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  variantLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
  },
  variantValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  description: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
    marginBottom: 8,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FEB623',
    marginBottom: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  qtyButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  qtySymbol: {
    fontSize: 18,
    color: '#1A1A1A',
    fontWeight: '300',
  },
  qtyValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    paddingHorizontal: 8,
    minWidth: 32,
    textAlign: 'center',
  },
  subtotalWrap: {
    alignItems: 'flex-end',
  },
  subtotalLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  subtotalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  saveLater: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  saveLaterText: {
    fontSize: 13,
    color: '#FEB623',
    fontWeight: '500',
  },
});
