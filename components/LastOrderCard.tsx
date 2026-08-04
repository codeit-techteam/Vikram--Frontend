import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';

import { CartItemImage } from '@components/cart/CartItemImage';
import { ProductUnit } from '@components/product/ProductUnit';
import { getCategoryIdForProduct, getProductById } from '@constants/catalogData';
import { allowsDirectAddToCart } from '@constants/catalogVariantHelpers';
import type { LastOrderedProduct } from '@store/orderStore';
import { useCartStore } from '@store/cartStore';
import { useTranslation } from '@store/languageStore';
import { productToCartItem, resolveCartProductId } from '@utils/cartHelpers';
import { getTimeAgo } from '@utils/timeAgo';

interface LastOrderCardProps {
  item: LastOrderedProduct;
}

export function LastOrderCard({ item }: LastOrderCardProps) {
  const { t } = useTranslation();
  const timeAgo = getTimeAgo(item.orderedAt);
  const productId = resolveCartProductId(item);
  const product = getProductById(productId);
  const addItem = useCartStore((s) => s.addItem);
  const [isReordering, setIsReordering] = useState(false);

  const canDirectAdd = product ? allowsDirectAddToCart(product) || Boolean(item.variantId) : false;

  const handleViewProduct = async () => {
    await Haptics.selectionAsync();
    router.push({
      pathname: '/products/detail/[productId]',
      params: {
        productId,
        categoryId: getCategoryIdForProduct(productId) ?? '',
        categoryName: product?.category ?? product?.categoryType ?? '',
        productName: product?.detailName ?? product?.name ?? item.productName ?? item.name,
      },
    } as Href);
  };

  const handleReorder = async () => {
    if (isReordering) return;

    if (!product || !canDirectAdd) {
      await handleViewProduct();
      return;
    }

    setIsReordering(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const qty = Math.max(1, item.quantity);
      addItem(productToCartItem(product, qty, { variantId: item.variantId }));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push('/(tabs)/cart');
    } finally {
      setIsReordering(false);
    }
  };

  const orderedDate = item.orderedAt.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        <CartItemImage item={item} style={styles.image} padding={10} />
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>

        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={12} color="#AAA" />
          <Text style={styles.timeText}>
            {t('lastOrdered')} {orderedDate} · {timeAgo}
          </Text>
        </View>

        <Text style={styles.price}>
          ₹{item.unitPrice.toLocaleString('en-IN')}
          <ProductUnit unit={item.unit} variant="price" />
        </Text>

        <View style={styles.actions}>
          <Pressable
            onPress={() => void handleReorder()}
            disabled={isReordering}
            style={[styles.reorderButton, isReordering && styles.reorderButtonDisabled]}
            accessibilityRole="button"
            accessibilityLabel={t('reorder')}>
            {isReordering ? (
              <ActivityIndicator size="small" color="#1A1A1A" />
            ) : (
              <>
                <Ionicons name="refresh-outline" size={14} color="#1A1A1A" />
                <Text style={styles.reorderText}>{t('reorder')}</Text>
              </>
            )}
          </Pressable>

          <Pressable
            onPress={() => void handleViewProduct()}
            style={styles.viewButton}
            accessibilityRole="button"
            accessibilityLabel={t('viewProduct')}>
            <Ionicons name="eye-outline" size={14} color="#FEB623" />
            <Text style={styles.viewText}>{t('viewProduct')}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  imageWrap: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#FFF4D1',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: 56,
    height: 56,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 3,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 12,
    color: '#AAA',
    fontWeight: '500',
  },
  price: {
    fontSize: 13,
    color: '#FEB623',
    fontWeight: '700',
    marginTop: 3,
  },
  actions: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reorderButton: {
    flex: 1,
    backgroundColor: '#FEB623',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minHeight: 36,
  },
  reorderButtonDisabled: {
    opacity: 0.6,
  },
  reorderText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  viewButton: {
    backgroundColor: '#FFF4D1',
    borderWidth: 1.5,
    borderColor: '#FEB623',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 36,
  },
  viewText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FEB623',
  },
});
