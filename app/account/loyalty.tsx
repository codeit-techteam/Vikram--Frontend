import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import { Toast } from '@components/Toast';
import { useLoyaltyStore, type ActivityItem, type LoyaltyTier } from '@store/loyaltyStore';
import { safeGoBack } from '@utils/navigation';

const TIER_TITLES: Record<LoyaltyTier, string> = {
  BRONZE: 'Bronze Contractor',
  SILVER: 'Silver Contractor',
  GOLD: 'Gold Contractor',
  PLATINUM: 'Platinum Contractor',
};

type ActivityFilter = 'all' | 'earned' | 'redeemed';

const TIER_BENEFITS = [
  'Earn 1 point for every ₹100 spent',
  '50 bonus points on your first eligible order',
  'Redeem points on orders ₹500+',
  'Use points directly as a bill deduction',
  'First 3 bike deliveries free',
] as const;

const HOW_POINTS_WORK = [
  {
    step: '1',
    title: 'Shop & Earn',
    body: 'Earn 1 BajriPro Point for every ₹100 spent on eligible order value.',
  },
  {
    step: '2',
    title: 'First Order Bonus',
    body: 'Receive 50 bonus points once on your first eligible completed order.',
  },
  {
    step: '3',
    title: 'Redeem at Checkout',
    body: 'Apply points on orders of ₹500 or more. 100 points = ₹1 off.',
  },
  {
    step: '4',
    title: 'Save on Your Bill',
    body: 'Points are deducted from your payable amount after order confirmation.',
  },
] as const;

function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  style,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  style?: object;
}) {
  const animatedValue = useSharedValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [animatedValue, value]);

  useAnimatedReaction(
    () => Math.floor(animatedValue.value),
    (current) => {
      runOnJS(setDisplay)(current);
    },
  );

  return (
    <Text style={style}>
      {prefix}
      {display.toLocaleString('en-IN')}
      {suffix}
    </Text>
  );
}

function ActivityRow({ activity }: { activity: ActivityItem }) {
  const iconBg = activity.isCredit ? '#E8F5E9' : '#FFEBEE';
  const iconColor = activity.isCredit ? '#34C759' : '#FF3B30';
  const valueColor = activity.isCredit ? '#34C759' : '#FF3B30';
  const valueText = `${activity.points >= 0 ? '+' : ''}${activity.points.toLocaleString('en-IN')} Points`;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
        gap: 12,
      }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Ionicons
          name={activity.icon as keyof typeof Ionicons.glyphMap}
          size={18}
          color={iconColor}
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A1A1A' }}>
          {activity.title}
        </Text>
        {activity.subtitle ? (
          <Text style={{ fontSize: 12, color: '#999', marginTop: 2 }} numberOfLines={1}>
            {activity.subtitle}
          </Text>
        ) : null}
        <Text style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{activity.time}</Text>
      </View>

      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 14, fontWeight: '800', color: valueColor }}>{valueText}</Text>
        <View
          style={{
            backgroundColor: '#E8F5E9',
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 8,
            marginTop: 4,
          }}>
          <Text style={{ fontSize: 9, fontWeight: '800', color: '#2E7D32', letterSpacing: 0.4 }}>
            COMPLETED
          </Text>
        </View>
      </View>
    </View>
  );
}

function TierBenefitsSheet({
  visible,
  tier,
  onClose,
}: {
  visible: boolean;
  tier: LoyaltyTier;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
        onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: '#fff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 36,
          }}>
          <View
            style={{
              alignSelf: 'center',
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#E0E0E0',
              marginBottom: 16,
            }}
          />
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#1A1A1A' }}>
            Your Tier Benefits
          </Text>
          <Text
            style={{
              marginTop: 6,
              alignSelf: 'flex-start',
              backgroundColor: '#FEB623',
              color: '#fff',
              overflow: 'hidden',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 8,
              fontSize: 12,
              fontWeight: '800',
              letterSpacing: 0.6,
            }}>
            {tier}
          </Text>
          <Text style={{ marginTop: 14, marginBottom: 12, color: '#666', fontSize: 14 }}>
            Your BajriPro loyalty benefits
          </Text>

          {TIER_BENEFITS.map((benefit) => (
            <View
              key={benefit}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 10,
                marginBottom: 12,
              }}>
              <Ionicons name="checkmark-circle" size={20} color="#34C759" />
              <Text style={{ flex: 1, fontSize: 14, color: '#1A1A1A', lineHeight: 20 }}>
                {benefit}
              </Text>
            </View>
          ))}

          <TouchableOpacity
            onPress={onClose}
            style={{
              marginTop: 12,
              backgroundColor: '#FEB623',
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: 'center',
            }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Got it</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function LoyaltyScreen() {
  const {
    summary,
    totalPoints,
    availableValue,
    lifetimeRedeemed,
    tier,
    progressPercent,
    pointsToNextTier,
    nextTier,
    progressTierLabel,
    freeBikeDeliveriesRemaining,
    freeBikeDeliveriesUsed,
    freeBikeDeliveriesAllowed,
    activityHistory,
    historyMeta,
    loading,
    historyLoading,
    error,
    refresh,
    loadHistory,
    downloadStatement,
  } = useLoyaltyStore();

  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [benefitsOpen, setBenefitsOpen] = useState(false);

  const progressWidth = useSharedValue(0);

  useEffect(() => {
    void refresh();
    void loadHistory(1);
  }, [refresh, loadHistory]);

  useEffect(() => {
    progressWidth.value = withTiming(Math.min(100, Math.max(0, progressPercent)) / 100, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [progressPercent, progressWidth]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2200);
  }, []);

  const filteredActivity = useMemo(() => {
    if (activityFilter === 'earned') {
      return activityHistory.filter((a) => a.isCredit);
    }
    if (activityFilter === 'redeemed') {
      return activityHistory.filter((a) => !a.isCredit);
    }
    return activityHistory;
  }, [activityHistory, activityFilter]);

  const cycleFilter = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActivityFilter((prev) => {
      if (prev === 'all') return 'earned';
      if (prev === 'earned') return 'redeemed';
      return 'all';
    });
  };

  const filterLabel =
    activityFilter === 'all'
      ? 'All'
      : activityFilter === 'earned'
        ? 'Earned'
        : 'Redeemed';

  const onDownloadStatement = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await downloadStatement();
      showToast('Statement ready to share');
    } catch {
      showToast('Could not generate statement');
    }
  };

  const onRetry = () => {
    void refresh();
    void loadHistory(1);
  };

  const tierTitle = TIER_TITLES[tier] ?? tier;
  const minOrder = summary?.minRedeemOrderValue ?? 500;
  const pointValue = summary?.pointValueInr ?? 0.01;
  const firstBonus = summary?.firstOrderBonus ?? 50;
  const earnRate = summary?.earnPointsPer100Inr ?? 1;

  const deliveryMessage =
    freeBikeDeliveriesRemaining > 0
      ? `${freeBikeDeliveriesRemaining} free bike ${
          freeBikeDeliveriesRemaining === 1 ? 'delivery' : 'deliveries'
        } remaining`
      : 'Free bike delivery benefit used';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }} edges={['top']}>
      <BackHeader
        title="Loyalty Rewards"
        titleColor="#FEB623"
        backgroundColor="#F5F5F5"
        borderBottom={false}
        onBack={() => safeGoBack('/(tabs)/account')}
      />

      {loading && !summary ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#FEB623" />
          <Text style={{ marginTop: 12, color: '#888' }}>Loading BajriPro Points…</Text>
        </View>
      ) : error && !summary ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ color: '#FF3B30', textAlign: 'center', marginBottom: 12 }}>{error}</Text>
          <TouchableOpacity
            onPress={onRetry}
            style={{
              backgroundColor: '#FEB623',
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 12,
            }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}>
          <LinearGradient
            colors={['#1A2340', '#0D1420', '#1A2340']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              marginHorizontal: 16,
              borderRadius: 20,
              padding: 22,
              overflow: 'hidden',
            }}>
            <View
              style={{
                position: 'absolute',
                right: -30,
                top: -30,
                width: 160,
                height: 160,
                borderRadius: 80,
                backgroundColor: 'rgba(254,182,35,0.08)',
              }}
            />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <View
                style={{
                  width: 20,
                  height: 3,
                  borderRadius: 2,
                  backgroundColor: '#FEB623',
                }}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: '#FEB623',
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                }}>
                BajriPro Points
              </Text>
            </View>

            <Text
              style={{
                fontSize: 28,
                fontWeight: '800',
                color: '#FFFFFF',
                lineHeight: 34,
                marginBottom: 20,
                letterSpacing: -0.5,
              }}>
              {tierTitle}
            </Text>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
              }}>
              <View>
                <Text
                  style={{
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.5)',
                    fontWeight: '600',
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                    marginBottom: 2,
                  }}>
                  Available Balance
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                  <AnimatedNumber
                    value={totalPoints}
                    style={{
                      fontSize: 32,
                      fontWeight: '800',
                      color: '#FFFFFF',
                      letterSpacing: -1,
                    }}
                  />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#FEB623' }}>
                    Points
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.65)',
                    marginTop: 4,
                  }}>
                  ≈ ₹
                  {availableValue.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  · Available to redeem
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  style={{
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.5)',
                    fontWeight: '600',
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                    marginBottom: 2,
                  }}>
                  Lifetime Redeemed
                </Text>
                <AnimatedNumber
                  value={lifetimeRedeemed}
                  style={{
                    fontSize: 22,
                    fontWeight: '800',
                    color: '#FFFFFF',
                  }}
                />
              </View>
            </View>
          </LinearGradient>

          <View
            style={{
              marginHorizontal: 16,
              marginTop: 14,
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
              elevation: 2,
            }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A1A' }}>
              Membership Progress
            </Text>
            <Text style={{ fontSize: 13, color: '#888', marginTop: 2, marginBottom: 14 }}>
              {nextTier
                ? `${pointsToNextTier.toLocaleString('en-IN')} points to reach ${nextTier}`
                : 'You are at the top tier'}
            </Text>

            <View style={{ marginBottom: 8 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}>
                <View
                  style={{
                    backgroundColor: '#FEB623',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 6,
                  }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                    {progressTierLabel}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#FEB623' }}>
                  {progressPercent}%
                </Text>
              </View>

              <View
                style={{
                  height: 8,
                  backgroundColor: '#F0F0F0',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}>
                <Animated.View
                  style={[
                    {
                      height: '100%',
                      borderRadius: 4,
                      backgroundColor: '#FEB623',
                    },
                    progressBarStyle,
                  ]}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setBenefitsOpen(true);
              }}
              style={{
                borderWidth: 1.5,
                borderColor: '#FEB623',
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: 'center',
                marginTop: 10,
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 6,
              }}>
              <Text style={{ color: '#FEB623', fontSize: 14, fontWeight: '700' }}>
                View Tier Benefits
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#FEB623" />
            </TouchableOpacity>
          </View>

          <View
            style={{
              marginHorizontal: 16,
              marginTop: 14,
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 16,
            }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 14 }}>
              How BajriPro Points Work
            </Text>
            {HOW_POINTS_WORK.map((item) => (
              <View
                key={item.step}
                style={{
                  flexDirection: 'row',
                  gap: 12,
                  marginBottom: 14,
                }}>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: '#FFF4D1',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text style={{ color: '#FEB623', fontWeight: '800', fontSize: 13 }}>
                    {item.step}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#1A1A1A' }}>
                    {item.title}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#666', marginTop: 2, lineHeight: 18 }}>
                    {item.body
                      .replace('1 BajriPro Point', `${earnRate} BajriPro Point`)
                      .replace('50 bonus', `${firstBonus} bonus`)
                      .replace('₹500', `₹${minOrder}`)
                      .replace('100 points = ₹1', `${Math.round(1 / pointValue)} points = ₹1`)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View
            style={{
              marginHorizontal: 16,
              marginTop: 14,
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: '#F0F0F0',
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Ionicons name="bicycle-outline" size={20} color="#FEB623" />
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A1A' }}>
                Bike Delivery Benefit
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: '#666', lineHeight: 19 }}>
              First {freeBikeDeliveriesAllowed} eligible bike deliveries are FREE.
            </Text>
            <Text
              style={{
                marginTop: 10,
                fontSize: 14,
                fontWeight: '700',
                color: freeBikeDeliveriesRemaining > 0 ? '#34C759' : '#888',
              }}>
              {deliveryMessage}
            </Text>
            <Text style={{ marginTop: 4, fontSize: 12, color: '#999' }}>
              {freeBikeDeliveriesUsed} of {freeBikeDeliveriesAllowed} used
            </Text>
          </View>

          <View style={{ marginTop: 22, paddingHorizontal: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
              }}>
              <View>
                <Text style={{ fontSize: 17, fontWeight: '700', color: '#1A1A1A' }}>
                  Activity History
                </Text>
                <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{filterLabel}</Text>
              </View>
              <TouchableOpacity onPress={cycleFilter} hitSlop={8}>
                <Ionicons
                  name={activityFilter === 'all' ? 'filter-outline' : 'funnel'}
                  size={20}
                  color={activityFilter === 'all' ? '#888' : '#FEB623'}
                />
              </TouchableOpacity>
            </View>

            {historyLoading && filteredActivity.length === 0 ? (
              <ActivityIndicator color="#FEB623" style={{ marginVertical: 24 }} />
            ) : filteredActivity.length === 0 ? (
              <View style={{ paddingVertical: 28, alignItems: 'center' }}>
                <Text style={{ color: '#888', fontSize: 14 }}>No loyalty activity yet</Text>
                <Text style={{ color: '#AAA', fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                  Place an eligible order to start earning BajriPro Points
                </Text>
              </View>
            ) : (
              filteredActivity.map((activity) => (
                <ActivityRow key={activity.id} activity={activity} />
              ))
            )}

            {historyMeta && historyMeta.page < historyMeta.totalPages ? (
              <TouchableOpacity
                onPress={() => void loadHistory(historyMeta.page + 1, true)}
                disabled={historyLoading}
                style={{ alignItems: 'center', marginTop: 12 }}>
                <Text style={{ color: '#FEB623', fontWeight: '700' }}>
                  {historyLoading ? 'Loading…' : 'Load more'}
                </Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              onPress={onDownloadStatement}
              style={{ alignItems: 'center', marginTop: 16, marginBottom: 24 }}>
              <Text style={{ fontSize: 14, color: '#FEB623', fontWeight: '700' }}>
                Download Statement
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      <TierBenefitsSheet
        visible={benefitsOpen}
        tier={tier}
        onClose={() => setBenefitsOpen(false)}
      />
      <Toast message={toastMsg} visible={toastVisible} />
    </SafeAreaView>
  );
}
