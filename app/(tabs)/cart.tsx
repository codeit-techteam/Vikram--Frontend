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

import { BrandLogo } from '@components/BrandLogo';
import { CartItemCard } from '@components/cart/CartItemCard';
import { useCartStore } from '@store/cartStore';
import type { DeliverySite } from '@store/deliveryStore';
import { useDeliveryStore } from '@store/deliveryStore';
import { useNotificationStore } from '@store/notificationStore';
import { safeGoBack } from '@utils/navigation';

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

function CartHeader({ unreadCount }: { unreadCount: number }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={() => safeGoBack()} hitSlop={10}>
        <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
      </Pressable>
      <Text style={styles.headerTitle}>Your Cart</Text>
      <Pressable onPress={() => router.push('/notifications')} hitSlop={10}>
        <View>
          <Ionicons name="notifications-outline" size={22} color="#1A1A1A" />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
}

function BuildProPointsBanner({
  pointsApplied,
  onToggle,
}: {
  pointsApplied: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.pointsBanner}>
      <View style={styles.pointsRow}>
        <View style={styles.pointsLeft}>
          <BrandLogo size="sm" />
          <View>
            <Text style={styles.pointsTitle}>BuildPro Points</Text>
            <Text style={styles.pointsBalance}>Balance: 12,450</Text>
          </View>
        </View>
        <Pressable onPress={onToggle} style={[styles.toggle, pointsApplied && styles.toggleOn]}>
          <View style={[styles.toggleKnob, pointsApplied && styles.toggleKnobOn]} />
        </Pressable>
      </View>
      <Text style={styles.pointsHint}>Use 2,500 points to save ₹500</Text>
    </View>
  );
}

function OrderSummaryCard({
  itemsTotal,
  gst,
  deliveryCharge,
  pointsApplied,
  loyaltyDiscount,
}: {
  itemsTotal: number;
  gst: number;
  deliveryCharge: number;
  pointsApplied: boolean;
  loyaltyDiscount: number;
}) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>Order Summary</Text>
      <SummaryRow label="Items Total" value={`₹${itemsTotal.toLocaleString('en-IN')}`} />
      <SummaryRow label="GST (18%)" value={`₹${gst.toLocaleString('en-IN')}`} />
      <SummaryRow
        label="Delivery Charges"
        value={`₹${deliveryCharge.toLocaleString('en-IN')}`}
        showInfo
      />
      {pointsApplied && (
        <SummaryRow
          label="Loyalty Discount"
          value={`-₹${loyaltyDiscount.toLocaleString('en-IN')}`}
          valueColor="#FF6B00"
        />
      )}
      <View style={styles.summaryDivider} />
    </View>
  );
}

function SiteLogisticsCard({ site }: { site: DeliverySite | undefined }) {
  return (
    <View style={styles.siteCard}>
      <View style={styles.siteIconWrap}>
        <Ionicons name="location-outline" size={18} color="#FF6B00" />
      </View>
      <View style={styles.siteInfo}>
        <Text style={styles.siteName}>
          {site?.name ?? 'Site A – Mumbai North Industrial Estate'}
        </Text>
        <Text style={styles.siteAddress}>{site?.address ?? 'Plot 42, Goregaon West'}</Text>
        <View style={styles.siteEtaRow}>
          <Ionicons name="time-outline" size={12} color="#888" />
          <Text style={styles.siteEta}>ETA: Today, 5:00 PM</Text>
        </View>
      </View>
      <Pressable onPress={() => router.push('/delivery-location')} hitSlop={8}>
        <Text style={styles.siteChange}>Change</Text>
      </Pressable>
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
          <Text style={styles.totalLabel}>Total Price</Text>
          <Text style={styles.totalValue}>₹{grandTotal.toLocaleString('en-IN')}</Text>
        </View>
        {pointsApplied && (
          <View style={styles.savingsPill}>
            <Text style={styles.savingsText}>
              Saving ₹{loyaltyDiscount.toLocaleString('en-IN')}
            </Text>
          </View>
        )}
      </View>

      <Animated.View style={buttonAnimStyle}>
        <Pressable onPress={handlePress} style={styles.checkoutButton}>
          <Text style={styles.checkoutText}>Proceed to Checkout</Text>
          <View style={styles.checkoutIconWrap}>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </View>
        </Pressable>
      </Animated.View>

      <Text style={styles.trustNote}>🔒 Secure checkout · GST Invoice included</Text>
    </View>
  );
}

export default function CartScreen() {
  const items = useCartStore((s) => s.items);
  const pointsApplied = useCartStore((s) => s.pointsApplied);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const saveForLater = useCartStore((s) => s.saveForLater);
  const togglePoints = useCartStore((s) => s.togglePoints);
  const itemsTotal = useCartStore((s) => s.itemsTotal());
  const gst = useCartStore((s) => s.gst());
  const deliveryCharge = useCartStore((s) => s.deliveryCharge());
  const loyaltyDiscount = useCartStore((s) => s.loyaltyDiscount());
  const grandTotal = useCartStore((s) => s.grandTotal());

  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const selectedSite = useDeliveryStore((s) => {
    const site = s.sites.find((x) => x.id === s.selectedSiteId);
    return site ?? s.sites[0];
  });

  const goCheckout = () => {
    if (items.length === 0) return;
    router.push('/checkout');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <CartHeader unreadCount={unreadCount} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces>
          {items.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Active Items ({items.length})</Text>

              {items.map((item) => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                  onSaveForLater={saveForLater}
                />
              ))}

              <BuildProPointsBanner pointsApplied={pointsApplied} onToggle={togglePoints} />

              <OrderSummaryCard
                itemsTotal={itemsTotal}
                gst={gst}
                deliveryCharge={deliveryCharge}
                pointsApplied={pointsApplied}
                loyaltyDiscount={loyaltyDiscount}
              />

              <SiteLogisticsCard site={selectedSite} />
            </>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="cart-outline" size={48} color="#E0E0E0" />
              <Text style={styles.emptyTitle}>Your cart is empty</Text>
              <Pressable
                onPress={() => router.push('/(tabs)/catalog')}
                style={styles.browseButton}>
                <Text style={styles.browseButtonText}>Browse Catalog</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>

        {items.length > 0 && (
          <CheckoutBar
            grandTotal={grandTotal}
            pointsApplied={pointsApplied}
            loyaltyDiscount={loyaltyDiscount}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF6B00',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
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
    backgroundColor: '#FF6B00',
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
    color: '#FFFFFF',
  },
  pointsBalance: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
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
    backgroundColor: '#FF6B00',
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
    backgroundColor: '#FFF3E0',
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
    color: '#FF6B00',
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
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  savingsText: {
    fontSize: 11,
    color: '#FF6B00',
    fontWeight: '700',
  },
  checkoutButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  checkoutText: {
    color: '#FFFFFF',
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
  browseButton: {
    marginTop: 16,
    backgroundColor: '#FF6B00',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
