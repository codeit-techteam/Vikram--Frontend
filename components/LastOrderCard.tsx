import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { CartItemImage } from '@components/cart/CartItemImage';
import { getCategoryIdForProduct, getProductById } from '@constants/catalogData';
import type { LastOrderedProduct } from '@store/orderStore';
import { useTranslation } from '@store/languageStore';
import { resolveCartProductId } from '@utils/cartHelpers';
import { getTimeAgo } from '@utils/timeAgo';

interface LastOrderCardProps {
  item: LastOrderedProduct;
}

export function LastOrderCard({ item }: LastOrderCardProps) {
  const { t } = useTranslation();
  const timeAgo = getTimeAgo(item.orderedAt);
  const productId = resolveCartProductId(item);
  const product = getProductById(productId);

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

  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        <CartItemImage item={item} style={styles.image} contentFit="cover" />
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>

        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={12} color="#AAA" />
          <Text style={styles.timeText}>
            {t('lastOrdered')} {timeAgo}
          </Text>
        </View>

        <Text style={styles.price}>
          ₹{item.unitPrice.toLocaleString('en-IN')} / {item.unit}
        </Text>
      </View>

      <Pressable onPress={handleViewProduct} style={styles.viewButton}>
        <Ionicons name="eye-outline" size={16} color="#FEB623" />
        <Text style={styles.viewText}>{t('viewProduct')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
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
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#FFF4D1',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: 52,
    height: 52,
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
  viewButton: {
    backgroundColor: '#FFF4D1',
    borderWidth: 1.5,
    borderColor: '#FEB623',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  viewText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FEB623',
  },
});
