import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { getCategoryIdForProduct, getProductById } from '@constants/catalogData';
import type { LastOrderedProduct } from '@store/orderStore';
import { useTranslation } from '@store/languageStore';
import { getCartItemImageSource } from '@utils/cartHelpers';
import { getTimeAgo } from '@utils/timeAgo';
import type { ProductCategoryType } from '@/types/catalog';

const CATEGORY_ICONS: Record<ProductCategoryType, keyof typeof Ionicons.glyphMap> = {
  cement: 'cube-outline',
  steel: 'layers-outline',
  sand: 'hourglass-outline',
  bricks: 'grid-outline',
  stone: 'diamond-outline',
};

interface LastOrderCardProps {
  item: LastOrderedProduct;
}

export function LastOrderCard({ item }: LastOrderCardProps) {
  const { t } = useTranslation();
  const timeAgo = getTimeAgo(item.orderedAt);
  const product = getProductById(item.id);
  const categoryType = product?.categoryType;
  const categoryIcon = categoryType ? CATEGORY_ICONS[categoryType] : 'cube-outline';
  const imageSource = getCartItemImageSource(item);

  const handleViewProduct = async () => {
    await Haptics.selectionAsync();
    router.push({
      pathname: '/products/detail/[productId]',
      params: {
        productId: item.id,
        categoryId: getCategoryIdForProduct(item.id) ?? '',
        categoryName: product?.category ?? categoryType ?? '',
        productName: product?.detailName ?? product?.name ?? item.name,
      },
    } as Href);
  };

  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        {item.image || product?.image ? (
          <Image source={imageSource} style={styles.image} contentFit="cover" />
        ) : (
          <Ionicons name={categoryIcon} size={24} color="#FEB623" />
        )}
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
