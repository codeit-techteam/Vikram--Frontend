import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import { NotificationBell } from '@components/HeaderIcons';
import { BrandLogo } from '@components/BrandLogo';
import { CartItemCard } from '@components/cart/CartItemCard';
import { useLanguageStore, useTranslation } from '@store/languageStore';
import { useCartStore } from '@store/cartStore';
import { useLoyaltyStore } from '@store/loyaltyStore';
import { requireAuthOr } from '@utils/requireAuth';
import { useEffect, useMemo } from 'react';
import {
  calculateLoyaltyDiscountPreview,
  formatPointsInr,
} from '@utils/loyaltyPricing';

function SummaryRow({
  label,
  value,
  valueColor,
  showInfo,
}: {
  label: string;
  value: string;
  valueColor?: string;
  showInfo?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryLabelRow}>
        <Text style={styles.summaryKey}>{label}</Text>
        {showInfo ? (
          <Ionicons name="information-circle-outline" size={14} color="#999" />
        ) : null}
      </View>
      <Text style={[styles.summaryValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

function CartScreenHeader() {
  const { t } = useTranslation();

  return (
    <BackHeader
      title={t('yourCart')}
      rightElement={<NotificationBell />}
    />
  );
}

function BajriProPointsBanner({
  pointsApplied,
  onToggle,
  availablePoints,
  availableValue,
  itemsTotal,
  minOrderValue = 500,
  redeemablePoints = 0,
  discountAmount = 0,
}: {
  pointsApplied: boolean;
  onToggle: () => void;
  availablePoints: number;
  availableValue: number;
  itemsTotal: number;
  minOrderValue?: number;
  redeemablePoints?: number;
  discountAmount?: number;
}) {
  const { t } = useTranslation();
  const eligible = itemsTotal >= minOrderValue;
  const zeroBalance = availablePoints <= 0;
  const disabled = !eligible || zeroBalance;
  const shortfall = Math.max(0, minOrderValue - itemsTotal);

  let hint: string;
  if (zeroBalance) {
    hint = 'Earn 1% cashback as BajriPro Points on eligible orders';
  } else if (!eligible) {
    hint = `Add ₹${shortfall.toLocaleString('en-IN')} more to use BajriPro Points`;
  } else if (pointsApplied && discountAmount > 0) {
    hint = `✓ ${redeemablePoints.toLocaleString('en-IN')} BajriPro Points applied · You saved ₹${formatPointsInr(discountAmount)}`;
  } else {
    hint = 'Apply BajriPro Points at checkout (orders ₹500+)';
  }

  return (
    <View style={[styles.pointsBanner, disabled && { opacity: 0.85 }]}>
      <View style={styles.pointsRow}>
        <View style={styles.pointsLeft}>
          <BrandLogo size="sm" />
          <View>
            <Text style={styles.pointsTitle}>BajriPro Points</Text>
            <Text style={styles.pointsBalance}>
              {t('balance')}: {availablePoints.toLocaleString('en-IN')} Points
            </Text>
            <Text style={{ fontSize: 11, color: '#8A6A00', marginTop: 2 }}>
              ≈ ₹{formatPointsInr(availableValue)}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => {
            if (disabled) return;
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onToggle();
          }}
          disabled={disabled}
          style={[
            styles.toggle,
            pointsApplied && eligible && !zeroBalance && styles.toggleOn,
            disabled && { backgroundColor: '#E8E8E8' },
          ]}>
          <View
            style={[
              styles.toggleKnob,
              pointsApplied && eligible && !zeroBalance && styles.toggleKnobOn,
            ]}
          />
        </Pressable>
      </View>
      <Text style={styles.pointsHint}>{hint}</Text>
    </View>
  );
}

function OrderSummaryCard({
  itemsTotal,
  pointsApplied,
  loyaltyDiscount,
}: {
  itemsTotal: number;
  pointsApplied: boolean;
  loyaltyDiscount: number;
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{t('orderSummary')}</Text>
      <SummaryRow label={t('itemsTotal')} value={`₹${itemsTotal.toLocaleString('en-IN')}`} />
      <SummaryRow
        label={t('deliveryCharges')}
        value={t('atCheckout')}
        showInfo
      />
      <SummaryRow
        label="BajriPro Discount"
        value={
          pointsApplied && loyaltyDiscount > 0
            ? `-₹${formatPointsInr(loyaltyDiscount)}`
            : '-₹0'
        }
        valueColor="#FEB623"
      />
      <View style={styles.summaryDivider} />
    </View>
  );
}

function CheckoutBar({
  grandTotal,
  pointsApplied,
  loyaltyDiscount,
  onCheckout,
}: {
  grandTotal: number;
  pointsApplied: boolean;
  loyaltyDiscount: number;
  onCheckout: () => void;
}) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = async () => {
    scale.value = withSequence(
      withSpring(0.96, { damping: 8, stiffness: 300 }),
      withSpring(1.0, { damping: 10 }),
    );
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onCheckout();
  };

  return (
    <View style={styles.checkoutBar}>
      <View style={styles.checkoutTotalRow}>
        <View>
          <Text style={styles.totalLabel}>{t('totalPrice')}</Text>
          <Text style={styles.totalValue}>
            ₹{formatPointsInr(grandTotal)}
          </Text>
        </View>
        {pointsApplied && loyaltyDiscount > 0 && (
          <View style={styles.savingsPill}>
            <Text style={styles.savingsText}>
              {t('youAreSaving')} ₹{formatPointsInr(loyaltyDiscount)}
            </Text>
          </View>
        )}
      </View>

      <Animated.View style={buttonAnimStyle}>
        <Pressable onPress={handlePress} style={styles.checkoutButton}>
          <Text style={styles.checkoutText}>{t('proceedCheckout')}</Text>
          <View style={styles.checkoutIconWrap}>
            <Ionicons name="arrow-forward" size={16} color="#1A1A1A" />
          </View>
        </Pressable>
      </Animated.View>

      <Text style={styles.trustNote}>🔒 {t('secureCheckout')}</Text>
    </View>
  );
}

export default function CartScreen() {
  const language = useLanguageStore((s) => s.language);
  const { t } = useTranslation();
  const items = useCartStore((s) => s.items);
  const pointsApplied = useCartStore((s) => s.pointsApplied);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const togglePoints = useCartStore((s) => s.togglePoints);
  const itemsTotal = useCartStore((s) => s.itemsTotal());
  const availablePoints = useLoyaltyStore((s) => s.totalPoints);
  const availableValue = useLoyaltyStore((s) => s.availableValue);
  const refreshLoyalty = useLoyaltyStore((s) => s.refresh);
  const minRedeemOrderValue =
    useLoyaltyStore((s) => s.summary?.minRedeemOrderValue) ?? 500;
  const pointValueInr = useLoyaltyStore((s) => s.summary?.pointValueInr) ?? 0.01;
  const maxRedeemPercent =
    useLoyaltyStore((s) => s.summary?.maxOrderRedeemPercent) ?? 0.3;

  const loyaltyPreview = useMemo(
    () =>
      calculateLoyaltyDiscountPreview({
        pointsApplied:
          pointsApplied && itemsTotal >= minRedeemOrderValue && availablePoints > 0,
        availablePoints,
        orderValueInr: itemsTotal,
        minOrderValue: minRedeemOrderValue,
        maxRedeemPercent,
        pointValueInr,
      }),
    [
      pointsApplied,
      itemsTotal,
      availablePoints,
      minRedeemOrderValue,
      maxRedeemPercent,
      pointValueInr,
    ],
  );

  useEffect(() => {
    void refreshLoyalty();
  }, [refreshLoyalty]);

  // Auto-disable cart toggle if order falls below minimum.
  useEffect(() => {
    if (pointsApplied && itemsTotal < minRedeemOrderValue) {
      togglePoints();
    }
  }, [itemsTotal, minRedeemOrderValue, pointsApplied, togglePoints]);

  const goCheckout = () => {
    if (items.length === 0) return;
    if (!requireAuthOr(() => router.push('/checkout'))) return;
    router.push('/checkout');
  };

  const appliedDiscount = loyaltyPreview.discountAmount;
  const appliedPoints = loyaltyPreview.redeemablePoints;
  const displayGrandTotal = Math.max(0, itemsTotal - appliedDiscount);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View key={language} style={styles.container}>
        <CartScreenHeader />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces>
          {items.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>
                {t('activeItems')} ({items.length})
              </Text>

              {items.map((item) => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))}

              <BajriProPointsBanner
                pointsApplied={pointsApplied}
                onToggle={togglePoints}
                availablePoints={availablePoints}
                availableValue={availableValue}
                itemsTotal={itemsTotal}
                minOrderValue={minRedeemOrderValue}
                redeemablePoints={appliedPoints}
                discountAmount={appliedDiscount}
              />

              <OrderSummaryCard
                itemsTotal={itemsTotal}
                pointsApplied={appliedDiscount > 0}
                loyaltyDiscount={appliedDiscount}
              />

              <View style={styles.siteCard}>
                <View style={styles.siteIconWrap}>
                  <Ionicons name="bicycle-outline" size={18} color="#FEB623" />
                </View>
                <View style={styles.siteInfo}>
                  <Text style={styles.siteName}>{t('deliveryCalculatedAtCheckout')}</Text>
                  <Text style={styles.siteAddress}>
                    Address, vehicle, and delivery time are confirmed after you proceed to checkout.
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="cart-outline" size={48} color="#E0E0E0" />
              <Text style={styles.emptyTitle}>{t('emptyCart')}</Text>
              <Text style={styles.emptySubtitle}>{t('emptyCartSubtitle')}</Text>
              <Pressable
                onPress={() => router.push('/(tabs)/catalog')}
                style={styles.browseButton}>
                <Text style={styles.browseButtonText}>{t('browseCatalog')}</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>

        {items.length > 0 && (
          <CheckoutBar
            grandTotal={displayGrandTotal}
            pointsApplied={appliedDiscount > 0}
            loyaltyDiscount={appliedDiscount}
            onCheckout={goCheckout}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pointsBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#FEB623',
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pointsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pointsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  pointsBalance: {
    fontSize: 14,
    color: 'rgba(26,26,26,0.75)',
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.4)',
    padding: 2,
  },
  toggleOn: {
    backgroundColor: '#FFFFFF',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FEB623',
    alignSelf: 'flex-start',
  },
  toggleKnobOn: {
    alignSelf: 'flex-end',
  },
  pointsHint: {
    marginTop: 8,
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  summaryCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryKey: {
    fontSize: 14,
    color: '#555',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginTop: 12,
  },
  siteCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  siteIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF4D1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  siteInfo: {
    flex: 1,
  },
  siteName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  siteAddress: {
    fontSize: 12,
    color: '#888',
    marginTop: 1,
  },
  siteEtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  siteEta: {
    fontSize: 12,
    color: '#888',
  },
  siteChange: {
    fontSize: 12,
    color: '#FEB623',
    fontWeight: '600',
  },
  checkoutBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 20,
  },
  checkoutTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  savingsPill: {
    backgroundColor: '#FFF4D1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  savingsText: {
    fontSize: 11,
    color: '#FEB623',
    fontWeight: '700',
  },
  checkoutButton: {
    backgroundColor: '#FEB623',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#FEB623',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  checkoutText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  checkoutIconWrap: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 8,
    padding: 3,
  },
  trustNote: {
    textAlign: 'center',
    fontSize: 11,
    color: '#999',
    marginTop: 8,
    letterSpacing: 0.1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  browseButton: {
    marginTop: 16,
    backgroundColor: '#FEB623',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  browseButtonText: {
    color: '#1A1A1A',
    fontWeight: '700',
    fontSize: 14,
  },
});
