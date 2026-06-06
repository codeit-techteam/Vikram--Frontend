import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Toast } from '@components/Toast';
import { useLoyaltyStore, type ActivityItem, type LoyaltyTier } from '@store/loyaltyStore';
import { safeGoBack } from '@utils/navigation';

const TIER_TITLES: Record<LoyaltyTier, string> = {
  silver: 'Silver Contractor',
  gold: 'Gold Contractor',
  platinum: 'Platinum Contractor',
  diamond: 'Diamond Contractor',
};

interface Reward {
  id: string;
  image: string;
  badge: string | null;
  badgeColor?: string;
  title: string;
  subtitle: string;
  points: number | null;
  pointsLabel: string;
  pointsColor?: string;
  icon: keyof typeof Ionicons.glyphMap;
  isLocked: boolean;
}

const REWARDS: Reward[] = [
  {
    id: 'r1',
    image: 'jcb excavator construction yellow',
    badge: 'Hot Deal',
    badgeColor: '#FF3B30',
    title: 'JCB Rental Voucher',
    subtitle: 'Flat 15% off next booking',
    points: 5000,
    pointsLabel: '5,000 CP',
    icon: 'ticket-outline',
    isLocked: false,
  },
  {
    id: 'r2',
    image: 'credit cards stack dark',
    badge: null,
    title: 'Shell Fuel Card',
    subtitle: '₹2,000 top-up voucher',
    points: 12000,
    pointsLabel: '12,000 CP',
    icon: 'card-outline',
    isLocked: false,
  },
  {
    id: 'r3',
    image: 'construction insurance document',
    badge: null,
    title: 'Site Insurance Plus',
    subtitle: 'Coverage for 3 projects',
    points: null,
    pointsLabel: 'Platinum Only',
    pointsColor: '#FF6B00',
    icon: 'lock-closed-outline',
    isLocked: true,
  },
  {
    id: 'r4',
    image: 'construction equipment tools drills',
    badge: null,
    title: 'Equipment Credits',
    subtitle: '₹10,000 purchase discount',
    points: 35000,
    pointsLabel: '35,000 CP',
    icon: 'construct-outline',
    isLocked: false,
  },
];

type ActivityFilter = 'all' | 'credits' | 'debits';

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
      duration: 1000,
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

function RewardCard({
  reward,
  totalPoints,
  tier,
  onRedeem,
}: {
  reward: Reward;
  totalPoints: number;
  tier: LoyaltyTier;
  onRedeem: (reward: Reward) => void;
}) {
  const [redeeming, setRedeeming] = useState(false);
  const scale = useSharedValue(1);

  const isLocked = reward.isLocked && tier !== 'platinum';
  const canAfford = reward.points != null && totalPoints >= reward.points;
  const canRedeem = !isLocked && (reward.points == null || canAfford);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressRedeem = () => {
    if (isLocked) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      onRedeem(reward);
      return;
    }
    if (reward.points != null && totalPoints < reward.points) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      onRedeem(reward);
      return;
    }

    scale.value = withSequence(
      withSpring(0.96, { damping: 8, stiffness: 300 }),
      withSpring(1.0, { damping: 10 }),
    );
    setRedeeming(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setTimeout(() => {
      onRedeem(reward);
      setRedeeming(false);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1500);
  };

  return (
    <Animated.View style={[{ marginBottom: 14 }, cardAnimStyle]}>
      <View
        style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.07,
          shadowRadius: 8,
          elevation: 3,
          opacity: isLocked ? 0.75 : 1,
        }}>
        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: `https://source.unsplash.com/featured/600x220/?${reward.image}` }}
            style={{ width: '100%', height: 140 }}
            resizeMode="cover"
          />
          {reward.badge && (
            <View
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                backgroundColor: reward.badgeColor,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
              }}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{reward.badge}</Text>
            </View>
          )}
          {isLocked && (
            <View
              style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: 'rgba(0,0,0,0.35)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name="lock-closed" size={32} color="rgba(255,255,255,0.8)" />
            </View>
          )}
        </View>

        <View style={{ padding: 14 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#1A1A1A' }}>{reward.title}</Text>
              <Text style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{reward.subtitle}</Text>
            </View>

            <TouchableOpacity
              onPress={onPressRedeem}
              disabled={redeeming || (!isLocked && reward.points != null && !canAfford)}
              style={{
                backgroundColor: isLocked ? '#F0F0F0' : canRedeem ? '#FFF3E0' : '#F8F8F8',
                width: 36,
                height: 36,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 10,
              }}>
              {redeeming ? (
                <ActivityIndicator size="small" color="#FF6B00" />
              ) : (
                <Ionicons
                  name={isLocked ? 'lock-closed-outline' : 'gift-outline'}
                  size={18}
                  color={isLocked ? '#CCC' : canRedeem ? '#FF6B00' : '#CCC'}
                />
              )}
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 10 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '800',
                color: reward.pointsColor || '#FF6B00',
              }}>
              {reward.pointsLabel}
            </Text>
            {!isLocked && reward.points != null && (
              <Text
                style={{
                  fontSize: 11,
                  color: canAfford ? '#34C759' : '#FF3B30',
                  fontWeight: '600',
                  marginTop: 1,
                }}>
                {canAfford
                  ? '✓ You can redeem this'
                  : `Need ${(reward.points - totalPoints).toLocaleString('en-IN')} more CP`}
              </Text>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

function ActivityRow({ activity }: { activity: ActivityItem }) {
  const isInr = activity.valueType === 'inr';
  const iconBg = isInr ? '#E3F2FD' : activity.isCredit ? '#E8F5E9' : '#FFF3E0';
  const iconColor = isInr ? '#1976D2' : activity.isCredit ? '#34C759' : '#FF6B00';

  const valueColor = isInr
    ? '#FF6B00'
    : activity.isCredit
      ? '#34C759'
      : '#FF3B30';

  const valueText = isInr
    ? `${activity.isCredit ? '+' : ''}₹${Math.abs(activity.points).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `${activity.points >= 0 ? '+' : ''}${activity.points.toLocaleString('en-IN')} CP`;

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
        <Ionicons name={activity.icon as keyof typeof Ionicons.glyphMap} size={18} color={iconColor} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A1A1A' }}>{activity.title}</Text>
        <Text style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{activity.time}</Text>
      </View>

      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 14, fontWeight: '800', color: valueColor }}>{valueText}</Text>
        <View
          style={{
            backgroundColor: activity.status === 'COMPLETED' ? '#E8F5E9' : '#FFF3E0',
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 4,
            marginTop: 3,
          }}>
          <Text
            style={{
              fontSize: 9,
              fontWeight: '700',
              color: activity.status === 'COMPLETED' ? '#34C759' : '#FF6B00',
              letterSpacing: 0.3,
            }}>
            {activity.status}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function LoyaltyWalletScreen() {
  const totalPoints = useLoyaltyStore((s) => s.totalPoints);
  const cashbackEarned = useLoyaltyStore((s) => s.cashbackEarned);
  const tier = useLoyaltyStore((s) => s.tier);
  const progressPercent = useLoyaltyStore((s) => s.progressPercent);
  const spendToNextTier = useLoyaltyStore((s) => s.spendToNextTier);
  const totalSpend = useLoyaltyStore((s) => s.totalSpend);
  const nextTier = useLoyaltyStore((s) => s.nextTier);
  const progressTierLabel = useLoyaltyStore((s) => s.progressTierLabel);
  const activityHistory = useLoyaltyStore((s) => s.activityHistory);
  const deductPoints = useLoyaltyStore((s) => s.deductPoints);
  const addActivityHistory = useLoyaltyStore((s) => s.addActivityHistory);
  const downloadStatement = useLoyaltyStore((s) => s.downloadStatement);

  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');

  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withTiming(progressPercent / 100, {
      duration: 1200,
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
    if (activityFilter === 'credits') {
      return activityHistory.filter((a) => a.isCredit);
    }
    if (activityFilter === 'debits') {
      return activityHistory.filter((a) => !a.isCredit);
    }
    return activityHistory;
  }, [activityHistory, activityFilter]);

  const cycleFilter = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActivityFilter((prev) => {
      if (prev === 'all') return 'credits';
      if (prev === 'credits') return 'debits';
      return 'all';
    });
  };

  const handleRedeem = useCallback(
    (reward: Reward) => {
      const isLocked = reward.isLocked && tier !== 'platinum';

      if (isLocked) {
        showToast('Upgrade to Platinum to unlock');
        return;
      }
      if (reward.points != null && totalPoints < reward.points) {
        showToast(`Need ${(reward.points - totalPoints).toLocaleString('en-IN')} more CP`);
        return;
      }

      if (reward.points != null) {
        deductPoints(reward.points);
      }
      addActivityHistory({
        id: Date.now().toString(),
        icon: 'gift-outline',
        title: `${reward.title} Redeemed`,
        time: 'Just now',
        points: reward.points != null ? -reward.points : 0,
        status: 'PENDING',
        isCredit: false,
        valueType: 'cp',
      });
      showToast('Reward redeemed! Check your email.');
    },
    [tier, totalPoints, deductPoints, addActivityHistory, showToast],
  );

  const onDownloadStatement = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await downloadStatement();
      showToast('Statement ready to share');
    } catch {
      showToast('Could not generate statement');
    }
  };

  const tierTitle = TIER_TITLES[tier];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }} edges={['top']}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#F5F5F5',
        }}>
        <TouchableOpacity onPress={() => safeGoBack('/(tabs)/account')}>
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text
          style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 17,
            fontWeight: '700',
            color: '#FF6B00',
          }}>
          Loyalty Rewards
        </Text>
        <View style={{ width: 22 }} />
      </View>

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
              backgroundColor: 'rgba(255,107,0,0.08)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              right: 40,
              bottom: -40,
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: 'rgba(255,107,0,0.05)',
            }}
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <View
              style={{
                width: 20,
                height: 3,
                borderRadius: 2,
                backgroundColor: '#FF6B00',
              }}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: '#FF6B00',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
              }}>
              Premium Tier
            </Text>
          </View>

          <Text
            style={{
              fontSize: 30,
              fontWeight: '800',
              color: '#FFFFFF',
              lineHeight: 36,
              marginBottom: 24,
              letterSpacing: -0.5,
            }}>
            {tierTitle.split(' ')[0]}
            {'\n'}
            {tierTitle.split(' ').slice(1).join(' ')}
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
                Total Points
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
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#FF6B00' }}>CP</Text>
              </View>
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
                Cashback Earned
              </Text>
              <AnimatedNumber
                value={cashbackEarned}
                prefix="₹"
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
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A1A' }}>Membership Progress</Text>
          <Text style={{ fontSize: 13, color: '#888', marginTop: 2, marginBottom: 14 }}>
            Spend {spendToNextTier} more to reach {nextTier}
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
                  backgroundColor: '#FF6B00',
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 6,
                }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                  {progressTierLabel}
                </Text>
              </View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#FF6B00' }}>
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
                    backgroundColor: '#FF6B00',
                  },
                  progressBarStyle,
                ]}
              />
            </View>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 6,
              }}>
              <Text style={{ fontSize: 12, color: '#888' }}>{totalSpend} Total Spend</Text>
              <TouchableOpacity onPress={() => router.push('/account/tier-benefits' as never)}>
                <Text style={{ fontSize: 12, color: '#FF6B00', fontWeight: '600' }}>
                  {nextTier} Tier →
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/account/tier-benefits' as never)}
            style={{
              borderWidth: 1.5,
              borderColor: '#FF6B00',
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
              marginTop: 6,
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 6,
            }}>
            <Text style={{ color: '#FF6B00', fontSize: 14, fontWeight: '700' }}>View Tier Benefits</Text>
            <Ionicons name="arrow-forward" size={16} color="#FF6B00" />
          </TouchableOpacity>
        </View>

        <View
          style={{
            marginHorizontal: 16,
            marginTop: 14,
            backgroundColor: '#FF6B00',
            borderRadius: 16,
            padding: 18,
            overflow: 'hidden',
          }}>
          <View
            style={{
              position: 'absolute',
              right: -20,
              top: -20,
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: 'rgba(255,255,255,0.1)',
            }}
          />

          <View
            style={{
              alignSelf: 'flex-start',
              backgroundColor: 'rgba(0,0,0,0.25)',
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 6,
              marginBottom: 10,
            }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>
              PRO KNIGHT
            </Text>
          </View>

          <Text
            style={{
              fontSize: 18,
              fontWeight: '800',
              color: '#fff',
              marginBottom: 6,
              lineHeight: 24,
            }}>
            Earn 2x Points on TMT Steel
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 19,
              marginBottom: 16,
            }}>
            Order over 50 metric tons of Tata Tiscon this week to unlock double milestone credits.
          </Text>

          <TouchableOpacity
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push({ pathname: '/products/[categoryId]', params: { categoryId: '2' } });
            }}
            style={{
              backgroundColor: '#fff',
              borderRadius: 10,
              paddingVertical: 11,
              alignItems: 'center',
            }}>
            <Text style={{ color: '#FF6B00', fontSize: 14, fontWeight: '700' }}>Order Now</Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 22, paddingHorizontal: 16 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 14,
            }}>
            <View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A' }}>Redeem Rewards</Text>
              <Text style={{ fontSize: 13, color: '#888', marginTop: 2 }}>
                Premium benefits tailored for your projects
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/account/all-rewards' as never)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Text style={{ fontSize: 13, color: '#FF6B00', fontWeight: '600' }}>View All</Text>
              <Ionicons name="chevron-forward" size={14} color="#FF6B00" />
            </TouchableOpacity>
          </View>

          {REWARDS.map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              totalPoints={totalPoints}
              tier={tier}
              onRedeem={handleRedeem}
            />
          ))}
        </View>

        <View style={{ marginTop: 8, paddingHorizontal: 16 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
            }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#1A1A1A' }}>Activity History</Text>
            <TouchableOpacity onPress={cycleFilter}>
              <Ionicons
                name={activityFilter === 'all' ? 'filter-outline' : 'funnel'}
                size={20}
                color={activityFilter === 'all' ? '#888' : '#FF6B00'}
              />
            </TouchableOpacity>
          </View>

          {filteredActivity.map((activity) => (
            <ActivityRow key={activity.id} activity={activity} />
          ))}

          <TouchableOpacity
            onPress={onDownloadStatement}
            style={{ alignItems: 'center', marginTop: 8, marginBottom: 24 }}>
            <Text style={{ fontSize: 14, color: '#FF6B00', fontWeight: '700' }}>Download Statement</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Toast message={toastMsg} visible={toastVisible} />
    </SafeAreaView>
  );
}
